import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
  JOB_STATUSES,
  statusClass,
  statusLabel,
  taskLabel,
  type JobStatus,
} from "../tasks";
import { basename, deleteJob, openJobResult, useJobs } from "../useJobs";
import "./JobsPage.css";

type Filter = JobStatus | "all";

const FILTERS: Filter[] = ["all", ...JOB_STATUSES];

function filterLabel(f: Filter) {
  return f === "all" ? "All" : statusLabel(f);
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { jobs, loading, error, refresh } = useJobs();

  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredJobs =
    activeFilter === "all"
      ? jobs
      : jobs.filter((j) => j.status === activeFilter);

  async function handleDownload(jobId: string) {
    setBusyId(jobId);
    setActionError(await openJobResult(jobId));
    setBusyId(null);
  }

  async function handleDelete(jobId: string, name: string) {
    if (!window.confirm(`Delete the job for "${name}"? This also removes the uploaded and output files.`)) {
      return;
    }
    setBusyId(jobId);
    const err = await deleteJob(jobId);
    setActionError(err);
    if (!err) await refresh();
    setBusyId(null);
  }

  return (
    <AppLayout>
      <section className="dash-card">
        <div className="jobs-header">
          <h2 className="dash-section-title" style={{ margin: 0 }}>
            My Jobs
          </h2>
          <div className="jobs-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`jobs-filter-btn ${
                  activeFilter === f ? "jobs-filter-active" : ""
                }`}
                onClick={() => setActiveFilter(f)}
              >
                {filterLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="dash-notice dash-notice-error">
            <span>{actionError}</span>
          </div>
        )}

        {loading ? (
          <p className="dash-empty">Loading jobs…</p>
        ) : error ? (
          <div className="jobs-empty">
            <div className="jobs-empty-icon">⚠️</div>
            <p className="jobs-empty-title">Couldn't load your jobs</p>
            <p className="jobs-empty-sub">{error}</p>
            <button className="jobs-empty-reset" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty">
            <div className="jobs-empty-icon">📭</div>
            <p className="jobs-empty-title">No jobs found</p>
            <p className="jobs-empty-sub">
              {activeFilter === "all"
                ? "You haven't submitted any jobs yet."
                : `No jobs with status "${statusLabel(activeFilter)}".`}
            </p>
            <button
              className="jobs-empty-reset"
              onClick={() =>
                activeFilter === "all"
                  ? navigate("/dashboard")
                  : setActiveFilter("all")
              }
            >
              {activeFilter === "all" ? "Submit a job" : "Show all jobs"}
            </button>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table jobs-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Task</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const name = basename(job.input_key);
                  return (
                    <tr key={job.id}>
                      <td>
                        <span className={statusClass(job.status)}>
                          {statusLabel(job.status)}
                        </span>
                      </td>
                      <td className="jobs-job-name">{taskLabel(job.job_type)}</td>
                      <td className="dash-file">{name}</td>
                      <td className="dash-date">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="jobs-action-cell">
                        <div className="dash-row-actions">
                          {job.status === "done" && (
                            <button
                              className="jobs-download-btn"
                              onClick={() => handleDownload(job.id)}
                              disabled={busyId === job.id}
                            >
                              {busyId === job.id ? "…" : "↓ Download"}
                            </button>
                          )}
                          <button
                            className="dash-delete-btn"
                            onClick={() => handleDelete(job.id, name)}
                            disabled={busyId === job.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
