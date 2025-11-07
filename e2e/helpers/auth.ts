import { type Page } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";

/**
 * Authentication helper utilities for E2E tests
 */

/**
 * Login with test user credentials from .env.test
 * Uses E2E_USERNAME and E2E_PASSWORD environment variables
 */
export async function loginAsTestUser(page: Page) {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_USERNAME and E2E_PASSWORD must be set in .env.test file"
    );
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  // Login method now handles navigation wait
}

/**
 * Login with custom credentials
 */
export async function loginUser(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await loginPage.waitForSuccess();
}
