import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Staff Ticket Detail API", () => {
  let adminCookie: string[];
  let staffCookie: string[];
  let requesterCookie: string[];

  let testTicketNumber: string;
  let testTicketId: number;

  beforeAll(async () => {
    const bcrypt = await import("bcrypt");
    const testHash = await bcrypt.hash("Password123!", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin.detail@example.com" },
      update: {},
      create: {
        name: "Admin Detail",
        email: "admin.detail@example.com",
        role: "ADMINISTRATOR",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const staff = await prisma.user.upsert({
      where: { email: "staff.detail@example.com" },
      update: {},
      create: {
        name: "Staff Detail",
        email: "staff.detail@example.com",
        role: "IT_STAFF",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const staff2 = await prisma.user.upsert({
      where: { email: "staff2.detail@example.com" },
      update: {},
      create: {
        name: "Staff 2 Detail",
        email: "staff2.detail@example.com",
        role: "IT_STAFF",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const requester = await prisma.user.upsert({
      where: { email: "requester.detail@example.com" },
      update: {},
      create: {
        name: "Requester Detail",
        email: "requester.detail@example.com",
        role: "REQUESTER",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const category = await prisma.category.upsert({
      where: { id: 999 },
      update: {},
      create: { name: "Detail Test Category" }
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { id: 999 },
      update: {},
      create: { name: "Detail Test System" }
    });

    // Create a ticket for the requester
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-DETAIL-001",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Test Detail Ticket",
        description: "Detail description",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "NEW",
        ownerId: null
      }
    });

    testTicketNumber = ticket.ticketNumber;
    testTicketId = ticket.id;

    // Login
    const adminRes = await request(app).post("/api/auth/login").send({ email: "admin.detail@example.com", password: "Password123!" });
    adminCookie = adminRes.headers["set-cookie"];

    const staffRes = await request(app).post("/api/auth/login").send({ email: "staff.detail@example.com", password: "Password123!" });
    staffCookie = staffRes.headers["set-cookie"];

    const reqRes = await request(app).post("/api/auth/login").send({ email: "requester.detail@example.com", password: "Password123!" });
    requesterCookie = reqRes.headers["set-cookie"];
  });

  afterAll(async () => {
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-DETAIL-001" } });
    if (ticket) {
      await prisma.publicComment.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.internalNote.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.ticket.delete({ where: { id: ticket.id } });
    }
    await prisma.category.deleteMany({ where: { name: "Detail Test Category" } });
    await prisma.relatedSystem.deleteMany({ where: { name: "Detail Test System" } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin.detail@example.com", "staff.detail@example.com", "staff2.detail@example.com", "requester.detail@example.com"]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe("GET /api/staff/tickets/:ticketNumber", () => {
    it("should allow IT Staff to view any ticket", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}`)
        .set("Cookie", staffCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.ticketNumber).toBe(testTicketNumber);
    });
  });

  describe("PATCH /api/staff/tickets/:ticketNumber/owner", () => {
    it("should allow IT Staff to claim ticket", async () => {
      const staffUser = await prisma.user.findUnique({ where: { email: "staff.detail@example.com" } });
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: staffUser!.id });
      
      expect(res.status).toBe(200);
      expect(res.body.data.ticket.ownerId).toBe(staffUser!.id);
    });

    it("should allow IT Staff to reassign ticket", async () => {
      const staff2User = await prisma.user.findUnique({ where: { email: "staff2.detail@example.com" } });
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: staff2User!.id });
      
      expect(res.status).toBe(200);
      expect(res.body.data.ticket.ownerId).toBe(staff2User!.id);
    });

    it("should return 400 for invalid ownerId", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: 999999 }); // Non-existent user
      
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/staff/tickets/:ticketNumber/it-priority", () => {
    it("should allow IT Staff to update IT Priority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/it-priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "HIGH" });
      
      expect(res.status).toBe(200);
      expect(res.body.data.ticket.itPriority).toBe("HIGH");
    });

    it("should return 400 for invalid IT Priority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/it-priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "CRITICAL" }); // Not in enum
      
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/staff/tickets/:ticketNumber/status", () => {
    it("should allow IT Staff to update status (valid transition)", async () => {
      // Current status is NEW, change to OPEN
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "OPEN" });
      
      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe("OPEN");
    });

    it("should return 400 for invalid status transition", async () => {
      // Current status is OPEN, try to change to RESOLVED directly
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });
      
      expect(res.status).toBe(400);
    });
  });
});
