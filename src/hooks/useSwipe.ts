/**
 * useSwipe Hook
 * Detects swipe gestures (left/right) on touch devices
 */

import { useEffect, useRef } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeOptions {
  minSwipeDistance?: number;
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { onSwipeLeft, onSwipeRight } = handlers;
  const { minSwipeDistance = 50 } = options;

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) {
        return;
      }

      const distance = touchStartX.current - touchEndX.current;
      const isSwipe = Math.abs(distance) > minSwipeDistance;

      if (isSwipe) {
        if (distance > 0) {
          // Swipe left
          onSwipeLeft?.();
        } else {
          // Swipe right
          onSwipeRight?.();
        }
      }

      // Reset
      touchStartX.current = null;
      touchEndX.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance]);
}

