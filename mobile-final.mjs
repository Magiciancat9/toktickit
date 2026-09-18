import { chromium } from '@playwright/test';
console.log("Starting mobile screenshot...");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
const page = await context.newPage();

// Navigate and select requester
await page.goto("http://localhost:5173");
await page.waitForTimeout(2000);
console.log("Selecting requester...");
await page.locator("select").first().selectOption({ index: 1 });
await page.waitForTimeout(500);
await page.locator("button:has-text(\"Continue\")").click();
await page.waitForTimeout(2000);

// Force click the Create Ticket button even if hidden
console.log("Clicking Create Ticket button (force)...");
await page.locator("[data-testid=\"nav-create-ticket\"]").click({ force: true });
await page.waitForTimeout(2000);

// Wait for form elements to appear
await page.waitForSelector("input, select, textarea", { timeout: 5000 });
console.log("Form loaded, taking screenshot...");

await page.screenshot({ path: "create-ticket-form-mobile.png", fullPage: true });
console.log("✓ Mobile screenshot saved!");
await browser.close();
