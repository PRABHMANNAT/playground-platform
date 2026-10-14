import os
from alembic import context
from sqlalchemy import engine_from_config, pool
from playground.models import Base
config=context.config
config.set_main_option('sqlalchemy.url',os.getenv('MIGRATION_DATABASE_URL',config.get_main_option('sqlalchemy.url')))
with engine_from_config(config.get_section(config.config_ini_section),prefix='sqlalchemy.',poolclass=pool.NullPool).connect() as connection:
    context.configure(connection=connection,target_metadata=Base.metadata)
    with context.begin_transaction(): context.run_migrations()
