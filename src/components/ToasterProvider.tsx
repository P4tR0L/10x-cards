import { Toaster } from "@/components/ui/sonner";

/**
 * Toast notification provider component
 * Wraps Sonner's Toaster for use across the app
 */
export function ToasterProvider() {
  return <Toaster position="top-right" richColors />;
}

