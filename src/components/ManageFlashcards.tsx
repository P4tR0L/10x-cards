import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolBar } from "./ToolBar";
import { FlashcardGrid } from "./FlashcardGrid";
import { PaginationControls } from "./PaginationControls";
import { EmptyState } from "./EmptyState";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { getFlashcards, updateFlashcard, deleteFlashcard } from "@/lib/api-client";
import type {
  FlashcardListItemDTO,
  FlashcardListQueryParams,
  PaginationMetadata,
  UpdateFlashcardCommand,
} from "@/types";

export function ManageFlashcards() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  // Ref for scrolling to flashcards grid
  const flashcardsGridRef = useRef<HTMLDivElement>(null);

  // State management
  const [flashcards, setFlashcards] = useState<FlashcardListItemDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 30,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [filters, setFilters] = useState<FlashcardListQueryParams>({
    page: 1,
    limit: 30,
    search: undefined,
    source: undefined,
    sort: "created_at",
    order: "desc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldScrollToGrid, setShouldScrollToGrid] = useState(false);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardListItemDTO | null>(null);

  // Fetch flashcards
  const fetchFlashcardsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFlashcards(filters);
      setFlashcards(response.data);
      setPagination(response.pagination);

      // Scroll to grid after data is loaded (small delay for DOM update)
      if (shouldScrollToGrid && flashcardsGridRef.current) {
        setTimeout(() => {
          flashcardsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          setShouldScrollToGrid(false);
        }, 100);
      }
    } catch (error) {
      toast.error("Nie udało się pobrać fiszek", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie później",
      });
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [filters, shouldScrollToGrid]);

  // Fetch on mount and when filters change
  useEffect(() => {
    // Only fetch when auth is complete (not loading) and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchFlashcardsData();
    }
  }, [authLoading, isAuthenticated, fetchFlashcardsData]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FlashcardListQueryParams) => {
    setFilters(newFilters);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setShouldScrollToGrid(true);
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Handle edit click
  const handleEditClick = useCallback((flashcard: FlashcardListItemDTO) => {
    setSelectedFlashcard(flashcard);
    setEditModalOpen(true);
  }, []);

  // Handle delete click
  const handleDeleteClick = useCallback((flashcard: FlashcardListItemDTO) => {
    setSelectedFlashcard(flashcard);
    setDeleteModalOpen(true);
  }, []);

  // Handle save (edit)
  const handleSave = useCallback(
    async (id: number, data: UpdateFlashcardCommand) => {
      try {
        // Optimistic update
        setFlashcards((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, front: data.front, back: data.back, updated_at: new Date().toISOString() } : f
          )
        );

        // API call
        const response = await updateFlashcard(id, data);

        // Update with real data from server
        setFlashcards((prev) => prev.map((f) => (f.id === id ? response.data : f)));

        toast.success("Fiszka zaktualizowana", {
          description: "Zmiany zostały zapisane pomyślnie",
        });
      } catch (error) {
        // Rollback on error
        toast.error("Nie udało się zaktualizować fiszki", {
          description: error instanceof Error ? error.message : "Spróbuj ponownie",
        });
        // Refetch to ensure consistency
        fetchFlashcardsData();
        throw error;
      }
    },
    [fetchFlashcardsData]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        // Optimistic update
        setFlashcards((prev) => prev.filter((f) => f.id !== id));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));

        // API call
        await deleteFlashcard(id);

        toast.success("Fiszka usunięta", {
          description: "Fiszka została usunięta pomyślnie",
        });

        // Refetch to update pagination correctly
        fetchFlashcardsData();
      } catch (error) {
        // Rollback on error
        toast.error("Nie udało się usunąć fiszki", {
          description: error instanceof Error ? error.message : "Spróbuj ponownie",
        });
        // Refetch to ensure consistency
        fetchFlashcardsData();
        throw error;
      }
    },
    [fetchFlashcardsData]
  );

  // Handle create flashcard button click (from EmptyState)
  const handleCreateClick = useCallback(() => {
    window.location.assign("/");
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 30,
      search: undefined,
      source: undefined,
      sort: "created_at",
      order: "desc",
    });
  }, []);

  // Check if filters are active
  const hasActiveFilters = !!filters.search || filters.source !== undefined;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Inicjalizacja...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth error state
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-red-400">Błąd uwierzytelnienia</p>
              <p className="text-muted-foreground">Musisz być zalogowany, aby zarządzać fiszkami.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <Card className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl">Zarządzaj kolekcją</CardTitle>
            <CardDescription>Przeglądaj, wyszukuj, edytuj i usuwaj swoje fiszki</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ToolBar */}
            <ToolBar filters={filters} onFiltersChange={handleFiltersChange} />

            {/* Main content */}
            {isLoading && isInitialLoad ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Ładowanie fiszek...</p>
                </div>
              </div>
            ) : flashcards.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <>
                {/* Loading overlay for subsequent loads */}
                {isLoading && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </div>
                )}

                {/* FlashcardGrid */}
                <div
                  ref={flashcardsGridRef}
                  className={pagination.total_pages > 1 ? "pb-24 scroll-mt-20" : "scroll-mt-20"}
                >
                  <FlashcardGrid flashcards={flashcards} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                </div>

                {/* PaginationControls */}
                {pagination.total_pages > 1 && (
                  <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <EditFlashcardModal
        flashcard={selectedFlashcard}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedFlashcard(null);
        }}
        onSave={handleSave}
      />

      <DeleteConfirmationModal
        flashcard={selectedFlashcard}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFlashcard(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
