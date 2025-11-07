import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables only in local environment
// In CI, environment variables come from GitHub Actions secrets
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, ".env.test") });
}

/**
 * Playwright E2E Testing Configuration
 *
 * Following best practices:
 * - Chromium only (as per project guidelines)
 * - Browser contexts for test isolation
 * - Proper timeouts and retries
 */
export default defineConfig({
  testDir: "./e2e/tests",

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html"], ["list"]],

  // Shared settings for all projects
  use: {
    // Base URL for tests - use separate port to avoid conflicts with dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on first retry
    video: "retain-on-failure",
  },

  // Configure projects for major browsers (Chromium only as per guidelines)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before starting the tests (optional)
  webServer: {
    // In CI: use environment variables from secrets
    // Locally: load .env.test via dotenv-cli
    command: process.env.CI ? "npx astro dev --port 3001" : "npx dotenv -e .env.test -- npx astro dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
