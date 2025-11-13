import { FlashcardCard } from "./FlashcardCard";
import type { FlashcardListItemDTO } from "@/types";

interface FlashcardGridProps {
  flashcards: FlashcardListItemDTO[];
  onEdit: (flashcard: FlashcardListItemDTO) => void;
  onDelete: (flashcard: FlashcardListItemDTO) => void;
}

export function FlashcardGrid({ flashcards, onEdit, onDelete }: FlashcardGridProps) {
  return (
    <div
      className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Lista fiszek"
    >
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} role="listitem">
          <FlashcardCard flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
