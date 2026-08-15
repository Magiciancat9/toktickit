import { useEffect, useState } from "react";
import { fetchHealth, HealthResponse } from "../api.js";

export function HealthStatus() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealthData(data);
    } catch (err) {
      console.error("Health check error:", err);
      setError("Unable to reach the backend. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="card shadow-sm mb-4 border-0 bg-light" data-testid="health-status-container">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold text-secondary">Backend Status:</span>
            {loading && (
              <span className="badge bg-secondary text-white d-inline-flex align-items-center gap-1" data-testid="loading-indicator">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Checking status...
              </span>
            )}
            {!loading && error && (
              <span className="badge bg-danger" data-testid="error-status">
                Offline
              </span>
            )}
            {!loading && !error && healthData && (
              <span className="badge bg-success text-capitalize" data-testid="online-status">
                Backend: {healthData.status} ({healthData.service})
              </span>
            )}
          </div>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={checkHealth}
            disabled={loading}
            data-testid="refresh-health-btn"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-danger mt-3 mb-0 py-2 small" role="alert" data-testid="health-error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthStatus;
