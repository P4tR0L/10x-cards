/**
 * Authentication Hook
 *
 * Provides authentication state and utilities for React components.
 * Integrates with Supabase Auth.
 */

import { useState, useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";

interface UseAuthReturn {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);

      try {
        // Check for token in localStorage
        const storedToken = localStorage.getItem("supabase_auth_token");

        if (storedToken) {
          // Verify token with Supabase
          const { data, error } = await supabaseClient.auth.getUser(storedToken);

          if (error || !data.user) {
            // Token is invalid, clear it
            localStorage.removeItem("supabase_auth_token");
            localStorage.removeItem("supabase_refresh_token");
            setToken(null);
          } else {
            // Token is valid
            setToken(storedToken);
          }
        } else {
          // No token found
          setToken(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        localStorage.setItem("supabase_auth_token", session.access_token);
        setToken(session.access_token);
      } else {
        localStorage.removeItem("supabase_auth_token");
        localStorage.removeItem("supabase_refresh_token");
        setToken(null);
      }
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    token,
    isLoading,
    isAuthenticated: !!token,
  };
}
