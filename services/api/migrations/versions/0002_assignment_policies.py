"""Restrict invitations at the database boundary; token hashes reset per transaction."""
from alembic import op
revision='0002'
down_revision='0001'
branch_labels=None
depends_on=None
def upgrade():
    op.execute('ALTER TABLE study_assignments ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE study_assignments FORCE ROW LEVEL SECURITY')
    op.execute("""CREATE POLICY assignment_scope ON study_assignments
      USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
        OR token_hash = nullif(current_setting('app.invitation_hash',true),''))
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid
        OR token_hash = nullif(current_setting('app.invitation_hash',true),''))""")
def downgrade():
    op.execute('DROP POLICY assignment_scope ON study_assignments')
    op.execute('ALTER TABLE study_assignments DISABLE ROW LEVEL SECURITY')
