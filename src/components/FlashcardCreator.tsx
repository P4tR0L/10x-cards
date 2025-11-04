import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ManualAddTab } from "./ManualAddTab";
import { GenerateTab } from "./GenerateTab";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function FlashcardCreator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Inicjalizacja...</p>
              <p className="text-xs text-muted-foreground">
                (Tworzenie testowego użytkownika)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-red-600">
                Błąd inicjalizacji
              </p>
              <p className="text-muted-foreground">
                Nie udało się zalogować testowego użytkownika.
              </p>
              <p className="text-sm text-muted-foreground">
                Sprawdź czy Supabase jest uruchomiony i czy zmienne środowiskowe
                są poprawnie skonfigurowane.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Twórz Fiszki</CardTitle>
          <CardDescription>
            Generuj fiszki automatycznie z pomocą AI lub dodaj je ręcznie
          </CardDescription>
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              DEV MODE
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generuj z AI</TabsTrigger>
              <TabsTrigger value="manual">Dodaj Ręcznie</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <GenerateTab />
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <ManualAddTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

