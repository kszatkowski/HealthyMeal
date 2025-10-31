import type { APIRoute } from "astro";
import { z } from "zod";

import { getProfile, updateProfile, ProfileServiceError } from "../../../lib/services/profile.service";
import type { ProfileUpdateCommand } from "../../../types";

// Schema for profile update request
const profileUpdateSchema = z
  .object({
    onboardingNotificationHiddenUntil: z.string().datetime().nullable().optional(),
  })
  .strict();

const errorStatusMap: Record<string, number> = {
  profile_not_found: 404,
  invalid_input: 400,
  invalid_request: 400,
  unauthorized: 401,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  profile_not_found: "Profile not found.",
  invalid_input: "Invalid input data.",
  invalid_request: "Invalid request payload.",
  unauthorized: "Authentication required. Please provide a valid token.",
  internal_error: "Failed to process profile request due to an internal error.",
};

/**
 * Builds a standardized error response.
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
 * GET /api/profile
 *
 * Retrieves the authenticated user's profile including AI requests count
 * and preference counters (likes, dislikes, allergens).
 *
 * Response:
 *   200 OK: Returns ProfileResponseDto
 *   401 Unauthorized: Missing or invalid authentication
 *   404 Not Found: Profile not found
 *   500 Internal Server Error: Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  // Verify user authentication
  if (!locals.user || !locals.user.id) {
    console.warn("GET /api/profile: Unauthorized access attempt");
    return buildErrorResponse("unauthorized");
  }

  try {
    const profile = await getProfile(locals.supabase, locals.user.id);

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      console.warn("GET /api/profile: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("GET /api/profile: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

/**
 * PATCH /api/profile
 *
 * Updates the authenticated user's profile with mutable fields.
 * Currently supports updating onboarding_notification_hidden_until.
 *
 * Request Body:
 *   - onboardingNotificationHiddenUntil (string, ISO 8601 datetime, nullable, optional)
 *
 * Response:
 *   200 OK: Returns updated ProfileResponseDto
 *   400 Bad Request: Invalid request payload
 *   401 Unauthorized: Missing or invalid authentication
 *   500 Internal Server Error: Server error
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  // Verify user authentication
  if (!locals.user || !locals.user.id) {
    console.warn("PATCH /api/profile: Unauthorized access attempt");
    return buildErrorResponse("unauthorized");
  }

  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      console.warn("PATCH /api/profile: Request validation failed", {
        issues: validation.error.issues,
      });

      return buildErrorResponse("invalid_request", validation.error.issues[0]?.message);
    }

    const command: ProfileUpdateCommand = {
      onboardingNotificationHiddenUntil: validation.data.onboardingNotificationHiddenUntil ?? null,
    };

    const updatedProfile = await updateProfile(locals.supabase, locals.user.id, command);

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      console.warn("PATCH /api/profile: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("PATCH /api/profile: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
