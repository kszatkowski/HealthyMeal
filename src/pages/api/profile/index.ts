import type { APIRoute } from "astro";

import { getProfile, updateProfile, ProfileServiceError } from "../../../lib/services/profile.service";
import { updateProfileSchema } from "../../../lib/schemas/profile.schema";
import type { ProfileResponseDto, UpdateProfilePayload } from "../../../types";

const errorStatusMap: Record<string, number> = {
  missing_token: 401,
  invalid_token: 401,
  profile_not_found: 404,
  invalid_input: 400,
  invalid_payload: 400,
  preference_note_too_long: 400,
  invalid_timestamp: 400,
  timestamp_in_past: 409,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  missing_token: "Authentication required. Please provide a valid token.",
  invalid_token: "Invalid authentication token.",
  profile_not_found: "User profile not found.",
  invalid_input: "Invalid input provided.",
  invalid_payload: "Invalid request payload.",
  preference_note_too_long: "Preference note exceeds 200 character limit.",
  invalid_timestamp: "Invalid timestamp format. Must be ISO 8601.",
  timestamp_in_past: "Timestamp cannot be in the past.",
  internal_error: "An internal server error occurred.",
};

/**
 * Builds a standardized error response
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
 * Builds a success response with profile data
 */
function buildSuccessResponse(data: ProfileResponseDto, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * GET /api/profile
 * Retrieves the authenticated user's profile with preference notes and quota metadata
 */
export const GET: APIRoute = async ({ locals }) => {
  // Verify user authentication
  if (!locals.user?.id) {
    return buildErrorResponse("missing_token");
  }

  if (!locals.supabase) {
    return buildErrorResponse("invalid_token");
  }

  try {
    const profile = await getProfile(locals.supabase, locals.user.id);
    return buildSuccessResponse(profile);
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
 * Updates mutable profile fields (preference notes and onboarding dismissal timestamp)
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  // Verify user authentication
  if (!locals.user?.id) {
    return buildErrorResponse("missing_token");
  }

  if (!locals.supabase) {
    return buildErrorResponse("invalid_token");
  }

  try {
    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return buildErrorResponse("invalid_payload", "Request body must be valid JSON");
    }

    // Validate payload against schema
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      console.warn("PATCH /api/profile: Validation failed", {
        issues: validation.error.issues,
      });

      const firstIssue = validation.error.issues[0];
      return buildErrorResponse("invalid_payload", firstIssue?.message);
    }

    // Guard: Check if timestamp is in the past
    if (
      validation.data.onboardingNotificationHiddenUntil &&
      new Date(validation.data.onboardingNotificationHiddenUntil) < new Date()
    ) {
      return buildErrorResponse("timestamp_in_past", "Timestamp cannot be in the past");
    }

    // Convert camelCase to snake_case for service layer
    const payload: UpdateProfilePayload = {
      dislikedIngredientsNote: validation.data.dislikedIngredientsNote,
      allergensNote: validation.data.allergensNote,
      onboardingNotificationHiddenUntil: validation.data.onboardingNotificationHiddenUntil,
    };

    const profile = await updateProfile(locals.supabase, locals.user.id, payload);
    return buildSuccessResponse(profile);
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
