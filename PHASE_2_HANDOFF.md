# Phase 2 handoff

Phase 1 preserves a real control plane and an explicit deterministic demo adapter.
The local Phase 1 acceptance path has passed; see docs/VERIFICATION.md. Docker/S3
network paths and production operational gates remain unverified.
Do not replace PostgreSQL, migrations, OIDC, contracts or the frontend with a second
implementation. Read docs/PLAYGROUND_PRD.md completely before continuation.

## Existing interfaces

- FastAPI is authoritative; see `/docs`, models.py, schemas.py and generated contracts.
- `services/worker/contracts.py` defines an executor boundary that fails honestly today.
- Accepted demo runs commit plans/sessions/reservations/idempotency/outbox records together.
  Real launch deliberately returns unavailable before creating a fake job or charging.
- `run_events` has stable sequences; history pages and SSE share persisted envelopes.
- Findings and deep links refer to immutable IDs. Artifacts are private, checksummed,
  content-addressed for new demo captures, and retain availability markers.
- Independent written feedback is already assignment-scoped. Consent and frozen submissions
  are separate from moderator outcomes. Reviewed feedback produces a new report version.

## Next vertical slice, after Phase 1 gates

1. Provision Temporal, an isolated worker environment and private artifact storage. Verify
   target control and disposable credentials. Use scoped worker capabilities rather than
   control-plane database credentials or host sockets.
2. Add transactional outbox dispatch with stable workflow/attempt IDs and idempotent handling.
3. Execute one deterministic Playwright journey on owned HireFlow A/B. Capture canonical,
   sanitized step events and screenshots independently of trace collection.
4. Commit artifacts before ready events; deliver actual persisted evidence into the existing
   theatre. Preserve explicit demo/real/replay distinctions.
5. Add atomic tenant/global quotas and budget accounting, bounded activities, cancellation,
   checkpoint/restart recovery and exactly-once settlement.
6. Verify missing coverage, unknown infrastructure outcomes, cross-tenant/assignment/object
   attacks, policy blocks, redaction and evidence deletion before enabling customer targets.
7. Integrate a tested Browser Use adapter with one action owner; only then add bounded
   LangGraph evaluators, accessibility/Lighthouse activities and source-backed retrieval.

## Configuration and blockers

`TEMPORAL_ADDRESS`, `MODEL_PROVIDER`, `MODEL_NAME`, `MODEL_API_KEY`, `SEARCH_PROVIDER`,
`SEARCH_API_KEY`, and private S3 configuration are reserved in `.env.example`. They do not
activate implementations. Model identifiers/rate cards must be validated at implementation
time. No provider tokens were needed or used for Phase 1.

Mandatory real-worker work includes authorized hosts/assets, private/metadata network and
DNS-rebinding defense across subresources/redirects/WebSockets/service workers, deterministic
action gates, prompt-injection boundaries, secret redaction before publication/model calls,
and safe side-effect retry. Do not infer that local Compose networking proves isolation.

The Phase 1 human schema intentionally consolidates screening in audit/assignment records.
Extend profiles/applications/consent history/incentives when operating real studies. Recording
requires an explicitly consented supported recorder; there is no cross-origin iframe recorder.
No email, recruitment message, quote fulfillment, automatic availability, charge or payout
exists. Do not mark an administrative incentive as paid without operator evidence.

Research uses only owned fictional cases. Add sources, entities, claims and source joins
with retrieval/publication dates and fingerprints for real research. Preserve uncertainty;
do not treat a missing website as closure evidence. Synthetic journeys cannot establish demand.

## Verification boundaries

Phase 1 checks do not prove worker restart, egress safety, real-budget exhaustion, remote
uploads/redaction, provider reliability, participant realism or production isolation. Execute
those gates and record evidence before a paid pilot. Docker builds/Compose and S3 network
tests still need a machine with Docker. Keycloak protocol compatibility is separately verified.

Retest classification is currently a deterministic demo fixture rule plus coverage matching.
Replace it with real assertion/evidence matching before using fixed/persistent/regressed/new
labels on real results. Reports must retain source provenance, original versions and evidence
availability gaps. Human agreement needs actual independently reviewed studies.

Keep optional MiroFish/OASIS/Concordia, trained SetFit, a participant marketplace, native apps,
billing and continuous video outside the critical path. No public deployment or paid usage
has been authorized.
