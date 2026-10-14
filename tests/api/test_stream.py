import sys, json, secrets
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from test_phase1 import token
import httpx
from concurrent.futures import ThreadPoolExecutor

def test_sse_cursor_reconnect_and_concurrent_health():
    headers={'Authorization':'Bearer '+token()}
    with httpx.Client(base_url='http://127.0.0.1:8000',headers=headers,timeout=10) as client:
        workspace=client.get('/v1/workspace').json()
        run=workspace['runs'][-1]['id']
        def first(after):
            with client.stream('GET',f'/v1/runs/{run}/stream?after={after}') as response:
                assert response.status_code==200
                for line in response.iter_lines():
                    if line.startswith('data: '):return json.loads(line[6:])
        event=first(0);assert event['run_sequence']==1
        recovered=first(event['run_sequence']);assert recovered['run_sequence']>1 and recovered['event_id']!=event['event_id']
        with ThreadPoolExecutor(max_workers=3) as pool:
            stream_future=pool.submit(first,0)
            snapshot=pool.submit(lambda:client.get('/v1/runs/'+run).status_code)
            health=pool.submit(lambda:client.get('/health').status_code)
            assert health.result(timeout=10)==200;assert snapshot.result(timeout=10)==200;assert stream_future.result(timeout=10)['event_id']
