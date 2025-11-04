import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearDevToken } from "@/lib/auth-dev";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear dev token
      clearDevToken();
      
      // Redirect to home with reload to reset auth state
      window.location.href = "/";
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
      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
    >
      {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}

