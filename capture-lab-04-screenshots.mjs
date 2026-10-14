/**
 * Lab 4: Screenshot Capture Script
 * Captures screenshots of Requester Dashboard, Staff Dashboard, and Actions Taken modal
 * at desktop (1280px), tablet (768px), and mobile (375px) viewports
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'artifacts/lab-04/screenshots';

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

// Ensure directory exists
async function ensureDir(path) {
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

// Helper to take screenshot
async function takeScreenshot(page, path) {
  await ensureDir(path);
  await page.screenshot({ path, fullPage: false });
  console.log(`✓ Screenshot saved: ${path}`);
}

// Wait for dashboard to load
async function waitForDashboard(page) {
  await page.waitForSelector('.dashboard-grid, .metric-card', { timeout: 10000 });
  await page.waitForTimeout(1000); // Allow animations to settle
}

// Login helper
async function login(page, username, password) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(500);
  
  // Fill login form
  await page.fill('input[type="text"], input[name="username"]', username);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
}

// Capture Requester Dashboard screenshots
async function captureRequesterDashboard(browser) {
  console.log('\n📊 Capturing Requester Dashboard screenshots...');
  
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    try {
      // Login as requester
      await login(page, 'requester1', 'password123');
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/requester-dashboard`);
      await waitForDashboard(page);
      
      // Capture loaded state
      await takeScreenshot(
        page, 
        `${OUTPUT_DIR}/requester-dashboard/loaded-${viewportName}.png`
      );
      
      console.log(`  ✓ Requester Dashboard (${viewportName})`);
      
    } catch (error) {
      console.error(`  ✗ Error capturing Requester Dashboard (${viewportName}):`, error.message);
    } finally {
      await context.close();
    }
  }
}

// Capture Staff Dashboard screenshots
async function captureStaffDashboard(browser) {
  console.log('\n📊 Capturing Staff Dashboard screenshots...');
  
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    try {
      // Login as IT staff
      await login(page, 'staff1', 'password123');
      
      // Navigate to staff dashboard
      await page.goto(`${BASE_URL}/staff-dashboard`);
      await waitForDashboard(page);
      
      // Capture loaded state
      await takeScreenshot(
        page, 
        `${OUTPUT_DIR}/staff-dashboard/loaded-${viewportName}.png`
      );
      
      console.log(`  ✓ Staff Dashboard (${viewportName})`);
      
    } catch (error) {
      console.error(`  ✗ Error capturing Staff Dashboard (${viewportName}):`, error.message);
    } finally {
      await context.close();
    }
  }
}

// Capture Actions Taken modal screenshots
async function captureActionsTaken(browser) {
  console.log('\n📝 Capturing Actions Taken modal screenshots...');
  
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    try {
      // Login as IT staff
      await login(page, 'staff1', 'password123');
      
      // Navigate to ticket queue
      await page.goto(`${BASE_URL}/staff-ticket-queue`);
      await page.waitForSelector('.ticket-list-item, .ticket-row', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Click first ticket to open detail view
      await page.click('.ticket-list-item:first-child, .ticket-row:first-child a');
      await page.waitForTimeout(1500);
      
      // Click "Record Action" or "Actions Taken" button
      const actionButton = await page.locator('button:has-text("Record Action"), button:has-text("Actions Taken"), button:has-text("Add Action")').first();
      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.waitForTimeout(1000);
        
        // Capture modal initial state
        await takeScreenshot(
          page, 
          `${OUTPUT_DIR}/actions-taken/initial-${viewportName}.png`
        );
        
        // Fill form
        await page.fill('textarea[name="actionText"], textarea[id*="action"]', 'Investigated the issue and identified the root cause. Working on a solution.');
        
        // Check follow-up required
        const followUpCheckbox = page.locator('input[type="checkbox"][name*="followUp"], input[type="checkbox"][id*="followUp"]');
        if (await followUpCheckbox.isVisible()) {
          await followUpCheckbox.check();
        }
        
        await page.waitForTimeout(500);
        
        // Capture filled state
        await takeScreenshot(
          page, 
          `${OUTPUT_DIR}/actions-taken/filled-${viewportName}.png`
        );
        
        console.log(`  ✓ Actions Taken Modal (${viewportName})`);
      } else {
        console.log(`  ⚠ Actions Taken button not found (${viewportName})`);
      }
      
    } catch (error) {
      console.error(`  ✗ Error capturing Actions Taken (${viewportName}):`, error.message);
    } finally {
      await context.close();
    }
  }
}

// Capture empty state screenshots
async function captureEmptyStates(browser) {
  console.log('\n📭 Capturing empty state screenshots...');
  
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  
  try {
    // Login as a user with no tickets
    await login(page, 'requester2', 'password123');
    
    // Go to My Tickets (should be empty for requester2)
    await page.goto(`${BASE_URL}/my-tickets`);
    await page.waitForTimeout(2000);
    
    // Capture empty state
    await takeScreenshot(
      page, 
      `${OUTPUT_DIR}/requester-dashboard/empty-desktop.png`
    );
    
    console.log(`  ✓ Empty State (desktop)`);
    
  } catch (error) {
    console.error(`  ✗ Error capturing empty state:`, error.message);
  } finally {
    await context.close();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Lab 4 screenshot capture...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  console.log('⚠️  Make sure both servers are running:');
  console.log('   Backend:  cd server && npm run dev');
  console.log('   Frontend: cd client && npm run dev\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    await captureRequesterDashboard(browser);
    await captureStaffDashboard(browser);
    await captureActionsTaken(browser);
    await captureEmptyStates(browser);
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('\n❌ Error during screenshot capture:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
