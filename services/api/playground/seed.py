"""Explicit repeatable LOCAL seed. Does not run on service startup."""
import os
from sqlalchemy import create_engine,select
from sqlalchemy.orm import Session
from playground.models import *
from playground.demo import BRIEF,DEFAULT_PLAN

def seed():
    if os.getenv('APP_ENV','development')!='development': raise RuntimeError('Local seed disabled outside development')
    engine=create_engine(os.getenv('MIGRATION_DATABASE_URL','postgresql+psycopg://postgres:local-postgres-only@127.0.0.1:54329/playground'))
    with Session(engine) as db:
        if db.scalar(select(User).where(User.subject=='local-alice')): print('Local seed already exists'); return
        for subject,name,workspace,mode in [('local-alice','Alex Chen','Demo workspace','DEMO'),('local-bob','Blair Singh','Independent workspace','REAL')]:
            user=User(subject=subject,name=name); tenant=Tenant(name=workspace,mode=mode)
            db.add_all([user,tenant]); db.flush()
            db.add(Membership(tenant_id=tenant.id,user_id=user.id,role='owner')); db.add(Settings(tenant_id=tenant.id))
            if mode=='DEMO':
                project=Project(tenant_id=tenant.id,name='HireFlow',description='A simpler way for growing teams to create job postings and find their next great hire.',stage='prototype',mode='DEMO')
                db.add(project); db.flush()
                for label in ['A','B']: db.add(Build(tenant_id=tenant.id,project_id=project.id,label=label,url=f'http://localhost:3000/fixture/hireflow?build={label}'))
                db.add(Brief(tenant_id=tenant.id,project_id=project.id,version=1,snapshot=BRIEF,confirmed=False))
                db.add(Plan(tenant_id=tenant.id,project_id=project.id,version=1,snapshot=DEFAULT_PLAN,approved=False))
                db.add(Message(tenant_id=tenant.id,project_id=project.id,role='assistant',content='Demo intake · Who will use HireFlow, and what decision should this validation help you make?'))
                for entity,status,pricing in [('TalentNest Sample','Active illustrative alternative','Sample: subscription'),('Roleboard Sample','Historical illustrative case','Sample: per posting')]:
                    db.add(Source(tenant_id=tenant.id,project_id=project.id,snapshot={'name':entity,'status':status,'pricing':pricing,'customer':'Small hiring teams','geography':'Illustrative global market','problem':'Job creation and applicant organization','source':'Owned fictional fixture notes','url':'/fixture/research','as_of':'2026-10-14','provenance':'DEMO','uncertainty':'Invented case for interface demonstration; not a factual competitor claim.'}))
        db.commit(); print('Local workspaces seeded; no provider requests made')
if __name__=='__main__': seed()
