/**
 * ReviewMode Component
 * Main component for flashcard review/learning mode
 * Manages state, loads flashcards, handles navigation
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSwipe } from "@/hooks/useSwipe";
import { getFlashcards } from "@/lib/api-client";
import type { FlashcardListItemDTO } from "@/types";
import { ReviewCard } from "./ReviewCard";
import { ReviewControls } from "./ReviewControls";
import { CompletionScreen } from "./CompletionScreen";
import { LoadingOverlay } from "./LoadingOverlay";
import { toast } from "sonner";

export function ReviewMode() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  
  // State management
  const [flashcards, setFlashcards] = useState<FlashcardListItemDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Load all flashcards on mount
  useEffect(() => {
    async function loadFlashcards() {
      if (authLoading || !isAuthenticated) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Load all flashcards - fetch multiple pages if needed (max 100 per page)
        let allFlashcards: FlashcardListItemDTO[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await getFlashcards({ 
            page: currentPage, 
            limit: 100, 
            sort: "created_at", 
            order: "asc" 
          });
          
          allFlashcards = [...allFlashcards, ...response.data];
          hasMore = response.pagination.has_next;
          currentPage++;
        }
        
        if (allFlashcards.length === 0) {
          // No flashcards - redirect to manage with toast
          toast.info("Brak fiszek do nauki. Utwórz najpierw jakieś fiszki!");
          window.location.href = "/manage";
          return;
        }

        setFlashcards(allFlashcards);
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast.error("Nie udało się załadować fiszek");
        // Redirect to manage on error
        setTimeout(() => {
          window.location.href = "/manage";
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }

    loadFlashcards();
  }, [authLoading, isAuthenticated]);

  // Handle card flip
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const newFlipped = !prev;
      setAnnouncement(newFlipped ? "Tył fiszki" : "Przód fiszki");
      return newFlipped;
    });
  }, []);

  // Handle navigation
  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setIsFlipped(false);
      setAnnouncement(`Fiszka ${newIndex + 1} z ${flashcards.length}`);
    } else {
      // Reached the end - show completion screen
      setIsCompleted(true);
      setAnnouncement("Ukończono wszystkie fiszki");
    }
  }, [currentIndex, flashcards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setIsFlipped(false);
      setAnnouncement(`Fiszka ${newIndex + 1} z ${flashcards.length}`);
    }
  }, [currentIndex, flashcards.length]);

  // Handle restart (from completion screen)
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, []);

  // Handle exit
  const handleExit = useCallback(() => {
    window.location.href = "/manage";
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't interfere if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case " ": // Space - flip card
        case "Enter":
          event.preventDefault();
          if (!isCompleted) {
            handleFlip();
          }
          break;
        case "ArrowLeft": // Left arrow - previous
          event.preventDefault();
          if (!isCompleted) {
            handlePrevious();
          }
          break;
        case "ArrowRight": // Right arrow - next
          event.preventDefault();
          if (!isCompleted) {
            handleNext();
          }
          break;
        case "Escape": // Escape - exit
          event.preventDefault();
          handleExit();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrevious, handleExit, isCompleted]);

  // Swipe gestures for mobile
  useSwipe({
    onSwipeLeft: () => {
      if (!isCompleted) {
        handleNext();
      }
    },
    onSwipeRight: () => {
      if (!isCompleted) {
        handlePrevious();
      }
    },
  }, { minSwipeDistance: 50 });

  // Show loading state
  if (authLoading || isLoading) {
    return <LoadingOverlay message="Ładowanie fiszek..." />;
  }

  // Show completion screen
  if (isCompleted) {
    return (
      <CompletionScreen
        totalCards={flashcards.length}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  // Get current flashcard
  const currentFlashcard = flashcards[currentIndex];

  if (!currentFlashcard) {
    return <LoadingOverlay message="Ładowanie..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" role="main" aria-label="Tryb nauki fiszek">
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Main review area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-0">
        <div className="w-full max-w-4xl">
          <ReviewCard
            flashcard={currentFlashcard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </div>
      </div>

      {/* Controls area */}
      <div className="border-t bg-card/50 p-4 md:p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <ReviewControls
            currentIndex={currentIndex}
            totalCards={flashcards.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onExit={handleExit}
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < flashcards.length - 1}
          />
        </div>
      </div>

      {/* Keyboard hints */}
      <div 
        className="hidden md:block fixed bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg border z-20"
        aria-hidden="true"
      >
        <div className="space-y-1">
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded">Space</kbd> Odwróć</div>
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded">←→</kbd> Nawigacja</div>
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Wyjdź</div>
        </div>
      </div>
    </div>
  );
}

