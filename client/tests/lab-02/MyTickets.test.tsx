import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyTickets } from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";

// ── Constants ─────────────────────────────────────────────────────────────

const MOCK_REQUESTER_A = { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" };
const MOCK_REQUESTER_B = { id: 2, name: "Michael Brown",     email: "michael@example.com" };

const makeTicket = (n: number, requesterId = 1) => ({
  id:               n,
  ticketNumber:     `TKT-2026-00000${n}`,
  requesterId,
  categoryId:       1,
  relatedSystemId:  1,
  summary:          `Ticket ${n} summary text here`,
  description:      `Description for ticket ${n}`,
  requestedPriority: "MEDIUM" as const,
  status:           "NEW",
  ticketDate:       new Date().toISOString(),
  createdAt:        new Date().toISOString(),
  updatedAt:        new Date().toISOString(),
  category:         { id: 1, name: "Hardware" },
  relatedSystem:    { id: 1, name: "Corporate Laptop" },
});

const EMPTY_RESPONSE = { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
const THREE_TICKETS   = {
  data: [makeTicket(1), makeTicket(2), makeTicket(3)],
  meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
};

// ── Helper ────────────────────────────────────────────────────────────────

function renderMyTickets(
  requesterId = MOCK_REQUESTER_A,
  onCreateTicket = vi.fn()
) {
  function Seeder() {
    const { selectRequester, currentRequester } = useRequester();
    if (!currentRequester) selectRequester(requesterId);
    return <MyTickets onCreateTicket={onCreateTicket} />;
  }
  return render(
    <RequesterProvider>
      <Seeder />
    </RequesterProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("MyTickets component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue([
      { id: 1, name: "Hardware" },
      { id: 2, name: "Software" },
    ]);
  });

  // ── Loading state ──────────────────────────────────────────────────────

  it("shows a loading state while tickets are being fetched", () => {
    vi.spyOn(api, "fetchTickets").mockReturnValue(new Promise(() => {}));
    renderMyTickets();
    expect(screen.getByTestId("tickets-loading")).toBeInTheDocument();
  });

  // ── Populated state ────────────────────────────────────────────────────

  it("renders the ticket list when tickets are returned", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(THREE_TICKETS);
    renderMyTickets();
    await waitFor(() => {
      expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
    });
    expect(screen.getByTestId("ticket-row-TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-row-TKT-2026-000002")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-row-TKT-2026-000003")).toBeInTheDocument();
  });

  it("shows ticket summary in the table", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(THREE_TICKETS);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-table")).toBeInTheDocument());
    expect(screen.getAllByText("Ticket 1 summary text here").length).toBeGreaterThan(0);
  });

  // ── Empty state ────────────────────────────────────────────────────────

  it("shows the empty state when the requester has no tickets", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets();
    await waitFor(() => {
      expect(screen.getByTestId("tickets-empty")).toBeInTheDocument();
    });
  });

  it("empty state contains a Create Ticket button", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-empty")).toBeInTheDocument());
    expect(screen.getByText(/create your first ticket/i)).toBeInTheDocument();
  });

  // ── No-results state ───────────────────────────────────────────────────

  it("shows the no-results state when filters return nothing", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets();

    // Wait for initial load, then type in search to trigger filters
    await waitFor(() => expect(screen.getByTestId("tickets-empty")).toBeInTheDocument());

    // Type a search term — now fetchTickets will be called again with a search param
    // The mock still returns empty, but the component detects filters are active
    await userEvent.type(screen.getByTestId("search-input"), "nonexistent");

    await waitFor(() => {
      expect(screen.getByTestId("tickets-no-results")).toBeInTheDocument();
    });
  });

  it("no-results state has a Clear Filters button", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-empty")).toBeInTheDocument());
    await userEvent.type(screen.getByTestId("search-input"), "xyz");
    await waitFor(() => expect(screen.getByTestId("tickets-no-results")).toBeInTheDocument());
    // Clear Filters button should be present inside no-results area
    expect(screen.getAllByRole("button", { name: /clear filters/i }).length).toBeGreaterThan(0);
  });

  // ── Error state ────────────────────────────────────────────────────────

  it("shows an error state when the API call fails", async () => {
    vi.spyOn(api, "fetchTickets").mockRejectedValue(new Error("Network error"));
    renderMyTickets();
    await waitFor(() => {
      expect(screen.getByTestId("tickets-error")).toBeInTheDocument();
    });
  });

  it("error state contains a Retry button", async () => {
    vi.spyOn(api, "fetchTickets").mockRejectedValue(new Error("Network error"));
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  // ── Filter controls ────────────────────────────────────────────────────

  it("renders search, category, priority, and status filter controls", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(THREE_TICKETS);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-table")).toBeInTheDocument());
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("filter-category")).toBeInTheDocument();
    expect(screen.getByTestId("filter-priority")).toBeInTheDocument();
    expect(screen.getByTestId("filter-status")).toBeInTheDocument();
  });

  it("Clear Filters button resets search and filters", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("search-input")).toBeInTheDocument());

    await userEvent.type(screen.getByTestId("search-input"), "something");
    expect(screen.getByTestId("search-input")).toHaveValue("something");

    await userEvent.click(screen.getByTestId("clear-filters-btn"));
    expect(screen.getByTestId("search-input")).toHaveValue("");
  });

  // ── Create Ticket nav ──────────────────────────────────────────────────

  it("calls onCreateTicket when + Create Ticket button is clicked", async () => {
    const onCreateTicket = vi.fn();
    vi.spyOn(api, "fetchTickets").mockResolvedValue(EMPTY_RESPONSE);
    renderMyTickets(MOCK_REQUESTER_A, onCreateTicket);
    await waitFor(() => expect(screen.getByTestId("create-ticket-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("create-ticket-btn"));
    expect(onCreateTicket).toHaveBeenCalledOnce();
  });

  // ── Ownership reload ───────────────────────────────────────────────────

  it("reloads tickets when the selected requester changes", async () => {
    const spy = vi.spyOn(api, "fetchTickets").mockResolvedValue(THREE_TICKETS);

    // Render with Requester A
    const { unmount } = renderMyTickets(MOCK_REQUESTER_A);
    await waitFor(() => expect(screen.getByTestId("tickets-table")).toBeInTheDocument());

    const callsWithA = spy.mock.calls.filter(
      c => c[0].requesterId === MOCK_REQUESTER_A.id
    ).length;
    expect(callsWithA).toBeGreaterThan(0);

    unmount();

    // Render with Requester B — a fresh component for a different requester
    spy.mockResolvedValue({
      data: [makeTicket(10, MOCK_REQUESTER_B.id)],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    renderMyTickets(MOCK_REQUESTER_B);
    await waitFor(() => expect(screen.getByTestId("tickets-table")).toBeInTheDocument());

    const callsWithB = spy.mock.calls.filter(
      c => c[0].requesterId === MOCK_REQUESTER_B.id
    ).length;
    expect(callsWithB).toBeGreaterThan(0);
  });

  // ── Pagination ─────────────────────────────────────────────────────────

  it("shows pagination when there are multiple pages", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) => makeTicket(i + 1)),
      meta: { page: 1, pageSize: 10, total: 25, totalPages: 3 },
    });
    renderMyTickets();
    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });
  });

  it("does not show pagination when there is only one page", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(THREE_TICKETS);
    renderMyTickets();
    await waitFor(() => expect(screen.getByTestId("tickets-table")).toBeInTheDocument());
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });
});
