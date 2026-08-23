import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// ── Shared mock data ──────────────────────────────────────────────────────

const REQUESTER_A_ID = 1;
const REQUESTER_B_ID = 2;

const ACTIVE_ATTACHMENT = {
  id:            1,
  ticketId:      1,
  originalName:  "screenshot.png",
  storedPath:    "uploads/fake-path.png",
  mimeType:      "image/png",
  sizeBytes:     204800,
  uploadedAt:    new Date().toISOString(),
  removedAt:     null,
  removalReason: null,
  ticket:        { requesterId: REQUESTER_A_ID },
};

const REMOVED_ATTACHMENT = {
  ...ACTIVE_ATTACHMENT,
  id:            2,
  removedAt:     new Date().toISOString(),
  removalReason: "Not relevant",
};

const MOCK_TICKET = {
  id:               1,
  ticketNumber:     "TKT-2026-000001",
  requesterId:      REQUESTER_A_ID,
  categoryId:       1,
  relatedSystemId:  1,
  summary:          "Laptop battery drains quickly",
  description:      "Description of the issue.",
  requestedPriority: "MEDIUM",
  status:           "NEW",
  ticketDate:       new Date().toISOString(),
  createdAt:        new Date().toISOString(),
  updatedAt:        new Date().toISOString(),
  requester:        { id: 1, name: "Jennifer Anderson" },
  category:         { id: 1, name: "Hardware" },
  relatedSystem:    { id: 1, name: "Corporate Laptop" },
  attachments:      [ACTIVE_ATTACHMENT],
};

// ── Prisma mock ───────────────────────────────────────────────────────────

const mockFindUniqueTicket     = vi.fn();
const mockFindUniqueAttachment = vi.fn();
const mockUpdateAttachment     = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requesterUser: { findFirst: vi.fn().mockResolvedValue({ id: 1, isActive: true }) },
    ticket: {
      findUnique: mockFindUniqueTicket,
      count:      vi.fn().mockResolvedValue(0),
      findMany:   vi.fn().mockResolvedValue([]),
      create:     vi.fn(),
    },
    attachment: {
      findUnique: mockFindUniqueAttachment,
      update:     mockUpdateAttachment,
      count:      vi.fn().mockResolvedValue(0),
      create:     vi.fn(),
    },
    category:      { findUnique: vi.fn() },
    relatedSystem: { findFirst: vi.fn() },
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("GET /api/tickets/:ticketNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueTicket.mockResolvedValue(MOCK_TICKET);
  });

  it("returns 200 with ticket and attachments array for the owning requester", async () => {
    const res = await request(app)
      .get(`/api/tickets/TKT-2026-000001?requesterId=${REQUESTER_A_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe("TKT-2026-000001");
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });

  it("returns 403 when a different requester tries to access the ticket", async () => {
    const res = await request(app)
      .get(`/api/tickets/TKT-2026-000001?requesterId=${REQUESTER_B_ID}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 when the ticket does not exist", async () => {
    mockFindUniqueTicket.mockResolvedValue(null);
    const res = await request(app)
      .get(`/api/tickets/TKT-9999-999999?requesterId=${REQUESTER_A_ID}`);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/attachments/:id/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueAttachment.mockResolvedValue(ACTIVE_ATTACHMENT);
    mockUpdateAttachment.mockResolvedValue({
      ...ACTIVE_ATTACHMENT,
      removedAt:     new Date(),
      removalReason: "Uploaded the wrong file",
    });
  });

  it("returns 200 and sets removedAt when valid reason is provided by the owner", async () => {
    const res = await request(app)
      .patch("/api/attachments/1/remove")
      .send({ requesterId: REQUESTER_A_ID, removalReason: "Uploaded the wrong file" });
    expect(res.status).toBe(200);
    expect(res.body.removedAt).toBeTruthy();
    expect(res.body.removalReason).toBe("Uploaded the wrong file");
  });

  it("returns 400 when removalReason is missing", async () => {
    const res = await request(app)
      .patch("/api/attachments/1/remove")
      .send({ requesterId: REQUESTER_A_ID });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when removalReason is too short (< 5 chars)", async () => {
    const res = await request(app)
      .patch("/api/attachments/1/remove")
      .send({ requesterId: REQUESTER_A_ID, removalReason: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when a different requester tries to remove the attachment", async () => {
    const res = await request(app)
      .patch("/api/attachments/1/remove")
      .send({ requesterId: REQUESTER_B_ID, removalReason: "Valid reason here" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 when the attachment does not exist", async () => {
    mockFindUniqueAttachment.mockResolvedValue(null);
    const res = await request(app)
      .patch("/api/attachments/999/remove")
      .send({ requesterId: REQUESTER_A_ID, removalReason: "Valid reason here" });
    expect(res.status).toBe(404);
  });

  it("returns 409 when the attachment is already removed", async () => {
    mockFindUniqueAttachment.mockResolvedValue(REMOVED_ATTACHMENT);
    const res = await request(app)
      .patch("/api/attachments/2/remove")
      .send({ requesterId: REQUESTER_A_ID, removalReason: "Trying to remove again" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ALREADY_REMOVED");
  });
});

describe("GET /api/attachments/:id/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when a different requester tries to download", async () => {
    mockFindUniqueAttachment.mockResolvedValue(ACTIVE_ATTACHMENT);
    const res = await request(app)
      .get(`/api/attachments/1/download?requesterId=${REQUESTER_B_ID}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 410 when the attachment has been soft-removed", async () => {
    mockFindUniqueAttachment.mockResolvedValue(REMOVED_ATTACHMENT);
    const res = await request(app)
      .get(`/api/attachments/2/download?requesterId=${REQUESTER_A_ID}`);
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe("GONE");
  });

  it("returns 404 when the attachment does not exist", async () => {
    mockFindUniqueAttachment.mockResolvedValue(null);
    const res = await request(app)
      .get(`/api/attachments/999/download?requesterId=${REQUESTER_A_ID}`);
    expect(res.status).toBe(404);
  });
});
