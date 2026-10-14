# Playground implementation status

Updated: 14 October 2026. Phase 1 is implemented and verified on the local profile.
Phase 2 real execution engines have not been implemented or enabled.

## Requirements

| ID | Implementation | Mode / verification |
|---|---|---|
| PG-01 | Persisted messages and draft autosave; editable versioned confirmed briefs | Real CRUD; browser and API checks |
| PG-02 | Filterable case table and source inspector with owned fictional notes | Demo; real retrieval unavailable |
| PG-03 | Versioned editable personas/tasks/builds/viewports/permissions/caps; approval gate | Real persistence; synthetic persona hypotheses |
| PG-04 | Idempotent launch, changed-payload conflict, one reservation and settlement | Demo launch; real worker returns unavailable |
| PG-05 | Persisted session rail, captured fixture image sequence, queued/pass/fail/unknown/canceled states | Demo; owned fixture interactions executed |
| PG-06 | Run/session/step deep links; seek, replay, follow latest, speed, keyboard timeline | Browser journey verification |
| PG-07 | Observation/interpretation/support/recommendation, category filtering, reviews and annotations | Persistent real review records; demo findings |
| PG-08 | Neutral study drafts, manual screening/assignment, expiring hash-token invitations, consent, frozen feedback and moderation | Local test feedback; no recruitment/payment/recording |
| PG-09 | Immutable A → B retest, task/persona/viewport/milestone comparison, missing coverage untested | Demo fixture comparison |
| PG-10 | Frozen browser/audit report, later reviewed-feedback version, JSON/print export | Demo with separate local-feedback provenance |
| PG-11 | Database-backed recovery, resumable ordered SSE/dedup and snapshot reconciliation | API concurrency/cursor checks and browser refresh |
| PG-12 | Visible Demo banners; unavailable engines; pending/deleted gaps; no fake human/market claims | Across the UI and API |

## Working foundation

- Requested monorepo directories, setup/environment examples, PostgreSQL bootstrap,
  four Alembic revisions, generated API contracts and local application shell.
- OIDC discovery, PKCE/state/nonce, encrypted server session, JWT validation and membership.
- Tenant RLS, composite foreign keys, scoped invitations, append-only snapshots and reviews.
- Persistent projects, builds, briefs, plans, study requests, reviewer notes, membership grants,
  retention preferences, runs/events/artifact metadata and immutable reports.
- Premium light UI with navigation, responsive theatre, sample fixture, participant portal,
  manual operations, research inspector, reports and before/after comparison.

## Demo / unavailable / deferred

Only owned deterministic HireFlow captures are replayed. Real execution, search/model
providers, durable dispatch, automatic recruitment, recording and payments are unavailable.
S3 has an interface; local storage is exercised. Compose/container/MinIO operation remains
unverified because Docker is absent. Keycloak itself was run and its token/API path checked.

Provider isolation, redaction, live artifact uploads, quotas, real recovery/cancellation,
expanded research/human operational schema, restore drills and deployment hardening belong
to Phase 2 and pilot/production gates. No production-readiness claim is made.

Executed results: production/type builds passed; seven API integration checks,
three browser checks, eight controlled fixture combinations/32 captures, actual
Keycloak protocol/API compatibility, fresh four-revision migration/repeated seeds,
and the one-command local startup/lifecycle check passed. Screens at 1440, 1024 and
390 were inspected. Tested workspace accessibility scans have zero violations;
browser runtime errors were empty. See docs/VERIFICATION.md for precise coverage.
