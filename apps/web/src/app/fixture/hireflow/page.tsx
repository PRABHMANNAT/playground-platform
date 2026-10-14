"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Briefcase,
  Users,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
function Fixture() {
  const params = useSearchParams();
  const build = params.get("build") === "B" ? "B" : "A",
    application = params.get("task") === "application";
  const [step, setStep] = useState(1),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const [jobs, setJobs] = useState<
    { title: string; department: string; location: string }[]
  >([]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields = Object.fromEntries(
      new FormData(e.currentTarget as HTMLFormElement).entries(),
    );
    const r = await fetch("/fixture-api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ build, application, fields }),
    });
    if (r.ok) {
      if (!application)
        setJobs((current) => [
          ...current,
          {
            title: String(fields.title),
            department: String(fields.department),
            location: String(fields.location || "Remote"),
          },
        ]);
      setSaved(true);
      setStep(4);
    } else {
      setError(
        "Something went wrong. Your job could not be saved. Please try again.",
      );
      setStep(4);
    }
  }
  return (
    <div className="fixture">
      <aside className="fixture-nav">
        <b>
          <Briefcase size={21} />
          hireflow<span className="demo-tag">DEMO</span>
        </b>
        <p>ACME STUDIO</p>
        <span>
          <LayoutDashboard size={18} />
          Overview
        </span>
        <span className="active">
          <Briefcase size={18} />
          Jobs
        </span>
        <span>
          <Users size={18} />
          Candidates
        </span>
        <span>
          <Settings size={18} />
          Settings
        </span>
        <small>Owned test fixture · Build {build}</small>
      </aside>
      <main>
        <header>
          <span>Workspace / {application ? "Applications" : "Jobs"}</span>
          <span className="fixture-avatar">AC</span>
        </header>
        {step === 1 ? (
          <>
            <div className="fixture-head">
              <div>
                <p>YOUR HIRING WORKSPACE</p>
                <h1>
                  {application
                    ? "Find your next role."
                    : "Find your next great hire."}
                </h1>
                <span>Keep every opportunity moving forward.</span>
              </div>
              <button onClick={() => setStep(2)}>
                <Plus size={16} />
                {application ? "Apply for this role" : "Create a job"}
              </button>
            </div>
            <div className="fixture-job">
              <span className="job-icon">
                <Briefcase size={22} />
              </span>
              <div>
                <h3>{application ? "Product Designer" : "Design Lead"}</h3>
                <p>Design · Remote · Full time</p>
              </div>
              <span className="fixture-status">Active</span>
            </div>
            {jobs.map((job, index) => (
              <div className="fixture-job" key={index} data-testid="saved-job">
                <span className="job-icon">
                  <Briefcase size={22} />
                </span>
                <div>
                  <h3>{job.title}</h3>
                  <p>
                    {job.department} · {job.location} · Full time
                  </p>
                </div>
                <span className="fixture-status">Just created</span>
              </div>
            ))}
            <div className="fixture-job">
              <span className="job-icon">
                <Briefcase size={22} />
              </span>
              <div>
                <h3>Frontend Engineer</h3>
                <p>Engineering · Bengaluru · Full time</p>
              </div>
              <span className="fixture-status">Active</span>
            </div>
          </>
        ) : saved ? (
          <div className="fixture-confirmation">
            <CheckCircle2 size={44} />
            <h1>
              {application ? "Application received" : "Your job is saved"}
            </h1>
            <p>
              {application
                ? "Thank you for your sample application."
                : "Product Designer is ready in your jobs overview."}
            </p>
            <button
              onClick={() => {
                setStep(1);
                setSaved(false);
              }}
            >
              Back to jobs
            </button>
          </div>
        ) : (
          <>
            <button className="fixture-back" onClick={() => setStep(1)}>
              <ArrowLeft size={14} />
              All jobs
            </button>
            <div className="fixture-form-head">
              <h1>
                {application
                  ? "Apply for Product Designer"
                  : "Create a new job"}
              </h1>
              <p>
                {application
                  ? "Tell us a little about yourself."
                  : "A great job description is the start of a great hire."}
              </p>
            </div>
            <form onSubmit={save} className="fixture-form">
              <div className="fixture-form-section">
                <h3>{application ? "Your details" : "Job details"}</h3>
                <p>
                  {application
                    ? "Use sample information only."
                    : "Help candidates understand the opportunity."}
                </p>
              </div>
              <div className="fixture-fields">
                <label>
                  {application ? "Full name" : "Job title"}
                  <input
                    name="title"
                    placeholder={
                      application ? "Your name" : "e.g. Product Designer"
                    }
                    required
                    onChange={() => setStep(3)}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    {application ? "Email" : "Department"}
                    <input
                      name="department"
                      placeholder={
                        application ? "sample@example.test" : "Design"
                      }
                      required
                      onChange={() => setStep(3)}
                    />
                  </label>
                  <label>
                    Location
                    <input
                      name="location"
                      placeholder="Remote"
                      onChange={() => setStep(3)}
                    />
                  </label>
                </div>
                <label>
                  {application ? "A little about you" : "Job description"}
                  <textarea
                    name="description"
                    placeholder="Write a few details…"
                    onChange={() => setStep(3)}
                  />
                </label>
                {!application && (
                  <div>
                    {build === "B" && (
                      <label htmlFor="salary">Salary range</label>
                    )}
                    <input
                      id="salary"
                      name="salary"
                      placeholder="Salary range (optional)"
                    />
                  </div>
                )}
                {error && (
                  <div className="fixture-error" role="alert">
                    <b>Unable to save job</b>
                    <p>{error}</p>
                    <small>
                      HTTP 500 · Intentional sample defect in build A
                    </small>
                  </div>
                )}
                <div className="fixture-form-footer">
                  <span>Sample data only · Build {build}</span>
                  <button type="submit">
                    {application ? "Submit application" : "Save job"} →
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
        <footer className="fixture-footer">
          HIRE FLOW DEMO · ILLUSTRATIVE LOCAL PRODUCT · No external recruiting
          activity · Disposable browser-session fixture data
        </footer>
      </main>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Fixture />
    </Suspense>
  );
}
