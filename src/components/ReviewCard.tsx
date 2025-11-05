/**
 * ReviewCard Component
 * Large flashcard with 3D flip animation
 * Shows front or back based on flip state
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlashcardListItemDTO } from "@/types";
import { RotateCcw } from "lucide-react";

interface ReviewCardProps {
  flashcard: FlashcardListItemDTO;
  isFlipped: boolean;
  onFlip: () => void;
}

export function ReviewCard({ flashcard, isFlipped, onFlip }: ReviewCardProps) {
  return (
    <div
      className="relative w-full aspect-[16/9] cursor-pointer perspective-1000 isolate"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "Odwróć na przód fiszki" : "Odwróć na tył fiszki"}
      aria-pressed={isFlipped}
    >
      {/* 3D flip container */}
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d will-change-transform ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front side */}
        <Card
          className={`absolute inset-0 backface-hidden border-2 hover:border-primary/50 transition-colors ${
            isFlipped ? "pointer-events-none" : ""
          }`}
        >
          <CardContent className="h-full flex flex-col p-3 md:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant={flashcard.source === "ai" ? "default" : "secondary"} className="text-xs">
                {flashcard.source === "ai" ? "AI" : "Własna"}
              </Badge>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Przód</div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm md:text-lg lg:text-xl text-center leading-relaxed px-2">{flashcard.front}</p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mt-3">
              <RotateCcw className="h-3 w-3" />
              <span>Kliknij, aby odwrócić</span>
            </div>
          </CardContent>
        </Card>

        {/* Back side */}
        <Card
          className={`absolute inset-0 backface-hidden border-2 hover:border-primary/50 transition-colors rotate-y-180 ${
            !isFlipped ? "pointer-events-none" : ""
          }`}
        >
          <CardContent className="h-full flex flex-col p-3 md:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant={flashcard.source === "ai" ? "default" : "secondary"} className="text-xs">
                {flashcard.source === "ai" ? "AI" : "Własna"}
              </Badge>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Tył</div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm md:text-lg lg:text-xl text-center leading-relaxed px-2">{flashcard.back}</p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mt-3">
              <RotateCcw className="h-3 w-3" />
              <span>Kliknij, aby odwrócić</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
