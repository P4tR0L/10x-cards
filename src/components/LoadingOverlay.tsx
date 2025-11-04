import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({
  message = "Generuję fiszki...",
}: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-sm w-full mx-4 text-center space-y-4">
        <Loader2
          className="h-12 w-12 animate-spin text-primary mx-auto"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-lg font-semibold">{message}</p>
          <p className="text-sm text-muted-foreground">
            To może potrwać kilka sekund...
          </p>
        </div>
      </div>
    </div>
  );
}

