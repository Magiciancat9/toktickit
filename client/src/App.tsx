import { useState } from "react";
import { checkSystem, Category } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCheck() {
    setState("loading");
    setErrorMsg(null);
    try {
      const data = await checkSystem();
      setCategories(data.categories);
      setState("success");
    } catch (err) {
      console.error("System check failed:", err);
      setErrorMsg("Unable to connect to TokTickIT API");
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
        <>
          <div className="mt-3 mb-3" data-testid="online-status">
            <span className="badge bg-success fs-6">System Status: Online</span>
          </div>

          <div data-testid="categories-list">
            <h2 className="h6 fw-semibold mb-2">Supported Request Categories</h2>
            <ol>
              {categories.map((cat) => (
                <li key={cat.id}>{cat.name}</li>
              ))}
            </ol>
          </div>
        </>
      )}

      {state === "error" && (
        <div className="mt-3">
          <div className="mb-2" data-testid="offline-status">
            <span className="badge bg-danger fs-6">System Status: Offline</span>
          </div>
          <div className="alert alert-danger py-2" data-testid="health-error-message">
            {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
}
