import { useEffect, useState } from "react";
import { fetchRequesters, Requester } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

type SelectorState = "loading" | "loaded" | "empty" | "error";

/**
 * Development Requester Selection screen.
 *
 * This is a LAB 2 TESTING MECHANISM ONLY — not real authentication.
 * No passwords, sessions, or tokens are involved.
 * In Lab 3 this screen will be replaced by real login.
 */
export function RequesterSelector() {
  const { selectRequester } = useRequester();

  const [selectorState, setSelectorState] = useState<SelectorState>("loading");
  const [requesters, setRequesters]       = useState<Requester[]>([]);
  const [selectedId, setSelectedId]       = useState<string>("");
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);

  useEffect(() => {
    fetchRequesters()
      .then((data) => {
        setRequesters(data);
        setSelectorState(data.length === 0 ? "empty" : "loaded");
      })
      .catch(() => {
        setErrorMsg("Unable to load requesters. Please check your connection and try again.");
        setSelectorState("error");
      });
  }, []);

  function handleContinue() {
    const requester = requesters.find((r) => r.id === Number(selectedId));
    if (requester) selectRequester(requester);
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "#EAF6EF" }}
      data-testid="requester-selector-screen"
    >
      <div
        className="card shadow-sm border-0 p-4 p-md-5"
        style={{ maxWidth: 480, width: "100%" }}
      >
        {/* Icon */}
        <div className="text-center mb-3">
          <span
            style={{ fontSize: "3rem", color: "#006B3C" }}
            aria-hidden="true"
          >
            👤
          </span>
        </div>

        {/* Title */}
        <h1
          className="h4 fw-bold text-center mb-2"
          style={{ color: "#1A2E22" }}
        >
          Select Development Requester
        </h1>

        {/* Explanatory text — clearly labels this as NOT login */}
        <p
          className="text-center mb-4"
          style={{ color: "#5A6E62", fontSize: "0.9rem" }}
        >
          Choose a development requester to simulate the current requester
          context for Lab 2.{" "}
          <strong>This is for testing only and is not a login screen.</strong>
        </p>

        {/* Loading state */}
        {selectorState === "loading" && (
          <div className="text-center py-3" data-testid="selector-loading">
            <div
              className="spinner-border"
              style={{ color: "#006B3C" }}
              role="status"
              aria-label="Loading requesters"
            >
              <span className="visually-hidden">Loading…</span>
            </div>
            <p className="mt-2 mb-0" style={{ color: "#5A6E62" }}>
              Loading requesters…
            </p>
          </div>
        )}

        {/* Error state */}
        {selectorState === "error" && (
          <div
            className="alert alert-danger"
            role="alert"
            data-testid="selector-error"
          >
            {errorMsg}
          </div>
        )}

        {/* Empty state */}
        {selectorState === "empty" && (
          <div
            className="alert alert-warning"
            role="alert"
            data-testid="selector-empty"
          >
            No active requesters found. Please contact your administrator.
          </div>
        )}

        {/* Loaded state — dropdown + actions */}
        {selectorState === "loaded" && (
          <>
            {/* Info callout */}
            <div
              className="rounded p-2 mb-3 d-flex align-items-center gap-2"
              style={{
                backgroundColor: "#EAF6EF",
                border: "1px solid #0B7A46",
                fontSize: "0.85rem",
                color: "#065F46",
              }}
              data-testid="selector-info"
            >
              <span aria-hidden="true">ℹ️</span>
              Only active development requesters are shown.
            </div>

            {/* Dropdown */}
            <div className="mb-3">
              <label
                htmlFor="requester-select"
                className="form-label fw-semibold"
                style={{ color: "#1A2E22" }}
              >
                Development Requester{" "}
                <span className="text-danger" aria-hidden="true">*</span>
                <span className="visually-hidden">(required)</span>
              </label>
              <select
                id="requester-select"
                className="form-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                aria-required="true"
                data-testid="requester-select"
              >
                <option value="" disabled>
                  Select a requester…
                </option>
                {requesters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lab 3 notice */}
            <div
              className="rounded p-2 mb-4"
              style={{
                backgroundColor: "#F5F7F6",
                border: "1px solid #D1D9D5",
                fontSize: "0.82rem",
                color: "#5A6E62",
              }}
            >
              <strong>Authentication coming in Lab 3</strong> — In Lab 3,
              this selection will be replaced with secure authentication so
              you can access the system with your own account.
            </div>

            {/* Action buttons */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedId("")}
                data-testid="selector-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn text-white fw-semibold"
                style={{ backgroundColor: "#006B3C" }}
                disabled={!selectedId}
                onClick={handleContinue}
                data-testid="selector-continue-btn"
              >
                Continue →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RequesterSelector;
