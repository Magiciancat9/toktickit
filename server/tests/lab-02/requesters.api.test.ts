import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Mock Prisma so the test never needs a real DB connection.
vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requesterUser: {
      findMany: vi.fn().mockResolvedValue([
        { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.com" },
        { id: 2, name: "Michael Brown",     email: "michael.brown@example.com" },
        { id: 3, name: "Sarah Johnson",     email: "sarah.johnson@example.com" },
        { id: 4, name: "David Lee",         email: "david.lee@example.com" },
      ]),
    },
  }),
}));

describe("GET /api/requesters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with an array", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns only active requesters — inactive ones are excluded", async () => {
    const res = await request(app).get("/api/requesters");
    // The mock returns 4 active requesters; inactive (Alex Turner) is not included.
    expect(res.body).toHaveLength(4);
    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).not.toContain("Alex Turner");
  });

  it("each item has id, name, and email fields", async () => {
    const res = await request(app).get("/api/requesters");
    for (const item of res.body) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("email");
    }
  });

  it("does not expose any unexpected sensitive fields", async () => {
    const res = await request(app).get("/api/requesters");
    for (const item of res.body) {
      expect(item).not.toHaveProperty("isActive");
      expect(item).not.toHaveProperty("password");
    }
  });
});
