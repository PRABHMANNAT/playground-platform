import os
from pathlib import Path
from typing import Protocol
import boto3

class ArtifactStore(Protocol):
    def exists(self,key: str) -> bool: ...
    def access(self,key: str) -> str | Path: ...
class LocalStore:
    configured=True
    backend='LOCAL'
    def __init__(self): self.root=Path(os.getenv('ARTIFACT_LOCAL_ROOT','.local/artifacts')).resolve()
    def access(self,key):
        path=(self.root/key).resolve()
        if not path.is_relative_to(self.root): raise ValueError('Invalid object key')
        return path
    def exists(self,key): return self.access(key).is_file()
class S3Store:
    configured=True
    backend='S3'
    def __init__(self):
        self.bucket=os.environ['S3_BUCKET']
        self.client=boto3.client('s3',endpoint_url=os.getenv('S3_ENDPOINT'),aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY'])
    def exists(self,key):
        try: self.client.head_object(Bucket=self.bucket,Key=key); return True
        except self.client.exceptions.ClientError: return False
    def access(self,key): return self.client.generate_presigned_url('get_object',Params={'Bucket':self.bucket,'Key':key},ExpiresIn=60)
class UnavailableStore:
    configured=False
    backend='UNAVAILABLE'
    reason='S3 storage is unavailable: configure endpoint/bucket and scoped access credentials. No substitute artifacts are served.'
    def exists(self,key):return False
    def access(self,key):raise RuntimeError(self.reason)

store=(S3Store() if all(os.getenv(k) for k in ('S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY')) else UnavailableStore()) if os.getenv('ARTIFACT_BACKEND')=='s3' else LocalStore()
