# Playground — Product Context, Live Testing Theatre PRD, and Codex Master Prompt

Version 1.0 | 14 October 2026 | Prepared for Prabhmannat Singh

## How to use this file

Attach this entire file to Codex, or place it in the repository as docs/PLAYGROUND_PRD.md. Paste the complete prompt in Part B into Codex. Part A is the feature PRD; Appendix C preserves the previously prepared full product architecture and two implementation prompts. The feature adds to the product rather than replacing the original scope. No existing feature implementation has been inspected or verified for this document.

If starting from an empty repository, build the platform foundation and the theatre together in the two phases below. If Playground already exists, integrate the theatre into the existing product and reuse working identity, storage, jobs, reports and UI components. Do not rewrite an existing application simply to match an example directory structure.

# Part A — Product requirements document

## A1. Product context

Playground helps founders and product teams reduce uncertainty before building, launching or changing products. It serves three stages: idea-only, browser-accessible prototype, and launched product/new feature. It offers AI validation, targeted human validation and hybrid validation.

The founder starts in a conversational interface. Playground asks follow-ups about the customer, problem, alternatives, market, workflow and decision, then creates an editable brief. The market engine researches competitors and relevant historical startup cases. The browser engine attempts real tasks on an authorized test build. The human engine recruits suitable people to independently test the same assumptions. The report distinguishes these evidence sources and proposes the next experiment or product change.

For idea-only projects, research and discovery interviews are available; browser execution needs a testable target. First-release product testing is web/SaaS only. Native apps, automatic participant marketplaces, population simulations and advanced persona memory are later work.

The proposed $50 initial AI report and $10/month saved-context/Q&A subscription are pricing hypotheses with strict usage boundaries. Human incentives, recruitment and moderation are separately quoted. Synthetic task outcomes do not establish willingness to pay or market demand.

## A2. Signature feature: Live Testing Theatre

Working feature name: **Live Testing Theatre**.

Product promise: **Watch a product journey, jump to the exact failure, and verify the fix.**

A founder sees several AI personas attempting approved workflows in isolated browsers. Selecting a session opens a large evidence viewer with the recorded steps. A detected issue links to the precise observation that supports it. The founder can request an independent human test of that task, then compare a later build against the original journey.

The emotional payoff is concrete: the founder watches an application fail to complete a real task, inspects the evidence, and later sees the same task succeed after a fix. Visual drama comes from the product behavior and the comparison, not invented emotions, fake testimonials or a fabricated crowd of users.

## A3. Users, jobs and access

| User | Job | Access |
|---|---|---|
| Founder/product owner | Configure validation, inspect evidence, prioritize changes | Authorized project data and permitted actions |
| Team reviewer | Review findings, annotate steps and compare builds | Membership-scoped project access |
| Participant | Complete assigned tasks and give independent feedback | Own assignment, consent and submission only |
| Study operator | Screen/assign participants and review submissions | Explicit operational grants; access audited |

MVP permissions: owner/admin manage members and limits; editor creates plans/runs/studies; viewer reads permitted evidence; participants have assignment grants, not general workspace membership. Operations access is explicit and logged rather than an unrestricted default.

## A4. User journey and requirement IDs

| ID | Requirement | Acceptance behavior |
|---|---|---|
| PG-01 | Guided intake | Answers persist; founder can edit/confirm a versioned brief |
| PG-02 | Research context | Competitor/case claims link to sources; uncertainty remains visible |
| PG-03 | Plan approval | Founder sees target/build, personas, tasks, limits, permissions and journey count |
| PG-04 | Run launch | Idempotent submission creates one run and reserves budget once |
| PG-05 | Session theatre | Tiles reflect persisted session state and actual captured evidence |
| PG-06 | Focused replay | Click step/finding to open the matching session and evidence moment |
| PG-07 | Finding review | Reviewer sees observation, interpretation, support status and proposed fix |
| PG-08 | Human verification | Study request inherits task/build context without exposing AI conclusions to participants |
| PG-09 | Version comparison | New build is compared by task milestone and outcome; missing coverage is untested |
| PG-10 | Combined report | AI, audits and human evidence remain distinct; report versions are preserved |
| PG-11 | Persistent recovery | Refresh/reconnection restores state without restarting a run |
| PG-12 | Honest modes | Demo, real execution, replay and unavailable integrations are visibly distinct |

## A5. Theatre visual specification

Use a premium, quiet product workspace: warm off-white shell, near-black typography, violet primary actions, mint success accents and an optional charcoal evidence stage. Prefer existing brand tokens if the repository already has a coherent identity. No oversized marketing hero inside the app, ornamental globe, meaningless particle swarm, or invented metrics.

Desktop layout:

- Compact left navigation: Overview, Research, Test Plans, Theatre, Findings, Human Studies, Reports, Settings.
- Top bar: project/build, run state, completed/total journeys, configured spend limit, actual or provisional spend, and cancel action.
- Session rail or grid: 2–4 active browser previews on common desktop layouts; additional sessions are queued, collapsed or paginated rather than continuously streamed.
- Main stage: selected screenshot sequence or supported recording; browser viewport boundary, sanitized URL, current task and frame timestamp.
- Evidence inspector: observed action, result, assertions, related findings and reviewer annotations.
- Bottom timeline: milestones, captured steps, supported finding markers, current selection, playback controls and return-to-latest action.

Each session tile includes persona label, role, task, viewport, status, step count and last evidence time. Persona icons are stylized and identified as synthetic; they must not look like real recruited participants. A preview with no captured image shows awaiting evidence rather than a made-up web page.

Mobile: list sessions, select one full-width viewer, move the inspector into a drawer, and keep primary controls reachable. Target layouts at 1440, 1024 and 390px; maintain visible keyboard focus, status text, accessible timeline controls and reduced-motion behavior. Avoid shrinking a desktop control room into illegible mobile cards.

Use brief opacity/position transitions for actual state changes. Do not animate fabricated browsing, inject random progress percentages or display an ETA before a defensible estimate exists.

## A6. Evidence viewing and interaction semantics

MVP live mode is **near-real-time step screenshots plus persisted events**. It is not guaranteed continuous video. Label the feed accordingly and show last capture time and stale/disconnected states. Continuous browser video/WebRTC is outside the initial acceptance gate.

The viewer supports follow-latest, pause playback, step backward/forward, seek to a finding and replay captured steps at selected playback speeds. Pausing the viewer never pauses browser execution or spending. Label the control Pause replay; keep Cancel run separate. Viewing older steps while a run continues shows an explicit replay state and a Return to latest button.

A finding deep link includes immutable run, session and step IDs. Reopening the URL restores that exact evidence location after authorization. Never expose signed storage URLs as durable identifiers. If the artifact expired or was deleted, preserve the finding and display the evidence availability gap.

If click coordinates exist, position markers relative to original viewport dimensions and scale correctly. Do not invent click locations from a vague textual action. Capture metadata must say whether a frame is before or after an action so failures map to the right moment.

Display concise action summaries grounded in events, such as Attempted Save; server returned 500. These are not hidden model reasoning or actual customer thoughts. Avoid unsupported emotional narration such as the user is frustrated. Human quotes must come from consented submissions and retain their context.

## A7. Events, state and persistence

The run lifecycle is DRAFT → VALIDATED → QUEUED → RUNNING → ANALYZING → NEEDS_REVIEW when applicable → COMPLETED. FAILED and CANCELED retain partial results. Persist cancellation requested_at separately until termination is acknowledged. Human studies have independent status so recruitment does not block the AI report.

Journey outcomes: PASS, FAIL, UNKNOWN. Failure reasons: PRODUCT, AGENT, INFRASTRUCTURE, POLICY. Demo fixtures can display these states, but real projects must receive them from real execution.

An example event contract, to adapt to the repository:

```json
{
  "schema_version": "1",
  "event_id": "uuid",
  "tenant_id": "uuid",
  "run_id": "uuid",
  "session_id": "uuid-or-null",
  "attempt_id": "uuid-or-null",
  "run_sequence": 42,
  "session_sequence": 8,
  "event_type": "step.completed",
  "occurred_at": "ISO-8601",
  "persisted_at": "ISO-8601",
  "payload": {
    "step_id": "uuid",
    "action_type": "click",
    "summary": "Attempted to save the job posting",
    "artifact_ids": ["uuid"],
    "outcome": "error"
  }
}
```

Suggested event types: run.queued, run.started, session.started, step.started, step.completed, artifact.ready, finding.created, session.finished, usage.updated, run.cancel_requested, run.canceled, run.completed, run.failed. Publish artifact.ready only after storage and metadata are committed; the UI may show an evidence-pending placeholder meanwhile.

SSE uses persistent run_sequence IDs, reconnect cursors and heartbeat handling. Deduplicate by event_id and reconcile gaps with authoritative snapshot endpoints. Never rely on arrival timestamps to order concurrent sessions. A viewer disconnect does not cancel execution. Persist events before broadcast; use pagination and backpressure to avoid holding an entire long run in browser memory.

Reuse platform tables for tenants, projects, builds, personas, plans, tasks, runs, sessions, steps, artifacts, findings, studies, observations, reports and usage. Add only necessary fields/tables for evidence annotations, milestones, comparison mappings and viewer preferences. Viewer preferences cannot alter execution state. Keep SQLAlchemy/Alembic as the schema owner for a new project; preserve an established schema owner in an existing repository unless a migration is demonstrably necessary.

## A8. Human verification

The Verify with humans button creates a draft study containing the selected task, target audience, permitted build, neutral instructions and observed evidence for staff review. It does not claim a human is instantly available or charge an incentive automatically.

Staff screen and assign participants manually at first. Participants consent, attempt neutral tasks and submit independent observations before seeing AI findings. Recording requires an installed owner-controlled recorder or separately consented participant recording; cross-origin iframe access must not be assumed.

Show self-reported outcome, moderator-observed outcome and recording-backed evidence separately. Classify comparisons as supported, contradicted or inconclusive. A human success on a changed build is evidence about that new task/build; it does not automatically invalidate the original bug or prove the entire product is fixed. Likewise, a task completion does not prove the absence of usability friction.

## A9. Retest and before/after comparison

Create a new run with an immutable new build reference. Preserve the baseline plan/persona/task snapshots and record intentional differences. Prefer the same task, viewport and reset fixtures for comparable journeys; disclose environment differences and stochastic execution limits.

Align journeys by semantic milestones such as opened signup, submitted form and reached confirmation rather than assuming equal timestamps or action counts. Provide linked milestone navigation and independent playback when automatic alignment is unavailable. Show outcomes, action counts, blockers and evidence quality. Agent duration is labeled execution duration, not human time saved.

Finding comparison labels:

- Fixed in this retest: relevant reproduction was exercised and the specific failure no longer occurred under documented conditions.
- Persistent: the same supported problem recurred.
- Regressed: a previously passing supported check now fails.
- New: newly observed issue without an earlier matched finding.
- Untested: missing coverage, blocked execution or incomparable evidence.

Human verification status is an additional dimension, not a replacement for these labels.

## A10. Backend architecture and controls

Preferred greenfield stack: Next.js/TypeScript application; FastAPI/Pydantic API; PostgreSQL/SQLAlchemy/Alembic; Keycloak OIDC; S3-compatible artifacts; Temporal durable orchestration; LangGraph bounded agent loops; Browser Use adapter and Playwright execution/assertions; axe-core and Lighthouse audit activities.

API commits runs and outbox events transactionally; dispatcher starts idempotent workflows; activities execute on scoped workers; events and artifacts return to persistence; SSE updates the theatre. The four evaluators consume shared evidence and do not compete to control the browser. Browser Use integration must be tested explicitly; maintain canonical Playground step evidence even when Playwright traces omit external actions.

Default execution envelope: 6 personas × 2 tasks × 2 viewports = 24 journeys, at most 4 concurrent browsers per run, 25 actions and 180 seconds per journey, subject to tenant/global caps. Budget reservations must cover concurrent work and reconcile actual use exactly once. Defaults are configurable limits, not representative sampling claims.

Execute only authorized targets with test data, disposable browser state, safe account fixtures and deterministic action gates. Isolate untrusted browser execution from control-plane secrets. Enforce network policy across requests, redirects, subresources and alternative browser connections; block private/metadata networks and rebinding. Treat page text as untrusted data. No real purchases, destructive actions, external messages or CAPTCHA bypass.

Redact sensitive data before model calls and artifact publication. Secret-bearing traces must be quarantined or disabled if safe redaction is unavailable. Protect tenant boundaries in API requests, background jobs, joins, SSE and signed artifact access. Participant access is assignment-scoped. Retention/deletion must leave meaningful unavailable-evidence markers in reports.

MiroFish/OASIS/Concordia remain optional research adapters; SetFit is deferred until useful labels exist. No theatre rendering dependency on those projects. Advanced social simulation belongs in a separately labeled and budgeted experiment.

## A11. Demo scenario

Create an owned local recruitment-SaaS fixture called HireFlow Demo. Clearly mark the product and results as illustrative. Include a working job-creation path, an intentionally broken Save action, a form with an accessibility defect, and a missing nonessential disclosure as a heuristic example.

Provide version A with seeded defects and version B with selected fixes. Deterministic browser tests must actually interact with the fixture; a frontend-only demo may replay seeded fixtures only under the Demo banner. A human-study fixture is labeled sample feedback and is never presented as a real participant result.

Demonstration sequence: confirm brief → approve plan → launch → focus a session → inspect failed Save → open finding → draft neutral human study → run fixed build → compare milestone/outcome → inspect report provenance.

## A12. Delivery phases and acceptance

Phase 1: application foundation, real persistent CRUD/auth, theatre UI, event contracts and labeled deterministic demo, findings deep links, study request/participant portal and comparison layout. End with a phase handoff stating real versus demo behavior.

Phase 2: real research/browser execution, durable scheduling, redacted artifact publication, streaming events, independent human submission/review, retest matching, report versions, quotas and recovery. End with executed verification evidence and clearly named deployment blockers.

| Test | Required outcome |
|---|---|
| Launch twice with the same request key | One run and one budget reservation |
| Change payload under an existing key | Conflict, not an ambiguous duplicate |
| Pause replay while a run is active | Viewing pauses; execution status/spending remains explicit |
| Disconnect and reconnect viewer | Missing persisted events restored without duplicate steps |
| Open finding deep link | Correct authorized session/step selected |
| Artifact still uploading or removed | Honest pending/unavailable state |
| Browser/agent outage | UNKNOWN where success or product failure cannot be established |
| Cancel during concurrent work | Dispatch stops, workers terminate, partial evidence survives, settlement once |
| Tenant or participant access attack | Access rejected across API, SSE, objects and assignments |
| Human task delivery | Neutral instructions; AI findings hidden before submission |
| Retest without task coverage | Untested, never fixed |
| Seeded bug fixed in version B | Real assertions and evidence show the supported difference |

Pilot instrumentation: supported finding rate on reviewed fixtures, unknown rate, evidence-link completeness, event-to-display latency, cancellation latency, direct cost/run and repeat testing. Define event-to-display latency as persisted event timestamp to client display timestamp with clock caveats; do not call a low latency achieved until measured. Track time-to-first-useful-finding from accepted run to first reviewed actionable finding. Report sample counts and exclusions. Human agreement must use actual independent reviewed studies.

Proposed release targets, subject to measurement: every published factual finding has accessible evidence or an explicit retention marker; zero cross-tenant access in the test matrix; no false fixed classifications in known missing-coverage fixtures. Do not turn these targets into achieved metrics in marketing.

## A13. Source reconciliation

The supplied detailed architecture defines browser evidence as the primary testing substrate, four evaluators, independent human evidence, budgets, cancellation and versioned reports. The shorter technical brief provides the initial platform and ecosystem summary. The uploaded image repeats the ecosystem shortlist. The pasted product context adds idea/prototype/live entry points, market intelligence, targeted recruitment and recurring validation.

This PRD adds the live theatre interface, precise playback semantics, event ordering, findings deep links and milestone-based comparison. These are new proposed requirements, not descriptions of shipped capabilities. The complete prior build brief is retained in Appendix C. Where this feature specifies narrower behavior, use it for the theatre while preserving the broader product requirements. If existing repository constraints conflict, document the decision instead of silently dropping functionality.

# Part B — Complete Codex master prompt

Copy everything between START PROMPT and END PROMPT into Codex with this document attached or available at docs/PLAYGROUND_PRD.md.

## START PROMPT

Act as my senior product designer, full-stack engineer and agent-systems engineer. Implement Playground with its signature Live Testing Theatre feature. The attached Playground_PRD_and_Codex_Master_Prompt.md is the implementation brief: Part A is the PRD and Appendix C contains full platform context and the original two-phase build specifications. Read the complete document and repository instructions before coding. Do not assume any integration described in the documents is already shipped.

If the file has not been placed in the repository, use the attached copy and save an appropriate project documentation copy. If neither is accessible, state the missing context rather than pretending to have read it. If additional source PDFs are present, consult them for context; the consolidated PRD is sufficient to begin when they are not.

PRODUCT CONTEXT

Playground is a validation workspace for ideas, web prototypes and new features. A founder describes their product in a conversational interface, answers useful follow-ups, confirms a brief, researches competitors and historical startup cases, approves a bounded test plan, observes real AI browser journeys, optionally commissions targeted human studies, and receives a report linking findings to evidence. Subsequent builds are retested. Idea-only projects receive research/discovery studies until a browser-accessible product exists.

The signature experience is: submit product → watch personas attempt actual tasks → click a finding to see the exact evidence → request independent human testing → compare the original and fixed builds. Clearly distinguish sourced facts, automated audit findings, agent observations, human observations and hypotheses. No synthetic market-success score or invented human behavior.

WORKING APPROACH

Inspect the repository, available services, migrations and test commands. Identify what already works. Produce a short implementation plan and then execute it. Reuse the existing architecture when sound; do not replace working identity, persistence or jobs merely to match a preferred stack. Preserve unrelated changes. Make routine decisions without repeatedly asking for confirmation. Do not deploy publicly, send recruitment messages, charge users or spend money without applicable authorization.

Maintain IMPLEMENTATION_STATUS.md and a requirement-to-implementation matrix covering PG-01 through PG-12. Track working, demo, blocked and deferred behavior separately. Continue through both phases when possible; if credentials or services are missing, complete the unblocked work and expose an honest integration state. Never swap fake success into a real workspace.

PHASE 1: PREMIUM WORKSPACE, REAL DATA AND PLAYABLE THEATRE

Implement the broader product foundation specified in Appendix C: projects, conversational intake, editable briefs, research workspace, personas/tasks, test plans, findings, human-study operations, participant portal, reports and settings. Add the theatre as the central run experience. Use real database-backed CRUD and authorization from the start. In a greenfield repository use Next.js/TypeScript/Tailwind, FastAPI/Pydantic, PostgreSQL with SQLAlchemy/Alembic, OIDC identity and an artifact-storage abstraction. Generate or validate typed frontend contracts from the API. Do not introduce two schema owners.

Design a polished workspace with off-white surfaces, near-black text, violet actions, restrained mint accents, a compact sidebar, a large selected browser stage, a session rail/grid, a useful inspector and a scrubbable evidence timeline. Existing coherent brand tokens take priority. Make layouts work at 1440, 1024 and 390px. Use keyboard navigation, visible focus, accessible status labels and reduced-motion behavior. Build useful hierarchy and interactions rather than decorative dashboards or a marketing-only landing page.

Implement session selection, follow-latest, pause replay, next/previous step, seek-to-finding, inspector tabs, filtering, reviewer annotations, cancelled/failed/empty states and return-to-latest. Pause replay must not pause execution; show that distinction in the controls. Do not implement an execution-pause button unless its durable backend semantics actually exist.

Persist IDs and deep links so a finding reopens its exact run/session/step. Screenshots must preserve viewport scale and capture timestamps; markers are rendered only from actual recorded coordinates. Display action summaries based on captured events, not fabricated customer thoughts or hidden model reasoning.

Build the deterministic HireFlow Demo scenario described in the PRD. All seeded research, persona journeys and sample human feedback stay visibly marked Demo. A real workspace without a worker must show unavailable execution. Sample interfaces cannot be represented as evidence captured from a submitted target.

Create or extend relational entities for run/session/step events, artifact states, annotations, milestones and comparisons. Reuse existing platform entities for findings, studies, reports and usage. Add tenant-scoped constraints, indexes, migrations and repeatable local seeds. Use assignment-scoped participant access. Persist project/run state in the server database, not browser local storage.

PHASE 2: REAL EXECUTION AND EVIDENCE

Connect source-backed market research and structured intake/planning through configurable provider interfaces. Preserve source-to-claim links, publication/retrieval dates, status uncertainty and conflicting evidence. Include active alternatives as well as historical cases. Do not assume a missing website proves startup failure.

Implement one real vertical path first: approved target and plan → durable workflow → isolated browser → step evidence → assertion result → finding → theatre → report. Add concurrency only after this works. Use Temporal for durable activity coordination and LangGraph for bounded agent reasoning where these fit the existing architecture. Use an outbox and stable workflow identities to avoid accepted-but-never-started runs. Keep side effects in activities; bound retries and spend.

Start with deterministic Playwright execution on an owned fixture, then integrate Browser Use behind a tested adapter. Verify actual version compatibility and action ownership. Do not assume Browser Use actions automatically appear in Playwright traces. Canonical step events and sanitized screenshots are required independently of tracing. Pin tested versions and consult official upstream documentation for actual APIs rather than guessing signatures.

The browser loop observes, proposes a typed action, passes deterministic policy, executes, records evidence and checks objective success criteria. One executor owns actions. Evaluators for accessibility, usability, trust and conversion consume the shared evidence and may request bounded additional checks. Add axe-core and Lighthouse where supported. Do not claim accessibility certification, human emotional responses or conversion lift from these checks.

Implement near-real-time step-image delivery and persistent SSE; continuous live video is not required. Follow the event envelope in the PRD. Persist events before publication, use stable sequences/cursors, deduplicate repeats and recover missed events from snapshots/history. Commit artifacts before publishing ready events. Lazy-load signed authorized images, cap visible streams, paginate history and handle backpressure. A disconnected viewer must not restart the run.

Default to 24 planned journeys, 4 concurrent browsers, 25 actions and 180 seconds per journey with configurable tenant/global limits. Enforce atomic budget reservation for parallel work, idempotent ledger settlement and cancellation that actually terminates workers. Preserve partial evidence. Same request key with different content is a conflict. Do not blindly retry side effects after crashes.

Use PASS for assertion-backed success, FAIL for supported product failure and UNKNOWN for agent/infrastructure/policy uncertainty. A persona getting lost is not automatically a confirmed UX flaw. Keep evidence quality and measured outcomes separate from model interpretation. A finding must resolve to actual authorized evidence or be explicitly labeled a hypothesis.

Implement verified target authorization, isolated ephemeral browser state, test accounts, deterministic action limits, constrained egress including redirects/subresources, SSRF/rebinding defenses and protection from page prompt injection. Workers cannot access control-plane secrets or unrestricted storage. Redact before model calls, telemetry or artifact release. Quarantine or disable raw trace export if secrets cannot be removed safely. Do not bypass authentication challenges or perform unapproved purchases, destructive actions or external messaging.

HUMAN VERIFICATION AND COMPARISON

The Verify with humans action creates a draft study, not a fake instant participant session. Include relevant role, task, build and neutral instructions. Recruitment/screening is manual in the pilot. Participants consent and submit observations independently before seeing AI findings. Separate self-report from moderator-observed evidence. Recordings require an explicit supported consented capture mechanism; do not assume cross-origin access.

When reviewed human evidence arrives, publish a new hybrid report version with supported/contradicted/inconclusive comparisons. Do not overwrite the AI report. AI report completion must not wait on recruitment.

Retest creates a new immutable build/run and uses matched task milestones. Implement before/after linked navigation and independent playback fallback. Labels are fixed in this retest, persistent, regressed, new and untested. Missing coverage or blocked execution is never fixed. Display conditions that differ between runs. Treat human verification as a separate evidence status. Do not equate browser execution speed with human time saved.

REQUIRED VERIFICATION

Verify real persistence, tenant and participant isolation, valid finding deep links, SSE reconnection/deduplication, evidence-pending/deleted states, duplicate submissions, worker restart, cancellation and cost caps. Demonstrate the seeded defect in version A and supported resolution in version B using real browser assertions. Check that replay pause does not stop execution and that absent retest coverage stays untested. Check redaction, untrusted-page controls and authorized artifact access. Test the complete human submission/review/report path with clearly identified test accounts.

Run focused type/build/integration/browser checks appropriate to the repository and inspect the actual rendered UI. Fix broken controls, clipping, illegible text and console errors. Log only measurements actually obtained. Separate deterministic fixture results from provider-backed runs and real human studies. If a test cannot run, report its precise blocker instead of marking it passed.

DELIVERABLES

Deliver working code; migrations; validated API/event contracts; local setup and environment examples; coherent demo data; real executor integration where configured; operator instructions; screenshots or recordings of the implemented UI; and an acceptance matrix. Provide a short final report stating what works, what was tested, what still needs credentials/infrastructure and what remains before a paid pilot or production release. Preserve progress in IMPLEMENTATION_STATUS.md and PHASE_2_HANDOFF.md as appropriate.

Begin by inspecting the repository and reading the supplied PRD, then implement the smallest complete journey and continue through the remaining requirements. Do not stop after writing a plan or scaffolding.

## END PROMPT

# Appendix C — Original full platform context and two-phase implementation brief

The following preserved brief provides the broader database, research, human-study, backend and commercial context. Its estimates and pricing remain proposals. The theatre-specific behavior in Part A supplements it.

# Playground: what to build and two Codex implementation prompts

Prepared for Prabhmannat Singh | 14 October 2026

## 1. Recommended product

Build a product-validation workspace for early-stage B2B web and SaaS teams. Its core promise is: **Find the risky assumptions, test the product, inspect the evidence, and decide what to change next.** Begin with startup founders and product teams who already have a browser-accessible prototype. Support idea-only projects with research and discovery studies, but do not pretend to execute a product that does not exist.

Your strongest initial combination is market research, actual browser journeys, targeted human studies, and a report that compares the evidence. The moat to work toward is a record of which simulated concerns are confirmed or contradicted by real participants across successive product versions. That is a hypothesis for differentiation, not an established advantage.

The supplied documents describe proposed architecture, not proof that any integrations are already implemented. This plan retains their web-first, evidence-first design and makes the market-research and human-study workflows explicit.

### The founder experience

1. Create a project and describe an idea, prototype, or feature in a conversational interface.
2. Playground asks a few useful follow-up questions: customer, problem, current alternative, key workflow, geography, product stage, and decision to make.
3. Review an editable brief with confirmed facts, assumptions, and unanswered questions.
4. Choose AI, human, or hybrid validation. See the actual scope, estimated cost, and limits before starting.
5. Review relevant competitors and historical startup cases, with sources and dates.
6. If there is an authorized web target, approve personas, tasks, viewports, test accounts, and a run budget.
7. Watch real progress and inspect screenshots, task outcomes, and failure evidence.
8. Optionally request screened participants. Initially, Playground staff recruit and coordinate them manually through an operations console.
9. Read a report separating sourced facts, simulated observations, human observations, and unresolved hypotheses.
10. Improve the product, submit a new build, and compare a new run with the previous one.

### Scope by customer stage

| Stage | Deliverable | Explicit boundary |
|---|---|---|
| Idea only | Competitor research, historical cases, risky assumptions, discovery-interview guide, human concept study | No browser usability results without a testable product; no demand prediction from synthetic opinions |
| Web prototype | All the above, bounded browser journeys, automated audits, optional targeted human usability study | Start with Chromium and supported browser-accessible flows |
| Launched web product / new feature | Authorized staging tests, version comparison, human feature study | Prefer staging with test data; actual conversion lift requires real-user experiments |

### Build now versus later

**Build now:** conversational intake; projects; source-backed competitor and historical-case research; editable personas and tasks; isolated browser sessions; four evaluators; evidence browser; prioritized reports; manual human-study operations; participant task/feedback portal; usage caps; cancellation; retest comparison.

**Build later:** automated participant marketplace and payouts; native apps; Figma-specific integrations; continuous production monitoring; social simulation; advanced long-term persona memory; SetFit after useful reviewed labels exist; calibrated sector benchmarks.

Do not include a universal product-success score, simulated purchase intent presented as demand, or a claim that a million social agents equal a million product testers. Distinguish product testing, automated accessibility checks, security testing, and load testing. Browser agents are not a replacement for specialist security reviews or load generators.

## 2. Recommended architecture and tool decisions

Use a monorepo with Next.js/TypeScript for the application, FastAPI/Python for the authoritative API, SQLAlchemy/Alembic for the PostgreSQL schema, Keycloak for OIDC, S3-compatible storage for artifacts, Temporal for durable run scheduling, and LangGraph for bounded agent reasoning. Use managed equivalents where useful, but preserve the interfaces. Keycloak, Temporal, and self-hosted storage add operations work; local Docker Compose is development infrastructure, not production isolation.

Phase 1 includes a thin real FastAPI CRUD layer so database behavior works without introducing a second competing schema owner. Phase 2 extends the same API and adds execution workers. Avoid building a disposable frontend whose entire data model must be replaced later.

| Component | Playground responsibility | Decision |
|---|---|---|
| Browser Use | Goal-driven navigation in an authorized browser | Integrate behind a replaceable executor adapter; test pinned version compatibility |
| Playwright | Deterministic checks, assertions, fixtures, browser evidence | Core; verify which actions are traceable when sharing a browser with Browser Use |
| LangGraph | Stateful planning and evaluation steps | Core; does not by itself provide the entire production job system |
| Temporal | Durable jobs, retries, recovery, cancellation, activity scheduling | Phase 2; keep network/model side effects in activities |
| axe-core | Automated accessibility checks | Core; cannot certify accessibility compliance |
| Lighthouse | Technical quality and performance audits | Core, bounded separate audit job; not a measure of conversion or demand |
| SetFit | Classification of reviewed feedback and issue labels | Later; first use explicit rules and structured model outputs |
| OASIS | Social-network and population-interaction experiments | Optional research lane; not the main product-testing engine |
| MiroFish | Scenario/persona and social-simulation exploration built on OASIS | Optional; do not integrate both as independent validators of the same proposition |
| Concordia | Generative social agents and behavior/memory experiments | Optional; explicit persona schemas suffice for initial browser testing |

OASIS describes simulations of social platforms such as Twitter and Reddit at up to one million agents. That advertised scale does not establish realistic behavior on arbitrary SaaS websites. MiroFish's current upstream quick start includes LLM and Zep Cloud credentials, and its repository identifies AGPL-3.0. Review the exact license and deployment implications before integration; no legal conclusion is assumed here. Concordia is a generative social-simulation library, not an out-of-the-box QA worker.

Browser Use and Playwright must have one owner of browser actions per journey. Their integration can share Chrome through CDP, but do not assume Browser Use is simply a Playwright wrapper or that Playwright automatically records every external action. Maintain Playground's own canonical step-event and screenshot evidence in every case.

### Runtime layout

Founder/participant UI talks to the authenticated API. The API writes PostgreSQL records and a transactional outbox. A dispatcher starts an idempotently identified Temporal workflow. Activities run bounded research, planning, browser execution, audits, and report assembly. Browser workers execute on isolated infrastructure with constrained network access. They receive only scoped task capabilities and return evidence through controlled artifact uploads. Human studies proceed independently and can produce a later report version. Progress events are persisted and streamed to the UI.

An AI report should not wait days for participant recruitment. Show the AI report as complete with human-study status pending. When reviewed human evidence arrives, publish a new hybrid report version, preserving the old one.

## 3. Time, capacity, and commercial assumptions

These are engineering estimates, not promises or observed delivery times. They assume one experienced full-stack engineer working 30–40 focused hours per week with Codex, access to provider credentials, a narrow web-only scope, and manual recruitment. A two-engineer team helps, but coordination and external recruitment do not shrink linearly.

| Milestone | Effort / elapsed estimate | What it actually means |
|---|---|---|
| Attractive interactive mock demo | 3–5 focused days | Seeded data and demonstrable interactions; no production engine |
| Phase 1: premium UI + persistent database + CRUD/auth | 1–2 weeks | Working product shell, study portal, migrations, tenant checks, explicit demo mode |
| Phase 2: real execution and reliability | 4–6 additional weeks | Research, browser jobs, evidence, human workflow, recovery, quotas, reports |
| Paid pilot MVP from a clean start | Roughly 6–8 weeks total | Includes integration/debugging buffer and narrow supported target types |
| Production hardening | Roughly 10–16 weeks total | Operational isolation, restore tests, privacy lifecycle, monitoring, customer onboarding |
| Broad marketplace + native apps + calibrated simulation | 4–9+ months | Separate product and research expansion, with substantial uncertainty |

A seven-day sprint can yield a persuasive proof: days 1–2 intake, database and shell; days 3–4 one authorized site with two real journeys; day 5 screenshots, assertions and findings; day 6 report and human-study request; day 7 debugging and demonstration. This intentionally leaves recruitment automation, broad compatibility, full billing, and production hardening incomplete.

Start with 6 personas × 2 tasks × 2 viewports = 24 journeys. With 4 browser slots and a 180-second journey cap, browser execution alone consumes up to 18 minutes of ideal slot time if every journey reaches its cap. Queueing, startup, research, audits and reporting add time. This is capacity arithmetic, not a measured service-level promise. Worker execution time is also not a human time-on-task metric.

### Pricing hypothesis

The proposed **$50 initial purchase** is a reasonable price experiment for one explicitly bounded AI-only report. It is not automatically viable for specialist human recruitment. The proposed **$10/month** could cover saved project context, limited report questions, and history; new research, browser reruns, and human sessions need allowances or additional charges.

Illustrative economics only: five participants at an assumed $30 incentive each cost $150 before recruitment, moderation, infrastructure, support, payment fees or margin. At an assumed 60% contribution margin, that incentive cost alone implies at least $375 revenue: $150 / (1 - 0.60). Actual specialist rates and margins must be measured. This is not a market-rate quote or a complete pricing recommendation.

Track contribution per study = collected revenue minus model/search/browser/storage costs, incentives, recruitment/moderation labor, payment charges and other direct fulfillment costs. Keep initial human-study pricing custom quoted. A useful pilot goal is 3–5 paying teams, measurable useful findings, known cost per run, and evidence that some teams return for a retest. These are proposed learning goals, not achieved traction.

## 4. How to use the prompts

Paste Prompt 1 into Codex in the project repository. Let it implement and verify the phase; resolve any actual credential blockers. Then paste Prompt 2 into the same repository. The prompts are sequential engineering specifications, not promises that one unattended response produces a production business. They tell Codex to preserve implementation progress and distinguish working, demo, blocked and deferred functionality.

---

## PROMPT 1 — Premium playable interface, real database, and application foundation

You are my senior product designer and full-stack implementation engineer. Build Phase 1 of Playground in this repository. Implement the application, not just a plan, landing page or static mockup. Inspect existing files and project instructions first, preserve useful work, and make routine implementation choices yourself. Do not deploy publicly or spend money unless separately authorized.

### Product

Playground helps founders test ideas, web prototypes and new features through market research, AI browser journeys and targeted human studies. Its experience begins with a conversational intake and ends with evidence-backed findings and a retest loop. The initial customer is an early-stage B2B SaaS team. The product is not a chatbot wrapper and does not predict guaranteed product-market fit.

Build a complete interactive workspace whose core CRUD persists to PostgreSQL. Execution engines are implemented in Phase 2. Phase 1 may simulate execution only in a clearly isolated, visibly labeled Demo workspace.

### Stack and repository boundary

- Frontend: Next.js App Router, TypeScript, Tailwind, accessible component primitives, Lucide icons, a small chart library only where useful, and restrained motion with reduced-motion support.
- API: FastAPI with Pydantic, SQLAlchemy and Alembic. The Python backend owns the schema and migrations. Generate or validate TypeScript API types from OpenAPI; do not introduce Prisma or a second schema owner.
- Data: PostgreSQL; S3-compatible artifact interface and a local development storage implementation.
- Identity: Keycloak OIDC in local development, with founder membership roles and a separately scoped participant access mechanism. Browser code never receives service credentials.
- Suggested layout: apps/web, services/api, services/worker, packages/contracts, infra, docs, tests/fixtures. Worker is only an interface/scaffold in this phase.
- Docker Compose starts local dependencies; provide a documented minimal boot path and .env.example with no secrets. Pin versions actually tested.
- Store server state in the API/database. Local storage is appropriate for presentation preferences, not authoritative projects, reports or budgets.

### Visual direction

Design a premium research/product tool with an editorial feel: warm off-white canvas, near-black text, muted violet primary actions, restrained mint status accents, subtle borders and spacious hierarchy. Use a high-quality sans-serif with local/system fallbacks, 8px spacing rhythm, readable dense tables, 10–14px corner radii, and limited shadows. Ensure contrast, keyboard focus and status labels; do not depend on color alone.

Use a left navigation rail, a contextual project header, and optional right-side evidence/details inspector. The main dashboard should lead with a useful next action and recent studies, not filler KPI cards. Build polished light mode first; add dark mode only after the primary flows are complete. Use consistent tokens and responsive layouts for 1440, 1024 and 390px widths. Avoid giant decorative gradients, endless rounded cards, meaningless world maps and invented customer logos.

The application should feel playable through editable plans, selectable persona cards, meaningful progress, timeline scrubbing, evidence drawers, working filters and comparison controls. Do not add a fake globe of thousands of users to imply real validation.

### Screens and working interactions

1. Workspace home: projects, recent activity, new validation action and a clearly marked sample project.
2. Conversational intake: accept an idea or URL; collect product stage, problem, intended roles, current alternatives, geography, key workflow and decision to make. In demo mode use deterministic follow-ups. Autosave the conversation; build an editable brief with confirmed facts, assumptions and unknowns. Do not pretend demo replies are live AI.
3. Project overview: brief, product/build versions, latest findings, studies and outstanding actions. Changing the project stage updates available testing actions.
4. Research workspace: competitor and historical-case comparison table, filterable by customer/problem/pricing/status/geography; open sources in an evidence panel. Distinguish reported failure reasons from Playground hypotheses. Include both active competitors and historical cases. Seed fictional companies explicitly labeled illustrative, not fake claims about real companies.
5. Test plan builder: personas, tasks, viewports, allowed actions, success assertions, credentials reference, step/time limits and budget. Users can edit persona role, experience, intent, device, language and assumptions. Display the resulting journey count before launch. Idea-only projects cannot start browser tests without a target.
6. Run detail: state, completed/total journeys, actual or demo usage, event timeline, per-persona/task result and cancel action. Demo events must support deterministic success, product failure, unknown outcome and cancellation. A real project with no worker configured shows an honest unavailable state.
7. Evidence explorer: step list, screenshot viewer, logs, source links and artifact availability. Timeline seeking and keyboard navigation work. Mark screenshot sequences as sequences, not video. Provide a trace download only if a real trace exists.
8. Findings: category, severity, task/build, evidence type, support status, reproduction steps and recommendation. Filter and sort; open detail drawer; add reviewer notes; mark acknowledged or disputed. Acknowledging an issue does not mark it fixed.
9. Human study builder: target roles, screening criteria, participant count, tasks, session length, incentive, consent and recording scope. Request a quote; show recruitment and study status without fabricated tester availability.
10. Participant portal: invitation, consent, assigned tasks, target link, outcome, difficulty rating and feedback. Participants see their assigned study only and cannot see AI findings before submitting independent observations. Recording is optional; do not claim arbitrary cross-origin pages can be recorded inside an iframe.
11. Operations console: authorized staff review applications, record screening decisions, assign pseudonymous participants, track incentives as pending/paid and review submissions. Phase 1 payment records are administrative entries, not executed payouts.
12. Report: executive summary, tested scope, source-backed research, browser outcomes, human observations, agreement/conflict, prioritized recommendations, limitations and next experiments. Display source counts and sample counts. Provide print-friendly export and structured JSON download; do not create a universal market-success score.
13. Retest comparison: baseline versus new build; fixed, persistent, regressed, new and untested findings with evidence links. Demo retests use fixtures; real fixes require later evidence.
14. Settings: membership, project access, retention preferences, integration readiness, credits/usage and configured limits. Distinguish usable, unavailable and demo integrations.

All primary buttons must navigate, mutate persisted state, download actual content or clearly explain a missing integration. Include loading, empty, error, retry, permission-denied and offline/reconnection states. Use optimistic updates only when rollback is implemented.

### Database model

Implement relational tables with UUIDs, timestamps, foreign keys, unique constraints and appropriate indexes. Keep structured relationships relational; use JSONB for versioned snapshots and variable provider payloads. Include these groups:

- Identity: users, tenants, memberships and audit_events.
- Product: projects, product_builds, target_authorizations, conversations, messages, brief_versions.
- Research: research_runs, sources, market_entities, market_claims, claim_sources, project_market_entities. Source fields include URL, title, publisher, publication date if known, retrieval time and content fingerprint. Entity status has an as-of date and evidence, not just a dead/alive boolean.
- Planning: persona_versions, test_plans, plan_personas and tasks. Freeze selected persona/task snapshots for a submitted run.
- Execution: runs, journey_sessions, steps, artifacts, run_events and outbox_events.
- Results: findings, finding_evidence, finding_reviews, report_versions and retest_links.
- Human: human_studies, participant_profiles, study_applications, study_assignments, consent_records, human_observations and incentive_records.
- Economics: usage_ledger, budget_reservations and idempotency_records.

For each tenant-owned entity store tenant_id and enforce same-tenant parent/child relationships, including join tables. Add database row-level policies and use a non-owner application role; derive request tenant scope from verified identity and membership, never a trusted client field. Transaction-local tenant context must reset safely with connection pooling. Separate privileged migrations/admin operations from the application role. Participant identity does not grant tenant-wide access: use narrow assignment-level grants and expiring, revocable invitation tokens stored as hashes.

Ledger values use integer monetary units or exact decimals with explicit currency. Unique event keys prevent duplicate consumption and releases. Completed runs and reports are immutable snapshots; review updates create versioned records. Artifacts store object keys, content type, checksum, redaction state and retention metadata, never plaintext secrets or permanent public links.

Use run states DRAFT, VALIDATED, QUEUED, RUNNING, ANALYZING, NEEDS_REVIEW, COMPLETED, FAILED, CANCELED. Keep human-study status separate. Journey outcomes are PASS, FAIL, UNKNOWN; failure reasons distinguish PRODUCT, AGENT, INFRASTRUCTURE and POLICY. Cancel requests are persisted separately until worker termination is acknowledged. Evidence types include SOURCED_FACT, BROWSER_OBSERVATION, AUTOMATED_AUDIT, HUMAN_OBSERVATION and AI_HYPOTHESIS. Support status is SUPPORTED, CONTRADICTED or INCONCLUSIVE.

### API and phase handoff

Implement authenticated CRUD for projects, brief versions, plans, studies and reviews; read endpoints for demo runs, findings and reports; narrow participant submission endpoints; admin operations with real authorization. Define typed contracts for run submission, cancellation, events and artifacts even where the real implementation arrives in Phase 2. Implement an explicit demo adapter, not random mock data mixed into production routes.

Create one fictional recruitment-SaaS sample with 6 personas, 2 tasks, 2 viewports, 24 illustrative journeys, and coherent findings and sample human observations. Every sample report and metric must be marked Demo. Include a clean real workspace with no results to prove the empty path. Seed operations must be repeatable and safe for local development, not automatically run against production.

### Acceptance gates

- Local setup succeeds and migrations apply to an empty database.
- Create/edit a project and plan, refresh/restart, and verify persistence.
- Demo flow works from intake through plan, run events, evidence, report and comparison.
- Study request, participant consent/submission and staff review work end-to-end.
- User A cannot read/write tenant B; participants cannot enumerate other assignments; expired/revoked links fail.
- No fake success appears when a provider or worker is missing.
- Key pages work at desktop/mobile widths, with keyboard navigation and no console errors.
- Run focused integration and browser tests for these flows; inspect rendered screens and fix clipping or broken interactions.

Deliver working code, migration files, deterministic fixtures, setup commands, architecture notes, an endpoint/schema contract, screenshots for verification, and PHASE_2_HANDOFF.md stating implemented, demo, blocked and deferred behavior. If any gate cannot run, state exactly why and do not label it verified. Continue through implementation and verification rather than stopping after scaffolding.

---

## PROMPT 2 — Real research, browser execution, human validation, and backend reliability

You are my backend, agent-systems and reliability engineer. Continue the existing Playground repository from Phase 1. Read repository instructions, PHASE_2_HANDOFF.md, the API contract, database schema and tests. Preserve the design and database identity. Implement the real backend in incremental vertical slices and verify each slice. Do not rebuild the frontend, replace working migrations wholesale, deploy publicly or incur unapproved costs.

### Goal and required boundaries

Turn Playground into a narrow paid-pilot system for idea research and authorized web-product testing, with optional manually recruited human studies. Real provider calls require configured credentials; otherwise report an explicit unavailable state. Keep deterministic demo mode isolated. No simulated behavior may be represented as observed human behavior or a probability of business success.

Keep FastAPI as the authoritative API, PostgreSQL as durable application state, S3-compatible storage for artifacts, Temporal for durable orchestration, and LangGraph for bounded planning/evaluation. Keep one schema owner through SQLAlchemy/Alembic. Browser workers must run separately from the public web server and privileged control-plane services.

### Slice 1: intake and research

Implement a model-provider interface supporting structured, schema-validated outputs and recorded usage. Configure model identifiers and limits; do not hard-code assumed current model names or prices. Use explicit retry limits and mark unresolved provider failures honestly.

The intake agent asks one or a few high-information follow-ups per turn, saves answers, updates a structured brief and identifies assumptions. Required fields: product stage, intended customer, problem, workflow, current alternative, market/geography, target build if any, and decision to make. Let founders edit and confirm the brief before paid execution. Persist brief and prompt versions.

Implement a configurable search/retrieval provider and source-ingestion service. Never replace failed search with invented company data. For each competitor/historical case capture identity, relevance rationale, target audience, problem, model/pricing if evidenced, timeline, status/as-of date and supporting sources. Search for active competitors, alternatives, successful precedents and closed/pivoted companies so the report is not biased toward failure cases alone.

Treat a missing website as insufficient proof that a company failed. Prefer first-party closure statements and corroborating reliable reports. Keep company closure, product discontinuation, pivot, acquisition and unknown status distinct. Separate quoted/reported explanations from inferred causes. Record publication/retrieval timestamps, evidence excerpts within permitted limits and source-to-claim links. Conflicting sources produce an unresolved item. A sparse search returns coverage gaps, not fabricated completeness.

Build a compact editable case library and search over stored cases; do not claim access to a complete startup-graveyard database. Founder uploads and user-selected sources can supplement research. Research pages and uploaded documents are untrusted input and cannot change agent policies.

### Slice 2: plan generation and run lifecycle

Generate structured personas from stated tasks and audience information: role, domain familiarity, intent, language, device, interaction needs, expectations and assumptions. Avoid demographic stereotypes. Version personas and distinguish founder evidence from generated hypotheses. Use bounded task memory per journey; no cross-tenant memory.

Generate tasks with starting state, goal, allowed actions, account/fixture requirements, success assertions, stop conditions and criticality. Default run envelope: 6 personas × 2 tasks × 2 viewports = 24 journeys; 4 browser slots maximum per run; 25 actions and 180 seconds maximum per journey. Enforce tighter tenant/global limits where configured. These defaults are caps, not a claim of representative sampling.

Implement a Temporal workflow for the durable run lifecycle. Network calls, models, artifact writes and browser execution occur in retry-controlled activities, not deterministic workflow code. LangGraph handles bounded observe/plan/evaluate loops inside activities. Do not create overlapping Temporal/LangGraph retry loops with multiplicative spend. Use stable workflow/run IDs and task attempt IDs; persist explicit checkpoints/events and resume safely after worker restarts.

Use a transactionally persisted outbox to connect accepted database work to workflow dispatch. Consumers deduplicate events. Reserve the permitted budget atomically before dispatch. Same idempotency key + same payload returns the same run; a changed payload under the same key returns a conflict. Tenant-scoped keys prevent cross-tenant collisions. Create explicit database transitions and compare-and-set terminal updates to prevent cancel/completion races.

Cancellation stops dispatch, signals active workers, terminates isolated execution after a bounded grace period, retains partial evidence and settles actual usage once. A retry must not blindly repeat account creation, form submission or other side effects; reset fixtures or classify the result UNKNOWN and require a new attempt. Infrastructure recovery is distinct from a user-requested retest.

### Slice 3: authorized browser execution

Implement Playwright deterministic execution first on a local seeded fixture app with known defects. Then add Browser Use through an executor interface. Verify pinned Browser Use, browser and Playwright versions with an actual integration smoke test. If sharing Chrome via CDP, explicitly coordinate browser ownership, context lifecycle and captured events. Only one action owner operates a journey at a time. Never claim a Playwright trace contains all Browser Use actions without verifying capture; Playground must always maintain its own canonical action events and screenshots.

Agent loop: observe current permitted page; propose a typed action; apply deterministic policy; execute; capture result; evaluate objective success assertions; continue or stop. Action tools are narrowly typed navigate/click/fill/scroll/keyboard/inspect operations, not arbitrary Python, JavaScript or shell execution generated by the model. Any internal DOM inspection scripts are fixed trusted code. Web content is data, not instructions.

For each step persist run/session/attempt IDs, sequence, timestamp, sanitized URL, action type, locator/context where available, redacted input summary, outcome, screenshot reference and relevant console/network errors. Do not store authorization headers, cookies, passwords or full arbitrary request bodies. Capture product build, browser/viewport, persona, task, prompt/model versions and seeds when supported. Provider nondeterminism must be acknowledged; seeds do not guarantee reproducibility.

Classify task outcomes: PASS only when objective assertions establish success; FAIL when evidence establishes a product blocker; UNKNOWN when agent uncertainty, infrastructure, policy or missing evidence prevents a conclusion. Preserve a failure reason and covered steps. Agent confusion alone is not a confirmed usability defect. Agent elapsed time is not human task duration.

Run each journey with fresh isolated browser state and a dedicated test account where required. Enforce non-root execution, sandboxing, bounded CPU/memory/time and ephemeral writable filesystems. Production workers cannot access database/service credentials, host sockets, cloud metadata or other tenants' profiles. Give only short-lived task capabilities and narrow upload permissions. Tear down the environment after each task. A Docker Compose network alone does not fulfill production isolation.

Implement an egress policy for every browser request, redirect and protocol connection, including subresources, popups, service workers and WebSocket destinations. Reject private/loopback/link-local/metadata ranges, unsafe schemes, unsupported ports and DNS rebinding. Authorize exact target hosts and approved asset hosts; asset permission is not permission to navigate and test unrelated domains. Harden research-fetch requests separately against SSRF. Restrict local-fixture exceptions to isolated development/test mode, with no production override exposed to users.

Verify customer control/authorization of the target and use test fixtures. Block real purchases, payments, destructive actions and external messages. Do not bypass CAPTCHA or MFA; use approved test accounts or stop as blocked. Permit only explicitly scoped sandbox actions. Enforce policy outside the LLM and at network boundaries, not just in prompt wording.

### Slice 4: audits, findings and evidence quality

Add axe-core to permitted captured states and bounded Lighthouse runs where supported. Run audits separately from interaction timing. Record version, page state and relevant environment. Mark unsupported authenticated/performance cases as unavailable rather than generating substitute scores.

Four evaluators share one evidence bundle: accessibility, usability, trust and conversion friction. They may request bounded follow-up checks through the same scheduler, but cannot independently click the active browser. Accessibility reports actual automated violations and gaps; trust reports observed disclosures and heuristic concerns; conversion reports friction, not forecast uplift.

Structured findings must contain category, severity, observed symptom, location/task/build, evidence IDs, reproduction instructions, recommendation, provenance and support status. Severity uses documented blocker/major/minor/suggestion criteria. Unsupported interpretations are explicitly hypotheses. Confidence is an evidence-quality description until calibrated; do not invent numeric probabilities.

Validate referenced artifacts exist and belong to the same tenant/run before publication. Redact before sending content to model services or making artifacts accessible. Some raw traces can contain secrets; quarantine them with restricted access or disable their collection/export when safe redaction cannot be guaranteed. Provide sanitized event/screenshot evidence instead. Reproduce high-impact findings where feasible and label inconclusive attempts. Deduplicate by task/location/symptom while retaining all evidence provenance. Related model opinions are not independent corroboration.

Use rules and structured LLM classification initially. Define a replaceable classifier interface for SetFit but do not claim it is trained. Add it only when reviewed labeled data and a project-separated held-out evaluation justify the additional component.

### Slice 5: targeted human studies

Implement founder study request, staff screening/assignment, consent, participant task delivery, submission, moderation and incentive tracking. Recruitment is initially manual. Do not fabricate professional credentials or participant availability. Store only the verification evidence necessary for the screening decision and restrict personal contact information.

Participants receive realistic tasks and submit independent observations before viewing AI predictions. Capture consent version/time, task/build, reported outcome, difficulty, notes and permitted attachments. Separate self-reported task success from moderator-observed success. Freeze submitted observations; later clarifications are append-only and auditable.

For actual interaction recording, support an opt-in owner-installed recorder with input/DOM masking and explicit consent. Without that integration, accept feedback and optionally participant-provided recordings under separate consent, and explain the evidence limitation. Do not claim cross-origin iframe access or invisible recording. Configure deletion/retention for recordings and participant data. Record compensation eligibility independently of whether feedback is positive. Initially track payout references manually; never mark an incentive paid from an unverified client request.

Link reviewed human observations to the same task, build and finding where appropriate. Comparison labels: supported, contradicted or inconclusive, with counts and rationale. Report overlapping and human-only findings separately. Five participants may reveal issues but are not a population demand estimate. Automated audit evidence is also distinct from human-observed usability.

### Slice 6: reporting, retests and economics

Generate versioned reports with decision context, source-backed research, executed coverage, passed/failed/unknown tasks, reproducible findings, human-study status, contradictions, priority rationale, limitations and next experiments. Publish the AI report independently; publish an additional hybrid version after human review. Recommendations such as proceed to a limited pilot, revise or test further must state which evidence supports them. Never claim a universal launch-readiness percentage.

Report Q&A retrieves authorized project evidence, cites specific evidence/source IDs and says when evidence is missing. It must not run new research or browser work silently; those are separately scoped jobs with budgets. Questions about speculative outcomes should produce hypotheses and proposed experiments.

Retest a new build by creating a new immutable run. Compare matched tasks and findings and label fixed/persistent/regressed/new/untested. Missing coverage is untested, never automatically fixed. Preserve original reports and artifact references subject to disclosed retention.

Implement usage metering for model calls, retrieval, browser compute, audits and artifact use. Reserve estimated maximum cost for concurrently launched units before allowing dispatch; reconcile measured usage afterward and release unused reservation. Prevent parallel workers from independently overspending the same remaining balance. Version provider rate configuration, record unknown/unreconciled cost explicitly, and cap steps/tokens/time even when price reporting is delayed. The ledger is authoritative, not a cache.

Treat $50 as a configurable bounded AI-plan experiment and $10/month as a separately capped saved-workspace/Q&A idea. Do not hard-code unlimited reruns or specialist sessions into these prices. Human studies require a quote including incentives and fulfillment costs. Add checkout behind a payment adapter only if supported/configured; use verified signed webhooks, unique event IDs and server-side entitlements. Test mode or manual invoicing must be visible. No live charge without authorization.

### API contracts and operations

Implement or preserve these logical routes, adapting naming consistently to the Phase 1 contract:

- POST /v1/projects and project-scoped intake/brief endpoints.
- POST /v1/projects/{id}/research-runs and GET research status/results.
- POST /v1/projects/{id}/plans and plan review/version endpoints.
- POST /v1/runs with Idempotency-Key, plan version and budget; return 202 + run ID.
- GET /v1/runs/{id}, GET /v1/runs/{id}/events with resumable SSE cursor, and POST /v1/runs/{id}/cancel.
- GET /v1/runs/{id}/findings, GET /v1/artifacts/{id}/access and scoped report endpoints.
- POST /v1/runs/{id}/retests with a new build reference.
- Human-study creation, assignment, consent, participant submission and staff review endpoints.

Authorize every endpoint, event subscription, worker job and object access; never trust tenant IDs supplied in JSON or queue messages without verifying their parent relationship. SSE is for notification; persisted state remains authoritative. Short-lived artifact URLs require authorization before issuance and must not be logged. Expired links and deleted artifacts produce meaningful UI states. Sanitize Markdown and uploaded content to prevent stored XSS.

Add structured logs and telemetry for queue age, run/journey latency, unknown rate, cancellation latency, worker restarts, evidence coverage, costs and report generation. Exclude secrets and private content from telemetry. Add health checks, migration/backup/restore instructions, retention jobs and an operator runbook. Do not silently delete evidence while reports pretend it remains available; retain explicit deletion markers and update access states.

### Verification and pilot release gates

Build focused tests and controlled fixture pages with known good and broken flows. Demonstrate:

1. A real authorized run from intake/plan to executed journeys, stored evidence and report.
2. A known broken task is FAIL with evidence; model/browser infrastructure failure is UNKNOWN.
3. Duplicate submission does not duplicate runs or ledger charges; changed payload under a reused key conflicts.
4. Worker restart resumes durable coordination without repeating unsafe side effects.
5. Cancel and budget exhaustion stop additional work and preserve partial results.
6. Tenant isolation holds for API reads/writes, joins, background jobs, events and artifacts; participant grants cannot escape their study.
7. Private-network targets, rebinding/redirect attempts and page prompt injection do not bypass deterministic controls.
8. Secret fixtures do not appear in exported evidence or model/telemetry payloads.
9. A manually recruited test participant can consent, submit independently, be reviewed and produce a hybrid report version.
10. A retest distinguishes an actual fix from missing coverage.
11. Missing credentials, search failure, empty evidence and provider timeouts remain visible and do not become fabricated findings.
12. The existing frontend displays real persisted state without the demo adapter in a real workspace.

Create a small benchmark manifest with known issues and reviewed labels. Measure finding precision/recall where ground truth permits, task-outcome agreement, unknown rate, coverage, cost per run and report latency. Record counts and evaluation conditions; do not fabricate benchmark results. Human calibration requires actual reviewed studies; no fixture result proves human realism. Only claim successful checks that were executed.

Keep MiroFish, OASIS, Concordia, graph memory and SetFit outside the critical path. Define a feature-flagged research adapter if helpful, with separate budget, provenance and experimental labels, but do not implement a swarm just to satisfy a dependency list.

Finish with working code, migration updates, deployment topology, environment documentation, a test report with executed commands/results, measured example-run cost where available, and a clear list of remaining pilot/production blockers. Maintain IMPLEMENTATION_STATUS.md so subsequent sessions continue from verified progress. Do not call the system production-ready unless isolation, operational and end-to-end gates have actually passed.

## 5. Source notes

The product interpretation uses the supplied Pasted text(20261014-011127).txt, Playground_Detailed_Architecture(1).pdf, Playground_Technical_Architecture_Brief.pdf and the uploaded ecosystem-table image. The detailed PDF explicitly labels integrations proposed rather than implemented. Its human-study page describes the cross-origin recording constraint; its data and deployment pages inform the evidence, tenancy and worker boundaries above.

Primary documentation reviewed on 14 October 2026:

- OASIS introduction: https://docs.oasis.camel-ai.org/introduction
- MiroFish upstream, integration prerequisites and repository license label: https://github.com/666ghj/MiroFish
- Concordia upstream: https://github.com/google-deepmind/concordia
- Browser Use upstream: https://github.com/browser-use/browser-use
- Browser Use / Playwright integration example: https://github.com/browser-use/browser-use/blob/main/examples/browser/playwright_integration.py
- Playwright tracing: https://playwright.dev/docs/api/class-tracing
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer
- LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
- Temporal durable execution: https://docs.temporal.io/temporal
- SetFit documentation: https://huggingface.co/docs/setfit/index
- axe-core upstream: https://github.com/dequelabs/axe-core
- Lighthouse introduction: https://developer.chrome.com/docs/lighthouse/overview

Architecture choices, scope limits, delivery estimates, default budgets and pricing examples are recommendations for Playground, not vendor guarantees, tested measurements or validated business forecasts. Check exact dependency versions and applicable terms during implementation.
