import type { Page } from "@playwright/test";

/**
 * Database helper utilities for E2E tests
 */

interface FlashcardData {
  id: number;
  front: string;
  back: string;
  source: string;
  generation_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Delete all flashcards for the authenticated user
 * This should be called in test setup/teardown to ensure test isolation
 */
export async function deleteAllFlashcards(page: Page) {
  // Get auth token from localStorage
  const token = await page.evaluate(() => localStorage.getItem("supabase_auth_token"));

  if (!token) {
    // No auth token - skip cleanup silently
    return;
  }

  // Get all flashcards (paginate if needed)
  let allFlashcards: FlashcardData[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await page.request.get(`/api/flashcards?page=${currentPage}&limit=100&sort=created_at&order=asc`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok()) {
      // Failed to fetch - skip this batch
      break;
    }

    const data = await response.json();
    const flashcards = data.data || [];
    allFlashcards = [...allFlashcards, ...flashcards];

    hasMore = data.pagination?.has_next || false;
    currentPage++;

    // Safety check to prevent infinite loop
    if (currentPage > 100) {
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
}

/**
 * Wait for database operation to complete
 * Sometimes there's a small delay between API response and data being available
 */
export async function waitForDatabaseSync(ms = 500) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
