import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardListItemDTO } from "@/types";

interface FlashcardCardProps {
  flashcard: FlashcardListItemDTO;
  onEdit: (flashcard: FlashcardListItemDTO) => void;
  onDelete: (flashcard: FlashcardListItemDTO) => void;
}

export function FlashcardCard({ flashcard, onEdit, onDelete }: FlashcardCardProps) {
  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/50 h-full">
      <CardContent className="p-3 sm:p-4 space-y-3 h-full flex flex-col">
        {/* Header with Badge */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant={flashcard.source === "ai" ? "default" : "secondary"} className="shrink-0 text-xs">
            {flashcard.source === "ai" ? "AI" : "Własna"}
          </Badge>

          {/* Action buttons - always visible on mobile, hover on desktop */}
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => onEdit(flashcard)}
                    aria-label="Edytuj fiszkę"
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <p>Edytuj</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 hover:text-destructive"
                    onClick={() => onDelete(flashcard)}
                    aria-label="Usuń fiszkę"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <p>Usuń</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Front side */}
        <div className="space-y-1 flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Przód</div>
          <div className="h-[4.25rem] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{flashcard.front}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t shrink-0" />

        {/* Back side */}
        <div className="space-y-1 flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Tył</div>
          <div className="h-[4.25rem] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{flashcard.back}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
