import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { FlashcardListItemDTO, UpdateFlashcardCommand } from "@/types";

interface EditFlashcardModalProps {
  flashcard: FlashcardListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: UpdateFlashcardCommand) => Promise<void>;
}

export function EditFlashcardModal({ flashcard, isOpen, onClose, onSave }: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  // Reset form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setErrors({});
    }
  }, [flashcard]);

  // Validation
  const validate = (): boolean => {
    const newErrors: { front?: string; back?: string } = {};

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront) {
      newErrors.front = "Przód fiszki nie może być pusty";
    } else if (trimmedFront.length > 5000) {
      newErrors.front = "Przód fiszki nie może przekraczać 5000 znaków";
    }

    if (!trimmedBack) {
      newErrors.back = "Tył fiszki nie może być pusty";
    } else if (trimmedBack.length > 5000) {
      newErrors.back = "Tył fiszki nie może przekraczać 5000 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!flashcard || !validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(flashcard.id, {
        front: front.trim(),
        back: back.trim(),
      });
      onClose();
    } catch (error) {
      // Error handling is done in parent component
      console.error("Failed to save flashcard:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Wprowadź zmiany w treści fiszki. Pamiętaj, że oba pola są wymagane.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Front field */}
          <div className="space-y-2">
            <label
              htmlFor="edit-front"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Przód
            </label>
            <Textarea
              id="edit-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Treść przodu fiszki..."
              rows={4}
              disabled={isSaving}
              className={errors.front ? "border-destructive" : ""}
              aria-invalid={!!errors.front}
              aria-describedby={errors.front ? "edit-front-error" : undefined}
            />
            {errors.front && (
              <p id="edit-front-error" className="text-sm text-destructive">
                {errors.front}
              </p>
            )}
            <p className="text-xs text-muted-foreground select-none">{front.length} / 5000 znaków</p>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <label
              htmlFor="edit-back"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tył
            </label>
            <Textarea
              id="edit-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Treść tyłu fiszki..."
              rows={4}
              disabled={isSaving}
              className={errors.back ? "border-destructive" : ""}
              aria-invalid={!!errors.back}
              aria-describedby={errors.back ? "edit-back-error" : undefined}
            />
            {errors.back && (
              <p id="edit-back-error" className="text-sm text-destructive">
                {errors.back}
              </p>
            )}
            <p className="text-xs text-muted-foreground select-none">{back.length} / 5000 znaków</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Anuluj
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz zmiany"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
