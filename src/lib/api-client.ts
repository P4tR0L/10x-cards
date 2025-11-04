/**
 * API Client utilities
 * Handles authenticated API requests with proper token management
 */

import { getDevToken } from "./auth-dev";
import type {
  FlashcardListResponse,
  FlashcardListQueryParams,
  FlashcardResponse,
  UpdateFlashcardCommand,
} from "@/types";

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Make an authenticated API request
 * Automatically adds Authorization header with token
 */
export async function fetchAPI(url: string, options: FetchOptions = {}): Promise<Response> {
  const { token, ...fetchOptions } = options;

  // Get token from parameter or localStorage
  const authToken = token || getDevToken();

  // Build headers
  const headers = new Headers(fetchOptions.headers);

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  // Make the request
  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

/**
 * Build query string from params object
 * Only includes defined values to let backend use its defaults
 */
function buildQueryString(params: FlashcardListQueryParams): string {
  const searchParams = new URLSearchParams();

  // Only add parameters that are explicitly set (not undefined, not empty string)
  Object.entries(params).forEach(([key, value]) => {
    // Skip undefined, null, and empty strings
    if (value === undefined || value === null || value === "") {
      return;
    }

    // For numbers, always add them
    // For strings, only add if non-empty (already checked above)
    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================================================================
// FLASHCARD API FUNCTIONS
// ============================================================================

/**
 * Get paginated list of flashcards with optional filters
 * GET /api/flashcards
 */
export async function getFlashcards(params: FlashcardListQueryParams = {}): Promise<FlashcardListResponse> {
  const queryString = buildQueryString(params);
  const response = await fetchAPI(`/api/flashcards${queryString}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || "Failed to fetch flashcards");
  }

  return response.json();
}

/**
 * Get a single flashcard by ID
 * GET /api/flashcards/{id}
 */
export async function getFlashcard(id: number): Promise<FlashcardResponse> {
  const response = await fetchAPI(`/api/flashcards/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || "Failed to fetch flashcard");
  }

  return response.json();
}

/**
 * Update an existing flashcard
 * PUT /api/flashcards/{id}
 */
export async function updateFlashcard(id: number, data: UpdateFlashcardCommand): Promise<FlashcardResponse> {
  const response = await fetchAPI(`/api/flashcards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || "Failed to update flashcard");
  }

  return response.json();
}

/**
 * Delete a flashcard
 * DELETE /api/flashcards/{id}
 */
export async function deleteFlashcard(id: number): Promise<void> {
  const response = await fetchAPI(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.message || "Failed to delete flashcard");
  }
}
