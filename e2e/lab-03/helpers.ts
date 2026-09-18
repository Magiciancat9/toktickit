import { expect, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const USERS = {
  staff: { email: "emma.rodriguez@example.com", name: "Emma Rodriguez", role: "IT_STAFF" },
  admin: { email: "admin@example.com", name: "Admin User", role: "ADMINISTRATOR" },
  requester: { email: "jennifer.anderson@example.com", name: "Jennifer Anderson", role: "REQUESTER" },
} as const;

const temporaryPassword = "TempPass123!";
const permanentPassword = "E2EPass123!";

export async function login(page: Page, user: keyof typeof USERS) {
  const account = USERS[user];
  await page.goto("/");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await page.getByLabel("Email address").fill(account.email);
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  const loginError = page.getByText("Invalid email or password");
  for (const password of [temporaryPassword, permanentPassword, "password123"]) {
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await Promise.race([
      changePassword.waitFor({ state: "visible" }),
      page.getByTestId("app-shell-nav").waitFor({ state: "visible" }),
      loginError.waitFor({ state: "visible" }),
    ]);
    if (await page.getByTestId("app-shell-nav").isVisible().catch(() => false)) return;
    if (await changePassword.isVisible().catch(() => false)) break;
  }

  if (await changePassword.isVisible().catch(() => false)) {
    await page.getByLabel("Current (temporary) password").fill(temporaryPassword);
    await page.getByLabel("New password", { exact: true }).fill(permanentPassword);
    await page.getByLabel("Confirm new password").fill(permanentPassword);
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByTestId("app-shell-nav")).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByTestId("logout-btn").click();
  await expect(page.getByLabel("Email address")).toBeVisible();
}

export async function capture(page: Page, folder: string, name: string) {
  const directory = path.join("artifacts", "lab-03", "screenshots", folder);
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true });
}

export async function openStaffTicket(page: Page, ticketNumber = "TKT-2026-000001") {
  await page.getByTestId("nav-ticket-queue").click();
  await expect(page.getByRole("heading", { name: "Ticket Queue" })).toBeVisible();
  await page.getByRole("button", { name: ticketNumber }).click();
  await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();
}

export async function openUserManagement(page: Page) {
  await page.getByTestId("nav-user-management").click();
  await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
}
