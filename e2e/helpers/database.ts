import type { Page } from "@playwright/test";

/**
 * Database helper utilities for E2E tests
 */

/**
 * Delete all flashcards for the authenticated user
 * This should be called in test setup/teardown to ensure test isolation
 */
export async function deleteAllFlashcards(page: Page) {
  // Get auth token from localStorage
  const token = await page.evaluate(() => localStorage.getItem("supabase_auth_token"));

  if (!token) {
    console.warn("No auth token found, skipping flashcard cleanup");
    return;
  }

  // Get all flashcards (paginate if needed)
  let allFlashcards: any[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await page.request.get(
      `/api/flashcards?page=${currentPage}&limit=100&sort=created_at&order=asc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok()) {
      const errorText = await response.text().catch(() => "");
      console.warn(`Failed to fetch flashcards for cleanup: ${response.status()} - ${errorText}`);
      break;
    }

    const data = await response.json();
    const flashcards = data.data || [];
    allFlashcards = [...allFlashcards, ...flashcards];

    hasMore = data.pagination?.has_next || false;
    currentPage++;

    // Safety check to prevent infinite loop
    if (currentPage > 100) {
      console.warn("Hit maximum page limit during cleanup");
      break;
    }
  }

  // Delete each flashcard
  for (const flashcard of allFlashcards) {
    await page.request.delete(`/api/flashcards/${flashcard.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  console.log(`✓ Cleaned up ${allFlashcards.length} flashcards`);
}

/**
 * Wait for database operation to complete
 * Sometimes there's a small delay between API response and data being available
 */
export async function waitForDatabaseSync(ms: number = 500) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

