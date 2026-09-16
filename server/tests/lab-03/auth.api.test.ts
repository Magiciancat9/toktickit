import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Auth API", () => {
  let activeUserCookie: string[];

  beforeAll(async () => {
    const bcrypt = await import("bcrypt");
    const testHash = await bcrypt.hash("Password123!", 10);

    // Create an active user for login tests
    await prisma.user.upsert({
      where: { email: "active.test@example.com" },
      update: { passwordHash: testHash, isActive: true },
      create: {
        name: "Active Test",
        email: "active.test@example.com",
        role: "REQUESTER",
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false
      }
    });

    // Create a user that requires password change
    await prisma.user.upsert({
      where: { email: "initial.test@example.com" },
      update: { passwordHash: testHash, isActive: true, requiresPasswordChange: true },
      create: {
        name: "Initial Test",
        email: "initial.test@example.com",
        role: "REQUESTER",
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: true
      }
    });

    // Create an inactive user
    await prisma.user.upsert({
      where: { email: "inactive.test@example.com" },
      update: { passwordHash: testHash, isActive: false },
      create: {
        name: "Inactive Test",
        email: "inactive.test@example.com",
        role: "REQUESTER",
        passwordHash: testHash,
        isActive: false,
        requiresPasswordChange: false
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "active.test@example.com",
            "initial.test@example.com",
            "inactive.test@example.com"
          ]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials (active user)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "active.test@example.com",
        password: "Password123!"
      });
      
      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe("active.test@example.com");
      
      // Store cookie for later tests
      activeUserCookie = res.headers["set-cookie"];
      expect(activeUserCookie).toBeDefined();
    });

    it("should return requiresPasswordChange=true for initial password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "initial.test@example.com",
        password: "Password123!"
      });
      
      expect(res.status).toBe(200);
      expect(res.body.data.user.requiresPasswordChange).toBe(true);
    });

    it("should fail login with invalid email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "Password123!"
      });
      
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("should fail login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "active.test@example.com",
        password: "WrongPassword123!"
      });
      
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("should fail login with inactive user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "inactive.test@example.com",
        password: "Password123!"
      });
      
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", activeUserCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("active.test@example.com");
    });

    it("should fail without session", async () => {
      const res = await request(app).get("/api/auth/me");
      
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should invalidate session", async () => {
      // 1. Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", activeUserCookie);
      
      expect(logoutRes.status).toBe(204);

      // 2. Subsequent request should fail
      const subsequentRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", activeUserCookie); // Even if they send the old cookie
        
      expect(subsequentRes.status).toBe(401);
    });
  });
});
