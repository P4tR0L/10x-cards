/**
 * Flashcard form validation schemas using Zod
 * Provides type-safe validation for flashcard creation and editing
 */

import { z } from "zod";

/**
 * Flashcard side (front/back) validation schema
 * - Must not be empty after trimming
 * - Maximum 5000 characters
 */
const flashcardSideSchema = z
  .string()
  .min(1, "To pole nie może być puste")
  .max(5000, "Maksymalnie 5000 znaków")
  .transform((val) => val.trim());

/**
 * Manual flashcard creation/edit form schema
 */
export const flashcardFormSchema = z.object({
  front: flashcardSideSchema,
  back: flashcardSideSchema,
});

/**
 * Source text validation for AI generation
 * - Minimum 100 characters
 * - Maximum 1000 characters
 */
export const sourceTextSchema = z.object({
  sourceText: z
    .string()
    .min(1, "Tekst źródłowy jest wymagany")
    .transform((val) => val.trim())
    .pipe(
      z.string().min(100, "Tekst musi mieć co najmniej 100 znaków").max(1000, "Tekst nie może przekraczać 1000 znaków")
    ),
});

/**
 * TypeScript types inferred from schemas
 */
export type FlashcardFormData = z.infer<typeof flashcardFormSchema>;
export type SourceTextFormData = z.infer<typeof sourceTextSchema>;
