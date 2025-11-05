import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

// Use PUBLIC_ prefix for client-side access
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Make sure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are set."
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed Supabase client for use in services
export type SupabaseClient = SupabaseClientBase<Database>;
