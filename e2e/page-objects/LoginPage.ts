import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object for Login page (/login)
 *
 * Encapsulates login form interactions following POM pattern
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email");
    this.passwordInput = page.getByTestId("login-password");
    this.submitButton = page.getByTestId("login-submit");
    this.errorMessage = page.locator('[role="alert"]');
    this.registerLink = page.locator('a[href="/register"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Fill and submit login form
   */
  async login(email: string, password: string) {
    // Wait for form to be fully hydrated (React client:load)
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible" });

    // Simple fill - Playwright should handle React events correctly with data-testid
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Wait briefly for React Hook Form validation
    await this.page.waitForTimeout(300);

    // Click submit button and wait for navigation
    await this.submitButton.click();
    await this.page.waitForURL("/", { timeout: 15000 });
  }

  /**
   * Wait for successful login (redirected to home page)
   */
  async waitForSuccess() {
    await this.page.waitForURL("/");
  }
}
