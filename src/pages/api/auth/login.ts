import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { LoginSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("error", error);
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parseResult = LoginSchema.safeParse(payload);

  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane logowania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = parseResult.data;
  const {
    data: { user, session },
    error,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !session || !user) {
    return new Response(JSON.stringify({ error: "Nieprawidłowy login lub hasło." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: { id: user.id, email: user.email ?? "" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
