/**
 * ReviewControls Component
 * Navigation controls for review mode
 * Shows progress and provides Previous/Next/Exit buttons
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  const progress = ((currentIndex + 1) / totalCards) * 100;
  const currentCardNumber = currentIndex + 1;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            Fiszka {currentCardNumber} z {totalCards}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% ukończone
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous button */}
        <Button
          variant="outline"
          size="lg"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 max-w-[200px]"
          aria-label="Poprzednia fiszka"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Poprzednia
        </Button>

        {/* Exit button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onExit}
          className="px-6"
          aria-label="Zakończ sesję nauki"
        >
          <X className="mr-2 h-5 w-5" />
          Zakończ
        </Button>

        {/* Next button */}
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          className="flex-1 max-w-[200px]"
          aria-label={canGoNext ? "Następna fiszka" : "Ukończ sesję i zobacz podsumowanie"}
        >
          {canGoNext ? "Następna" : "Ukończ"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

