import { test, expect } from "@playwright/test";
import { capture, login, openUserManagement } from "./helpers";

test.describe("LAB3 administrator user management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin");
    await openUserManagement(page);
  });

  test("E2E-18 and E2E-19: lists and searches users", async ({ page }) => {
    await expect(page.getByText("admin@example.com").first()).toBeVisible();
    await page.getByPlaceholder("Search by name or email...").fill("emma.rodriguez");
    await expect(page.getByText("emma.rodriguez@example.com").first()).toBeVisible();
    await expect(page.getByText("admin@example.com").first()).not.toBeVisible();
  });

  test("E2E-20 and E2E-21: creates a user with exactly one role", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.getByRole("button", { name: /Create User/ }).click();
    await expect(page.getByRole("heading", { name: "Create New User" })).toBeVisible();
    await page.getByLabel("Full Name").fill("E2E Created User");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Role").selectOption("IT_STAFF");
    await page.getByLabel("Initial Password").fill("TempE2EPass123!");
    await expect(page.getByLabel("Role")).toHaveValue("IT_STAFF");
    await page.getByRole("button", { name: "Save User" }).click();
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("E2E-22 and E2E-24: edits a user and protects self-deactivation", async ({ page }) => {
    const row = page.locator("tr", { hasText: "emma.rodriguez@example.com" });
    await row.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Full Name").fill("Emma Rodriguez Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Emma Rodriguez Updated").first()).toBeVisible();
    const ownRow = page.locator("tr", { hasText: "admin@example.com" });
    await ownRow.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByLabel("Active")).toBeDisabled();
    await expect(page.getByText("You cannot deactivate your own account.")).toBeVisible();
  });

  test("E2E-25: backend protects the last active administrator", async ({ page }) => {
    const usersResponse = await page.request.get("http://localhost:3000/api/admin/users");
    const usersBody = await usersResponse.json();
    const administrators = (usersBody.data ?? usersBody).filter((user: { role: string; isActive: boolean }) => user.role === "ADMINISTRATOR" && user.isActive);
    expect(administrators.length).toBeGreaterThan(0);
    const response = await page.request.patch(`http://localhost:3000/api/admin/users/${administrators[0].id}`, { data: { isActive: false } });
    expect([403, 409]).toContain(response.status());
  });

  test("VIS-03: captures user management list, create, and validation states", async ({ page }) => {
    await capture(page, "user-management", "list-desktop");
    await page.setViewportSize({ width: 768, height: 1024 });
    await capture(page, "user-management", "list-tablet");
    await page.setViewportSize({ width: 393, height: 851 });
    await capture(page, "user-management", "list-mobile");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: /Create User/ }).click();
    await capture(page, "user-management", "create-user-desktop");
    await page.getByLabel("Full Name").fill("Invalid");
    await page.getByLabel("Email Address").fill("not-an-email");
    await page.getByRole("button", { name: "Save User" }).click();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await capture(page, "user-management", "validation-desktop");
  });
});
