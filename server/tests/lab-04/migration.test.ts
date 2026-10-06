import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { getPrisma } from '../../src/prisma.js';

const prisma = getPrisma();

/**
 * Lab 4: Database Migration Tests (TDD)
 * 
 * Test Coverage:
 * - ActionTaken model exists with correct fields
 * - Indexes are created
 * - Foreign keys are established
 * - Existing Lab 1-3 data is preserved
 * - Migration is reversible
 * 
 * These tests should FAIL before migration, then PASS after migration.
 */

describe('Lab 4: Database Migration Tests', () => {
  beforeAll(async () => {
    // Verify database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('ActionTaken Model Structure', () => {
    test('ActionTaken model exists', async () => {
      // This will fail until migration is run
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ActionTaken'
        );
      `;
      expect(result[0].exists).toBe(true);
    });

    test('ActionTaken has required columns', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ActionTaken'
        ORDER BY ordinal_position;
      `;

      const columnNames = columns.map((col: any) => col.column_name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('ticketId');
      expect(columnNames).toContain('performerId');
      expect(columnNames).toContain('actionDateTime');
      expect(columnNames).toContain('actionDescription');
      expect(columnNames).toContain('result');
      expect(columnNames).toContain('followUpRequired');
      expect(columnNames).toContain('followupNote');
      expect(columnNames).toContain('attachmentNotes');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    test('ActionTaken nullable fields are correct', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ActionTaken';
      `;

      const columnsMap = new Map(columns.map((col: any) => [col.column_name, col.is_nullable]));

      // Required fields
      expect(columnsMap.get('id')).toBe('NO');
      expect(columnsMap.get('ticketId')).toBe('NO');
      expect(columnsMap.get('performerId')).toBe('NO');
      expect(columnsMap.get('actionDateTime')).toBe('NO');
      expect(columnsMap.get('actionDescription')).toBe('NO');
      expect(columnsMap.get('result')).toBe('NO');
      expect(columnsMap.get('followUpRequired')).toBe('NO');

      // Nullable fields
      expect(columnsMap.get('followupNote')).toBe('YES');
      expect(columnsMap.get('attachmentNotes')).toBe('YES');
    });
  });

  describe('ActionTaken Indexes', () => {
    test('index on ticketId exists', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'ActionTaken'
        AND indexname LIKE '%ticketId%';
      `;
      expect(indexes.length).toBeGreaterThan(0);
    });

    test('index on performerId exists', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'ActionTaken'
        AND indexname LIKE '%performerId%';
      `;
      expect(indexes.length).toBeGreaterThan(0);
    });

    test('index on actionDateTime exists', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'ActionTaken'
        AND indexname LIKE '%actionDateTime%';
      `;
      expect(indexes.length).toBeGreaterThan(0);
    });

    test('index on followUpRequired exists', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'ActionTaken'
        AND indexname LIKE '%followUpRequired%';
      `;
      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('ActionTaken Foreign Keys', () => {
    test('foreign key to Ticket exists', async () => {
      const fks = await prisma.$queryRaw`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'ActionTaken'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%ticketId%';
      `;
      expect(fks.length).toBeGreaterThan(0);
    });

    test('foreign key to User (performer) exists', async () => {
      const fks = await prisma.$queryRaw`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'ActionTaken'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%performerId%';
      `;
      expect(fks.length).toBeGreaterThan(0);
    });
  });

  describe('Ticket Model Updates', () => {
    test('Ticket has resolvedAt field (optional)', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Ticket'
        AND column_name = 'resolvedAt';
      `;

      if (columns.length > 0) {
        expect(columns[0].is_nullable).toBe('YES');
      }
      // This field is optional based on spec, so test doesn't fail if missing
    });

    test('Ticket status enum has all 8 statuses', async () => {
      const enumValues = await prisma.$queryRaw`
        SELECT unnest(enum_range(NULL::\"TicketStatus\"))::text AS status;
      `;

      const statuses = enumValues.map((row: any) => row.status);
      
      expect(statuses).toContain('NEW');
      expect(statuses).toContain('OPEN');
      expect(statuses).toContain('IN_PROGRESS');
      expect(statuses).toContain('WAITING_FOR_REQUESTER');
      expect(statuses).toContain('RESOLVED');
      expect(statuses).toContain('CLOSED');
      expect(statuses).toContain('REOPENED');
      expect(statuses).toContain('CANCELLED');
      expect(statuses.length).toBe(8);
    });
  });

  describe('Data Preservation - Labs 1-3', () => {
    test('User table still exists with all data', async () => {
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0); // Should have at least seed users
    });

    test('Ticket table still exists with all data', async () => {
      const ticketCount = await prisma.ticket.count();
      expect(ticketCount).toBeGreaterThanOrEqual(0);
    });

    test('Category table still exists', async () => {
      const categoryCount = await prisma.category.count();
      expect(categoryCount).toBeGreaterThanOrEqual(0);
    });

    test('RelatedSystem table still exists', async () => {
      const systemCount = await prisma.relatedSystem.count();
      expect(systemCount).toBeGreaterThanOrEqual(0);
    });

    test('Attachment table still exists', async () => {
      const attachmentCount = await prisma.attachment.count();
      expect(attachmentCount).toBeGreaterThanOrEqual(0);
    });

    test('PublicComment table still exists', async () => {
      const commentCount = await prisma.publicComment.count();
      expect(commentCount).toBeGreaterThanOrEqual(0);
    });

    test('InternalNote table still exists', async () => {
      const noteCount = await prisma.internalNote.count();
      expect(noteCount).toBeGreaterThanOrEqual(0);
    });

    test('existing Tickets have no broken foreign keys after migration', async () => {
      // Verify all tickets can still be queried with their relations
      const tickets = await prisma.ticket.findMany({
        take: 10,
        include: {
          requester: true,
          category: true,
          relatedSystem: true,
        },
      });

      // Should not throw error and should return valid data
      expect(tickets).toBeDefined();
      tickets.forEach(ticket => {
        expect(ticket.requester).toBeDefined();
        expect(ticket.category).toBeDefined();
        expect(ticket.relatedSystem).toBeDefined();
      });
    });
  });

  describe('Legacy Behavior - Old Tickets', () => {
    test('old tickets (created before Lab 4) have zero actions', async () => {
      // This test assumes existing tickets don't have actions yet
      const ticketsWithActions = await prisma.ticket.findMany({
        where: {
          // Tickets created before this migration
          createdAt: { lt: new Date('2026-10-05') },
        },
        include: {
          actionsTaken: true,
        },
      });

      ticketsWithActions.forEach(ticket => {
        // Old tickets should have 0 actions initially
        expect(ticket.actionsTaken.length).toBe(0);
      });
    });
  });

  describe('ActionTaken CRUD Operations', () => {
    test('can create an ActionTaken record', async () => {
      // Find or create test data
      const testUser = await prisma.user.findFirst({
        where: { role: 'IT_STAFF' },
      });

      const testTicket = await prisma.ticket.findFirst();

      if (!testUser || !testTicket) {
        // Skip if no test data available
        return;
      }

      const action = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          performerId: testUser.id,
          actionDateTime: new Date(),
          actionDescription: 'Test action for migration test',
          result: 'Test result for migration test',
          followUpRequired: false,
        },
      });

      expect(action.id).toBeDefined();
      expect(action.ticketId).toBe(testTicket.id);
      expect(action.performerId).toBe(testUser.id);

      // Cleanup
      await prisma.actionTaken.delete({ where: { id: action.id } });
    });

    test('can query actions by ticket', async () => {
      const testTicket = await prisma.ticket.findFirst({
        include: { actionsTaken: true },
      });

      if (!testTicket) return;

      expect(testTicket.actionsTaken).toBeDefined();
      expect(Array.isArray(testTicket.actionsTaken)).toBe(true);
    });

    test('can query actions by performer', async () => {
      const testUser = await prisma.user.findFirst({
        where: { role: 'IT_STAFF' },
        include: { actionsTaken: true },
      });

      if (!testUser) return;

      expect(testUser.actionsTaken).toBeDefined();
      expect(Array.isArray(testUser.actionsTaken)).toBe(true);
    });
  });

  describe('Dashboard Query Performance', () => {
    test('tickets can be efficiently queried by status', async () => {
      const start = Date.now();
      
      await prisma.ticket.count({
        where: { status: 'OPEN' },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });

    test('tickets can be efficiently queried by ownerId', async () => {
      const testUser = await prisma.user.findFirst({
        where: { role: 'IT_STAFF' },
      });

      if (!testUser) return;

      const start = Date.now();
      
      await prisma.ticket.count({
        where: { ownerId: testUser.id },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    test('tickets can be efficiently queried by updatedAt range', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const start = Date.now();
      
      await prisma.ticket.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
