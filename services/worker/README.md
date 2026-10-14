# Execution boundary (Phase 2)

No browser or model engine runs in Phase 1. The API's `demo.py` replays a finite,
deterministic fixture sequence into PostgreSQL. It does not visit submitted URLs.

Real execution must implement the interfaces here using Temporal activities,
one browser action owner, bounded LangGraph reasoning, scoped artifact uploads,
and constrained network egress. Keep browser workers apart from the control plane.
Read ../../PHASE_2_HANDOFF.md before implementing.
