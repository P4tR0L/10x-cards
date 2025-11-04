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
  front: z
    .string()
    .trim()
    .min(1, "Front field cannot be empty")
    .max(5000, "Front field cannot exceed 5000 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back field cannot be empty")
    .max(5000, "Back field cannot exceed 5000 characters"),
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
  front: z
    .string()
    .trim()
    .min(1, "Front field cannot be empty")
    .max(5000, "Front field cannot exceed 5000 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back field cannot be empty")
    .max(5000, "Back field cannot exceed 5000 characters"),
});

/**
 * Inferred TypeScript type from updateFlashcardSchema
 */
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

