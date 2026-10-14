"use client";
import { use, useEffect, useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Button } from "@/components/ui";
type Task = {
  alias: string;
  instructions: string;
  target: string;
  build: string;
  mode: string;
  consent_at: string | null;
  submitted: boolean;
  recording: string;
  consent_version: string;
};
export default function Participant({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [task, setTask] = useState<Task | null>(null),
    [error, setError] = useState(""),
    [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      outcome: "UNKNOWN",
      difficulty: 3,
      notes: "",
    });
  useEffect(() => {
    api<Task>("participant/" + token)
      .then(setTask)
      .catch((e) => setError(e.message));
  }, [token]);
  async function act(work: () => Promise<void>) {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="participant-page">
      <a className="brand" href="/">
        <span className="brand-mark">p</span>playground.
      </a>
      <main className="participant-card">
        <Badge tone="violet">INDEPENDENT TASK PORTAL</Badge>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        {task ? (
          <>
            {task.mode === "DEMO" && (
              <div className="demo-notice">
                <b>Demo assignment</b>
                <span>
                  Local test feedback only. No recruited participant claim.
                </span>
              </div>
            )}
            <h1>
              {task.submitted
                ? "Thank you for your perspective."
                : "Your perspective matters."}
            </h1>
            <p>
              Assignment for {task.alias} · Build {task.build}
            </p>
            {task.submitted ? (
              <div className="participant-success">
                <CheckCircle2 size={36} />
                <p>
                  Your independent submission is saved and frozen for review.
                </p>
                <small>
                  Feedback is independent of whether it is positive. No
                  incentive payment was executed.
                </small>
              </div>
            ) : !task.consent_at ? (
              <>
                <div className="consent-text">
                  <ShieldCheck size={22} />
                  <h3>Before you begin</h3>
                  <p>
                    You will attempt a neutral task using sample data and submit
                    your outcome, difficulty rating, and written feedback. Staff
                    can review these records. {task.recording}
                  </p>
                  <p>
                    Do not enter passwords, contact details, or other private
                    information into your written feedback. Your invitation is
                    assignment-scoped and expires in seven days.
                  </p>
                  <small>Consent version: {task.consent_version}</small>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  I consent to the storage and staff review of my written
                  feedback.
                </label>
                <Button
                  disabled={!checked || busy}
                  onClick={() =>
                    act(async () =>
                      setTask(
                        await api<Task>(
                          "participant/" + token + "/consent",
                          {},
                        ),
                      ),
                    )
                  }
                >
                  Consent & begin <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <>
                <section className="participant-task">
                  <span className="overline">YOUR ASSIGNED TASK</span>
                  <h3>{task.instructions}</h3>
                  <a
                    className="button secondary"
                    href={task.target}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open assigned build <ExternalLink size={15} />
                  </a>
                  <small>
                    The product opens in a separate tab. No recording takes
                    place.
                  </small>
                </section>
                <form
                  className="modal-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(async () => {
                      await api("participant/" + token + "/submission", form);
                      setTask({ ...task, submitted: true });
                    });
                  }}
                >
                  <label>
                    Your task outcome
                    <select
                      value={form.outcome}
                      onChange={(e) =>
                        setForm({ ...form, outcome: e.target.value })
                      }
                    >
                      <option value="UNKNOWN">
                        Unsure / unable to determine
                      </option>
                      <option value="PASS">I completed the task</option>
                      <option value="FAIL">
                        I could not complete the task
                      </option>
                    </select>
                  </label>
                  <label>
                    Difficulty: {form.difficulty} / 5 (1 easy, 5 difficult)
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={form.difficulty}
                      onChange={(e) =>
                        setForm({ ...form, difficulty: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    What happened?
                    <textarea
                      required
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      maxLength={4000}
                      rows={5}
                      placeholder="Describe your experience in your own words…"
                    />
                  </label>
                  <p className="small muted">
                    This is your self-reported outcome. Staff observations and
                    recording-backed evidence are tracked separately. Submitted
                    feedback cannot be edited.
                  </p>
                  <Button type="submit" disabled={busy}>
                    Submit independent feedback <ArrowRight size={16} />
                  </Button>
                </form>
              </>
            )}
          </>
        ) : (
          !error && <p>Opening your scoped assignment…</p>
        )}
      </main>
    </div>
  );
}
