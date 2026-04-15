import "server-only";
import { createClient } from "@supabase/supabase-js";

import { mustGetEnv } from "@/app/lib/env";

export function getSupabaseClerkClient(accessToken: string) {
  return createClient(
    mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustGetEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

