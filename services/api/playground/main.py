import asyncio, hashlib, json, secrets, uuid
from urllib.parse import urlparse
from datetime import timedelta
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from sqlalchemy import select, func, text
from playground.models import *
from playground.schemas import *
from playground.auth import context, edit, operate, Context
from playground.db import Session, scope
from playground.demo import DEFAULT_PLAN, advance, make_run, event, settle, publish_report, reviewed_feedback
from playground.storage import store

app=FastAPI(title='Playground control plane',version='0.1.0')
C=Depends(context)
def row(item):
    if item is None: return None
    return {col.name:(value.isoformat() if isinstance(value,datetime) else value) for col in item.__table__.columns if col.name not in ('token_hash',) for value in [getattr(item,col.name)]}
def get(c,cls,id,lock=False):
    try: uuid.UUID(id)
    except ValueError: raise HTTPException(404,'Record not found')
    q=select(cls).where(cls.id==id,cls.tenant_id==c.tenant)
    if lock:q=q.with_for_update()
    item=c.db.scalar(q)
    if not item: raise HTTPException(404,'Record not found')
    return item
def rows(c,cls,**filters):
    q=select(cls).where(cls.tenant_id==c.tenant)
    for key,value in filters.items(): q=q.where(getattr(cls,key)==value)
    return c.db.scalars(q.order_by(cls.created_at)).all()
def audit(c,action,payload): c.db.add(Audit(tenant_id=c.tenant,user_id=c.user,action=action,payload=payload))
def latest(c,cls,project):
    return c.db.scalar(select(cls).where(cls.tenant_id==c.tenant,cls.project_id==project).order_by(cls.version.desc()))
def envelope(item):
    return EventOutput(event_id=item.id,tenant_id=item.tenant_id,run_id=item.run_id,session_id=item.session_id,run_sequence=item.run_sequence,event_type=item.event_type,occurred_at=item.created_at.isoformat(),persisted_at=item.created_at.isoformat(),session_sequence=item.payload.get('session_sequence'),payload=item.payload).model_dump()

@app.get('/health')
def health():
    with Session() as db: db.execute(text('SELECT 1'))
    return {'status':'ok','database':'postgresql','phase':1,'real_execution':'unavailable'}

@app.get('/v1/me')
def me(c:Context=C):
    memberships=c.db.execute(select(Membership,Tenant).join(Tenant,Tenant.id==Membership.tenant_id).where(Membership.user_id==c.user)).all()
    return {'name':c.name,'role':c.role,'tenant_id':c.tenant,'workspaces':[{'id':tenant.id,'name':tenant.name,'mode':tenant.mode,'role':m.role} for m,tenant in memberships]}

@app.get('/v1/demo/plan-template',response_model=PlanInput)
def demo_template(c:Context=C): return DEFAULT_PLAN

@app.get('/v1/memberships')
def members(c:Context=C):
    data=c.db.execute(select(Membership,User).join(User,Membership.user_id==User.id).where(Membership.tenant_id==c.tenant)).all()
    return [{'id':m.id,'name':u.name,'subject':u.subject,'role':m.role} for m,u in data]
@app.post('/v1/memberships')
def grant(body:MemberInput,c:Context=C):
    if c.role not in ('owner','admin'):raise HTTPException(403,'Owner or admin access required to manage membership.')
    user=c.db.scalar(select(User).where(User.subject==body.subject))
    if not user:user=User(subject=body.subject,name=body.name);c.db.add(user);c.db.flush()
    existing=c.db.scalar(select(Membership).where(Membership.user_id==user.id,Membership.tenant_id==c.tenant).with_for_update())
    if existing:
        if existing.role=='owner' and body.role!='owner' and c.db.scalar(select(func.count()).select_from(Membership).where(Membership.tenant_id==c.tenant,Membership.role=='owner'))<=1:raise HTTPException(409,'Keep at least one owner in the workspace.')
        existing.role=body.role
    else:c.db.add(Membership(tenant_id=c.tenant,user_id=user.id,role=body.role))
    audit(c,'membership.granted',{'subject':body.subject,'role':body.role})
    return {'saved':True,'note':'Identity subject must match the configured OIDC issuer. No invitation or email was sent.'}

@app.get('/v1/workspace',response_model=WorkspaceOutput)
def workspace(project_id:str | None=None,c:Context=C):
    projects=rows(c,Project,archived=False)
    project=get(c,Project,project_id) if project_id else (projects[0] if projects else None)
    data={'projects':[row(p) for p in projects],'project':row(project),'brief':None,'messages':[],'plan':None,'runs':[],'studies':[],'reports':[],'sources':[],'builds':[]}
    if project:
        data.update(brief=row(latest(c,Brief,project.id)),plan=row(latest(c,Plan,project.id)),messages=[row(m) for m in rows(c,Message,project_id=project.id)],runs=[row(r) for r in rows(c,Run,project_id=project.id)],studies=[row(s) for s in rows(c,Study,project_id=project.id)],sources=[row(s) for s in rows(c,Source,project_id=project.id)],builds=[row(b) for b in rows(c,Build,project_id=project.id)])
        for run in rows(c,Run,project_id=project.id): data['reports'] += [row(r) for r in rows(c,Report,run_id=run.id)]
    return data

@app.post('/v1/projects',response_model=ProjectOutput,status_code=201)
def create_project(body:ProjectInput,c:Context=C):
    edit(c); project=Project(tenant_id=c.tenant,**body.model_dump(),mode='REAL'); c.db.add(project); c.db.flush(); audit(c,'project.created',{'id':project.id}); return row(project)
@app.patch('/v1/projects/{id}',response_model=ProjectOutput)
def update_project(id:str,body:ProjectInput,c:Context=C):
    edit(c); project=get(c,Project,id)
    for key,value in body.model_dump().items(): setattr(project,key,value)
    audit(c,'project.updated',{'id':id}); return row(project)
@app.delete('/v1/projects/{id}')
def archive_project(id:str,c:Context=C):
    edit(c); project=get(c,Project,id); project.archived=True; audit(c,'project.archived',{'id':id}); return {'state':'ARCHIVED'}
@app.post('/v1/projects/{id}/messages',response_model=list[RecordOutput])
def message(id:str,body:MessageInput,c:Context=C):
    edit(c); project=get(c,Project,id)
    draft=c.db.scalar(select(Message).where(Message.project_id==id,Message.role=='draft'))
    if draft:draft.content=''
    c.db.add(Message(tenant_id=c.tenant,project_id=id,role='user',content=body.content))
    c.db.add(Message(tenant_id=c.tenant,project_id=id,role='assistant',content=('Demo intake · ' if project.mode=='DEMO' else 'Guided intake · ')+ 'What is the current alternative, and which workflow would change your decision? Edit the brief below to capture your answer. Provider-generated intake is unavailable in Phase 1.'))
    c.db.flush(); return [row(m) for m in rows(c,Message,project_id=id)]
@app.put('/v1/projects/{id}/intake-draft')
def intake_draft(id:str,body:DraftInput,c:Context=C):
    edit(c);get(c,Project,id,True)
    draft=c.db.scalar(select(Message).where(Message.project_id==id,Message.role=='draft'))
    if draft:draft.content=body.content
    else:c.db.add(Message(tenant_id=c.tenant,project_id=id,role='draft',content=body.content))
    return {'saved':True}
@app.post('/v1/projects/{id}/briefs',response_model=RecordOutput,status_code=201)
def brief(id:str,body:BriefInput,c:Context=C):
    edit(c); get(c,Project,id,True); previous=latest(c,Brief,id)
    data=body.model_dump(); confirmed=data.pop('confirmed')
    b=Brief(tenant_id=c.tenant,project_id=id,version=(previous.version+1 if previous else 1),confirmed=confirmed,snapshot=data)
    c.db.add(b); c.db.flush(); audit(c,'brief.versioned',{'id':b.id,'confirmed':confirmed}); return row(b)
@app.post('/v1/projects/{id}/plans',response_model=RecordOutput,status_code=201)
def plan(id:str,body:PlanInput,c:Context=C):
    edit(c); project=get(c,Project,id,True); previous=latest(c,Plan,id)
    b=latest(c,Brief,id)
    if body.approved and (not b or not b.confirmed): raise HTTPException(409,'Confirm the brief before approving a plan.')
    if body.approved and not body.authorization: raise HTTPException(409,'Confirm target authorization before approval.')
    if len(set(body.viewports))!=len(body.viewports) or len({t.key for t in body.tasks})!=len(body.tasks): raise HTTPException(422,'Use unique tasks and viewports.')
    if project.mode=='REAL' and body.target:
        target=urlparse(body.target)
        if target.scheme not in ('http','https') or not target.hostname or target.username or target.password:raise HTTPException(422,'Use an HTTP(S) build URL without embedded credentials.')
        build=c.db.scalar(select(Build).where(Build.project_id==id,Build.label==body.build))
        if build and build.url!=body.target:raise HTTPException(409,'Build references are immutable. Use a new reference for a changed target URL.')
        if not build:c.db.add(Build(tenant_id=c.tenant,project_id=id,label=body.build,url=body.target))
    p=Plan(tenant_id=c.tenant,project_id=id,version=(previous.version+1 if previous else 1),approved=body.approved,snapshot=body.model_dump()); c.db.add(p); c.db.flush()
    for persona in body.personas:
        v=Persona(tenant_id=c.tenant,project_id=id,snapshot=persona.model_dump()); c.db.add(v); c.db.flush(); c.db.add(PlanPersona(tenant_id=c.tenant,plan_id=p.id,persona_id=v.id))
    for task in body.tasks:c.db.add(Task(tenant_id=c.tenant,plan_id=p.id,key=task.key,snapshot=task.model_dump()))
    audit(c,'plan.versioned',{'id':p.id,'approved':p.approved}); return row(p)

@app.post('/v1/runs',response_model=RecordOutput,status_code=202)
def launch(body:LaunchInput,idempotency_key:str=Header(min_length=1,max_length=200),c:Context=C):
    edit(c)
    # Serialize only this tenant/request key, including concurrent retries.
    c.db.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key,0))'),{'key':c.tenant+':'+idempotency_key})
    fingerprint=hashlib.sha256(json.dumps(body.model_dump(),sort_keys=True).encode()).hexdigest()
    previous=c.db.scalar(select(Idempotency).where(Idempotency.tenant_id==c.tenant,Idempotency.key==idempotency_key))
    if previous:
        if previous.fingerprint!=fingerprint: raise HTTPException(409,'This request key was used with different content.')
        return row(get(c,Run,previous.run_id))
    project=get(c,Project,body.project_id); plan=get(c,Plan,body.plan_id)
    if plan.project_id!=project.id: raise HTTPException(422,'Plan belongs to another project.')
    if not plan.approved: raise HTTPException(409,'Approve the test plan before launch.')
    if project.stage=='idea' or not plan.snapshot.get('target'): raise HTTPException(409,'Browser testing needs a testable target.')
    if project.mode!='DEMO': raise HTTPException(503,'Real execution is unavailable. Phase 2 requires an authorized browser worker and durable orchestration. No run or charge was created.')
    if any(t['key'] not in ('create-job','application') for t in plan.snapshot['tasks']): raise HTTPException(409,'Demo playback supports only the owned create-job and application fixtures. Restore sample defaults. Custom task execution needs Phase 2.')
    if body.baseline_id:
        baseline=get(c,Run,body.baseline_id)
        if baseline.project_id!=project.id or baseline.state!='COMPLETED': raise HTTPException(409,'Retest needs a completed baseline in this project.')
        if baseline.snapshot['build']==plan.snapshot['build']:raise HTTPException(409,'Retest requires a different immutable build.')
    build=c.db.scalar(select(Build).where(Build.tenant_id==c.tenant,Build.project_id==project.id,Build.label==plan.snapshot['build']))
    if not build:raise HTTPException(409,'Build not found')
    run=make_run(c.db,project,plan,build)
    c.db.add(Idempotency(tenant_id=c.tenant,key=idempotency_key,fingerprint=fingerprint,run_id=run.id))
    if body.baseline_id:c.db.add(Retest(tenant_id=c.tenant,baseline_id=body.baseline_id,retest_id=run.id,conditions={'intentional_changes':'Fixture A → B: save handler and salary label changed','same_plan_except_build':baseline.snapshot['personas']==plan.snapshot['personas'] and baseline.snapshot['tasks']==plan.snapshot['tasks'],'provenance':'DEMO'}))
    audit(c,'run.demo_launched',{'id':run.id}); return row(run)

def snapshot(c,run):
    advance(c.db,run); c.db.flush()
    result=row(run); sessions=[]
    for s in c.db.scalars(select(Journey).where(Journey.run_id==run.id).order_by(Journey.ordinal)):
        data=row(s); data['steps']=[]
        for step in c.db.scalars(select(Step).where(Step.session_id==s.id).order_by(Step.sequence)):
            entry=row(step); entry['artifacts']=[row(a) for a in rows(c,Artifact,step_id=step.id)]; entry['annotations']=[row(a) for a in rows(c,Annotation,step_id=step.id)]; data['steps'].append(entry)
        sessions.append(data)
    findings=[]
    for f in rows(c,Finding,run_id=run.id):
        data=row(f); step=get(c,Step,f.step_id); data['session_id']=step.session_id; data['reviews']=[row(r) for r in rows(c,Review,finding_id=f.id)]; findings.append(data)
    result.update(sessions=sessions,findings=findings,events=[envelope(e) for e in c.db.scalars(select(Event).where(Event.run_id==run.id).order_by(Event.run_sequence.desc()).limit(100)).all()[::-1]],completed=sum(s['state']=='COMPLETED' for s in sessions),total=len(sessions),actual_cents=0)
    return result
@app.get('/v1/runs/{id}',response_model=RunOutput)
def run(id:str,c:Context=C):return snapshot(c,get(c,Run,id,True))
@app.post('/v1/runs/{id}/cancel')
def cancel(id:str,c:Context=C):
    edit(c); run=get(c,Run,id,True)
    if run.state in ('COMPLETED','CANCELED','FAILED'): return {'state':run.state}
    run.cancel_requested_at=now(); event(c.db,run,'run.cancel_requested')
    if run.mode=='DEMO':
        run.state='CANCELED'
        for s in rows(c,Journey,run_id=id):
            if s.state!='COMPLETED':s.state='CANCELED'; s.outcome='UNKNOWN'; s.failure_reason='POLICY'
        settle(c.db,run); event(c.db,run,'run.canceled',{'mode':'DEMO'})
    audit(c,'run.cancel_requested',{'id':id});return {'state':run.state}
@app.get('/v1/runs/{id}/events',response_model=list[EventOutput])
def history(id:str,after:int=Query(default=0,ge=0),limit:int=Query(default=100,ge=1,le=100),c:Context=C):
    run=get(c,Run,id,True); advance(c.db,run)
    return [envelope(e) for e in c.db.scalars(select(Event).where(Event.run_id==id,Event.run_sequence>after).order_by(Event.run_sequence).limit(limit))]
@app.get('/v1/runs/{id}/stream')
def stream(id:str,after:int=Query(default=0,ge=0),last_event_id:str | None=Header(default=None),c:Context=C):
    get(c,Run,id); tenant=c.tenant
    try:cursor=max(after,int(last_event_id or 0))
    except ValueError:raise HTTPException(422,'Invalid event cursor')
    async def events():
        nonlocal cursor
        for _ in range(30):
            def capture_batch():
                with Session() as db:
                    scope(db,tenant)
                    run=db.scalar(select(Run).where(Run.id==id).with_for_update()); advance(db,run)
                    batch=db.scalars(select(Event).where(Event.run_id==id,Event.run_sequence>cursor).order_by(Event.run_sequence).limit(100)).all()
                    payloads=[envelope(e) for e in batch];db.commit()
                    return payloads
            # Never block the ASGI event loop while waiting for a row lock.
            payloads=await asyncio.to_thread(capture_batch)
            for payload in payloads:
                cursor=payload['run_sequence'];yield f'id: {cursor}\nevent: playground\ndata: {json.dumps(payload)}\n\n'
            yield ': heartbeat\n\n';await asyncio.sleep(1)
    return StreamingResponse(events(),media_type='text/event-stream',headers={'Cache-Control':'no-cache','X-Accel-Buffering':'no'})
@app.get('/v1/runs/{id}/findings',response_model=list[RecordOutput])
def findings(id:str,c:Context=C):get(c,Run,id);return [row(f) for f in rows(c,Finding,run_id=id)]
@app.post('/v1/findings/{id}/reviews',response_model=RecordOutput)
def review(id:str,body:ReviewInput,c:Context=C):
    edit(c); get(c,Finding,id); r=Review(tenant_id=c.tenant,finding_id=id,user_id=c.user,**body.model_dump()); c.db.add(r);c.db.flush();return row(r)
@app.post('/v1/steps/{id}/annotations',response_model=RecordOutput)
def note(id:str,body:NoteInput,c:Context=C):
    edit(c);get(c,Step,id);r=Annotation(tenant_id=c.tenant,step_id=id,user_id=c.user,note=body.note);c.db.add(r);c.db.flush();return row(r)
@app.get('/v1/artifacts/{id}/access')
def artifact(id:str,c:Context=C):
    a=get(c,Artifact,id)
    if not store.configured:raise HTTPException(503,store.reason)
    if a.state!='READY':raise HTTPException(410 if a.state=='DELETED' else 409,f'Evidence {a.state.lower()}; the finding remains available.')
    if a.expires_at and a.expires_at<now():raise HTTPException(410,'Evidence expired under retention policy.')
    if not store.exists(a.object_key):raise HTTPException(410,'Evidence file unavailable. Its metadata is preserved.')
    value=store.access(a.object_key)
    if isinstance(value,Path) and a.checksum and hashlib.sha256(value.read_bytes()).hexdigest()!=a.checksum:raise HTTPException(410,'Evidence integrity mismatch. The original metadata and finding are retained; this file cannot substitute for the recorded frame.')
    return FileResponse(value,media_type=a.content_type,headers={'Cache-Control':'private, no-store'}) if isinstance(value,Path) else RedirectResponse(value)
@app.delete('/v1/artifacts/{id}')
def delete_artifact(id:str,c:Context=C):
    operate(c);a=get(c,Artifact,id);a.state='DELETED';audit(c,'artifact.access_removed',{'id':id});return {'state':'DELETED','note':'Access removed; physical purge is an operator retention task.'}
@app.get('/v1/runs/{id}/comparison')
def comparison(id:str,c:Context=C):
    new=get(c,Run,id,True);advance(c.db,new)
    link=c.db.scalar(select(Retest).where(Retest.retest_id==id))
    if not link:raise HTTPException(404,'This run has no baseline.')
    baseline=get(c,Run,link.baseline_id);items=[]
    for finding in rows(c,Finding,run_id=baseline.id):
        step=get(c,Step,finding.step_id);old=get(c,Journey,step.session_id)
        match=c.db.scalar(select(Journey).where(Journey.run_id==new.id,Journey.task['key'].as_string()==old.task['key'],Journey.viewport==old.viewport,Journey.persona['name'].as_string()==old.persona['name']))
        label='UNTESTED'
        if match and match.task==old.task and match.persona==old.persona and match.outcome in ('PASS','FAIL') and finding.evidence_type!='AI_HYPOTHESIS':
            has_milestone=c.db.scalar(select(Step).where(Step.session_id==match.id,Step.milestone==step.milestone))
            if has_milestone:label='FIXED_IN_THIS_RETEST' if new.snapshot['build']=='B' else 'PERSISTENT'
        items.append({'finding':row(finding),'status':label,'baseline_session_id':old.id,'retest_session_id':match.id if match else None,'milestone':step.milestone,'provenance':'DEMO comparison; fixture outcomes only'})
    return {'baseline':row(baseline),'retest':row(new),'conditions':link.conditions,'items':items}

@app.post('/v1/studies',response_model=RecordOutput,status_code=201)
def study(body:StudyInput,c:Context=C):
    edit(c);project=get(c,Project,body.project_id);build=get(c,Build,body.build_id)
    if build.project_id!=project.id:raise HTTPException(422,'Build does not belong to project.')
    if body.finding_id:
        finding=get(c,Finding,body.finding_id);run=get(c,Run,finding.run_id)
        if run.project_id!=project.id or run.build_id!=build.id:raise HTTPException(422,'Finding context differs from study build.')
    data=body.model_dump(); data['mode']=project.mode;data['recording']='Unavailable; no recorder configured. Written feedback only.'
    s=Study(tenant_id=c.tenant,project_id=project.id,build_id=build.id,finding_id=body.finding_id,snapshot=data);c.db.add(s);c.db.flush();audit(c,'study.drafted',{'id':s.id});return row(s)
@app.post('/v1/studies/{id}/quote')
def quote(id:str,c:Context=C):
    edit(c);s=get(c,Study,id)
    if s.state not in ('DRAFT','QUOTE_REQUESTED'):raise HTTPException(409,'Quotes apply to unassigned drafts. Preserve the current study status.')
    s.state='QUOTE_REQUESTED';audit(c,'study.quote_requested',{'id':id});return {'state':s.state,'note':'Recorded locally. No recruitment message, payment, or external quote service was invoked.'}

@app.patch('/v1/studies/{id}',response_model=RecordOutput)
def edit_study(id:str,body:StudyInput,c:Context=C):
    edit(c);s=get(c,Study,id,True)
    if c.db.scalar(select(Assignment).where(Assignment.study_id==id)):raise HTTPException(409,'Tasks are frozen after assignment. Create a new study to change its scope.')
    if body.project_id!=s.project_id or body.build_id!=s.build_id or body.finding_id!=s.finding_id:raise HTTPException(409,'Keep the original project, build and finding context; create a new study to change it.')
    s.snapshot={**s.snapshot,**body.model_dump()};audit(c,'study.draft_edited',{'id':id});return row(s)
@app.delete('/v1/studies/{id}')
def cancel_draft_study(id:str,c:Context=C):
    edit(c);s=get(c,Study,id,True)
    if c.db.scalar(select(Assignment).where(Assignment.study_id==id)):raise HTTPException(409,'Assigned studies must retain observations. Revoke access through study operations.')
    s.state='CANCELED';audit(c,'study.draft_canceled',{'id':id});return {'state':s.state,'note':'Draft canceled. Its records are retained.'}
@app.post('/v1/studies/{id}/assignments')
def assign(id:str,body:AssignmentInput,c:Context=C):
    operate(c);s=get(c,Study,id);token=secrets.token_urlsafe(32)
    if s.state in ('CANCELED','REVIEWED'):raise HTTPException(409,'This study is closed to new assignments.')
    a=Assignment(tenant_id=c.tenant,study_id=id,alias=body.alias,token_hash=hashlib.sha256(token.encode()).hexdigest(),expires_at=now()+timedelta(days=7))
    c.db.add(a);c.db.flush();s.state='RECRUITING';audit(c,'participant.screened_and_assigned',{'assignment_id':a.id,'screening_decision':body.screening_decision});return {'id':a.id,'invitation_path':'/participant/'+token,'expires_at':a.expires_at.isoformat(),'note':'Copy manually. The invitation is shown only once.'}
@app.get('/v1/studies/{id}/assignments',response_model=list[RecordOutput])
def assignments(id:str,c:Context=C):
    operate(c);get(c,Study,id);return [row(a) for a in rows(c,Assignment,study_id=id)]
@app.post('/v1/assignments/{id}/revoke')
def revoke(id:str,c:Context=C):
    operate(c);a=get(c,Assignment,id);a.revoked=True;audit(c,'assignment.revoked',{'id':id});return {'revoked':True}

def participant(token):
    db=Session()
    try:
        digest=hashlib.sha256(token.encode()).hexdigest()
        db.execute(text("SELECT set_config('app.invitation_hash', :digest, true)"),{'digest':digest})
        a=db.scalar(select(Assignment).where(Assignment.token_hash==digest).with_for_update())
        if not a or a.revoked or a.expires_at<now():raise HTTPException(403,'Invitation expired, revoked, or invalid.')
        scope(db,a.tenant_id);return db,a
    except:db.close();raise
def neutral(db,a):
    study=db.get(Study,a.study_id);build=db.get(Build,study.build_id)
    return {'assignment_id':a.id,'alias':a.alias,'instructions':study.snapshot['instructions'],'target':build.url,'build':build.label,'mode':study.snapshot['mode'],'consent_at':a.consent_at.isoformat() if a.consent_at else None,'submitted':a.submission is not None,'recording':'No recording takes place. Written feedback is stored for staff review.','consent_version':'written-feedback-v1'}
@app.get('/v1/participant/{token}')
def participant_task(token:str):
    db,a=participant(token)
    try:return neutral(db,a)
    finally:db.rollback();db.close()
@app.post('/v1/participant/{token}/consent')
def consent(token:str):
    db,a=participant(token)
    try:
        if not a.consent_at:a.consent_at=now();a.consent_version='written-feedback-v1'
        data=neutral(db,a);db.commit();return data
    finally:db.close()
@app.post('/v1/participant/{token}/submission')
def submission(token:str,body:SubmissionInput):
    db,a=participant(token)
    try:
        if not a.consent_at:raise HTTPException(409,'Consent is required before submission.')
        if a.submission:raise HTTPException(409,'Submitted observations are immutable.')
        a.submission={**body.model_dump(),'submitted_at':now().isoformat(),'evidence_type':'SELF_REPORTED','recording_backed':False};db.commit();return {'submitted':True}
    finally:db.close()
@app.post('/v1/assignments/{id}/review')
def moderate(id:str,body:ModerationInput,c:Context=C):
    operate(c);a=get(c,Assignment,id,True)
    if not a.submission:raise HTTPException(409,'Independent submission required before review.')
    if a.review:raise HTTPException(409,'Review already frozen.')
    a.review={**body.model_dump(),'reviewed_at':now().isoformat(),'reviewer_id':c.user};s=get(c,Study,a.study_id);s.state='REVIEWED'
    if s.finding_id:
        f=get(c,Finding,s.finding_id);r=get(c,Run,f.run_id,True)
        if r.state=='COMPLETED':
            c.db.flush()
            publish_report(c.db,r,reviewed_feedback(c.db,r))
    audit(c,'submission.reviewed',{'id':id});return {'review':a.review}
@app.get('/v1/settings')
def settings(c:Context=C):
    item=c.db.scalar(select(Settings).where(Settings.tenant_id==c.tenant))
    return {'retention_days':item.retention_days if item else 30,'role':c.role,'integrations':[{'name':name,'state':state,'detail':detail} for name,state,detail in [('PostgreSQL','READY','Persistent records; SQLAlchemy / Alembic schema owner'),('OIDC identity','READY','Verified issuer, audience, expiry and signature'),('Artifact storage',store.backend,'Authorized artifact access; no permanent public URLs'),('Browser execution','UNAVAILABLE','Phase 2: Temporal, isolated Playwright / Browser Use workers'),('Market research','UNAVAILABLE','Phase 2: configured retrieval and model providers'),('Participant recruitment','MANUAL','Create invitations after screening; no external messages'),('Payments','UNAVAILABLE','Administrative quotes only; no charges or payouts')]],'usage':{'actual_cents':0,'note':'Phase 1 demo has no provider charges. Budget is a limit, not a purchase.'}}
@app.patch('/v1/settings')
def update_settings(body:SettingsInput,c:Context=C):
    operate(c);s=c.db.scalar(select(Settings).where(Settings.tenant_id==c.tenant))
    if not s:s=Settings(tenant_id=c.tenant);c.db.add(s)
    s.retention_days=body.retention_days;audit(c,'retention.updated',body.model_dump());return body.model_dump()
