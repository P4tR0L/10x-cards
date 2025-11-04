import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardListItemDTO } from "@/types";

interface FlashcardCardProps {
  flashcard: FlashcardListItemDTO;
  onEdit: (flashcard: FlashcardListItemDTO) => void;
  onDelete: (flashcard: FlashcardListItemDTO) => void;
}

export function FlashcardCard({
  flashcard,
  onEdit,
  onDelete,
}: FlashcardCardProps) {
  return (
    <Card className="group transition-all hover:shadow-md hover:border-primary/50">
      <CardContent className="p-4 space-y-3">
        {/* Header with Badge */}
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={flashcard.source === "ai" ? "default" : "secondary"}
            className="shrink-0"
          >
            {flashcard.source === "ai" ? "AI" : "Ręczna"}
          </Badge>

          {/* Action buttons - visible on hover */}
          <TooltipProvider>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(flashcard)}
                    aria-label="Edytuj fiszkę"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edytuj</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => onDelete(flashcard)}
                    aria-label="Usuń fiszkę"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Usuń</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Front side */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Przód
          </div>
          <p className="text-sm leading-relaxed line-clamp-3" title={flashcard.front}>
            {flashcard.front}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Back side */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tył
          </div>
          <p className="text-sm leading-relaxed line-clamp-3" title={flashcard.back}>
            {flashcard.back}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

