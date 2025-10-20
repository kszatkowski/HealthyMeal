import type { APIRoute } from "astro";

import { listUserPreferences, PreferenceServiceError } from "../../../lib/services/preferences.service.ts";
import { PreferenceListQuerySchema } from "../../../lib/schemas/preferences.schema.ts";
import type { PreferenceListResponseDto } from "../../../types.ts";

const errorStatusMap: Record<string, number> = {
  invalid_query_params: 400,
  unauthorized: 401,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  invalid_query_params: "Query parameters are invalid.",
  unauthorized: "Authentication required. Please provide a valid token.",
  internal_error: "Failed to retrieve preferences due to an internal error.",
};

/**
 * Builds a standardized error response.
 *
 * @param code - The error code
 * @param message - Optional custom message
 * @returns Response object with appropriate status and error details
 */
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

/**
 * GET /api/preferences
 *
 * Retrieves user preferences for the authenticated user.
 * Supports optional filtering by preference type (like, dislike, allergen).
 *
 * Query Parameters:
 *   - type (optional): Filter preferences by type ('like', 'dislike', or 'allergen')
 *
 * Response:
 *   200 OK: Returns PreferenceListResponseDto with items array
 *   400 Bad Request: Invalid query parameters
 *   401 Unauthorized: Missing or invalid authentication
 *   500 Internal Server Error: Server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Verify user authentication
  if (!locals.user || !locals.user.id) {
    console.warn("GET /api/preferences: Unauthorized access attempt");
    return buildErrorResponse("unauthorized");
  }

  // Parse and validate query parameters
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const validation = PreferenceListQuerySchema.safeParse(query);

  if (!validation.success) {
    console.warn("GET /api/preferences: Query validation failed", {
      issues: validation.error.issues,
    });

    return buildErrorResponse("invalid_query_params", validation.error.issues[0]?.message);
  }

  try {
    // Retrieve preferences from service
    const preferences = await listUserPreferences(locals.supabase, locals.user.id, validation.data.type);

    // Build response
    const response: PreferenceListResponseDto = {
      items: preferences,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof PreferenceServiceError) {
      console.warn("GET /api/preferences: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    // Handle unexpected errors
    console.error("GET /api/preferences: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
