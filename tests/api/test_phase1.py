"""Integration tests run against actual PostgreSQL and the local OIDC test issuer."""
import os,sys,hashlib,secrets,time,json
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/api'))
import httpx,pytest,jwt
from sqlalchemy import select,text,create_engine,func
from sqlalchemy.orm import Session as AdminSession
from fastapi.testclient import TestClient
from playground.main import app
from playground.db import Session,scope
from playground.models import *
from playground.demo import DEFAULT_PLAN,BRIEF
from playground.storage import store
API='http://127.0.0.1:8001'
def token(account='alice'):
    import base64
    verifier=secrets.token_urlsafe(32);nonce=secrets.token_urlsafe(16)
    payload={'client_id':'playground-web','redirect_uri':'http://localhost:3000/auth/callback','response_type':'code','scope':'openid profile','state':secrets.token_urlsafe(16),'nonce':nonce,'code_challenge_method':'S256','code_challenge':base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')}
    response=httpx.post(API+'/authorize',data={**payload,'account':account,'password':'playground'},follow_redirects=False)
    assert response.status_code==303
    code=parse_qs(urlparse(response.headers['location']).query)['code'][0]
    response=httpx.post(API+'/token',data={'client_id':'playground-web','client_secret':'local-client-only','grant_type':'authorization_code','redirect_uri':payload['redirect_uri'],'code':code,'code_verifier':verifier})
    assert response.status_code==200
    return response.json()['access_token']
@pytest.fixture(scope='module')
def clients():return TestClient(app,headers={'Authorization':'Bearer '+token()}),TestClient(app,headers={'Authorization':'Bearer '+token('bob')})
def project(client):
    r=client.post('/v1/projects',json={'name':'Persistence '+secrets.token_hex(3),'description':'Test project 🔬','stage':'prototype'});assert r.status_code==201;return r.json()
def demo(client):
    ws=client.get('/v1/workspace').json();pid=next(p['id'] for p in ws['projects'] if p['mode']=='DEMO')
    assert client.post(f'/v1/projects/{pid}/briefs',json={**BRIEF,'confirmed':True}).status_code==201
    plan=client.post(f'/v1/projects/{pid}/plans',json={**DEFAULT_PLAN,'approved':True,'authorization':True}).json()
    return pid,plan
def launch(client,pid,plan,key=None,baseline=None):return client.post('/v1/runs',json={'project_id':pid,'plan_id':plan['id'],'baseline_id':baseline},headers={'Idempotency-Key':key or secrets.token_urlsafe(12)})
def complete(client,rid):
    admin=create_engine(os.getenv('MIGRATION_DATABASE_URL','postgresql+psycopg://postgres:local-postgres-only@127.0.0.1:54329/playground'))
    with AdminSession(admin) as db:
        r=db.get(Run,rid);r.created_at=now()-__import__('datetime').timedelta(seconds=60);db.commit()
    result=client.get('/v1/runs/'+rid);assert result.status_code==200,result.text;assert result.json()['state']=='COMPLETED';return result.json()

def test_persistence_versions_isolation_and_missing_worker(clients):
    alice,bob=clients;p=project(alice)
    assert bob.patch('/v1/projects/'+p['id'],json={'name':'Attack','description':'','stage':'idea'}).status_code==404
    assert bob.get('/v1/workspace?project_id='+p['id']).status_code==404
    assert alice.get('/v1/me',headers={'X-Workspace-ID':bob.get('/v1/me').json()['tenant_id']}).status_code==403
    assert alice.post(f'/v1/projects/{p["id"]}/briefs',json={**BRIEF,'confirmed':True}).status_code==201
    plans=[alice.post(f'/v1/projects/{p["id"]}/plans',json={**DEFAULT_PLAN,'approved':True,'authorization':True}).json() for _ in range(2)]
    assert plans[1]['version']==plans[0]['version']+1
    with TestClient(app,headers=alice.headers) as reconnected:
        ws=reconnected.get('/v1/workspace?project_id='+p['id']).json();assert ws['project']['description']=='Test project 🔬';assert ws['brief']['confirmed'];assert ws['plan']['id']==plans[-1]['id']
    denied=launch(alice,p['id'],plans[-1]);assert denied.status_code==503
    assert alice.get('/v1/workspace?project_id='+p['id']).json()['runs']==[]
    assert alice.put('/v1/projects/'+p['id']+'/intake-draft',json={'content':'Autosaved answer'}).status_code==200
    assert any(m['role']=='draft' and m['content']=='Autosaved answer' for m in alice.get('/v1/workspace?project_id='+p['id']).json()['messages'])
    assert len(alice.get('/v1/workspace?project_id='+p['id']).json()['builds'])==1
    conflicting=alice.post(f'/v1/projects/{p["id"]}/plans',json={**DEFAULT_PLAN,'target':'https://another.example.test','approved':True,'authorization':True});assert conflicting.status_code==409
    tenant=alice.get('/v1/me').json()['tenant_id']
    with Session() as db:
        assert db.scalar(select(func.count()).select_from(Project))==0 # no tenant context
        scope(db,tenant);assert db.scalar(select(Project).where(Project.id==p['id']))
    with Session() as db:assert db.scalar(select(func.count()).select_from(Project))==0 # pooling reset

def test_idempotency_concurrent_launch_and_cancel(clients):
    alice,bob=clients;pid,plan=demo(alice);key=secrets.token_hex(12)
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:launch(alice,pid,plan,key),range(2)))
    assert all(r.status_code==202 for r in results),[r.text for r in results]
    rid=results[0].json()['id'];assert results[1].json()['id']==rid
    changed=alice.post('/v1/runs',json={'project_id':pid,'plan_id':plan['id'],'baseline_id':str(uuid.uuid4())},headers={'Idempotency-Key':key});assert changed.status_code==409
    assert bob.get('/v1/runs/'+rid).status_code==404
    assert bob.get('/v1/runs/'+rid+'/events').status_code==404
    assert bob.get('/v1/runs/'+rid+'/stream').status_code==404
    assert alice.post('/v1/runs/'+rid+'/cancel').status_code==200
    assert alice.post('/v1/runs/'+rid+'/cancel').status_code==200
    r=alice.get('/v1/runs/'+rid).json();assert r['state']=='CANCELED';assert r['cancel_requested_at']
    tenant=alice.get('/v1/me').json()['tenant_id']
    with Session() as db:
        scope(db,tenant);assert len(db.scalars(select(Reservation).where(Reservation.run_id==rid)).all())==1;assert len(db.scalars(select(Ledger).where(Ledger.run_id==rid)).all())==1

def test_evidence_events_study_participant_report_retest(clients):
    alice,bob=clients;pid,plan=demo(alice);rid=launch(alice,pid,plan).json()['id'];r=complete(alice,rid)
    assert r['total']==24 and r['completed']==24;assert any(s['outcome']=='UNKNOWN' for s in r['sessions'])
    assert all(s['steps'][-1]['artifacts'][0]['state']=='UNAVAILABLE' for s in r['sessions'] if s['outcome']=='UNKNOWN')
    f=next(f for f in r['findings'] if f['severity']=='Blocker');s=next(s for s in r['sessions'] if s['id']==f['session_id']);step=next(s for s in s['steps'] if s['id']==f['step_id']);assert step['milestone']=='submitted'
    aid=step['artifacts'][0]['id'];assert bob.get('/v1/artifacts/'+aid+'/access').status_code==404
    state=step['artifacts'][0]['state'];assert alice.get('/v1/artifacts/'+aid+'/access').status_code==(200 if state=='READY' else 409)
    assert alice.post('/v1/steps/'+step['id']+'/annotations',json={'note':'Review on the exact step'}).status_code==200
    assert alice.post('/v1/findings/'+f['id']+'/reviews',json={'status':'ACKNOWLEDGED','note':'Reproduce in owned fixture'}).status_code==200
    history=alice.get('/v1/runs/'+rid+'/events?limit=10').json();assert len(history)==10
    cursor=history[-1]['run_sequence'];again=alice.get(f'/v1/runs/{rid}/events?after={cursor}&limit=100').json();assert all(e['run_sequence']>cursor for e in again);assert len({e['event_id'] for e in history+again})==len(history+again)
    study=alice.post('/v1/studies',json={'project_id':pid,'build_id':r['build_id'],'finding_id':f['id'],'audience':'Hiring leads','instructions':'Create a sample role and describe the result.'}).json()
    edited={'project_id':pid,'build_id':r['build_id'],'finding_id':f['id'],'audience':'Screened hiring leads','instructions':'Create a sample role and describe the result independently.'}
    assert alice.patch('/v1/studies/'+study['id'],json=edited).status_code==200
    assert bob.patch('/v1/studies/'+study['id'],json=edited).status_code==404
    assignment=alice.post('/v1/studies/'+study['id']+'/assignments',json={'alias':'Local test participant','screening_decision':'Screened test account'}).json();invite=assignment['invitation_path'].split('/')[-1]
    assert alice.patch('/v1/studies/'+study['id'],json=edited).status_code==409
    assert alice.delete('/v1/studies/'+study['id']).status_code==409
    public=TestClient(app);neutral=public.get('/v1/participant/'+invite).json();assert 'finding' not in json.dumps(neutral).lower() and 'observation' not in neutral
    assert public.get('/v1/workspace').status_code==401
    assert public.get('/v1/participant/'+secrets.token_urlsafe(32)).status_code==403
    assert bob.get('/v1/studies/'+study['id']+'/assignments').status_code==404
    body={'outcome':'FAIL','difficulty':4,'notes':'Local test feedback: could not save the sample form.'}
    assert public.post('/v1/participant/'+invite+'/submission',json=body).status_code==409
    assert public.post('/v1/participant/'+invite+'/consent').status_code==200
    assert public.post('/v1/participant/'+invite+'/submission',json=body).status_code==200
    assert public.post('/v1/participant/'+invite+'/submission',json=body).status_code==409
    assert alice.post('/v1/assignments/'+assignment['id']+'/review',json={'comparison':'SUPPORTED','rationale':'Test self-report consistent; no recording available','moderator_outcome':'UNKNOWN'}).status_code==200
    reports=[x for x in alice.get('/v1/workspace?project_id='+pid).json()['reports'] if x['run_id']==rid];assert len(reports)==2;assert not reports[0]['snapshot']['human_observations'];assert reports[1]['snapshot']['human_observations'][0]['provenance']=='LOCAL TEST FEEDBACK'
    assert alice.post('/v1/assignments/'+assignment['id']+'/revoke').status_code==200
    assert public.get('/v1/participant/'+invite).status_code==403
    b=alice.post(f'/v1/projects/{pid}/plans',json={**DEFAULT_PLAN,'build':'B','approved':True,'authorization':True}).json();newid=launch(alice,pid,b,baseline=rid).json()['id'];complete(alice,newid)
    comp=alice.get('/v1/runs/'+newid+'/comparison').json();assert any(i['status']=='FIXED_IN_THIS_RETEST' for i in comp['items']);assert next(i for i in comp['items'] if i['finding']['category']=='Trust')['status']=='UNTESTED'
    missing=alice.post(f'/v1/projects/{pid}/plans',json={**DEFAULT_PLAN,'build':'B','tasks':[DEFAULT_PLAN['tasks'][1]],'approved':True,'authorization':True}).json();gap=launch(alice,pid,missing,baseline=rid).json()['id'];complete(alice,gap)
    assert all(i['status']=='UNTESTED' for i in alice.get('/v1/runs/'+gap+'/comparison').json()['items'])
    changed_task={**DEFAULT_PLAN['tasks'][0],'assertion':'A different success condition that the fixture does not exercise.'}
    changed_plan=alice.post(f'/v1/projects/{pid}/plans',json={**DEFAULT_PLAN,'build':'B','tasks':[changed_task],'approved':True,'authorization':True}).json()
    changed_run=launch(alice,pid,changed_plan,baseline=rid).json()['id'];changed_snapshot=complete(alice,changed_run)
    assert all(s['outcome']=='UNKNOWN' for s in changed_snapshot['sessions'])
    assert all(i['status']=='UNTESTED' for i in alice.get('/v1/runs/'+changed_run+'/comparison').json()['items'])
    assert alice.delete('/v1/artifacts/'+aid).status_code==200
    assert alice.get('/v1/artifacts/'+aid+'/access').status_code==410
    assert any(finding['id']==f['id'] for finding in alice.get('/v1/runs/'+rid).json()['findings'])

def test_invalid_identity_and_plan_permissions(clients):
    alice,bob=clients
    assert TestClient(app,headers={'Authorization':'Bearer invalid'}).get('/v1/me').status_code==401
    p=project(alice);r=alice.post(f'/v1/projects/{p["id"]}/plans',json={**DEFAULT_PLAN,'approved':True,'authorization':True});assert r.status_code==409
    tid=alice.get('/v1/me').json()['tenant_id'];admin=create_engine('postgresql+psycopg://postgres:local-postgres-only@127.0.0.1:54329/playground')
    with AdminSession(admin) as db:
        viewer=User(subject='local-viewer-'+secrets.token_hex(5),name='Test viewer');db.add(viewer);db.flush();viewer_subject=viewer.subject;db.add(Membership(tenant_id=tid,user_id=viewer.id,role='viewer'));db.commit()
    # A signed local test token with the viewer identity exercises authorization independently of UI.
    key=__import__('cryptography.hazmat.primitives.serialization',fromlist=['load_pem_private_key']).load_pem_private_key(Path('.local/oidc-key.pem').read_bytes(),None)
    t=int(time.time());signed=jwt.encode({'iss':API,'aud':'playground-web','sub':viewer_subject,'iat':t,'exp':t+60},key,algorithm='RS256',headers={'kid':'local-1'})
    read_only=TestClient(app,headers={'Authorization':'Bearer '+signed});assert read_only.get('/v1/workspace').status_code==200;assert read_only.post('/v1/projects',json={'name':'Denied'}).status_code==403
    assert read_only.post('/v1/studies/'+str(uuid.uuid4())+'/assignments',json={'alias':'Attack','screening_decision':'No'}).status_code==403
