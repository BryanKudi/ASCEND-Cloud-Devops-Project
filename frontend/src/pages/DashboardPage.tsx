import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api, ApiError, type CreateTaskBody } from "../api";
import {
  TASKS,
  acceptAttr,
  extensionOf,
  findTask,
  formatFamily,
  outputFormatsFor,
  statusClass,
  statusLabel,
  taskLabel,
  type MediaFormat,
} from "../tasks";
import { basename, openJobResult, useJobs } from "../useJobs";
import "./DashboardPage.css";

const RECENT_LIMIT = 5;

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Task Catalog cards link here as /dashboard?task=<id>, so the form arrives
  // ready to submit.
  const requested = findTask(searchParams.get("task"));
  const [taskId, setTaskId] = useState(requested?.id ?? TASKS[0].id);
  const task = findTask(taskId) ?? TASKS[0];

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [outputFormat, setOutputFormat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { jobs, loading, error, refresh } = useJobs();

  // The converter's input format comes from the file itself rather than a
  // second dropdown — that way the UI can't offer a pairing the backend
  // rejects (no video<->image, no same-format).
  const inputExt = file ? extensionOf(file.name) : null;
  const outputOptions = outputFormatsFor(inputExt);
  const selectedOutput =
    outputOptions.includes(outputFormat as MediaFormat)
      ? (outputFormat as MediaFormat)
      : outputOptions[0];

  const recentJobs = jobs.slice(0, RECENT_LIMIT);
  const completed = jobs.filter((j) => j.status === "done").length;
  const inProgress = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing",
  ).length;

  /** Why this file and task can't be submitted together, if they can't. */
  function blocker(): string | null {
    if (!file) return null;
    const family = formatFamily(inputExt);

    if (task.accepts === "image" && family !== "image") {
      return `${task.label} needs an image file — jpg, png, or webp.`;
    }
    if (task.id === "format_converter") {
      if (!family) {
        return `"${file.name}" isn't a supported format. Use mp4, mov, avi, webm, jpg, png, or webp.`;
      }
      if (outputOptions.length === 0) {
        return "There's no other format to convert this file to.";
      }
    }
    return null;
  }

  const blockedReason = blocker();

  function selectTask(id: string) {
    setTaskId((findTask(id) ?? TASKS[0]).id);
    setNotice(null);
  }

  function selectFile(next: File) {
    setFile(next);
    setNotice(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) selectFile(e.dataTransfer.files[0]);
  }

  async function handleViewResult(jobId: string) {
    setViewingId(jobId);
    const err = await openJobResult(jobId);
    if (err) setNotice({ kind: "error", text: err });
    setViewingId(null);
  }

  function buildBody(fileKey: string): CreateTaskBody {
    if (task.id === "image_resize") {
      return {
        type: "image_resize",
        file_url: fileKey,
        width: Number(width),
        height: Number(height),
      };
    }
    if (task.id === "format_converter") {
      return {
        type: "format_converter",
        file_url: fileKey,
        input_format: inputExt as MediaFormat,
        output_format: selectedOutput,
      };
    }
    return { type: "deblur", file_url: fileKey };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || blockedReason || submitting) return;

    setSubmitting(true);
    setNotice(null);
    try {
      const { file_key } = await api.upload(file);
      await api.createTask(buildBody(file_key));
      setFile(null);
      setNotice({
        kind: "success",
        text: `${task.label} job submitted. It'll show up below as it runs.`,
      });
      await refresh();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      setNotice({ kind: "error", text: `Job submission failed: ${message}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="dash-stats">
        <div className="dash-stat-card">
          <p className="dash-stat-label">Total Jobs</p>
          <p className="dash-stat-value">{jobs.length}</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-label">Completed</p>
          <p className="dash-stat-value">{completed}</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-label">In Progress</p>
          <p className="dash-stat-value">{inProgress}</p>
        </div>
      </div>

      {/* Submit a job */}
      <section className="dash-card">
        <h2 className="dash-section-title">New Job</h2>

        {notice && (
          <div className={`dash-notice dash-notice-${notice.kind}`}>
            <span>{notice.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="dash-field">
            <label className="dash-label" htmlFor="task-select">
              Task
            </label>
            <select
              id="task-select"
              className="dash-select"
              value={taskId}
              onChange={(e) => selectTask(e.target.value)}
            >
              {TASKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>
          <p className="dash-task-hint">{task.description}</p>

          <div
            className={`dash-dropzone ${dragOver ? "dragover" : ""} ${
              file ? "has-file" : ""
            }`}
            style={{ marginTop: 16 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept={acceptAttr(task)}
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) selectFile(e.target.files[0]);
              }}
            />
            {file ? (
              <>
                <div className="dropzone-icon">✅</div>
                <p className="dropzone-filename">{file.name}</p>
                <p className="dropzone-hint">Click to change file</p>
              </>
            ) : (
              <>
                <div className="dropzone-icon">☁️</div>
                <p className="dropzone-text">Drag & drop or click to upload</p>
                <p className="dropzone-hint">
                  {task.accepts === "image"
                    ? "Images only — jpg, png, or webp"
                    : "Images or videos"}
                </p>
              </>
            )}
          </div>

          {blockedReason && (
            <div className="dash-notice dash-notice-error" style={{ marginTop: 16, marginBottom: 0 }}>
              <span>{blockedReason}</span>
            </div>
          )}

          <div className="dash-row">
            {task.params.includes("dimensions") && (
              <>
                <div className="dash-field">
                  <label className="dash-label" htmlFor="width-input">
                    Width (px)
                  </label>
                  <input
                    id="width-input"
                    type="number"
                    min="1"
                    className="dash-select"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div className="dash-field">
                  <label className="dash-label" htmlFor="height-input">
                    Height (px)
                  </label>
                  <input
                    id="height-input"
                    type="number"
                    min="1"
                    className="dash-select"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </>
            )}

            {task.params.includes("output_format") && (
              <>
                <div className="dash-field">
                  <label className="dash-label">From</label>
                  <div className="dash-static-value">
                    {inputExt ?? "upload a file"}
                  </div>
                </div>
                <div className="dash-field">
                  <label className="dash-label" htmlFor="output-format">
                    Convert to
                  </label>
                  <select
                    id="output-format"
                    className="dash-select"
                    value={selectedOutput ?? ""}
                    disabled={outputOptions.length === 0}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    {outputOptions.length === 0 ? (
                      <option value="">—</option>
                    ) : (
                      outputOptions.map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </>
            )}

            <button
              className="dash-submit"
              type="submit"
              disabled={!file || !!blockedReason || submitting}
            >
              {submitting ? "Submitting…" : "Submit Job"}
            </button>
          </div>
        </form>
      </section>

      {/* Recent jobs — full history lives on /jobs */}
      <section className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-section-title">Recent Jobs</h2>
          {jobs.length > 0 && (
            <button className="dash-link-btn" onClick={() => navigate("/jobs")}>
              View all {jobs.length} →
            </button>
          )}
        </div>

        {loading ? (
          <p className="dash-empty">Loading jobs…</p>
        ) : error ? (
          <p className="dash-empty">{error}</p>
        ) : recentJobs.length === 0 ? (
          <p className="dash-empty">No jobs yet. Upload a file to get started.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="dash-file">{basename(job.input_key)}</td>
                    <td>{taskLabel(job.job_type)}</td>
                    <td>
                      <span className={statusClass(job.status)}>
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td className="dash-date">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td>
                      {job.status === "done" ? (
                        <button
                          className="dash-view-result"
                          onClick={() => handleViewResult(job.id)}
                          disabled={viewingId === job.id}
                        >
                          {viewingId === job.id ? "Loading…" : "View"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
