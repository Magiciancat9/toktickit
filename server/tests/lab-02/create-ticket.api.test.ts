import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ── Shared mock data ──────────────────────────────────────────────────────

const MOCK_REQUESTER    = { id: 1, name: "Jennifer Anderson", isActive: true };
const MOCK_CATEGORY     = { id: 2, name: "Hardware" };
const MOCK_SYSTEM       = { id: 3, name: "Corporate Laptop", isActive: true };
const MOCK_TICKET = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 3,
  summary: "Laptop battery drains quickly",
  description: "My laptop battery drains much faster than usual after last update.",
  requestedPriority: "MEDIUM",
  status: "NEW",
  ticketDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  requester:     { id: 1, name: "Jennifer Anderson" },
  category:      { id: 2, name: "Hardware" },
  relatedSystem: { id: 3, name: "Corporate Laptop" },
};

// ── Prisma mock ───────────────────────────────────────────────────────────

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requesterUser: {
      findFirst: vi.fn().mockResolvedValue(MOCK_REQUESTER),
    },
    category: {
      findUnique: vi.fn().mockResolvedValue(MOCK_CATEGORY),
    },
    relatedSystem: {
      findFirst: vi.fn().mockResolvedValue(MOCK_SYSTEM),
    },
    ticket: {
      count:  vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(MOCK_TICKET),
    },
    attachment: {
      count:  vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
  }),
}));

// ── Valid body helper ─────────────────────────────────────────────────────

const VALID_BODY = {
  requesterId:       1,
  categoryId:        2,
  relatedSystemId:   3,
  summary:           "Laptop battery drains quickly",
  description:       "My laptop battery drains much faster than usual after last update.",
  requestedPriority: "MEDIUM",
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe("POST /api/tickets", () => {
  beforeEach(() => vi.clearAllMocks());

  // Happy path
  it("returns 201 with a ticket containing a generated ticketNumber", async () => {
    const res = await request(app).post("/api/tickets").send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
  });

  it("returns 201 with status NEW", async () => {
    const res = await request(app).post("/api/tickets").send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("NEW");
  });

  it("returns 201 with requester, category, and relatedSystem embedded", async () => {
    const res = await request(app).post("/api/tickets").send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("requester");
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("relatedSystem");
  });

  // Validation — missing fields
  it("returns 400 when summary is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, summary: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields).toHaveProperty("summary");
  });

  it("returns 400 when summary is too short (< 5 chars)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, summary: "Hi" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("summary");
  });

  it("returns 400 when summary is too long (> 150 chars)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, summary: "x".repeat(151) });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("summary");
  });

  it("returns 400 when description is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, description: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("description");
  });

  it("returns 400 when description is too short (< 10 chars)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, description: "Too short" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("description");
  });

  it("returns 400 when requestedPriority is invalid", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ ...VALID_BODY, requestedPriority: "URGENT" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("requestedPriority");
  });

  it("returns 400 when categoryId is missing", async () => {
    const { categoryId: _, ...body } = VALID_BODY;
    const res = await request(app).post("/api/tickets").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("categoryId");
  });

  it("returns 400 when requesterId is missing", async () => {
    const { requesterId: _, ...body } = VALID_BODY;
    const res = await request(app).post("/api/tickets").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("requesterId");
  });

  // Multiple validation errors returned at once
  it("returns all field errors when multiple fields are invalid", async () => {
    const res = await request(app).post("/api/tickets").send({});
    expect(res.status).toBe(400);
    const fields = res.body.error.fields;
    expect(fields).toHaveProperty("requesterId");
    expect(fields).toHaveProperty("categoryId");
    expect(fields).toHaveProperty("summary");
    expect(fields).toHaveProperty("description");
    expect(fields).toHaveProperty("requestedPriority");
  });
});

describe("POST /api/tickets/:ticketNumber/attachments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when no file is attached", async () => {
    const res = await request(app)
      .post("/api/tickets/TKT-2026-000001/attachments")
      .field("requesterId", "1");
    expect(res.status).toBe(400);
  });

  it("returns 415 when file type is not allowed", async () => {
    const res = await request(app)
      .post("/api/tickets/TKT-2026-000001/attachments")
      .field("requesterId", "1")
      .attach("file", Buffer.from("fake exe content"), {
        filename: "malware.exe",
        contentType: "application/octet-stream",
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns 400 when file exceeds 5 MB", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    const res = await request(app)
      .post("/api/tickets/TKT-2026-000001/attachments")
      .field("requesterId", "1")
      .attach("file", bigBuffer, {
        filename: "large.jpg",
        contentType: "image/jpeg",
      });
    expect(res.status).toBe(400);
  });
});
