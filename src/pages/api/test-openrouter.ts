/**
 * GET /api/test-openrouter
 * Test endpoint to verify OpenRouter connection
 */

export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  try {
    // Get environment variables
    const openRouterApiKey = context.locals.runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
    const openRouterModel = context.locals.runtime?.env?.OPENROUTER_MODEL || import.meta.env.OPENROUTER_MODEL;
    const siteUrl = context.locals.runtime?.env?.SITE_URL || import.meta.env.SITE_URL;

    if (!openRouterApiKey || !openRouterModel || !siteUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing environment variables",
          details: {
            hasApiKey: !!openRouterApiKey,
            hasModel: !!openRouterModel,
            hasSiteUrl: !!siteUrl,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test OpenRouter API with a simple request
    const testResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": siteUrl,
        "X-Title": "10x Cards",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: "user",
            content: 'Say \'test successful\' in JSON format: {"status": "test successful"}',
          },
        ],
      }),
    });

    const responseText = await testResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return new Response(
      JSON.stringify(
        {
          success: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText,
          model: openRouterModel,
          response: responseData,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Test failed",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
