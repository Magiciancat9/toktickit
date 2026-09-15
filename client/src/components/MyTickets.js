import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { fetchTickets, fetchCategories, } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
const PRIORITY_BADGE = {
    LOW: "bg-secondary",
    MEDIUM: "bg-warning text-dark",
    HIGH: "bg-danger",
};
const STATUS_BADGE = {
    NEW: "bg-success",
};
// ── Component ────────────────────────────────────────────────────────────
export function MyTickets({ onCreateTicket, onOpenTicket }) {
    const { currentRequester } = useRequester();
    // Filter / sort / pagination state
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    // Data state
    const [listState, setListState] = useState("loading");
    const [tickets, setTickets] = useState([]);
    const [meta, setMeta] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [categories, setCategories] = useState([]);
    // Load categories for filter dropdown
    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => { });
    }, []);
    // Load tickets whenever filters/requester change
    const loadTickets = useCallback(async () => {
        if (!currentRequester)
            return;
        setListState("loading");
        setErrorMsg(null);
        try {
            const result = await fetchTickets({
                requesterId: currentRequester.id,
                search: search || undefined,
                category: category || undefined,
                priority: priority || undefined,
                status: status || undefined,
                sort, order, page, pageSize: PAGE_SIZE,
            });
            setTickets(result.data);
            setMeta(result.meta);
            if (result.data.length === 0) {
                const hasFilters = search || category || priority || status;
                setListState(hasFilters ? "no-results" : "empty");
            }
            else {
                setListState("loaded");
            }
        }
        catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Unable to load tickets.");
            setListState("error");
        }
    }, [currentRequester, search, category, priority, status, sort, order, page]);
    useEffect(() => { void loadTickets(); }, [loadTickets]);
    function toggleSort(field) {
        if (sort === field) {
            setOrder(o => o === "asc" ? "desc" : "asc");
        }
        else {
            setSort(field);
            setOrder("desc");
        }
        setPage(1);
    }
    function clearFilters() {
        setSearch("");
        setCategory("");
        setPriority("");
        setStatus("");
        setPage(1);
    }
    // ── Sort indicator ───────────────────────────────────────────────────
    function SortIcon({ field }) {
        if (sort !== field)
            return _jsx("span", { style: { opacity: 0.3 }, children: " \u2195" });
        return _jsx("span", { children: order === "asc" ? " ↑" : " ↓" });
    }
    // ── Render ───────────────────────────────────────────────────────────
    return (_jsxs("div", { "data-testid": "my-tickets-screen", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2", children: [_jsxs("div", { children: [_jsx("h1", { className: "h4 fw-bold mb-0", style: { color: "#1A2E22" }, children: "My Tickets" }), _jsx("p", { className: "mb-0 text-muted", style: { fontSize: "0.875rem" }, children: "View and track all of your support requests." })] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "btn btn-outline-secondary btn-sm", onClick: clearFilters, "data-testid": "clear-filters-btn", children: "\u27F3 Clear Filters" }), _jsx("button", { className: "btn text-white btn-sm fw-semibold", style: { backgroundColor: "#006B3C" }, onClick: onCreateTicket, "data-testid": "create-ticket-btn", children: "+ Create Ticket" })] })] }), _jsx("div", { className: "card shadow-sm border-0 mb-3 p-3", children: _jsxs("div", { className: "row g-2", children: [_jsx("div", { className: "col-12 col-md-4", children: _jsx("input", { type: "search", className: "form-control form-control-sm", placeholder: "Search by ticket number or summary\u2026", value: search, onChange: e => { setSearch(e.target.value); setPage(1); }, "data-testid": "search-input", "aria-label": "Search tickets" }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select form-select-sm", value: category, onChange: e => { setCategory(e.target.value); setPage(1); }, "data-testid": "filter-category", "aria-label": "Filter by category", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map(c => (_jsx("option", { value: c.name, children: c.name }, c.id)))] }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select form-select-sm", value: priority, onChange: e => { setPriority(e.target.value); setPage(1); }, "data-testid": "filter-priority", "aria-label": "Filter by priority", children: [_jsx("option", { value: "", children: "All Priorities" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select form-select-sm", value: status, onChange: e => { setStatus(e.target.value); setPage(1); }, "data-testid": "filter-status", "aria-label": "Filter by status", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "NEW", children: "New" })] }) })] }) }), listState === "loading" && (_jsxs("div", { className: "text-center py-5", "data-testid": "tickets-loading", children: [_jsx("div", { className: "spinner-border", style: { color: "#006B3C" }, role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading tickets\u2026" }) }), _jsx("p", { className: "mt-2 text-muted", children: "Loading tickets\u2026" })] })), listState === "error" && (_jsxs("div", { className: "alert alert-danger d-flex justify-content-between align-items-center", "data-testid": "tickets-error", children: [_jsx("span", { children: errorMsg ?? "Unable to load tickets. Please try again." }), _jsx("button", { className: "btn btn-sm btn-outline-danger", onClick: loadTickets, children: "Retry" })] })), listState === "empty" && (_jsxs("div", { className: "text-center py-5", "data-testid": "tickets-empty", children: [_jsx("p", { className: "text-muted mb-3", style: { fontSize: "1rem" }, children: "You have no tickets yet." }), _jsx("button", { className: "btn text-white", style: { backgroundColor: "#006B3C" }, onClick: onCreateTicket, children: "+ Create your first ticket" })] })), listState === "no-results" && (_jsxs("div", { className: "text-center py-5", "data-testid": "tickets-no-results", children: [_jsx("p", { className: "text-muted mb-3", children: "No tickets match your search or filters." }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", onClick: clearFilters, children: "Clear Filters" })] })), listState === "loaded" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "d-none d-md-block", "data-testid": "tickets-table", children: _jsx("div", { className: "card shadow-sm border-0", children: _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover mb-0 align-middle", children: [_jsx("thead", { style: { backgroundColor: "#F5F7F6" }, children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: _jsxs("button", { className: "btn btn-link p-0 text-decoration-none fw-semibold", style: { color: "#1A2E22" }, onClick: () => toggleSort("createdAt"), "aria-label": "Sort by created date", children: ["Ticket No. / Created ", _jsx(SortIcon, { field: "createdAt" })] }) }), _jsx("th", { scope: "col", style: { color: "#1A2E22" }, children: "Summary" }), _jsx("th", { scope: "col", style: { color: "#1A2E22" }, children: "Category" }), _jsx("th", { scope: "col", style: { color: "#1A2E22" }, children: "Priority" }), _jsx("th", { scope: "col", style: { color: "#1A2E22" }, children: "Status" }), _jsx("th", { scope: "col", children: _jsxs("button", { className: "btn btn-link p-0 text-decoration-none fw-semibold", style: { color: "#1A2E22" }, onClick: () => toggleSort("updatedAt"), "aria-label": "Sort by last updated", children: ["Last Updated ", _jsx(SortIcon, { field: "updatedAt" })] }) })] }) }), _jsx("tbody", { children: tickets.map(t => (_jsxs("tr", { "data-testid": `ticket-row-${t.ticketNumber}`, children: [_jsxs("td", { children: [_jsx("button", { className: "btn btn-link p-0 fw-semibold text-decoration-none", style: { color: "#006B3C" }, onClick: () => onOpenTicket(t.ticketNumber), "data-testid": `ticket-link-${t.ticketNumber}`, children: t.ticketNumber }), _jsx("small", { className: "d-block text-muted", children: formatDate(t.createdAt) })] }), _jsx("td", { style: { maxWidth: 280 }, children: _jsx("span", { style: {
                                                                display: "block", overflow: "hidden",
                                                                textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                            }, children: t.summary }) }), _jsx("td", { children: t.category?.name ?? "—" }), _jsx("td", { children: _jsx("span", { className: `badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`, children: t.requestedPriority }) }), _jsx("td", { children: _jsx("span", { className: `badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`, children: t.status }) }), _jsx("td", { children: _jsx("small", { className: "text-muted", children: formatDate(t.updatedAt) }) })] }, t.id))) })] }) }) }) }), _jsx("div", { className: "d-md-none", "data-testid": "tickets-cards", children: tickets.map(t => (_jsxs("div", { className: "card shadow-sm border-0 mb-2 p-3", "data-testid": `ticket-card-${t.ticketNumber}`, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start", children: [_jsx("button", { className: "btn btn-link p-0 fw-semibold text-decoration-none", style: { color: "#006B3C" }, onClick: () => onOpenTicket(t.ticketNumber), "data-testid": `ticket-card-link-${t.ticketNumber}`, children: t.ticketNumber }), _jsx("span", { className: `badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`, children: t.status })] }), _jsx("p", { className: "mb-1 mt-1", style: { fontSize: "0.9rem" }, children: t.summary }), _jsxs("div", { className: "d-flex gap-2 flex-wrap", children: [_jsx("small", { className: "text-muted", children: t.category?.name }), _jsx("span", { className: `badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`, children: t.requestedPriority }), _jsx("small", { className: "text-muted ms-auto", children: formatDate(t.createdAt) })] })] }, t.id))) }), meta && meta.totalPages > 1 && (_jsxs("div", { className: "d-flex justify-content-between align-items-center mt-3", "data-testid": "pagination", children: [_jsxs("small", { className: "text-muted", children: ["Showing ", (page - 1) * PAGE_SIZE + 1, "\u2013", Math.min(page * PAGE_SIZE, meta.total), " of ", meta.total, " tickets"] }), _jsx("nav", { "aria-label": "Ticket list pagination", children: _jsxs("ul", { className: "pagination pagination-sm mb-0", children: [_jsx("li", { className: `page-item ${page === 1 ? "disabled" : ""}`, children: _jsx("button", { className: "page-link", onClick: () => setPage(p => p - 1), disabled: page === 1, "aria-label": "Previous page", children: "\u2039 Prev" }) }), Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (_jsx("li", { className: `page-item ${p === page ? "active" : ""}`, children: _jsx("button", { className: "page-link", onClick: () => setPage(p), "aria-label": `Go to page ${p}`, "aria-current": p === page ? "page" : undefined, children: p }) }, p))), _jsx("li", { className: `page-item ${page === meta.totalPages ? "disabled" : ""}`, children: _jsx("button", { className: "page-link", onClick: () => setPage(p => p + 1), disabled: page === meta.totalPages, "aria-label": "Next page", children: "Next \u203A" }) })] }) })] }))] }))] }));
}
export default MyTickets;
