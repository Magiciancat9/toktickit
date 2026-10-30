import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchCategories, fetchStaffTickets } from "../api";
// Zen Green Design System Colors
const COLORS = {
    primaryGreen: "#006B3C",
    secondaryGreen: "#0B7A46",
    paleGreen: "#EAF6EF",
    darkCharcoal: "#2C3E37",
    warmIvory: "#F9F9F7",
    lightGrayGreen: "#E0E6E3",
    pageBackground: "#F5F7F6",
    white: "#FFFFFF",
    darkRed: "#C41E3A",
    amber: "#F59E0B",
    blue: "#3B82F6",
    teal: "#14B8A6",
    purple: "#8B5CF6",
    gray: "#6B7280",
};
// Badge styles for Priority and Status
const PRIORITY_BADGE = {
    LOW: { bg: COLORS.blue, text: COLORS.white },
    MEDIUM: { bg: COLORS.amber, text: COLORS.white },
    HIGH: { bg: COLORS.darkRed, text: COLORS.white },
};
const STATUS_BADGE = {
    NEW: { bg: COLORS.primaryGreen, text: COLORS.white },
    OPEN: { bg: COLORS.blue, text: COLORS.white },
    IN_PROGRESS: { bg: COLORS.amber, text: COLORS.white },
    WAITING_FOR_REQUESTER: { bg: COLORS.purple, text: COLORS.white },
    RESOLVED: { bg: COLORS.teal, text: COLORS.white },
    CLOSED: { bg: COLORS.gray, text: COLORS.white },
    REOPENED: { bg: COLORS.secondaryGreen, text: COLORS.white },
    CANCELLED: { bg: COLORS.darkRed, text: COLORS.white },
};
const StaffTicketQueue = ({ onOpenTicket }) => {
    // State for filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [reqPriority, setReqPriority] = useState("");
    const [itPriority, setItPriority] = useState("");
    const [status, setStatus] = useState("");
    const [assignment, setAssignment] = useState("all");
    const [sort, setSort] = useState("itPriority");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // State for data
    const [tickets, setTickets] = useState([]);
    const [meta, setMeta] = useState(null);
    const [categories, setCategories] = useState([]);
    // State for UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Fetch categories for filter dropdown
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await fetchCategories();
                setCategories(cats);
            }
            catch (err) {
                console.error("Failed to load categories:", err);
                // Use fallback if API fails
                setCategories([
                    { id: 1, name: "Account and Access" },
                    { id: 2, name: "Hardware" },
                    { id: 3, name: "Software" },
                    { id: 4, name: "Network" },
                ]);
            }
        };
        loadCategories();
    }, []);
    // Fetch tickets when filters change
    useEffect(() => {
        fetchTickets();
    }, [search, category, reqPriority, itPriority, status, assignment, sort, order, page, pageSize]);
    const fetchTickets = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchStaffTickets({
                search: search || undefined,
                category: category || undefined,
                reqPriority: reqPriority,
                itPriority: itPriority,
                status: status || undefined,
                assignment: assignment,
                sort: sort,
                order: order,
                page,
                pageSize,
            });
            setTickets(response.data);
            setMeta(response.meta);
        }
        catch (err) {
            console.error("Failed to fetch tickets:", err);
            setError(err instanceof Error ? err.message : "Unable to load tickets. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleClearFilters = () => {
        setSearch("");
        setCategory("");
        setReqPriority("");
        setItPriority("");
        setStatus("");
        setAssignment("all");
        setPage(1);
    };
    const handleSortToggle = (field) => {
        if (sort === field) {
            setOrder(order === "asc" ? "desc" : "asc");
        }
        else {
            setSort(field);
            setOrder("desc");
        }
        setPage(1);
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const PriorityBadge = ({ priority }) => {
        const colors = PRIORITY_BADGE[priority];
        return (_jsx("span", { style: {
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: colors.text,
            }, children: priority }));
    };
    const StatusBadge = ({ status }) => {
        const colors = STATUS_BADGE[status] || {
            bg: COLORS.gray,
            text: COLORS.white,
        };
        return (_jsx("span", { style: {
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: colors.text,
            }, children: status.replace(/_/g, " ") }));
    };
    return (_jsx("div", { style: { padding: "24px", backgroundColor: COLORS.pageBackground, minHeight: "100vh" }, children: _jsxs("div", { style: { maxWidth: "1200px", margin: "0 auto" }, children: [_jsx("h2", { style: { margin: "0 0 24px 0", fontSize: "28px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Ticket Queue" }), _jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: `1px solid ${COLORS.lightGrayGreen}`,
                    }, children: [_jsx("div", { style: { marginBottom: "16px" }, children: _jsx("input", { type: "text", placeholder: "Search by ticket number or summary...", value: search, onChange: (e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }, style: {
                                    width: "100%",
                                    padding: "10px 12px",
                                    fontSize: "16px",
                                    border: `1px solid ${COLORS.lightGrayGreen}`,
                                    borderRadius: "4px",
                                    backgroundColor: COLORS.white,
                                    color: COLORS.darkCharcoal,
                                    outline: "none",
                                } }) }), _jsxs("div", { style: {
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "12px",
                                marginBottom: "12px",
                            }, children: [_jsxs("select", { value: category, onChange: (e) => {
                                        setCategory(e.target.value);
                                        setPage(1);
                                    }, style: {
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                    }, children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.name, children: cat.name }, cat.id)))] }), _jsxs("select", { value: reqPriority, onChange: (e) => {
                                        setReqPriority(e.target.value);
                                        setPage(1);
                                    }, style: {
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                    }, children: [_jsx("option", { value: "", children: "Req. Priority: All" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] }), _jsxs("select", { value: itPriority, onChange: (e) => {
                                        setItPriority(e.target.value);
                                        setPage(1);
                                    }, style: {
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                    }, children: [_jsx("option", { value: "", children: "IT Priority: All" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] }), _jsxs("select", { value: status, onChange: (e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }, style: {
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                    }, children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "NEW", children: "New" }), _jsx("option", { value: "OPEN", children: "Open" }), _jsx("option", { value: "IN_PROGRESS", children: "In Progress" }), _jsx("option", { value: "WAITING_FOR_REQUESTER", children: "Waiting for Requester" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" }), _jsx("option", { value: "REOPENED", children: "Reopened" }), _jsx("option", { value: "CANCELLED", children: "Cancelled" })] }), _jsxs("select", { value: assignment, onChange: (e) => {
                                        setAssignment(e.target.value);
                                        setPage(1);
                                    }, style: {
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                    }, children: [_jsx("option", { value: "all", children: "Assignment: All" }), _jsx("option", { value: "unassigned", children: "Unassigned" }), _jsx("option", { value: "assigned-to-me", children: "Assigned to Me" }), _jsx("option", { value: "assigned-to-others", children: "Assigned to Others" })] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }, children: [_jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "14px", color: COLORS.darkCharcoal, fontWeight: 500 }, children: "Sort by:" }), _jsxs("select", { value: sort, onChange: (e) => {
                                                setSort(e.target.value);
                                                setPage(1);
                                            }, style: {
                                                padding: "6px 10px",
                                                fontSize: "14px",
                                                border: `1px solid ${COLORS.lightGrayGreen}`,
                                                borderRadius: "4px",
                                                backgroundColor: COLORS.white,
                                                color: COLORS.darkCharcoal,
                                                cursor: "pointer",
                                            }, children: [_jsx("option", { value: "itPriority", children: "IT Priority" }), _jsx("option", { value: "createdAt", children: "Created Date" }), _jsx("option", { value: "updatedAt", children: "Last Updated" })] }), _jsx("button", { onClick: () => setOrder(order === "asc" ? "desc" : "asc"), style: {
                                                padding: "6px 12px",
                                                fontSize: "14px",
                                                border: `2px solid ${COLORS.secondaryGreen}`,
                                                borderRadius: "4px",
                                                backgroundColor: COLORS.white,
                                                color: COLORS.secondaryGreen,
                                                cursor: "pointer",
                                                fontWeight: 500,
                                            }, children: order === "asc" ? "↑ Ascending" : "↓ Descending" })] }), _jsx("button", { onClick: handleClearFilters, style: {
                                        padding: "6px 12px",
                                        fontSize: "14px",
                                        border: "none",
                                        borderRadius: "4px",
                                        backgroundColor: "transparent",
                                        color: COLORS.secondaryGreen,
                                        cursor: "pointer",
                                        fontWeight: 500,
                                        textDecoration: "underline",
                                    }, children: "Clear Filters" })] })] }), loading && (_jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "60px 20px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: `1px solid ${COLORS.lightGrayGreen}`,
                    }, children: [_jsx("div", { style: {
                                display: "inline-block",
                                width: "40px",
                                height: "40px",
                                border: `4px solid ${COLORS.lightGrayGreen}`,
                                borderTop: `4px solid ${COLORS.primaryGreen}`,
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            } }), _jsx("p", { style: { marginTop: "16px", fontSize: "16px", color: COLORS.darkCharcoal }, children: "Loading tickets..." }), _jsx("style", { children: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            ` })] })), !loading && error && (_jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "40px 20px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: `1px solid ${COLORS.darkRed}`,
                    }, children: [_jsx("p", { style: { fontSize: "18px", color: COLORS.darkRed, marginBottom: "16px" }, children: error }), _jsx("button", { onClick: fetchTickets, style: {
                                padding: "10px 20px",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: COLORS.white,
                                backgroundColor: COLORS.primaryGreen,
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }, children: "Try Again" })] })), !loading && !error && tickets.length === 0 && !search && !category && !reqPriority && !itPriority && !status && assignment === "all" && (_jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "60px 20px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: `1px solid ${COLORS.lightGrayGreen}`,
                    }, children: [_jsx("p", { style: { fontSize: "18px", color: COLORS.darkCharcoal, marginBottom: "8px" }, children: "No tickets have been created yet." }), _jsx("p", { style: { fontSize: "14px", color: COLORS.gray }, children: "Tickets will appear here once Requesters start creating them." })] })), !loading && !error && tickets.length === 0 && (search || category || reqPriority || itPriority || status || assignment !== "all") && (_jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "60px 20px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: `1px solid ${COLORS.lightGrayGreen}`,
                    }, children: [_jsx("p", { style: { fontSize: "18px", color: COLORS.darkCharcoal, marginBottom: "16px" }, children: "No tickets match your search and filters." }), _jsx("button", { onClick: handleClearFilters, style: {
                                padding: "10px 20px",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: COLORS.white,
                                backgroundColor: COLORS.primaryGreen,
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }, children: "Clear Filters" })] })), !loading && !error && tickets.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                backgroundColor: COLORS.white,
                                borderRadius: "8px",
                                border: `1px solid ${COLORS.lightGrayGreen}`,
                                overflow: "hidden",
                                display: "none",
                            }, className: "desktop-table", children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: COLORS.lightGrayGreen }, children: [_jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Ticket No." }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Created" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Summary" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Category" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Req. Priority" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "IT Priority" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Status" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Owner" }), _jsx("th", { style: { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Last Updated" }), _jsx("th", { style: { padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }, children: "Action" })] }) }), _jsx("tbody", { children: tickets.map((ticket, index) => (_jsxs("tr", { style: {
                                                backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.pageBackground,
                                                borderBottom: `1px solid ${COLORS.lightGrayGreen}`,
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.backgroundColor = COLORS.paleGreen;
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? COLORS.white : COLORS.pageBackground;
                                            }, children: [_jsx("td", { style: { padding: "12px" }, children: _jsx("button", { onClick: () => onOpenTicket(ticket.ticketNumber), style: {
                                                            background: "none",
                                                            border: "none",
                                                            color: COLORS.primaryGreen,
                                                            textDecoration: "none",
                                                            fontWeight: 600,
                                                            fontSize: "14px",
                                                            cursor: "pointer",
                                                            padding: 0,
                                                        }, children: ticket.ticketNumber }) }), _jsx("td", { style: { padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }, children: formatDate(ticket.createdAt) }), _jsx("td", { style: { padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal, maxWidth: "300px" }, children: _jsx("div", { style: {
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }, title: ticket.summary, children: ticket.summary }) }), _jsx("td", { style: { padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }, children: ticket.category?.name || "N/A" }), _jsx("td", { style: { padding: "12px" }, children: _jsx(PriorityBadge, { priority: ticket.requestedPriority }) }), _jsx("td", { style: { padding: "12px" }, children: _jsx(PriorityBadge, { priority: ticket.itPriority }) }), _jsx("td", { style: { padding: "12px" }, children: _jsx(StatusBadge, { status: ticket.status }) }), _jsx("td", { style: { padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }, children: ticket.owner ? ticket.owner.name : _jsx("span", { style: { color: COLORS.gray, fontStyle: "italic" }, children: "Unassigned" }) }), _jsx("td", { style: { padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }, children: formatDate(ticket.updatedAt) }), _jsx("td", { style: { padding: "12px", textAlign: "center" }, children: _jsx("button", { onClick: () => onOpenTicket(ticket.ticketNumber), style: {
                                                            padding: "6px 16px",
                                                            fontSize: "14px",
                                                            fontWeight: 600,
                                                            color: COLORS.secondaryGreen,
                                                            backgroundColor: COLORS.white,
                                                            border: `2px solid ${COLORS.secondaryGreen}`,
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                        }, children: "Open" }) })] }, ticket.id))) })] }) }), _jsx("div", { style: { display: "none" }, className: "mobile-cards", children: tickets.map((ticket) => (_jsxs("div", { style: {
                                    backgroundColor: COLORS.white,
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${COLORS.lightGrayGreen}`,
                                    marginBottom: "12px",
                                }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsx("button", { onClick: () => onOpenTicket(ticket.ticketNumber), style: {
                                                    background: "none",
                                                    border: "none",
                                                    padding: 0,
                                                    color: COLORS.primaryGreen,
                                                    textDecoration: "none",
                                                    fontWeight: 600,
                                                    fontSize: "16px",
                                                    cursor: "pointer",
                                                }, children: ticket.ticketNumber }), _jsx(StatusBadge, { status: ticket.status })] }), _jsx("p", { style: {
                                            margin: "0 0 12px 0",
                                            fontSize: "14px",
                                            color: COLORS.darkCharcoal,
                                            lineHeight: "1.4",
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                        }, children: ticket.summary }), _jsxs("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }, children: [_jsx("span", { style: {
                                                    fontSize: "12px",
                                                    color: COLORS.darkCharcoal,
                                                    backgroundColor: COLORS.pageBackground,
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                }, children: ticket.category?.name || "N/A" }), _jsx("span", { style: { fontSize: "12px", color: COLORS.gray }, children: "Req:" }), _jsx(PriorityBadge, { priority: ticket.requestedPriority }), _jsx("span", { style: { fontSize: "12px", color: COLORS.gray }, children: "IT:" }), _jsx(PriorityBadge, { priority: ticket.itPriority })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsxs("div", { style: { fontSize: "12px", color: COLORS.darkCharcoal }, children: [_jsx("strong", { children: "Owner:" }), " ", ticket.owner ? ticket.owner.name : _jsx("span", { style: { color: COLORS.gray, fontStyle: "italic" }, children: "Unassigned" })] }), _jsxs("div", { style: { fontSize: "12px", color: COLORS.gray }, children: ["Created: ", formatDate(ticket.createdAt)] })] }), _jsx("button", { onClick: () => onOpenTicket(ticket.ticketNumber), style: {
                                            display: "block",
                                            width: "100%",
                                            padding: "10px",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: COLORS.secondaryGreen,
                                            backgroundColor: COLORS.white,
                                            border: `2px solid ${COLORS.secondaryGreen}`,
                                            borderRadius: "4px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }, children: "Open" })] }, ticket.id))) }), _jsx("style", { children: `
              @media (min-width: 992px) {
                .desktop-table {
                  display: block !important;
                }
                .mobile-cards {
                  display: none !important;
                }
              }
              @media (max-width: 991px) {
                .desktop-table {
                  display: none !important;
                }
                .mobile-cards {
                  display: block !important;
                }
              }
            ` })] })), !loading && !error && meta && meta.total > 0 && (_jsxs("div", { style: {
                        backgroundColor: COLORS.white,
                        padding: "16px 20px",
                        borderRadius: "8px",
                        marginTop: "20px",
                        border: `1px solid ${COLORS.lightGrayGreen}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                    }, children: [_jsxs("div", { style: { fontSize: "14px", color: COLORS.darkCharcoal }, children: ["Showing ", (meta.page - 1) * meta.pageSize + 1, " to ", Math.min(meta.page * meta.pageSize, meta.total), " of ", meta.total, " tickets"] }), _jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx("button", { onClick: () => setPage(page - 1), disabled: page === 1, style: {
                                        padding: "6px 12px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: page === 1 ? COLORS.gray : COLORS.secondaryGreen,
                                        backgroundColor: COLORS.white,
                                        border: `2px solid ${page === 1 ? COLORS.lightGrayGreen : COLORS.secondaryGreen}`,
                                        borderRadius: "4px",
                                        cursor: page === 1 ? "not-allowed" : "pointer",
                                    }, children: "Previous" }), _jsxs("span", { style: { fontSize: "14px", color: COLORS.darkCharcoal }, children: ["Page ", meta.page, " of ", meta.totalPages] }), _jsx("button", { onClick: () => setPage(page + 1), disabled: page === meta.totalPages, style: {
                                        padding: "6px 12px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: page === meta.totalPages ? COLORS.gray : COLORS.secondaryGreen,
                                        backgroundColor: COLORS.white,
                                        border: `2px solid ${page === meta.totalPages ? COLORS.lightGrayGreen : COLORS.secondaryGreen}`,
                                        borderRadius: "4px",
                                        cursor: page === meta.totalPages ? "not-allowed" : "pointer",
                                    }, children: "Next" }), _jsxs("select", { value: pageSize, onChange: (e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }, style: {
                                        padding: "6px 10px",
                                        fontSize: "14px",
                                        border: `1px solid ${COLORS.lightGrayGreen}`,
                                        borderRadius: "4px",
                                        backgroundColor: COLORS.white,
                                        color: COLORS.darkCharcoal,
                                        cursor: "pointer",
                                        marginLeft: "8px",
                                    }, children: [_jsx("option", { value: "10", children: "10 per page" }), _jsx("option", { value: "25", children: "25 per page" }), _jsx("option", { value: "50", children: "50 per page" })] })] })] }))] }) }));
};
export default StaffTicketQueue;
