// The task catalog — one source of truth for what ASCEND can actually do.
//
// Before this file existed the task list was duplicated three ways
// (DashboardPage's JOB_CATEGORIES/TASK_TYPE, MarketplacePage's TASK_TEMPLATES,
// JobsPage's mock job names) and they had drifted apart: the dashboard offered
// 16 options of which only 3 reached the backend. Every page now reads from
// TASKS, so the picker, the catalog, and the job tables cannot disagree.
//
// Task ids ARE the backend's discriminator values (backend/jobs/jobs.py).
// They are derived from the generated API types below, so renaming a job type
// server-side breaks `tsc -b` here instead of failing as a runtime 422.

import type { components } from "./api-types";
import type { CreateTaskBody } from "./api";

/** Every job type the backend's discriminated union accepts. */
type BackendTaskId = CreateTaskBody["type"];

/**
 * The subset the UI can submit today.
 *
 * `trim` and `video_quality` are fully implemented in backend/worker.py
 * (process_trim, process_video_quality) but intentionally not exposed yet —
 * add them here and to TASKS below when you want them in the UI. `transcribe`,
 * `transcode` and `extract_audio` must NOT be added: transcribe has no worker
 * handler at all, and the other two are `pass` stubs that mark a job done with
 * no output.
 */
export type TaskId = Extract<
  BackendTaskId,
  "image_resize" | "deblur" | "format_converter"
>;

/** The file formats the converter understands, straight from the backend schema. */
export type MediaFormat =
  components["schemas"]["FormatConverterJob"]["input_format"];

/** Mirrors VIDEO_FORMATS / IMAGE_FORMATS in backend/jobs/jobs.py. */
export const VIDEO_FORMATS: readonly MediaFormat[] = ["mp4", "mov", "avi", "webm"];
export const IMAGE_FORMATS: readonly MediaFormat[] = ["jpg", "png", "webp"];

/** Extra form fields a task needs beyond the file itself. */
export type TaskParam = "dimensions" | "output_format";

export type Task = {
  id: TaskId;
  label: string;
  icon: string;
  description: string;
  /** Which media the task can run on — drives the file input's accept attr. */
  accepts: "image" | "video" | "both";
  params: readonly TaskParam[];
};

export const TASKS: readonly Task[] = [
  {
    id: "image_resize",
    label: "Image Resize",
    icon: "🖼️",
    description:
      "Scale an image to exact pixel dimensions. Useful for thumbnails, avatars, or fitting a layout.",
    accepts: "image",
    params: ["dimensions"],
  },
  {
    id: "deblur",
    label: "Deblur",
    icon: "🔍",
    description:
      "Sharpen a blurry or out-of-focus photo. Runs a deblurring model over the image.",
    accepts: "image",
    params: [],
  },
  {
    id: "format_converter",
    label: "Format Converter",
    icon: "🔄",
    description:
      "Convert between image formats (jpg, png, webp) or between video formats (mp4, mov, avi, webm).",
    accepts: "both",
    params: ["output_format"],
  },
];

export function findTask(id: string | null): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

/** Human label for a job_type coming back from the API. */
export function taskLabel(jobType: string): string {
  return findTask(jobType)?.label ?? jobType;
}

/** The `accept` attribute for a task's file input. */
export function acceptAttr(task: Task): string {
  if (task.accepts === "image") return "image/*";
  if (task.accepts === "video") return "video/*";
  return "image/*,video/*";
}

/**
 * Lowercased file extension, with jpeg normalized to jpg — the backend's
 * Literal only accepts "jpg". Returns null when there's no usable extension.
 */
export function extensionOf(filename: string): string | null {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

/** "video" | "image" for a known format, else null. */
export function formatFamily(ext: string | null): "video" | "image" | null {
  if (!ext) return null;
  if (VIDEO_FORMATS.includes(ext as MediaFormat)) return "video";
  if (IMAGE_FORMATS.includes(ext as MediaFormat)) return "image";
  return null;
}

/**
 * Valid output formats for a given input — same family, excluding the input
 * itself. This mirrors the two rules FormatConverterJob.validate_formats
 * enforces (no video<->image, no same-format), so the UI can't offer a
 * combination the backend will reject.
 */
export function outputFormatsFor(inputExt: string | null): readonly MediaFormat[] {
  const family = formatFamily(inputExt);
  if (!family) return [];
  const pool = family === "video" ? VIDEO_FORMATS : IMAGE_FORMATS;
  return pool.filter((f) => f !== inputExt);
}

// --- Job status -------------------------------------------------------------
// The real enum from backend/db/schema.sql. The old UI invented
// queued/running/complete, which matched nothing the API ever returned, so
// status filtering was broken by definition.

export type JobStatus = "pending" | "processing" | "done" | "failed";

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Queued",
  processing: "Running",
  done: "Complete",
  failed: "Failed",
};

const STATUS_BADGES: Record<JobStatus, string> = {
  pending: "badge badge-pending",
  processing: "badge badge-running",
  done: "badge badge-complete",
  failed: "badge badge-failed",
};

export const JOB_STATUSES = Object.keys(STATUS_LABELS) as JobStatus[];

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as JobStatus] ?? status;
}

export function statusClass(status: string): string {
  return STATUS_BADGES[status as JobStatus] ?? "badge badge-pending";
}
