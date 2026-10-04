import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TASKS } from "../tasks";
import "./TutorialPage.css";

interface Step {
  title: string;
  content: React.ReactNode;
}

interface Chapter {
  id: string;
  icon: string;
  title: string;
  steps: Step[];
}

// Walks through the flow the app actually supports. The previous version
// documented a different product — ML training prompts, VM deploys, a Cloud
// Storage tab and a Monitoring tab, none of which exist — so every chapter
// here maps to a real screen. The task list is rendered from TASKS so it can't
// drift from the dashboard picker.
const chapters: Chapter[] = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    steps: [
      {
        title: "What is ASCEND?",
        content: (
          <>
            <p>
              ASCEND is a cloud media-processing service. You upload an image or
              video, choose what you want done to it, and a worker in the cloud
              processes the file and hands back the result.
            </p>
            <div className="info-box">
              <strong>How it works:</strong>
              <ul>
                <li>Your file is uploaded to private cloud storage</li>
                <li>The job is queued and picked up by a processing worker</li>
                <li>The finished file is stored and available to download</li>
              </ul>
            </div>
            <p>
              Jobs run in the background, so you can leave the page and check
              back later — nothing is lost if you close the tab.
            </p>
          </>
        ),
      },
      {
        title: "Create your account",
        content: (
          <>
            <p>
              Click <strong>Get Started</strong> on the homepage to register with
              a username and password, or sign in if you already have an account.
            </p>
            <div className="step-callout">
              <span className="callout-icon">💡</span>
              <span>
                Your uploads and results are private to your account — every job
                is scoped to the user who submitted it.
              </span>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "submit-job",
    icon: "⚡",
    title: "Submit a Job",
    steps: [
      {
        title: "Choose a task",
        content: (
          <>
            <p>
              On the <strong>Dashboard</strong>, pick a task from the dropdown.
              These are the tasks available today:
            </p>
            <div className="action-list">
              {TASKS.map((task) => (
                <div className="action-item" key={task.id}>
                  <span>{task.icon}</span>
                  <div>
                    <strong>{task.label}</strong> — {task.description}
                  </div>
                </div>
              ))}
            </div>
            <p>
              The <strong>Task Catalog</strong> shows the same list as cards —
              clicking one opens the dashboard with that task already selected.
            </p>
          </>
        ),
      },
      {
        title: "Upload your file",
        content: (
          <>
            <p>
              Drag a file onto the upload area, or click it to open a file
              picker. The accepted file types depend on the task you picked —
              image tasks only take images.
            </p>
            <div className="step-callout">
              <span className="callout-icon">💡</span>
              <span>
                Supported formats are <strong>jpg, png, webp</strong> for images
                and <strong>mp4, mov, avi, webm</strong> for video.
              </span>
            </div>
          </>
        ),
      },
      {
        title: "Set the task options",
        content: (
          <>
            <p>
              Some tasks need a little more detail, which appears under the
              upload area once you've chosen a task:
            </p>
            <div className="info-box">
              <ul>
                <li>
                  <strong>Image Resize</strong> — the width and height in pixels
                </li>
                <li>
                  <strong>Format Converter</strong> — the format to convert to.
                  The source format is read from your file automatically, and
                  only compatible targets are offered: images convert to images,
                  video to video.
                </li>
                <li>
                  <strong>Deblur</strong> — no options needed
                </li>
              </ul>
            </div>
            <p>
              Press <strong>Submit Job</strong> and it goes into the queue.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "results",
    icon: "📦",
    title: "Track & Download",
    steps: [
      {
        title: "Track your job",
        content: (
          <>
            <p>
              Submitted jobs appear under <strong>Recent Jobs</strong> on the
              dashboard, and in full under <strong>My Jobs</strong>. Each job
              carries one of four statuses:
            </p>
            <div className="status-grid">
              <div className="status-pill pending">● Queued</div>
              <div className="status-pill running">● Running</div>
              <div className="status-pill done">● Complete</div>
              <div className="status-pill error">● Failed</div>
            </div>
            <p>
              <strong>Queued</strong> means the job is waiting for a worker;{" "}
              <strong>Running</strong> means it's being processed. Refresh the
              page to see the latest status.
            </p>
          </>
        ),
      },
      {
        title: "Download your result",
        content: (
          <>
            <p>
              Once a job is <strong>Complete</strong>, use the{" "}
              <strong>Download</strong> button on the My Jobs page (or{" "}
              <strong>View</strong> on the dashboard) to open the finished file.
            </p>
            <div className="step-callout">
              <span className="callout-icon">💡</span>
              <span>
                Download links are generated on demand and expire after 24
                hours. Come back to My Jobs for a fresh one any time.
              </span>
            </div>
            <p>
              Deleting a job from My Jobs also removes the uploaded file and the
              result from storage, so only do it when you've saved what you need.
            </p>
          </>
        ),
      },
    ],
  },
];

export default function TutorialPage() {
  const [activeChapter, setActiveChapter] = useState(chapters[0].id);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const chapter = chapters.find((c) => c.id === activeChapter)!;
  const totalSteps = chapter.steps.length;
  const step = chapter.steps[activeStep];

  function goNext() {
    if (activeStep < totalSteps - 1) {
      setActiveStep(activeStep + 1);
    } else {
      const idx = chapters.findIndex((c) => c.id === activeChapter);
      if (idx < chapters.length - 1) {
        setActiveChapter(chapters[idx + 1].id);
        setActiveStep(0);
      }
    }
  }

  function goPrev() {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      const idx = chapters.findIndex((c) => c.id === activeChapter);
      if (idx > 0) {
        const prev = chapters[idx - 1];
        setActiveChapter(prev.id);
        setActiveStep(prev.steps.length - 1);
      }
    }
  }

  const isFirst =
    chapters.findIndex((c) => c.id === activeChapter) === 0 && activeStep === 0;
  const isLast =
    chapters.findIndex((c) => c.id === activeChapter) === chapters.length - 1 &&
    activeStep === totalSteps - 1;

  return (
    <div className="tut-root">
      {/* Top bar */}
      <nav className="tut-nav">
        <button className="tut-back-btn" onClick={() => navigate("/")}>
          ← Home
        </button>
        <span className="tut-nav-title">ASCEND Tutorial Guide</span>
      </nav>

      <div className="tut-layout">
        {/* Sidebar */}
        <aside className="tut-sidebar">
          <p className="sidebar-label">Chapters</p>
          {chapters.map((ch) => (
            <button
              key={ch.id}
              className={`sidebar-item ${activeChapter === ch.id ? "active" : ""}`}
              onClick={() => {
                setActiveChapter(ch.id);
                setActiveStep(0);
              }}
            >
              <span className="sidebar-icon">{ch.icon}</span>
              <span>{ch.title}</span>
            </button>
          ))}

          <div className="sidebar-divider" />

          <div className="sidebar-progress">
            <p className="sidebar-label">Progress</p>
            {chapters.map((ch) => (
              <div key={ch.id} className="progress-row">
                <span
                  className={`progress-dot ${activeChapter === ch.id ? "active" : ""}`}
                />
                <span className="progress-name">{ch.title}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="tut-content">
          <div className="tut-breadcrumb">
            {chapter.icon} {chapter.title}
          </div>

          <div className="tut-step-header">
            <span className="step-badge">
              Step {activeStep + 1} of {totalSteps}
            </span>
            <h2 className="tut-step-title">{step.title}</h2>
          </div>

          <div className="tut-step-body">{step.content}</div>

          {/* Navigation */}
          <div className="tut-nav-btns">
            <button
              className="tut-btn secondary"
              onClick={goPrev}
              disabled={isFirst}
            >
              ← Previous
            </button>
            {isLast ? (
              <button
                className="tut-btn primary"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard ✓
              </button>
            ) : (
              <button className="tut-btn primary" onClick={goNext}>
                Next →
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
