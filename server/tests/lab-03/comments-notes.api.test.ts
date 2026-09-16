import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("Comments and Notes API", () => {
  let adminCookie: string[];
  let staffCookie: string[];
  let requesterCookie: string[];

  let testTicketNumber: string;

  beforeAll(async () => {
    const bcrypt = await import("bcrypt");
    const testHash = await bcrypt.hash("Password123!", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin.comments@example.com" },
      update: {},
      create: {
        name: "Admin Comments",
        email: "admin.comments@example.com",
        role: "ADMINISTRATOR",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const staff = await prisma.user.upsert({
      where: { email: "staff.comments@example.com" },
      update: {},
      create: {
        name: "Staff Comments",
        email: "staff.comments@example.com",
        role: "IT_STAFF",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const requester = await prisma.user.upsert({
      where: { email: "requester.comments@example.com" },
      update: {},
      create: {
        name: "Requester Comments",
        email: "requester.comments@example.com",
        role: "REQUESTER",
        passwordHash: testHash,
        isActive: true,
      }
    });

    const category = await prisma.category.upsert({
      where: { id: 888 },
      update: {},
      create: { name: "Comments Test Category" }
    });

    const relatedSystem = await prisma.relatedSystem.upsert({
      where: { id: 888 },
      update: {},
      create: { name: "Comments Test System" }
    });

    // Create a ticket for the requester
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-COMMENTS-001",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: "Test Comments Ticket",
        description: "Comments description",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "NEW",
        ownerId: null
      }
    });

    testTicketNumber = ticket.ticketNumber;

    // Login
    const adminRes = await request(app).post("/api/auth/login").send({ email: "admin.comments@example.com", password: "Password123!" });
    adminCookie = adminRes.headers["set-cookie"];

    const staffRes = await request(app).post("/api/auth/login").send({ email: "staff.comments@example.com", password: "Password123!" });
    staffCookie = staffRes.headers["set-cookie"];

    const reqRes = await request(app).post("/api/auth/login").send({ email: "requester.comments@example.com", password: "Password123!" });
    requesterCookie = reqRes.headers["set-cookie"];
  });

  afterAll(async () => {
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-COMMENTS-001" } });
    if (ticket) {
      await prisma.publicComment.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.internalNote.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.ticket.delete({ where: { id: ticket.id } });
    }
    await prisma.category.deleteMany({ where: { name: "Comments Test Category" } });
    await prisma.relatedSystem.deleteMany({ where: { name: "Comments Test System" } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin.comments@example.com", "staff.comments@example.com", "requester.comments@example.com"]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe("Public Comments", () => {
    it("should allow Requester to post a Public Comment on owned ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketNumber}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "This is a requester comment." });
      
      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe("This is a requester comment.");
    });

    it("should allow IT Staff to post a Public Comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketNumber}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: "This is an IT Staff comment." });
      
      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe("This is an IT Staff comment.");
    });

    it("should allow Requester to view Public Comments", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketNumber}/comments`)
        .set("Cookie", requesterCookie);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("should return 400 for empty Public Comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketNumber}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "   " });
      
      expect(res.status).toBe(400);
    });
  });

  describe("Internal Notes", () => {
    it("should allow IT Staff to post an Internal Note", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "This is an internal note." });
      
      expect(res.status).toBe(201);
      expect(res.body.data.note.content).toBe("This is an internal note.");
    });

    it("should allow IT Staff to view Internal Notes", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/notes`)
        .set("Cookie", staffCookie);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should reject Requester from viewing Internal Notes", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/notes`)
        .set("Cookie", requesterCookie);
      
      expect(res.status).toBe(403);
    });

    it("should reject Requester from posting Internal Notes", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/notes`)
        .set("Cookie", requesterCookie)
        .send({ content: "I should not be able to do this." });
      
      expect(res.status).toBe(403);
    });

    it("should return 400 for empty Internal Note", async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/notes`)
        .set("Cookie", staffCookie)
        .send({ content: "   " });
      
      expect(res.status).toBe(400);
    });
  });
});
