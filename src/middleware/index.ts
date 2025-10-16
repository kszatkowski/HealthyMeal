import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";

const PUBLIC_PATHS = new Set(["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/logout"]);

export const onRequest = defineMiddleware(async ({ locals, cookies, request, url, redirect }, next) => {
  locals.supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  locals.user = null;

  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "",
    };

    if (url.pathname === "/login" || url.pathname === "/register") {
      return redirect("/");
    }

    return next();
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  return redirect("/login");
});
