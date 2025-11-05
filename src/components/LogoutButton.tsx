import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/db/supabase.client";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Sign out from Supabase
      await supabaseClient.auth.signOut();

      // Clear tokens from localStorage
      localStorage.removeItem("supabase_auth_token");
      localStorage.removeItem("supabase_refresh_token");

      // Call server endpoint to clear cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white hover:border-white/40"
    >
      {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
