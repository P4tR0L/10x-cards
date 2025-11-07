/**
 * RegisterForm Component
 *
 * Provides user registration form with:
 * - React Hook Form for form management
 * - Zod for type-safe validation with password confirmation
 * - Error handling and inline error messages
 * - Accessibility features (ARIA labels, focus management)
 * - Password visibility toggle
 * - Auto-redirect after successful registration
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseClient } from "@/db/supabase.client";
import { registerSchema, type RegisterFormData } from "@/lib/validation/auth.schema";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  /** Callback fired after successful registration */
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    // Clear previous messages
    setGeneralMessage(null);

    try {
      // Sign up with Supabase
      const { data: authData, error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes("already registered")) {
          setGeneralMessage({ text: "Ten adres e-mail jest już zarejestrowany", type: "error" });
        } else {
          setGeneralMessage({ text: error.message || "Wystąpił błąd podczas rejestracji", type: "error" });
        }
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
      } else if (authData.user) {
        // Email confirmation required
        setGeneralMessage({
          text: "Konto utworzone! Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
          type: "success",
        });
      }
    } catch (error) {
      setGeneralMessage({ text: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.", type: "error" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 w-full max-w-sm"
      aria-label="Formularz rejestracji"
      noValidate
    >
      {/* General message (error or success) */}
      {generalMessage && (
        <div
          className={`text-sm p-3 rounded-md border ${
            generalMessage.type === "success"
              ? "bg-green-950/30 text-green-400 border-green-500/50"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
          role="alert"
          aria-live="polite"
        >
          {generalMessage.text}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Adres e-mail</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="twoj@email.com"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
          {...register("email")}
        />
        {errors.email && (
          <p id="register-email-error" className="text-destructive text-sm" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Hasło</Label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "register-password-error" : "register-password-hint"}
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
          <p id="register-password-error" className="text-destructive text-sm" role="alert">
            {errors.password.message}
          </p>
        )}
        {!errors.password && (
          <p id="register-password-hint" className="text-xs text-muted-foreground">
            Minimum 6 znaków
          </p>
        )}
      </div>

      {/* Confirm Password field */}
      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Potwierdź hasło</Label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
            className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="text-destructive text-sm" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
      </Button>

      {/* Link to login */}
      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a href="/login" className="text-primary hover:underline font-medium">
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
