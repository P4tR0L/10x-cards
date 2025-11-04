/**
 * TEMPORARY DEV AUTH UTILITIES
 *
 * This file provides temporary authentication utilities for development.
 * It will be replaced with proper Supabase Auth integration in production.
 *
 * DO NOT USE IN PRODUCTION!
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

const STORAGE_KEY = "10x-cards-dev-token";
const TEST_USER_EMAIL = "test@10xcards.dev";
const TEST_USER_PASSWORD = "test123456";

/**
 * Get Supabase client for dev auth operations
 */
function getSupabaseClient() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Get stored dev token from localStorage
 */
export function getDevToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Store dev token in localStorage
 */
function storeDevToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, token);
}

/**
 * Clear dev token from localStorage
 */
export function clearDevToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Sign up a test user (called once if user doesn't exist)
 */
async function signUpTestUser(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (error) {
      // User might already exist, try to sign in
      console.log("Sign up failed (user might exist):", error.message);
      return null;
    }

    if (data.session?.access_token) {
      console.log("✓ Test user created and logged in");
      return data.session.access_token;
    }

    return null;
  } catch (error) {
    console.error("Error signing up test user:", error);
    return null;
  }
}

/**
 * Sign in test user
 */
async function signInTestUser(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (error) {
      console.log("Sign in failed:", error.message);
      return null;
    }

    if (data.session?.access_token) {
      console.log("✓ Test user logged in");
      return data.session.access_token;
    }

    return null;
  } catch (error) {
    console.error("Error signing in test user:", error);
    return null;
  }
}

/**
 * Initialize dev authentication
 * Tries to sign in test user, creates one if it doesn't exist
 */
export async function initDevAuth(): Promise<string | null> {
  // Check if we already have a token
  const existingToken = getDevToken();
  if (existingToken) {
    console.log("✓ Using existing dev token");
    return existingToken;
  }

  console.log("⚠ DEV MODE: Initializing test user authentication...");

  // Try to sign in
  let token = await signInTestUser();

  // If sign in failed, try to sign up
  if (!token) {
    console.log("Attempting to create test user...");
    token = await signUpTestUser();
  }

  // If sign up succeeded, try to sign in again
  if (!token) {
    token = await signInTestUser();
  }

  if (token) {
    storeDevToken(token);
    console.log("✓ Dev authentication initialized");
    return token;
  }

  console.error("✗ Failed to initialize dev authentication");
  return null;
}

/**
 * Check if dev token is still valid
 */
export async function verifyDevToken(token: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.log("Token invalid, clearing...");
      clearDevToken();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying token:", error);
    return false;
  }
}
