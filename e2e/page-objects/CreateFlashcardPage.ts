import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object for Create Flashcard page (/)
 *
 * Encapsulates flashcard creation interactions following POM pattern
 */
export class CreateFlashcardPage {
  readonly page: Page;
  readonly manualTab: Locator;
  readonly frontTextarea: Locator;
  readonly backTextarea: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly reviewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.manualTab = page.locator('button[role="tab"]', { hasText: "Dodaj własne" });
    this.frontTextarea = page.locator("textarea#front");
    this.backTextarea = page.locator("textarea#back");
    this.submitButton = page.locator('button[type="submit"]', { hasText: /Dodaj fiszkę/ });
    this.successMessage = page.locator('[role="status"]');
    this.reviewButton = page.locator('a[href="/review"]');
  }

  /**
   * Switch to manual tab
   */
  async switchToManualTab() {
    await this.manualTab.click();
  }

  /**
   * Create a flashcard manually
   */
  async createFlashcard(front: string, back: string) {
    await this.frontTextarea.fill(front);
    await this.backTextarea.fill(back);
    await this.submitButton.click();
  }

  /**
   * Wait for flashcard creation success
   */
  async waitForSuccess() {
    await this.successMessage.waitFor({ state: "visible" });
  }

  /**
   * Navigate to review mode
   */
  async goToReview() {
    await this.reviewButton.click();
  }
}
