import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
const page = await context.newPage();
await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);
await page.locator('select').first().selectOption({ index: 1 });
await page.waitForTimeout(500);
await page.locator('button:has-text("Continue")').click();
await page.waitForTimeout(2000);
const hamburger = page.locator('.navbar-toggler');
if (await hamburger.isVisible().catch(() => false)) { await hamburger.click(); await page.waitForTimeout(800); }
await page.locator('[data-testid="nav-create-ticket"]').click();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'create-ticket-form-mobile.png', fullPage: true });
console.log('Mobile screenshot saved!');
await browser.close();
