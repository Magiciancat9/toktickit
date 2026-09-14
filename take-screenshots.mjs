import { chromium } from '@playwright/test';

const viewports = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 820, height: 1024 },
  mobile: { width: 393, height: 851 }
};

(async () => {
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  
  for (const [name, viewport] of Object.entries(viewports)) {
    console.log(`\nTaking ${name} screenshot of Create Ticket form...`);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    try {
      // Navigate to the app
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      console.log(`  - Loaded homepage`);
      
      // Wait a bit for React to render
      await page.waitForTimeout(1500);
      
      // Check if requester selector is visible
      const selectorVisible = await page.locator('select').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (selectorVisible) {
        console.log(`  - Selecting requester...`);
        await page.locator('select').first().selectOption({ index: 1 });
        await page.waitForTimeout(500);
        await page.locator('button:has-text("Continue")').click();
        await page.waitForTimeout(1500);
      }
      
      // Look for Create Ticket button
      console.log(`  - Looking for Create Ticket button...`);
      
      // On mobile, might need to open hamburger menu first
      const hamburger = page.locator('button.navbar-toggler, [aria-label="Toggle navigation"]');
      if (await hamburger.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  - Opening mobile menu...`);
        await hamburger.click();
        await page.waitForTimeout(500);
      }
      
      const createBtn = page.locator('text=Create Ticket').first();
      await createBtn.waitFor({ state: 'visible', timeout: 5000 });
      await createBtn.click();
      console.log(`  - Clicked Create Ticket`);
      
      // Wait for form to load
      await page.waitForTimeout(1500);
      await page.waitForSelector('input, select, textarea', { timeout: 5000 });
      
      // Take screenshot
      await page.screenshot({ 
        path: `create-ticket-form-${name}.png`,
        fullPage: true 
      });
      
      console.log(`✓ Saved: create-ticket-form-${name}.png`);
    } catch (error) {
      console.error(`✗ Error for ${name}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('\n✓ Done!');
})();
