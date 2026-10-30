import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { fetchRequesterDashboard } from '../api';
import './RequesterDashboard.css';
const RequesterDashboard = ({ onNavigate }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadDashboard();
    }, []);
    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchRequesterDashboard();
            setMetrics(data);
        }
        catch (err) {
            setError(err.message || 'Failed to load dashboard');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRetry = () => {
        loadDashboard();
    };
    const navigate = (path) => {
        onNavigate?.(path.endsWith('/new') ? 'create-ticket' : 'my-tickets');
    };
    if (loading) {
        return (_jsxs("div", { className: "requester-dashboard", children: [_jsx("h1", { className: "dashboard-title", children: "Dashboard" }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "metric-card skeleton", children: [_jsx("div", { className: "skeleton-text skeleton-title" }), _jsx("div", { className: "skeleton-text skeleton-value" })] }), _jsxs("div", { className: "metric-card skeleton", children: [_jsx("div", { className: "skeleton-text skeleton-title" }), _jsx("div", { className: "skeleton-text skeleton-value" })] }), _jsxs("div", { className: "metric-card skeleton", children: [_jsx("div", { className: "skeleton-text skeleton-title" }), _jsx("div", { className: "skeleton-text skeleton-value" })] }), _jsxs("div", { className: "metric-card skeleton", children: [_jsx("div", { className: "skeleton-text skeleton-title" }), _jsx("div", { className: "skeleton-text skeleton-value" })] })] })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "requester-dashboard", children: [_jsx("h1", { className: "dashboard-title", children: "Dashboard" }), _jsxs("div", { className: "error-state", children: [_jsx("div", { className: "error-icon", children: "\u26A0\uFE0F" }), _jsx("h2", { children: "Unable to Load Dashboard" }), _jsx("p", { children: error }), _jsx("button", { className: "btn-primary", onClick: handleRetry, children: "Retry" })] })] }));
    }
    if (!metrics) {
        return null;
    }
    const hasNoTickets = metrics.totalOpen === 0 &&
        metrics.recentlyUpdated === 0 &&
        metrics.recentlyResolved === 0;
    return (_jsxs("div", { className: "requester-dashboard", children: [_jsx("h1", { className: "dashboard-title", children: "Dashboard" }), hasNoTickets && (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCCB" }), _jsx("h2", { children: "Welcome to TokTickIT" }), _jsx("p", { children: "You don't have any tickets yet. Create your first ticket to get started." }), _jsx("button", { className: "btn-primary", onClick: () => navigate('/my-tickets/new'), children: "Create Ticket" })] })), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-header", children: _jsx("h2", { className: "metric-label", children: "Open Tickets" }) }), _jsx("div", { className: "metric-value", children: metrics.totalOpen }), _jsx("div", { className: "metric-description", children: "Active tickets requiring attention" }), _jsx("button", { className: "metric-link", onClick: () => navigate('/my-tickets'), "aria-label": "View all open tickets", children: "View All \u2192" })] }), _jsxs("div", { className: "metric-card highlight", children: [_jsx("div", { className: "metric-header", children: _jsx("h2", { className: "metric-label", children: "Waiting for You" }) }), _jsx("div", { className: "metric-value", children: metrics.waitingForRequester }), _jsx("div", { className: "metric-description", children: "Tickets needing your response" }), _jsx("button", { className: "metric-link", onClick: () => navigate('/my-tickets?status=WAITING_FOR_REQUESTER'), "aria-label": "View tickets waiting for response", children: "View All \u2192" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-header", children: _jsx("h2", { className: "metric-label", children: "Recently Updated" }) }), _jsx("div", { className: "metric-value", children: metrics.recentlyUpdated }), _jsx("div", { className: "metric-description", children: "Updated in the last 7 days" }), _jsx("button", { className: "metric-link", onClick: () => navigate('/my-tickets'), "aria-label": "View recently updated tickets", children: "View All \u2192" })] }), _jsxs("div", { className: "metric-card success", children: [_jsx("div", { className: "metric-header", children: _jsx("h2", { className: "metric-label", children: "Recently Resolved" }) }), _jsx("div", { className: "metric-value", children: metrics.recentlyResolved }), _jsx("div", { className: "metric-description", children: "Resolved in the last 30 days" }), _jsx("button", { className: "metric-link", onClick: () => navigate('/my-tickets?status=RESOLVED,CLOSED'), "aria-label": "View recently resolved tickets", children: "View All \u2192" })] })] }), _jsxs("div", { className: "quick-actions", children: [_jsx("h2", { children: "Quick Actions" }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { className: "action-card", onClick: () => navigate('/my-tickets/new'), children: [_jsx("span", { className: "action-icon", children: "\u2795" }), _jsx("span", { className: "action-label", children: "Create Ticket" })] }), _jsxs("button", { className: "action-card", onClick: () => navigate('/my-tickets'), children: [_jsx("span", { className: "action-icon", children: "\uD83D\uDCCB" }), _jsx("span", { className: "action-label", children: "View My Tickets" })] })] })] })] }));
};
export default RequesterDashboard;
