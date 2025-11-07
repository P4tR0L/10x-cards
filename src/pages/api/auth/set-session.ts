/**
 * POST /api/auth/set-session
 *
 * Sets authentication session cookies for SSR.
 * Called after successful login on the client side.
 */

import type { APIRoute } from "astro";

export const prerender = false;

interface SetSessionRequest {
  access_token: string;
  refresh_token: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = (await request.json()) as SetSessionRequest;

    if (!body.access_token || !body.refresh_token) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "Missing access_token or refresh_token",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set cookies with secure options
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD, // Only secure in production
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    cookies.set("sb-access-token", body.access_token, cookieOptions);
    cookies.set("sb-refresh-token", body.refresh_token, cookieOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to set session cookies",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
