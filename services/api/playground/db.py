import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://playground_app:local-app-only@127.0.0.1:54329/playground')
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(engine, expire_on_commit=False)

def scope(db, tenant_id):
    db.execute(text("SELECT set_config('app.tenant_id', :tenant, true)"), {'tenant': str(tenant_id)})
    db.execute(text("SET LOCAL lock_timeout = '5s'"))
    db.execute(text("SET LOCAL statement_timeout = '15s'"))
