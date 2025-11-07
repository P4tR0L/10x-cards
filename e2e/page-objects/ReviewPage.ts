import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object for Review page (/review)
 *
 * Encapsulates flashcard review interactions following POM pattern
 */
export class ReviewPage {
  readonly page: Page;
  readonly flashcardFront: Locator;
  readonly flashcardBack: Locator;
  readonly showAnswerButton: Locator;
  readonly progressText: Locator;
  readonly completionScreen: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.flashcardFront = page.getByTestId("flashcard-front");
    this.flashcardBack = page.getByTestId("flashcard-back");
    // The card itself is clickable to flip
    this.showAnswerButton = page.getByTestId("flashcard-front");
    // Polish: "Fiszka 1 z 3", English: "Card 1 of 3" or "1/3"
    // Use .first() to skip sr-only element and get the visible one
    this.progressText = page.locator("text=/Fiszka \\d+ z \\d+|Card \\d+ of \\d+|\\d+\\/\\d+/").first();
    this.completionScreen = page.getByTestId("completion-screen");
    this.nextButton = page.getByTestId("review-next-button");
    this.previousButton = page.getByTestId("review-previous-button");
  }

  /**
   * Show answer for current flashcard (flip the card)
   */
  async showAnswer() {
    await this.showAnswerButton.click();
  }

  /**
   * Get current progress (e.g., "Fiszka 1 z 3")
   */
  async getProgress(): Promise<string> {
    return (await this.progressText.textContent()) || "";
  }

  /**
   * Check if completion screen is visible
   */
  async isCompleted(): Promise<boolean> {
    return await this.completionScreen.isVisible();
  }
}
