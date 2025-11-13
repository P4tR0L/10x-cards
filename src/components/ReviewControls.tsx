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
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Previous button */}
        <Button
          variant="outline"
          size="default"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 sm:min-w-[140px] sm:flex-none"
          aria-label="Poprzednia fiszka"
          data-testid="review-previous-button"
        >
          <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
          <span className="hidden xs:inline">Poprzednia</span>
          <span className="inline xs:hidden">Poprz.</span>
        </Button>

        {/* Spacer */}
        <div className="hidden sm:block flex-1" />

        {/* Next button */}
        <Button
          variant="default"
          size="default"
          onClick={onNext}
          className="flex-1 sm:min-w-[140px] sm:flex-none"
          aria-label={canGoNext ? "Następna fiszka" : "Ukończ sesję i zobacz podsumowanie"}
          data-testid="review-next-button"
        >
          <span className="hidden xs:inline">{canGoNext ? "Następna" : "Ukończ"}</span>
          <span className="inline xs:hidden">{canGoNext ? "Nast." : "Ukończ"}</span>
          <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
