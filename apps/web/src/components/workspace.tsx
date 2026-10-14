"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Clapperboard,
  ScanSearch,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Check,
  FlaskConical,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  RefreshCw,
  Download,
  GitCompareArrows,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Send,
  ArrowLeft,
  X,
  Info,
  Briefcase,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  WorkspaceData,
  Project,
  BriefInput,
  PlanInput,
  Run,
  Finding,
  Study,
  Report,
  Comparison,
  Session,
  Step,
} from "../../../../packages/contracts/src";
import { api, download, money } from "@/lib/api";
import { eventFeed } from "@/lib/event-feed";
import {
  Badge,
  Button,
  Empty,
  Modal,
  SectionHead,
  DemoNotice,
  NextAction,
} from "./ui";
import Theatre, { EvidenceImage } from "./theatre";

const navigation = [
  ["Overview", LayoutDashboard],
  ["Research", Search],
  ["Test Plans", ClipboardList],
  ["Theatre", Clapperboard],
  ["Findings", ScanSearch],
  ["Human Studies", Users],
  ["Reports", FileText],
  ["Settings", Settings],
] as const;
const emptyBrief: BriefInput = {
  customer: "",
  problem: "",
  workflow: "",
  alternative: "",
  geography: "",
  decision: "",
  assumptions: "",
  unknowns: "",
  confirmed: false,
};
const newPlan: PlanInput = {
  build: "A",
  target: "",
  personas: [
    {
      name: "Hiring lead",
      role: "Recruitment lead",
      experience: "Experienced",
      intent: "Create a job posting",
      language: "English",
      assumptions: "Synthetic task hypothesis; not a recruited participant.",
    },
  ],
  tasks: [
    {
      key: "create-job",
      name: "Create a job posting",
      goal: "Create a role using test data",
      assertion: "A saved role appears in the overview",
      start: "Approved staging build with disposable test account",
      allowed_actions:
        "Navigate, inspect, fill test data, save. No real purchases or external messages.",
      stop_conditions: "Assertion, product error, policy block, or cap reached",
    },
  ],
  viewports: ["1440×900", "390×844"],
  max_actions: 25,
  max_seconds: 180,
  concurrency: 4,
  budget_cents: 5000,
  approved: false,
  authorization: false,
  credentials_reference: "Not configured",
};
type Assignment = {
  id: string;
  alias: string;
  consent_at: string | null;
  submission: {
    outcome: string;
    difficulty: number;
    notes: string;
    recording_backed: boolean;
  } | null;
  review: { comparison: string; rationale: string } | null;
  revoked: boolean;
  expires_at: string;
};
type Me = {
  name: string;
  role: string;
  tenant_id: string;
  workspaces: { id: string; name: string; mode: string; role: string }[];
};
type SettingsData = {
  retention_days: number;
  role: string;
  integrations: { name: string; state: string; detail: string }[];
  usage: { actual_cents: number; note: string };
};
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();

export default function Workspace({ signedIn }: { signedIn: boolean }) {
  const [me, setMe] = useState<Me | null>(null),
    [data, setData] = useState<WorkspaceData | null>(null),
    [view, setView] = useState("Overview"),
    [run, setRun] = useState<Run | null>(null),
    [runId, setRunId] = useState(""),
    [sessionId, setSessionId] = useState(""),
    [stepId, setStepId] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [signedOut, setSignedOut] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [connected, setConnected] = useState(false);
  const [modal, setModal] = useState(""),
    [finding, setFinding] = useState<Finding | null>(null),
    [brief, setBrief] = useState<BriefInput>(emptyBrief),
    [plan, setPlan] = useState<PlanInput>(newPlan),
    [message, setMessage] = useState(""),
    [projectForm, setProjectForm] = useState({
      name: "",
      description: "",
      stage: "prototype",
    });
  const [filter, setFilter] = useState("ALL"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("severity"),
    [note, setNote] = useState(""),
    [researchSource, setResearchSource] = useState<string | null>(null);
  const [studyForm, setStudyForm] = useState({
      audience: "Hiring managers at early-stage teams",
      instructions:
        "Using sample data, create a Product Designer job posting and attempt to save it. Describe what happened without referring to other testers or previous findings.",
      screening: "Has created at least one job posting in the last six months",
      participant_count: 5,
      session_minutes: 20,
      incentive_cents: 0,
    }),
    [assignments, setAssignments] = useState<Assignment[]>([]),
    [studyId, setStudyId] = useState(""),
    [invitation, setInvitation] = useState(""),
    [alias, setAlias] = useState("Participant 01"),
    [screening, setScreening] = useState(
      "Screened manually against the study criteria",
    ),
    [reviewId, setReviewId] = useState(""),
    [moderation, setModeration] = useState({
      comparison: "INCONCLUSIVE",
      rationale: "",
      moderator_outcome: "UNKNOWN",
    });
  const [studyBuildId, setStudyBuildId] = useState("");
  const [editingStudy, setEditingStudy] = useState<Study | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [members, setMembers] = useState<
    { id: string; name: string; subject: string; role: string }[]
  >([]);
  const [memberForm, setMemberForm] = useState({
    subject: "",
    name: "",
    role: "viewer",
  });
  const [comparison, setComparison] = useState<Comparison | null>(null),
    [baselineRun, setBaselineRun] = useState<Run | null>(null),
    [comparisonMilestone, setComparisonMilestone] = useState("submitted"),
    [settings, setSettings] = useState<SettingsData | null>(null),
    [selectedReport, setSelectedReport] = useState("");
  const project = data?.project;
  const initial = useRef(true);
  const launchKey = useRef("");
  const notify = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 4500);
  };
  const load = useCallback(async (id?: string) => {
    const d = await api<WorkspaceData>(
      "workspace" + (id ? "?project_id=" + id : ""),
    );
    setData(d);
    return d;
  }, []);
  useEffect(() => {
    if (!signedIn) {
      setSignedOut(true);
      setLoading(false);
      const params = new URLSearchParams(location.search);
      if (params.get("auth_error")) setError(params.get("auth_error")!);
      return;
    }
    const params = new URLSearchParams(location.search);
    setView(params.get("view") || "Overview");
    setRunId(params.get("run") || "");
    setSessionId(params.get("session") || "");
    setStepId(params.get("step") || "");
    if (params.get("auth_error")) setError(params.get("auth_error")!);
    api<Me>("me")
      .then(async (user) => {
        setMe(user);
        await load(params.get("project") || undefined);
        setConnected(true);
      })
      .catch((e) => {
        setConnected(false);
        if (e.message === "Sign in required") setSignedOut(true);
        else setError(e.message);
      })
      .finally(() => setLoading(false));
    const pop = () => {
      const p = new URLSearchParams(location.search);
      setView(p.get("view") || "Overview");
      setRunId(p.get("run") || "");
      setSessionId(p.get("session") || "");
      setStepId(p.get("step") || "");
      if (p.get("project")) load(p.get("project")!);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [load, signedIn]);
  useEffect(() => {
    setMessage(data?.messages.find((m) => m.role === "draft")?.content || "");
    setDraftSaved(false);
  }, [data?.project?.id]);
  useEffect(() => {
    if (!project || !message.trim()) return;
    setDraftSaved(false);
    const timer = setTimeout(() => {
      api(
        "projects/" + project.id + "/intake-draft",
        { content: message },
        "PUT",
      )
        .then(() => setDraftSaved(true))
        .catch((e) => setError(e.message));
    }, 900);
    return () => clearTimeout(timer);
  }, [message, project?.id]);
  useEffect(() => {
    if (data?.brief)
      setBrief({
        ...data.brief.snapshot,
        confirmed: data.brief.confirmed || false,
      });
    else setBrief(emptyBrief);
    if (data?.plan) setPlan(data.plan.snapshot);
    else setPlan(newPlan);
    if (initial.current && data) {
      initial.current = false;
      if (!runId && data.runs.length) setRunId(data.runs.at(-1)!.id);
    }
  }, [data?.project?.id, data?.brief?.id, data?.plan?.id]);
  const updateUrl = useCallback(
    (changes: Record<string, string>, push = false) => {
      const url = new URL(location.href);
      Object.entries(changes).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
        else url.searchParams.delete(k);
      });
      window.history[push ? "pushState" : "replaceState"]({}, "", url);
    },
    [],
  );
  function navigate(next: string) {
    setView(next);
    setMobileNav(false);
    setSearch("");
    setFilter("ALL");
    updateUrl({ view: next, project: project?.id || "", run: runId }, true);
  }
  function seek(session: string, step: string) {
    setSessionId(session);
    setStepId(step);
    updateUrl({
      view: "Theatre",
      project: project?.id || "",
      run: runId,
      session,
      step,
    });
  }
  useEffect(() => {
    if (!runId || !me) return;
    let stopped = false,
      lastState = "";
    let fetching = false;
    const refresh = async () => {
      if (fetching || stopped) return;
      fetching = true;
      try {
        const r = await api<Run>("runs/" + runId);
        if (!stopped) {
          setRun(r);
          setConnected(true);
          if (
            ["COMPLETED", "CANCELED", "FAILED"].includes(r.state) &&
            r.state !== lastState
          )
            await load(r.project_id);
          lastState = r.state;
        }
      } catch (e) {
        if (!stopped) {
          setConnected(false);
          setError((e as Error).message);
        }
      } finally {
        fetching = false;
      }
    };
    refresh();
    const controller = new AbortController();
    let notificationTimer: ReturnType<typeof setTimeout> | undefined;
    eventFeed(
      runId,
      controller.signal,
      () => {
        if (!notificationTimer)
          notificationTimer = setTimeout(() => {
            notificationTimer = undefined;
            refresh();
          }, 250);
      },
      setConnected,
    );
    const interval = setInterval(refresh, 2500);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(notificationTimer);
      clearInterval(interval);
    };
  }, [runId, me?.tenant_id, load]);
  useEffect(() => {
    if (view === "Settings")
      Promise.all([
        api<SettingsData>("settings"),
        api<typeof members>("memberships"),
      ])
        .then(([settings, members]) => {
          setSettings(settings);
          setMembers(members);
        })
        .catch((e) => setError(e.message));
  }, [view]);
  async function action(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveBrief(confirmed: boolean) {
    await action(async () => {
      await api("projects/" + project!.id + "/briefs", { ...brief, confirmed });
      await load(project!.id);
      notify(
        confirmed
          ? "Brief confirmed and version saved."
          : "Brief version saved.",
      );
      if (confirmed) navigate("Test Plans");
    });
  }
  async function savePlan(approved: boolean) {
    await action(async () => {
      const p = await api<{ id: string }>(
        "projects/" + project!.id + "/plans",
        { ...plan, approved },
      );
      await load(project!.id);
      launchKey.current = "";
      notify(
        approved
          ? "Plan approved. Ready for a bounded demo run."
          : "Plan version saved.",
      );
    });
  }
  async function launch(retest = false) {
    await action(async () => {
      if (!data?.plan) throw new Error("Save and approve a test plan first.");
      if (!launchKey.current) launchKey.current = crypto.randomUUID();
      const r = await api<Run>(
        "runs",
        {
          project_id: project!.id,
          plan_id: data.plan.id,
          baseline_id: retest ? runId : null,
        },
        "POST",
        { "Idempotency-Key": launchKey.current },
      );
      setRunId(r.id);
      setRun(null);
      setSessionId("");
      setStepId("");
      setView("Theatre");
      updateUrl(
        {
          view: "Theatre",
          run: r.id,
          project: project!.id,
          session: "",
          step: "",
        },
        true,
      );
      await load(project!.id);
      notify("Demo run launched. No browser worker or provider charges.");
    });
  }
  function openFinding(f: Finding) {
    setFinding(f);
    setNote("");
    setModal("finding");
  }
  function requestStudy(f?: Finding) {
    setEditingStudy(null);
    setFinding(f || null);
    setStudyBuildId(f ? run!.build_id : data?.builds.at(-1)?.id || "");
    setStudyForm({
      ...studyForm,
      instructions: f
        ? "Using sample data, create a Product Designer job posting and attempt to save it. Describe the result and any difficulty in your own words."
        : "Complete the assigned workflow using test data. Describe what happened in your own words.",
    });
    setModal("study");
  }
  async function openOperations(study: Study) {
    await action(async () => {
      setStudyId(study.id);
      setAssignments(
        await api<Assignment[]>("studies/" + study.id + "/assignments"),
      );
      setInvitation("");
      setModal("operations");
    });
  }
  async function openComparison() {
    await action(async () => {
      const comp = await api<Comparison>("runs/" + runId + "/comparison");
      setComparison(comp);
      setBaselineRun(await api<Run>("runs/" + comp.baseline.id));
      navigate("Comparison");
    });
  }
  async function retest() {
    await action(async () => {
      if (!run || run.state !== "COMPLETED")
        throw new Error("Complete the baseline run first.");
      if (run.snapshot.build === "B")
        throw new Error(
          "This demo supports A → B. Select a completed build A baseline.",
        );
      const p = await api<{ id: string }>(
        "projects/" + project!.id + "/plans",
        {
          ...run.snapshot,
          build: "B",
          target: "http://localhost:3000/fixture/hireflow?build=B",
          approved: true,
          authorization: true,
        },
      );
      const r = await api<Run>(
        "runs",
        { project_id: project!.id, plan_id: p.id, baseline_id: run.id },
        "POST",
        { "Idempotency-Key": crypto.randomUUID() },
      );
      setRunId(r.id);
      setRun(null);
      setSessionId("");
      setStepId("");
      setView("Theatre");
      updateUrl(
        {
          view: "Theatre",
          project: project!.id,
          run: r.id,
          session: "",
          step: "",
        },
        true,
      );
      await load(project!.id);
      notify("New demo build B run created. Baseline preserved.");
    });
  }

  if (loading)
    return (
      <div className="startup">
        <div className="brand-mark">p</div>
        <p>Opening your workspace…</p>
      </div>
    );
  if (signedOut)
    return (
      <div className="sign-in">
        <div className="login-brand">
          <div className="brand-mark">p</div>playground
          <span>PRODUCT VALIDATION</span>
        </div>
        <div className="login-card">
          <Badge tone="violet">LOCAL DEVELOPMENT</Badge>
          <h1>
            A clearer path
            <br />
            from idea to evidence.
          </h1>
          <p>
            Describe your product. Inspect the journey.
            <br />
            Know what to test next.
          </p>
          <a className="button" href="/auth/login">
            Open your workspace <ArrowRight size={17} />
          </a>
          <small>
            Sign in through local OIDC. No production credentials required.
          </small>
        </div>
        <div className="login-note">
          <FlaskConical size={18} />
          <span>
            Phase 1 includes persistent projects and a visibly labeled HireFlow
            demo.
          </span>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={"sidebar " + (mobileNav ? "mobile-open" : "")}>
        <a className="brand" href="/" aria-label="Playground home">
          <span className="brand-mark">p</span>playground
          <span className="brand-period">.</span>
        </a>
        <button
          className="workspace-selector"
          onClick={() => navigate("Settings")}
        >
          <span className="workspace-icon">
            <FlaskConical size={17} />
          </span>
          <span>
            <b>{me?.workspaces[0]?.name || "Workspace"}</b>
            <small>{me?.role} access</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(([name, Icon]) => (
            <button
              key={name}
              className={
                view === name || (name === "Overview" && view === "Intake")
                  ? "active"
                  : ""
              }
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Findings" && !!run?.findings.length && (
                <span className="nav-count">{run.findings.length}</span>
              )}
              {name === "Theatre" &&
                run &&
                !["COMPLETED", "CANCELED", "FAILED"].includes(run.state) && (
                  <i className="live-dot" />
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="phase-card">
            <span>
              <FlaskConical size={16} /> Phase 1 preview
            </span>
            <p>
              Evidence before assumptions.
              <br />
              Explore the full demo journey.
            </p>
            <button
              onClick={() => {
                navigate("Overview");
                notify(
                  "Start with the brief, then approve the plan and launch a demo run.",
                );
              }}
            >
              Explore Playground <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="user">
            <span className="avatar">{me?.name.slice(0, 1)}</span>
            <span>
              <b>{me?.name}</b>
              <small>Local OIDC account</small>
            </span>
            <form action="/auth/logout" method="post">
              <button
                title="Sign out"
                aria-label="Sign out"
                className="icon-button"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <select
              aria-label="Select project"
              value={project?.id || ""}
              onChange={(e) =>
                action(async () => {
                  setRun(null);
                  setRunId("");
                  setSessionId("");
                  setStepId("");
                  const d = await load(e.target.value);
                  if (d.runs.length) setRunId(d.runs.at(-1)!.id);
                  navigate("Overview");
                  updateUrl({
                    project: e.target.value,
                    run: "",
                    session: "",
                    step: "",
                  });
                })
              }
            >
              {!project && <option value="">No projects</option>}
              {data?.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.mode === "DEMO" ? " · Demo" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <i className={connected ? "dot" : "dot disconnected"} />
              {connected ? "Connected" : "Reconnecting"}
            </span>
            <button
              className="text-button"
              onClick={() => {
                setProjectForm({
                  name: "",
                  description: "",
                  stage: "prototype",
                });
                setModal("project");
              }}
            >
              <Plus size={15} />
              New project
            </button>
            <span className="avatar header-avatar">{me?.name[0]}</span>
          </div>
        </header>
        <main id="main" className="main-content">
          {error && (
            <div className="error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button
                onClick={() =>
                  action(async () => {
                    await load(project?.id);
                    if (runId) setRun(await api<Run>("runs/" + runId));
                    setConnected(true);
                  })
                }
              >
                Retry
              </button>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {project?.mode === "DEMO" && <DemoNotice />}
          {busy && (
            <div className="saving-indicator" role="status">
              Working with your workspace…
            </div>
          )}
          {!project && view !== "Settings" ? (
            <>
              <SectionHead
                eyebrow="YOUR WORKSPACE"
                title="Every product starts with a question."
                description="Create a project to turn your assumptions into a testable brief."
              />
              <Empty
                title="Your first validation starts here"
                action={
                  <Button onClick={() => setModal("project")}>
                    <Plus size={16} />
                    Create a project
                  </Button>
                }
              >
                Project data persists in PostgreSQL. Real integrations will
                explain what is needed before a run can launch.
              </Empty>
            </>
          ) : (
            <>
              {view === "Overview" && project && (
                <>
                  <SectionHead
                    eyebrow="PROJECT OVERVIEW"
                    title="Make your next move with evidence."
                    description="A focused workspace for the questions that matter to your product."
                    action={
                      <Button
                        secondary
                        onClick={() => {
                          setProjectForm({
                            name: project.name,
                            description: project.description,
                            stage: project.stage,
                          });
                          setModal("edit-project");
                        }}
                      >
                        Edit project <ArrowUpRight size={15} />
                      </Button>
                    }
                  />
                  <div className="overview-grid">
                    <section className="project-card">
                      <div className="inline spread">
                        <span className="product-icon">
                          <Briefcase size={24} />
                        </span>
                        <Badge
                          tone={project.mode === "DEMO" ? "violet" : "neutral"}
                        >
                          {project.mode === "DEMO"
                            ? "Illustrative product"
                            : project.stage}
                        </Badge>
                      </div>
                      <h2>{project.name}</h2>
                      <p>
                        {project.description ||
                          "Add a product description to begin your brief."}
                      </p>
                      <div className="project-tags">
                        <Badge>{project.stage}</Badge>
                        <Badge>Web / SaaS</Badge>
                        <Badge>
                          {project.mode === "DEMO"
                            ? "HireFlow fixture"
                            : "Real project"}
                        </Badge>
                      </div>
                      <div className="project-card-footer">
                        <span>
                          <i className="dot" /> Saved to PostgreSQL
                        </span>
                        <small>
                          Created{" "}
                          {new Date(project.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </section>
                    <section className="journey-card">
                      <div className="inline spread">
                        <h3>Your validation journey</h3>
                        <span className="small muted">ONE STEP AT A TIME</span>
                      </div>
                      {[
                        [
                          "01",
                          "Describe & confirm your brief",
                          "Intake",
                          data?.brief?.confirmed,
                        ],
                        [
                          "02",
                          "Approve personas & tasks",
                          "Test Plans",
                          data?.plan?.approved,
                        ],
                        [
                          "03",
                          "Watch the testing journey",
                          "Theatre",
                          run?.state === "COMPLETED",
                        ],
                        [
                          "04",
                          "Review evidence & compare",
                          "Findings",
                          !!data?.reports.length,
                        ],
                      ].map(([number, title, target, done]) => (
                        <button
                          key={String(number)}
                          onClick={() => navigate(String(target))}
                          className={"journey-row " + (done ? "done" : "")}
                        >
                          <span className="journey-number">
                            {done ? <Check size={15} /> : number}
                          </span>
                          <span>{title}</span>
                          {done ? (
                            <Badge tone="mint">Done</Badge>
                          ) : (
                            <ArrowRight size={16} />
                          )}
                        </button>
                      ))}
                    </section>
                  </div>
                  <NextAction
                    title={
                      !data?.brief?.confirmed
                        ? "Start with a sharper brief"
                        : !data?.plan?.approved
                          ? "Turn your brief into a test plan"
                          : !run
                            ? "Your plan is ready. Let’s test it."
                            : "Go straight to the evidence"
                    }
                    detail={
                      !data?.brief?.confirmed
                        ? "Capture the customer, the problem, and the decision you need to make."
                        : !data?.plan?.approved
                          ? "Review synthetic personas, task assertions, and explicit limits."
                          : !run
                            ? "Launch a deterministic sample run in the Demo workspace."
                            : "Open the latest session and inspect what happened."
                    }
                    onClick={() =>
                      navigate(
                        !data?.brief?.confirmed
                          ? "Intake"
                          : !data?.plan?.approved
                            ? "Test Plans"
                            : "Theatre",
                      )
                    }
                  />
                  <div className="section-subhead">
                    <h2>Recent activity</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("Reports")}
                    >
                      View reports <ArrowRight size={14} />
                    </button>
                  </div>
                  {data?.runs.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Validation run</th>
                            <th>Build</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {[...data.runs].reverse().map((r) => (
                            <tr key={r.id}>
                              <td>
                                <b>{project.name} · product journeys</b>
                                <small>
                                  {new Date(r.created_at).toLocaleString()}
                                </small>
                              </td>
                              <td>{r.snapshot.build}</td>
                              <td>
                                <Badge tone="violet">Demo fixture</Badge>
                              </td>
                              <td>
                                <Badge
                                  tone={
                                    r.state === "COMPLETED" ? "mint" : "neutral"
                                  }
                                >
                                  {r.state}
                                </Badge>
                              </td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    setRunId(r.id);
                                    setRun(null);
                                    navigate("Theatre");
                                    updateUrl({
                                      run: r.id,
                                      session: "",
                                      step: "",
                                    });
                                  }}
                                >
                                  Open <ArrowUpRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="activity-empty">
                      <Clapperboard size={24} />
                      <div>
                        <b>Your first journey is waiting.</b>
                        <p>
                          Approve a plan to see session evidence and findings
                          here.
                        </p>
                      </div>
                      <Button secondary onClick={() => navigate("Test Plans")}>
                        Open test plan
                      </Button>
                    </div>
                  )}
                  <div className="principle-grid">
                    <div>
                      <ShieldCheck size={20} />
                      <h4>Evidence stays attached</h4>
                      <p>
                        Every finding leads back to the observation that
                        supports it.
                      </p>
                    </div>
                    <div>
                      <Users size={20} />
                      <h4>Humans add perspective</h4>
                      <p>
                        Independent feedback gets its own provenance and report
                        version.
                      </p>
                    </div>
                    <div>
                      <GitCompareArrows size={20} />
                      <h4>Close the loop</h4>
                      <p>
                        Compare the same task on a new build, with coverage gaps
                        visible.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {view === "Intake" && project && (
                <>
                  <SectionHead
                    eyebrow="01 / PRODUCT BRIEF"
                    title="Start with the right question."
                    description="Describe the product. Make the unknowns explicit. Confirm what you want to learn."
                    action={
                      <Badge tone={data?.brief?.confirmed ? "mint" : "neutral"}>
                        {data?.brief?.confirmed ? "Confirmed" : "Draft"} · v
                        {data?.brief?.version || 0}
                      </Badge>
                    }
                  />
                  <div className="intake-layout">
                    <section className="panel conversation">
                      <div className="panel-heading">
                        <MessageSquare size={18} />
                        <h3>Guided intake</h3>
                        <Badge>
                          {project.mode === "DEMO"
                            ? "Deterministic demo"
                            : "Structured intake"}
                        </Badge>
                      </div>
                      <div className="conversation-messages">
                        {!data?.messages.length && (
                          <div className="chat assistant">
                            <b>Playground</b>
                            <p>
                              Who is your product for, and what decision should
                              this validation help you make?
                            </p>
                            <small>
                              Structured prompt · Model provider unavailable
                            </small>
                          </div>
                        )}
                        {data?.messages
                          .filter((m) => m.role !== "draft")
                          .map((m) => (
                            <div key={m.id} className={"chat " + m.role}>
                              <b>{m.role === "user" ? "You" : "Playground"}</b>
                              <p>{m.content}</p>
                            </div>
                          ))}
                      </div>
                      <form
                        className="chat-input"
                        onSubmit={(e) => {
                          e.preventDefault();
                          action(async () => {
                            await api("projects/" + project.id + "/messages", {
                              content: message,
                            });
                            setMessage("");
                            await load(project.id);
                            notify("Conversation saved.");
                          });
                        }}
                      >
                        <label className="sr-only" htmlFor="message">
                          Describe your product
                        </label>
                        <textarea
                          id="message"
                          placeholder="Tell us about your customer and workflow…"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={4000}
                          required
                        />
                        <Button
                          type="submit"
                          disabled={busy || !message.trim()}
                        >
                          <Send size={16} />
                          Save answer
                        </Button>
                        <small className="muted" role="status">
                          {draftSaved
                            ? "Draft autosaved to your workspace."
                            : "Answers are saved when submitted; drafts autosave while typing."}
                        </small>
                      </form>
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <FileText size={18} />
                        <h3>Your editable brief</h3>
                        <span className="small muted">Versioned on save</span>
                      </div>
                      <form
                        className="brief-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveBrief(true);
                        }}
                      >
                        {(
                          [
                            ["customer", "Intended customer"],
                            ["problem", "Problem to solve"],
                            ["workflow", "Key workflow"],
                            ["alternative", "Current alternative"],
                            ["geography", "Market / geography"],
                            ["decision", "Decision to make"],
                            ["assumptions", "Assumptions"],
                            ["unknowns", "Unanswered questions"],
                          ] as const
                        ).map(([key, title]) => (
                          <label key={key}>
                            {title}
                            <textarea
                              value={brief[key] || ""}
                              onChange={(e) =>
                                setBrief({
                                  ...brief,
                                  [key]: e.target.value,
                                  confirmed: false,
                                })
                              }
                              required={
                                !["assumptions", "unknowns"].includes(key)
                              }
                              rows={key === "problem" ? 3 : 2}
                              maxLength={key === "geography" ? 200 : 2000}
                            />
                          </label>
                        ))}
                        <div className="form-actions">
                          <Button
                            secondary
                            onClick={() => saveBrief(false)}
                            disabled={busy}
                          >
                            Save draft
                          </Button>
                          <Button type="submit" disabled={busy}>
                            Confirm brief <Check size={16} />
                          </Button>
                        </div>
                      </form>
                    </section>
                  </div>
                </>
              )}
              {view === "Research" && (
                <>
                  <SectionHead
                    eyebrow="RESEARCH CONTEXT"
                    title="Understand the alternatives."
                    description="Keep source-backed claims separate from hypotheses and sample content."
                  />
                  <div className="toolbar">
                    <div className="search-field">
                      <Search size={16} />
                      <input
                        aria-label="Search research"
                        placeholder="Search customer, problem, pricing, or market…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Research status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="ALL">All cases</option>
                      <option value="Active">Active alternatives</option>
                      <option value="Historical">Historical cases</option>
                    </select>
                    <Button
                      secondary
                      onClick={() =>
                        setError(
                          "Source-backed research is unavailable in Phase 1. Configure retrieval and model providers for the Phase 2 research adapter. No claims or charges were generated.",
                        )
                      }
                    >
                      Run research <ArrowUpRight size={15} />
                    </Button>
                  </div>
                  {data?.sources.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Alternative</th>
                            <th>Customer / problem</th>
                            <th>Business model</th>
                            <th>Status / as of</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.sources
                            .filter(
                              (s) =>
                                JSON.stringify(s.snapshot)
                                  .toLowerCase()
                                  .includes(search.toLowerCase()) &&
                                (filter === "ALL" ||
                                  s.snapshot.status.startsWith(filter)),
                            )
                            .map((s) => (
                              <tr key={s.id}>
                                <td>
                                  <b>{s.snapshot.name}</b>
                                  <Badge tone="violet">Illustrative</Badge>
                                </td>
                                <td>
                                  {s.snapshot.customer}
                                  <small>
                                    {s.snapshot.problem} ·{" "}
                                    {s.snapshot.geography}
                                  </small>
                                </td>
                                <td>{s.snapshot.pricing}</td>
                                <td>
                                  {s.snapshot.status}
                                  <small>{s.snapshot.as_of}</small>
                                </td>
                                <td>
                                  <button
                                    className="text-button"
                                    onClick={() => {
                                      setResearchSource(s.id);
                                      setModal("research");
                                    }}
                                  >
                                    Inspect source <ArrowUpRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty title="Research is not connected">
                      Configure a retrieval provider in Phase 2. Missing
                      credentials never become fictional market results in a
                      real project.
                    </Empty>
                  )}
                  <div className="quiet-note">
                    <Info size={17} />
                    <p>
                      These fictional cases illustrate the research interface. A
                      missing website does not establish that a company failed.
                      Synthetic outcomes do not demonstrate market demand.
                    </p>
                  </div>
                </>
              )}
              {view === "Test Plans" && project && (
                <>
                  <SectionHead
                    eyebrow="02 / TEST PLAN"
                    title="Give every journey a purpose."
                    description="Approve what gets tested, who attempts it, and where the run must stop."
                    action={
                      <div className="inline">
                        <Badge tone={data?.plan?.approved ? "mint" : "neutral"}>
                          {data?.plan?.approved ? "Approved" : "Draft"} · v
                          {data?.plan?.version || 0}
                        </Badge>
                        {project.mode === "DEMO" && (
                          <Button
                            secondary
                            onClick={() =>
                              action(async () => {
                                setPlan(
                                  await api<PlanInput>("demo/plan-template"),
                                );
                                notify(
                                  "Sample defaults restored in the editor. Save or approve to persist.",
                                );
                              })
                            }
                          >
                            Restore sample defaults
                          </Button>
                        )}
                      </div>
                    }
                  />
                  <div className="plan-target panel">
                    <div>
                      <label>
                        Target build
                        <input
                          value={plan.target}
                          onChange={(e) =>
                            setPlan({
                              ...plan,
                              target: e.target.value,
                              approved: false,
                            })
                          }
                          placeholder="https://your-staging-build.example"
                        />
                      </label>
                    </div>
                    <label>
                      Build reference
                      {project.mode === "REAL" ? (
                        <input
                          value={plan.build}
                          onChange={(e) =>
                            setPlan({
                              ...plan,
                              build: e.target.value,
                              approved: false,
                            })
                          }
                          placeholder="e.g. staging-2026-10-14"
                          maxLength={100}
                        />
                      ) : (
                        <select
                          value={plan.build}
                          onChange={(e) =>
                            setPlan({
                              ...plan,
                              build: e.target.value as "A" | "B",
                              target:
                                project.mode === "DEMO"
                                  ? `http://localhost:3000/fixture/hireflow?build=${e.target.value}`
                                  : plan.target,
                              approved: false,
                            })
                          }
                        >
                          <option value="A">Build A · baseline</option>
                          <option value="B">Build B · selected fixes</option>
                        </select>
                      )}
                    </label>
                    <label>
                      Account / fixture reference
                      <input
                        value={plan.credentials_reference}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            credentials_reference: e.target.value,
                            approved: false,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="section-subhead">
                    <div>
                      <h2>
                        Synthetic personas <Badge>{plan.personas.length}</Badge>
                      </h2>
                      <p>
                        Task hypotheses, not recruited people or representative
                        sampling.
                      </p>
                    </div>
                    <Button
                      secondary
                      disabled={plan.personas.length >= 6}
                      onClick={() =>
                        setPlan({
                          ...plan,
                          personas: [
                            ...plan.personas,
                            {
                              name: "New persona",
                              role: "Product user",
                              experience: "New user",
                              intent: "Complete the approved workflow",
                              language: "English",
                              assumptions: "Synthetic task hypothesis",
                            },
                          ],
                          approved: false,
                        })
                      }
                    >
                      <Plus size={15} />
                      Add persona
                    </Button>
                  </div>
                  <div className="persona-grid">
                    {plan.personas.map((persona, i) => (
                      <div className="persona-card" key={i}>
                        <div className="inline spread">
                          <span className={"avatar avatar-" + (i % 4)}>
                            {persona.name[0]}
                          </span>
                          <Badge tone="violet">Synthetic</Badge>
                          {plan.personas.length > 1 && (
                            <button
                              className="icon-button"
                              aria-label={"Remove " + persona.name}
                              onClick={() =>
                                setPlan({
                                  ...plan,
                                  personas: plan.personas.filter(
                                    (_, j) => j !== i,
                                  ),
                                  approved: false,
                                })
                              }
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {(
                          [
                            "name",
                            "role",
                            "experience",
                            "intent",
                            "language",
                            "assumptions",
                          ] as const
                        ).map((key) => (
                          <label key={key}>
                            {key}
                            <input
                              value={persona[key] || ""}
                              onChange={(e) => {
                                const personas = [...plan.personas];
                                personas[i] = {
                                  ...persona,
                                  [key]: e.target.value,
                                };
                                setPlan({ ...plan, personas, approved: false });
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="section-subhead">
                    <div>
                      <h2>Tasks & success assertions</h2>
                      <p>
                        Outcomes are explicit. Agent uncertainty stays unknown.
                      </p>
                    </div>
                    <Button
                      secondary
                      disabled={plan.tasks.length >= 2}
                      onClick={() =>
                        setPlan({
                          ...plan,
                          tasks: [
                            ...plan.tasks,
                            {
                              ...newPlan.tasks[0],
                              key: "second-task",
                              name: "Second workflow",
                            },
                          ],
                          approved: false,
                        })
                      }
                    >
                      <Plus size={15} />
                      Add task
                    </Button>
                  </div>
                  <div className="task-grid">
                    {plan.tasks.map((task, i) => (
                      <section className="panel task-card" key={i}>
                        <div className="inline spread">
                          <span className="overline">
                            TASK {String(i + 1).padStart(2, "0")}
                          </span>
                          {plan.tasks.length > 1 && (
                            <button
                              className="icon-button"
                              aria-label={"Remove " + task.name}
                              onClick={() =>
                                setPlan({
                                  ...plan,
                                  tasks: plan.tasks.filter((_, j) => j !== i),
                                  approved: false,
                                })
                              }
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {(
                          [
                            "key",
                            "name",
                            "goal",
                            "assertion",
                            "start",
                            "allowed_actions",
                            "stop_conditions",
                          ] as const
                        ).map((key) => (
                          <label key={key}>
                            {key.replaceAll("_", " ")}
                            <textarea
                              rows={key === "allowed_actions" ? 2 : 1}
                              value={task[key] || ""}
                              onChange={(e) => {
                                const tasks = [...plan.tasks];
                                tasks[i] = { ...task, [key]: e.target.value };
                                setPlan({ ...plan, tasks, approved: false });
                              }}
                            />
                          </label>
                        ))}
                      </section>
                    ))}
                  </div>
                  <section className="panel limits">
                    <div>
                      <h3>Execution envelope</h3>
                      <p>Caps define scope, not representative coverage.</p>
                    </div>
                    <div className="limits-grid">
                      {(
                        [
                          ["max_actions", "Actions / journey", 1, 25],
                          ["max_seconds", "Seconds / journey", 10, 180],
                          ["concurrency", "Browser slots", 1, 4],
                          ["budget_cents", "Budget cap (USD cents)", 0, 5000],
                        ] as const
                      ).map(([key, title, min, max]) => (
                        <label key={key}>
                          {title}
                          <input
                            type="number"
                            min={min}
                            max={max}
                            value={plan[key]}
                            onChange={(e) =>
                              setPlan({
                                ...plan,
                                [key]: Number(e.target.value),
                                approved: false,
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <div className="inline wrap">
                      <b className="small">Viewports</b>
                      {(["1440×900", "390×844"] as const).map((v) => (
                        <label className="check-label" key={v}>
                          <input
                            type="checkbox"
                            checked={plan.viewports.includes(v)}
                            onChange={(e) =>
                              setPlan({
                                ...plan,
                                viewports: e.target.checked
                                  ? [...plan.viewports, v]
                                  : plan.viewports.filter((item) => item !== v),
                                approved: false,
                              })
                            }
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                    <label className="check-label authorization">
                      <input
                        type="checkbox"
                        checked={plan.authorization}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            authorization: e.target.checked,
                            approved: false,
                          })
                        }
                      />
                      I authorize this target and the listed test-data actions.
                      No purchases, destructive actions, or external messaging.
                    </label>
                  </section>
                  <div className="plan-summary">
                    <div>
                      <b>
                        {plan.personas.length *
                          plan.tasks.length *
                          plan.viewports.length}{" "}
                        planned journeys
                      </b>
                      <span>
                        {plan.personas.length} personas × {plan.tasks.length}{" "}
                        tasks × {plan.viewports.length} viewports ·{" "}
                        {money(plan.budget_cents)} cap
                      </span>
                    </div>
                    <div className="inline">
                      <Button
                        secondary
                        disabled={busy}
                        onClick={() => savePlan(false)}
                      >
                        Save plan
                      </Button>
                      <Button
                        disabled={
                          busy || !plan.authorization || !plan.viewports.length
                        }
                        onClick={() => savePlan(true)}
                      >
                        Approve plan <CheckCheck size={16} />
                      </Button>
                      {data?.plan?.approved && (
                        <Button
                          secondary
                          disabled={busy || !plan.approved}
                          onClick={() => launch()}
                        >
                          Launch {project.mode === "DEMO" ? "demo" : "testing"}{" "}
                          <ArrowRight size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {project.mode === "REAL" && (
                    <div className="quiet-note">
                      <Info size={18} />
                      <p>
                        Real browser execution is unavailable in Phase 1. Your
                        brief and plan are persistent. Configure the Phase 2
                        worker before launching.
                      </p>
                    </div>
                  )}
                </>
              )}
              {(view === "Theatre" ||
                view === "Findings" ||
                view === "Reports" ||
                view === "Comparison") && (
                <>
                  <SectionHead
                    eyebrow={
                      view === "Theatre"
                        ? "03 / LIVE TESTING THEATRE"
                        : view === "Findings"
                          ? "04 / EVIDENCE & FINDINGS"
                          : view === "Reports"
                            ? "VALIDATION REPORTS"
                            : "BUILD COMPARISON"
                    }
                    title={
                      view === "Theatre"
                        ? "Watch the journey. Find the friction."
                        : view === "Findings"
                          ? "Go from observation to action."
                          : view === "Reports"
                            ? "The evidence, in perspective."
                            : "Verify what changed."
                    }
                    description={
                      view === "Theatre"
                        ? "Select a session. Inspect a step. Follow every finding back to evidence."
                        : view === "Findings"
                          ? "Review the observation, its support, and the proposed next move."
                          : view === "Reports"
                            ? "Immutable versions keep sample browser, audit, and human evidence distinct."
                            : "Aligned by task milestones, with missing coverage made explicit."
                    }
                    action={
                      run && (
                        <div className="inline">
                          <select
                            aria-label="Select run"
                            value={runId}
                            onChange={(e) => {
                              setRunId(e.target.value);
                              setRun(null);
                              setSessionId("");
                              setStepId("");
                              updateUrl({
                                run: e.target.value,
                                session: "",
                                step: "",
                              });
                            }}
                          >
                            {data?.runs.map((r, i) => (
                              <option key={r.id} value={r.id}>
                                Run {String(i + 1).padStart(2, "0")} · Build{" "}
                                {r.snapshot.build}
                              </option>
                            ))}
                          </select>
                          {run.state === "COMPLETED" && (
                            <Button secondary disabled={busy} onClick={retest}>
                              Retest build <RefreshCw size={15} />
                            </Button>
                          )}
                        </div>
                      )
                    }
                  />
                  {!run ? (
                    <Empty
                      title={
                        runId
                          ? "Loading persisted run…"
                          : "Your theatre is ready when you are."
                      }
                      action={
                        !runId && (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              data?.plan?.approved
                                ? launch()
                                : navigate("Test Plans")
                            }
                          >
                            {data?.plan?.approved
                              ? project?.mode === "DEMO"
                                ? "Launch demo run"
                                : "Launch testing"
                              : "Review test plan"}{" "}
                            <ArrowRight size={16} />
                          </Button>
                        )
                      }
                    >
                      {runId
                        ? "Fetching the authoritative snapshot."
                        : project?.mode === "DEMO"
                          ? "Confirm your brief and approve a plan to begin a clearly labeled sample journey."
                          : "Real execution is unavailable in Phase 1. Your brief and plan are persistent; no demonstration results are generated for this project."}
                    </Empty>
                  ) : (
                    <>
                      {view === "Theatre" && (
                        <>
                          <Theatre
                            run={run}
                            sessionId={sessionId}
                            stepId={stepId}
                            onSeek={seek}
                            onFinding={openFinding}
                            onCancel={() =>
                              action(async () => {
                                await api("runs/" + runId + "/cancel", {});
                                setRun(await api<Run>("runs/" + runId));
                                notify(
                                  "Demo progression canceled. Partial evidence preserved.",
                                );
                              })
                            }
                            onNote={(id, value) =>
                              action(async () => {
                                await api("steps/" + id + "/annotations", {
                                  note: value,
                                });
                                setRun(await api<Run>("runs/" + runId));
                                notify("Annotation saved.");
                              })
                            }
                          />
                          {run.state === "COMPLETED" && (
                            <div className="completion-note">
                              <CheckCircle2 size={19} />
                              <span>
                                <b>Demo run complete.</b> Inspect the evidence,
                                draft a human study, or compare a retest.
                              </span>
                              <button
                                className="text-button"
                                onClick={() => navigate("Findings")}
                              >
                                Review findings <ArrowRight size={14} />
                              </button>
                              <button
                                className="text-button"
                                onClick={openComparison}
                                disabled={busy}
                              >
                                Compare with baseline{" "}
                                <GitCompareArrows size={15} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {view === "Findings" && (
                        <>
                          <div className="toolbar">
                            <div className="search-field">
                              <Search size={16} />
                              <input
                                aria-label="Search findings"
                                placeholder="Search findings…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                            </div>
                            <select
                              aria-label="Finding category"
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                            >
                              <option value="ALL">All categories</option>
                              {[
                                "Usability",
                                "Accessibility",
                                "Trust",
                                "Conversion",
                              ].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                            <select
                              aria-label="Sort findings"
                              value={sort}
                              onChange={(e) => setSort(e.target.value)}
                            >
                              <option value="severity">Priority first</option>
                              <option value="title">Title A–Z</option>
                            </select>
                            <Badge>{run.findings.length} findings · demo</Badge>
                          </div>
                          {run.findings.length ? (
                            <div className="findings-list">
                              {run.findings
                                .filter(
                                  (f) =>
                                    (filter === "ALL" ||
                                      f.category === filter) &&
                                    f.title
                                      .toLowerCase()
                                      .includes(search.toLowerCase()),
                                )
                                .sort((a, b) =>
                                  sort === "title"
                                    ? a.title.localeCompare(b.title)
                                    : [
                                        "Blocker",
                                        "Major",
                                        "Minor",
                                        "Suggestion",
                                      ].indexOf(a.severity) -
                                      [
                                        "Blocker",
                                        "Major",
                                        "Minor",
                                        "Suggestion",
                                      ].indexOf(b.severity),
                                )
                                .map((f, i) => (
                                  <button
                                    className="finding-row"
                                    key={f.id}
                                    onClick={() => openFinding(f)}
                                  >
                                    <span
                                      className={
                                        "finding-number " +
                                        (f.severity === "Blocker" ? "red" : "")
                                      }
                                    >
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                      <div className="inline wrap">
                                        <Badge
                                          tone={
                                            f.severity === "Blocker"
                                              ? "red"
                                              : f.severity === "Major"
                                                ? "amber"
                                                : "neutral"
                                          }
                                        >
                                          {f.severity}
                                        </Badge>
                                        <span className="small muted">
                                          {f.category} · Build{" "}
                                          {run.snapshot.build}
                                        </span>
                                      </div>
                                      <h3>{f.title}</h3>
                                      <p>{f.observation}</p>
                                      <div className="inline wrap">
                                        <small>{label(f.evidence_type)}</small>
                                        <Badge
                                          tone={
                                            f.support === "SUPPORTED"
                                              ? "mint"
                                              : "amber"
                                          }
                                        >
                                          {f.support}
                                        </Badge>
                                        {f.reviews.length > 0 && (
                                          <Badge>
                                            {label(f.reviews.at(-1)!.status)}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <ArrowUpRight size={20} />
                                  </button>
                                ))}
                            </div>
                          ) : (
                            <Empty title="No findings for this run">
                              {run.state === "COMPLETED"
                                ? "This demo build has no newly seeded findings. Compare baseline coverage before drawing a conclusion."
                                : "Findings appear when sample steps are persisted. The demo is progressing."}
                            </Empty>
                          )}
                          <div className="quiet-note">
                            <Info size={17} />
                            <p>
                              Acknowledging a finding does not mark it fixed.
                              Real resolution requires relevant coverage in a
                              later run.
                            </p>
                          </div>
                        </>
                      )}
                      {view === "Reports" && (
                        <ReportView
                          reports={
                            data?.reports.filter((r) => r.run_id === runId) ||
                            []
                          }
                          selected={selectedReport}
                          select={setSelectedReport}
                          onFinding={(id) => {
                            const f = run.findings.find(
                              (item) => item.id === id,
                            );
                            if (f) openFinding(f);
                            else
                              notify(
                                "Select the original run to inspect this finding.",
                              );
                          }}
                        />
                      )}
                      {view === "Comparison" &&
                        (comparison && baselineRun ? (
                          <>
                            <div className="comparison-notice">
                              <GitCompareArrows size={19} />
                              <span>
                                <b>Demo comparison · A → B</b>
                                <small>
                                  {comparison.conditions.intentional_changes}.
                                  Viewport and task matching are required. Human
                                  verification remains separate.
                                </small>
                              </span>
                              <Button secondary onClick={openComparison}>
                                Refresh comparison
                              </Button>
                            </div>
                            <div className="comparison-grid">
                              {[baselineRun, run].map((r, i) => {
                                const match =
                                  r.sessions.find(
                                    (s) =>
                                      s.task.key === "create-job" &&
                                      s.viewport === "1440×900",
                                  ) || r.sessions[0];
                                const step = match?.steps.find(
                                  (s) => s.milestone === comparisonMilestone,
                                );
                                return (
                                  <div className="comparison-stage" key={r.id}>
                                    <div className="inline spread">
                                      <h3>
                                        {i ? "Retest" : "Baseline"} · Build{" "}
                                        {r.snapshot.build}
                                      </h3>
                                      <Badge
                                        tone={
                                          match?.outcome === "PASS"
                                            ? "mint"
                                            : match?.outcome === "FAIL"
                                              ? "red"
                                              : "amber"
                                        }
                                      >
                                        {match?.outcome || "PENDING"}
                                      </Badge>
                                    </div>
                                    <div className="browser-stage">
                                      <div className="browser-chrome">
                                        <span>
                                          {step?.url || "Milestone missing"}
                                        </span>
                                        <span>DEMO</span>
                                      </div>
                                      <EvidenceImage step={step} />
                                    </div>
                                    <p>
                                      {step?.summary ||
                                        "Milestone not covered — untested"}
                                    </p>
                                    <small>
                                      {match?.steps.length || 0} captured steps
                                      · {match?.viewport} · illustrative
                                      evidence
                                    </small>
                                    <button
                                      className="text-button"
                                      onClick={() => {
                                        setRunId(r.id);
                                        setRun(r);
                                        setSessionId(match.id);
                                        setStepId(step?.id || "");
                                        navigate("Theatre");
                                        updateUrl({
                                          run: r.id,
                                          session: match.id,
                                          step: step?.id || "",
                                        });
                                      }}
                                    >
                                      Open evidence <ArrowUpRight size={15} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="milestone-controls">
                              <span className="overline">
                                LINKED MILESTONES
                              </span>
                              {["opened", "form", "filled", "submitted"].map(
                                (m) => (
                                  <button
                                    className={
                                      m === comparisonMilestone ? "active" : ""
                                    }
                                    key={m}
                                    onClick={() => setComparisonMilestone(m)}
                                  >
                                    {m}
                                  </button>
                                ),
                              )}
                            </div>
                            <div className="table-wrap">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Baseline finding</th>
                                    <th>Retest classification</th>
                                    <th>Evidence basis</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {comparison.items.map((item) => (
                                    <tr key={item.finding.id}>
                                      <td>{item.finding.title}</td>
                                      <td>
                                        <Badge
                                          tone={
                                            item.status === "UNTESTED"
                                              ? "amber"
                                              : "mint"
                                          }
                                        >
                                          {label(item.status)}
                                        </Badge>
                                      </td>
                                      <td>
                                        {item.milestone} ·{" "}
                                        {item.finding.evidence_type ===
                                        "AI_HYPOTHESIS"
                                          ? "Heuristic not exercised"
                                          : "Matched synthetic task / viewport"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="quiet-note">
                              <Info size={17} />
                              <p>
                                Fixed in this retest describes the demo fixture
                                only. The disclosure hypothesis remains
                                untested; successful task completion does not
                                prove an absence of usability friction.
                              </p>
                            </div>
                          </>
                        ) : (
                          <Empty
                            title="Choose a retest to compare"
                            action={
                              <Button onClick={openComparison}>
                                Load baseline comparison
                              </Button>
                            }
                          >
                            Retest creates a new immutable build/run, preserving
                            the original evidence.
                          </Empty>
                        ))}
                    </>
                  )}
                </>
              )}
              {view === "Human Studies" && (
                <>
                  <SectionHead
                    eyebrow="INDEPENDENT PERSPECTIVE"
                    title="Let real people test the assumption."
                    description="Draft neutral tasks, screen manually, and keep independent observations separate."
                    action={
                      <Button
                        disabled={!data?.builds.length}
                        onClick={() => requestStudy()}
                      >
                        <Plus size={16} />
                        Draft study
                      </Button>
                    }
                  />
                  <div className="quiet-note">
                    <ShieldCheck size={18} />
                    <p>
                      Recruitment is manual. Quote requests and incentive
                      amounts are administrative records. No people are
                      instantly available, no messages are sent, and no payments
                      are made.
                    </p>
                  </div>
                  {data?.studies.length ? (
                    <div className="studies-grid">
                      {data.studies.map((s, i) => (
                        <section key={s.id} className="panel study-card">
                          <div className="inline spread">
                            <span className="overline">
                              STUDY {String(i + 1).padStart(2, "0")}
                            </span>
                            <Badge
                              tone={s.state === "REVIEWED" ? "mint" : "neutral"}
                            >
                              {label(s.state)}
                            </Badge>
                          </div>
                          <h3>{s.snapshot.audience}</h3>
                          <p>{s.snapshot.instructions}</p>
                          <dl>
                            <dt>Participants requested</dt>
                            <dd>{s.snapshot.participant_count}</dd>
                            <dt>Session length</dt>
                            <dd>{s.snapshot.session_minutes} minutes</dd>
                            <dt>Incentive (not paid)</dt>
                            <dd>{money(s.snapshot.incentive_cents)} each</dd>
                            <dt>Recording</dt>
                            <dd>Unavailable · written feedback</dd>
                          </dl>
                          <div className="form-actions">
                            {["DRAFT", "QUOTE_REQUESTED"].includes(s.state) && (
                              <Button
                                secondary
                                onClick={() => {
                                  setEditingStudy(s);
                                  setFinding(null);
                                  setStudyBuildId(s.build_id);
                                  setStudyForm({
                                    audience: s.snapshot.audience,
                                    instructions: s.snapshot.instructions,
                                    screening: s.snapshot.screening,
                                    participant_count:
                                      s.snapshot.participant_count,
                                    session_minutes: s.snapshot.session_minutes,
                                    incentive_cents: s.snapshot.incentive_cents,
                                  });
                                  setModal("study");
                                }}
                              >
                                Edit draft
                              </Button>
                            )}
                            <Button
                              secondary
                              disabled={
                                !["DRAFT", "QUOTE_REQUESTED"].includes(s.state)
                              }
                              onClick={() =>
                                action(async () => {
                                  const result = await api<{ note: string }>(
                                    "studies/" + s.id + "/quote",
                                    {},
                                  );
                                  notify(result.note);
                                  await load(project?.id);
                                })
                              }
                            >
                              Request quote
                            </Button>
                            <Button onClick={() => openOperations(s)}>
                              Operations <ArrowRight size={15} />
                            </Button>
                          </div>
                          {s.snapshot.mode === "DEMO" && (
                            <small className="sample-label">
                              Demo study · local test accounts only
                            </small>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Human verification starts with a task"
                      action={
                        <Button secondary onClick={() => navigate("Findings")}>
                          Choose a finding <ArrowRight size={15} />
                        </Button>
                      }
                    >
                      Request a study from a finding to preserve its task and
                      build context. Participants receive neutral instructions
                      and cannot see AI conclusions.
                    </Empty>
                  )}
                </>
              )}
              {view === "Settings" && (
                <>
                  <SectionHead
                    eyebrow="WORKSPACE SETTINGS"
                    title="Know what’s connected."
                    description="Identity, persistence, service readiness, and explicit usage boundaries."
                  />
                  {settings ? (
                    <>
                      <div className="settings-grid">
                        <section className="panel settings-panel">
                          <h3>Membership & access</h3>
                          <div className="member-row">
                            <span className="avatar">{me?.name[0]}</span>
                            <div>
                              <b>{me?.name}</b>
                              <small>OIDC identity · current workspace</small>
                            </div>
                            <Badge tone="violet">{me?.role}</Badge>
                          </div>
                          <p className="small muted">
                            Operator actions require explicit grants.
                            Participant invitations grant access to one
                            assignment only. Owner/admin grants use the exact
                            subject from the configured OIDC provider.
                          </p>
                          <div className="member-list">
                            {members.map((m) => (
                              <div className="member-row" key={m.id}>
                                <div>
                                  <b>{m.name}</b>
                                  <small>{m.subject}</small>
                                </div>
                                <Badge>{m.role}</Badge>
                              </div>
                            ))}
                          </div>
                          {["owner", "admin"].includes(me?.role || "") && (
                            <form
                              className="member-form"
                              onSubmit={(e) => {
                                e.preventDefault();
                                action(async () => {
                                  await api("memberships", memberForm);
                                  setMembers(await api("memberships"));
                                  setMe(await api("me"));
                                  setMemberForm({
                                    subject: "",
                                    name: "",
                                    role: "viewer",
                                  });
                                  notify(
                                    "Membership grant saved. No external invitation was sent.",
                                  );
                                });
                              }}
                            >
                              <label>
                                OIDC identity subject
                                <input
                                  required
                                  value={memberForm.subject}
                                  onChange={(e) =>
                                    setMemberForm({
                                      ...memberForm,
                                      subject: e.target.value,
                                    })
                                  }
                                  maxLength={200}
                                />
                              </label>
                              <label>
                                Display name
                                <input
                                  required
                                  value={memberForm.name}
                                  onChange={(e) =>
                                    setMemberForm({
                                      ...memberForm,
                                      name: e.target.value,
                                    })
                                  }
                                  maxLength={160}
                                />
                              </label>
                              <label>
                                Workspace role
                                <select
                                  value={memberForm.role}
                                  onChange={(e) =>
                                    setMemberForm({
                                      ...memberForm,
                                      role: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "viewer",
                                    "editor",
                                    "operator",
                                    "admin",
                                    "owner",
                                  ].map((role) => (
                                    <option key={role}>{role}</option>
                                  ))}
                                </select>
                              </label>
                              <Button type="submit" secondary disabled={busy}>
                                Save membership grant
                              </Button>
                            </form>
                          )}
                        </section>
                        <section className="panel settings-panel">
                          <h3>Evidence retention preference</h3>
                          <label>
                            Retention days
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={settings.retention_days}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  retention_days: Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <Button
                            secondary
                            onClick={() =>
                              action(async () => {
                                await api(
                                  "settings",
                                  { retention_days: settings.retention_days },
                                  "PATCH",
                                );
                                notify(
                                  "Retention preference saved. Automated purge is a Phase 2 operator task.",
                                );
                              })
                            }
                          >
                            Save preference
                          </Button>
                          <p className="small muted">
                            Preference is persistent. Automated physical
                            deletion is not active in Phase 1.
                          </p>
                        </section>
                      </div>
                      <div className="section-subhead">
                        <h2>Integration readiness</h2>
                        <Badge>Phase 1</Badge>
                      </div>
                      <div className="integration-list">
                        {settings.integrations.map((item) => (
                          <div key={item.name}>
                            <span className="integration-icon">
                              <Command size={19} />
                            </span>
                            <span>
                              <b>{item.name}</b>
                              <small>{item.detail}</small>
                            </span>
                            <Badge
                              tone={
                                item.state === "READY"
                                  ? "mint"
                                  : item.state === "UNAVAILABLE"
                                    ? "amber"
                                    : "neutral"
                              }
                            >
                              {label(item.state)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="panel usage-panel">
                        <h3>Usage & configured limits</h3>
                        <b>
                          {money(settings.usage.actual_cents)} actual provider
                          charges
                        </b>
                        <p>{settings.usage.note}</p>
                        <span className="small muted">
                          Default envelope: 6 personas × 2 tasks × 2 viewports.
                          Up to 4 slots, 25 actions, 180 seconds per journey.
                          $50 is a configurable ceiling and pricing hypothesis,
                          not a live purchase.
                        </span>
                      </div>
                    </>
                  ) : (
                    <Empty title="Loading service readiness">
                      Fetching configuration from the API.
                    </Empty>
                  )}
                </>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>
              playground <span className="footer-dot">/</span> evidence before
              assumptions
            </span>
            <span>Phase 1 · local preview</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {["project", "edit-project"].includes(modal) && (
        <Modal
          error={error}
          title={
            modal === "project"
              ? "A new question worth testing."
              : "Edit project"
          }
          close={() => setModal("")}
        >
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                const p = await api<Project>(
                  modal === "project" ? "projects" : "projects/" + project!.id,
                  projectForm,
                  modal === "project" ? "POST" : "PATCH",
                );
                setModal("");
                setRunId("");
                setRun(null);
                await load(p.id);
                navigate(modal === "edit-project" ? "Overview" : "Intake");
                updateUrl({ project: p.id, run: "", session: "", step: "" });
                notify("Project saved to PostgreSQL.");
              });
            }}
          >
            <label>
              Project name
              <input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                maxLength={160}
                required
                autoFocus
              />
            </label>
            <label>
              Product description
              <textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                maxLength={10000}
                rows={4}
              />
            </label>
            <label>
              Product stage
              <select
                value={projectForm.stage}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, stage: e.target.value })
                }
              >
                <option value="idea">Idea only</option>
                <option value="prototype">Web prototype</option>
                <option value="launched">Launched / new feature</option>
              </select>
            </label>
            <div className="quiet-note">
              <Info size={16} />
              <p>
                {modal === "project"
                  ? "New projects are real persistent records. Live execution needs Phase 2 integrations."
                  : "Changing the stage updates browser-test eligibility. Existing snapshots are preserved."}
              </p>
            </div>
            <Button type="submit" disabled={busy}>
              Save project <ArrowRight size={16} />
            </Button>
            {modal === "edit-project" && (
              <Button
                secondary
                onClick={() =>
                  action(async () => {
                    await api("projects/" + project!.id, undefined, "DELETE");
                    setModal("");
                    setRunId("");
                    setRun(null);
                    await load();
                    navigate("Overview");
                    notify("Project archived. Historical records retained.");
                  })
                }
              >
                Archive project
              </Button>
            )}
          </form>
        </Modal>
      )}
      {modal === "finding" && finding && (
        <Modal error={error} title={finding.title} close={() => setModal("")}>
          <div className="finding-detail">
            <div className="inline wrap">
              <Badge tone={finding.severity === "Blocker" ? "red" : "amber"}>
                {finding.severity}
              </Badge>
              <Badge>{finding.category}</Badge>
              <Badge tone={finding.support === "SUPPORTED" ? "mint" : "amber"}>
                {finding.support}
              </Badge>
              <Badge tone="violet">Demo</Badge>
            </div>
            <span className="overline">
              OBSERVATION · {label(finding.evidence_type)}
            </span>
            <p>{finding.observation}</p>
            <span className="overline">INTERPRETATION</span>
            <p>{finding.interpretation}</p>
            <span className="overline">REPRODUCTION</span>
            <ol>
              <li>
                Open the owned HireFlow build {run?.snapshot.build} fixture.
              </li>
              <li>Attempt the linked task using sample data.</li>
              <li>
                Inspect the captured{" "}
                {run?.sessions
                  .find((s) => s.id === finding.session_id)
                  ?.steps.find((s) => s.id === finding.step_id)?.milestone ||
                  "task"}{" "}
                step.
              </li>
            </ol>
            <span className="overline">RECOMMENDATION</span>
            <p>{finding.recommendation}</p>
            <div className="form-actions">
              <Button
                onClick={() => {
                  setModal("");
                  setView("Theatre");
                  setSessionId(finding.session_id);
                  setStepId(finding.step_id);
                  updateUrl(
                    {
                      view: "Theatre",
                      run: finding.run_id,
                      session: finding.session_id,
                      step: finding.step_id,
                      project: project!.id,
                    },
                    true,
                  );
                }}
              >
                Open exact evidence <ArrowUpRight size={15} />
              </Button>
              <Button secondary onClick={() => requestStudy(finding)}>
                Verify with humans <Users size={15} />
              </Button>
            </div>
            <div className="review-box">
              <h3>Reviewer decision</h3>
              <label>
                Review note
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context, disagreement, or next steps…"
                  maxLength={4000}
                />
              </label>
              <div className="inline wrap">
                {["ACKNOWLEDGED", "DISPUTED", "NEEDS_REVIEW"].map((status) => (
                  <Button
                    secondary
                    key={status}
                    disabled={busy}
                    onClick={() =>
                      action(async () => {
                        await api("findings/" + finding.id + "/reviews", {
                          status,
                          note,
                        });
                        const r = await api<Run>("runs/" + runId);
                        setRun(r);
                        setFinding(
                          r.findings.find((f) => f.id === finding.id)!,
                        );
                        notify(
                          "Review appended. Acknowledgment does not mean fixed.",
                        );
                      })
                    }
                  >
                    {label(status)}
                  </Button>
                ))}
              </div>
              {finding.reviews.map((r) => (
                <blockquote key={r.id}>
                  <Badge>{label(r.status)}</Badge>
                  <p>{r.note || "No note added."}</p>
                </blockquote>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {modal === "study" && (
        <Modal
          error={error}
          title="Request independent human verification"
          close={() => setModal("")}
        >
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                const buildId = finding ? run!.build_id : studyBuildId;
                await api(
                  editingStudy ? "studies/" + editingStudy.id : "studies",
                  {
                    ...studyForm,
                    project_id: project!.id,
                    build_id: buildId,
                    finding_id: editingStudy?.finding_id || finding?.id || null,
                  },
                  editingStudy ? "PATCH" : "POST",
                );
                setModal("");
                await load(project!.id);
                navigate("Human Studies");
                notify(
                  "Neutral study draft saved. Recruitment has not started.",
                );
              });
            }}
          >
            <div className="quiet-note">
              <ShieldCheck size={18} />
              <p>
                Participants receive only the task and build, without AI
                predictions. Recording is unavailable. No recruitment or payment
                is triggered.
              </p>
            </div>
            <label>
              Assigned immutable build
              <select
                value={studyBuildId}
                disabled={!!finding || !!editingStudy}
                onChange={(e) => setStudyBuildId(e.target.value)}
              >
                {data?.builds.map((b) => (
                  <option key={b.id} value={b.id}>
                    Build {b.label} · {b.url}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target audience
              <input
                value={studyForm.audience}
                onChange={(e) =>
                  setStudyForm({ ...studyForm, audience: e.target.value })
                }
                required
              />
            </label>
            <label>
              Screening criteria
              <textarea
                value={studyForm.screening}
                onChange={(e) =>
                  setStudyForm({ ...studyForm, screening: e.target.value })
                }
                required
              />
            </label>
            <label>
              Neutral task instructions
              <textarea
                rows={4}
                value={studyForm.instructions}
                onChange={(e) =>
                  setStudyForm({ ...studyForm, instructions: e.target.value })
                }
                required
              />
            </label>
            <div className="form-grid">
              <label>
                Requested participants
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={studyForm.participant_count}
                  onChange={(e) =>
                    setStudyForm({
                      ...studyForm,
                      participant_count: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Session minutes
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={studyForm.session_minutes}
                  onChange={(e) =>
                    setStudyForm({
                      ...studyForm,
                      session_minutes: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label>
              Proposed incentive (USD cents, not paid)
              <input
                type="number"
                min={0}
                max={100000}
                value={studyForm.incentive_cents}
                onChange={(e) =>
                  setStudyForm({
                    ...studyForm,
                    incentive_cents: Number(e.target.value),
                  })
                }
              />
            </label>
            <Button type="submit" disabled={busy}>
              {editingStudy ? "Save draft changes" : "Create study draft"}{" "}
              <ArrowRight size={15} />
            </Button>
            {editingStudy && (
              <Button
                secondary
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    await api(
                      "studies/" + editingStudy.id,
                      undefined,
                      "DELETE",
                    );
                    setModal("");
                    await load(project!.id);
                    notify("Draft canceled. Records retained.");
                  })
                }
              >
                Cancel draft
              </Button>
            )}
          </form>
        </Modal>
      )}
      {modal === "operations" && (
        <Modal
          error={error}
          title="Study operations · manual pilot"
          close={() => setModal("")}
        >
          <div className="modal-form">
            <div className="quiet-note">
              <ShieldCheck size={18} />
              <p>
                Screen before assigning. Invitations expire in 7 days and can be
                revoked. No email or payout is sent.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const result = await api<{ invitation_path: string }>(
                    "studies/" + studyId + "/assignments",
                    { alias, screening_decision: screening },
                  );
                  setInvitation(location.origin + result.invitation_path);
                  setAssignments(
                    await api<Assignment[]>(
                      "studies/" + studyId + "/assignments",
                    ),
                  );
                  await load(project!.id);
                  notify("Assignment created. Copy the invitation manually.");
                });
              }}
            >
              <label>
                Pseudonymous participant label
                <input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  required
                />
              </label>
              <label>
                Screening decision
                <textarea
                  value={screening}
                  onChange={(e) => setScreening(e.target.value)}
                  required
                />
              </label>
              <Button type="submit" disabled={busy}>
                Create scoped invitation <Plus size={15} />
              </Button>
            </form>
            {invitation && (
              <div className="invitation">
                <b>Invitation shown once</b>
                <a href={invitation} target="_blank" rel="noreferrer">
                  Open participant portal <ExternalLink size={14} />
                </a>
                <input
                  aria-label="Invitation URL"
                  value={invitation}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <small>
                  Treat this URL as a private access capability. Share it
                  manually with the screened participant.
                </small>
              </div>
            )}
            <div className="inline spread">
              <h3>Assignments</h3>
              <Button
                secondary
                onClick={() =>
                  action(async () =>
                    setAssignments(
                      await api<Assignment[]>(
                        "studies/" + studyId + "/assignments",
                      ),
                    ),
                  )
                }
              >
                Refresh
              </Button>
            </div>
            {assignments.map((a) => (
              <section className="assignment-card" key={a.id}>
                <div className="inline spread">
                  <b>{a.alias}</b>
                  <Badge
                    tone={a.revoked ? "red" : a.review ? "mint" : "neutral"}
                  >
                    {a.revoked
                      ? "Revoked"
                      : a.review
                        ? "Reviewed"
                        : a.submission
                          ? "Submitted"
                          : a.consent_at
                            ? "Consented"
                            : "Invited"}
                  </Badge>
                </div>
                <small>
                  Expires {new Date(a.expires_at).toLocaleDateString()} ·
                  incentive pending / no payout
                </small>
                {a.submission && (
                  <>
                    <p>
                      <b>Self-report:</b> {a.submission.outcome} · difficulty{" "}
                      {a.submission.difficulty}/5
                    </p>
                    <blockquote>{a.submission.notes}</blockquote>
                    <small>
                      Written feedback · no recording-backed outcome
                    </small>
                  </>
                )}
                {a.review ? (
                  <p>
                    <b>{a.review.comparison}</b> · {a.review.rationale}
                  </p>
                ) : (
                  a.submission && (
                    <Button
                      secondary
                      onClick={() => {
                        setReviewId(a.id);
                        setModeration({
                          comparison: "INCONCLUSIVE",
                          rationale: "",
                          moderator_outcome: "UNKNOWN",
                        });
                        setModal("moderate");
                      }}
                    >
                      Review independent submission
                    </Button>
                  )
                )}
                {!a.revoked && (
                  <button
                    className="text-button"
                    onClick={() =>
                      action(async () => {
                        await api("assignments/" + a.id + "/revoke", {});
                        setAssignments(
                          await api<Assignment[]>(
                            "studies/" + studyId + "/assignments",
                          ),
                        );
                        notify("Invitation revoked.");
                      })
                    }
                  >
                    Revoke access
                  </button>
                )}
              </section>
            ))}
          </div>
        </Modal>
      )}
      {modal === "moderate" && (
        <Modal
          error={error}
          title="Review independent observations"
          close={() => setModal("operations")}
        >
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await api("assignments/" + reviewId + "/review", moderation);
                await load(project!.id);
                setAssignments(
                  await api<Assignment[]>(
                    "studies/" + studyId + "/assignments",
                  ),
                );
                setModal((current) =>
                  current === "moderate" ? "operations" : current,
                );
                notify(
                  "Review frozen; a new hybrid sample report version was published.",
                );
              });
            }}
          >
            <p>
              Keep self-report separate from moderator-observed evidence.
              Written feedback alone does not establish recording-backed
              success.
            </p>
            <label>
              Comparison to the linked finding
              <select
                value={moderation.comparison}
                onChange={(e) =>
                  setModeration({ ...moderation, comparison: e.target.value })
                }
              >
                {["SUPPORTED", "CONTRADICTED", "INCONCLUSIVE"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Moderator-observed outcome
              <select
                value={moderation.moderator_outcome}
                onChange={(e) =>
                  setModeration({
                    ...moderation,
                    moderator_outcome: e.target.value,
                  })
                }
              >
                <option>UNKNOWN</option>
                <option>PASS</option>
                <option>FAIL</option>
              </select>
            </label>
            <label>
              Review rationale
              <textarea
                value={moderation.rationale}
                onChange={(e) =>
                  setModeration({ ...moderation, rationale: e.target.value })
                }
                required
              />
            </label>
            <Button type="submit" disabled={busy}>
              Publish reviewed report version
            </Button>
          </form>
        </Modal>
      )}
      {modal === "research" && (
        <Modal
          error={error}
          title="Source & claim provenance"
          close={() => setModal("")}
        >
          <div className="finding-detail">
            {data?.sources
              .filter((s) => s.id === researchSource)
              .map((s) => (
                <div key={s.id}>
                  <Badge tone="violet">Fictional demo case</Badge>
                  <h3>{s.snapshot.name}</h3>
                  <p>{s.snapshot.uncertainty}</p>
                  <dl>
                    <dt>Source</dt>
                    <dd>{s.snapshot.source}</dd>
                    <dt>As-of date</dt>
                    <dd>{s.snapshot.as_of}</dd>
                    <dt>Publication date</dt>
                    <dd>Not applicable · owned fixture</dd>
                    <dt>Coverage</dt>
                    <dd>No external retrieval performed</dd>
                  </dl>
                  <a
                    className="button secondary"
                    href={s.snapshot.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open actual fixture notes <ExternalLink size={14} />
                  </a>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReportView({
  reports,
  selected,
  select,
  onFinding,
}: {
  reports: Report[];
  selected: string;
  select: (id: string) => void;
  onFinding: (id: string) => void;
}) {
  const report = reports.find((r) => r.id === selected) || reports.at(-1);
  if (!report)
    return (
      <Empty title="A report follows a completed run">
        Demo reports use immutable fixture snapshots. Human review produces a
        separate version.
      </Empty>
    );
  const data = report.snapshot;
  return (
    <>
      <div className="toolbar report-toolbar">
        <select
          aria-label="Report version"
          value={report.id}
          onChange={(e) => select(e.target.value)}
        >
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              Version {r.version} ·{" "}
              {r.snapshot.human_observations.length
                ? "Hybrid sample"
                : "Demo browser / audit"}
            </option>
          ))}
        </select>
        <div className="inline">
          <Button
            secondary
            onClick={() =>
              download(report, "playground-report-v" + report.version + ".json")
            }
          >
            <Download size={16} />
            Export JSON
          </Button>
          <Button secondary onClick={() => window.print()}>
            <FileText size={16} />
            Print / PDF
          </Button>
        </div>
      </div>
      <article className="report">
        <div className="report-title">
          <span className="overline">PLAYGROUND / VALIDATION REPORT</span>
          <Badge tone="violet">Demo · v{report.version}</Badge>
          <h2>{data.title}</h2>
          <p>
            Build {data.build} ·{" "}
            {data.human_observations.length
              ? "Reviewed local test feedback included"
              : "No human observations yet"}
          </p>
        </div>
        <div className="report-provenance">
          <FlaskConical size={19} />
          {data.provenance}
        </div>
        <section>
          <span className="overline">DECISION CONTEXT</span>
          <h3>{data.summary}</h3>
          <p>
            This report demonstrates how evidence informs a next experiment. It
            does not establish product-market fit, demand, or conversion lift.
          </p>
        </section>
        <div className="report-counts">
          {["PASS", "FAIL", "UNKNOWN"].map((key) => (
            <div key={key}>
              <span>{data.outcomes[key]}</span>
              <small>{key.toLowerCase()} · sample journeys</small>
            </div>
          ))}
          <div>
            <span>{data.human_observations.length}</span>
            <small>reviewed local test submissions</small>
          </div>
        </div>
        <section>
          <h3>Browser observations & automated examples</h3>
          {data.findings.length ? (
            data.findings.map((f) => (
              <div className="report-finding" key={f.id}>
                <div>
                  <b>{f.title}</b>
                  <small>
                    {label(f.evidence_type)} · {f.support}
                  </small>
                </div>
                <button className="text-button" onClick={() => onFinding(f.id)}>
                  Inspect <ArrowUpRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <p>
              No new seeded findings. Compare baseline coverage before treating
              this as resolution.
            </p>
          )}
        </section>
        <section>
          <h3>Independent human evidence</h3>
          {data.human_observations.length ? (
            data.human_observations.map((h, i) => (
              <div key={i} className="human-report">
                <Badge tone="violet">{h.provenance}</Badge>
                <h4>
                  {h.alias} · self-report {h.submission.outcome}
                </h4>
                <blockquote>{h.submission.notes}</blockquote>
                <p>
                  Moderator outcome: {h.review.moderator_outcome}. Comparison:{" "}
                  {h.review.comparison}. {h.review.rationale}
                </p>
              </div>
            ))
          ) : (
            <p>
              No independent human feedback has been submitted and reviewed for
              this version. Recruitment does not block this demo report.
            </p>
          )}
        </section>
        <section>
          <h3>Research & sources</h3>
          <p>
            {data.source_count} externally retrieved sources. Fictional sample
            cases are excluded from factual claim counts.
          </p>
        </section>
        <section>
          <h3>Limitations</h3>
          <ul>
            {data.limitations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
        <section>
          <span className="overline">NEXT EXPERIMENT</span>
          <h3>{data.next_experiment}</h3>
          <p>
            Actual provider cost: {money(data.actual_cost_cents)} ·
            deterministic sample, no provider usage.
          </p>
        </section>
      </article>
    </>
  );
}
