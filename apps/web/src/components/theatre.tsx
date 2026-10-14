"use client";
import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Maximize2,
  MousePointer2,
  ArrowUpRight,
  MessageSquare,
  Radio,
  AlertCircle,
  CheckCircle2,
  Clock,
  Monitor,
  Smartphone,
} from "lucide-react";
import type {
  Run,
  Session,
  Step,
  Finding,
} from "../../../../packages/contracts/src";
import { Badge, Button, Empty } from "./ui";
import { money } from "@/lib/api";
import { api } from "@/lib/api";

export function EvidenceImage({
  step,
  compact = false,
}: {
  step?: Step;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const artifact = step?.artifacts[0];
  useEffect(() => {
    setBroken(false);
  }, [artifact?.id]);
  if (!artifact || artifact.state !== "READY" || broken)
    return (
      <div className={"evidence-gap " + (compact ? "compact" : "")}>
        <Clock size={compact ? 16 : 28} />
        <span>
          {broken
            ? "Evidence unavailable"
            : artifact?.state === "UNAVAILABLE"
              ? "Evidence unavailable for the sample interruption"
              : artifact?.state === "DELETED"
                ? "Evidence removed under retention policy"
                : "Awaiting evidence"}
        </span>
        {!compact && (
          <small>Metadata and linked findings remain available.</small>
        )}
      </div>
    );
  return (
    <img
      className="evidence-image"
      src={"/api/v1/artifacts/" + artifact.id + "/access"}
      alt={"Demo fixture screenshot · " + step?.summary}
      onError={() => setBroken(true)}
    />
  );
}
const outcomeIcon = (outcome: string | null) =>
  outcome === "FAIL" ? (
    <AlertCircle size={13} />
  ) : outcome === "PASS" ? (
    <CheckCircle2 size={13} />
  ) : (
    <Clock size={13} />
  );
export default function Theatre({
  run,
  onCancel,
  onFinding,
  onNote,
  sessionId,
  stepId,
  onSeek,
}: {
  run: Run;
  onCancel: () => void;
  onFinding: (f: Finding) => void;
  onNote: (id: string, note: string) => void;
  sessionId: string;
  stepId: string;
  onSeek: (session: string, step: string) => void;
}) {
  const [playing, setPlaying] = useState(false),
    [follow, setFollow] = useState(!stepId),
    [speed, setSpeed] = useState(1),
    [tab, setTab] = useState("Observation"),
    [railPage, setRailPage] = useState(0),
    [note, setNote] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [full, setFull] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [history, setHistory] = useState<Run["events"]>([]);
  const [historyError, setHistoryError] = useState("");
  const all = run.sessions || [];
  const filtered = all.filter(
    (s) => filter === "ALL" || s.outcome === filter || s.state === filter,
  );
  const session = all.find((s) => s.id === sessionId) || all[0];
  const steps = session?.steps || [];
  const step =
    steps.find((s) => s.id === stepId) || (follow ? steps.at(-1) : steps[0]);
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === step?.id),
  );
  const active = !["COMPLETED", "CANCELED", "FAILED"].includes(run.state);
  useEffect(() => {
    if (
      stepId &&
      session &&
      steps.some((s) => s.id === stepId) &&
      stepId !== steps.at(-1)?.id
    )
      setFollow(false);
  }, [stepId, session?.id]);
  useEffect(() => {
    const media = window.matchMedia("(max-width:700px)");
    const sync = () => setInspectorOpen(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (tab !== "Events" || !session) return;
    let stop = false;
    setHistory([]);
    setHistoryError("");
    (async () => {
      let cursor = 0;
      const found: Run["events"] = [];
      for (let page = 0; page < 10 && !stop; page++) {
        const batch = await api<Run["events"]>(
          `runs/${run.id}/events?after=${cursor}&limit=100`,
        );
        if (!batch.length) break;
        found.push(...batch.filter((e) => e.session_id === session.id));
        cursor = batch.at(-1)!.run_sequence;
        if (found.some((e) => e.event_type === "session.finished")) break;
      }
      if (!stop) setHistory(found);
    })().catch((e) => {
      if (!stop) setHistoryError(e.message);
    });
    return () => {
      stop = true;
    };
  }, [tab, session?.id, session?.state, run.id]);
  useEffect(() => {
    if (follow && session?.steps.length) {
      const latest = session.steps.at(-1)!;
      if (stepId !== latest.id) onSeek(session.id, latest.id);
    }
  }, [follow, session?.steps.length, session?.id]);
  useEffect(() => {
    if (!playing || !session) return;
    const timer = setInterval(() => {
      const next = steps[index + 1];
      if (next) {
        setFollow(false);
        onSeek(session.id, next.id);
      } else setPlaying(false);
    }, 1400 / speed);
    return () => clearInterval(timer);
  }, [playing, index, speed, session?.id, steps.length]);
  function seek(next: number) {
    if (!session) return;
    setFollow(false);
    setPlaying(false);
    if (steps[next]) onSeek(session.id, steps[next].id);
  }
  const finding = run.findings.find((f) => f.step_id === step?.id);
  if (sessionId && !all.some((s) => s.id === sessionId))
    return (
      <Empty title="Evidence location unavailable">
        The session in this link does not belong to this authorized run.
      </Empty>
    );
  if (stepId && session && !steps.some((s) => s.id === stepId))
    return (
      <Empty title="Evidence step unavailable">
        This step is not part of the selected session. Its location cannot be
        substituted with another observation.
      </Empty>
    );
  if (!session)
    return (
      <Empty title="No sessions yet">
        The plan has not produced sample evidence.
      </Empty>
    );
  return (
    <div className={full ? "theatre fullscreen" : "theatre"}>
      <div className="run-bar">
        <div>
          <Badge tone={active ? "mint" : "neutral"}>
            {active && <Radio size={12} />} {run.state.replaceAll("_", " ")}
          </Badge>
          <span className="small muted">
            {" "}
            Demo playback · Build {run.snapshot.build}
          </span>
        </div>
        <div className="run-stats">
          <span>
            <b>{run.completed}</b> / {run.total} journeys
          </span>
          <span>
            Limit <b>{money(run.snapshot.budget_cents)}</b>
          </span>
          <span>
            Actual <b>$0.00</b> <small>demo</small>
          </span>
          {active && (
            <Button secondary onClick={onCancel}>
              Cancel demo run
            </Button>
          )}
        </div>
      </div>
      <div className="rail-header">
        <span className="eyebrow">
          SYNTHETIC SESSIONS <span className="muted">/ {all.length}</span>
        </span>
        <div className="inline">
          <select
            aria-label="Filter sessions"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setRailPage(0);
            }}
          >
            <option value="ALL">All outcomes</option>
            <option value="PASS">Passed</option>
            <option value="FAIL">Failed</option>
            <option value="UNKNOWN">Unknown</option>
            <option value="QUEUED">Queued</option>
          </select>
          <button
            className="icon-button"
            aria-label="Previous sessions"
            disabled={railPage === 0}
            onClick={() => setRailPage(railPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="small">
            {railPage + 1} / {Math.max(1, Math.ceil(filtered.length / 4))}
          </span>
          <button
            className="icon-button"
            aria-label="More sessions"
            disabled={(railPage + 1) * 4 >= filtered.length}
            onClick={() => setRailPage(railPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="session-rail">
        {filtered.slice(railPage * 4, railPage * 4 + 4).map((s) => (
          <button
            key={s.id}
            className={
              "session-tile " + (s.id === session.id ? "selected" : "")
            }
            onClick={() => {
              setFollow(false);
              setPlaying(false);
              onSeek(s.id, s.steps.at(-1)?.id || "");
            }}
          >
            <div className="session-title">
              <span className={"avatar avatar-" + (s.ordinal % 4)}>
                {s.persona.name.slice(0, 1)}
              </span>
              <span>
                <b>{s.persona.name}</b>
                <small>{s.persona.role}</small>
              </span>
              <Badge
                tone={
                  s.outcome === "FAIL"
                    ? "red"
                    : s.outcome === "PASS"
                      ? "mint"
                      : "neutral"
                }
              >
                {outcomeIcon(s.outcome)}
                {s.outcome || s.state}
              </Badge>
            </div>
            <div className="mini-preview">
              <EvidenceImage step={s.steps.at(-1)} compact />
            </div>
            <div className="session-meta">
              <span>{s.task.name}</span>
              <small>
                {s.viewport.includes("390") ? (
                  <Smartphone size={12} />
                ) : (
                  <Monitor size={12} />
                )}{" "}
                {s.viewport} · {s.steps.length} steps
              </small>
              <small>
                Last evidence:{" "}
                {s.steps.at(-1)
                  ? new Date(s.steps.at(-1)!.captured_at).toLocaleTimeString()
                  : "pending"}
              </small>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="muted">No sessions match this filter.</p>
      )}
      <div className="stage-layout">
        <div className="stage-column">
          <div className="stage-title">
            <div>
              <span className="avatar small-avatar">
                {session.persona.name[0]}
              </span>
              <b>{session.persona.name}’s journey</b>
              <span className="muted">/ {session.task.name}</span>
            </div>
            <button
              className="icon-button"
              aria-label={full ? "Exit expanded viewer" : "Expand viewer"}
              onClick={() => setFull(!full)}
            >
              <Maximize2 size={17} />
            </button>
          </div>
          <div className="browser-stage">
            <div className="browser-chrome">
              <div className="traffic">
                <i />
                <i />
                <i />
              </div>
              <span>⌑ &nbsp;{step?.url || "Awaiting sample evidence"}</span>
              <span className="browser-label">DEMO FIXTURE</span>
            </div>
            <div
              className={
                "viewport " + (session.viewport.includes("390") ? "phone" : "")
              }
            >
              <EvidenceImage step={step} />
            </div>
            <div className="stage-caption">
              <span>
                <span className="dot" /> {follow ? "Follow latest" : "Replay"} ·
                step screenshots
              </span>
              <span>
                {step?.artifacts[0]?.state === "READY"
                  ? `${new Date(step.captured_at).toLocaleTimeString()} · after action`
                  : "No capture yet"}
              </span>
              {step?.artifacts[0]?.state === "READY" && (
                <a
                  href={"/api/v1/artifacts/" + step.artifacts[0].id + "/access"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original frame ↗
                </a>
              )}
            </div>
          </div>
          <div className="playback">
            <div className="inline">
              <button
                className="icon-button"
                aria-label="Previous step"
                disabled={index === 0}
                onClick={() => seek(index - 1)}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="play-button"
                aria-label={playing ? "Pause replay" : "Play replay"}
                onClick={() => {
                  setFollow(false);
                  if (index === steps.length - 1 && session)
                    onSeek(session.id, steps[0].id);
                  setPlaying(!playing);
                }}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                className="icon-button"
                aria-label="Next step"
                disabled={index >= steps.length - 1}
                onClick={() => seek(index + 1)}
              >
                <ChevronRight size={19} />
              </button>
              <span className="small">
                {index + 1} / {steps.length || 0}
              </span>
              <select
                aria-label="Replay speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </div>
            <button
              className={"follow-button " + (follow ? "active" : "")}
              onClick={() => {
                setFollow(true);
                setPlaying(false);
              }}
            >
              <SkipForward size={14} />
              Return to latest
            </button>
          </div>
          <p className="replay-help">
            Replay controls only change this viewer.{" "}
            {active
              ? "Demo progression continues until canceled."
              : "This sample run is " + run.state.toLowerCase() + "."}
          </p>
          <div
            className="timeline"
            role="group"
            aria-label="Captured steps"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                seek(index - 1);
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                seek(index + 1);
              }
            }}
          >
            {steps.map((s, i) => (
              <button
                key={s.id}
                className={
                  (s.id === step?.id ? "current " : "") +
                  (s.outcome === "error" ? "has-finding" : "")
                }
                onClick={() => seek(i)}
                aria-label={"Seek to " + s.milestone}
              >
                <span className="timeline-node">
                  {s.outcome === "error" ? <AlertCircle size={13} /> : i + 1}
                </span>
                <small>{s.milestone}</small>
              </button>
            ))}
          </div>
        </div>
        <details
          className="inspector"
          open={inspectorOpen}
          onToggle={(e) => setInspectorOpen(e.currentTarget.open)}
        >
          <summary>
            Evidence inspector <Badge tone="violet">Demo</Badge>
            <ChevronRight size={16} />
          </summary>
          <div className="inspector-head">
            <span className="eyebrow">EVIDENCE INSPECTOR</span>
            <Badge tone="violet">Demo</Badge>
          </div>
          <div className="tabs">
            {["Observation", "Events", "Notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={tab === t ? "active" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Observation" ? (
            <>
              <div className="inspector-block">
                <span className="overline">RECORDED ACTION SUMMARY</span>
                <h3>{step?.summary || "Awaiting evidence"}</h3>
                <Badge tone={step?.outcome === "error" ? "red" : "mint"}>
                  {step?.outcome || "pending"}
                </Badge>
                <p className="small muted">
                  Illustrative sample event. No hidden model reasoning or
                  customer thoughts.
                </p>
              </div>
              <div className="inspector-block">
                <span className="overline">SUCCESS ASSERTION</span>
                <p>{session.task.assertion}</p>
                <div className="assertion">
                  <CheckCircle2 size={16} />
                  <span>
                    {session.outcome === "PASS"
                      ? "Sample assertion passed"
                      : session.outcome === "FAIL"
                        ? "Sample assertion failed"
                        : session.outcome === "UNKNOWN"
                          ? "Outcome unknown"
                          : "Awaiting final outcome"}
                  </span>
                </div>
              </div>
              {finding && (
                <div className="finding-callout">
                  <span className="overline">LINKED FINDING</span>
                  <h4>{finding.title}</h4>
                  <p>
                    {finding.support} ·{" "}
                    {finding.evidence_type.replaceAll("_", " ")}
                  </p>
                  <button onClick={() => onFinding(finding)}>
                    Inspect finding <ArrowUpRight size={15} />
                  </button>
                </div>
              )}
              <div className="inspector-block">
                <span className="overline">CAPTURE DETAILS</span>
                <dl>
                  <dt>Viewport</dt>
                  <dd>{session.viewport}</dd>
                  <dt>Capture phase</dt>
                  <dd>{step?.capture_phase || "pending"}</dd>
                  <dt>Evidence</dt>
                  <dd>{step?.artifacts[0]?.state || "pending"}</dd>
                  <dt>Click coordinates</dt>
                  <dd>Not recorded</dd>
                </dl>
              </div>
            </>
          ) : tab === "Events" ? (
            <div className="event-list">
              {history
                .filter((e) => e.session_id === session.id)
                .map((e) => (
                  <div key={e.event_id}>
                    <span>#{e.run_sequence}</span>
                    <b>{e.event_type}</b>
                    <small>
                      {new Date(e.persisted_at).toLocaleTimeString()}
                    </small>
                  </div>
                ))}
            </div>
          ) : (
            <div className="inspector-block">
              <p className="small muted">
                Reviewer annotations are saved to this evidence step.
              </p>
              {step?.annotations.map((a) => (
                <blockquote key={a.id}>
                  {a.note}
                  <small>{new Date(a.created_at).toLocaleString()}</small>
                </blockquote>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step && note.trim()) {
                    onNote(step.id, note);
                    setNote("");
                  }
                }}
              >
                <label htmlFor="step-note">Add a note</label>
                <textarea
                  id="step-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  maxLength={4000}
                />
                <Button type="submit" disabled={!step || !note.trim()}>
                  <MessageSquare size={15} />
                  Save annotation
                </Button>
              </form>
            </div>
          )}
          {tab === "Events" && !history.length && (
            <p className="inspector-block small muted">
              {historyError || "Loading persisted session history…"}
            </p>
          )}
        </details>
      </div>
    </div>
  );
}
