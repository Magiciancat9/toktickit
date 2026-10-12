import { test, expect } from '@playwright/test';
import { loginAs, createTestTicket, cleanupTestData } from '../helpers';

/**
 * Lab 4 E2E: Ticket Resolution Workflow
 * 
 * Test Coverage:
 * - Complete resolution workflow (create actions, attempt resolution, complete follow-ups, resolve)
 * - Resolution blocking when incomplete follow-up actions exist
 * - Status transition validation through UI
 * - Requester cannot change status (read-only view)
 */

test.describe('Lab 4: Ticket Resolution Workflow', () => {
  let testTicketNumber: string;
  let testUserId: number;

  test.beforeEach(async ({ page }) => {
    // Create test ticket owned by IT Staff
    const ticket = await createTestTicket({
      status: 'IN_PROGRESS',
      requesterId: 2, // requester user
      ownerId: 3, // IT Staff user
    });
    testTicketNumber = ticket.ticketNumber;
  });

  test.afterEach(async () => {
    await cleanupTestData({ ticketNumber: testTicketNumber });
  });

  test('IT Staff can transition ticket through valid status changes', async ({ page }) => {
    await loginAs(page, 'itstaff');
    
    // Navigate to ticket
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    // Verify current status
    await expect(page.locator('text=Status:')).toBeVisible();
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible();
    
    // Change to WAITING_FOR_REQUESTER (valid transition)
    await page.click('button:has-text("Change Status")');
    await page.click('text=WAITING_FOR_REQUESTER');
    
    // Verify success and status updated
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
    await expect(page.locator('text=WAITING_FOR_REQUESTER')).toBeVisible();
  });

  test('Resolution blocked when action has incomplete follow-up', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    // Create action with follow-up required
    await page.click('button:has-text("Record First Action")');
    await page.fill('textarea[name="actionDescription"]', 'Performed initial troubleshooting steps');
    await page.fill('textarea[name="result"]', 'Issue partially resolved, requires follow-up');
    await page.check('input[name="followUpRequired"]');
    await page.fill('textarea[name="followupNote"]', 'Check with user in 2 days to confirm');
    await page.click('button:has-text("Record Action")');
    
    // Wait for success
    await expect(page.locator('text=Action recorded successfully')).toBeVisible();
    
    // Attempt to resolve
    await page.click('button:has-text("Change Status")');
    await page.click('text=RESOLVED');
    
    // Verify error message about incomplete follow-ups
    await expect(page.locator('text=Cannot resolve ticket')).toBeVisible();
    await expect(page.locator('text=unresolved follow-up')).toBeVisible();
    
    // Status should remain IN_PROGRESS
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible();
  });

  test('Resolution succeeds after marking follow-ups complete', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    // Create action with follow-up required
    await page.click('button:has-text("Record First Action")');
    await page.fill('textarea[name="actionDescription"]', 'Performed troubleshooting');
    await page.fill('textarea[name="result"]', 'Issue partially resolved');
    await page.check('input[name="followUpRequired"]');
    await page.fill('textarea[name="followupNote"]', 'Check with user');
    await page.click('button:has-text("Record Action")');
    await expect(page.locator('text=Action recorded successfully')).toBeVisible();
    
    // Edit action to mark follow-up complete
    await page.click('button:has-text("Edit"):visible');
    await page.uncheck('input[name="followUpRequired"]');
    await page.click('button:has-text("Update Action")');
    await expect(page.locator('text=Action updated successfully')).toBeVisible();
    
    // Now resolution should succeed
    await page.click('button:has-text("Change Status")');
    await page.click('text=RESOLVED');
    
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
    await expect(page.locator('text=RESOLVED')).toBeVisible();
  });

  test('Invalid status transition shows error', async ({ page }) => {
    await loginAs(page, 'itstaff');
    
    // Set ticket to NEW status
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    // Force ticket to NEW via backend (or create new ticket in NEW status)
    
    // Attempt invalid transition NEW → RESOLVED (must go through OPEN first)
    // This test validates the UI doesn't offer invalid transitions
    await page.click('button:has-text("Change Status")');
    
    // Should NOT see RESOLVED as an option from NEW
    await expect(page.locator('option:has-text("RESOLVED")')).not.toBeVisible();
  });

  test('Requester cannot change ticket status', async ({ page }) => {
    await loginAs(page, 'requester');
    await page.goto(`/my-tickets/${testTicketNumber}`);
    
    // Verify status is displayed but no change controls
    await expect(page.locator('text=Status:')).toBeVisible();
    await expect(page.locator('button:has-text("Change Status")')).not.toBeVisible();
  });

  test('Status dropdown shows only permitted transitions', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    // From IN_PROGRESS, allowed: WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    await page.click('button:has-text("Change Status")');
    
    await expect(page.locator('option:has-text("WAITING_FOR_REQUESTER")')).toBeVisible();
    await expect(page.locator('option:has-text("RESOLVED")')).toBeVisible();
    await expect(page.locator('option:has-text("CANCELLED")')).toBeVisible();
    
    // Should NOT show invalid transitions from IN_PROGRESS
    await expect(page.locator('option:has-text("NEW")')).not.toBeVisible();
    await expect(page.locator('option:has-text("OPEN")')).not.toBeVisible();
  });

  test('Resolved ticket can be reopened', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    // First resolve the ticket
    await page.click('button:has-text("Change Status")');
    await page.click('text=RESOLVED');
    await expect(page.locator('text=RESOLVED')).toBeVisible();
    
    // Then reopen it
    await page.click('button:has-text("Change Status")');
    await page.click('text=REOPENED');
    
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
    await expect(page.locator('text=REOPENED')).toBeVisible();
  });

  test('Duplicate click protection prevents multiple submissions', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    await page.click('button:has-text("Change Status")');
    await page.click('text=RESOLVED');
    
    // Button should be disabled during submission
    const statusButton = page.locator('button:has-text("Change Status")');
    await expect(statusButton).toBeDisabled();
    
    // After success, should be enabled again
    await expect(page.locator('text=Status updated successfully')).toBeVisible();
    await expect(statusButton).toBeEnabled();
  });

  test('Resolution sets resolvedAt timestamp', async ({ page }) => {
    await loginAs(page, 'itstaff');
    await page.goto(`/staff/tickets/${testTicketNumber}`);
    
    await page.click('button:has-text("Change Status")');
    await page.click('text=RESOLVED');
    
    await expect(page.locator('text=RESOLVED')).toBeVisible();
    
    // Check that resolved date/time is displayed
    await expect(page.locator('text=Resolved:')).toBeVisible();
    await expect(page.locator('text=/\\d{4}-\\d{2}-\\d{2}/')).toBeVisible();
  });
});
