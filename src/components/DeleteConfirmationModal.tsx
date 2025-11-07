import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import type { FlashcardListItemDTO } from "@/types";

interface DeleteConfirmationModalProps {
  flashcard: FlashcardListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteConfirmationModal({ flashcard, isOpen, onClose, onConfirm }: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!flashcard) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(flashcard.id);
      onClose();
    } catch {
      // Error handling is done in parent component
      // Errors are handled via toast in ManageFlashcards
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Usuń fiszkę</DialogTitle>
          </div>
          <DialogDescription>Ta operacja jest nieodwracalna. Czy na pewno chcesz usunąć tę fiszkę?</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Przód</p>
              <p className="text-sm line-clamp-2">{flashcard.front}</p>
            </div>
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tył</p>
              <p className="text-sm line-clamp-2">{flashcard.back}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń fiszkę"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
