import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, GraduationCap, SortAsc, SortDesc } from "lucide-react";
import type { FlashcardListQueryParams } from "@/types";

interface ToolBarProps {
  filters: FlashcardListQueryParams;
  onFiltersChange: (filters: FlashcardListQueryParams) => void;
  onReviewClick: () => void;
  hasFlashcards: boolean;
}

export function ToolBar({
  filters,
  onFiltersChange,
  onReviewClick,
  hasFlashcards,
}: ToolBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  // Debounce search with 300ms delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newSearch = searchValue.trim() === "" ? undefined : searchValue;
      if (newSearch !== filters.search) {
        onFiltersChange({
          ...filters,
          search: newSearch,
          page: 1, // Reset to first page on search
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleSourceChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        source: value === "all" ? undefined : (value as "manual" | "ai"),
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        sort: value as "created_at" | "updated_at",
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const handleOrderToggle = useCallback(() => {
    onFiltersChange({
      ...filters,
      order: filters.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  }, [filters, onFiltersChange]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left side: Search and Filters */}
      <div className="flex flex-col gap-3 flex-1 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj w fiszkach..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
            aria-label="Wyszukaj fiszki"
          />
        </div>

        {/* Source Filter */}
        <Select
          value={filters.source || "all"}
          onValueChange={handleSourceChange}
        >
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtruj według źródła">
            <SelectValue placeholder="Źródło" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="manual">Ręczne</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Select */}
        <div className="flex gap-2">
          <Select
            value={filters.sort || "created_at"}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sortuj według">
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Data utworzenia</SelectItem>
              <SelectItem value="updated_at">Data aktualizacji</SelectItem>
            </SelectContent>
          </Select>

          {/* Order Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleOrderToggle}
            aria-label={`Sortuj ${filters.order === "asc" ? "rosnąco" : "malejąco"}`}
            title={filters.order === "asc" ? "Sortuj malejąco" : "Sortuj rosnąco"}
          >
            {filters.order === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Right side: Review Button */}
      <Button
        onClick={onReviewClick}
        disabled={!hasFlashcards}
        className="w-full sm:w-auto"
        aria-label="Rozpocznij naukę"
      >
        <GraduationCap className="mr-2 h-4 w-4" />
        Ucz się
      </Button>
    </div>
  );
}

