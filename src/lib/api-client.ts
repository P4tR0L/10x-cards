/**
 * API Client utilities
 * Handles authenticated API requests with proper token management
 */

import { getDevToken } from "./auth-dev";

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
