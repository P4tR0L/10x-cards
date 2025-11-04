import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase credentials from environment
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  // Get the Authorization header
  const authHeader = context.request.headers.get("Authorization");

  // Create a new Supabase client for this request
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // If we have an Authorization header with Bearer token, set it
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    // Set the session with the access token
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: "", // Not needed for API requests
    });
  }

  // Make the client available to the endpoint
  context.locals.supabase = supabase;

  return next();
});
