/// <reference types="astro/client" />
/// <reference types="astro/env" />

import type { SupabaseServerClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseServerClient;
      user: {
        id: string;
        email: string;
      } | null;
    }
  }
}
