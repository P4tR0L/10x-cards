/**
 * GET /api/test-simple
 * Minimal test without imports
 */

export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  try {
    const result = {
      step1: "Context exists",
      step2: !!context.locals.supabase ? "Supabase OK" : "Supabase missing",
      step3: !!context.locals.runtime ? "Runtime OK" : "Runtime missing",
      step4:
        context.locals.runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY
          ? "Env vars OK"
          : "Env vars missing",
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
