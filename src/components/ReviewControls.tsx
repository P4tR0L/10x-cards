/**
 * ReviewControls Component
 * Navigation controls for review mode
 * Provides Previous/Next buttons
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function ReviewControls({ onPrevious, onNext, canGoPrevious, canGoNext }: ReviewControlsProps) {
  return (
    <div>
      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous button */}
        <Button
          variant="outline"
          size="default"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="min-w-[140px]"
          aria-label="Poprzednia fiszka"
          data-testid="review-previous-button"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Poprzednia
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next button */}
        <Button
          variant="default"
          size="default"
          onClick={onNext}
          className="min-w-[140px]"
          aria-label={canGoNext ? "Następna fiszka" : "Ukończ sesję i zobacz podsumowanie"}
          data-testid="review-next-button"
        >
          {canGoNext ? "Następna" : "Ukończ"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
