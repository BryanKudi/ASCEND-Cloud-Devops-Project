// Shared job-list state for the Dashboard preview and the My Jobs page.
//
// Both pages need the same fetch, the same row shape, and the same
// result/delete actions; before this hook the dashboard had a working copy and
// JobsPage had a hardcoded MOCK_JOBS array that drifted from it.

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

/** A row from the `jobs` table (backend/db/schema.sql). */
export type Job = {
  id: string;
  job_type: string;
  input_key: string;
  output_key: string | null;
  status: string;
  created_at: string;
};

/** S3 keys look like uploads/<user_id>/<uuid>-<name>; show just the filename. */
export function basename(key: string) {
  return key.split("/").pop() ?? key;
}

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong.";
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = (await api.listTasks()) as { tasks: Job[] };
      // Newest first — the API returns rows in insertion order.
      const sorted = [...data.tasks].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
      setJobs(sorted);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; see https://react.dev/learn/you-might-not-need-an-effect#fetching-data
    refresh();
  }, [refresh]);

  return { jobs, loading, error, refresh };
}

/**
 * Open a finished job's output in a new tab.
 *
 * The backend only mints a presigned URL once `progress == 100`
 * (routers/tasks.py), so a job that looks done but hasn't had its progress
 * written yet returns 404 "File not ready yet" — surface that rather than
 * failing silently.
 */
export async function openJobResult(jobId: string): Promise<string | null> {
  try {
    const data = (await api.getTaskResult(jobId)) as { output_file_url: string };
    window.open(data.output_file_url, "_blank", "noopener");
    return null;
  } catch (err) {
    return `Could not open result: ${errorMessage(err)}`;
  }
}

/** Delete a job and its S3 objects. Returns an error message, or null on success. */
export async function deleteJob(jobId: string): Promise<string | null> {
  try {
    await api.deleteTask(jobId);
    return null;
  } catch (err) {
    return `Could not delete job: ${errorMessage(err)}`;
  }
}
