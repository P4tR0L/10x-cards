/**
 * TEMPORARY DEV AUTH HOOK
 *
 * This hook provides temporary authentication for development.
 * It will be replaced with proper Supabase Auth integration in production.
 */

import { useState, useEffect } from "react";
import { initDevAuth, getDevToken, verifyDevToken } from "@/lib/auth-dev";

interface UseAuthReturn {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      // Check for existing token
      let currentToken = getDevToken();

      // If we have a token, verify it
      if (currentToken) {
        const isValid = await verifyDevToken(currentToken);
        if (!isValid) {
          currentToken = null;
        }
      }

      // If no valid token, initialize new one
      if (!currentToken) {
        currentToken = await initDevAuth();
      }

      setToken(currentToken);
      setIsLoading(false);
    }

    initAuth();
  }, []);

  return {
    token,
    isLoading,
    isAuthenticated: !!token,
  };
}
