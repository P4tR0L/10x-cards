/**
 * ManualAddTab Component
 * Form for manually adding flashcards with React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchAPI } from "@/lib/api-client";
import { flashcardFormSchema, type FlashcardFormData } from "@/lib/validation/flashcard.schema";
import type { CreateFlashcardCommand } from "@/types";

export function ManualAddTab() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      front: "",
      back: "",
    },
  });

  // Watch field values for character count
  const frontValue = watch("front");
  const backValue = watch("back");

  const onSubmit = async (data: FlashcardFormData) => {
    setApiError(null);
    setSuccessMessage(null);

    try {
      const command: CreateFlashcardCommand = {
        front: data.front,
        back: data.back,
      };

      const response = await fetchAPI("/api/flashcards", {
        method: "POST",
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się dodać fiszki");
      }

      // Success - clear form and show success message
      reset();
      setSuccessMessage("✓ Fiszka została dodana pomyślnie!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas dodawania fiszki";
      setApiError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Front field */}
      <div className="space-y-2">
        <label
          htmlFor="front"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Przód fiszki
        </label>
        <Textarea
          id="front"
          placeholder="Wpisz treść przodu fiszki..."
          disabled={isSubmitting}
          className="min-h-[120px]"
          aria-describedby={errors.front ? "front-error" : undefined}
          aria-invalid={!!errors.front}
          data-testid="flashcard-front-input"
          {...register("front")}
        />
        <div className="flex justify-between items-center">
          <div className="min-h-[20px]">
            {errors.front && (
              <p id="front-error" className="text-sm text-red-400" role="alert">
                {errors.front.message}
              </p>
            )}
          </div>
          <p className="text-xs text-foreground select-none">{frontValue.length} / 5000</p>
        </div>
      </div>

      {/* Back field */}
      <div className="space-y-2">
        <label
          htmlFor="back"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Tył fiszki
        </label>
        <Textarea
          id="back"
          placeholder="Wpisz treść tyłu fiszki..."
          disabled={isSubmitting}
          className="min-h-[120px]"
          aria-describedby={errors.back ? "back-error" : undefined}
          aria-invalid={!!errors.back}
          data-testid="flashcard-back-input"
          {...register("back")}
        />
        <div className="flex justify-between items-center">
          <div className="min-h-[20px]">
            {errors.back && (
              <p id="back-error" className="text-sm text-red-400" role="alert">
                {errors.back.message}
              </p>
            )}
          </div>
          <p className="text-xs text-foreground select-none">{backValue.length} / 5000</p>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-md text-red-400 text-sm" role="alert">
          {apiError}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          className="p-3 bg-green-950/30 border border-green-500/50 rounded-md text-green-400 text-sm"
          role="status"
          aria-live="polite"
          data-testid="flashcard-success-message"
        >
          {successMessage}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="flashcard-submit-button">
        {isSubmitting ? "Dodawanie..." : "Dodaj fiszkę"}
      </Button>
    </form>
  );
}
