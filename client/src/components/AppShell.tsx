import { ReactNode } from "react";
import { useRequester } from "../context/RequesterContext.js";

type Page = "my-tickets" | "create-ticket";

interface AppShellProps {
  children:    ReactNode;
  activePage?: Page;
  onNavigate?: (page: Page) => void;
}

/**
 * Application shell: top navigation bar + page content area.
 * Displays the current Development Requester name and a "Change" link.
 * This is a Lab 2 testing mechanism — not real authentication.
 */
export function AppShell({ children, activePage, onNavigate }: AppShellProps) {
  const { currentRequester, clearRequester } = useRequester();

  function navLinkStyle(page: Page): React.CSSProperties {
    return activePage === page
      ? { borderBottom: "2px solid #EAF6EF", paddingBottom: 2 }
      : {};
  }

  return (
    <>
      {/* ── Navigation bar ── */}
      <nav
        className="navbar navbar-expand-md px-3 px-md-4"
        style={{ backgroundColor: "#006B3C" }}
        data-testid="app-shell-nav"
      >
        {/* Brand */}
        <button
          className="navbar-brand fw-bold text-white fs-5 btn p-0 border-0"
          style={{ letterSpacing: "0.02em", background: "none" }}
          onClick={() => onNavigate?.("my-tickets")}
          aria-label="TokTickIT home"
        >
          🕐 TokTickIT
        </button>

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
              <button
                className="nav-link text-white btn p-2 border-0"
                style={navLinkStyle("my-tickets")}
                onClick={() => onNavigate?.("my-tickets")}
                data-testid="nav-my-tickets"
                aria-current={activePage === "my-tickets" ? "page" : undefined}
              >
                My Tickets
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link text-white btn p-2 border-0"
                style={navLinkStyle("create-ticket")}
                onClick={() => onNavigate?.("create-ticket")}
                data-testid="nav-create-ticket"
                aria-current={activePage === "create-ticket" ? "page" : undefined}
              >
                + Create Ticket
              </button>
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
