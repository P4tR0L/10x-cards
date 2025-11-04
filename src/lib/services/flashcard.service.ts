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
import type { CreateFlashcardInput, UpdateFlashcardInput } from "@/lib/validation/flashcard.validation";

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
   *
   * @param flashcardId - The ID of the flashcard to delete
   * @throws Error if flashcard not found or database operation fails
   */
  async deleteFlashcard(flashcardId: number): Promise<void> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }
}
