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
    this.emailInput = page.locator("input#email");
    this.passwordInput = page.locator("input#password");
    this.submitButton = page.locator('button[type="submit"]');
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
    // Wait for form to be ready
    await this.emailInput.waitFor({ state: "visible" });

    // Type email - this triggers React onChange properly
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    // Type password - this triggers React onChange properly
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Wait a bit for React to update state
    await this.page.waitForTimeout(500);

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
