/**
 * CompletionScreen Component
 * Displayed after user completes reviewing all flashcards
 * Shows congratulations and options to restart or return to collection
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, ArrowLeft } from "lucide-react";

interface CompletionScreenProps {
  totalCards: number;
  onRestart: () => void;
  onExit: () => void;
}

export function CompletionScreen({
  totalCards,
  onRestart,
  onExit,
}: CompletionScreenProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <Card className="backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl">
              Gratulacje! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              Ukończyłeś sesję nauki
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Summary */}
          <div className="text-center space-y-4">
            <div className="bg-muted rounded-lg p-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {totalCards}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalCards === 1 ? "fiszka przejrzana" : totalCards < 5 ? "fiszki przejrzane" : "fiszek przejrzanych"}
              </div>
            </div>

            <p className="text-muted-foreground">
              Świetna robota! Kontynuuj regularną naukę, aby utrwalić materiał.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
            className="w-full sm:w-auto min-w-[180px]"
            aria-label="Rozpocznij naukę od nowa"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Zacznij od nowa
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={onExit}
            className="w-full sm:w-auto min-w-[180px]"
            aria-label="Wróć do kolekcji fiszek"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Wróć do kolekcji
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

