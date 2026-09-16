/**
 * API tests for authorization (Lab 3).
 * Tests role-based access control and ownership protection.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Authorization API Tests", () => {
  let adminCookie: string[];
  let staffCookie: string[];
  let requester1Cookie: string[];
  let requester2Cookie: string[];
  let inactiveCookie: string[];

  let req1TicketId: number;
  let req1TicketNumber: string;
  let authzCategoryId: number;
  let authzSystemId: number;

  beforeAll(async () => {
    const bcrypt = await import("bcrypt");
    const testHash = await bcrypt.hash("Password123!", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin.authz@example.com" },
      update: { passwordHash: testHash, isActive: true },
      create: { name: "Admin AuthZ", email: "admin.authz@example.com", role: "ADMINISTRATOR", passwordHash: testHash, isActive: true }
    });

    const staff = await prisma.user.upsert({
      where: { email: "staff.authz@example.com" },
      update: { passwordHash: testHash, isActive: true },
      create: { name: "Staff AuthZ", email: "staff.authz@example.com", role: "IT_STAFF", passwordHash: testHash, isActive: true }
    });

    const requester1 = await prisma.user.upsert({
      where: { email: "requester1.authz@example.com" },
      update: { passwordHash: testHash, isActive: true },
      create: { name: "Requester1 AuthZ", email: "requester1.authz@example.com", role: "REQUESTER", passwordHash: testHash, isActive: true }
    });

    const requester2 = await prisma.user.upsert({
      where: { email: "requester2.authz@example.com" },
      update: { passwordHash: testHash, isActive: true },
      create: { name: "Requester2 AuthZ", email: "requester2.authz@example.com", role: "REQUESTER", passwordHash: testHash, isActive: true }
    });

    const inactive = await prisma.user.upsert({
      where: { email: "inactive.authz@example.com" },
      update: { passwordHash: testHash, isActive: false },
      create: { name: "Inactive AuthZ", email: "inactive.authz@example.com", role: "REQUESTER", passwordHash: testHash, isActive: false }
    });

    const category = await prisma.category.upsert({
      where: { name: "AuthZ Test Category" },
      update: {},
      create: { name: "AuthZ Test Category" }
    });
    authzCategoryId = category.id;

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { name: "AuthZ Test System" },
      update: {},
      create: { name: "AuthZ Test System" }
    });
    authzSystemId = relatedSystem.id;

    // Create a ticket for requester 1
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-AUTHZ-001",
        requesterId: requester1.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Test AuthZ Ticket",
        description: "AuthZ description",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "NEW",
        ownerId: null
      }
    });

    req1TicketId = ticket.id;
    req1TicketNumber = ticket.ticketNumber;

    // Login users
    const adminRes = await request(app).post("/api/auth/login").send({ email: "admin.authz@example.com", password: "Password123!" });
    adminCookie = adminRes.headers["set-cookie"];

    const staffRes = await request(app).post("/api/auth/login").send({ email: "staff.authz@example.com", password: "Password123!" });
    staffCookie = staffRes.headers["set-cookie"];

    const req1Res = await request(app).post("/api/auth/login").send({ email: "requester1.authz@example.com", password: "Password123!" });
    requester1Cookie = req1Res.headers["set-cookie"];

    const req2Res = await request(app).post("/api/auth/login").send({ email: "requester2.authz@example.com", password: "Password123!" });
    requester2Cookie = req2Res.headers["set-cookie"];
  });

  afterAll(async () => {
    // Delete related entities first to avoid foreign key violations
    await prisma.publicComment.deleteMany({ where: { ticketId: req1TicketId } });
    await prisma.internalNote.deleteMany({ where: { ticketId: req1TicketId } });
    await prisma.ticket.deleteMany({ where: { id: req1TicketId } });
    await prisma.category.deleteMany({ where: { name: "AuthZ Test Category" } });
    await prisma.relatedSystem.deleteMany({ where: { name: "AuthZ Test System" } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin.authz@example.com",
            "staff.authz@example.com",
            "requester1.authz@example.com",
            "requester2.authz@example.com",
            "inactive.authz@example.com"
          ]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe("Unauthenticated Access", () => {
    it("GET /api/tickets should return 401 without authentication", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });

    it("POST /api/tickets should return 401 without authentication", async () => {
      const res = await request(app).post("/api/tickets").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("Requester Ownership Protection (BR-15)", () => {
    it("Requester can access own ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${req1TicketNumber}`)
        .set("Cookie", requester1Cookie);
      expect(res.status).toBe(200);
      expect(res.body.ticketNumber).toBe(req1TicketNumber);
    });

    it("Requester cannot access another requester's ticket", async () => {
      const res = await request(app)
        .get(`/api/tickets/${req1TicketNumber}`)
        .set("Cookie", requester2Cookie);
      
      // Expected to be 404 so as not to leak existence of other tickets
      expect(res.status).toBe(404);
    });

    it("Requester cannot access ticket list with manipulated requesterId", async () => {
      // Trying to query with another user's ID
      // Even if they pass ?requesterId=123, the backend should ignore it and use session ID
      const req2User = await prisma.user.findUnique({ where: { email: "requester2.authz@example.com" } });
      const res = await request(app)
        .get(`/api/tickets?requesterId=${req2User!.id}`)
        .set("Cookie", requester1Cookie);
      
      expect(res.status).toBe(200);
      const req1User = await prisma.user.findUnique({ where: { email: "requester1.authz@example.com" } });
      const allBelongToReq1 = res.body.data.every((t: any) => t.requesterId === req1User!.id);
      expect(allBelongToReq1).toBe(true);
    });
  });

  describe("Internal Notes Access Control (AC-09, AC-24)", () => {
    it("Requester cannot access Internal Notes endpoint", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${req1TicketNumber}/notes`)
        .set("Cookie", requester1Cookie);
      expect(res.status).toBe(403);
    });

    it("IT Staff can access Internal Notes", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${req1TicketNumber}/notes`)
        .set("Cookie", staffCookie);
      expect(res.status).toBe(200);
    });
  });

  describe("Role-Based Access Control", () => {
    it("Requester cannot access IT Staff ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", requester1Cookie);
      expect(res.status).toBe(403);
    });

    it("IT Staff can access ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(200);
    });

    it("IT Staff cannot access admin endpoints", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(403);
    });

    it("Administrator can access user management", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
    });
  });

  describe("Ticket Creation Authorization (AC-11)", () => {
    it("requesterId derived from session, not request body", async () => {
      const req2User = await prisma.user.findUnique({ where: { email: "requester2.authz@example.com" } });
      const req1User = await prisma.user.findUnique({ where: { email: "requester1.authz@example.com" } });
      
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", requester1Cookie)
        .send({
          categoryId: authzCategoryId,
          relatedSystemId: authzSystemId,
          summary: "Sneaky Ticket",
          description: "Trying to create for someone else",
          requestedPriority: "MEDIUM",
          requesterId: req2User!.id // Try to spoof
        });
      
      if (res.status !== 201) {
        console.error("API ERROR:", JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      // The backend should ignore the spoofed requesterId and use the session's
      expect(res.body.requesterId).toBe(req1User!.id);
      
      // Cleanup created ticket
      await prisma.ticket.delete({ where: { id: res.body.id } });
    });

    it("Only Requester role can create tickets (or others allowed by business logic)", async () => {
      // In this lab, Requesters create tickets. 
      // If IT Staff tries to hit the Requester endpoint, it might be allowed or forbidden depending on impl.
      // Usually only REQUESTER can use /api/tickets POST.
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", staffCookie)
        .send({
          categoryId: authzCategoryId,
          relatedSystemId: authzSystemId,
          summary: "IT Staff Ticket",
          description: "IT Staff creating a ticket",
          requestedPriority: "MEDIUM"
        });
      
      // Usually we restrict this to REQUESTER
      expect(res.status).toBe(403);
    });
  });

  describe("Inactive User Protection", () => {
    it("Inactive user cannot login", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "inactive.authz@example.com", password: "Password123!" });
      expect(res.status).toBe(401);
    });
  });
});
