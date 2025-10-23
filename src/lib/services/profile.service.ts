import type { SupabaseServerClient } from "../../db/supabase.client.ts";
import type { Database } from "../../db/database.types.ts";
import type { ProfileResponseDto, ProfileUpdateCommand } from "../../types.ts";

type ProfileServiceErrorCode = "profile_not_found" | "invalid_input" | "internal_error";

export class ProfileServiceError extends Error {
  constructor(
    public readonly code: ProfileServiceErrorCode,
    message?: string,
    public readonly cause?: unknown
  ) {
    super(message ?? code);
    this.name = "ProfileServiceError";
  }
}

/**
 * Retrieves user profile with preference counters.
 * Counts likes, dislikes, and allergens from user_preferences table.
 */
export async function getProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ProfileResponseDto> {
  // Guard: Validate input
  if (!userId || typeof userId !== "string") {
    throw new ProfileServiceError("invalid_input", "Invalid user ID");
  }

  try {
    // Fetch profile data
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, ai_requests_count, onboarding_notification_hidden_until, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (profileError || !profileRow) {
      throw new ProfileServiceError("profile_not_found", "Profile not found for user", profileError);
    }

    // Count user preferences by type
    const { data: preferencesData, error: preferencesError } = await supabase
      .from("user_preferences")
      .select("preference_type")
      .eq("user_id", userId);

    if (preferencesError) {
      console.warn("Failed to count preferences", { error: preferencesError });
    }

    const preferences = preferencesData ?? [];
    const likesCount = preferences.filter((p) => p.preference_type === "like").length;
    const dislikesCount = preferences.filter((p) => p.preference_type === "dislike").length;
    const allergensCount = preferences.filter((p) => p.preference_type === "allergen").length;

    return {
      id: profileRow.id,
      aiRequestsCount: profileRow.ai_requests_count,
      onboardingNotificationHiddenUntil: profileRow.onboarding_notification_hidden_until,
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
      likesCount,
      dislikesCount,
      allergensCount,
    };
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    throw new ProfileServiceError("internal_error", "Failed to retrieve profile", error);
  }
}

/**
 * Updates user profile with mutable fields.
 * Currently supports updating onboarding_notification_hidden_until.
 */
export async function updateProfile(
  supabase: SupabaseServerClient,
  userId: string,
  command: ProfileUpdateCommand
): Promise<ProfileResponseDto> {
  // Guard: Validate input
  if (!userId || typeof userId !== "string") {
    throw new ProfileServiceError("invalid_input", "Invalid user ID");
  }

  try {
    // Update profile
    const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      onboarding_notification_hidden_until: command.onboardingNotificationHiddenUntil,
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) {
      throw new ProfileServiceError("internal_error", "Failed to update profile", updateError);
    }

    // Fetch updated profile to return
    return getProfile(supabase, userId);
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    throw new ProfileServiceError("internal_error", "Failed to update profile", error);
  }
}
