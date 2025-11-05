/**
 * FlashcardNavigator Component
 * Displays numbered tiles for quick navigation between flashcards
 * Supports horizontal scrolling for large numbers of cards
 */

import { useEffect, useRef } from "react";

interface FlashcardNavigatorProps {
  totalCards: number;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function FlashcardNavigator({ totalCards, currentIndex, onNavigate }: FlashcardNavigatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active card when it changes
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      activeButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  return (
    <div className="relative w-full">
      {/* Scrollable container - max 2 rows */}
      <div
        ref={scrollContainerRef}
        className="flex flex-wrap max-h-[5.5rem] overflow-y-clip overflow-x-auto gap-1.5 py-3 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        role="navigation"
        aria-label="Nawigacja po fiszkach"
      >
        {Array.from({ length: totalCards }, (_, index) => {
          const isActive = index === currentIndex;
          
          return (
            <button
              key={index}
              ref={isActive ? activeButtonRef : undefined}
              onClick={() => onNavigate(index)}
              className={`
                flex-shrink-0 w-8 h-8 rounded-md text-xs font-medium
                transition-all duration-200 cursor-pointer select-none
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:scale-105"
                }
              `}
              aria-label={`Przejdź do fiszki ${index + 1}`}
              aria-current={isActive ? "true" : undefined}
              type="button"
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

