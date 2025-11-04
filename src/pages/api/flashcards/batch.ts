/**
 * POST /api/flashcards/batch - Create multiple flashcards at once
 *
 * This endpoint accepts an array of flashcards (typically from AI generation)
 * and creates them all at once. It also updates the associated generation
 * record with acceptance metrics.
 *
 * Authentication: Required (JWT Bearer token)
 * Rate limiting: Consider implementing (recommended: 10 req/min per user)
 */

import type { APIRoute } from "astro";
import type { BatchFlashcardsResponse, ErrorResponse, CreateBatchFlashcardsResponse } from "@/types";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { GenerationService } from "@/lib/services/generation.service";
import { createBatchFlashcardsSchema, type CreateBatchFlashcardsInput } from "@/lib/validation/flashcard.validation";

export const prerender = false;

/**
 * POST handler for batch flashcard creation
 */
export const POST: APIRoute = async (context) => {
  // Step 1: Check authentication
  const supabase = context.locals.supabase;

  // Verify JWT token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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

  const userId = user.id;

  // Step 2: Parse request body
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

  // Step 3: Validate request body with Zod
  const validationResult = createBatchFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const errorResponse: ErrorResponse = {
      error: "Validation error",
      message: "Validation failed",
      details: validationResult.error.flatten().fieldErrors,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validatedData: CreateBatchFlashcardsInput = validationResult.data;

  // Step 4: Verify generation exists and belongs to user
  const generationService = new GenerationService(supabase);

  let generation;
  try {
    generation = await generationService.getGenerationById(validatedData.generation_id, userId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generation:", error);
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "Failed to verify generation session",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!generation) {
    const errorResponse: ErrorResponse = {
      error: "Not found",
      message: "Generation session not found",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Create flashcards (bulk insert)
  const flashcardService = new FlashcardService(supabase);

  let createdFlashcards;
  try {
    createdFlashcards = await flashcardService.createBatchFlashcards(
      userId,
      validatedData.generation_id,
      validatedData.flashcards.map(({ front, back }) => ({ front, back }))
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating flashcards:", {
      error: error instanceof Error ? error.message : error,
      userId,
      generationId: validatedData.generation_id,
      flashcardsCount: validatedData.flashcards.length,
    });

    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "Failed to create flashcards",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 6: Calculate acceptance metrics
  const acceptedUneditedCount = validatedData.flashcards.filter((card) => !card.edited).length;
  const acceptedEditedCount = validatedData.flashcards.filter((card) => card.edited).length;

  // Step 7: Update generation metrics
  try {
    await generationService.updateGenerationMetrics(validatedData.generation_id, userId, {
      accepted_unedited_count: acceptedUneditedCount,
      accepted_edited_count: acceptedEditedCount,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating generation metrics:", {
      error: error instanceof Error ? error.message : error,
      userId,
      generationId: validatedData.generation_id,
      acceptedUneditedCount,
      acceptedEditedCount,
    });

    // Flashcards were created successfully, but metrics update failed
    // This is acceptable for MVP - metrics can be fixed later
    // We still return success, but log the error
  }

  // Step 8: Format and return response
  const responseData: CreateBatchFlashcardsResponse = {
    created_count: createdFlashcards.length,
    flashcards: createdFlashcards,
  };

  const response: BatchFlashcardsResponse = {
    data: responseData,
  };

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
