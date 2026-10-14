import type { components } from "./generated";
export type Project = components["schemas"]["ProjectOutput"];
export type BriefInput = components["schemas"]["BriefInput"];
export type PlanInput = components["schemas"]["PlanInput"];
export type RunEvent = components["schemas"]["EventOutput"];
export interface Version<T> {
  id: string;
  version: number;
  snapshot: T;
  confirmed?: boolean;
  approved?: boolean;
  created_at: string;
}
export interface Artifact {
  id: string;
  state: string;
  checksum: string | null;
  content_type: string;
  redaction_state: string;
}
export interface Annotation {
  id: string;
  note: string;
  created_at: string;
}
export interface Step {
  id: string;
  sequence: number;
  summary: string;
  milestone: string;
  outcome: string;
  capture_phase: string;
  url: string;
  captured_at: string;
  artifacts: Artifact[];
  annotations: Annotation[];
}
export interface Session {
  id: string;
  ordinal: number;
  persona: PlanInput["personas"][number];
  task: PlanInput["tasks"][number];
  viewport: string;
  state: string;
  outcome: string | null;
  failure_reason: string | null;
  steps: Step[];
}
export interface Review {
  id: string;
  status: string;
  note: string;
  created_at: string;
}
export interface Finding {
  id: string;
  run_id: string;
  step_id: string;
  session_id: string;
  category: string;
  severity: string;
  evidence_type: string;
  support: string;
  title: string;
  observation: string;
  interpretation: string;
  recommendation: string;
  reviews: Review[];
}
export interface Run {
  id: string;
  project_id: string;
  plan_id: string;
  build_id: string;
  mode: string;
  state: string;
  snapshot: PlanInput;
  sessions: Session[];
  findings: Finding[];
  events: RunEvent[];
  completed: number;
  total: number;
  actual_cents: number;
  cancel_requested_at: string | null;
  created_at: string;
}
export interface Study {
  id: string;
  build_id: string;
  finding_id: string | null;
  state: string;
  snapshot: {
    audience: string;
    instructions: string;
    screening: string;
    participant_count: number;
    session_minutes: number;
    incentive_cents: number;
    mode: string;
  };
  created_at: string;
}
export interface Report {
  id: string;
  run_id: string;
  version: number;
  snapshot: {
    title: string;
    provenance: string;
    build: string;
    summary: string;
    outcomes: Record<string, number>;
    findings: {
      id: string;
      title: string;
      evidence_type: string;
      support: string;
      step_id: string;
    }[];
    human_observations: {
      alias: string;
      submission: { outcome: string; difficulty: number; notes: string };
      review: {
        comparison: string;
        rationale: string;
        moderator_outcome: string;
      };
      provenance: string;
    }[];
    limitations: string[];
    next_experiment: string;
    actual_cost_cents: number;
    source_count: number;
  };
}
export interface Research {
  id: string;
  snapshot: {
    name: string;
    status: string;
    pricing: string;
    customer: string;
    geography: string;
    problem: string;
    source: string;
    url: string;
    as_of: string;
    provenance: string;
    uncertainty: string;
  };
}
export interface WorkspaceData {
  projects: Project[];
  project: Project | null;
  brief: Version<Omit<BriefInput, "confirmed">> | null;
  plan: Version<PlanInput> | null;
  messages: { id: string; role: string; content: string }[];
  runs: Run[];
  studies: Study[];
  reports: Report[];
  sources: Research[];
  builds: { id: string; label: string; url: string }[];
}
export interface Comparison {
  baseline: Run;
  retest: Run;
  conditions: {
    intentional_changes: string;
    same_plan_except_build: boolean;
    provenance: string;
  };
  items: {
    finding: Finding;
    status: string;
    baseline_session_id: string;
    retest_session_id: string | null;
    milestone: string;
    provenance: string;
  }[];
}
