import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';

const prisma = getPrisma();

/**
 * Lab 4: Ticket Resolution Workflow Tests
 * 
 * Test Coverage:
 * - Resolution blocking when actions have followUpRequired=true (API-11)
 * - Resolution allowing when all followUpRequired=false (API-12)
 * - Status transition validation with resolution prerequisite
 * - Complete status transition matrix validation (allowed and disallowed)
 * - Role-based authorization for status transitions
 * 
 * Related Requirements: FR-11 through FR-17, BR-21 through BR-26
 */

describe('Lab 4: Ticket Resolution Workflow', () => {
  let itStaffCookie: string[];
  let requesterCookie: string[];
  let itStaffId: number;
  let requesterId: number;
  let testTicketNumber: string;
  let testTicketId: number;

  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const testHash = await bcrypt.hash('TestPass123!', 10);

    // Create IT Staff user
    const itStaff = await prisma.user.upsert({
      where: { email: 'itstaff.workflow@test.com' },
      update: { passwordHash: testHash, isActive: true, role: 'IT_STAFF' },
      create: {
        name: 'IT Staff Workflow',
        email: 'itstaff.workflow@test.com',
        role: 'IT_STAFF',
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    itStaffId = itStaff.id;

    // Create Requester user
    const requester = await prisma.user.upsert({
      where: { email: 'requester.workflow@test.com' },
      update: { passwordHash: testHash, isActive: true, role: 'REQUESTER' },
      create: {
        name: 'Requester Workflow',
        email: 'requester.workflow@test.com',
        role: 'REQUESTER',
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    requesterId = requester.id;

    // Get category and system
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();

    if (!category || !relatedSystem) {
      throw new Error('Test data setup failed: missing category or related system');
    }

    // Create test ticket
    const testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-TEST-WORKFLOW-001',
        requesterId: requesterId,
        ownerId: itStaffId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Test ticket for resolution workflow',
        description: 'Testing resolution validation',
        requestedPriority: 'MEDIUM',
        itPriority: 'MEDIUM',
        status: 'IN_PROGRESS',
      },
    });
    testTicketNumber = testTicket.ticketNumber;
    testTicketId = testTicket.id;

    // Login IT Staff
    const itStaffLogin = await request(app).post('/api/auth/login').send({
      email: 'itstaff.workflow@test.com',
      password: 'TestPass123!',
    });
    itStaffCookie = itStaffLogin.headers['set-cookie'];

    // Login Requester
    const requesterLogin = await request(app).post('/api/auth/login').send({
      email: 'requester.workflow@test.com',
      password: 'TestPass123!',
    });
    requesterCookie = requesterLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    // Clean up
    await prisma.actionTaken.deleteMany({
      where: { ticketId: testTicketId },
    });
    await prisma.ticket.deleteMany({
      where: { ticketNumber: testTicketNumber },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['itstaff.workflow@test.com', 'requester.workflow@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset ticket status and actions
    await prisma.actionTaken.deleteMany({
      where: { ticketId: testTicketId },
    });
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { status: 'IN_PROGRESS', resolvedAt: null },
    });
  });

  describe('Resolution Blocking - Incomplete Follow-Ups', () => {
    // API-11: cannot resolve ticket with followUpRequired=true
    it('API-11: cannot resolve ticket with any action having followUpRequired=true - returns 409 Conflict', async () => {
      // Create action with follow-up required
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Performed initial troubleshooting steps',
          result: 'Issue partially resolved, requires follow-up',
          followUpRequired: true,
          followupNote: 'Check with user in 2 days to confirm resolution',
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('unresolved follow-up');
    });

    it('API-11b: error message references incomplete follow-ups and includes details', async () => {
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Action requiring follow-up',
          result: 'Needs verification',
          followUpRequired: true,
          followupNote: 'Verify with user in 3 days',
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(409);
      expect(res.body.error.details).toBeDefined();
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.length).toBeGreaterThan(0);
      expect(res.body.error.details[0].actionId).toBeDefined();
      expect(res.body.error.details[0].followupNote).toBe('Verify with user in 3 days');
    });

    it('blocks resolution when at least one action has followUpRequired=true (multiple actions)', async () => {
      // Create multiple actions, only one requiring follow-up
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'First action - complete',
          result: 'No follow-up needed',
          followUpRequired: false,
        },
      });

      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Second action - needs follow-up',
          result: 'Requires verification',
          followUpRequired: true,
          followupNote: 'Follow up required',
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(409);
    });

    it('status remains unchanged after blocked resolution attempt', async () => {
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Action requiring follow-up',
          result: 'Needs follow-up',
          followUpRequired: true,
          followupNote: 'Follow up in 2 days',
        },
      });

      await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      // Verify status hasn't changed
      const ticket = await prisma.ticket.findUnique({
        where: { id: testTicketId },
        select: { status: true },
      });

      expect(ticket?.status).toBe('IN_PROGRESS');
    });

    it('other status transitions are not blocked by incomplete actions', async () => {
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Action requiring follow-up',
          result: 'Needs follow-up',
          followUpRequired: true,
          followupNote: 'Follow up in 2 days',
        },
      });

      // Should be able to transition to WAITING_FOR_REQUESTER even with incomplete actions
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'WAITING_FOR_REQUESTER' });

      expect(res.status).toBe(200);
    });
  });

  describe('Resolution Allowing - All Follow-Ups Complete', () => {
    // API-12: allows resolution when all followUpRequired=false
    it('API-12: allows resolution when all actions have followUpRequired=false - returns 200', async () => {
      // Create actions with no follow-up required
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Completed action without follow-up',
          result: 'Issue fully resolved',
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe('RESOLVED');
    });

    it('allows resolution when ticket has no actions', async () => {
      // No actions on the ticket
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe('RESOLVED');
    });

    it('allows resolution when follow-ups were marked complete (edited from true to false)', async () => {
      // Create action with follow-up required, then update it to false
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDescription: 'Action that was updated',
          result: 'Follow-up completed',
          followUpRequired: true,
          followupNote: 'Was needed but now complete',
        },
      });

      // Update to no longer require follow-up
      await prisma.actionTaken.update({
        where: { id: action.id },
        data: { followUpRequired: false },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
    });

    it('status changes to RESOLVED successfully', async () => {
      await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      const ticket = await prisma.ticket.findUnique({
        where: { id: testTicketId },
        select: { status: true },
      });

      expect(ticket?.status).toBe('RESOLVED');
    });

    it('resolvedAt timestamp is set', async () => {
      const before = new Date();

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      const after = new Date();

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.resolvedAt).toBeDefined();
      
      const resolvedAt = new Date(res.body.data.ticket.resolvedAt);
      expect(resolvedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(resolvedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('updatedAt timestamp is updated', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.updatedAt).toBeDefined();
    });
  });

  describe('Status Transition Matrix - Allowed Transitions', () => {
    const transitionMatrix = [
      // From NEW
      { from: 'NEW', to: 'OPEN', shouldWork: true },
      { from: 'NEW', to: 'CANCELLED', shouldWork: true },
      { from: 'NEW', to: 'IN_PROGRESS', shouldWork: false },
      { from: 'NEW', to: 'RESOLVED', shouldWork: false },
      
      // From OPEN
      { from: 'OPEN', to: 'IN_PROGRESS', shouldWork: true },
      { from: 'OPEN', to: 'CANCELLED', shouldWork: true },
      { from: 'OPEN', to: 'RESOLVED', shouldWork: false },
      { from: 'OPEN', to: 'WAITING_FOR_REQUESTER', shouldWork: false },
      
      // From IN_PROGRESS
      { from: 'IN_PROGRESS', to: 'WAITING_FOR_REQUESTER', shouldWork: true },
      { from: 'IN_PROGRESS', to: 'RESOLVED', shouldWork: true },
      { from: 'IN_PROGRESS', to: 'CANCELLED', shouldWork: true },
      { from: 'IN_PROGRESS', to: 'OPEN', shouldWork: false },
      
      // From WAITING_FOR_REQUESTER
      { from: 'WAITING_FOR_REQUESTER', to: 'IN_PROGRESS', shouldWork: true },
      { from: 'WAITING_FOR_REQUESTER', to: 'RESOLVED', shouldWork: true },
      { from: 'WAITING_FOR_REQUESTER', to: 'CANCELLED', shouldWork: true },
      { from: 'WAITING_FOR_REQUESTER', to: 'OPEN', shouldWork: false },
      
      // From RESOLVED
      { from: 'RESOLVED', to: 'CLOSED', shouldWork: true },
      { from: 'RESOLVED', to: 'REOPENED', shouldWork: true },
      { from: 'RESOLVED', to: 'IN_PROGRESS', shouldWork: false },
      
      // From CLOSED
      { from: 'CLOSED', to: 'REOPENED', shouldWork: true },
      { from: 'CLOSED', to: 'IN_PROGRESS', shouldWork: false },
      { from: 'CLOSED', to: 'RESOLVED', shouldWork: false },
      
      // From REOPENED
      { from: 'REOPENED', to: 'OPEN', shouldWork: true },
      { from: 'REOPENED', to: 'IN_PROGRESS', shouldWork: true },
      { from: 'REOPENED', to: 'RESOLVED', shouldWork: true },
      { from: 'REOPENED', to: 'CANCELLED', shouldWork: true },
      { from: 'REOPENED', to: 'WAITING_FOR_REQUESTER', shouldWork: false },
      
      // From CANCELLED (terminal)
      { from: 'CANCELLED', to: 'OPEN', shouldWork: false },
      { from: 'CANCELLED', to: 'RESOLVED', shouldWork: false },
    ];

    transitionMatrix.forEach(({ from, to, shouldWork }) => {
      it(`${from} → ${to}: ${shouldWork ? 'allowed' : 'blocked'}`, async () => {
        // Set ticket to 'from' status
        await prisma.ticket.update({
          where: { id: testTicketId },
          data: { status: from as any },
        });

        const res = await request(app)
          .patch(`/api/staff/tickets/${testTicketNumber}/status`)
          .set('Cookie', itStaffCookie)
          .send({ status: to });

        if (shouldWork) {
          expect(res.status).toBe(200);
          expect(res.body.data.ticket.status).toBe(to);
        } else {
          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('INVALID_TRANSITION');
          expect(res.body.error.message).toContain('Invalid status transition');
        }
      });
    });
  });

  describe('Authorization - Requester Cannot Change Status', () => {
    it('Requester cannot change ticket status - returns 403', async () => {
      await prisma.ticket.update({
        where: { id: testTicketId },
        data: { status: 'OPEN' },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', requesterCookie)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Unauthenticated user cannot change status - returns 401', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(401);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('Invalid status value returns 400', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Missing status in request body returns 400', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it('Nonexistent ticket returns 404', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/TKT-9999-NONEXISTENT/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'OPEN' });

      expect(res.status).toBe(404);
    });

    it('Case insensitive status values work', async () => {
      await prisma.ticket.update({
        where: { id: testTicketId },
        data: { status: 'NEW' },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/status`)
        .set('Cookie', itStaffCookie)
        .send({ status: 'open' }); // lowercase

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe('OPEN');
    });
  });
});