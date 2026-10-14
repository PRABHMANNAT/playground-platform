"""Fresh-database migration and repeatable local seed check; never overwrites a database."""
import os,subprocess,secrets,sys
from pathlib import Path
import psycopg
from psycopg import sql
name='playground_migration_'+secrets.token_hex(4)
admin='postgresql://postgres:local-postgres-only@127.0.0.1:54329/postgres'
with psycopg.connect(admin,autocommit=True) as db:db.execute(sql.SQL("CREATE DATABASE {} ENCODING 'UTF8' TEMPLATE template0").format(sql.Identifier(name)))
env={**os.environ,'PYTHONPATH':'services/api','MIGRATION_DATABASE_URL':f'postgresql+psycopg://postgres:local-postgres-only@127.0.0.1:54329/{name}','APP_ENV':'development'}
for _ in range(2):
    subprocess.run([sys.executable,'-m','alembic','-c','services/api/alembic.ini','upgrade','head'],env=env,check=True)
    subprocess.run([sys.executable,'-m','playground.seed'],env=env,check=True)
with psycopg.connect(admin.rsplit('/',1)[0]+'/'+name) as db:
    assert db.execute('SELECT count(*) FROM users').fetchone()[0]==2
    assert db.execute('SELECT count(*) FROM projects').fetchone()[0]==1
    assert db.execute('SELECT version_num FROM alembic_version').fetchone()[0]=='0004'
    count=db.execute("SELECT count(*) FROM pg_tables WHERE schemaname='public'").fetchone()[0]
print(f'Fresh UTF8 database: {count} tables, all four revisions, repeated migrations/seeds, no duplicate sample projects.')
with psycopg.connect(admin,autocommit=True) as db:db.execute(sql.SQL('DROP DATABASE {}').format(sql.Identifier(name)))
