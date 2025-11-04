import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchAPI } from "@/lib/api-client";
import type { CreateFlashcardCommand } from "@/types";

interface ValidationErrors {
  front?: string;
  back?: string;
}

export function ManualAddTab() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateField = (
    field: "front" | "back",
    value: string
  ): string | undefined => {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return undefined; // Empty is okay, we just disable the button
    }

    if (trimmedValue.length < 1) {
      return "Pole nie może być puste";
    }

    if (trimmedValue.length > 5000) {
      return "Maksymalnie 5000 znaków";
    }

    return undefined;
  };

  const handleFrontChange = (value: string) => {
    setFront(value);
    const error = validateField("front", value);
    setValidationErrors((prev) => ({ ...prev, front: error }));
    setSuccessMessage(null);
  };

  const handleBackChange = (value: string) => {
    setBack(value);
    const error = validateField("back", value);
    setValidationErrors((prev) => ({ ...prev, back: error }));
    setSuccessMessage(null);
  };

  const isFormValid = (): boolean => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    // Both fields must be non-empty
    if (trimmedFront.length === 0 || trimmedBack.length === 0) {
      return false;
    }

    // No validation errors
    if (validationErrors.front || validationErrors.back) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});
    setSuccessMessage(null);

    try {
      const command: CreateFlashcardCommand = {
        front: front.trim(),
        back: back.trim(),
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
      setFront("");
      setBack("");
      setSuccessMessage("✓ Fiszka została dodana pomyślnie!");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas dodawania fiszki";
      setValidationErrors({
        front: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          value={front}
          onChange={(e) => handleFrontChange(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[120px]"
          aria-describedby={validationErrors.front ? "front-error" : undefined}
          aria-invalid={!!validationErrors.front}
        />
        <div className="flex justify-between items-center">
          <div className="min-h-[20px]">
            {validationErrors.front && (
              <p id="front-error" className="text-sm text-red-600" role="alert">
                {validationErrors.front}
              </p>
            )}
          </div>
          <p
            className={`text-xs ${
              front.trim().length > 5000
                ? "text-red-600"
                : front.trim().length >= 1
                  ? "text-green-600"
                  : "text-muted-foreground"
            }`}
          >
            {front.length} / 5000
          </p>
        </div>
      </div>

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
          value={back}
          onChange={(e) => handleBackChange(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[120px]"
          aria-describedby={validationErrors.back ? "back-error" : undefined}
          aria-invalid={!!validationErrors.back}
        />
        <div className="flex justify-between items-center">
          <div className="min-h-[20px]">
            {validationErrors.back && (
              <p id="back-error" className="text-sm text-red-600" role="alert">
                {validationErrors.back}
              </p>
            )}
          </div>
          <p
            className={`text-xs ${
              back.trim().length > 5000
                ? "text-red-600"
                : back.trim().length >= 1
                  ? "text-green-600"
                  : "text-muted-foreground"
            }`}
          >
            {back.length} / 5000
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid() || isSubmitting}
      >
        {isSubmitting ? "Dodawanie..." : "Dodaj fiszkę"}
      </Button>
    </form>
  );
}

