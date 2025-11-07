/**
 * GET /api/debug
 * Diagnostic endpoint to check environment configuration
 */

export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  try {
    // Get environment variables from Cloudflare runtime (production) or import.meta.env (dev)
    const openRouterApiKey = context.locals.runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
    const openRouterModel = context.locals.runtime?.env?.OPENROUTER_MODEL || import.meta.env.OPENROUTER_MODEL;
    const siteUrl = context.locals.runtime?.env?.SITE_URL || import.meta.env.SITE_URL;

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        OPENROUTER_API_KEY: openRouterApiKey ? "✓ Set" : "✗ Missing",
        OPENROUTER_MODEL: openRouterModel || "✗ Missing",
        SITE_URL: siteUrl || "✗ Missing",
        PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
        PUBLIC_SUPABASE_KEY: import.meta.env.PUBLIC_SUPABASE_KEY ? "✓ Set" : "✗ Missing",
      },
      runtime: {
        cloudflareRuntimeAvailable: !!context.locals.runtime,
      },
      supabase: {
        available: !!context.locals.supabase,
      },
      auth: {
        hasToken: !!context.request.headers.get("Authorization"),
        authenticated: false,
        error: null as string | null,
      },
    };

    // Test Supabase connection
    if (context.locals.supabase) {
      try {
        const { data, error } = await context.locals.supabase.auth.getUser();
        diagnostics.auth.authenticated = !!data?.user;
        diagnostics.auth.error = error?.message || null;
      } catch (err) {
        diagnostics.auth.error = err instanceof Error ? err.message : "Unknown error";
      }
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Debug endpoint failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
