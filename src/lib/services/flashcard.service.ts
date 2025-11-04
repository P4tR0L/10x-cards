/**
 * Flashcard Service
 *
 * This service handles all business logic related to flashcard operations.
 * It provides methods for creating, reading, updating, and deleting flashcards.
 *
 * All methods use Supabase client with RLS (Row Level Security) policies enabled,
 * ensuring users can only access their own flashcards.
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, FlashcardInsert } from "@/types";
import type { CreateFlashcardInput, UpdateFlashcardInput, FlashcardListQueryInput } from "@/lib/validation/flashcard.validation";

/**
 * Service class for managing flashcard operations
 */
export class FlashcardService {
  /**
   * Creates a new FlashcardService instance
   * @param supabase - Authenticated Supabase client from request context
   */
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new manual flashcard for the authenticated user
   *
   * This method:
   * 1. Prepares insert data with user_id, front, back, source='manual', generation_id=null
   * 2. Inserts into flashcards table (RLS policy checks auth.uid() = user_id)
   * 3. Returns created flashcard without user_id (FlashcardDTO)
   *
   * @param userId - The ID of the authenticated user creating the flashcard
   * @param data - The flashcard data (front and back, already validated)
   * @returns The created flashcard without user_id
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new FlashcardService(supabase);
   * const flashcard = await service.createManualFlashcard(user.id, {
   *   front: "What is TypeScript?",
   *   back: "A typed superset of JavaScript"
   * });
   * ```
   */
  async createManualFlashcard(userId: string, data: CreateFlashcardInput): Promise<FlashcardDTO> {
    // Prepare insert data with all required fields
    const insertData: FlashcardInsert = {
      user_id: userId,
      front: data.front,
      back: data.back,
      source: "manual",
      generation_id: null,
    };

    // Insert flashcard and return the created row
    const { data: flashcard, error } = await this.supabase.from("flashcards").insert(insertData).select().single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    // Remove user_id before returning (FlashcardDTO doesn't include user_id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDTO } = flashcard;
    return flashcardDTO as FlashcardDTO;
  }

  /**
   * Updates an existing flashcard
   *
   * This method:
   * 1. Validates flashcard exists and belongs to user (RLS policy)
   * 2. Updates front and back fields
   * 3. Returns updated flashcard without user_id
   *
   * @param flashcardId - The ID of the flashcard to update
   * @param data - The updated flashcard data (front and back, already validated)
   * @returns The updated flashcard without user_id
   * @throws Error if flashcard not found or database operation fails
   *
   * @example
   * ```typescript
   * const service = new FlashcardService(supabase);
   * const updated = await service.updateFlashcard(123, {
   *   front: "Updated question",
   *   back: "Updated answer"
   * });
   * ```
   */
  async updateFlashcard(flashcardId: number, data: UpdateFlashcardInput): Promise<FlashcardDTO> {
    // Update flashcard (RLS ensures user can only update their own flashcards)
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .update({
        front: data.front,
        back: data.back,
      })
      .eq("id", flashcardId)
      .select()
      .single();

    // Handle errors (including not found due to RLS)
    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Flashcard not found or access denied");
      }
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    // Remove user_id before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDTO } = flashcard;
    return flashcardDTO as FlashcardDTO;
  }

  /**
   * Retrieves a single flashcard by ID
   *
   * This method uses RLS to ensure users can only access their own flashcards.
   *
   * @param flashcardId - The ID of the flashcard to retrieve
   * @returns The flashcard without user_id
   * @throws Error if flashcard not found or database operation fails
   */
  async getFlashcard(flashcardId: number): Promise<FlashcardDTO> {
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Flashcard not found or access denied");
      }
      throw new Error(`Failed to retrieve flashcard: ${error.message}`);
    }

    // Remove user_id before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDTO } = flashcard;
    return flashcardDTO as FlashcardDTO;
  }

  /**
   * Deletes a flashcard by ID
   *
   * This method uses RLS to ensure users can only delete their own flashcards.
   * If no rows are deleted (flashcard doesn't exist or access denied), throws a specific error.
   *
   * @param flashcardId - The ID of the flashcard to delete
   * @throws Error with "not found" message if flashcard doesn't exist or access denied
   * @throws Error for other database failures
   */
  async deleteFlashcard(flashcardId: number): Promise<void> {
    // Delete and return deleted rows to verify success
    const { data, error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).select(); // Returns deleted rows

    // Handle database errors
    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    // Check if any rows were deleted
    // data will be empty array if:
    // - Flashcard doesn't exist
    // - Flashcard exists but belongs to another user (RLS blocked)
    if (!data || data.length === 0) {
      throw new Error("Flashcard not found or access denied");
    }
  }

  /**
   * Creates multiple flashcards from AI generation (batch creation)
   *
   * This method:
   * 1. Prepares array of insert data with user_id, front, back, source='ai', generation_id
   * 2. Performs bulk insert into flashcards table (single query for efficiency)
   * 3. Returns array of created flashcards without user_id
   *
   * @param userId - The ID of the authenticated user creating the flashcards
   * @param generationId - The ID of the AI generation session
   * @param flashcards - Array of flashcard data (front and back, already validated)
   * @returns Array of created flashcards without user_id
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new FlashcardService(supabase);
   * const created = await service.createBatchFlashcards(user.id, 42, [
   *   { front: "Question 1", back: "Answer 1" },
   *   { front: "Question 2", back: "Answer 2" }
   * ]);
   * ```
   */
  async createBatchFlashcards(
    userId: string,
    generationId: number,
    flashcards: { front: string; back: string }[]
  ): Promise<FlashcardDTO[]> {
    // Prepare bulk insert data
    const insertData: FlashcardInsert[] = flashcards.map((card) => ({
      user_id: userId,
      front: card.front,
      back: card.back,
      source: "ai" as const,
      generation_id: generationId,
    }));

    // Bulk insert flashcards (single query for all flashcards)
    const { data: createdFlashcards, error } = await this.supabase.from("flashcards").insert(insertData).select();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    // Remove user_id from all flashcards before returning
    return createdFlashcards.map((flashcard) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...flashcardDTO } = flashcard;
      return flashcardDTO as FlashcardDTO;
    });
  }

  /**
   * Lists flashcards with pagination, filtering, searching, and sorting
   *
   * This method:
   * 1. Constructs Supabase query with filters, search, and sorting
   * 2. Applies RLS policy (automatic user_id filtering)
   * 3. Executes query with pagination (range)
   * 4. Returns flashcards array and total count
   *
   * @param userId - The ID of the authenticated user (for logging, RLS handles filtering)
   * @param params - Query parameters (validated)
   * @returns Object with flashcards array and total count
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new FlashcardService(supabase);
   * const result = await service.listFlashcards(user.id, {
   *   page: 1,
   *   limit: 30,
   *   search: "biology",
   *   source: "ai",
   *   sort: "created_at",
   *   order: "desc"
   * });
   * console.log(`Found ${result.total} flashcards`);
   * ```
   */
  async listFlashcards(
    userId: string,
    params: FlashcardListQueryInput
  ): Promise<{ flashcards: FlashcardDTO[]; total: number }> {
    // Start building query with count
    let query = this.supabase
      .from("flashcards")
      .select("*", { count: "exact" });

    // Apply search filter (full-text search on front and back)
    if (params.search) {
      const searchPattern = `%${params.search}%`;
      query = query.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
    }

    // Apply source filter
    if (params.source) {
      query = query.eq("source", params.source);
    }

    // Apply sorting
    query = query.order(params.sort, { ascending: params.order === "asc" });

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);

    // Execute query
    const { data, count, error } = await query;

    // Handle database errors
    if (error) {
      throw new Error(`Failed to list flashcards: ${error.message}`);
    }

    // Transform data: remove user_id from all flashcards
    const flashcards = (data || []).map((flashcard) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, ...flashcardDTO } = flashcard;
      return flashcardDTO as FlashcardDTO;
    });

    // Return flashcards and total count
    return {
      flashcards,
      total: count || 0,
    };
  }
}
