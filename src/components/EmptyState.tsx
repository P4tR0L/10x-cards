import { Button } from "@/components/ui/button";
import { FileQuestion, Plus } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onCreateClick: () => void;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onCreateClick, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    // Empty state when filters are applied but no results
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
        <div className="rounded-full bg-muted p-6">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2 select-none">
          <h3 className="text-lg font-semibold">Brak wyników</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Nie znaleziono fiszek pasujących do wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania.
          </p>
        </div>
        <Button variant="outline" onClick={onClearFilters}>
          Wyczyść filtry
        </Button>
      </div>
    );
  }

  // Empty state when no flashcards exist at all
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="rounded-full bg-primary/10 p-6">
        <Plus className="h-12 w-12 text-primary" />
      </div>
      <div className="space-y-2 select-none">
        <h3 className="text-lg font-semibold">Nie masz jeszcze żadnych fiszek</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Zacznij tworzyć fiszki, aby budować swoją kolekcję. Możesz generować je automatycznie z AI lub dodawać
          ręcznie.
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Stwórz pierwszą fiszkę
      </Button>
    </div>
  );
}
