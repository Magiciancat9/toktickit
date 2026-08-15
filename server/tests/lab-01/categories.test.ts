import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Mock the Prisma singleton so the test never needs a real DB connection.
vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Network" },
        { id: 4, name: "Software" },
      ]),
    },
  }),
}));

const EXPECTED_CATEGORIES = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Network" },
  { id: 4, name: "Software" },
];

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with an array of category objects", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns each category with id and name fields", async () => {
    const res = await request(app).get("/api/categories");
    for (const item of res.body) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
    }
  });

  it("returns the four seeded categories in name-ascending order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.body).toEqual(EXPECTED_CATEGORIES);
  });
});
