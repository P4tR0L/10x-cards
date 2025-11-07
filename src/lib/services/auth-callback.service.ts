/**
 * Auth Callback Service
 *
 * Handles email confirmation and other auth redirects from Supabase.
 * Processes tokens from URL and exchanges them for valid sessions.
 */

import { createClient } from "@supabase/supabase-js";

interface AuthCallbackResult {
  success: boolean;
  error?: string;
}

/**
 * Handles authentication callback from email confirmation links
 */
export async function handleAuthCallback(): Promise<AuthCallbackResult> {
  try {
    // Create Supabase client
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get the hash fragment from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    // Check for errors in the URL
    if (error) {
      throw new Error(errorDescription || "Wystąpił błąd podczas potwierdzania konta");
    }

    // Check if we have the required tokens
    if (!accessToken || !type) {
      // No tokens in URL - check if user is already authenticated
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session) {
        // User is already authenticated, redirect to home
        return { success: true };
      }

      throw new Error("Brak tokenu weryfikacyjnego w linku");
    }

    // Exchange the token for a session
    const { data, error: sessionError } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (sessionError) {
      throw sessionError;
    }

    if (!data.session) {
      throw new Error("Nie udało się utworzyć sesji");
    }

    // Store tokens in localStorage
    localStorage.setItem("supabase_auth_token", data.session.access_token);
    if (data.session.refresh_token) {
      localStorage.setItem("supabase_refresh_token", data.session.refresh_token);
    }

    // Set cookies for SSR
    await fetch("/api/auth/set-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || "",
      }),
    });

    return { success: true };
  } catch (err) {
    // Log error for debugging (only in development)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Auth callback error:", err);
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Nie udało się potwierdzić konta. Spróbuj ponownie.",
    };
  }
}
