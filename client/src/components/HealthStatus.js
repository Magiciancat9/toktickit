import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchHealth } from "../api.js";
export function HealthStatus() {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const checkHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchHealth();
            setHealthData(data);
        }
        catch (err) {
            console.error("Health check error:", err);
            setError("Unable to reach the backend. Please try again later.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        checkHealth();
    }, []);
    return (_jsx("div", { className: "card shadow-sm mb-4 border-0 bg-light", "data-testid": "health-status-container", children: _jsxs("div", { className: "card-body p-3", children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("span", { className: "fw-semibold text-secondary", children: "Backend Status:" }), loading && (_jsxs("span", { className: "badge bg-secondary text-white d-inline-flex align-items-center gap-1", "data-testid": "loading-indicator", children: [_jsx("span", { className: "spinner-border spinner-border-sm", role: "status", "aria-hidden": "true" }), "Checking status..."] })), !loading && error && (_jsx("span", { className: "badge bg-danger", "data-testid": "error-status", children: "Offline" })), !loading && !error && healthData && (_jsxs("span", { className: "badge bg-success text-capitalize", "data-testid": "online-status", children: ["Backend: ", healthData.status, " (", healthData.service, ")"] }))] }), _jsx("button", { className: "btn btn-sm btn-outline-primary", onClick: checkHealth, disabled: loading, "data-testid": "refresh-health-btn", children: "Refresh" })] }), error && (_jsx("div", { className: "alert alert-danger mt-3 mb-0 py-2 small", role: "alert", "data-testid": "health-error-message", children: error }))] }) }));
}
export default HealthStatus;
