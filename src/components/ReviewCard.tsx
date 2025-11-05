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
      className="relative w-full aspect-[2/1] cursor-pointer perspective-1000 isolate"
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
          className={`absolute inset-0 backface-hidden border-2 border-blue-500/30 hover:border-blue-500/60 bg-card transition-colors ${
            isFlipped ? "pointer-events-none" : ""
          }`}
        >
          <CardContent className="h-full flex flex-col p-2 md:p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant={flashcard.source === "ai" ? "default" : "secondary"} className="text-xs">
                {flashcard.source === "ai" ? "AI" : "Własna"}
              </Badge>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Przód</div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm md:text-base lg:text-lg text-center leading-relaxed px-2">{flashcard.front}</p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mt-2">
              <RotateCcw className="h-3 w-3" />
              <span>Kliknij, aby odwrócić</span>
            </div>
          </CardContent>
        </Card>

        {/* Back side */}
        <Card
          className={`absolute inset-0 backface-hidden border-2 border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-card to-purple-950/5 transition-colors rotate-y-180 ${
            !isFlipped ? "pointer-events-none" : ""
          }`}
        >
          <CardContent className="h-full flex flex-col p-2 md:p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant={flashcard.source === "ai" ? "default" : "secondary"} className="text-xs">
                {flashcard.source === "ai" ? "AI" : "Własna"}
              </Badge>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Tył</div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm md:text-base lg:text-lg text-center leading-relaxed px-2">{flashcard.back}</p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mt-2">
              <RotateCcw className="h-3 w-3" />
              <span>Kliknij, aby odwrócić</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
