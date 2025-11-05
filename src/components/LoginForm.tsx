/**
 * LoginForm Component
 * 
 * Provides email/password authentication form with:
 * - Email and password inputs with validation
 * - Error handling and inline error messages
 * - Accessibility features (ARIA labels, focus management)
 * - Password visibility toggle
 * - Auto-redirect after successful login
 */

import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseClient } from "@/db/supabase.client";

interface LoginFormProps {
  /** Callback fired after successful login */
  onSuccess?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Adres e-mail jest wymagany";
    } else if (!validateEmail(email)) {
      newErrors.email = "Nieprawidłowy format adresu e-mail";
    }

    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Handle authentication errors
        setErrors({
          general: "Nieprawidłowy adres e-mail lub hasło",
        });
        return;
      }

      if (data.session) {
        // Store session tokens in localStorage for client-side use
        localStorage.setItem("supabase_auth_token", data.session.access_token);
        localStorage.setItem("supabase_refresh_token", data.session.refresh_token);
        
        // Set cookies for SSR (server-side rendering)
        // This is done by calling a server endpoint
        await fetch("/api/auth/set-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });
        
        // Call success callback or redirect
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 w-full max-w-sm"
      role="form"
      aria-label="Formularz logowania"
      noValidate
    >
      {/* General error message */}
      {errors.general && (
        <div 
          className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
          role="alert"
          aria-live="polite"
        >
          {errors.general}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Adres e-mail
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.com"
          autoComplete="email"
          autoFocus
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p 
            id="email-error" 
            className="text-destructive text-sm"
            role="alert"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Hasło
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={errors.password ? "border-destructive pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p 
            id="password-error" 
            className="text-destructive text-sm"
            role="alert"
          >
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>

      {/* Link to registration */}
      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a 
          href="/register" 
          className="text-primary hover:underline font-medium"
        >
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}

