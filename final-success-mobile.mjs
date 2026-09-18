import { chromium } from '@playwright/test';
console.log("Creating success-mobile.png...");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 851 } });
const page = await context.newPage();

await page.goto("http://localhost:5173");
await page.waitForTimeout(3000);

// Check if selector is visible
const selectorVisible = await page.locator("select").first().isVisible({ timeout: 2000 }).catch(() => false);
if (selectorVisible) {
  console.log("Selecting requester...");
  await page.locator("select").first().selectOption({ index: 1 });
  await page.waitForTimeout(500);
  await page.locator("button:has-text(\"Continue\")").click();
  await page.waitForTimeout(2000);
}

// Navigate to Create Ticket
console.log("Going to Create Ticket...");
await page.evaluate(() => {
  const btn = document.querySelector("[data-testid=\"nav-create-ticket\"]") || 
               document.querySelector("button:contains(\"Create Ticket\")");
  if (btn) btn.click();
});
await page.waitForTimeout(2000);

// Wait for form
await page.waitForSelector("[data-testid=\"create-ticket-form\"]", { timeout: 5000 });
console.log("Form loaded, filling it out...");

// Fill form fields by finding them more reliably
await page.evaluate(() => {
  const selects = document.querySelectorAll("select");
  if (selects[0]) selects[0].selectedIndex = 1; // Category
  if (selects[1]) selects[1].selectedIndex = 1; // Related System
  
  const mediumRadio = document.querySelector("input[value=\"MEDIUM\"]");
  if (mediumRadio) mediumRadio.click();
  
  const summary = document.querySelector("input[type=\"text\"]");
  if (summary) summary.value = "Mobile success screenshot test";
  
  const desc = document.querySelector("textarea");
  if (desc) desc.value = "Detailed description for mobile success screenshot with sufficient length to pass validation.";
});
await page.waitForTimeout(1000);

// Submit
console.log("Submitting...");
await page.locator("button:has-text(\"Submit\")").click();
await page.waitForTimeout(4000);

await page.waitForSelector("text=successfully", { timeout: 10000 });
console.log("Taking screenshot...");

await page.screenshot({ path: "success-mobile.png", fullPage: true });
console.log("✓ success-mobile.png saved!");
await browser.close();
