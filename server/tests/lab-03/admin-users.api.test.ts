import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Admin Users API", () => {
  let adminCookie: string[];
  let staffCookie: string[];
  let requesterCookie: string[];

  beforeAll(async () => {
    // 1. Create one admin, one staff, one requester for testing
    const admin = await prisma.user.upsert({
      where: { email: "admin.test@example.com" },
      update: {},
      create: {
        name: "Admin Test",
        email: "admin.test@example.com",
        role: "ADMINISTRATOR",
        passwordHash: "dummyhash",
        isActive: true,
      }
    });

    const staff = await prisma.user.upsert({
      where: { email: "staff.test@example.com" },
      update: {},
      create: {
        name: "Staff Test",
        email: "staff.test@example.com",
        role: "IT_STAFF",
        passwordHash: "dummyhash",
        isActive: true,
      }
    });

    const requester = await prisma.user.upsert({
      where: { email: "requester.test@example.com" },
      update: {},
      create: {
        name: "Requester Test",
        email: "requester.test@example.com",
        role: "REQUESTER",
        passwordHash: "dummyhash",
        isActive: true,
      }
    });

    // We don't have a direct login endpoint helper here, 
    // so let's mock the session or use the development endpoint if available.
    // For this lab, assume we can inject session directly or there is a dev login.
    // However, typical test setup logs in via /api/auth/login.
    // To ensure testing doesn't hang, we'll assume we can log in if we reset their password
    
    // First, let's reset passwords to something we know
    const bcrypt = await import("bcrypt");
    const testHash = await bcrypt.hash("Password123!", 10);
    
    await prisma.user.updateMany({
      where: { id: { in: [admin.id, staff.id, requester.id] } },
      data: { passwordHash: testHash }
    });

    // Log in admin
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "admin.test@example.com",
      password: "Password123!"
    });
    adminCookie = adminRes.headers["set-cookie"];

    // Log in staff
    const staffRes = await request(app).post("/api/auth/login").send({
      email: "staff.test@example.com",
      password: "Password123!"
    });
    staffCookie = staffRes.headers["set-cookie"];
    
    // Log in requester
    const reqRes = await request(app).post("/api/auth/login").send({
      email: "requester.test@example.com",
      password: "Password123!"
    });
    requesterCookie = reqRes.headers["set-cookie"];
  });

  afterAll(async () => {
    // Cleanup the created user test accounts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin.test@example.com", 
            "staff.test@example.com", 
            "requester.test@example.com",
            "new.user@example.com"
          ]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe("Authorization", () => {
    it("should reject unauthenticated access", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("should reject REQUESTER access", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("should reject IT_STAFF access", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(403);
    });

    it("should allow ADMINISTRATOR access", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
    });
  });

  describe("User Management Operations", () => {
    let newUserId: number;

    it("should create a new user", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "New User",
          email: "new.user@example.com",
          role: "IT_STAFF",
          isActive: true,
          initialPassword: "InitialPassword123!"
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("New User");
      expect(res.body.data.requiresPasswordChange).toBe(true);
      newUserId = res.body.data.id;
    });

    it("should reject creating user with existing email", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Another User",
          email: "new.user@example.com", // Duplicate
          role: "REQUESTER",
          isActive: true,
          initialPassword: "InitialPassword123!"
        });
      
      expect(res.status).toBe(409);
    });

    it("should list users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // At least the ones we created should be there
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should update a user", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${newUserId}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Updated User Name"
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated User Name");
    });

    it("should reset password for a user", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${newUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({
          newPassword: "NewResetPassword123!"
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("Password reset successfully");
    });
  });
});
