/**
 * Flashcard validation schemas
 *
 * This module contains all Zod validation schemas for flashcard operations.
 * Schemas are used to validate incoming API requests before processing.
 */

import { z } from "zod";

/**
 * Schema for creating a single manual flashcard
 *
 * Validation rules:
 * - front: 1-5000 characters, non-empty after trim
 * - back: 1-5000 characters, non-empty after trim
 *
 * Used in: POST /api/flashcards
 */
export const createFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front field cannot be empty").max(5000, "Front field cannot exceed 5000 characters"),
  back: z.string().trim().min(1, "Back field cannot be empty").max(5000, "Back field cannot exceed 5000 characters"),
});

/**
 * Inferred TypeScript type from createFlashcardSchema
 * This type represents validated input data for creating a flashcard
 */
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;

/**
 * Schema for updating an existing flashcard
 *
 * Validation rules are the same as createFlashcardSchema:
 * - front: 1-5000 characters, non-empty after trim
 * - back: 1-5000 characters, non-empty after trim
 *
 * Used in: PUT /api/flashcards/{id}
 */
export const updateFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front field cannot be empty").max(5000, "Front field cannot exceed 5000 characters"),
  back: z.string().trim().min(1, "Back field cannot be empty").max(5000, "Back field cannot exceed 5000 characters"),
});

/**
 * Inferred TypeScript type from updateFlashcardSchema
 */
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

/**
 * Schema for a single flashcard item in batch creation
 *
 * Validation rules:
 * - front: 1-5000 characters, non-empty after trim
 * - back: 1-5000 characters, non-empty after trim
 * - edited: boolean flag indicating if user modified the AI proposal
 *
 * Used in: POST /api/flashcards/batch (within the flashcards array)
 */
export const batchFlashcardItemSchema = z.object({
  front: z.string().trim().min(1, "Front field cannot be empty").max(5000, "Front field cannot exceed 5000 characters"),
  back: z.string().trim().min(1, "Back field cannot be empty").max(5000, "Back field cannot exceed 5000 characters"),
  edited: z.boolean({
    required_error: "Edited field is required",
    invalid_type_error: "Edited field must be a boolean",
  }),
});

/**
 * Schema for batch flashcard creation request
 *
 * Validation rules:
 * - flashcards: array of 1-50 flashcard items
 * - generation_id: positive integer referencing a generation session
 *
 * Used in: POST /api/flashcards/batch
 */
export const createBatchFlashcardsSchema = z.object({
  flashcards: z
    .array(batchFlashcardItemSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
  generation_id: z
    .number({
      required_error: "Generation ID is required",
      invalid_type_error: "Generation ID must be a number",
    })
    .int("Generation ID must be an integer")
    .positive("Generation ID must be positive"),
});

/**
 * Inferred TypeScript types from batch schemas
 */
export type BatchFlashcardItemInput = z.infer<typeof batchFlashcardItemSchema>;
export type CreateBatchFlashcardsInput = z.infer<typeof createBatchFlashcardsSchema>;
