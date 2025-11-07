/**
 * LoginForm Component
 *
 * Provides email/password authentication form with:
 * - React Hook Form for form management
 * - Zod for type-safe validation
 * - Error handling and inline error messages
 * - Accessibility features (ARIA labels, focus management)
 * - Password visibility toggle
 * - Auto-redirect after successful login
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseClient } from "@/db/supabase.client";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth.schema";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  /** Callback fired after successful login */
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    // Clear previous errors
    setGeneralError(null);

    try {
      // Sign in with Supabase
      const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Handle authentication errors
        setGeneralError("Nieprawidłowy adres e-mail lub hasło");
        return;
      }

      if (authData.session) {
        // Store session tokens in localStorage for client-side use
        if (typeof window !== "undefined") {
          localStorage.setItem("supabase_auth_token", authData.session.access_token);
          localStorage.setItem("supabase_refresh_token", authData.session.refresh_token);
        }

        // Set cookies for SSR (server-side rendering)
        await fetch("/api/auth/set-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
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
      setGeneralError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 w-full max-w-sm"
      aria-label="Formularz logowania"
      noValidate
    >
      {/* General error message */}
      {generalError && (
        <div
          className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
          role="alert"
          aria-live="polite"
        >
          {generalError}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="twoj@email.com"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-destructive text-sm" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={errors.password ? "border-destructive pr-10" : "pr-10"}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-destructive text-sm" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      {/* Link to registration */}
      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a href="/register" className="text-primary hover:underline font-medium">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
