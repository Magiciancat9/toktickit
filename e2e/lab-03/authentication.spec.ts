import { test, expect } from "@playwright/test";
import { capture, login, logout, openUserManagement, USERS } from "./helpers";

test.describe("LAB3 authentication", () => {
  test("E2E-01: logs in with role-appropriate landing pages", async ({ page }) => {
    await login(page, "staff");
    await expect(page.getByTestId("nav-ticket-queue")).toBeVisible();
    await expect(page.getByTestId("user-role-badge")).toContainText("IT STAFF");
  });

  test("E2E-02: requires and completes the first-login password change", async ({ page }) => {
    const email = `first-login-${Date.now()}@example.com`;
    await login(page, "admin");
    await openUserManagement(page);
    await page.getByRole("button", { name: /Create User/ }).click();
    await page.getByLabel("Full Name").fill("First Login E2E User");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Role").selectOption("REQUESTER");
    await page.getByLabel("Initial Password").fill("TempPass123!");
    await page.getByRole("button", { name: "Save User" }).click();
    await expect(page.getByText(email).first()).toBeVisible();
    await logout(page);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("TempPass123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("heading", { name: "Change Your Password" })).toBeVisible();
    await capture(page, "authentication", "change-password-desktop");
    await page.getByLabel("Current (temporary) password").fill("TempPass123!");
    await page.getByLabel("New password", { exact: true }).fill("E2EPass123!");
    await page.getByLabel("Confirm new password").fill("E2EPass123!");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByTestId("app-shell-nav")).toBeVisible();
  });

  test("E2E-03: rejects invalid credentials without leaking account state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email address").fill("does-not-exist@example.com");
    await page.getByLabel("Password", { exact: true }).fill("WrongPass123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await capture(page, "authentication", "invalid-login-desktop");
  });

  test("E2E-04: returns the authenticated user from /api/auth/me", async ({ page, request }) => {
    await login(page, "staff");
    const cookies = await page.context().cookies();
    const response = await request.get("http://localhost:3000/api/auth/me", {
      headers: { Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ") },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).data.user).toMatchObject({ email: USERS.staff.email, role: USERS.staff.role });
  });

  test("E2E-05: logout clears the UI session and blocks protected APIs", async ({ page, request }) => {
    await login(page, "staff");
    await logout(page);
    const response = await request.get("http://localhost:3000/api/staff/tickets");
    expect(response.status()).toBe(401);
  });

  test("VIS-01: captures the login screen at desktop, tablet, and mobile widths", async ({ page }) => {
    await page.goto("/");
    for (const [name, viewport] of [
      ["login-desktop", { width: 1280, height: 800 }],
      ["login-tablet", { width: 768, height: 1024 }],
      ["login-mobile", { width: 375, height: 667 }],
    ] as const) {
      await page.setViewportSize(viewport);
      await expect(page.getByLabel("Email address")).toBeVisible();
      await capture(page, "authentication", name);
    }
  });
});
