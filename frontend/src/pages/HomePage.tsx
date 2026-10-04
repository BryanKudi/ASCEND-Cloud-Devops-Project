import { useNavigate } from "react-router-dom";
import { TASKS } from "../tasks";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* Top nav */}
      <nav className="home-nav">
        <span className="home-logo">ASCEND</span>
        <div className="home-nav-right">
          <button className="nav-link-btn" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button
            className="nav-link-btn"
            onClick={() => navigate("/marketplace")}
          >
            Task Catalog
          </button>
          <button className="nav-link-btn" onClick={() => navigate("/jobs")}>
            My Jobs
          </button>
          <button className="nav-link-btn" onClick={() => navigate("/tutorial")}>
            Tutorial
          </button>
          <button className="nav-cta" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Main centered content */}
      <main className="home-main">
        <div className="home-center">
          <div className="home-icon">☁️</div>
          <h1 className="home-heading">Media processing in the cloud</h1>
          <p className="home-subheading">
            Upload a file, pick a task, and let it run. Results are stored and
            ready to download when the job finishes.
          </p>

          {/* The real task list — each card opens the form preselected. */}
          <div className="suggestion-grid">
            {TASKS.map((task) => (
              <button
                key={task.id}
                className="suggestion-card"
                onClick={() => navigate(`/dashboard?task=${task.id}`)}
              >
                <span className="suggestion-icon">{task.icon}</span>
                <span className="suggestion-label">{task.label}</span>
              </button>
            ))}
          </div>

          <button className="home-primary-cta" onClick={() => navigate("/login")}>
            Get started →
          </button>

          <p className="home-hint">
            New to ASCEND?{" "}
            <button
              className="home-hint-link"
              onClick={() => navigate("/tutorial")}
            >
              View the tutorial guide →
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <span>© 2026 ASCEND Cloud</span>
        <button className="home-hint-link" onClick={() => navigate("/tutorial")}>
          How it works
        </button>
      </footer>
    </div>
  );
}
