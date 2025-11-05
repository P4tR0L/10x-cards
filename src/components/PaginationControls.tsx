import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMetadata } from "@/types";

interface PaginationControlsProps {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, total_pages, has_prev, has_next, total } = pagination;

  return (
    <div className="sticky bottom-0 bg-background border-t border-border p-4 shadow-lg rounded-t-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info text */}
        <p className="text-sm text-muted-foreground select-none">
          Strona {page} z {total_pages} (łącznie {total} {total === 1 ? "fiszka" : total < 5 ? "fiszki" : "fiszek"})
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!has_prev}
            aria-label="Poprzednia strona"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Poprzednia
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!has_next}
            aria-label="Następna strona"
          >
            Następna
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
