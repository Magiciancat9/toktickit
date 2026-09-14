import { chromium } from '@playwright/test';
console.log("Starting mobile screenshot with JS navigation...");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
const page = await context.newPage();

await page.goto("http://localhost:5173");
await page.waitForTimeout(2000);
console.log("Selecting requester...");
await page.locator("select").first().selectOption({ index: 1 });
await page.waitForTimeout(500);
await page.locator("button:has-text(\"Continue\")").click();
await page.waitForTimeout(2000);

console.log("Triggering navigation via JavaScript...");
// Directly call the React state setter or trigger button click via JS
await page.evaluate(() => {
  const btn = document.querySelector("[data-testid=\"nav-create-ticket\"]");
  if (btn) btn.click();
});
await page.waitForTimeout(2000);

await page.waitForSelector("input, select, textarea", { timeout: 5000 });
console.log("Form loaded, taking screenshot...");

await page.screenshot({ path: "create-ticket-form-mobile.png", fullPage: true });
console.log("✓ Mobile screenshot saved!");
await browser.close();
