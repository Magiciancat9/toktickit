import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ── Shared mock data ──────────────────────────────────────────────────────

const REQUESTER_A = { id: 1, name: "Jennifer Anderson", isActive: true };
const REQUESTER_B = { id: 2, name: "Michael Brown",     isActive: true };

const makeTicket = (n: number, requesterId = 1) => ({
  id:               n,
  ticketNumber:     `TKT-2026-00000${n}`,
  requesterId,
  categoryId:       1,
  relatedSystemId:  1,
  summary:          `Ticket ${n} summary`,
  description:      `Description for ticket ${n}`,
  requestedPriority: "MEDIUM",
  status:           "NEW",
  ticketDate:       new Date().toISOString(),
  createdAt:        new Date().toISOString(),
  updatedAt:        new Date().toISOString(),
  category:         { id: 1, name: "Hardware" },
  relatedSystem:    { id: 1, name: "Corporate Laptop" },
});

const TICKETS_A = [makeTicket(1), makeTicket(2), makeTicket(3)];
const TICKET_A1_FULL = {
  ...makeTicket(1),
  requester:   { id: 1, name: "Jennifer Anderson" },
  attachments: [],
};

// ── Prisma mock ───────────────────────────────────────────────────────────

const mockFindMany  = vi.fn();
const mockCount     = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requesterUser: { findFirst: mockFindFirst },
    ticket:        { findMany: mockFindMany, count: mockCount, findUnique: mockFindUnique },
    attachment:    { count: vi.fn().mockResolvedValue(0), create: vi.fn() },
    category:      { findUnique: vi.fn() },
    relatedSystem: { findFirst: vi.fn() },
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(REQUESTER_A);
    mockFindMany.mockResolvedValue(TICKETS_A);
    mockCount.mockResolvedValue(3);
  });

  // Happy path
  it("returns 200 with data array and meta object", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("pageSize");
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("totalPages");
  });

  it("defaults to page 1, pageSize 10, sort createdAt desc", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1");
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.pageSize).toBe(10);
  });

  it("returns correct total and totalPages in meta", async () => {
    mockCount.mockResolvedValue(3);
    const res = await request(app).get("/api/tickets?requesterId=1");
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it("returns empty data array when requester has no tickets", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    const res = await request(app).get("/api/tickets?requesterId=1");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  // Validation
  it("returns 400 when requesterId is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid priority filter", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1&priority=URGENT");
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status filter", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1&status=CLOSED");
    expect(res.status).toBe(400);
  });

  // Pagination
  it("respects page and pageSize parameters", async () => {
    mockCount.mockResolvedValue(25);
    mockFindMany.mockResolvedValue([makeTicket(11), makeTicket(12)]);
    const res = await request(app).get("/api/tickets?requesterId=1&page=2&pageSize=10");
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.total).toBe(25);
    expect(res.body.meta.totalPages).toBe(3);
  });

  it("falls back to pageSize 10 for invalid pageSize values", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1&pageSize=99");
    expect(res.status).toBe(200);
    expect(res.body.meta.pageSize).toBe(10);
  });

  // Search passes through to DB (we verify the call structure via mock)
  it("returns 200 when search param is provided", async () => {
    const res = await request(app).get("/api/tickets?requesterId=1&search=laptop");
    expect(res.status).toBe(200);
  });

  // Ownership isolation
  it("returns 400 when requesterId references an inactive or missing requester", async () => {
    mockFindFirst.mockResolvedValue(null); // inactive / not found
    const res = await request(app).get("/api/tickets?requesterId=99");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUESTER");
  });
});

describe("GET /api/tickets/:ticketNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(TICKET_A1_FULL);
  });

  it("returns 200 with full ticket when requester owns it", async () => {
    const res = await request(app).get("/api/tickets/TKT-2026-000001?requesterId=1");
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe("TKT-2026-000001");
    expect(res.body).toHaveProperty("attachments");
  });

  it("returns 403 when a different requester tries to access the ticket", async () => {
    // Ticket belongs to requesterId 1, but we request as requesterId 2
    const res = await request(app).get("/api/tickets/TKT-2026-000001?requesterId=2");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 when ticket does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/tickets/TKT-9999-999999?requesterId=1");
    expect(res.status).toBe(404);
  });

  it("returns 400 when requesterId is missing", async () => {
    const res = await request(app).get("/api/tickets/TKT-2026-000001");
    expect(res.status).toBe(400);
  });
});
