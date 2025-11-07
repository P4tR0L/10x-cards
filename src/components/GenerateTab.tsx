/**
 * GenerateTab Component
 * Form for generating flashcards using AI with React Hook Form + Zod validation
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOverlay } from "./LoadingOverlay";
import { ProposalsList } from "./ProposalsList";
import { BatchActionsBar } from "./BatchActionsBar";
import { fetchAPI } from "@/lib/api-client";
import { sourceTextSchema, type SourceTextFormData } from "@/lib/validation/flashcard.schema";
import type { ProposalData } from "./ProposalCard";
import type { GenerateFlashcardsResponse, CreateBatchFlashcardsCommand, BatchFlashcardItem } from "@/types";

export function GenerateTab() {
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SourceTextFormData>({
    resolver: zodResolver(sourceTextSchema),
    defaultValues: {
      sourceText: "",
    },
  });

  // Watch field value for character count and hints
  const sourceTextValue = watch("sourceText");
  const trimmedLength = sourceTextValue.trim().length;

  const onSubmit = async (data: SourceTextFormData) => {
    setApiError(null);

    try {
      const response = await fetchAPI("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          source_text: data.sourceText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się wygenerować fiszek");
      }

      const result = await response.json();
      const responseData: GenerateFlashcardsResponse = result.data;

      // Convert proposals to ProposalData format
      const proposalData: ProposalData[] = responseData.proposals.map((proposal, index) => ({
        id: `proposal-${index}`,
        front: proposal.front,
        back: proposal.back,
        isAccepted: false,
        isEdited: false,
      }));

      setGenerationId(responseData.generation_id);
      setProposals(proposalData);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas generowania fiszek";
      setApiError(errorMessage);
    }
  };

  const handleAccept = (id: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, isAccepted: !p.isAccepted } : p)));
  };

  const handleRemove = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (id: string, front: string, back: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, front, back, isEdited: true, isAccepted: true } : p))
    );
  };

  const handleSaveAccepted = async () => {
    if (!generationId) {
      return;
    }

    const acceptedProposals = proposals.filter((p) => p.isAccepted);
    if (acceptedProposals.length === 0) {
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const flashcards: BatchFlashcardItem[] = acceptedProposals.map((p) => ({
        front: p.front,
        back: p.back,
        edited: p.isEdited,
      }));

      const command: CreateBatchFlashcardsCommand = {
        flashcards,
        generation_id: generationId,
      };

      const response = await fetchAPI("/api/flashcards/batch", {
        method: "POST",
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się zapisać fiszek");
      }

      const result = await response.json();

      // Show success message
      setSuccessMessage(
        `✓ Zapisano ${result.data.created_count} ${result.data.created_count === 1 ? "fiszkę" : "fiszek"}!`
      );

      // Clear proposals and reset state
      setProposals([]);
      setGenerationId(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania fiszek";
      setApiError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectAll = () => {
    setProposals([]);
    setGenerationId(null);
    setApiError(null);
  };

  const handleAcceptAll = () => {
    setProposals((prev) => prev.map((p) => ({ ...p, isAccepted: true })));
  };

  const acceptedCount = proposals.filter((p) => p.isAccepted).length;

  // Show proposals view if we have proposals
  if (proposals.length > 0) {
    return (
      <div className="space-y-6">
        {isSaving && <LoadingOverlay message="Zapisywanie fiszek..." />}

        {apiError && (
          <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-md text-red-400 text-sm" role="alert">
            {apiError}
          </div>
        )}

        {successMessage && (
          <div
            className="p-3 bg-green-950/30 border border-green-500/50 rounded-md text-green-400 text-sm"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        <ProposalsList proposals={proposals} onAccept={handleAccept} onRemove={handleRemove} onEdit={handleEdit} />

        <BatchActionsBar
          acceptedCount={acceptedCount}
          totalCount={proposals.length}
          onSaveAccepted={handleSaveAccepted}
          onRejectAll={handleRejectAll}
          onAcceptAll={handleAcceptAll}
          isSaving={isSaving}
        />
      </div>
    );
  }

  // Show generation form if no proposals
  return (
    <>
      {isSubmitting && <LoadingOverlay message="Generuję fiszki..." />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {successMessage && (
          <div
            className="p-3 bg-green-950/30 border border-green-500/50 rounded-md text-green-400 text-sm"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="source-text"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Tekst źródłowy
          </label>
          <Textarea
            id="source-text"
            placeholder="Wklej tekst, z którego chcesz wygenerować fiszki (min. 100, max. 1000 znaków)..."
            disabled={isSubmitting}
            className="min-h-[200px]"
            aria-describedby={errors.sourceText ? "source-text-error" : "source-text-hint"}
            aria-invalid={!!errors.sourceText}
            {...register("sourceText")}
          />
          <div className="flex justify-between items-center">
            <div className="min-h-[20px]">
              {errors.sourceText && (
                <p id="source-text-error" className="text-sm text-red-400" role="alert">
                  {errors.sourceText.message}
                </p>
              )}
              {!errors.sourceText && trimmedLength > 0 && trimmedLength < 100 && (
                <p id="source-text-hint" className="text-sm text-muted-foreground">
                  Jeszcze {100 - trimmedLength} znaków do minimum
                </p>
              )}
              {!errors.sourceText && trimmedLength >= 100 && (
                <p id="source-text-hint" className="text-sm text-muted-foreground">
                  Gotowe do generowania!
                </p>
              )}
            </div>
            <p className="text-xs font-medium select-none text-foreground">{trimmedLength} / 1000</p>
          </div>
        </div>

        {apiError && (
          <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-md text-red-400 text-sm" role="alert">
            {apiError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </form>
    </>
  );
}
