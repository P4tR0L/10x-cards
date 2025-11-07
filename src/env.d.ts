/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

type Runtime = import("@astrojs/cloudflare").Runtime<{
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  SITE_URL: string;
}>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient<Database>;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
