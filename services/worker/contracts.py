from dataclasses import dataclass
from typing import Literal, Protocol

@dataclass(frozen=True)
class ExecutionScope:
    run_id: str
    session_id: str
    attempt_id: str
    target_host: str
    authorized_asset_hosts: tuple[str,...]
    max_actions: int
    max_seconds: int
    artifact_upload_capability: str

@dataclass(frozen=True)
class ExecutionResult:
    outcome: Literal['PASS','FAIL','UNKNOWN']
    failure_reason: Literal['PRODUCT','AGENT','INFRASTRUCTURE','POLICY'] | None
    evidence_ids: tuple[str,...]

class BrowserExecutor(Protocol):
    async def execute(self,scope:ExecutionScope,task_snapshot:dict) -> ExecutionResult: ...
    async def cancel(self,run_id:str) -> None: ...

class UnavailableExecutor:
    async def execute(self,*args,**kwargs):
        raise RuntimeError('Real browser execution is not configured or verified. No success result is available.')
    async def cancel(self,*args,**kwargs):
        raise RuntimeError('No real worker is configured.')
