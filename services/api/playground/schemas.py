from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict

class Strict(BaseModel):
    model_config=ConfigDict(extra='forbid')
class ProjectInput(Strict):
    name: str = Field(min_length=1,max_length=160)
    description: str = Field(default='',max_length=10000)
    stage: Literal['idea','prototype','launched']='prototype'
class ProjectOutput(ProjectInput):
    model_config=ConfigDict(extra='ignore')
    id: str
    mode: str
    created_at: str
    archived: bool
class BriefInput(Strict):
    customer: str = Field(max_length=2000)
    problem: str = Field(max_length=4000)
    workflow: str = Field(max_length=2000)
    alternative: str = Field(max_length=2000)
    geography: str = Field(max_length=200)
    decision: str = Field(max_length=2000)
    assumptions: str = Field(default='',max_length=4000)
    unknowns: str = Field(default='',max_length=4000)
    confirmed: bool = False
class PersonaInput(Strict):
    name: str = Field(min_length=1,max_length=100)
    role: str = Field(max_length=200)
    experience: str = Field(max_length=200)
    intent: str = Field(max_length=500)
    language: str = Field(default='English',max_length=100)
    assumptions: str = Field(default='Synthetic task hypothesis; not a recruited participant.',max_length=1000)
class TaskInput(Strict):
    key: str = Field(min_length=1,max_length=100)
    name: str = Field(min_length=1,max_length=160)
    goal: str = Field(max_length=2000)
    assertion: str = Field(max_length=1000)
    start: str = Field(default='Jobs overview, disposable sample account',max_length=1000)
    allowed_actions: str = Field(default='Navigate, fill sample data, click, inspect. No purchases or external messages.',max_length=2000)
    stop_conditions: str = Field(default='Assertion reached, product error, policy block, or cap reached',max_length=1000)
class PlanInput(Strict):
    build: str = Field(default='A',min_length=1,max_length=100)
    target: str = Field(default='http://localhost:3000/fixture/hireflow?build=A',max_length=2000)
    personas: list[PersonaInput] = Field(min_length=1,max_length=6)
    tasks: list[TaskInput] = Field(min_length=1,max_length=2)
    viewports: list[Literal['1440×900','390×844']] = Field(min_length=1,max_length=2)
    max_actions: int = Field(default=25,ge=1,le=25)
    max_seconds: int = Field(default=180,ge=10,le=180)
    concurrency: int = Field(default=4,ge=1,le=4)
    budget_cents: int = Field(default=5000,ge=0,le=5000)
    approved: bool = False
    authorization: bool = False
    credentials_reference: str = Field(default='Owned HireFlow sample; no external credentials',max_length=500)
class LaunchInput(Strict):
    project_id: str
    plan_id: str
    baseline_id: str | None = None
class MessageInput(Strict):
    content: str = Field(min_length=1,max_length=4000)
class DraftInput(Strict):
    content: str = Field(default='',max_length=4000)
class MemberInput(Strict):
    subject: str = Field(min_length=1,max_length=200)
    name: str = Field(min_length=1,max_length=160)
    role: Literal['owner','admin','editor','viewer','operator']
class ReviewInput(Strict):
    status: Literal['ACKNOWLEDGED','DISPUTED','NEEDS_REVIEW']
    note: str = Field(default='',max_length=4000)
class NoteInput(Strict):
    note: str = Field(min_length=1,max_length=4000)
class StudyInput(Strict):
    project_id: str
    build_id: str
    finding_id: str | None = None
    audience: str = Field(min_length=1,max_length=1000)
    instructions: str = Field(min_length=1,max_length=4000)
    screening: str = Field(default='Works in recruitment; has created job postings',max_length=2000)
    participant_count: int = Field(default=5,ge=1,le=20)
    session_minutes: int = Field(default=20,ge=5,le=60)
    incentive_cents: int = Field(default=0,ge=0,le=100000)
class AssignmentInput(Strict):
    alias: str = Field(min_length=1,max_length=100)
    screening_decision: str = Field(min_length=1,max_length=2000)
class SubmissionInput(Strict):
    outcome: Literal['PASS','FAIL','UNKNOWN']
    difficulty: int = Field(ge=1,le=5)
    notes: str = Field(min_length=1,max_length=4000)
class ModerationInput(Strict):
    comparison: Literal['SUPPORTED','CONTRADICTED','INCONCLUSIVE']
    rationale: str = Field(min_length=1,max_length=4000)
    moderator_outcome: Literal['PASS','FAIL','UNKNOWN']='UNKNOWN'
class SettingsInput(Strict):
    retention_days: int = Field(ge=1,le=365)
class EventOutput(BaseModel):
    schema_version: str='1'
    event_id: str
    tenant_id: str
    run_id: str
    session_id: str | None
    attempt_id: str | None = None
    run_sequence: int
    session_sequence: int | None = None
    event_type: str
    occurred_at: str
    persisted_at: str
    payload: dict[str,Any]
class RecordOutput(BaseModel):
    id: str
    created_at: str
    model_config=ConfigDict(extra='allow')
class RunOutput(RecordOutput):
    project_id: str
    state: str
    mode: str
    build_id: str
    plan_id: str
    snapshot: PlanInput
    sessions: list[RecordOutput]
    findings: list[RecordOutput]
    events: list[EventOutput]
    completed: int
    total: int
    actual_cents: int
    cancel_requested_at: str | None
class WorkspaceOutput(BaseModel):
    projects: list[ProjectOutput]
    project: ProjectOutput | None
    brief: RecordOutput | None
    messages: list[RecordOutput]
    plan: RecordOutput | None
    runs: list[RecordOutput]
    studies: list[RecordOutput]
    reports: list[RecordOutput]
    sources: list[RecordOutput]
    builds: list[RecordOutput]
