import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed", error);
    return new Response(JSON.stringify({ error: "Nie udało się wylogować. Spróbuj ponownie później." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(null, { status: 200 });
};
