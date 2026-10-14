"""Phase 1 relational control plane and transaction-local tenant policies."""
from alembic import op
from migrations.baseline_schema import Base
revision='0001'
down_revision=None
branch_labels=None
depends_on=None

def upgrade():
    Base.metadata.create_all(op.get_bind())
    op.execute("GRANT USAGE ON SCHEMA public TO playground_app")
    for table in Base.metadata.sorted_tables:
        op.execute(f'GRANT SELECT, INSERT, UPDATE, DELETE ON {table.name} TO playground_app')
        if 'tenant_id' in table.columns and table.name not in ('memberships','study_assignments'):
            op.execute(f'ALTER TABLE {table.name} ENABLE ROW LEVEL SECURITY')
            op.execute(f'ALTER TABLE {table.name} FORCE ROW LEVEL SECURITY')
            op.execute(f"CREATE POLICY tenant_scope ON {table.name} USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)")
    # Participant lookups are token-gated by the API. No general assignment routes.
    op.execute('REVOKE DELETE ON study_assignments FROM playground_app')

def downgrade():
    Base.metadata.drop_all(op.get_bind())
