/**
 * GET /api/test-generation-flow
 * Test each component of the generation flow
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../../lib/validation/generation.validation";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { GenerationService } from "../../../lib/services/generation.service";
import { hashText } from "../../../lib/utils/hash";

export const GET: APIRoute = async (context) => {
  const results: Record<string, unknown> = {
    step1_contextLocals: false,
    step2_supabase: false,
    step3_auth: false,
    step4_envVars: false,
    step5_imports: false,
    step6_services: false,
    error: null,
  };

  try {
    // Step 1: Check context.locals
    results.step1_contextLocals = !!context.locals;

    // Step 2: Check Supabase
    results.step2_supabase = !!context.locals.supabase;

    // Step 3: Test auth
    if (context.locals.supabase) {
      const { data, error } = await context.locals.supabase.auth.getUser();
      results.step3_auth = {
        hasUser: !!data?.user,
        error: error?.message || null,
      };
    }

    // Step 4: Check env vars
    const openRouterApiKey = context.locals.runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
    const openRouterModel = context.locals.runtime?.env?.OPENROUTER_MODEL || import.meta.env.OPENROUTER_MODEL;
    const siteUrl = context.locals.runtime?.env?.SITE_URL || import.meta.env.SITE_URL;

    results.step4_envVars = {
      hasApiKey: !!openRouterApiKey,
      hasModel: !!openRouterModel,
      hasSiteUrl: !!siteUrl,
    };

    // Step 5: Test imports
    try {
      results.step5_imports = {
        hasSchema: !!createGenerationSchema,
        hasOpenRouterService: !!OpenRouterService,
        hasGenerationService: !!GenerationService,
        hasHashText: !!hashText,
      };

      // Step 6: Test service initialization
      const openRouter = new OpenRouterService({
        apiKey: openRouterApiKey || "test",
        model: openRouterModel || "test",
        siteUrl: siteUrl || "test",
        appName: "10x Cards",
      });

      const generationService = new GenerationService(context.locals.supabase);

      results.step6_services = {
        openRouterCreated: !!openRouter,
        generationServiceCreated: !!generationService,
      };
    } catch (importError) {
      results.step5_imports = {
        error: importError instanceof Error ? importError.message : String(importError),
      };
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    results.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
