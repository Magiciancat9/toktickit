import { useEffect, useState, useCallback } from "react";
import {
  fetchTickets,
  fetchCategories,
  Category,
  Ticket,
  TicketListMeta,
  Priority,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

// ── Types ────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";
type ListState = "loading" | "loaded" | "empty" | "no-results" | "error";

interface MyTicketsProps {
  onCreateTicket: () => void;
  onOpenTicket:   (ticketNumber: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PRIORITY_BADGE: Record<string, string> = {
  LOW:    "bg-secondary",
  MEDIUM: "bg-warning text-dark",
  HIGH:   "bg-danger",
};
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-success",
};

// ── Component ────────────────────────────────────────────────────────────

export function MyTickets({ onCreateTicket, onOpenTicket }: MyTicketsProps) {
  const { currentRequester } = useRequester();

  // Filter / sort / pagination state
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [status,   setStatus]   = useState("");
  const [sort,     setSort]     = useState<SortField>("createdAt");
  const [order,    setOrder]    = useState<SortOrder>("desc");
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 10;

  // Data state
  const [listState,  setListState]  = useState<ListState>("loading");
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [meta,       setMeta]       = useState<TicketListMeta | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories for filter dropdown
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Load tickets whenever filters/requester change
  const loadTickets = useCallback(async () => {
    if (!currentRequester) return;
    setListState("loading");
    setErrorMsg(null);
    try {
      const result = await fetchTickets({
        requesterId: currentRequester.id,
        search:   search   || undefined,
        category: category || undefined,
        priority: (priority as Priority) || undefined,
        status:   status   || undefined,
        sort, order, page, pageSize: PAGE_SIZE,
      });
      setTickets(result.data);
      setMeta(result.meta);
      if (result.data.length === 0) {
        const hasFilters = search || category || priority || status;
        setListState(hasFilters ? "no-results" : "empty");
      } else {
        setListState("loaded");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to load tickets.");
      setListState("error");
    }
  }, [currentRequester, search, category, priority, status, sort, order, page]);

  useEffect(() => { void loadTickets(); }, [loadTickets]);

  function toggleSort(field: SortField) {
    if (sort === field) {
      setOrder(o => o === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch(""); setCategory(""); setPriority(""); setStatus("");
    setPage(1);
  }

  // ── Sort indicator ───────────────────────────────────────────────────

  function SortIcon({ field }: { field: SortField }) {
    if (sort !== field) return <span style={{ opacity: 0.3 }}> ↕</span>;
    return <span>{order === "asc" ? " ↑" : " ↓"}</span>;
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div data-testid="my-tickets-screen">
      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0" style={{ color: "#1A2E22" }}>My Tickets</h1>
          <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
            View and track all of your support requests.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={clearFilters}
            data-testid="clear-filters-btn"
          >
            ⟳ Clear Filters
          </button>
          <button
            className="btn text-white btn-sm fw-semibold"
            style={{ backgroundColor: "#006B3C" }}
            onClick={onCreateTicket}
            data-testid="create-ticket-btn"
          >
            + Create Ticket
          </button>
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div className="card shadow-sm border-0 mb-3 p-3">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search by ticket number or summary…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              data-testid="search-input"
              aria-label="Search tickets"
            />
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              data-testid="filter-category"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={priority}
              onChange={e => { setPriority(e.target.value as Priority | ""); setPage(1); }}
              data-testid="filter-priority"
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              data-testid="filter-status"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Loading state ── */}
      {listState === "loading" && (
        <div className="text-center py-5" data-testid="tickets-loading">
          <div className="spinner-border" style={{ color: "#006B3C" }} role="status">
            <span className="visually-hidden">Loading tickets…</span>
          </div>
          <p className="mt-2 text-muted">Loading tickets…</p>
        </div>
      )}

      {/* ── Error state ── */}
      {listState === "error" && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center"
          data-testid="tickets-error">
          <span>{errorMsg ?? "Unable to load tickets. Please try again."}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadTickets}>
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state (no tickets at all) ── */}
      {listState === "empty" && (
        <div className="text-center py-5" data-testid="tickets-empty">
          <p className="text-muted mb-3" style={{ fontSize: "1rem" }}>
            You have no tickets yet.
          </p>
          <button
            className="btn text-white"
            style={{ backgroundColor: "#006B3C" }}
            onClick={onCreateTicket}
          >
            + Create your first ticket
          </button>
        </div>
      )}

      {/* ── No-results state (filters returned nothing) ── */}
      {listState === "no-results" && (
        <div className="text-center py-5" data-testid="tickets-no-results">
          <p className="text-muted mb-3">No tickets match your search or filters.</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* ── Populated table (desktop) / cards (mobile) ── */}
      {listState === "loaded" && (
        <>
          {/* Desktop table */}
          <div className="d-none d-md-block" data-testid="tickets-table">
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead style={{ backgroundColor: "#F5F7F6" }}>
                    <tr>
                      <th scope="col">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-semibold"
                          style={{ color: "#1A2E22" }}
                          onClick={() => toggleSort("createdAt")}
                          aria-label="Sort by created date"
                        >
                          Ticket No. / Created <SortIcon field="createdAt" />
                        </button>
                      </th>
                      <th scope="col" style={{ color: "#1A2E22" }}>Summary</th>
                      <th scope="col" style={{ color: "#1A2E22" }}>Category</th>
                      <th scope="col" style={{ color: "#1A2E22" }}>Priority</th>
                      <th scope="col" style={{ color: "#1A2E22" }}>Status</th>
                      <th scope="col">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-semibold"
                          style={{ color: "#1A2E22" }}
                          onClick={() => toggleSort("updatedAt")}
                          aria-label="Sort by last updated"
                        >
                          Last Updated <SortIcon field="updatedAt" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} data-testid={`ticket-row-${t.ticketNumber}`}>
                        <td>
                          <button
                            className="btn btn-link p-0 fw-semibold text-decoration-none"
                            style={{ color: "#006B3C" }}
                            onClick={() => onOpenTicket(t.ticketNumber)}
                            data-testid={`ticket-link-${t.ticketNumber}`}
                          >
                            {t.ticketNumber}
                          </button>
                          <small className="d-block text-muted">{formatDate(t.createdAt)}</small>
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <span style={{
                            display: "block", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {t.summary}
                          </span>
                        </td>
                        <td>{(t.category as { name: string } | undefined)?.name ?? "—"}</td>
                        <td>
                          <span className={`badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`}>
                            {t.requestedPriority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td><small className="text-muted">{formatDate(t.updatedAt)}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="d-md-none" data-testid="tickets-cards">
            {tickets.map(t => (
              <div
                key={t.id}
                className="card shadow-sm border-0 mb-2 p-3"
                data-testid={`ticket-card-${t.ticketNumber}`}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <button
                    className="btn btn-link p-0 fw-semibold text-decoration-none"
                    style={{ color: "#006B3C" }}
                    onClick={() => onOpenTicket(t.ticketNumber)}
                    data-testid={`ticket-card-link-${t.ticketNumber}`}
                  >
                    {t.ticketNumber}
                  </button>
                  <span className={`badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`}>
                    {t.status}
                  </span>
                </div>
                <p className="mb-1 mt-1" style={{ fontSize: "0.9rem" }}>{t.summary}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <small className="text-muted">
                    {(t.category as { name: string } | undefined)?.name}
                  </small>
                  <span className={`badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`}>
                    {t.requestedPriority}
                  </span>
                  <small className="text-muted ms-auto">{formatDate(t.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {meta && meta.totalPages > 1 && (
            <div
              className="d-flex justify-content-between align-items-center mt-3"
              data-testid="pagination"
            >
              <small className="text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, meta.total)} of {meta.total} tickets
              </small>
              <nav aria-label="Ticket list pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      ‹ Prev
                    </button>
                  </li>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(p)}
                        aria-label={`Go to page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === meta.totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === meta.totalPages}
                      aria-label="Next page"
                    >
                      Next ›
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyTickets;
