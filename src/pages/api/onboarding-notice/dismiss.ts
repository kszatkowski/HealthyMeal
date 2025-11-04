import type { APIRoute } from "astro";

interface OnboardingNoticeDismissResponseDto {
  hiddenUntil: string;
}

const errorStatusMap: Record<string, number> = {
  missing_token: 401,
  invalid_token: 401,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  missing_token: "Authentication required. Please provide a valid token.",
  invalid_token: "Invalid authentication token.",
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
 * POST /api/onboarding-notice/dismiss
 * Hide the onboarding reminder for 48 hours by updating profile timestamp.
 */
export const POST: APIRoute = async ({ locals }) => {
  // Verify user authentication
  if (!locals.user?.id) {
    return buildErrorResponse("missing_token");
  }

  if (!locals.supabase) {
    return buildErrorResponse("invalid_token");
  }

  try {
    // Calculate dismissal timestamp: now + 48 hours
    const now = new Date();
    const hiddenUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Update profile with dismissal timestamp
    const { error } = await locals.supabase
      .from("profiles")
      .update({
        onboarding_notification_hidden_until: hiddenUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", locals.user.id);

    if (error) {
      console.error("Failed to update profile dismissal timestamp", { error });
      return buildErrorResponse("internal_error");
    }

    const response: OnboardingNoticeDismissResponseDto = {
      hiddenUntil: hiddenUntil.toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("POST /api/onboarding-notice/dismiss: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
