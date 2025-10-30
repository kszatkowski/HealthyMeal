import type { APIRoute } from "astro";
import { z } from "zod";

import { listProducts, ProductServiceError } from "../../../lib/services/products.service.ts";

const productListQuerySchema = z
  .object({
    search: z
      .string({ invalid_type_error: "search must be a string" })
      .trim()
      .min(1, "search must not be empty")
      .max(50, "search must not exceed 50 characters")
      .optional(),
    limit: z.coerce
      .number({ invalid_type_error: "limit must be a number" })
      .int("limit must be an integer")
      .min(1, "limit must be between 1 and 50")
      .max(50, "limit must be between 1 and 50")
      .default(20),
    offset: z.coerce
      .number({ invalid_type_error: "offset must be a number" })
      .int("offset must be an integer")
      .min(0, "offset must be 0 or greater")
      .default(0),
    sort: z
      .enum(["name.asc", "name.desc"], {
        invalid_type_error: "sort must be one of name.asc or name.desc",
      })
      .default("name.asc"),
  })
  .strict();

const errorStatusMap: Record<string, number> = {
  invalid_query_params: 400,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  invalid_query_params: "Query parameters are invalid.",
  internal_error: "Failed to retrieve products due to an internal error.",
};

function buildErrorResponse(code: string, message?: string): Response {
  const status = errorStatusMap[code] ?? 500;

  return new Response(
    JSON.stringify({
      error: {
        code,
        message: message ?? errorMessageMap[code] ?? errorMessageMap.internal_error,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const validation = productListQuerySchema.safeParse(query);

  if (!validation.success) {
    console.warn("GET /api/products: Query validation failed", {
      issues: validation.error.issues,
    });

    const firstIssue = validation.error.issues[0];
    return buildErrorResponse("invalid_query_params", firstIssue?.message);
  }

  const { search, limit, offset, sort } = validation.data;

  try {
    const result = await listProducts({
      search,
      limit,
      offset,
      sort,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      console.warn("GET /api/products: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("GET /api/products: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
