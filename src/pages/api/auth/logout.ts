/**
 * POST /api/auth/logout
 *
 * Clears authentication session cookies and signs out from Supabase.
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    // Sign out from Supabase if we have a session
    if (locals.supabase) {
      await locals.supabase.auth.signOut();
    }

    // Clear auth cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Even if there's an error, clear the cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Logout completed with errors",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
