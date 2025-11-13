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
    <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 shadow-lg rounded-t-lg -mx-4 sm:mx-0">
      <div className="flex flex-col gap-3">
        <div className="text-sm text-muted-foreground select-none text-center sm:text-left">
          {acceptedCount > 0 ? (
            <span>
              Wybrano <strong className="text-foreground">{acceptedCount}</strong>{" "}
              {acceptedCount === 1 ? "fiszkę" : "fiszek"} do zapisania
            </span>
          ) : (
            <span>Nie wybrano żadnych fiszek</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onSaveAccepted}
            disabled={acceptedCount === 0 || isSaving}
            className="w-full sm:flex-1 order-1 sm:order-3"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Zapisywanie..." : "Zapisz zaakceptowane"}
          </Button>

          <Button
            variant="outline"
            onClick={onAcceptAll}
            disabled={acceptedCount === totalCount || isSaving}
            className="w-full sm:flex-1 order-2 sm:order-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Zaakceptuj wszystkie
          </Button>

          <Button
            variant="outline"
            onClick={onRejectAll}
            disabled={isSaving}
            className="w-full sm:flex-1 order-3 sm:order-2"
          >
            <X className="h-4 w-4 mr-2" />
            Odrzuć wszystkie
          </Button>
        </div>
      </div>
    </div>
  );
}
