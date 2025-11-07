/**
 * GET /api/test-imports
 * Test imports one by one
 */

export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const results: Record<string, string> = {};

  try {
    // Test 1: hashText
    try {
      const { hashText } = await import("../../lib/utils/hash");
      const testHash = await hashText("test");
      results.hashText = testHash ? "OK" : "Failed";
    } catch (e) {
      results.hashText = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 2: Validation schema
    try {
      const { createGenerationSchema } = await import("../../lib/validation/generation.validation");
      results.validationSchema = createGenerationSchema ? "OK" : "Failed";
    } catch (e) {
      results.validationSchema = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 3: OpenRouterService
    try {
      const { OpenRouterService } = await import("../../lib/services/openrouter.service");
      const service = new OpenRouterService({
        apiKey: "test",
        model: "test",
        siteUrl: "test",
        appName: "test",
      });
      results.openRouterService = service ? "OK" : "Failed";
    } catch (e) {
      results.openRouterService = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 4: GenerationService
    try {
      const { GenerationService } = await import("../../lib/services/generation.service");
      const service = new GenerationService(context.locals.supabase);
      results.generationService = service ? "OK" : "Failed";
    } catch (e) {
      results.generationService = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        results,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
