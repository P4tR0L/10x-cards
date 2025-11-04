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
      className="relative w-full aspect-[3/2] md:aspect-[4/3] cursor-pointer perspective-1000"
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
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front side */}
        <Card
          className={`absolute inset-0 backface-hidden border-2 hover:border-primary/50 transition-colors ${
            isFlipped ? "pointer-events-none" : ""
          }`}
        >
          <CardContent className="h-full flex flex-col p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Badge
                variant={flashcard.source === "ai" ? "default" : "secondary"}
                className="text-sm"
              >
                {flashcard.source === "ai" ? "AI" : "Ręczna"}
              </Badge>
              <div className="text-sm font-semibold text-primary uppercase tracking-wide">
                Przód
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg md:text-2xl lg:text-3xl text-center leading-relaxed px-4">
                {flashcard.front}
              </p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-6">
              <RotateCcw className="h-4 w-4" />
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
          <CardContent className="h-full flex flex-col p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Badge
                variant={flashcard.source === "ai" ? "default" : "secondary"}
                className="text-sm"
              >
                {flashcard.source === "ai" ? "AI" : "Ręczna"}
              </Badge>
              <div className="text-sm font-semibold text-primary uppercase tracking-wide">
                Tył
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg md:text-2xl lg:text-3xl text-center leading-relaxed px-4">
                {flashcard.back}
              </p>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-6">
              <RotateCcw className="h-4 w-4" />
              <span>Kliknij, aby odwrócić</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

