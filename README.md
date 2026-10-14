# Playground

A local product-validation workspace built from the supplied PRD. Phase 1 includes
Next.js/TypeScript/Tailwind, FastAPI/Pydantic, PostgreSQL, SQLAlchemy/Alembic,
OIDC sign-in, authorized artifact access, and a visibly labeled HireFlow demo.

The complete journey is: describe → confirm brief → approve personas/tasks →
launch demo → inspect step evidence → review findings → draft human verification
→ submit independent local test feedback → review → compare a retest → export report.

## Run locally

Install Node.js 24 and Python 3.14. From this directory:

```powershell
npm ci
python -m venv --without-pip .venv
$env:DISABLE_SQLALCHEMY_CEXT='1'
python -m pip --python .venv/Scripts/python.exe install --no-binary sqlalchemy -r services/api/requirements.txt
npm run local
```

Open [localhost:3000](http://localhost:3000). Choose Alex for the Demo workspace or
Blair for an independent workspace. The local test password is `playground`.
No production credentials, paid providers, or Docker are required for this path.
The launcher migrates and safely seeds PostgreSQL, then starts the API, local OIDC
test provider, and frontend. Data stays in `.local/postgres`; secrets/runtime files
are ignored by Git. Ctrl+C stops the launcher-owned processes.

For Docker Compose, Keycloak, Linux/macOS commands, environment configuration,
and troubleshooting, read [docs/SETUP.md](docs/SETUP.md).

## What the demo means

Runtime demo journeys replay deterministic captures of the owned HireFlow fixture.
They are **not live agent sessions**, fresh executions of customer URLs, recruited
participants, source-backed market research, or evidence of demand. New projects
are real persistent records and return an explicit unavailable state when asked
to use an unimplemented execution integration.

Actual Playwright fixture checks establish the seeded Save failure in A and the
selected fix in B. Real execution engines belong to Phase 2 and have not been
enabled. Credentials alone do not activate an engine.

## Verification

With local services running:

```powershell
npm run typecheck
npm run build
.venv/Scripts/python.exe -m pytest tests/api -q
npm run test:e2e
node tests/fixtures/capture.mjs
```

Run API and browser suites sequentially because both mutate the local Demo workspace.
Tests use installed Chrome; install Chrome or adjust `channel` in Playwright config
to an installed browser. Fixture captures are included under `tests/fixtures/artifacts`
and copied into local storage by the launcher. No Playwright trace is offered as a
customer run artifact.

- [Implementation status and requirements](IMPLEMENTATION_STATUS.md)
- [Phase 2 handoff](PHASE_2_HANDOFF.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Operator runbook](docs/OPERATOR_RUNBOOK.md)
- [Executed verification](docs/VERIFICATION.md)
- [Dependency compatibility](docs/DEPENDENCIES.md)
- [Full supplied PRD](docs/PLAYGROUND_PRD.md)

The supplied remote is `https://github.com/PRABHMANNAT/playground-platform.git`.
Nothing has been pushed, deployed publicly, charged, or sent to participants.
