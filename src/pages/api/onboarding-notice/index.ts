import type { APIRoute } from "astro";

interface OnboardingNoticeResponseDto {
  show: boolean;
  dismissibleUntil: string | null;
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
 * GET /api/onboarding-notice
 * Determines whether the onboarding reminder should show for the user.
 * Shows if both preference notes are empty and the dismissal timestamp is null or expired.
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
    // Fetch profile to check preference notes and dismissal timestamp
    const { data: profile, error } = await locals.supabase
      .from("profiles")
      .select(
        `disliked_ingredients_note,
         allergens_note,
         onboarding_notification_hidden_until`
      )
      .eq("id", locals.user.id)
      .single();

    if (error || !profile) {
      console.error("Failed to fetch profile for onboarding check", { error });
      return buildErrorResponse("internal_error");
    }

    const profile_typed = profile as {
      disliked_ingredients_note: string | null;
      allergens_note: string | null;
      onboarding_notification_hidden_until: string | null;
    };

    // Check if both preference notes are empty
    const preferencesEmpty = !profile_typed.disliked_ingredients_note && !profile_typed.allergens_note;

    // Check if dismissal timestamp is still valid (in the future)
    const now = new Date();
    const dismissedUntil = profile_typed.onboarding_notification_hidden_until
      ? new Date(profile_typed.onboarding_notification_hidden_until)
      : null;
    const isDismissedUntilValid = dismissedUntil && dismissedUntil > now;

    // Show if preferences are empty AND dismissal is not valid
    const show = preferencesEmpty && !isDismissedUntilValid;

    const response: OnboardingNoticeResponseDto = {
      show,
      dismissibleUntil: profile_typed.onboarding_notification_hidden_until,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("GET /api/onboarding-notice: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
