/**
 * Flashcard Update API Endpoint
 *
 * PUT /api/flashcards/{id} - Update an existing flashcard
 *
 * Authentication required: JWT Bearer token in Authorization header
 */

import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { updateFlashcardSchema } from "@/lib/validation/flashcard.validation";
import type { FlashcardResponse, ErrorResponse } from "@/types";

// Disable prerendering for this API route (SSR required for dynamic data)
export const prerender = false;

/**
 * PUT /api/flashcards/{id}
 *
 * Updates an existing flashcard for the authenticated user.
 *
 * Path parameters:
 * - id: Flashcard ID (positive integer)
 *
 * Request body:
 * {
 *   "front": "Updated question or concept (1-5000 chars)",
 *   "back": "Updated answer or definition (1-5000 chars)"
 * }
 *
 * Response codes:
 * - 200 OK: Flashcard updated successfully
 * - 400 Bad Request: Invalid flashcard ID or malformed JSON
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Flashcard not found or access denied
 * - 422 Validation Error: Invalid input data (details in response)
 * - 500 Internal Server Error: Unexpected server error
 */
export const PUT: APIRoute = async (context) => {
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
    // 2. PARSE AND VALIDATE ID
    // ========================================================================
    // Extract flashcard ID from URL path parameter
    const idParam = context.params.id;

    // Validate ID is a positive integer
    const flashcardId = parseInt(idParam || "", 10);
    if (isNaN(flashcardId) || flashcardId <= 0) {
      const errorResponse: ErrorResponse = {
        error: "Bad request",
        message: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================================================
    // 3. PARSE REQUEST BODY
    // ========================================================================
    // Parse JSON body and handle malformed JSON errors
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
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
    // 4. VALIDATE INPUT
    // ========================================================================
    // Validate request body against Zod schema
    const validation = updateFlashcardSchema.safeParse(body);
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
    // 5. UPDATE FLASHCARD VIA SERVICE
    // ========================================================================
    // Initialize service with authenticated Supabase client
    const flashcardService = new FlashcardService(context.locals.supabase);

    // Update flashcard (RLS ensures user can only update their own flashcards)
    try {
      const flashcard = await flashcardService.updateFlashcard(flashcardId, validation.data);

      // Return success response with updated flashcard
      const response: FlashcardResponse = {
        data: flashcard,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle specific service errors (404 not found)
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse: ErrorResponse = {
          error: "Not found",
          message: "Flashcard not found or you don't have permission to update it",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Re-throw to be caught by outer catch block
      throw error;
    }
  } catch (error) {
    // ========================================================================
    // 6. HANDLE UNEXPECTED ERRORS
    // ========================================================================
    // Log error details for debugging (never expose to user)
    console.error("[PUT /api/flashcards/{id}] Error updating flashcard:", {
      flashcardId: context.params.id,
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
