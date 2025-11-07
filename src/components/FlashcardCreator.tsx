import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualAddTab } from "./ManualAddTab";
import { GenerateTab } from "./GenerateTab";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function FlashcardCreator() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Ładowanie...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Przekierowywanie do logowania...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Twórz fiszki</CardTitle>
          <CardDescription>Generuj fiszki automatycznie z pomocą AI lub dodaj własne</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate" data-testid="generate-tab">Generuj z AI</TabsTrigger>
              <TabsTrigger value="manual" data-testid="manual-tab">Dodaj własne</TabsTrigger>
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
