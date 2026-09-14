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

// Navigate to Create Ticket
console.log("Going to Create Ticket...");
await page.evaluate(() => {
  document.querySelector("[data-testid=\"nav-create-ticket\"]").click();
});
await page.waitForTimeout(2000);

// Fill out the form
console.log("Filling form...");
await page.locator("select[name=\"categoryId\"], select").nth(0).selectOption({ index: 1 });
await page.waitForTimeout(300);
await page.locator("select[name=\"relatedSystemId\"], select").nth(1).selectOption({ index: 1 });
await page.waitForTimeout(300);

// Fill priority (look for radio buttons or select)
const priorityRadio = page.locator("input[value=\"MEDIUM\"]");
if (await priorityRadio.isVisible().catch(() => false)) {
  await priorityRadio.click();
} else {
  await page.locator("select").nth(2).selectOption("MEDIUM");
}
await page.waitForTimeout(300);

// Fill summary and description
await page.locator("input[name=\"summary\"], input[type=\"text\"]").first().fill("Mobile test ticket for screenshot");
await page.waitForTimeout(300);
await page.locator("textarea").fill("This is a detailed description for the mobile success screenshot. It contains enough text to meet the minimum character requirement.");
await page.waitForTimeout(500);

// Submit the form
console.log("Submitting form...");
await page.locator("button:has-text(\"Submit\")").click();
await page.waitForTimeout(3000);

// Wait for success message
await page.waitForSelector(".alert-success, [class*=\"success\"]", { timeout: 10000 });
console.log("Success state loaded, taking screenshot...");

await page.screenshot({ path: "success-mobile.png", fullPage: true });
console.log("✓ success-mobile.png saved!");
await browser.close();
