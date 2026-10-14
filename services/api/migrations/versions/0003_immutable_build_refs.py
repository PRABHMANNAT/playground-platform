"""Unique immutable build labels inside a project."""
from alembic import op
revision='0003'
down_revision='0002'
branch_labels=None
depends_on=None
def upgrade():op.create_unique_constraint('uq_build_project_label','product_builds',['project_id','label'])
def downgrade():op.drop_constraint('uq_build_project_label','product_builds',type_='unique')
