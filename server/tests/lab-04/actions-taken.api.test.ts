import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';

const prisma = getPrisma();

/**
 * Lab 4: Actions Taken API Tests
 * 
 * Test Coverage:
 * - POST /api/staff/tickets/:ticketNumber/actions (create action)
 * - GET /api/staff/tickets/:ticketNumber/actions (list actions)
 * - PATCH /api/staff/tickets/:ticketNumber/actions/:id (update action)
 * - Authorization enforcement
 * - Validation rules
 * 
 * Related Requirements: FR-41, FR-42, FR-43, BR-01 through BR-14
 * Test IDs: API-01 through API-12 (from tests.md)
 */

describe('Lab 4: Actions Taken API', () => {
  let itStaffCookie: string[];
  let itStaffId: number;
  let itStaff2Cookie: string[];
  let itStaff2Id: number;
  let requesterCookie: string[];
  let requesterId: number;
  let testTicketNumber: string;
  let testTicketId: number;
  let requesterTicketNumber: string;

  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const testHash = await bcrypt.hash('TestPass123!', 10);

    // Create IT Staff user 1
    const itStaff = await prisma.user.upsert({
      where: { email: 'itstaff.actions@test.com' },
      update: { passwordHash: testHash, isActive: true, role: 'IT_STAFF' },
      create: {
        name: 'IT Staff Actions',
        email: 'itstaff.actions@test.com',
        role: 'IT_STAFF',
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    itStaffId = itStaff.id;

    // Create IT Staff user 2 (for ownership tests)
    const itStaff2 = await prisma.user.upsert({
      where: { email: 'itstaff2.actions@test.com' },
      update: { passwordHash: testHash, isActive: true, role: 'IT_STAFF' },
      create: {
        name: 'IT Staff 2 Actions',
        email: 'itstaff2.actions@test.com',
        role: 'IT_STAFF',
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    itStaff2Id = itStaff2.id;

    // Create Requester user
    const requester = await prisma.user.upsert({
      where: { email: 'requester.actions@test.com' },
      update: { passwordHash: testHash, isActive: true, role: 'REQUESTER' },
      create: {
        name: 'Requester Actions',
        email: 'requester.actions@test.com',
        role: 'REQUESTER',
        passwordHash: testHash,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    requesterId = requester.id;

    // Get category and system for ticket creation
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();

    if (!category || !relatedSystem) {
      throw new Error('Test data setup failed: missing category or related system');
    }

    // Create test ticket owned by IT Staff
    const testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-TEST-ACT-001',
        requesterId: requesterId,
        ownerId: itStaffId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Test ticket for actions',
        description: 'This is a test ticket for action testing',
        requestedPriority: 'MEDIUM',
        itPriority: 'MEDIUM',
        status: 'OPEN',
      },
    });
    testTicketNumber = testTicket.ticketNumber;
    testTicketId = testTicket.id;

    // Create requester's ticket
    const requesterTicket = await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-TEST-ACT-REQ',
        requesterId: requesterId,
        ownerId: null,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        summary: 'Requester test ticket',
        description: 'This is the requester own ticket',
        requestedPriority: 'LOW',
        itPriority: 'LOW',
        status: 'NEW',
      },
    });
    requesterTicketNumber = requesterTicket.ticketNumber;

    // Login users
    const itStaffLogin = await request(app).post('/api/auth/login').send({
      email: 'itstaff.actions@test.com',
      password: 'TestPass123!',
    });
    itStaffCookie = itStaffLogin.headers['set-cookie'];

    const itStaff2Login = await request(app).post('/api/auth/login').send({
      email: 'itstaff2.actions@test.com',
      password: 'TestPass123!',
    });
    itStaff2Cookie = itStaff2Login.headers['set-cookie'];

    const requesterLogin = await request(app).post('/api/auth/login').send({
      email: 'requester.actions@test.com',
      password: 'TestPass123!',
    });
    requesterCookie = requesterLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.actionTaken.deleteMany({
      where: { ticketId: { in: [testTicketId] } },
    });
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { in: [testTicketNumber, requesterTicketNumber] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'itstaff.actions@test.com',
            'itstaff2.actions@test.com',
            'requester.actions@test.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up actions before each test
    await prisma.actionTaken.deleteMany({
      where: { ticketId: testTicketId },
    });
  });

  describe('POST /api/staff/tickets/:ticketNumber/actions', () => {
    // API-01: creates action with valid data by IT Staff
    it('API-01: creates action with valid data by IT Staff - returns 201 with action details', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Diagnosed the network connectivity issue and found DNS misconfiguration in system settings.',
          result: 'Corrected DNS settings to use company DNS servers. User now has full network access and tested successfully.',
          followUpRequired: false,
          attachmentNotes: 'Network diagnostics screenshot attached.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.ticketNumber).toBe(testTicketNumber);
      expect(res.body.data.performerId).toBe(itStaffId);
      expect(res.body.data.performerName).toBe('IT Staff Actions');
      expect(res.body.data.performerRole).toBe('IT_STAFF');
      expect(res.body.data.actionDescription).toContain('Diagnosed the network connectivity');
      expect(res.body.data.result).toContain('Corrected DNS settings');
      expect(res.body.data.followUpRequired).toBe(false);
      expect(res.body.data.followupNote).toBeNull();
      expect(res.body.data.attachmentNotes).toBe('Network diagnostics screenshot attached.');
      expect(res.body.data.actionDateTime).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });

    // API-02: rejects action creation by Requester role
    it('API-02: rejects action creation by Requester role - returns 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', requesterCookie)
        .send({
          actionDescription: 'Attempting to record action as requester',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('IT Staff');
    });

    // API-03: rejects action with invalid description
    it('API-03: rejects action with invalid description (< 10 chars) - returns 400', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Short',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toContain('description');
    });

    it('API-03b: rejects action with invalid description (> 2000 chars) - returns 400', async () => {
      const longDescription = 'A'.repeat(2001);
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: longDescription,
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toContain('description');
    });

    // API-04: rejects action with invalid result
    it('API-04: rejects action with invalid result (< 10 chars) - returns 400', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'Short',
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toContain('result');
    });

    it('API-04b: rejects action with invalid result (> 2000 chars) - returns 400', async () => {
      const longResult = 'B'.repeat(2001);
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: longResult,
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toContain('result');
    });

    // API-05: follow-up note validation
    it('API-05: rejects action with followUpRequired=true but missing followupNote - returns 400', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: true,
          // followupNote missing
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toMatch(/follow.*up.*note|followupnote/);
    });

    it('API-05b: rejects action with followupNote < 10 chars when followUpRequired=true - returns 400', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: true,
          followupNote: 'Short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toMatch(/follow.*up.*note|followupnote/);
    });

    it('API-05c: rejects action with followupNote > 500 chars - returns 400', async () => {
      const longNote = 'C'.repeat(501);
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: true,
          followupNote: longNote,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toMatch(/follow.*up.*note|followupnote/);
    });

    it('API-05d: accepts action with followUpRequired=false and no followupNote', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
          // No followupNote - should be OK
        });

      expect(res.status).toBe(201);
      expect(res.body.data.followupNote).toBeNull();
    });

    it('rejects action with attachmentNotes > 500 chars - returns 400', async () => {
      const longNotes = 'D'.repeat(501);
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
          attachmentNotes: longNotes,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      const errorDetails = JSON.stringify(res.body.error).toLowerCase();
      expect(errorDetails).toContain('attachment');
    });

    it('automatically sets performerId to authenticated user', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Testing automatic performer ID assignment from session.',
          result: 'Should use the authenticated user ID as performer, not from request body.',
          followUpRequired: false,
          performerId: 99999, // This should be ignored
        });

      expect(res.status).toBe(201);
      expect(res.body.data.performerId).toBe(itStaffId);
      expect(res.body.data.performerId).not.toBe(99999);
    });

    it('automatically sets actionDateTime to current timestamp', async () => {
      const before = new Date();
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Testing automatic timestamp assignment.',
          result: 'Should use server timestamp, not client-provided timestamp.',
          followUpRequired: false,
        });
      const after = new Date();

      expect(res.status).toBe(201);
      const actionDateTime = new Date(res.body.data.actionDateTime);
      expect(actionDateTime.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(actionDateTime.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('rejects unauthenticated request - returns 401', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('rejects request for non-existent ticket - returns 404', async () => {
      const res = await request(app)
        .post('/api/staff/tickets/TKT-9999-INVALID/actions')
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'This is a valid action description that meets the minimum length requirement.',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('trims whitespace from all text fields before validation', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: '   Testing whitespace trimming for action description field.   ',
          result: '   Testing whitespace trimming for result field.   ',
          followUpRequired: false,
          attachmentNotes: '   Trimmed notes.   ',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.actionDescription).toBe('Testing whitespace trimming for action description field.');
      expect(res.body.data.result).toBe('Testing whitespace trimming for result field.');
      expect(res.body.data.attachmentNotes).toBe('Trimmed notes.');
    });

    it('rejects empty/whitespace-only required fields - returns 400', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: '          ',
          result: 'This is a valid result that meets the minimum length requirement.',
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/staff/tickets/:ticketNumber/actions', () => {
    // API-06: returns all actions for ticket in chronological order
    it('API-06: returns all actions for ticket in chronological order - returns 200', async () => {
      // Create multiple actions with different timestamps
      const action1 = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date('2026-09-10T10:00:00Z'),
          actionDescription: 'First action performed',
          result: 'First result',
          followUpRequired: false,
        },
      });

      const action2 = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaff2Id,
          actionDateTime: new Date('2026-09-11T14:00:00Z'),
          actionDescription: 'Second action performed',
          result: 'Second result',
          followUpRequired: true,
          followupNote: 'Follow up in 2 days',
        },
      });

      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
      
      // Verify chronological order (oldest first)
      expect(res.body.data[0].id).toBe(action1.id);
      expect(res.body.data[1].id).toBe(action2.id);
      
      // Verify all fields present
      expect(res.body.data[0].performerName).toBeDefined();
      expect(res.body.data[0].performerRole).toBe('IT_STAFF');
    });

    // API-07: Requester permissions
    it('API-07: Requester cannot view actions on others tickets - returns 403', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', requesterCookie);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('IT Staff can view actions on any accessible ticket', async () => {
      // IT Staff 2 should be able to view actions on ticket owned by IT Staff 1
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date(),
          actionDescription: 'Test action for cross-staff visibility',
          result: 'Test result',
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaff2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('returns empty array when no actions exist for ticket', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(0);
    });

    it('includes performer name and role in response', async () => {
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date(),
          actionDescription: 'Test action for performer details',
          result: 'Test result',
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data[0].performerName).toBe('IT Staff Actions');
      expect(res.body.data[0].performerRole).toBe('IT_STAFF');
    });

    it('includes all action fields in response', async () => {
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date(),
          actionDescription: 'Complete action record',
          result: 'Complete result',
          followUpRequired: true,
          followupNote: 'Complete follow-up note',
          attachmentNotes: 'Complete attachment notes',
        },
      });

      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(200);
      const action = res.body.data[0];
      expect(action.id).toBeDefined();
      expect(action.ticketId).toBe(testTicketId);
      expect(action.ticketNumber).toBe(testTicketNumber);
      expect(action.performerId).toBe(itStaffId);
      expect(action.actionDateTime).toBeDefined();
      expect(action.actionDescription).toBe('Complete action record');
      expect(action.result).toBe('Complete result');
      expect(action.followUpRequired).toBe(true);
      expect(action.followupNote).toBe('Complete follow-up note');
      expect(action.attachmentNotes).toBe('Complete attachment notes');
      expect(action.createdAt).toBeDefined();
      expect(action.updatedAt).toBeDefined();
    });

    it('rejects unauthenticated request - returns 401', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`);

      expect(res.status).toBe(401);
    });

    it('rejects request for non-existent ticket - returns 404', async () => {
      const res = await request(app)
        .get('/api/staff/tickets/TKT-9999-INVALID/actions')
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(404);
    });

    it('sorts actions by actionDateTime ASC (oldest first)', async () => {
      // Create actions out of order
      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date('2026-09-13T10:00:00Z'),
          actionDescription: 'Third chronologically',
          result: 'Result 3',
          followUpRequired: false,
        },
      });

      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date('2026-09-11T10:00:00Z'),
          actionDescription: 'First chronologically',
          result: 'Result 1',
          followUpRequired: false,
        },
      });

      await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date('2026-09-12T10:00:00Z'),
          actionDescription: 'Second chronologically',
          result: 'Result 2',
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].actionDescription).toBe('First chronologically');
      expect(res.body.data[1].actionDescription).toBe('Second chronologically');
      expect(res.body.data[2].actionDescription).toBe('Third chronologically');
    });
  });

  describe('PATCH /api/staff/tickets/:ticketNumber/actions/:id', () => {
    let testActionId: number;

    beforeEach(async () => {
      // Create a fresh action for each PATCH test
      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date(),
          actionDescription: 'Original action description for testing updates',
          result: 'Original result for testing updates',
          followUpRequired: false,
        },
      });
      testActionId = action.id;
    });

    // API-08: performer can edit their own action
    it('API-08: performer can edit their own action - returns 200 with updated action', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Updated action description after further investigation',
          result: 'Updated result with additional details',
          followUpRequired: true,
          followupNote: 'New follow-up note added during edit',
          attachmentNotes: 'Updated attachment notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testActionId);
      expect(res.body.data.actionDescription).toBe('Updated action description after further investigation');
      expect(res.body.data.result).toBe('Updated result with additional details');
      expect(res.body.data.followUpRequired).toBe(true);
      expect(res.body.data.followupNote).toBe('New follow-up note added during edit');
      expect(res.body.data.attachmentNotes).toBe('Updated attachment notes');
      expect(res.body.data.performerId).toBe(itStaffId); // Should not change
    });

    // API-09: different IT Staff cannot edit another's action
    it('API-09: different IT Staff cannot edit another\'s action - returns 403', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaff2Cookie)
        .send({
          actionDescription: 'Attempting to edit someone else action',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/own action|performer/i);
    });

    it('updates actionDescription, result, followUpRequired, followupNote, attachmentNotes', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Completely new description',
          result: 'Completely new result',
          followUpRequired: true,
          followupNote: 'Completely new follow-up note',
          attachmentNotes: 'Completely new attachment notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.actionDescription).toBe('Completely new description');
      expect(res.body.data.result).toBe('Completely new result');
      expect(res.body.data.followUpRequired).toBe(true);
      expect(res.body.data.followupNote).toBe('Completely new follow-up note');
      expect(res.body.data.attachmentNotes).toBe('Completely new attachment notes');
    });

    it('does not allow changing performerId', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Testing performer ID immutability',
          result: 'Performer ID should not change',
          followUpRequired: false,
          performerId: itStaff2Id, // Attempt to change performer
        });

      expect(res.status).toBe(200);
      expect(res.body.data.performerId).toBe(itStaffId); // Should remain original
    });

    it('does not allow changing actionDateTime', async () => {
      const originalAction = await prisma.actionTaken.findUnique({
        where: { id: testActionId },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Testing action datetime immutability',
          result: 'Action datetime should not change',
          followUpRequired: false,
          actionDateTime: new Date('2020-01-01T00:00:00Z'), // Attempt to change date
        });

      expect(res.status).toBe(200);
      const updatedAction = await prisma.actionTaken.findUnique({
        where: { id: testActionId },
      });
      expect(updatedAction?.actionDateTime.getTime()).toBe(originalAction?.actionDateTime.getTime());
    });

    it('updates updatedAt timestamp automatically', async () => {
      const originalAction = await prisma.actionTaken.findUnique({
        where: { id: testActionId },
      });

      // Wait a bit to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Testing automatic timestamp update',
          result: 'Updated timestamp should reflect this change',
          followUpRequired: false,
        });

      expect(res.status).toBe(200);
      const updatedAt = new Date(res.body.data.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThan(originalAction!.updatedAt.getTime());
    });

    it('validates same rules as create (description, result, followup note)', async () => {
      // Test invalid description
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Short',
          result: 'Valid result that meets minimum length requirements',
          followUpRequired: false,
        });
      expect(res1.status).toBe(400);

      // Test invalid follow-up note
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Valid description that meets minimum length requirements',
          result: 'Valid result that meets minimum length requirements',
          followUpRequired: true,
          followupNote: 'Short',
        });
      expect(res2.status).toBe(400);
    });

    it('rejects edit by Requester role - returns 403', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .set('Cookie', requesterCookie)
        .send({
          actionDescription: 'Requester attempting to edit action',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request - returns 401', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${testActionId}`)
        .send({
          actionDescription: 'Unauthenticated edit attempt',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
    });

    it('rejects request for non-existent action - returns 404', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/99999`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Editing non-existent action',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
    });

    it('rejects request for non-existent ticket - returns 404', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/TKT-9999-INVALID/actions/${testActionId}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Editing action on non-existent ticket',
          result: 'This should not work',
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
    });

    // API-10: 24-hour edit restriction
    it('API-10: rejects edit if action is > 24 hours old - returns 403 or 409', async () => {
      // Create an old action (> 24 hours)
      const oldAction = await prisma.actionTaken.create({
        data: {
          ticketId: testTicketId,
          performerId: itStaffId,
          actionDateTime: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          actionDescription: 'Old action created more than 24 hours ago',
          result: 'This action should not be editable',
          followUpRequired: false,
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/${oldAction.id}`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Attempting to edit old action',
          result: 'This should fail',
          followUpRequired: false,
        });

      expect([403, 409]).toContain(res.status);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/24 hour|time limit|cannot.*edit/i);
    });
  });

  describe('Authorization Tests', () => {
    it('Administrator can create actions like IT Staff', async () => {
      // Create Administrator user
      const bcrypt = await import('bcrypt');
      const testHash = await bcrypt.hash('TestPass123!', 10);
      const admin = await prisma.user.upsert({
        where: { email: 'admin.actions@test.com' },
        update: { passwordHash: testHash, isActive: true, role: 'ADMINISTRATOR' },
        create: {
          name: 'Admin Actions',
          email: 'admin.actions@test.com',
          role: 'ADMINISTRATOR',
          passwordHash: testHash,
          isActive: true,
          requiresPasswordChange: false,
        },
      });

      const adminLogin = await request(app).post('/api/auth/login').send({
        email: 'admin.actions@test.com',
        password: 'TestPass123!',
      });
      const adminCookie = adminLogin.headers['set-cookie'];

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', adminCookie)
        .send({
          actionDescription: 'Administrator recording an action on the ticket',
          result: 'Action created successfully by administrator role',
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.performerRole).toBe('ADMINISTRATOR');

      // Cleanup - delete actions first, then user
      await prisma.actionTaken.deleteMany({ where: { performerId: admin.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('inactive/deactivated user cannot create actions', async () => {
      // Deactivate IT Staff user temporarily
      await prisma.user.update({
        where: { id: itStaffId },
        data: { isActive: false },
      });

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .send({
          actionDescription: 'Inactive user attempting to create action',
          result: 'This should fail',
          followUpRequired: false,
        });

      expect([401, 403]).toContain(res.status);

      // Reactivate for other tests
      await prisma.user.update({
        where: { id: itStaffId },
        data: { isActive: true },
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed ticketNumber parameter', async () => {
      // Get a fresh session first
      const freshLogin = await request(app).post('/api/auth/login').send({
        email: 'itstaff.actions@test.com',
        password: 'TestPass123!',
      });
      const freshCookie = freshLogin.headers['set-cookie'];

      const res = await request(app)
        .post('/api/staff/tickets/INVALID-FORMAT/actions')
        .set('Cookie', freshCookie)
        .send({
          actionDescription: 'Testing malformed ticket number handling',
          result: 'Should return 404 or 400',
          followUpRequired: false,
        });

      expect([400, 404]).toContain(res.status);
    });

    it('handles malformed action ID parameter', async () => {
      // Get a fresh session first
      const freshLogin = await request(app).post('/api/auth/login').send({
        email: 'itstaff.actions@test.com',
        password: 'TestPass123!',
      });
      const freshCookie = freshLogin.headers['set-cookie'];

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketNumber}/actions/not-a-number`)
        .set('Cookie', freshCookie)
        .send({
          actionDescription: 'Testing malformed action ID handling',
          result: 'Should return 404 or 400',
          followUpRequired: false,
        });

      expect([400, 404]).toContain(res.status);
    });

    it('handles invalid JSON in request body', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', itStaffCookie)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
    });

    it('returns structured error payload with field details', async () => {
      // Get a fresh session first
      const freshLogin = await request(app).post('/api/auth/login').send({
        email: 'itstaff.actions@test.com',
        password: 'TestPass123!',
      });
      const freshCookie = freshLogin.headers['set-cookie'];

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicketNumber}/actions`)
        .set('Cookie', freshCookie)
        .send({
          actionDescription: 'Short',
          result: 'Also',
          followUpRequired: true,
          // Missing followupNote
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBeDefined();
      // Should have details about multiple validation failures
      if (res.body.error.details) {
        expect(Array.isArray(res.body.error.details)).toBe(true);
      }
    });

    it('does not leak sensitive information in error messages', async () => {
      // Get a fresh session first
      const freshLogin = await request(app).post('/api/auth/login').send({
        email: 'itstaff.actions@test.com',
        password: 'TestPass123!',
      });
      const freshCookie = freshLogin.headers['set-cookie'];

      const res = await request(app)
        .post('/api/staff/tickets/TKT-9999-NONEXIST/actions')
        .set('Cookie', freshCookie)
        .send({
          actionDescription: 'Testing error message content',
          result: 'Should not reveal database details',
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
      const errorBody = JSON.stringify(res.body).toLowerCase();
      expect(errorBody).not.toContain('sql');
      expect(errorBody).not.toContain('prisma');
      expect(errorBody).not.toContain('stack');
      expect(errorBody).not.toContain('trace');
    });
  });
});
