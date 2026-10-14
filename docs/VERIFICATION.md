# Executed Phase 1 verification

Date: 14 October 2026. Host: Windows, Node 24.18.0, Python 3.14.6, actual PostgreSQL 18.4.
All browser tests use installed Chrome and local services. No paid provider was invoked.

| Check | Executed result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run build` | Passed; Next.js production build and all routes generated |
| `python tests/migrations_smoke.py` (repository venv) | Fresh UTF8 database, 31 tables including Alembic, revisions 0001–0004; migrate/seed twice without duplicate sample projects |
| `python -m pytest tests/api -q` (repository venv) | 7 integration tests passed; final study CRUD checks included |
| `npm run test:e2e` | 3 browser tests passed: complete demo journey, real CRUD/unavailable execution, responsive accessibility QA |
| `node tests/fixtures/capture.mjs` | 8 owned fixture combinations verified (A/B × two tasks × two viewports), 32 captured step images |
| `node tests/keycloak-smoke.mjs` | Actual Keycloak 26.8.1 authorization code + PKCE, audience, subject mapping, discovery/JWKS signature and API membership verified |
| `npm run launcher:check` | Documented startup reaches API/web/OIDC health, then stops its child processes |
| Browser runtime errors | `docs/verification/browser-errors.json`: empty array |
| WCAG automated UI checks | Zero violations for tested tags/screens at 1440 and 390; keyboard focus visible |

The browser journey describes the product, saves/confirm a brief, restores/reviews/approves
the 24-journey plan, launches a demo, pauses replay while progression continues, seeks
the failed Save, saves an annotation, opens/reloads the exact finding URL, reviews it,
drafts a neutral study, creates an invitation, consents/submits independent local test
feedback, moderates it, exports the separate v2 report, runs B, and inspects the comparison.
Research filtering/source inspection and integration readiness are exercised too.

Real-project checks create/edit a project and plan, refresh/reconnect, verify PostgreSQL
persistence, then confirm that a real launch returns unavailable without creating results
or spending. API checks cover two-tenant attacks, viewer/operator permissions, invitation
scope/consent/frozen submission/revocation, idempotent concurrent submission, changed-key
payload conflict, exactly-once demo settlement, cancellation, annotations/reviews, private
artifact access/deletion, report versions, action caps, missing coverage, missing storage
credentials, draft-study edit/freeze rules, and resumable SSE with concurrent API health.
Changed task assertions also remain untested rather than becoming false fixes.
Unsupported custom assertions in demo playback are UNKNOWN/POLICY, never fabricated
successes. Focused checks were rerun after that guard and evidence-integrity checks.

Build B's owned fixture Save returns 201 and the newly created job is asserted in its
overview. A returns the intentional 500. Application confirmation works in both. Fixture
data is disposable browser-session data; Playground application records are database-backed.
No check claims fresh worker execution or real participant feedback from these captures.

## Rendered inspection

Screenshots were inspected and the UI corrected for contrast, mobile navigation/layout,
replay semantics and draft/retest submission races. The current files are:

- `verification/overview-1440.png`
- `verification/theatre-1440.png`, `theatre-1024.png`, `theatre-390.png`
- `verification/participant.png`, `report.png`, `comparison.png`
- `verification/accessibility.json` and `browser-errors.json`

The accessibility audit covers Overview, Test Plans, Theatre and Settings, WCAG 2 A/AA
and 2.1 AA tags. It is automated QA for these screens, not accessibility certification
or an audit of a customer product. No horizontal document overflow was observed at
1440, 1024 or 390. Mobile has a session list/grid, full-width viewer, original-frame
access and a collapsible inspector drawer.

## Problems found and fixed

- Windows blocked a SQLAlchemy native extension; switched to its supported pure Python build.
- Initial Windows locale created an ANSI database; recreated only the empty database as UTF8.
- A strict project response rejected its extra tenant field; corrected the response model.
- SSE performed blocking database reads on the event loop; moved them into a thread and
  bounded database waits, then verified concurrency and cursor recovery.
- Review completion and retest submission could race navigation; guarded state and controls.
- Text contrast and timeline semantics failed automated checks; corrected and reran them.
- Capture metadata updates conflicted with append-only permissions; moved metadata into
  the initial insert. Unknown sample interruptions no longer show a successful final image.
- Strengthened the saved-job fixture assertion and corrected the Save finding wording.
- Disabled raw API/web access logs for the local profile to avoid recording invitation URLs.

Interim failures were repaired and successful checks rerun. One API invocation occurred
after the lifecycle check had stopped its services; restarting the documented launcher
resolved that setup error. Starlette's TestClient/httpx deprecation warning remains visible.

## Verification limits

Docker Compose/container builds and MinIO/S3 network operations were not executed (Docker
is absent). Keycloak was tested from a portable official distribution instead. Production
TLS, secrets rotation, restore drills, data purge, real worker recovery/termination, egress
policy/redaction, provider costs and independently recruited studies are unverified Phase 2
or release gates. Credentials alone do not activate a missing engine.

Actual paid-provider cost was zero. CPU/storage cost and pilot latency/quality metrics were
not measured; no achieved benchmark, demand score, conversion lift or human agreement rate
is claimed. No public deployment, remote push, recruitment message, charge or payout occurred.
