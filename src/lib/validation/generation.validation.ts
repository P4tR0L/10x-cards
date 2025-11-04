/**
 * Validation schemas for generation-related API endpoints
 */

import { z } from "zod";

/**
 * Schema for validating AI generation request
 * Validates source text length: 100-1000 characters after trimming
 */
export const createGenerationSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(100, "Source text must be at least 100 characters long")
    .max(1000, "Source text must not exceed 1000 characters"),
});

/**
 * Inferred TypeScript type from the schema
 */
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;

/**
 * Schema for updating generation metrics
 * Used when flashcards are accepted from AI proposals
 */
export const updateGenerationMetricsSchema = z
  .object({
    accepted_unedited_count: z.number().int().min(0).optional(),
    accepted_edited_count: z.number().int().min(0).optional(),
  })
  .refine((data) => data.accepted_unedited_count !== undefined || data.accepted_edited_count !== undefined, {
    message: "At least one field must be provided",
  });

/**
 * Inferred TypeScript type from the schema
 */
export type UpdateGenerationMetricsInput = z.infer<typeof updateGenerationMetricsSchema>;
