# Local setup

## Portable development profile (verified on Windows)

Requirements: Node 24, Python 3.14, npm, and Chrome for browser verification.
The embedded-postgres package supplies real PostgreSQL 18.4 binaries. It does not
emulate PostgreSQL, use SQLite, or persist application state in the browser.

Use the installation commands in the root README, then `npm run local`.
The launcher reads an optional root `.env` and propagates settings to its child
processes. It starts only the owned local services. Existing seed/data is retained.
Local role credentials are illustrative development values and must not be reused
outside loopback development.

| Service | Local address | Data |
|---|---|---|
| Next.js | http://localhost:3000 | Server session cookie; no browser-authoritative data |
| FastAPI | http://127.0.0.1:8000 | PostgreSQL application role |
| API docs | http://127.0.0.1:8000/docs | Generated OpenAPI |
| PostgreSQL | 127.0.0.1:54329 | `.local/postgres` |
| Test OIDC issuer | http://127.0.0.1:8001 | `.local/oidc-key.pem`, test identities only |
| Artifacts | Authorized `/api/v1/artifacts/{id}/access` | `.local/artifacts` |

The built-in issuer is an explicitly labeled development test service implementing
discovery/JWKS, Authorization Code + S256 PKCE, nonce, single-use codes and RS256
JWTs. It is disabled if APP_ENV is not development. It is not a production identity
provider. Actual Keycloak compatibility was also checked; use the profile below
when exercising the intended identity service.

For Linux/macOS, replace `.venv/Scripts/python.exe` with `.venv/bin/python` and use
`DISABLE_SQLALCHEMY_CEXT=1 python -m pip --python .venv/bin/python install --no-binary sqlalchemy -r services/api/requirements.txt`.
These alternate OS commands were documented, not executed on this Windows host.

## Compose dependencies / Keycloak profile

Stop portable PostgreSQL first; both profiles use the same local port. Keep their
data separate; Compose volumes do not replace `.local/postgres`.

```powershell
docker compose -f infra/compose.yaml up -d
$env:PYTHONPATH='services/api'
$env:OIDC_ISSUER='http://localhost:8080/realms/playground'
$env:OIDC_CLIENT_ID='playground-web'
$env:OIDC_CLIENT_SECRET='local-client-only'
.venv/Scripts/python.exe -m alembic -c services/api/alembic.ini upgrade head
.venv/Scripts/python.exe -m playground.seed
.venv/Scripts/python.exe -m uvicorn playground.main:app --host 127.0.0.1 --port 8000
```

In another terminal, set the same OIDC variables before `npm run dev` (or put them
in `apps/web/.env.local`). Sign in with `alice` / `playground` or `bob` / `playground`.
The imported user subjects match the explicit local seed. If a provider uses
different subjects, provision its exact subject through an owner/admin membership
grant or a privileged migration/seed. Never trust a client-supplied tenant ID.

Keycloak uses a local development database in this profile, independent of the
application PostgreSQL schema. Production Keycloak storage/TLS and operations are
separate deployment work. Docker itself is unavailable on the implementation host;
the Compose file and container builds were not executed. Keycloak 26.8.1 was instead
run from its official distribution with a portable JDK 21 and its sign-in/API path
was executed. MinIO/S3 network access remains unverified.

## Environment

Copy `.env.example` to `.env` for the launcher. For individually launched services,
export variables in each terminal; FastAPI does not automatically read a root env
file. Next.js reads `apps/web/.env.local` when launched separately.

`DATABASE_URL` is the non-owner app role. `MIGRATION_DATABASE_URL` is privileged and
belongs only in migration/operator contexts. Do not give it to workers or browsers.
Set a randomly generated SESSION_SECRET of at least 32 characters. The fallback
secret and client credential exist only when NODE_ENV is development. Production
session cookies require HTTPS. The server verifies ID-token issuer/audience/nonce;
the API verifies access-token signature/issuer/audience/expiry and membership.

`ARTIFACT_BACKEND=local` is sufficient for the demo. An S3 adapter is supplied for
Phase 2 with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
Use private buckets, scoped credentials and short-lived access. Local access streams
authorized bytes, with explicit pending/deleted/unavailable states. Physical retention
purge, remote uploads and provider deletion verification remain Phase 2 tasks.

The reserved Phase 2 variables are TEMPORAL_ADDRESS, MODEL_PROVIDER, MODEL_NAME,
MODEL_API_KEY, SEARCH_PROVIDER and SEARCH_API_KEY. Leaving them empty is expected.
Supplying them does not implement the missing engines. Follow PHASE_2_HANDOFF.md.

## Migrations, seeds and contracts

```powershell
$env:PYTHONPATH='services/api'
.venv/Scripts/python.exe -m alembic -c services/api/alembic.ini upgrade head
.venv/Scripts/python.exe -m playground.seed
npm run contracts
```

Migrations own the schema. Revision 0001 uses a frozen SQLAlchemy baseline; later
revisions add invitation RLS, unique build references and append-only permissions.
The application never calls create_all on startup. Local seeds are explicit,
repeatable, and refused outside development. Refresh/restarting services preserves
records. Generated contracts are checked in; regenerate after API schema changes.

## Troubleshooting and shutdown

- Port already in use: stop the old launcher/owned services before starting another.
- A native SQLAlchemy DLL is blocked: use the documented supported pure Python build.
- Evidence pending: ensure fixture captures were copied or run the capture script,
  then create a new demo run. Old missing evidence stays an honest gap.
- Unknown OIDC subject: an owner must grant membership for that exact subject.
- Expired/revoked invitation: create a new assignment; submitted observations remain frozen.
- Run tests sequentially. API tests intentionally include missing-coverage and cap fixtures;
  use Restore sample defaults in the plan editor before the full demonstration.
- The initial Windows database locale was ANSI; `infra/ensure-utf8.py` repairs only an
  empty local database and explicitly refuses to recreate one with application records.

Ctrl+C stops the launcher. It retains PostgreSQL and artifact files. Compose shutdown
is `docker compose -f infra/compose.yaml stop`; avoid deleting volumes containing data.
