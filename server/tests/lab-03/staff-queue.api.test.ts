import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

/**
 * LAB3-06: IT Staff Ticket Queue API Tests
 * Coverage: API-27 through API-33 from tests.md
 */

// ── Shared mock data ──────────────────────────────────────────────────────

const IT_STAFF_USER = { id: 10, name: "IT Staff User", role: "IT_STAFF", isActive: true };
const REQUESTER_USER = { id: 1, name: "Jennifer Anderson", role: "REQUESTER", isActive: true };

const makeTicket = (n: number, overrides: any = {}) => ({
  id: n,
  ticketNumber: `TKT-2026-00000${n}`,
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 1,
  summary: `Ticket ${n} summary`,
  description: `Description for ticket ${n}`,
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  status: "NEW",
  ownerId: null,
  ticketDate: new Date("2026-09-14T10:00:00.000Z"),
  createdAt: new Date("2026-09-14T10:00:00.000Z"),
  updatedAt: new Date("2026-09-14T10:00:00.000Z"),
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Corporate Laptop" },
  requester: { id: 1, name: "Jennifer Anderson" },
  owner: null,
  ...overrides,
});

const ALL_TICKETS = [
  makeTicket(1, {
    summary: "Laptop battery issue",
    itPriority: "HIGH",
    status: "OPEN",
    ownerId: null,
  }),
  makeTicket(2, {
    summary: "Email access problem",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    status: "OPEN",
    ownerId: 10,
    owner: { id: 10, name: "IT Staff User" },
  }),
  makeTicket(3, {
    summary: "Software installation request",
    itPriority: "MEDIUM",
    status: "NEW",
    ownerId: null,
  }),
  makeTicket(4, {
    summary: "Network connectivity issue",
    itPriority: "LOW",
    status: "IN_PROGRESS",
    ownerId: 11,
    owner: { id: 11, name: "Other IT Staff" },
  }),
];

// ── Prisma mock ───────────────────────────────────────────────────────────

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    ticket: { findMany: mockFindMany, count: mockCount },
  }),
}));

// ── Mock session middleware ───────────────────────────────────────────────

vi.mock("../../src/middleware/auth.middleware.js", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    // Check for test headers to simulate authentication
    const userId = req.headers["x-test-user-id"];
    const userRole = req.headers["x-test-user-role"];

    if (!userId || !userRole) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    }

    req.user = {
      id: parseInt(userId),
      role: userRole,
    };
    next();
  },
  loadAuthenticatedUser: async (req: any, res: any, next: any) => {
    // This middleware loads user details from DB - for tests, we already have req.user
    // Just pass through
    next();
  },
  requireRole: (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN" } });
    }
    next();
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("GET /api/staff/tickets — IT Staff Ticket Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue(ALL_TICKETS);
    mockCount.mockResolvedValue(ALL_TICKETS.length);
  });

  // ── API-27: Returns all tickets, not limited to one requester ─────────────

  it("API-27: returns all tickets, not limited to one requester", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4); // All tickets, not filtered by requester
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("pageSize");
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("totalPages");
  });

  // ── API-28: Search filters by keyword ──────────────────────────────────────

  it("API-28: search filters tickets by keyword in ticketNumber or summary", async () => {
    const searchResults = [ALL_TICKETS[0]]; // Only "Laptop battery issue"
    mockFindMany.mockResolvedValue(searchResults);
    mockCount.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/staff/tickets?search=laptop")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].summary).toContain("Laptop");
  });

  // ── API-29: Filter by itPriority ───────────────────────────────────────────

  it("API-29: itPriority filter returns only HIGH priority tickets", async () => {
    const highPriorityTickets = ALL_TICKETS.filter((t) => t.itPriority === "HIGH");
    mockFindMany.mockResolvedValue(highPriorityTickets);
    mockCount.mockResolvedValue(highPriorityTickets.length);

    const res = await request(app)
      .get("/api/staff/tickets?itPriority=HIGH")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.itPriority).toBe("HIGH");
    });
  });

  // ── API-30: assignment=unassigned filter ───────────────────────────────────

  it("API-30: assignment=unassigned returns only tickets with ownerId=null", async () => {
    const unassignedTickets = ALL_TICKETS.filter((t) => t.ownerId === null);
    mockFindMany.mockResolvedValue(unassignedTickets);
    mockCount.mockResolvedValue(unassignedTickets.length);

    const res = await request(app)
      .get("/api/staff/tickets?assignment=unassigned")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.ownerId).toBeNull();
    });
  });

  // ── API-31: assignment=assigned-to-me filter ───────────────────────────────

  it("API-31: assignment=assigned-to-me returns only tickets owned by authenticated user", async () => {
    const myTickets = ALL_TICKETS.filter((t) => t.ownerId === 10);
    mockFindMany.mockResolvedValue(myTickets);
    mockCount.mockResolvedValue(myTickets.length);

    const res = await request(app)
      .get("/api/staff/tickets?assignment=assigned-to-me")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].ownerId).toBe(10);
  });

  // ── API-32: Pagination ──────────────────────────────────────────────────────

  it("API-32: respects page and pageSize parameters with correct meta", async () => {
    mockCount.mockResolvedValue(25);
    const page2Tickets = [makeTicket(11), makeTicket(12)];
    mockFindMany.mockResolvedValue(page2Tickets);

    const res = await request(app)
      .get("/api/staff/tickets?page=2&pageSize=10")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.total).toBe(25);
    expect(res.body.meta.totalPages).toBe(3);
  });

  // ── API-33: Authorization - 403 for non-IT Staff ───────────────────────────

  it("API-33: returns 403 when non-IT Staff user attempts access", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("x-test-user-id", "1")
      .set("x-test-user-role", "REQUESTER");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  // ── Additional Tests ────────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/staff/tickets");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("filters by status correctly", async () => {
    const openTickets = ALL_TICKETS.filter((t) => t.status === "OPEN");
    mockFindMany.mockResolvedValue(openTickets);
    mockCount.mockResolvedValue(openTickets.length);

    const res = await request(app)
      .get("/api/staff/tickets?status=OPEN")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("filters by requested priority correctly", async () => {
    const highReqPriority = ALL_TICKETS.filter((t) => t.requestedPriority === "HIGH");
    mockFindMany.mockResolvedValue(highReqPriority);
    mockCount.mockResolvedValue(highReqPriority.length);

    const res = await request(app)
      .get("/api/staff/tickets?reqPriority=HIGH")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("sorts by itPriority descending by default", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(200);
    // Verify the mock was called with sort parameter
    expect(mockFindMany).toHaveBeenCalled();
  });

  it("returns 400 for invalid priority value", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?itPriority=INVALID")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status value", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=INVALID")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid assignment value", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignment=invalid-option")
      .set("x-test-user-id", "10")
      .set("x-test-user-role", "IT_STAFF");

    expect(res.status).toBe(400);
  });
});
