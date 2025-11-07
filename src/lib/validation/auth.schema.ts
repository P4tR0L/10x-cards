/**
 * Authentication form validation schemas using Zod
 * Provides type-safe validation for login and registration forms
 */

import { z } from "zod";

/**
 * Email validation schema
 * - Must not be empty
 * - Must be a valid email format
 */
const emailSchema = z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format adresu e-mail").trim();

/**
 * Password validation schema for login
 * - Must not be empty
 */
const passwordSchema = z.string().min(1, "Hasło jest wymagane");

/**
 * Password validation schema for registration
 * - Must not be empty
 * - Minimum 6 characters
 * - Maximum 72 characters (bcrypt limit)
 */
const newPasswordSchema = z
  .string()
  .min(1, "Hasło jest wymagane")
  .min(6, "Hasło musi mieć co najmniej 6 znaków")
  .max(72, "Hasło nie może być dłuższe niż 72 znaki");

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Registration form validation schema with password confirmation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * TypeScript types inferred from schemas
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
