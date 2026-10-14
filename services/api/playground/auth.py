import os
from dataclasses import dataclass
import jwt
import httpx
from functools import lru_cache
from fastapi import Header, HTTPException
from sqlalchemy import select
from playground.db import Session, scope
from playground.models import User, Membership, Tenant

ISSUER=os.getenv('OIDC_ISSUER','http://127.0.0.1:8001')
CLIENT=os.getenv('OIDC_CLIENT_ID','playground-web')
@lru_cache(maxsize=1)
def signing_keys():
    metadata=httpx.get(ISSUER+'/.well-known/openid-configuration',timeout=5).raise_for_status().json()
    if metadata['issuer']!=ISSUER:raise ValueError('OIDC discovery issuer mismatch')
    return jwt.PyJWKClient(metadata['jwks_uri'],cache_keys=True)
@dataclass
class Context:
    db: object
    tenant: str
    user: str
    role: str
    name: str

def context(authorization: str=Header(default=''), x_workspace_id: str | None=Header(default=None)):
    try:
        token=authorization.removeprefix('Bearer ')
        claims=jwt.decode(token,signing_keys().get_signing_key_from_jwt(token).key,algorithms=['RS256'],audience=CLIENT,issuer=ISSUER,options={'require':['exp','iat','sub']})
    except Exception:
        raise HTTPException(401,'Sign in with the configured OIDC provider.')
    db=Session()
    try:
        user=db.scalar(select(User).where(User.subject==claims['sub']))
        if not user: raise HTTPException(403,'This identity has no workspace membership. Contact an owner.')
        q=select(Membership).where(Membership.user_id==user.id)
        if x_workspace_id: q=q.where(Membership.tenant_id==x_workspace_id)
        member=db.scalar(q.order_by(Membership.created_at))
        if not member: raise HTTPException(403,'Workspace access denied.')
        scope(db,member.tenant_id)
        yield Context(db,member.tenant_id,user.id,member.role,user.name)
        db.commit()
    except Exception:
        db.rollback(); raise
    finally: db.close()

def edit(c):
    if c.role not in ('owner','admin','editor'): raise HTTPException(403,'Editor access required.')
def operate(c):
    if c.role not in ('owner','admin','operator'): raise HTTPException(403,'Explicit operator access required.')
