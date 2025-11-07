/**
 * EditFlashcardModal Component
 * Modal for editing existing flashcards with React Hook Form + Zod validation
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { flashcardFormSchema, type FlashcardFormData } from "@/lib/validation/flashcard.schema";
import type { FlashcardListItemDTO, UpdateFlashcardCommand } from "@/types";

interface EditFlashcardModalProps {
  flashcard: FlashcardListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: UpdateFlashcardCommand) => Promise<void>;
}

export function EditFlashcardModal({ flashcard, isOpen, onClose, onSave }: EditFlashcardModalProps) {
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

  // Reset form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      reset({
        front: flashcard.front,
        back: flashcard.back,
      });
    }
  }, [flashcard, reset]);

  const onSubmit = async (data: FlashcardFormData) => {
    if (!flashcard) {
      return;
    }

    try {
      await onSave(flashcard.id, {
        front: data.front,
        back: data.back,
      });
      onClose();
    } catch {
      // Error handling is done in parent component
      // Errors are handled via toast in ManageFlashcards
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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

        <form onSubmit={handleSubmit(onSubmit)}>
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
                placeholder="Treść przodu fiszki..."
                rows={4}
                disabled={isSubmitting}
                className={errors.front ? "border-destructive" : ""}
                aria-invalid={!!errors.front}
                aria-describedby={errors.front ? "edit-front-error" : undefined}
                {...register("front")}
              />
              {errors.front && (
                <p id="edit-front-error" className="text-sm text-destructive">
                  {errors.front.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground select-none">{frontValue?.length || 0} / 5000 znaków</p>
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
                placeholder="Treść tyłu fiszki..."
                rows={4}
                disabled={isSubmitting}
                className={errors.back ? "border-destructive" : ""}
                aria-invalid={!!errors.back}
                aria-describedby={errors.back ? "edit-back-error" : undefined}
                {...register("back")}
              />
              {errors.back && (
                <p id="edit-back-error" className="text-sm text-destructive">
                  {errors.back.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground select-none">{backValue?.length || 0} / 5000 znaków</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
