import { chromium } from '@playwright/test';
console.log("Creating success-mobile.png...");
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

// Navigate to Create Ticket using JS
console.log("Going to Create Ticket...");
await page.evaluate(() => {
  document.querySelector("[data-testid=\"nav-create-ticket\"]").click();
});
await page.waitForTimeout(2000);

// Fill out the form
console.log("Filling form...");
const selects = await page.locator("select").all();
await selects[0].selectOption({ index: 1 }); // Category
await page.waitForTimeout(300);
await selects[1].selectOption({ index: 1 }); // Related System
await page.waitForTimeout(300);

// Priority - try radio buttons first, then select
try {
  await page.locator("input[value=\"MEDIUM\"]").click({ timeout: 2000 });
} catch {
  await selects[2].selectOption("MEDIUM");
}
await page.waitForTimeout(300);

// Fill summary and description
await page.locator("input[name=\"summary\"]").fill("Mobile screenshot test ticket");
await page.waitForTimeout(300);
await page.locator("textarea").fill("This is a detailed description for the mobile success state screenshot. It contains enough characters to pass validation requirements.");
await page.waitForTimeout(500);

// Submit the form
console.log("Submitting form...");
await page.locator("button:has-text(\"Submit\")").click();
await page.waitForTimeout(4000);

// Wait for success banner
await page.waitForSelector(".alert-success, [class*=\"success\"], text=Ticket created successfully", { timeout: 10000 });
console.log("Success state visible, taking screenshot...");
await page.waitForTimeout(1000);

await page.screenshot({ path: "success-mobile.png", fullPage: true });
console.log("✓ success-mobile.png saved!");
await browser.close();
