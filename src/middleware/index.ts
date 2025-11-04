import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase credentials from environment
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  // Get the Authorization header
  const authHeader = context.request.headers.get("Authorization");
  
  // Get tokens from cookies (for SSR pages)
  const accessTokenCookie = context.cookies.get("sb-access-token")?.value;
  const refreshTokenCookie = context.cookies.get("sb-refresh-token")?.value;

  // Determine which token to use (header takes precedence over cookie)
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.replace("Bearer ", "");
  } else if (accessTokenCookie) {
    accessToken = accessTokenCookie;
    refreshToken = refreshTokenCookie || null;
  }

  // Create a new Supabase client for this request
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // If we have an access token, set the session and get user
  let user = null;
  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    // If session is valid, get the user
    if (!error && data.session) {
      user = data.session.user;
      
      // If token was refreshed, update cookies
      if (data.session.access_token !== accessToken) {
        context.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        if (data.session.refresh_token) {
          context.cookies.set("sb-refresh-token", data.session.refresh_token, {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }
      }
    }
  }

  // Make the client and user available to the endpoint
  context.locals.supabase = supabase;
  context.locals.user = user;

  return next();
});
