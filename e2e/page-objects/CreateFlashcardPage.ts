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
    this.manualTab = page.getByTestId("manual-tab");
    this.frontTextarea = page.getByTestId("flashcard-front-input");
    this.backTextarea = page.getByTestId("flashcard-back-input");
    this.submitButton = page.getByTestId("flashcard-submit-button");
    this.successMessage = page.getByTestId("flashcard-success-message");
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
