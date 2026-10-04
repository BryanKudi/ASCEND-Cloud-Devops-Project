// The task catalog: a browsable view of what ASCEND can run.
//
// This replaced a grid of 8 invented services with made-up prices ($2.99) and
// durations (~5 min), none of which existed server-side and all of which just
// navigated to /dashboard. Cards now come from the shared TASKS registry and
// deep-link to the dashboard with the task preselected.

import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { TASKS, type Task } from "../tasks";
import "./MarketplacePage.css";

const ACCEPTS_LABEL: Record<Task["accepts"], string> = {
  image: "Images",
  video: "Video",
  both: "Images & video",
};

export default function MarketplacePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mkt-header">
        <h1 className="mkt-title">Task Catalog</h1>
        <p className="mkt-subtitle">
          Pick a task to jump straight to the upload form.
        </p>
      </div>

      <div className="mkt-grid">
        {TASKS.map((task) => (
          <button
            key={task.id}
            className="mkt-card"
            onClick={() => navigate(`/dashboard?task=${task.id}`)}
          >
            <div className="mkt-card-icon">{task.icon}</div>
            <div className="mkt-card-body">
              <h2 className="mkt-card-name">{task.label}</h2>
              <p className="mkt-card-desc">{task.description}</p>
            </div>
            <div className="mkt-card-footer">
              <span className="mkt-card-accepts">
                {ACCEPTS_LABEL[task.accepts]}
              </span>
              <span className="mkt-card-cta">Use this task →</span>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
