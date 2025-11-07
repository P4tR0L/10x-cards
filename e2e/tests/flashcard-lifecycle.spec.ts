import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../helpers/auth";
import { deleteAllFlashcards, waitForDatabaseSync } from "../helpers/database";
import { CreateFlashcardPage } from "../page-objects/CreateFlashcardPage";
import { ReviewPage } from "../page-objects/ReviewPage";

/**
 * Critical E2E Test: Complete Flashcard Lifecycle
 *
 * Tests the most critical user journey in the application:
 * 1. User logs in
 * 2. User creates a flashcard manually
 * 3. User reviews the flashcard
 *
 * This test validates the core functionality that makes the app valuable.
 */
test.describe("Flashcard Lifecycle", () => {
  // Run tests sequentially to avoid database conflicts
  test.describe.configure({ mode: "serial" });

  // Clean up database before each test to ensure test isolation
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await deleteAllFlashcards(page);
    await waitForDatabaseSync();
  });
  test("should allow user to login, create flashcard, and review it", async ({ page }) => {
    // Arrange
    const flashcardFront = "What is the capital of Poland?";
    const flashcardBack = "Warsaw";

    // User is already logged in and database is clean (from beforeEach)
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Act 2: Create a flashcard
    const createPage = new CreateFlashcardPage(page);
    await createPage.switchToManualTab();
    await createPage.createFlashcard(flashcardFront, flashcardBack);

    // Assert 2: Success message is displayed
    await createPage.waitForSuccess();
    await expect(createPage.successMessage).toBeVisible();

    // Act 3: Navigate to review mode
    await createPage.goToReview();

    // Assert 3: Review page is loaded
    await expect(page).toHaveURL("/review");

    // Wait for loading to finish (max 10 seconds)
    await page.waitForFunction(() => !document.body.textContent?.includes("Ładowanie fiszek..."), {
      timeout: 10000,
    });

    // Act 4: Review the flashcard
    const reviewPage = new ReviewPage(page);

    // Assert 4: Flashcard content is visible
    const frontContent = await page.textContent("body");
    expect(frontContent).toContain(flashcardFront);

    // Act 5: Show answer (flip card)
    await reviewPage.showAnswer();

    // Assert 5: Back content is now visible
    await expect(reviewPage.flashcardBack).toBeVisible();
    const backContent = await reviewPage.flashcardBack.textContent();
    expect(backContent).toContain(flashcardBack);

    // Act 6: Move to next (since there's only one flashcard, button will say "Ukończ")
    await reviewPage.nextButton.click();

    // Assert 6: Review session is completed (completion screen shown)
    await expect(reviewPage.completionScreen).toBeVisible({ timeout: 5000 });
  });

  test("should display created flashcard in review mode immediately", async ({ page }) => {
    // Arrange
    const flashcardFront = "TypeScript stands for?";
    const flashcardBack = "A typed superset of JavaScript";

    // User is already logged in and database is clean (from beforeEach)
    await page.goto("/");

    // Act 1: Create flashcard
    const createPage = new CreateFlashcardPage(page);
    await createPage.switchToManualTab();
    await createPage.createFlashcard(flashcardFront, flashcardBack);
    await createPage.waitForSuccess();

    // Wait for database sync
    await waitForDatabaseSync();

    // Act 2: Navigate to review
    await page.goto("/review");

    // Wait for loading to finish
    await page.waitForFunction(() => !document.body.textContent?.includes("Ładowanie fiszek..."), {
      timeout: 10000,
    });

    // Assert: The created flashcard should be available for review
    const reviewPage = new ReviewPage(page);
    await expect(reviewPage.flashcardFront).toBeVisible();
    const frontText = await reviewPage.flashcardFront.textContent();
    expect(frontText).toContain(flashcardFront);
  });

  test("should handle multiple flashcards in review mode", async ({ page }) => {
    // Arrange
    const flashcards = [
      { front: "What is React?", back: "A JavaScript library for building UIs" },
      { front: "What is Astro?", back: "A modern static site generator" },
      { front: "What is Playwright?", back: "An E2E testing framework" },
    ];

    // User is already logged in and database is clean (from beforeEach)
    await page.goto("/");

    // Act 1: Create multiple flashcards
    const createPage = new CreateFlashcardPage(page);
    await createPage.switchToManualTab();

    for (const flashcard of flashcards) {
      await createPage.createFlashcard(flashcard.front, flashcard.back);
      await createPage.waitForSuccess();
      // Wait for success message to disappear before creating next one
      await page.waitForTimeout(500);
    }

    // Wait for database sync
    await waitForDatabaseSync();

    // Act 2: Navigate to review
    await page.goto("/review");

    // Wait for loading to finish
    await page.waitForFunction(() => !document.body.textContent?.includes("Ładowanie fiszek..."), {
      timeout: 10000,
    });

    // Assert: Progress should show 3 flashcards
    const reviewPage = new ReviewPage(page);
    const progress = await reviewPage.getProgress();
    expect(progress).toContain("3");

    // Act 3: Review first flashcard
    await reviewPage.showAnswer();

    // Navigate to next flashcard
    await reviewPage.nextButton.click();

    // Assert: Progress should update to show we're on card 2 of 3
    const updatedProgress = await reviewPage.getProgress();
    expect(updatedProgress).toContain("2");
    expect(updatedProgress).toContain("3");
  });
});
