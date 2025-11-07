/**
 * Client-side handler for auth callback page
 * Handles DOM manipulation and redirects
 */

import { handleAuthCallback } from "@/lib/services/auth-callback.service";

export async function initAuthCallbackHandler(): Promise<void> {
  // Get DOM elements
  const loadingState = document.getElementById("loading-state");
  const successState = document.getElementById("success-state");
  const errorState = document.getElementById("error-state");
  const errorMessage = document.getElementById("error-message");

  // Process authentication callback
  const result = await handleAuthCallback();

  if (result.success) {
    // Show success state
    loadingState?.classList.add("hidden");
    successState?.classList.remove("hidden");

    // Redirect to home page after a short delay
    setTimeout(() => {
      window.location.assign("/");
    }, 1500);
  } else {
    // Show error state
    loadingState?.classList.add("hidden");
    errorState?.classList.remove("hidden");
    if (errorMessage) {
      errorMessage.textContent = result.error || "Nie udało się potwierdzić konta. Spróbuj ponownie.";
    }
  }
}
