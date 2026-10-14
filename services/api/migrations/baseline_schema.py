import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, ForeignKeyConstraint, Index, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

def now(): return datetime.now(timezone.utc)
def uid(): return str(uuid.uuid4())
class Base(DeclarativeBase): pass
class Record:
    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=uid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
class Tenant(Record, Base):
    __tablename__='tenants'
    name: Mapped[str] = mapped_column(String(160))
    mode: Mapped[str] = mapped_column(String(16), default='REAL')
class User(Record, Base):
    __tablename__='users'
    subject: Mapped[str] = mapped_column(String(200), unique=True)
    name: Mapped[str] = mapped_column(String(160))
class Membership(Record, Base):
    __tablename__='memberships'
    tenant_id: Mapped[str] = mapped_column(ForeignKey('tenants.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    role: Mapped[str] = mapped_column(String(20))
    __table_args__=(UniqueConstraint('tenant_id','user_id'),)
class Owned(Record):
    tenant_id: Mapped[str] = mapped_column(ForeignKey('tenants.id'), index=True)
class Project(Owned, Base):
    __tablename__='projects'
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default='')
    stage: Mapped[str] = mapped_column(String(20), default='prototype')
    mode: Mapped[str] = mapped_column(String(16), default='REAL')
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    __table_args__=(UniqueConstraint('tenant_id','id'),)
class Build(Owned, Base):
    __tablename__='product_builds'
    project_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    label: Mapped[str] = mapped_column(String(100))
    url: Mapped[str] = mapped_column(String(2000))
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']), UniqueConstraint('tenant_id','id'))
class ProjectRecord(Owned):
    project_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
class Message(ProjectRecord, Base):
    __tablename__='messages'
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']),)
class Brief(ProjectRecord, Base):
    __tablename__='brief_versions'
    version: Mapped[int] = mapped_column(Integer)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']), UniqueConstraint('project_id','version'))
class Persona(ProjectRecord, Base):
    __tablename__='persona_versions'
    version: Mapped[int] = mapped_column(Integer, default=1)
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']), UniqueConstraint('tenant_id','id'))
class Plan(ProjectRecord, Base):
    __tablename__='test_plans'
    version: Mapped[int] = mapped_column(Integer)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']), UniqueConstraint('project_id','version'),UniqueConstraint('tenant_id','id'))
class Task(Owned, Base):
    __tablename__='tasks'
    plan_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    key: Mapped[str] = mapped_column(String(100))
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','plan_id'],['test_plans.tenant_id','test_plans.id']), UniqueConstraint('tenant_id','id'))
class PlanPersona(Owned, Base):
    __tablename__='plan_personas'
    plan_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    persona_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    __table_args__=(ForeignKeyConstraint(['tenant_id','plan_id'],['test_plans.tenant_id','test_plans.id']),ForeignKeyConstraint(['tenant_id','persona_id'],['persona_versions.tenant_id','persona_versions.id']),UniqueConstraint('plan_id','persona_id'))
class Run(ProjectRecord, Base):
    __tablename__='runs'
    plan_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    build_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    mode: Mapped[str] = mapped_column(String(16))
    state: Mapped[str] = mapped_column(String(24),default='QUEUED')
    snapshot: Mapped[dict] = mapped_column(JSONB)
    cancel_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']),ForeignKeyConstraint(['tenant_id','plan_id'],['test_plans.tenant_id','test_plans.id']),ForeignKeyConstraint(['tenant_id','build_id'],['product_builds.tenant_id','product_builds.id']),UniqueConstraint('tenant_id','id'))
class Journey(Owned, Base):
    __tablename__='journey_sessions'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    persona: Mapped[dict] = mapped_column(JSONB)
    task: Mapped[dict] = mapped_column(JSONB)
    viewport: Mapped[str] = mapped_column(String(32))
    ordinal: Mapped[int] = mapped_column(Integer)
    state: Mapped[str] = mapped_column(String(20),default='QUEUED')
    outcome: Mapped[str | None] = mapped_column(String(16), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(String(24), nullable=True)
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),UniqueConstraint('tenant_id','id'),UniqueConstraint('run_id','ordinal'))
class Step(Owned, Base):
    __tablename__='steps'
    session_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    sequence: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str] = mapped_column(Text)
    milestone: Mapped[str] = mapped_column(String(100))
    outcome: Mapped[str] = mapped_column(String(20))
    capture_phase: Mapped[str] = mapped_column(String(16),default='after')
    url: Mapped[str] = mapped_column(String(2000))
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__=(ForeignKeyConstraint(['tenant_id','session_id'],['journey_sessions.tenant_id','journey_sessions.id']),UniqueConstraint('tenant_id','id'),UniqueConstraint('session_id','sequence'))
class Artifact(Owned, Base):
    __tablename__='artifacts'
    step_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    object_key: Mapped[str] = mapped_column(String(500))
    state: Mapped[str] = mapped_column(String(24),default='PENDING')
    checksum: Mapped[str | None] = mapped_column(String(64),nullable=True)
    content_type: Mapped[str] = mapped_column(String(100),default='image/png')
    redaction_state: Mapped[str] = mapped_column(String(24),default='FIXTURE_NO_SECRETS')
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True),nullable=True)
    __table_args__=(ForeignKeyConstraint(['tenant_id','step_id'],['steps.tenant_id','steps.id']),UniqueConstraint('tenant_id','id'))
class Event(Owned, Base):
    __tablename__='run_events'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    run_sequence: Mapped[int] = mapped_column(Integer)
    event_type: Mapped[str] = mapped_column(String(64))
    session_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),ForeignKeyConstraint(['tenant_id','session_id'],['journey_sessions.tenant_id','journey_sessions.id']),UniqueConstraint('run_id','run_sequence'))
class Finding(Owned, Base):
    __tablename__='findings'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    step_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    category: Mapped[str] = mapped_column(String(32))
    severity: Mapped[str] = mapped_column(String(24))
    evidence_type: Mapped[str] = mapped_column(String(32))
    support: Mapped[str] = mapped_column(String(24))
    title: Mapped[str] = mapped_column(String(200))
    observation: Mapped[str] = mapped_column(Text)
    interpretation: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),ForeignKeyConstraint(['tenant_id','step_id'],['steps.tenant_id','steps.id']),UniqueConstraint('tenant_id','id'))
class Review(Owned, Base):
    __tablename__='finding_reviews'
    finding_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    status: Mapped[str] = mapped_column(String(32))
    note: Mapped[str] = mapped_column(Text)
    __table_args__=(ForeignKeyConstraint(['tenant_id','finding_id'],['findings.tenant_id','findings.id']),)
class Annotation(Owned, Base):
    __tablename__='evidence_annotations'
    step_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    note: Mapped[str] = mapped_column(Text)
    __table_args__=(ForeignKeyConstraint(['tenant_id','step_id'],['steps.tenant_id','steps.id']),)
class Study(ProjectRecord, Base):
    __tablename__='human_studies'
    build_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    finding_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=False),nullable=True)
    state: Mapped[str] = mapped_column(String(24),default='DRAFT')
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']),ForeignKeyConstraint(['tenant_id','build_id'],['product_builds.tenant_id','product_builds.id']),ForeignKeyConstraint(['tenant_id','finding_id'],['findings.tenant_id','findings.id']),UniqueConstraint('tenant_id','id'))
class Assignment(Record, Base):
    __tablename__='study_assignments'
    tenant_id: Mapped[str] = mapped_column(ForeignKey('tenants.id'), index=True)
    study_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    alias: Mapped[str] = mapped_column(String(100))
    token_hash: Mapped[str] = mapped_column(String(64),unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean,default=False)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True),nullable=True)
    consent_version: Mapped[str | None] = mapped_column(String(32),nullable=True)
    submission: Mapped[dict | None] = mapped_column(JSONB,nullable=True)
    review: Mapped[dict | None] = mapped_column(JSONB,nullable=True)
    __table_args__=(ForeignKeyConstraint(['tenant_id','study_id'],['human_studies.tenant_id','human_studies.id']),)
class Report(Owned, Base):
    __tablename__='report_versions'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    version: Mapped[int] = mapped_column(Integer)
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']), UniqueConstraint('run_id','version'))
class Reservation(Owned, Base):
    __tablename__='budget_reservations'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3),default='USD')
    settled: Mapped[bool] = mapped_column(Boolean,default=False)
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),UniqueConstraint('run_id'))
class Ledger(Owned, Base):
    __tablename__='usage_ledger'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    event_key: Mapped[str] = mapped_column(String(150),unique=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3),default='USD')
    kind: Mapped[str] = mapped_column(String(24))
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),)
class Idempotency(Owned, Base):
    __tablename__='idempotency_records'
    key: Mapped[str] = mapped_column(String(200))
    fingerprint: Mapped[str] = mapped_column(String(64))
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),UniqueConstraint('tenant_id','key'))
class Retest(Owned, Base):
    __tablename__='retest_links'
    baseline_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    retest_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    conditions: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','baseline_id'],['runs.tenant_id','runs.id']),ForeignKeyConstraint(['tenant_id','retest_id'],['runs.tenant_id','runs.id']), UniqueConstraint('retest_id'))
class Source(ProjectRecord, Base):
    __tablename__='research_sources'
    snapshot: Mapped[dict] = mapped_column(JSONB)
    __table_args__=(ForeignKeyConstraint(['tenant_id','project_id'],['projects.tenant_id','projects.id']),)
class Audit(Owned, Base):
    __tablename__='audit_events'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    action: Mapped[str] = mapped_column(String(100))
    payload: Mapped[dict] = mapped_column(JSONB)
class Outbox(Owned, Base):
    __tablename__='outbox_events'
    run_id: Mapped[str] = mapped_column(Uuid(as_uuid=False))
    kind: Mapped[str] = mapped_column(String(40))
    state: Mapped[str] = mapped_column(String(24),default='DEMO_ONLY')
    __table_args__=(ForeignKeyConstraint(['tenant_id','run_id'],['runs.tenant_id','runs.id']),UniqueConstraint('run_id','kind'))
class Settings(Owned, Base):
    __tablename__='workspace_settings'
    retention_days: Mapped[int] = mapped_column(Integer,default=30)
    __table_args__=(UniqueConstraint('tenant_id'),)
