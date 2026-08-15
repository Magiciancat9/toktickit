import { useState } from "react";
import { fetchHealth, HealthResponse } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCheck() {
    setState("loading");
    setErrorMsg(null);
    try {
      const data: HealthResponse = await fetchHealth();
      // Formats data.status ("online") to "Backend: Online"
      const formattedStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
      setStatusText(`System Status: ${formattedStatus}`);
      setState("success");
    } catch (err) {
      console.error("Health check failed:", err);
      setErrorMsg("Unable to reach the backend. Please try again later.");
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <div className="mb-3">
        <button
          className="btn btn-success"
          onClick={handleCheck}
          disabled={state === "loading"}
          data-testid="check-system-btn"
        >
          {state === "loading" ? "Loading…" : "Check System"}
        </button>
      </div>

      {state === "loading" && (
        <div className="alert alert-info py-2" data-testid="loading-indicator">
          Checking system status...
        </div>
      )}

      {state === "success" && (
        <div className="mt-3" data-testid="online-status">
          <span className="badge bg-success fs-6">{statusText}</span>
        </div>
      )}

      {state === "error" && (
        <div className="alert alert-danger py-2 mt-3" data-testid="health-error-message">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
