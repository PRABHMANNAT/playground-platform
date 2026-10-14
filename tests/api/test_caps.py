from test_phase1 import clients,demo,complete,launch,DEFAULT_PLAN
def test_demo_action_cap_never_claims_success(clients):
    alice,_=clients;pid,_=demo(alice)
    plan=alice.post(f'/v1/projects/{pid}/plans',json={**DEFAULT_PLAN,'approved':True,'authorization':True,'max_actions':1}).json()
    rid=launch(alice,pid,plan).json()['id'];run=complete(alice,rid)
    assert all(s['outcome']=='UNKNOWN' and s['failure_reason']=='POLICY' for s in run['sessions'])
    assert all(len(s['steps'])==1 for s in run['sessions'])

def test_missing_storage_credentials_are_honest(clients,monkeypatch):
    from playground import main
    from playground.storage import UnavailableStore
    monkeypatch.setattr(main,'store',UnavailableStore())
    response=clients[0].get('/v1/settings')
    assert response.status_code==200
    assert next(i for i in response.json()['integrations'] if i['name']=='Artifact storage')['state']=='UNAVAILABLE'
