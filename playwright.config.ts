import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Lab 2 E2E and responsive screenshot tests.
 * Requires both servers running before executing:
 *   - Backend:  cd server && npm run dev   (http://localhost:3000)
 *   - Frontend: cd client && npm run dev   (http://localhost:5173)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 2,
  workers: 2,
  reporter: [
    ["list"],
    ["html", { outputFolder: "artifacts/lab-02/playwright-report", open: "never" }],
  ],

  use: {
    baseURL:    "http://localhost:5173",
    trace:      "on-first-retry",
    screenshot: "only-on-failure",
    video:      "off",
  },

  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 820, height: 1024 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 393, height: 851 },
      },
    },
  ],
});
