import React, { useState, useEffect } from "react";
import { fetchCategories, fetchStaffTickets, StaffTicket } from "../api";

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

interface StaffTicketQueueMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface StaffTicketQueueProps {
  onOpenTicket: (ticketNumber: string) => void;
}

const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onOpenTicket }) => {
  // State for filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [reqPriority, setReqPriority] = useState("");
  const [itPriority, setItPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignment, setAssignment] = useState("all");
  const [sort, setSort] = useState("itPriority");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);

  // State for data
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [meta, setMeta] = useState<StaffTicketQueueMeta | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // State for UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for filter dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
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
        reqPriority: reqPriority as "LOW" | "MEDIUM" | "HIGH" | undefined,
        itPriority: itPriority as "LOW" | "MEDIUM" | "HIGH" | undefined,
        status: status || undefined,
        assignment: assignment as "all" | "unassigned" | "assigned-to-me" | "assigned-to-others",
        sort: sort as "createdAt" | "updatedAt" | "itPriority",
        order: order,
        page,
        pageSize,
      });
      
      setTickets(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(err instanceof Error ? err.message : "Unable to load tickets. Please try again.");
    } finally {
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

  const handleSortToggle = (field: "createdAt" | "updatedAt" | "itPriority") => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const PriorityBadge: React.FC<{ priority: "LOW" | "MEDIUM" | "HIGH" }> = ({ priority }) => {
    const colors = PRIORITY_BADGE[priority];
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        {priority}
      </span>
    );
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = STATUS_BADGE[status as keyof typeof STATUS_BADGE] || {
      bg: COLORS.gray,
      text: COLORS.white,
    };
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div style={{ padding: "24px", backgroundColor: COLORS.pageBackground, minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: 600, color: COLORS.darkCharcoal }}>
          Ticket Queue
        </h2>

        {/* Search and Filters */}
        <div
          style={{
            backgroundColor: COLORS.white,
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: `1px solid ${COLORS.lightGrayGreen}`,
          }}
        >
          {/* Search Bar */}
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Search by ticket number or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "16px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                outline: "none",
              }}
            />
          </div>

          {/* Filter Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                cursor: "pointer",
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Requested Priority Filter */}
            <select
              value={reqPriority}
              onChange={(e) => {
                setReqPriority(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                cursor: "pointer",
              }}
            >
              <option value="">Req. Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* IT Priority Filter */}
            <select
              value={itPriority}
              onChange={(e) => {
                setItPriority(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                cursor: "pointer",
              }}
            >
              <option value="">IT Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                cursor: "pointer",
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={assignment}
              onChange={(e) => {
                setAssignment(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                borderRadius: "4px",
                backgroundColor: COLORS.white,
                color: COLORS.darkCharcoal,
                cursor: "pointer",
              }}
            >
              <option value="all">Assignment: All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned-to-me">Assigned to Me</option>
              <option value="assigned-to-others">Assigned to Others</option>
            </select>
          </div>

          {/* Sort Controls and Clear Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: COLORS.darkCharcoal, fontWeight: 500 }}>Sort by:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: "14px",
                  border: `1px solid ${COLORS.lightGrayGreen}`,
                  borderRadius: "4px",
                  backgroundColor: COLORS.white,
                  color: COLORS.darkCharcoal,
                  cursor: "pointer",
                }}
              >
                <option value="itPriority">IT Priority</option>
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Last Updated</option>
              </select>
              <button
                onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                style={{
                  padding: "6px 12px",
                  fontSize: "14px",
                  border: `2px solid ${COLORS.secondaryGreen}`,
                  borderRadius: "4px",
                  backgroundColor: COLORS.white,
                  color: COLORS.secondaryGreen,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {order === "asc" ? "↑ Ascending" : "↓ Descending"}
              </button>
            </div>
            <button
              onClick={handleClearFilters}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "transparent",
                color: COLORS.secondaryGreen,
                cursor: "pointer",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              backgroundColor: COLORS.white,
              padding: "60px 20px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${COLORS.lightGrayGreen}`,
            }}
          >
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: `4px solid ${COLORS.lightGrayGreen}`,
                borderTop: `4px solid ${COLORS.primaryGreen}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: "16px", fontSize: "16px", color: COLORS.darkCharcoal }}>Loading tickets...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              backgroundColor: COLORS.white,
              padding: "40px 20px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${COLORS.darkRed}`,
            }}
          >
            <p style={{ fontSize: "18px", color: COLORS.darkRed, marginBottom: "16px" }}>{error}</p>
            <button
              onClick={fetchTickets}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                fontWeight: 600,
                color: COLORS.white,
                backgroundColor: COLORS.primaryGreen,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State (No tickets exist) */}
        {!loading && !error && tickets.length === 0 && !search && !category && !reqPriority && !itPriority && !status && assignment === "all" && (
          <div
            style={{
              backgroundColor: COLORS.white,
              padding: "60px 20px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${COLORS.lightGrayGreen}`,
            }}
          >
            <p style={{ fontSize: "18px", color: COLORS.darkCharcoal, marginBottom: "8px" }}>
              No tickets have been created yet.
            </p>
            <p style={{ fontSize: "14px", color: COLORS.gray }}>
              Tickets will appear here once Requesters start creating them.
            </p>
          </div>
        )}

        {/* No Results State (Filters return nothing) */}
        {!loading && !error && tickets.length === 0 && (search || category || reqPriority || itPriority || status || assignment !== "all") && (
          <div
            style={{
              backgroundColor: COLORS.white,
              padding: "60px 20px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${COLORS.lightGrayGreen}`,
            }}
          >
            <p style={{ fontSize: "18px", color: COLORS.darkCharcoal, marginBottom: "16px" }}>
              No tickets match your search and filters.
            </p>
            <button
              onClick={handleClearFilters}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                fontWeight: 600,
                color: COLORS.white,
                backgroundColor: COLORS.primaryGreen,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Desktop Table View (≥ 992px) */}
        {!loading && !error && tickets.length > 0 && (
          <>
            {/* Desktop Table */}
            <div
              style={{
                backgroundColor: COLORS.white,
                borderRadius: "8px",
                border: `1px solid ${COLORS.lightGrayGreen}`,
                overflow: "hidden",
                display: "none",
              }}
              className="desktop-table"
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.lightGrayGreen }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Ticket No.
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Created
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Summary
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Category
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Req. Priority
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      IT Priority
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Status
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Owner
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Last Updated
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: COLORS.darkCharcoal }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.pageBackground,
                        borderBottom: `1px solid ${COLORS.lightGrayGreen}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.paleGreen;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? COLORS.white : COLORS.pageBackground;
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => onOpenTicket(ticket.ticketNumber)}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.primaryGreen,
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {ticket.ticketNumber}
                        </button>
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal, maxWidth: "300px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={ticket.summary}
                        >
                          {ticket.summary}
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }}>
                        {ticket.category?.name || "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <PriorityBadge priority={ticket.requestedPriority} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <PriorityBadge priority={ticket.itPriority} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }}>
                        {ticket.owner ? ticket.owner.name : <span style={{ color: COLORS.gray, fontStyle: "italic" }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.darkCharcoal }}>
                        {formatDate(ticket.updatedAt)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => onOpenTicket(ticket.ticketNumber)}
                          style={{
                            padding: "6px 16px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: COLORS.secondaryGreen,
                            backgroundColor: COLORS.white,
                            border: `2px solid ${COLORS.secondaryGreen}`,
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 992px) */}
            <div style={{ display: "none" }} className="mobile-cards">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    backgroundColor: COLORS.white,
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.lightGrayGreen}`,
                    marginBottom: "12px",
                  }}
                >
                  {/* Top row: Ticket Number and Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <button
                      onClick={() => onOpenTicket(ticket.ticketNumber)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: COLORS.primaryGreen,
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      {ticket.ticketNumber}
                    </button>
                    <StatusBadge status={ticket.status} />
                  </div>

                  {/* Summary (truncated to 2 lines) */}
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      color: COLORS.darkCharcoal,
                      lineHeight: "1.4",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {ticket.summary}
                  </p>

                  {/* Category and Priorities */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: COLORS.darkCharcoal,
                        backgroundColor: COLORS.pageBackground,
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {ticket.category?.name || "N/A"}
                    </span>
                    <span style={{ fontSize: "12px", color: COLORS.gray }}>Req:</span>
                    <PriorityBadge priority={ticket.requestedPriority} />
                    <span style={{ fontSize: "12px", color: COLORS.gray }}>IT:</span>
                    <PriorityBadge priority={ticket.itPriority} />
                  </div>

                  {/* Owner and Created Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: COLORS.darkCharcoal }}>
                      <strong>Owner:</strong>{" "}
                      {ticket.owner ? ticket.owner.name : <span style={{ color: COLORS.gray, fontStyle: "italic" }}>Unassigned</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: COLORS.gray }}>
                      Created: {formatDate(ticket.createdAt)}
                    </div>
                  </div>

                  {/* Open Button */}
                  <button
                    onClick={() => onOpenTicket(ticket.ticketNumber)}
                    style={{
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
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>

            {/* Responsive CSS */}
            <style>{`
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
            `}</style>
          </>
        )}

        {/* Pagination - Will show when tickets exist */}
        {!loading && !error && meta && meta.total > 0 && (
          <div
            style={{
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
            }}
          >
            <div style={{ fontSize: "14px", color: COLORS.darkCharcoal }}>
              Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} tickets
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: page === 1 ? COLORS.gray : COLORS.secondaryGreen,
                  backgroundColor: COLORS.white,
                  border: `2px solid ${page === 1 ? COLORS.lightGrayGreen : COLORS.secondaryGreen}`,
                  borderRadius: "4px",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "14px", color: COLORS.darkCharcoal }}>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === meta.totalPages}
                style={{
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: page === meta.totalPages ? COLORS.gray : COLORS.secondaryGreen,
                  backgroundColor: COLORS.white,
                  border: `2px solid ${page === meta.totalPages ? COLORS.lightGrayGreen : COLORS.secondaryGreen}`,
                  borderRadius: "4px",
                  cursor: page === meta.totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as 10 | 25 | 50);
                  setPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: "14px",
                  border: `1px solid ${COLORS.lightGrayGreen}`,
                  borderRadius: "4px",
                  backgroundColor: COLORS.white,
                  color: COLORS.darkCharcoal,
                  cursor: "pointer",
                  marginLeft: "8px",
                }}
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTicketQueue;
