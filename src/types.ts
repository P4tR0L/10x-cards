/**
 * DTO (Data Transfer Objects) and Command Models for 10x Cards API
 *
 * This file contains all data transfer objects and command models used by the API.
 * All types are derived from database entities defined in database.types.ts
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// FLASHCARD DTOs
// ============================================================================

/**
 * Full flashcard data transfer object
 * Used in: GET /api/flashcards/{id}, POST /api/flashcards, PUT /api/flashcards/{id}
 *
 * Derived from database flashcards table, excluding user_id for security
 */
export type FlashcardDTO = Omit<Tables<"flashcards">, "user_id">;

/**
 * Flashcard list item (same as FlashcardDTO, but semantically represents list items)
 * Used in: GET /api/flashcards (list endpoint)
 */
export type FlashcardListItemDTO = FlashcardDTO;

/**
 * Command for creating a single manual flashcard
 * Used in: POST /api/flashcards
 *
 * Validation rules:
 * - front: 1-5000 characters, non-empty after trim
 * - back: 1-5000 characters, non-empty after trim
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Command for updating an existing flashcard
 * Used in: PUT /api/flashcards/{id}
 *
 * Validation rules:
 * - front: 1-5000 characters, non-empty after trim
 * - back: 1-5000 characters, non-empty after trim
 */
export interface UpdateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Single flashcard item in batch creation
 * Used within: POST /api/flashcards/batch
 *
 * The 'edited' flag tracks whether the user modified the AI-generated proposal
 */
export interface BatchFlashcardItem {
  front: string;
  back: string;
  edited: boolean;
}

/**
 * Command for creating multiple flashcards at once (batch creation)
 * Used in: POST /api/flashcards/batch
 *
 * Validation rules:
 * - flashcards: 1-50 items
 * - generation_id: must exist and belong to the authenticated user
 */
export interface CreateBatchFlashcardsCommand {
  flashcards: BatchFlashcardItem[];
  generation_id: number;
}

/**
 * Response for batch flashcard creation
 * Used in: POST /api/flashcards/batch (response)
 */
export interface CreateBatchFlashcardsResponse {
  created_count: number;
  flashcards: FlashcardDTO[];
}

/**
 * Query parameters for listing flashcards
 * Used in: GET /api/flashcards
 *
 * Validation rules:
 * - page: >= 1, default 1
 * - limit: 1-100, default 30
 * - search: max 500 characters
 * - source: 'manual' or 'ai'
 * - sort: 'created_at' or 'updated_at'
 * - order: 'asc' or 'desc'
 */
export interface FlashcardListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: "manual" | "ai";
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
}

// ============================================================================
// GENERATION DTOs
// ============================================================================

/**
 * Full generation data transfer object
 * Used in: GET /api/generations/{id}, PATCH /api/generations/{id}
 *
 * Derived from database generations table, excluding user_id for security
 */
export type GenerationDTO = Omit<Tables<"generations">, "user_id">;

/**
 * Command for generating flashcards with AI
 * Used in: POST /api/generations
 *
 * Validation rules:
 * - source_text: 100-1000 characters, trimmed
 */
export interface CreateGenerationCommand {
  source_text: string;
}

/**
 * Single flashcard proposal from AI generation
 * Used within: POST /api/generations (response)
 *
 * Proposals are not saved to database until user accepts them
 */
export interface GenerationProposalDTO {
  front: string;
  back: string;
}

/**
 * Response for AI flashcard generation
 * Used in: POST /api/generations (response)
 *
 * Contains generation metadata and the proposed flashcards for user review
 */
export interface GenerateFlashcardsResponse {
  generation_id: number;
  model: string;
  generated_count: number;
  generation_duration: number;
  proposals: GenerationProposalDTO[];
}

/**
 * Command for updating generation acceptance metrics
 * Used in: PATCH /api/generations/{id}
 *
 * This is typically called automatically by the batch creation endpoint
 *
 * Validation rules:
 * - accepted_unedited_count: >= 0 if provided
 * - accepted_edited_count: >= 0 if provided
 */
export interface UpdateGenerationMetricsCommand {
  accepted_unedited_count?: number;
  accepted_edited_count?: number;
}

// ============================================================================
// PAGINATION DTOs
// ============================================================================

/**
 * Pagination metadata for list responses
 * Used in all paginated list endpoints
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Generic paginated response wrapper
 * Used in: GET /api/flashcards and other paginated endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Convenience type for paginated flashcard list response
 */
export type FlashcardListResponse = PaginatedResponse<FlashcardListItemDTO>;

// ============================================================================
// COMMON API DTOs
// ============================================================================

/**
 * Single item response wrapper
 * Used in endpoints that return a single resource
 */
export interface SingleItemResponse<T> {
  data: T;
}

/**
 * Convenience types for common single item responses
 */
export type FlashcardResponse = SingleItemResponse<FlashcardDTO>;
export type GenerationResponse = SingleItemResponse<GenerationDTO>;
export type BatchFlashcardsResponse = SingleItemResponse<CreateBatchFlashcardsResponse>;
export type GenerateResponse = SingleItemResponse<GenerateFlashcardsResponse>;

/**
 * Standard error response structure
 * Used in all error responses across the API
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string | string[]>;
}

/**
 * Health check response
 * Used in: GET /api/health
 */
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
}

// ============================================================================
// DATABASE ENTITY TYPES (Re-exported for convenience)
// ============================================================================

/**
 * Re-export database types for use in API implementation
 * These represent the actual database row structures
 */
export type FlashcardEntity = Tables<"flashcards">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;

export type GenerationEntity = Tables<"generations">;
export type GenerationInsert = TablesInsert<"generations">;
export type GenerationUpdate = TablesUpdate<"generations">;

export type GenerationErrorLogEntity = Tables<"generation_error_logs">;
export type GenerationErrorLogInsert = TablesInsert<"generation_error_logs">;
