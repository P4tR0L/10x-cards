import { Button } from "@/components/ui/button";
import { Save, X, Check } from "lucide-react";

interface BatchActionsBarProps {
  acceptedCount: number;
  totalCount: number;
  onSaveAccepted: () => void;
  onRejectAll: () => void;
  onAcceptAll: () => void;
  isSaving: boolean;
}

export function BatchActionsBar({
  acceptedCount,
  totalCount,
  onSaveAccepted,
  onRejectAll,
  onAcceptAll,
  isSaving,
}: BatchActionsBarProps) {
  return (
    <div className="sticky bottom-0 bg-background border-t border-border p-4 shadow-lg rounded-t-lg">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="text-sm text-muted-foreground select-none">
          {acceptedCount > 0 ? (
            <span>
              Wybrano <strong className="text-foreground">{acceptedCount}</strong>{" "}
              {acceptedCount === 1 ? "fiszkę" : "fiszek"} do zapisania
            </span>
          ) : (
            <span>Nie wybrano żadnych fiszek</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onAcceptAll}
            disabled={acceptedCount === totalCount || isSaving}
            className="flex-1 sm:flex-none"
          >
            <Check className="h-4 w-4 mr-2" />
            Zaakceptuj wszystkie
          </Button>

          <Button variant="outline" onClick={onRejectAll} disabled={isSaving} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Odrzuć wszystkie
          </Button>

          <Button onClick={onSaveAccepted} disabled={acceptedCount === 0 || isSaving} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Zapisywanie..." : "Zapisz zaakceptowane"}
          </Button>
        </div>
      </div>
    </div>
  );
}
