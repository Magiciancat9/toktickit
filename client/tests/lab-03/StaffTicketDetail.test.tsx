import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail";
import { AuthContext } from "../../src/context/AuthContext";
import React from "react";
import { BrowserRouter } from "react-router-dom";

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockTicket = {
  ticketNumber: "TKT-2026-000001",
  summary: "Test Ticket",
  description: "Description",
  requester: { name: "Requester Name" },
  ownerId: 10,
  category: { name: "Hardware" },
  relatedSystem: { name: "Laptop" },
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  status: "OPEN",
  ticketDate: "2026-01-01T00:00:00Z",
  attachments: [],
  publicComments: [{ id: 1, content: "Public Comment 1", author: { name: "Author 1", role: "REQUESTER" }, createdAt: "2026-01-01T00:00:00Z" }],
  internalNotes: [{ id: 1, content: "Internal Note 1", author: { name: "IT Staff", role: "IT_STAFF" }, createdAt: "2026-01-01T00:00:00Z" }],
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderStaffTicketDetail = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user: { id: 10, email: "staff@example.com", name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false },
          loading: false,
          error: null,
          login: vi.fn(),
          logout: vi.fn(),
          loadUser: vi.fn(),
          changePassword: vi.fn(),
        }}
      >
        <StaffTicketDetail ticketNumber="TKT-2026-000001" onBack={() => {}} />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("StaffTicketDetail Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ticket: mockTicket } })
    });
  });

  it("renders public comments and internal notes", async () => {
    renderStaffTicketDetail();
    
    await waitFor(() => {
      expect(screen.getByText("Public Comment 1")).toBeInTheDocument();
      expect(screen.getByText("Internal Note 1")).toBeInTheDocument();
      expect(screen.getByText(/Internal Notes are private/i)).toBeInTheDocument();
    });
  });

  it("renders owner, priority, and status dropdowns", async () => {
    // Mock users endpoint for owner dropdown
    mockFetch.mockImplementation(async (url) => {
      if (url.includes("/api/staff/tickets/")) {
        return { ok: true, json: async () => ({ data: { ticket: mockTicket } }) };
      }
      if (url.includes("/api/admin/users")) {
        return { ok: true, json: async () => ({ data: [{ id: 10, name: "Staff User" }] }) };
      }
      return { ok: true, json: async () => ({ data: [] }) };
    });

    renderStaffTicketDetail();
    
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /Ticket Owner/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /IT Priority/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /Current Status/i })).toBeInTheDocument();
    });
  });
});
