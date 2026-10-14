"""Loopback-only OIDC test issuer. Use Keycloak outside this local test profile.
Authorization Code + PKCE, nonce, single-use codes, RS256 discovery/JWKS.
No production users or credentials are accepted here.
"""
import os, secrets, time, hashlib, base64, html, json
from pathlib import Path
from urllib.parse import urlencode
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt

if os.getenv('APP_ENV','development')!='development':raise RuntimeError('Test issuer disabled outside development')
root=Path('.local');root.mkdir(exist_ok=True)
keypath=root/'oidc-key.pem'
if not keypath.exists():
    private=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    keypath.write_bytes(private.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()))
key=serialization.load_pem_private_key(keypath.read_bytes(),password=None)
jwk=json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(key.public_key()));jwk.update(kid='local-1',use='sig',alg='RS256')
ISSUER='http://127.0.0.1:8001';CLIENT='playground-web'
app=FastAPI(title='Development OIDC test issuer'); codes={}
@app.get('/.well-known/openid-configuration')
def discovery():return {'issuer':ISSUER,'authorization_endpoint':ISSUER+'/authorize','token_endpoint':ISSUER+'/token','jwks_uri':ISSUER+'/.well-known/jwks.json','response_types_supported':['code'],'subject_types_supported':['public'],'id_token_signing_alg_values_supported':['RS256'],'code_challenge_methods_supported':['S256'],'token_endpoint_auth_methods_supported':['client_secret_post']}
@app.get('/.well-known/jwks.json')
def keys():return {'keys':[jwk]}
def validate(p):
    if p.get('client_id')!=CLIENT or p.get('redirect_uri') not in ('http://localhost:3000/auth/callback','http://127.0.0.1:3000/auth/callback') or p.get('response_type')!='code' or p.get('code_challenge_method')!='S256' or not p.get('nonce') or not p.get('state'):raise HTTPException(400,'Invalid local OIDC request')
@app.get('/authorize',response_class=HTMLResponse)
def authorize(request:Request):
    p=dict(request.query_params);validate(p)
    hidden=''.join(f'<input type="hidden" name="{html.escape(k)}" value="{html.escape(v)}">' for k,v in p.items())
    return f'''<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Playground · Local sign in</title><style>body{{font:15px system-ui;background:#f7f6f2;color:#25252b;display:grid;place-items:center;min-height:95vh}}main{{background:white;padding:40px;border:1px solid #e7e5df;border-radius:16px;max-width:380px}}input,select,button{{box-sizing:border-box;width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:8px 0 16px}}button{{background:#7255d9;color:white;border:0;font-weight:600}}p{{color:#6d6b75;line-height:1.6}}a{{color:#7255d9}}</style><main><b>◈ Playground</b><h1>Welcome to your workspace.</h1><p>Local OIDC test provider. These accounts exist only for development.</p><form method="post" action="/authorize">{hidden}<label for="account">Test account</label><select id="account" name="account"><option value="alice">Alex · Demo workspace</option><option value="bob">Blair · Independent workspace</option></select><label for="password">Local password</label><input id="password" name="password" type="password" value="playground" required><button type="submit">Sign in locally</button></form><small>Password: playground · No paid services</small></main></html>'''
@app.post('/authorize')
async def approve(request:Request):
    p=dict(await request.form());validate(p)
    if p.get('password')!='playground' or p.get('account') not in ('alice','bob'):raise HTTPException(401,'Incorrect local credentials')
    code=secrets.token_urlsafe(32);codes[code]={**p,'expires':time.time()+120}
    return RedirectResponse(p['redirect_uri']+'?'+urlencode({'code':code,'state':p['state']}),status_code=303)
@app.post('/token')
async def token(request:Request):
    p=dict(await request.form());data=codes.pop(p.get('code',''),None)
    if not data or data['expires']<time.time() or p.get('client_id')!=CLIENT or p.get('client_secret')!='local-client-only' or p.get('redirect_uri')!=data['redirect_uri'] or p.get('grant_type')!='authorization_code':raise HTTPException(400,'Invalid authorization code')
    proof=base64.urlsafe_b64encode(hashlib.sha256(p.get('code_verifier','').encode()).digest()).decode().rstrip('=')
    if not secrets.compare_digest(proof,data['code_challenge']):raise HTTPException(400,'PKCE verification failed')
    t=int(time.time());claims={'iss':ISSUER,'sub':'local-'+data['account'],'aud':CLIENT,'iat':t,'exp':t+3600,'nonce':data['nonce'],'name':'Alex Chen' if data['account']=='alice' else 'Blair Singh'}
    access=jwt.encode(claims,key,algorithm='RS256',headers={'kid':'local-1'})
    return {'access_token':access,'id_token':access,'token_type':'Bearer','expires_in':3600}
