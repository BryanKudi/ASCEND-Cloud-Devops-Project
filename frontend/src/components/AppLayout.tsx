// Nav + sidebar chrome for the signed-in pages.
//
// This markup used to be copy-pasted into DashboardPage, MarketplacePage and
// JobsPage, along with three copies of SIDEBAR_LINKS and handleLogout — so the
// three sidebars had already drifted. One component now owns it.

import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AppLayout.css";

// Only pages that exist. The old list also had Pricing and Settings, which had
// no route in App.tsx and silently fell through to NotFoundPage.
const SIDEBAR_LINKS = [
  { icon: "🖥️", label: "Dashboard", path: "/dashboard" },
  { icon: "🗂️", label: "Task Catalog", path: "/marketplace" },
  { icon: "⚡", label: "My Jobs", path: "/jobs" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "User";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <div className="dash-root">
      <nav className="dash-nav">
        <button className="dash-logo" onClick={() => navigate("/")}>
          ASCEND
        </button>
        <div className="dash-nav-right">
          <span className="dash-username">{username}</span>
          <button className="dash-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <nav className="dash-sidebar-nav">
            {SIDEBAR_LINKS.map((link) => (
              <button
                key={link.path}
                className={`dash-sidebar-item ${
                  location.pathname === link.path ? "active" : ""
                }`}
                onClick={() => navigate(link.path)}
              >
                <span className="dash-sidebar-icon">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
