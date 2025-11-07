/**
 * Generation Service
 * Handles database operations for AI generation tracking and error logging
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationEntity, GenerationInsert, GenerationErrorLogInsert } from "../../types";

/**
 * Service for managing generation records and error logs
 */
export class GenerationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Creates a new generation record in the database
   * @param data - Generation data to insert
   * @returns Created generation entity
   * @throws Error if database operation fails
   */
  async createGeneration(data: GenerationInsert): Promise<GenerationEntity> {
    const { data: generation, error } = await this.supabase.from("generations").insert(data).select().single();

    if (error) {
      throw new Error(`Failed to create generation: ${error.message}`);
    }

    return generation;
  }

  /**
   * Logs a generation error to the database
   * @param errorData - Error information to log
   * @returns Promise that resolves when logging completes (or fails silently)
   */
  async logError(errorData: GenerationErrorLogInsert): Promise<void> {
    try {
      await this.supabase.from("generation_error_logs").insert(errorData);
      // Silent fail - we don't want to throw when logging an error
    } catch {
      // Silent fail - we don't want to throw when logging an error
    }
  }

  /**
   * Retrieves a generation record by ID
   * @param generationId - ID of the generation to retrieve
   * @param userId - User ID for authorization check
   * @returns Generation entity or null if not found/unauthorized
   */
  async getGenerationById(generationId: number, userId: string): Promise<GenerationEntity | null> {
    const { data, error } = await this.supabase
      .from("generations")
      .select()
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Updates generation metrics when flashcards are accepted
   * @param generationId - ID of the generation to update
   * @param userId - User ID for authorization check
   * @param metrics - Acceptance metrics to update
   * @returns Updated generation entity
   * @throws Error if update fails or generation not found
   */
  async updateGenerationMetrics(
    generationId: number,
    userId: string,
    metrics: {
      accepted_unedited_count?: number;
      accepted_edited_count?: number;
    }
  ): Promise<GenerationEntity> {
    const { data, error } = await this.supabase
      .from("generations")
      .update(metrics)
      .eq("id", generationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generation metrics: ${error.message}`);
    }

    return data;
  }
}
