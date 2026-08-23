import { ReactNode } from "react";
import { useRequester } from "../context/RequesterContext.js";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Application shell: top navigation bar + page content area.
 * Displays the current Development Requester name and a "Change" link.
 * This is a Lab 2 testing mechanism — not real authentication.
 */
export function AppShell({ children }: AppShellProps) {
  const { currentRequester, clearRequester } = useRequester();

  return (
    <>
      {/* ── Navigation bar ── */}
      <nav
        className="navbar navbar-expand-md px-3 px-md-4"
        style={{ backgroundColor: "#006B3C" }}
        data-testid="app-shell-nav"
      >
        {/* Brand */}
        <span
          className="navbar-brand fw-bold text-white fs-5"
          style={{ letterSpacing: "0.02em" }}
        >
          🕐 TokTickIT
        </span>

        {/* Hamburger toggle for mobile */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#main-nav"
          aria-controls="main-nav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: "white" }}
        >
          <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }} />
        </button>

        <div className="collapse navbar-collapse" id="main-nav">
          {/* Left nav links */}
          <ul className="navbar-nav me-auto gap-1">
            <li className="nav-item">
              <a
                href="#my-tickets"
                className="nav-link text-white"
                data-testid="nav-my-tickets"
              >
                My Tickets
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#create-ticket"
                className="nav-link text-white"
                data-testid="nav-create-ticket"
              >
                + Create Ticket
              </a>
            </li>
          </ul>

          {/* Right — current requester identity display */}
          {currentRequester && (
            <div
              className="d-flex align-items-center gap-2"
              data-testid="current-requester-display"
            >
              <span className="text-white" style={{ fontSize: "0.9rem" }}>
                👤 {currentRequester.name}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={clearRequester}
                data-testid="change-requester-btn"
                aria-label="Change development requester"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Page content ── */}
      <main
        className="container-fluid px-3 px-md-4 py-4"
        style={{ backgroundColor: "#F5F7F6", minHeight: "calc(100vh - 56px)" }}
      >
        {children}
      </main>
    </>
  );
}

export default AppShell;
