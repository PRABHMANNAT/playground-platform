# Local operator runbook

## Identity and membership

Sign in through the configured OIDC issuer. Owner/admin users can grant a role to an
exact subject in Settings. Keep at least one owner. Operator access is explicit,
workspace-scoped and audited; participant invitations are not memberships.

Local Keycloak fixture subjects `local-alice` / `local-bob` were verified with 26.8.1.
Keycloak warns that these non-UUID development IDs may not survive a future migration.
Before a production identity rollout/upgrade, migrate fixture subjects to proper provider
IDs with explicit mappings, preserving Playground user/member/project IDs. Do not reset
tenant ownership or silently bind identities by email.

## Studies

Create or edit a neutral draft before assigning anyone. Request a quote only as an
administrative record; no fulfillment service is connected. Screen manually, record the
decision, create a pseudonymous scoped invitation, and share it manually. The token is
shown once, stored only as a hash, and expires after seven days. No email is sent.

Assigned task/build/instructions cannot be edited. Create a new study for changed scope.
Revoke invitations when access should end. Participants consent to written feedback;
there is no recording. Review self-report separately from observed/recording-backed
evidence. Reviews are frozen and publish a new report version; original versions remain.
Draft cancellation retains records. Assigned studies retain submissions rather than
being deleted. Incentive amounts are proposed/pending administrative data, not payouts.

## Evidence and retention

Authorized access is through an artifact ID. Local files/private S3 keys are not durable
public URLs. New sample captures are content-addressed. Pending, unavailable, expired
or deleted evidence does not remove the linked finding. DELETE artifact removes access;
physical purge and automated retention are deferred. The retention preference in Settings
is persistent but does not imply an active purge job.

Only approved fixture files are captured in Phase 1. Production redaction, quarantined
traces, remote uploads, object deletion verification and backup/restore drills are release
gates. Never describe a test trace as customer-run evidence or a Browser Use trace.

## Service recovery

Start using `npm run local`; it reapplies pending migrations and safely skips existing
seeds. If services were stopped, use the same data directories. Run the health endpoint
and reopen the run: it reconciles persisted state and resumes demo progression without
new submission. SSE reconnect uses sequence cursors; viewing/reconnection does not cancel.

Run `npm run launcher:check` only when other owned local services are stopped. It starts
and stops its own instances. Run integration/browser suites after starting services again.
Do not run mutation suites concurrently against the same Demo workspace.

## Backup and restore (documented, not executed)

With the Compose profile and a trusted operator terminal, use the PostgreSQL image's
`pg_dump -Fc` against `playground`, save the dump to operator-controlled storage, and
back up private artifact bytes plus `.local/oidc-key.pem` only for the local test profile.
Do not put backups or private keys into Git. Use privileged credentials only for this
operator task, never for application/browser workers.

Restore with `pg_restore` into a separately named empty database, grant the non-owner
application role, apply pending Alembic migrations and verify project counts, memberships,
finding links, artifact checksums and report versions before switching connections.
Do not overwrite the working database without a verified recovery plan. Preserve
deleted/expired evidence markers and participant consent/retention obligations.

The portable PostgreSQL package on this host does not include dump/restore client binaries.
Docker/backup restore was not exercised here. A successful restart/persistence check is
not a backup/restore drill or production durability guarantee.
