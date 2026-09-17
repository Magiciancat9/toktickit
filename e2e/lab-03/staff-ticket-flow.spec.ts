import { test, expect } from "@playwright/test";
import { capture, login, logout, openStaffTicket } from "./helpers";

test.describe("LAB3 IT staff ticket workflow", () => {
  test.beforeEach(async ({ page }) => login(page, "staff"));

  test("E2E-08 through E2E-12: searches, filters, operates, and communicates on a ticket", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Ticket Queue" })).toBeVisible();
    await capture(page, "staff-queue", "loaded-desktop");
    const search = page.getByPlaceholder("Search by ticket number or summary...");
    await search.fill("TKT-2026-000001");
    await expect(page.getByRole("button", { name: "TKT-2026-000001" })).toBeVisible();
    await capture(page, "staff-queue", "searched-desktop");
    await page.locator("select").filter({ hasText: "IT Priority: All" }).selectOption("HIGH");
    await page.locator("select").filter({ hasText: "All Statuses" }).selectOption("NEW");
    await capture(page, "staff-queue", "filtered-desktop");

    await page.getByRole("button", { name: "Clear Filters" }).first().click();
    await expect(page.getByRole("button", { name: "TKT-2026-000001" })).toBeVisible();
    await page.getByRole("button", { name: "TKT-2026-000001" }).click();
    await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();
    await capture(page, "staff-ticket-detail", "initial-desktop");
    const ownerValue = await page.getByTestId("owner-select").locator("option").nth(1).getAttribute("value");
    expect(ownerValue).toBeTruthy();
    await page.getByTestId("owner-select").selectOption(ownerValue!);
    await expect(page.getByTestId("owner-select")).toHaveValue(/\d+/);
    await capture(page, "staff-ticket-detail", "owner-dropdown-desktop");
    await page.getByTestId("it-priority-select").selectOption("MEDIUM");
    await expect(page.getByTestId("it-priority-select")).toHaveValue("MEDIUM");
    await capture(page, "staff-ticket-detail", "priority-dropdown-desktop");
    await page.getByTestId("status-select").selectOption("OPEN");
    await expect(page.getByTestId("status-select")).toHaveValue("OPEN");
    await capture(page, "staff-ticket-detail", "status-dropdown-desktop");
    await page.getByTestId("comment-input").fill("E2E public comment from IT staff");
    await page.getByTestId("post-comment-button").click();
    await expect(page.getByTestId(/comment-/).filter({ hasText: "E2E public comment from IT staff" }).first()).toBeVisible();
    await capture(page, "staff-ticket-detail", "public-comments-desktop");
    await page.getByTestId("note-input").fill("E2E internal note for staff only");
    await page.getByTestId("post-note-button").click();
    await expect(page.getByTestId(/note-/).filter({ hasText: "E2E internal note for staff only" }).first()).toBeVisible();
    await expect(page.getByText("IT STAFF ONLY")).toBeVisible();
    await capture(page, "staff-ticket-detail", "internal-notes-desktop");
    await capture(page, "staff-ticket-detail", "attachments-desktop");
  });

  test("E2E-13: requester cannot see internal notes", async ({ page }) => {
    await logout(page);
    await login(page, "admin");
    const usersResponse = await page.request.get("http://localhost:3000/api/admin/users");
    const usersBody = await usersResponse.json();
    const requester = (usersBody.data ?? usersBody).find((user: { email: string }) => user.email === "jennifer.anderson@example.com");
    expect(requester).toBeTruthy();
    const resetResponse = await page.request.post(`http://localhost:3000/api/admin/users/${requester.id}/reset-password`, {
      data: { newPassword: "TempPass123!" },
    });
    expect(resetResponse.status()).toBe(200);
    await logout(page);
    await login(page, "staff");
    await openStaffTicket(page);
    await page.getByTestId("note-input").fill("private verification note");
    await page.getByTestId("post-note-button").click();
    await expect(page.getByTestId(/note-/).filter({ hasText: "private verification note" }).first()).toBeVisible();
    await logout(page);
    await login(page, "requester");
    await page.getByTestId("nav-my-tickets").click();
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await page.getByText("TKT-2026-000001").first().click();
    await expect(page.getByText("Internal Notes")).not.toBeVisible();
    await expect(page.getByText("IT STAFF ONLY")).not.toBeVisible();
  });

  test("VIS-02: captures queue and ticket detail at tablet and mobile widths", async ({ page }) => {
    for (const [name, viewport] of [
      ["loaded-tablet", { width: 768, height: 1024 }],
      ["loaded-mobile", { width: 393, height: 851 }],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.getByTestId("nav-ticket-queue").click();
      await expect(page.getByRole("heading", { name: "Ticket Queue" })).toBeVisible();
      await capture(page, "staff-queue", name);
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await openStaffTicket(page);
    await capture(page, "staff-ticket-detail", "initial-tablet");
    await page.setViewportSize({ width: 393, height: 851 });
    await capture(page, "staff-ticket-detail", "initial-mobile");
  });
});
