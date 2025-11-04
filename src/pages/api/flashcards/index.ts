/**
 * Flashcards API Endpoint
 *
 * POST /api/flashcards - Create a single manual flashcard
 * GET /api/flashcards - List flashcards with pagination and filtering (TODO)
 *
 * Authentication required: JWT Bearer token in Authorization header
 */

import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { createFlashcardSchema } from "@/lib/validation/flashcard.validation";
import type { FlashcardResponse, ErrorResponse } from "@/types";

// Disable prerendering for this API route (SSR required for dynamic data)
export const prerender = false;

/**
 * POST /api/flashcards
 *
 * Creates a new manual flashcard for the authenticated user.
 *
 * Request body:
 * {
 *   "front": "Question or concept (1-5000 chars)",
 *   "back": "Answer or definition (1-5000 chars)"
 * }
 *
 * Response codes:
 * - 201 Created: Flashcard created successfully
 * - 400 Bad Request: Invalid request body or JSON
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 422 Validation Error: Invalid input data (details in response)
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    // Verify JWT token and get authenticated user from Supabase session
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Handle authentication errors (missing token, invalid token, expired token)
    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: "Unauthorized",
        message: "Invalid or missing authentication token",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // 2. PARSE REQUEST BODY
    // ========================================================================
    // Parse JSON body and handle malformed JSON errors
    let body: unknown;
    try {
      body = await context.request.json();
    } catch (e) {
      const errorResponse: ErrorResponse = {
        error: "Bad request",
        message: "Invalid request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // 3. VALIDATE INPUT
    // ========================================================================
    // Validate request body against Zod schema
    const validation = createFlashcardSchema.safeParse(body);
    if (!validation.success) {
      const errorResponse: ErrorResponse = {
        error: "Validation error",
        message: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // 4. CREATE FLASHCARD VIA SERVICE
    // ========================================================================
    // Initialize service with authenticated Supabase client
    const flashcardService = new FlashcardService(context.locals.supabase);

    // Create flashcard (user_id from session, data from validated input)
    const flashcard = await flashcardService.createManualFlashcard(
      user.id,
      validation.data
    );

    // ========================================================================
    // 5. RETURN SUCCESS RESPONSE
    // ========================================================================
    // Wrap flashcard in response structure and return 201 Created
    const response: FlashcardResponse = {
      data: flashcard,
    };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ========================================================================
    // 6. HANDLE UNEXPECTED ERRORS
    // ========================================================================
    // Log error details for debugging (never expose to user)
    console.error("[POST /api/flashcards] Error creating flashcard:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response (don't leak implementation details)
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

