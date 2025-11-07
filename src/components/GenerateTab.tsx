import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOverlay } from "./LoadingOverlay";
import { ProposalsList } from "./ProposalsList";
import { BatchActionsBar } from "./BatchActionsBar";
import { fetchAPI } from "@/lib/api-client";
import type { ProposalData } from "./ProposalCard";
import type { GenerateFlashcardsResponse, CreateBatchFlashcardsCommand, BatchFlashcardItem } from "@/types";

export function GenerateTab() {
  const [sourceText, setSourceText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateSourceText = (text: string): string | null => {
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return null; // Empty is okay, we just disable the button
    }

    if (trimmedText.length < 100) {
      return `Tekst musi mieć co najmniej 100 znaków (obecnie: ${trimmedText.length})`;
    }

    if (trimmedText.length > 1000) {
      return `Tekst nie może przekraczać 1000 znaków (obecnie: ${trimmedText.length})`;
    }

    return null;
  };

  const handleSourceTextChange = (value: string) => {
    setSourceText(value);
    const error = validateSourceText(value);
    setValidationError(error);
  };

  const isFormValid = (): boolean => {
    const trimmedText = sourceText.trim();
    return trimmedText.length >= 100 && trimmedText.length <= 1000 && !validationError;
  };

  const getCharacterCountColor = (): string => {
    return "text-foreground";
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      return;
    }

    setIsGenerating(true);
    setValidationError(null);

    try {
      const response = await fetchAPI("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          source_text: sourceText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się wygenerować fiszek");
      }

      const result = await response.json();
      const data: GenerateFlashcardsResponse = result.data;

      // Convert proposals to ProposalData format
      const proposalData: ProposalData[] = data.proposals.map((proposal, index) => ({
        id: `proposal-${index}`,
        front: proposal.front,
        back: proposal.back,
        isAccepted: false,
        isEdited: false,
      }));

      setGenerationId(data.generation_id);
      setProposals(proposalData);
      setSourceText("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas generowania fiszek";
      setValidationError(errorMessage);
    } finally {
      setIsGenerating(false);
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
    setValidationError(null);

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
      setValidationError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectAll = () => {
    setProposals([]);
    setGenerationId(null);
    setValidationError(null);
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

        {validationError && (
          <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-md text-red-400 text-sm" role="alert">
            {validationError}
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
      {isGenerating && <LoadingOverlay message="Generuję fiszki..." />}

      <form onSubmit={handleGenerate} className="space-y-6">
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
            value={sourceText}
            onChange={(e) => handleSourceTextChange(e.target.value)}
            disabled={isGenerating}
            className="min-h-[200px]"
            aria-describedby={validationError ? "source-text-error" : "source-text-hint"}
            aria-invalid={!!validationError}
          />
          <div className="flex justify-between items-center">
            <div className="min-h-[20px]">
              {validationError && (
                <p id="source-text-error" className="text-sm text-red-400" role="alert">
                  {validationError}
                </p>
              )}
              {!validationError && sourceText.trim().length > 0 && (
                <p id="source-text-hint" className="text-sm text-muted-foreground">
                  {sourceText.trim().length < 100
                    ? `Jeszcze ${100 - sourceText.trim().length} znaków do minimum`
                    : "Gotowe do generowania!"}
                </p>
              )}
            </div>
            <p className={`text-xs font-medium select-none ${getCharacterCountColor()}`}>
              {sourceText.trim().length} / 1000
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={!isFormValid() || isGenerating}>
          {isGenerating ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </form>
    </>
  );
}
