/**
 * Lab 4: Screenshot Generation E2E Tests
 * Captures screenshots for dashboards and Actions Taken modal at multiple viewports
 * Run with: npx playwright test e2e/lab-04-screenshots.spec.ts --project=desktop
 */

import { test, expect } from '@playwright/test';

test.describe('Lab 4: Requester Dashboard Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Login as requester
    await page.goto('/');
    await page.fill('input[type="text"]', 'requester1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('capture requester dashboard loaded state', async ({ page }, testInfo) => {
    await page.goto('/requester-dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('.dashboard-grid')).toBeVisible();
    await expect(page.locator('.metric-card')).toHaveCount(4);
    await page.waitForTimeout(1000);
    
    // Capture screenshot
    const viewportName = testInfo.project.name; // desktop, tablet, or mobile
    await page.screenshot({ 
      path: `artifacts/lab-04/screenshots/requester-dashboard/loaded-${viewportName}.png`,
      fullPage: false
    });
  });

  test('capture requester dashboard empty state', async ({ page }, testInfo) => {
    // Login as user with no tickets
    await page.goto('/');
    await page.fill('input[type="text"]', 'requester2');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    await page.goto('/my-tickets');
    await page.waitForTimeout(2000);
    
    // Capture screenshot (only desktop for empty state)
    if (testInfo.project.name === 'desktop') {
      await page.screenshot({ 
        path: `artifacts/lab-04/screenshots/requester-dashboard/empty-desktop.png`,
        fullPage: false
      });
    }
  });
});

test.describe('Lab 4: Staff Dashboard Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Login as IT staff
    await page.goto('/');
    await page.fill('input[type="text"]', 'staff1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('capture staff dashboard loaded state', async ({ page }, testInfo) => {
    await page.goto('/staff-dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('.dashboard-grid')).toBeVisible();
    await expect(page.locator('.metric-card').first()).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Capture screenshot
    const viewportName = testInfo.project.name;
    await page.screenshot({ 
      path: `artifacts/lab-04/screenshots/staff-dashboard/loaded-${viewportName}.png`,
      fullPage: false
    });
  });
});

test.describe('Lab 4: Actions Taken Modal Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Login as IT staff
    await page.goto('/');
    await page.fill('input[type="text"]', 'staff1');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Navigate to ticket queue and open first ticket
    await page.goto('/staff-ticket-queue');
    await page.waitForSelector('.ticket-list-item, .ticket-row');
    await page.click('.ticket-list-item:first-child a, .ticket-row:first-child a');
    await page.waitForTimeout(1500);
  });

  test('capture actions taken modal initial state', async ({ page }, testInfo) => {
    // Open Actions Taken modal
    const actionButton = page.locator('button:has-text("Record Action"), button:has-text("Actions Taken"), button:has-text("Add Action")').first();
    await actionButton.click();
    await page.waitForTimeout(1000);
    
    // Verify modal is visible
    await expect(page.locator('.modal-overlay, .modal')).toBeVisible();
    
    // Capture screenshot
    const viewportName = testInfo.project.name;
    await page.screenshot({ 
      path: `artifacts/lab-04/screenshots/actions-taken/initial-${viewportName}.png`,
      fullPage: false
    });
  });

  test('capture actions taken modal filled state', async ({ page }, testInfo) => {
    // Open Actions Taken modal
    const actionButton = page.locator('button:has-text("Record Action"), button:has-text("Actions Taken"), button:has-text("Add Action")').first();
    await actionButton.click();
    await page.waitForTimeout(1000);
    
    // Fill form
    await page.fill('textarea[name="actionText"], textarea[id*="action"]', 
      'Investigated the issue and identified the root cause. Working on a solution.');
    
    // Check follow-up required if visible
    const followUpCheckbox = page.locator('input[type="checkbox"][name*="followUp"], input[type="checkbox"][id*="followUp"]');
    if (await followUpCheckbox.isVisible()) {
      await followUpCheckbox.check();
    }
    
    await page.waitForTimeout(500);
    
    // Capture screenshot
    const viewportName = testInfo.project.name;
    await page.screenshot({ 
      path: `artifacts/lab-04/screenshots/actions-taken/filled-${viewportName}.png`,
      fullPage: false
    });
  });
});
