"""Repair only an empty local database initially created with Windows ANSI encoding."""
import psycopg
url='postgresql://postgres:local-postgres-only@127.0.0.1:54329/playground'
with psycopg.connect(url) as db:
    encoding=db.execute('SHOW server_encoding').fetchone()[0]
    if encoding=='UTF8':print('Database UTF8 verified');raise SystemExit(0)
    tables=db.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename!='alembic_version'").fetchall()
    for (table,) in tables:
        from psycopg import sql
        if db.execute(sql.SQL('SELECT count(*) FROM {}').format(sql.Identifier(table))).fetchone()[0]:raise RuntimeError('Refusing to recreate database with application records')
with psycopg.connect('postgresql://postgres:local-postgres-only@127.0.0.1:54329/postgres',autocommit=True) as db:
    db.execute('DROP DATABASE playground WITH (FORCE)')
    db.execute("CREATE DATABASE playground ENCODING 'UTF8' TEMPLATE template0")
print('Empty local database recreated as UTF8. Reapply migrations.')
