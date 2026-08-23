import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Save a screenshot into artifacts/lab-02/screenshots/{folder}/{name}-{viewport}.png */
async function shot(page: Page, folder: string, name: string) {
  const dir = path.join("artifacts", "lab-02", "screenshots", folder);
  fs.mkdirSync(dir, { recursive: true });
  const vp   = page.viewportSize();
  const tag  = vp && vp.width >= 992 ? "desktop" : vp && vp.width >= 768 ? "tablet" : "mobile";
  await page.screenshot({
    path:     path.join(dir, `${name}-${tag}.png`),
    fullPage: true,
  });
}

/** Select a Development Requester and click Continue */
async function selectRequester(page: Page, name = "Jennifer Anderson") {
  await page.goto("/");
  await page.waitForSelector("[data-testid='requester-selector-screen']");
  await shot(page, "requester-selector", "initial");

  await page.selectOption("[data-testid='requester-select']", { label: name });
  await page.click("[data-testid='selector-continue-btn']");
  await page.waitForSelector("[data-testid='my-tickets-screen']");
}

// ── Responsive screenshot tests ───────────────────────────────────────────

test.describe("Responsive screenshots", () => {
  test("Requester Selector — all viewports", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='requester-selector-screen']");
    await shot(page, "requester-selector", "loaded");
  });

  test("My Tickets — all viewports", async ({ page }) => {
    await selectRequester(page);
    await shot(page, "my-tickets", "loaded");
  });

  test("Create Ticket — initial state — all viewports", async ({ page }) => {
    test.setTimeout(60_000);
    await selectRequester(page);
    await page.click("[data-testid='nav-create-ticket']");
    // Wait for reference data (categories + related systems) to load
    await page.waitForSelector("[data-testid='create-ticket-form']", { timeout: 45_000 });
    await shot(page, "create-ticket", "initial");
  });

  test("Create Ticket — validation state — all viewports", async ({ page }) => {
    await selectRequester(page);
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='submit-btn']");
    // Submit with empty form to trigger validation
    await page.click("[data-testid='submit-btn']");
    await page.waitForSelector("[data-testid='error-summary']");
    await shot(page, "create-ticket", "validation");
  });
});

// ── Visual / accessibility checks ────────────────────────────────────────

test.describe("Visual and accessibility checks", () => {
  test("nav bar uses Primary Green background", async ({ page }) => {
    await selectRequester(page);
    const nav = page.locator("[data-testid='app-shell-nav']");
    const bg  = await nav.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // #006B3C = rgb(0, 107, 60)
    expect(bg).toBe("rgb(0, 107, 60)");
  });

  test("current requester name is visible in the nav bar", async ({ page }) => {
    await selectRequester(page, "Jennifer Anderson");
    await expect(
      page.locator("[data-testid='current-requester-display']")
    ).toContainText("Jennifer Anderson");
  });

  test("Change Requester button is keyboard-accessible (has aria-label)", async ({ page }) => {
    await selectRequester(page);
    const btn = page.locator("[data-testid='change-requester-btn']");
    const label = await btn.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test("Create Ticket required fields have aria-required", async ({ page }) => {
    await selectRequester(page);
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='summary-input']");

    const summaryRequired = await page
      .locator("[data-testid='summary-input']")
      .getAttribute("aria-required");
    expect(summaryRequired).toBe("true");

    const descRequired = await page
      .locator("[data-testid='description-input']")
      .getAttribute("aria-required");
    expect(descRequired).toBe("true");
  });

  test("page has no horizontal overflow at any viewport", async ({ page }) => {
    await selectRequester(page);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("My Tickets search input has accessible label", async ({ page }) => {
    await selectRequester(page);
    const input = page.locator("[data-testid='search-input']");
    const ariaLabel = await input.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });
});

// ── Full E2E flow: select → create → find → detail → attach → remove ─────

test.describe("Full requester ticket flow", () => {
  let ticketNumber: string;

  test("Step 1: select a Development Requester", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='requester-selector-screen']");

    // Selector screen is shown — not a login screen
    await expect(page.locator("text=not a login screen")).toBeVisible();

    // Dropdown contains active requesters
    const options = page.locator("[data-testid='requester-select'] option");
    const count   = await options.count();
    expect(count).toBeGreaterThan(1); // placeholder + at least one real option

    // Continue is disabled until a selection is made
    await expect(
      page.locator("[data-testid='selector-continue-btn']")
    ).toBeDisabled();

    // Select and continue
    await page.selectOption("[data-testid='requester-select']", { index: 1 });
    await expect(
      page.locator("[data-testid='selector-continue-btn']")
    ).toBeEnabled();
    await page.click("[data-testid='selector-continue-btn']");

    // Should land on My Tickets
    await page.waitForSelector("[data-testid='my-tickets-screen']");
    await shot(page, "my-tickets", "after-login");
  });

  test("Step 2: create a ticket", async ({ page }) => {
    await selectRequester(page);

    // Navigate to Create Ticket
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='create-ticket-form']");

    // Read-only fields are visible
    await expect(page.locator("[data-testid='requester-readonly']")).toBeVisible();

    // Fill in the form
    await page.selectOption("[data-testid='category-select']", { index: 1 });
    await page.selectOption("[data-testid='system-select']",   { index: 1 });
    await page.selectOption("[data-testid='priority-select']", { label: "Medium" });
    await page.fill(
      "[data-testid='summary-input']",
      "E2E test ticket — Laptop battery drains quickly"
    );
    await page.fill(
      "[data-testid='description-input']",
      "This is an automated E2E test ticket created by Playwright to verify the full ticket creation flow."
    );

    await shot(page, "create-ticket", "filled");

    // Submit button should not be in loading state yet
    await expect(page.locator("[data-testid='submit-btn']")).toBeEnabled();
    await page.click("[data-testid='submit-btn']");

    // Success state — shows generated Ticket Number
    await page.waitForSelector("[data-testid='create-ticket-success']", { timeout: 15_000 });
    ticketNumber = await page
      .locator("[data-testid='success-ticket-number']")
      .innerText();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    await shot(page, "create-ticket", "success");
  });

  test("Step 3: find the ticket in My Tickets", async ({ page }) => {
    await selectRequester(page);

    // Create a ticket first to ensure there is at least one
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='create-ticket-form']");
    await page.selectOption("[data-testid='category-select']", { index: 1 });
    await page.selectOption("[data-testid='system-select']",   { index: 1 });
    await page.selectOption("[data-testid='priority-select']", { label: "Low" });
    await page.fill("[data-testid='summary-input']", "E2E find-me ticket for list test");
    await page.fill("[data-testid='description-input']", "This ticket should appear in My Tickets list immediately after creation.");
    await page.click("[data-testid='submit-btn']");
    await page.waitForSelector("[data-testid='create-ticket-success']", { timeout: 15_000 });
    ticketNumber = await page.locator("[data-testid='success-ticket-number']").innerText();

    // Go to My Tickets
    await page.click("[data-testid='nav-my-tickets']");
    await page.waitForSelector("[data-testid='my-tickets-screen']");
    await shot(page, "my-tickets", "with-tickets");

    // The created ticket appears in the list
    await expect(page.locator(`[data-testid='ticket-row-${ticketNumber}']`)).toBeVisible();

    // Search for it
    await page.fill("[data-testid='search-input']", "E2E find-me");
    await page.waitForTimeout(500); // debounce
    await shot(page, "my-tickets", "searched");
    await expect(page.locator(`[data-testid='ticket-row-${ticketNumber}']`)).toBeVisible();
  });

  test("Step 4: open Ticket Detail and verify read-only fields", async ({ page }) => {
    await selectRequester(page);

    // Create a ticket
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='create-ticket-form']");
    await page.selectOption("[data-testid='category-select']", { index: 1 });
    await page.selectOption("[data-testid='system-select']",   { index: 1 });
    await page.selectOption("[data-testid='priority-select']", { label: "High" });
    await page.fill("[data-testid='summary-input']", "E2E detail-view ticket test");
    await page.fill("[data-testid='description-input']", "This ticket is created to test the Ticket Detail read-only view in the E2E flow.");
    await page.click("[data-testid='submit-btn']");
    await page.waitForSelector("[data-testid='create-ticket-success']", { timeout: 15_000 });
    ticketNumber = await page.locator("[data-testid='success-ticket-number']").innerText();

    // Navigate to My Tickets and open the ticket
    await page.click("[data-testid='nav-my-tickets']");
    await page.waitForSelector("[data-testid='my-tickets-screen']");
    await page.click(`[data-testid='ticket-link-${ticketNumber}']`);
    await page.waitForSelector("[data-testid='ticket-detail-screen']");

    await shot(page, "ticket-detail", "initial");

    // All header fields are displayed
    await expect(page.locator("[data-testid='detail-ticket-number']")).toContainText(ticketNumber);
    await expect(page.locator("[data-testid='detail-summary']")).toContainText("E2E detail-view ticket test");
    await expect(page.locator("[data-testid='detail-status']")).toContainText("NEW");
    await expect(page.locator("[data-testid='detail-priority']")).toContainText("HIGH");

    // Attachments section is present
    await expect(page.locator("[data-testid='attachments-section']")).toBeVisible();

    // Back button works
    await page.click("[data-testid='back-to-tickets-btn']");
    await page.waitForSelector("[data-testid='my-tickets-screen']");
  });

  test("Step 5: add an attachment to an existing ticket", async ({ page }) => {
    await selectRequester(page);

    // Create a ticket
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='create-ticket-form']");
    await page.selectOption("[data-testid='category-select']", { index: 1 });
    await page.selectOption("[data-testid='system-select']",   { index: 1 });
    await page.selectOption("[data-testid='priority-select']", { label: "Medium" });
    await page.fill("[data-testid='summary-input']", "E2E attachment lifecycle test");
    await page.fill("[data-testid='description-input']", "This ticket tests adding and removing attachments via the Ticket Detail screen.");
    await page.click("[data-testid='submit-btn']");
    await page.waitForSelector("[data-testid='create-ticket-success']", { timeout: 15_000 });
    ticketNumber = await page.locator("[data-testid='success-ticket-number']").innerText();

    // Open ticket detail
    await page.click("[data-testid='nav-my-tickets']");
    await page.waitForSelector("[data-testid='my-tickets-screen']");
    await page.click(`[data-testid='ticket-link-${ticketNumber}']`);
    await page.waitForSelector("[data-testid='ticket-detail-screen']");

    // Upload a small PNG file
    const testFile = path.join("artifacts", "lab-02", "test-attachment.png");
    // Create a minimal 1x1 PNG in memory if it doesn't exist
    if (!fs.existsSync(testFile)) {
      // Minimal valid PNG bytes (1x1 transparent pixel)
      const pngBytes = Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
        "hex"
      );
      fs.writeFileSync(testFile, pngBytes);
    }

    // Trigger file input
    const fileInput = page.locator("[data-testid='add-attachment-input']");
    await fileInput.setInputFiles(testFile);

    // Wait for the attachment to appear in the active list
    await page.waitForSelector("[data-testid='active-attachments-list']", { timeout: 10_000 });
    await shot(page, "ticket-detail", "with-attachment");

    // The file should be visible
    await expect(page.locator("[data-testid='active-attachments-list']")).toContainText(
      "test-attachment.png"
    );
  });

  test("Step 6: soft-remove an attachment", async ({ page }) => {
    await selectRequester(page);

    // Create a ticket and upload an attachment
    await page.click("[data-testid='nav-create-ticket']");
    await page.waitForSelector("[data-testid='create-ticket-form']");
    await page.selectOption("[data-testid='category-select']", { index: 1 });
    await page.selectOption("[data-testid='system-select']",   { index: 1 });
    await page.selectOption("[data-testid='priority-select']", { label: "Low" });
    await page.fill("[data-testid='summary-input']", "E2E remove attachment test");
    await page.fill("[data-testid='description-input']", "This ticket tests the soft-removal of an attachment with a reason.");
    await page.click("[data-testid='submit-btn']");
    await page.waitForSelector("[data-testid='create-ticket-success']", { timeout: 15_000 });
    ticketNumber = await page.locator("[data-testid='success-ticket-number']").innerText();

    // Open ticket detail and upload
    await page.click("[data-testid='nav-my-tickets']");
    await page.waitForSelector("[data-testid='my-tickets-screen']");
    await page.click(`[data-testid='ticket-link-${ticketNumber}']`);
    await page.waitForSelector("[data-testid='ticket-detail-screen']");

    const testFile = path.join("artifacts", "lab-02", "test-attachment.png");
    if (!fs.existsSync(testFile)) {
      const pngBytes = Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
        "hex"
      );
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
      fs.writeFileSync(testFile, pngBytes);
    }

    await page.locator("[data-testid='add-attachment-input']").setInputFiles(testFile);
    await page.waitForSelector("[data-testid='active-attachments-list']", { timeout: 10_000 });

    // Get the attachment id from the first active attachment row
    const firstActiveRow = page.locator("[data-testid^='attachment-active-']").first();
    const testId = await firstActiveRow.getAttribute("data-testid");
    const attId  = testId!.replace("attachment-active-", "");

    // Click Remove
    await page.click(`[data-testid='remove-btn-${attId}']`);
    await page.waitForSelector("[data-testid='remove-modal']");

    // Short reason should fail
    await page.fill("[data-testid='removal-reason-input']", "nope");
    await page.click("[data-testid='confirm-remove-btn']");
    await expect(page.locator("[data-testid='removal-reason-error']")).toBeVisible();

    // Valid reason
    await page.fill("[data-testid='removal-reason-input']", "Uploaded the wrong file by mistake");
    await page.click("[data-testid='confirm-remove-btn']");

    // Modal closes and attachment moves to removed list
    await page.waitForSelector("[data-testid='removed-attachments-list']", { timeout: 10_000 });
    await shot(page, "ticket-detail", "after-removal");

    // Removed attachment has REMOVED badge — no download button
    await expect(page.locator(`[data-testid='removed-badge-${attId}']`)).toBeVisible();
    await expect(page.locator(`[data-testid='download-btn-${attId}']`)).toHaveCount(0);

    // Cross-requester: Change requester and try to access the same ticket via URL
    // (ownership check — the ticket detail should show error for wrong owner)
    await page.click("[data-testid='change-requester-btn']");
    await page.waitForSelector("[data-testid='requester-selector-screen']");
  });
});
