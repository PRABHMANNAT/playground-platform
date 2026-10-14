"""Deterministic fixture playback. This never navigates a user's target."""
from datetime import timedelta
from sqlalchemy import select, func
from playground.models import *
from playground.storage import store
import hashlib

PERSONAS=[{'name':name,'role':role,'experience':experience,'intent':'Create a role and publish it with clear job details.','language':'English','assumptions':'Synthetic task hypothesis; not a recruited participant.'} for name,role,experience in [
('Alex','Recruitment lead','Experienced'),('Sam','First-time founder','New to hiring'),('Morgan','People operations','Experienced'),('Jamie','Hiring manager','Occasional user'),('Taylor','Agency recruiter','Experienced'),('Riley','Talent coordinator','New to hiring')]]
TASKS=[{'key':'create-job','name':'Create a job posting','goal':'Create a Product Designer role using sample information.','assertion':'A saved job appears in the jobs overview.','start':'Jobs overview, disposable sample account','allowed_actions':'Navigate, fill sample data, click, inspect. No external messages.','stop_conditions':'Confirmation, error, or cap'},
{'key':'application','name':'Submit an application','goal':'Find the role and complete an application with sample data.','assertion':'Application confirmation is visible.','start':'Sample careers page','allowed_actions':'Navigate, fill sample data, submit sample application','stop_conditions':'Confirmation, error, or cap'}]
DEFAULT_PLAN={'build':'A','target':'http://localhost:3000/fixture/hireflow?build=A','personas':PERSONAS,'tasks':TASKS,'viewports':['1440×900','390×844'],'max_actions':25,'max_seconds':180,'concurrency':4,'budget_cents':5000,'approved':False,'authorization':False,'credentials_reference':'Owned HireFlow sample; no external credentials'}
BRIEF={'customer':'Early-stage teams and their hiring managers','problem':'Job postings take too long to create and publish.','workflow':'Create a job → add details → save → receive applications','alternative':'Spreadsheets and manual email','geography':'India and remote teams','decision':'Can a new hiring manager publish a job without assistance?','assumptions':'The save interaction is discoverable; the form works on mobile.','unknowns':'Willingness to pay and hiring outcomes have not been studied.'}

def event(db,run,kind,payload=None,session=None):
    db.flush()
    seq=(db.scalar(select(func.max(Event.run_sequence)).where(Event.run_id==run.id)) or 0)+1
    db.add(Event(tenant_id=run.tenant_id,run_id=run.id,run_sequence=seq,event_type=kind,session_id=session,payload=payload or {}))
    db.flush()

def make_run(db,project,plan,build):
    run=Run(tenant_id=project.tenant_id,project_id=project.id,plan_id=plan.id,build_id=build.id,mode='DEMO',state='QUEUED',snapshot=plan.snapshot)
    db.add(run); db.flush()
    db.add(Reservation(tenant_id=run.tenant_id,run_id=run.id,amount_cents=plan.snapshot['budget_cents']))
    db.add(Outbox(tenant_id=run.tenant_id,run_id=run.id,kind='demo.playback'))
    ordinal=0
    for task in plan.snapshot['tasks']:
        for viewport in plan.snapshot['viewports']:
            for persona in plan.snapshot['personas']:
                db.add(Journey(tenant_id=run.tenant_id,run_id=run.id,persona=persona,task=task,viewport=viewport,ordinal=ordinal)); ordinal+=1
    event(db,run,'run.queued',{'mode':'DEMO','total':ordinal})
    return run

def settle(db,run):
    reservation=db.scalar(select(Reservation).where(Reservation.run_id==run.id).with_for_update())
    if not reservation.settled:
        reservation.settled=True
        db.add(Ledger(tenant_id=run.tenant_id,run_id=run.id,event_key=run.id+':settled',amount_cents=0,kind='DEMO_SETTLEMENT'))
        event(db,run,'usage.updated',{'actual_cents':0,'mode':'DEMO','reservation_released_cents':reservation.amount_cents})

def advance(db,run):
    if run.mode!='DEMO' or run.state in ('COMPLETED','CANCELED','FAILED'): return
    elapsed=(now()-run.created_at).total_seconds()
    if run.state=='QUEUED': run.state='RUNNING'; event(db,run,'run.started',{'mode':'DEMO'})
    sessions=db.scalars(select(Journey).where(Journey.run_id==run.id).order_by(Journey.ordinal)).all()
    for session in sessions:
        # Four illustrative slots, six deterministic batches, no random progress.
        offset=(session.ordinal//run.snapshot['concurrency'])*7
        required_steps=min(4,run.snapshot['max_actions'])
        count=max(0,min(required_steps,int((elapsed-offset)/1.5)))
        if count==0: continue
        if session.state=='QUEUED': session.state='RUNNING'; event(db,run,'session.started',{},session.id)
        existing=db.scalar(select(func.count()).select_from(Step).where(Step.session_id==session.id))
        is_job=session.task['key']=='create-job'
        build=run.snapshot['build']
        unknown=session.ordinal==len(sessions)-1
        expected_assertion=next((task['assertion'] for task in TASKS if task['key']==session.task['key']),None)
        unsupported_assertion=session.task.get('assertion')!=expected_assertion
        summaries=['Opened the sample jobs overview','Opened the new job form','Entered sample job details',('Attempted Save; sample server returned 500' if build=='A' else 'Reached sample confirmation')] if is_job else ['Opened the sample careers page','Opened the application form','Entered sample applicant details','Reached sample application confirmation']
        milestones=['opened','form','filled','submitted']
        for index in range(existing,count):
            final=index==3
            outcome='error' if final and is_job and build=='A' else 'success'
            if final and (unknown or unsupported_assertion): outcome='unknown'; summaries[index]='Custom assertion is unavailable in sample playback' if unsupported_assertion else 'Sample infrastructure interruption; outcome unknown'
            step=Step(tenant_id=run.tenant_id,session_id=session.id,sequence=index+1,summary=summaries[index],milestone=milestones[index],outcome=outcome,url=f'hireflow.demo/jobs?build={build}',captured_at=run.created_at+timedelta(seconds=offset+(index+1)*1.5))
            key=f'hireflow/{build}/{session.task["key"]}/{session.viewport}/{index+1}.png'
            ready=store.exists(key)
            if final and (unknown or unsupported_assertion):ready=False
            path=store.access(key) if ready else None
            step.url=f'localhost:3000/fixture/hireflow?build={build}&task={session.task["key"]}'
            if path and hasattr(path,'stat'):step.captured_at=datetime.fromtimestamp(path.stat().st_mtime,timezone.utc)
            checksum=hashlib.sha256(path.read_bytes()).hexdigest() if ready and hasattr(path,'read_bytes') else None
            if checksum:
                immutable_key=f'demo/{checksum}.png'
                immutable_path=store.access(immutable_key)
                if hasattr(immutable_path,'write_bytes'):
                    immutable_path.parent.mkdir(parents=True,exist_ok=True)
                    if not immutable_path.exists():immutable_path.write_bytes(path.read_bytes())
                    key=immutable_key
            db.add(step); db.flush()
            artifact=Artifact(tenant_id=run.tenant_id,step_id=step.id,object_key=key,state='READY' if ready else ('UNAVAILABLE' if final and (unknown or unsupported_assertion) else 'PENDING'),checksum=checksum)
            db.add(artifact); db.flush()
            event(db,run,'step.completed',{'step_id':step.id,'session_sequence':index+1,'summary':step.summary,'artifact_ids':[artifact.id],'outcome':outcome,'mode':'DEMO'},session.id)
            if ready: event(db,run,'artifact.ready',{'artifact_id':artifact.id,'mode':'DEMO'},session.id)
            if final and is_job and build=='A' and session.ordinal==0:
                add_finding(db,run,step,'Usability','Blocker','BROWSER_OBSERVATION','SUPPORTED','Save action blocks job creation','Illustrative build A returns HTTP 500 when the sample job form is saved.','This fixture represents a product blocker; it is not an observation of a submitted customer target.','Fix the save handler, preserve form input on failure, and verify the new job in the overview.')
                add_finding(db,run,step,'Trust','Suggestion','AI_HYPOTHESIS','INCONCLUSIVE','Data-use disclosure is missing','The sample form does not describe how applicant information is used.','A heuristic concern. No participant trust or conversion impact was measured.','Add a concise disclosure and validate comprehension with independent participants.')
            if index==1 and session.ordinal==0 and build=='A':
                add_finding(db,run,step,'Accessibility','Major','AUTOMATED_AUDIT','SUPPORTED','Salary input has no persistent visible label','Build A fixture has no associated visible label for the salary field; its placeholder disappears when filled.','Seeded accessibility example; no accessibility certification or live audit is claimed.','Associate a visible label with the input and recheck keyboard and screen-reader behavior.')
        if count==required_steps and session.state!='COMPLETED':
            capped=required_steps<4
            session.state='COMPLETED'; session.outcome='UNKNOWN' if unknown or capped or unsupported_assertion else ('FAIL' if is_job and build=='A' else 'PASS')
            session.failure_reason='POLICY' if capped or unsupported_assertion else ('INFRASTRUCTURE' if unknown else ('PRODUCT' if session.outcome=='FAIL' else None))
            event(db,run,'session.finished',{'outcome':session.outcome,'failure_reason':session.failure_reason},session.id)
    if all(s.state=='COMPLETED' for s in sessions):
        run.state='ANALYZING'; event(db,run,'run.analyzing',{'mode':'DEMO'})
        run.state='COMPLETED'; settle(db,run); event(db,run,'run.completed',{'mode':'DEMO'})
        publish_report(db,run)
        feedback=reviewed_feedback(db,run)
        if feedback: publish_report(db,run,feedback)

def reviewed_feedback(db,run):
    studies=db.scalars(select(Study).where(Study.project_id==run.project_id,Study.build_id==run.build_id)).all()
    observed=[]
    for study in studies:
        if study.finding_id:
            finding=db.get(Finding,study.finding_id)
            if not finding or finding.run_id!=run.id:continue
        for assignment in db.scalars(select(Assignment).where(Assignment.study_id==study.id)):
            if assignment.submission and assignment.review:observed.append({'alias':assignment.alias,'submission':assignment.submission,'review':assignment.review,'build_id':study.build_id,'provenance':'LOCAL TEST FEEDBACK' if run.mode=='DEMO' else 'INDEPENDENT_WRITTEN_FEEDBACK'})
    return observed

def add_finding(db,run,step,category,severity,evidence_type,support,title,observation,interpretation,recommendation):
    finding=Finding(tenant_id=run.tenant_id,run_id=run.id,step_id=step.id,category=category,severity=severity,evidence_type=evidence_type,support=support,title=title,observation=observation,interpretation=interpretation,recommendation=recommendation)
    db.add(finding); db.flush(); event(db,run,'finding.created',{'finding_id':finding.id,'step_id':step.id,'mode':'DEMO'},step.session_id)

def publish_report(db,run,human=None):
    versions=db.scalar(select(func.max(Report.version)).where(Report.run_id==run.id)) or 0
    sessions=db.scalars(select(Journey).where(Journey.run_id==run.id)).all()
    findings=db.scalars(select(Finding).where(Finding.run_id==run.id)).all()
    data={'title':'HireFlow validation report','provenance':'DEMO — illustrative fixture outcomes, not real browser execution or customer feedback','build':run.snapshot['build'],'summary':'Inspect the Save blocker, restore accessible form labels, and test disclosure comprehension.' if run.snapshot['build']=='A' else 'Selected fixes are illustrated in build B. Disclosure remains untested.','outcomes':{key:sum(s.outcome==key for s in sessions) for key in ['PASS','FAIL','UNKNOWN']},'findings':[{'id':f.id,'title':f.title,'evidence_type':f.evidence_type,'support':f.support,'step_id':f.step_id} for f in findings],'human_observations':human or [],'limitations':['Deterministic sample playback; no live agents or market research.','Synthetic personas are not representative customers.','No demand, conversion lift, or human time savings established.'],'next_experiment':'Recruit suitable participants manually and test neutral tasks independently.','actual_cost_cents':0,'source_count':0}
    db.add(Report(tenant_id=run.tenant_id,run_id=run.id,version=versions+1,snapshot=data))
