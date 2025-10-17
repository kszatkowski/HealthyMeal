import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { RegisterSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ headers: request.headers, cookies });

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("register:invalid-json", error);
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parseResult = RegisterSchema.safeParse(payload);

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: parseResult.error.issues[0]?.message ?? "Nieprawidłowe dane rejestracji.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { email, password } = parseResult.data;

  const {
    data: { user, session },
    error,
  } = await supabase.auth.signUp({ email, password });

  if (error) {
    const normalizedStatus = error.status === 400 ? 409 : 400;

    return new Response(JSON.stringify({ error: error.message ?? "Nie udało się utworzyć konta." }), {
      status: normalizedStatus,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user || !session) {
    return new Response(JSON.stringify({ error: "Nie udało się utworzyć konta." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email ?? email,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
