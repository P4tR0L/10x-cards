/**
 * ReviewControls Component
 * Navigation controls for review mode
 * Provides Previous/Next/Exit buttons
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ReviewControlsProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function ReviewControls({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  onExit,
  canGoPrevious,
  canGoNext,
}: ReviewControlsProps) {
  return (
    <div>
      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        {/* Previous button */}
        <Button
          variant="outline"
          size="default"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 max-w-[180px]"
          aria-label="Poprzednia fiszka"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Poprzednia
        </Button>

        {/* Exit button */}
        <Button
          variant="outline"
          size="default"
          onClick={onExit}
          className="px-4"
          aria-label="Zakończ sesję nauki"
        >
          <X className="mr-2 h-4 w-4" />
          Zakończ
        </Button>

        {/* Next button */}
        <Button
          variant="default"
          size="default"
          onClick={onNext}
          className="flex-1 max-w-[180px]"
          aria-label={canGoNext ? "Następna fiszka" : "Ukończ sesję i zobacz podsumowanie"}
        >
          {canGoNext ? "Następna" : "Ukończ"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

