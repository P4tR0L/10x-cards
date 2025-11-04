/**
 * POST /api/generations
 * Generates flashcard proposals from source text using AI
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../../lib/validation/generation.validation";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { GenerationService } from "../../../lib/services/generation.service";
import { hashText } from "../../../lib/utils/hash";
import type {
  GenerateFlashcardsResponse,
  GenerateResponse,
  ErrorResponse,
  GenerationProposalDTO,
} from "../../../types";

/**
 * POST handler for generating flashcards with AI
 *
 * Request body:
 * {
 *   source_text: string (100-1000 characters)
 * }
 *
 * Response (201):
 * {
 *   data: {
 *     generation_id: number,
 *     model: string,
 *     generated_count: number,
 *     generation_duration: number,
 *     proposals: Array<{ front: string, back: string }>
 *   }
 * }
 *
 * Errors:
 * - 400: Invalid request body
 * - 401: Unauthorized (missing/invalid JWT token)
 * - 422: Validation error (source_text length)
 * - 500: Internal server error
 * - 503: AI service unavailable
 */
export const POST: APIRoute = async (context) => {
  // ============================================================================
  // 1. AUTHENTICATION
  // ============================================================================

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

  // ============================================================================
  // 2. REQUEST BODY PARSING
  // ============================================================================

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

  // ============================================================================
  // 3. INPUT VALIDATION
  // ============================================================================

  const validation = createGenerationSchema.safeParse(body);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    const errorResponse: ErrorResponse = {
      error: "Validation error",
      message: firstError.message,
      details: {
        source_text: validation.error.errors.map((e) => e.message),
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { source_text } = validation.data;

  // ============================================================================
  // 4. PREPARATION
  // ============================================================================

  // Hash source text for privacy-preserving storage
  const sourceTextHash = hashText(source_text);
  const sourceTextLength = source_text.length;

  // Get model from environment
  const model = import.meta.env.OPENROUTER_MODEL;

  // Start timing
  const startTime = Date.now();

  // ============================================================================
  // 5. AI GENERATION
  // ============================================================================

  // Initialize OpenRouter service
  const openRouterService = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    model: model,
    siteUrl: import.meta.env.SITE_URL,
    appName: "10x Cards",
  });

  // Initialize Generation service for database operations
  const generationService = new GenerationService(supabase);

  // Call OpenRouter API to generate flashcards
  let proposals: { front: string; back: string }[];
  try {
    proposals = await openRouterService.generateFlashcards({
      sourceText: source_text,
      count: 12,
    });
  } catch (error) {
    // Log error to database
    await generationService.logError({
      user_id: user.id,
      model: model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: error instanceof Error ? "OPENROUTER_ERROR" : "UNKNOWN_ERROR",
      error_message: error instanceof Error ? error.message : "Unknown error occurred",
    });

    const errorResponse: ErrorResponse = {
      error: "Service unavailable",
      message: "AI generation service is currently unavailable. Please try again later.",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stop timer
  const generationDuration = Date.now() - startTime;

  // ============================================================================
  // 6. DATABASE - SAVE GENERATION METRICS
  // ============================================================================

  let generation;
  try {
    generation = await generationService.createGeneration({
      user_id: user.id,
      model: model,
      generated_count: proposals.length,
      accepted_unedited_count: null,
      accepted_edited_count: null,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generation_duration: generationDuration,
    });
  } catch (error) {
    // Log error to database
    await generationService.logError({
      user_id: user.id,
      model: model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: "DATABASE_ERROR",
      error_message: error instanceof Error ? error.message : "Failed to save generation",
    });

    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ============================================================================
  // 7. FORMAT AND RETURN RESPONSE
  // ============================================================================

  // Map proposals to DTO format
  const proposalDTOs: GenerationProposalDTO[] = proposals.map((p) => ({
    front: p.front,
    back: p.back,
  }));

  // Create response data
  const responseData: GenerateFlashcardsResponse = {
    generation_id: generation.id,
    model: generation.model,
    generated_count: generation.generated_count,
    generation_duration: generation.generation_duration,
    proposals: proposalDTOs,
  };

  // Wrap in response wrapper
  const response: GenerateResponse = {
    data: responseData,
  };

  // Return 201 Created
  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
