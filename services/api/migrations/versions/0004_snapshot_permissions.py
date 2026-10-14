"""Append-only evidence, versions, reviews, events and economic ledger entries."""
from alembic import op
revision='0004'
down_revision='0003'
branch_labels=None
depends_on=None
tables=('brief_versions','test_plans','persona_versions','plan_personas','tasks','steps','run_events','findings','finding_reviews','evidence_annotations','report_versions','usage_ledger','idempotency_records','retest_links','audit_events','product_builds')
def upgrade():
    for table in tables:op.execute(f'REVOKE UPDATE, DELETE ON {table} FROM playground_app')
def downgrade():
    for table in tables:op.execute(f'GRANT UPDATE, DELETE ON {table} TO playground_app')
