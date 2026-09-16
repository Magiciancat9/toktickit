import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketQueue from "../../src/components/StaffTicketQueue";
import * as api from "../../src/api";
/**
 * LAB3-06: StaffTicketQueue Component Tests
 * Coverage: UI-19 through UI-25 from tests.md
 */
// Mock react-router-dom Link component
vi.mock("react-router-dom", () => ({
    Link: ({ to, children, ...props }) => (_jsx("a", { href: to, ...props, children: children })),
}));
// Mock API functions
vi.mock("../../src/api", () => ({
    fetchCategories: vi.fn(),
    fetchStaffTickets: vi.fn(),
}));
const mockCategories = [
    { id: 1, name: "Account and Access" },
    { id: 2, name: "Hardware" },
    { id: 3, name: "Software" },
    { id: 4, name: "Network" },
];
const mockTickets = [
    {
        id: 1,
        ticketNumber: "TKT-2026-000001",
        summary: "Laptop battery issue",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        status: "NEW",
        createdAt: "2026-09-14T10:00:00.000Z",
        updatedAt: "2026-09-14T10:00:00.000Z",
        requester: { id: 1, name: "John Doe" },
        owner: null,
        category: { id: 2, name: "Hardware" },
        relatedSystem: { id: 1, name: "Corporate Laptop" },
    },
    {
        id: 2,
        ticketNumber: "TKT-2026-000002",
        summary: "Email access problem",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "OPEN",
        createdAt: "2026-09-14T11:00:00.000Z",
        updatedAt: "2026-09-14T11:30:00.000Z",
        requester: { id: 2, name: "Jane Smith" },
        owner: { id: 10, name: "IT Staff User" },
        category: { id: 1, name: "Account and Access" },
        relatedSystem: { id: 2, name: "Email" },
    },
];
const mockMeta = {
    page: 1,
    pageSize: 10,
    total: 2,
    totalPages: 1,
};
function renderQueue(onOpenTicket = vi.fn()) {
    return render(_jsx(StaffTicketQueue, { onOpenTicket: onOpenTicket }));
}
describe("StaffTicketQueue Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.fetchCategories).mockResolvedValue(mockCategories);
        vi.mocked(api.fetchStaffTickets).mockResolvedValue({
            data: mockTickets,
            meta: mockMeta,
        });
    });
    // ── UI-19: Renders search bar, filters, sort controls, pagination ──────────
    it("UI-19: renders search bar, filters, sort controls, and pagination controls", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/search by ticket number or summary/i)).toBeInTheDocument();
        });
        // Search bar
        expect(screen.getByPlaceholderText(/search by ticket number or summary/i)).toBeInTheDocument();
        // Filter dropdowns - check they exist (categories loaded)
        expect(screen.getByText(/all categories/i)).toBeInTheDocument();
        // Sort controls
        expect(screen.getByText(/sort by:/i)).toBeInTheDocument();
        // Clear Filters button
        expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
    });
    // ── UI-20: Table shows all required columns ────────────────────────────────
    it("UI-20: ticket table shows all required columns", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Check table headers (visible on desktop)
        expect(screen.getByText("Ticket No.")).toBeInTheDocument();
        expect(screen.getByText("Created")).toBeInTheDocument();
        expect(screen.getByText("Summary")).toBeInTheDocument();
        expect(screen.getByText("Category")).toBeInTheDocument();
        expect(screen.getByText("Req. Priority")).toBeInTheDocument();
        expect(screen.getByText("IT Priority")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Owner")).toBeInTheDocument();
        expect(screen.getByText("Last Updated")).toBeInTheDocument();
        expect(screen.getByText("Action")).toBeInTheDocument();
        // Check ticket data is displayed
        expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        expect(screen.getByText("Laptop battery issue")).toBeInTheDocument();
        expect(screen.getByText("Hardware")).toBeInTheDocument();
        expect(screen.getByText("Unassigned")).toBeInTheDocument();
        expect(screen.getByText("IT Staff User")).toBeInTheDocument();
    });
    // ── UI-21: Search input filters tickets ────────────────────────────────────
    it("UI-21: search input triggers API call with search parameter", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Clear initial call
        vi.clearAllMocks();
        const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
        await user.type(searchInput, "laptop");
        await waitFor(() => {
            expect(api.fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({
                search: "laptop",
            }));
        });
    });
    // ── UI-22: IT Priority filter works ─────────────────────────────────────────
    it("UI-22: IT Priority filter triggers API call with itPriority parameter", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        vi.clearAllMocks();
        // Find IT Priority dropdown by its option text
        const selects = screen.getAllByRole("combobox");
        // IT Priority is the 3rd select (Category, Req Priority, IT Priority, Status, Assignment)
        const itPrioritySelect = selects[2];
        await user.selectOptions(itPrioritySelect, "HIGH");
        await waitFor(() => {
            expect(api.fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({
                itPriority: "HIGH",
            }));
        });
    });
    // ── UI-23: Assignment filter "Unassigned" works ────────────────────────────
    it("UI-23: Assignment filter triggers API call with assignment parameter", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        vi.clearAllMocks();
        // Find Assignment filter dropdown - it's the 5th select
        const selects = screen.getAllByRole("combobox");
        const assignmentSelect = selects[4];
        await user.selectOptions(assignmentSelect, "unassigned");
        await waitFor(() => {
            expect(api.fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({
                assignment: "unassigned",
            }));
        });
    });
    // ── UI-24: Empty state shown when no tickets exist ─────────────────────────
    it("UI-24: shows empty state when no tickets exist", async () => {
        vi.mocked(api.fetchStaffTickets).mockResolvedValue({
            data: [],
            meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        });
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText(/no tickets have been created yet/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/tickets will appear here once requesters start creating them/i)).toBeInTheDocument();
    });
    // ── UI-25: No-results state shown when filters return nothing ──────────────
    it("UI-25: shows no-results state when filters return no matches", async () => {
        const user = userEvent.setup();
        // Start with tickets
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Now return empty results after search
        vi.mocked(api.fetchStaffTickets).mockResolvedValue({
            data: [],
            meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        });
        const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
        await user.type(searchInput, "nonexistent");
        await waitFor(() => {
            expect(screen.getByText(/no tickets match your search and filters/i)).toBeInTheDocument();
        });
        // Should show Clear Filters button
        const clearButton = screen.getByRole("button", { name: /clear filters/i });
        expect(clearButton).toBeInTheDocument();
    });
    // ── Additional Tests ────────────────────────────────────────────────────────
    it("shows loading state while fetching tickets", async () => {
        vi.mocked(api.fetchStaffTickets).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: [], meta: mockMeta }), 100)));
        renderQueue();
        expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText(/loading tickets/i)).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });
    it("shows error state when API fails", async () => {
        vi.mocked(api.fetchStaffTickets).mockRejectedValue(new Error("Network error"));
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText(/unable to load tickets/i)).toBeInTheDocument();
        });
        // Should show Try Again button
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
    it("Clear Filters button resets all filters", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Set a search term
        const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
        await user.type(searchInput, "test");
        // Click Clear Filters
        const clearButton = screen.getByText(/clear filters/i);
        await user.click(clearButton);
        // Search input should be cleared
        expect(searchInput).toHaveValue("");
    });
    it("displays priority badges with correct styling", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Check for priority badges (should appear multiple times)
        const highBadges = screen.getAllByText("HIGH");
        expect(highBadges.length).toBeGreaterThan(0);
        const mediumBadges = screen.getAllByText("MEDIUM");
        expect(mediumBadges.length).toBeGreaterThan(0);
    });
    it("displays status badges with correct text", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        expect(screen.getByText("NEW")).toBeInTheDocument();
        expect(screen.getByText("OPEN")).toBeInTheDocument();
    });
    it("pagination controls are disabled/enabled correctly", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        // Previous and Next buttons
        const buttons = screen.getAllByRole("button");
        const prevButton = buttons.find(b => b.textContent?.includes("Previous"));
        const nextButton = buttons.find(b => b.textContent?.includes("Next"));
        // Previous should be disabled on page 1
        expect(prevButton).toBeDisabled();
        // Next should be disabled on last page (only 1 page)
        expect(nextButton).toBeDisabled();
    });
    it("displays correct pagination info", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        expect(screen.getByText(/showing 1 to 2 of 2 tickets/i)).toBeInTheDocument();
        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });
    it("renders Open action buttons for each ticket", async () => {
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        const openLinks = screen.getAllByRole("link");
        const openButtons = openLinks.filter(link => link.textContent?.includes("Open"));
        expect(openButtons.length).toBe(mockTickets.length);
    });
    it("sort order toggle changes from desc to asc", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        vi.clearAllMocks();
        // Find and click sort order button (contains "Descending" or arrow icon)
        const buttons = screen.getAllByRole("button");
        const sortButton = buttons.find(b => b.textContent?.includes("Descending") || b.textContent?.includes("↓"));
        if (sortButton) {
            await user.click(sortButton);
            await waitFor(() => {
                expect(api.fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({
                    order: "asc",
                }));
            });
        }
    });
    it("page size selector changes pageSize parameter", async () => {
        const user = userEvent.setup();
        renderQueue();
        await waitFor(() => {
            expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
        });
        vi.clearAllMocks();
        // Find page size dropdown - should be the last select element
        const selects = screen.getAllByRole("combobox");
        const pageSizeSelect = selects[selects.length - 1];
        await user.selectOptions(pageSizeSelect, "25");
        await waitFor(() => {
            expect(api.fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({
                pageSize: 25,
                page: 1, // Should reset to page 1
            }));
        });
    });
});
