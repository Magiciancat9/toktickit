import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "../context/AuthContext.js";
/**
 * Application shell (Lab 3): top navigation bar with authenticated user display + logout.
 * Shows role-specific navigation (Requester: My Tickets, Create Ticket).
 */
export function AppShell({ children, activePage, onNavigate }) {
    const { user, logout } = useAuth();
    function navLinkStyle(page) {
        return activePage === page
            ? { borderBottom: "2px solid #EAF6EF", paddingBottom: 2 }
            : {};
    }
    function getRoleBadgeColor(role) {
        switch (role) {
            case "REQUESTER":
                return "#3B82F6"; // Blue
            case "IT_STAFF":
                return "#006B3C"; // Green
            case "ADMINISTRATOR":
                return "#8B5CF6"; // Purple
            default:
                return "#6B7280"; // Gray
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "navbar navbar-expand-md px-3 px-md-4", style: { backgroundColor: "#006B3C" }, "data-testid": "app-shell-nav", children: [_jsx("button", { className: "navbar-brand fw-bold text-white fs-5 btn p-0 border-0", style: { letterSpacing: "0.02em", background: "none" }, onClick: () => onNavigate?.("my-tickets"), "aria-label": "TokTickIT home", children: "\uD83D\uDD50 TokTickIT" }), _jsx("button", { className: "navbar-toggler border-0", type: "button", "data-bs-toggle": "collapse", "data-bs-target": "#main-nav", "aria-controls": "main-nav", "aria-expanded": "false", "aria-label": "Toggle navigation", style: { color: "white" }, children: _jsx("span", { className: "navbar-toggler-icon", style: { filter: "invert(1)" } }) }), _jsxs("div", { className: "collapse navbar-collapse", id: "main-nav", children: [_jsxs("ul", { className: "navbar-nav me-auto gap-1", children: [user?.role === "REQUESTER" && (_jsxs(_Fragment, { children: [_jsx("li", { className: "nav-item", children: _jsx("button", { className: "nav-link text-white btn p-2 border-0", style: navLinkStyle("my-tickets"), onClick: () => onNavigate?.("my-tickets"), "data-testid": "nav-my-tickets", "aria-current": activePage === "my-tickets" ? "page" : undefined, children: "My Tickets" }) }), _jsx("li", { className: "nav-item", children: _jsx("button", { className: "nav-link text-white btn p-2 border-0", style: navLinkStyle("create-ticket"), onClick: () => onNavigate?.("create-ticket"), "data-testid": "nav-create-ticket", "aria-current": activePage === "create-ticket" ? "page" : undefined, children: "+ Create Ticket" }) })] })), (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") && (_jsx("li", { className: "nav-item", children: _jsx("button", { className: "nav-link text-white btn p-2 border-0", style: navLinkStyle("staff-queue"), onClick: () => onNavigate?.("staff-queue"), "data-testid": "nav-ticket-queue", "aria-current": activePage === "staff-queue" ? "page" : undefined, children: "Ticket Queue" }) }))] }), user && (_jsxs("div", { className: "d-flex align-items-center gap-2", "data-testid": "authenticated-user-display", children: [_jsxs("span", { className: "text-white", style: { fontSize: "0.9rem" }, children: ["\uD83D\uDC64 ", user.name] }), _jsx("span", { style: {
                                            backgroundColor: getRoleBadgeColor(user.role),
                                            color: "white",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            textTransform: "capitalize",
                                        }, "data-testid": "user-role-badge", children: user.role.replace("_", " ") }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-light", onClick: logout, "data-testid": "logout-btn", "aria-label": "Logout", children: "Logout" })] }))] })] }), _jsx("main", { className: "container-fluid px-3 px-md-4 py-4", style: { backgroundColor: "#F5F7F6", minHeight: "calc(100vh - 56px)" }, children: children })] }));
}
export default AppShell;
