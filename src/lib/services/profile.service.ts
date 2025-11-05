import type { SupabaseServerClient } from "../../db/supabase.client.ts";
import type { Database } from "../../db/database.types.ts";
import type { ProfileResponseDto, UpdateProfilePayload } from "../../types.ts";

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
 * Decrements the AI requests count for a user.
 * Used after successful AI recipe generation.
 * Ensures the count doesn't go below 0.
 */
export async function decrementAiRequestsCount(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ProfileResponseDto> {
  // Guard: Validate input
  if (!userId || typeof userId !== "string") {
    throw new ProfileServiceError("invalid_input", "Invalid user ID");
  }

  try {
    // First, fetch current count to ensure it's > 0 before decrementing
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("ai_requests_count")
      .eq("id", userId)
      .single();

    if (fetchError || !currentProfile) {
      throw new ProfileServiceError("profile_not_found", "Profile not found for user", fetchError);
    }

    // Guard: Ensure we have requests remaining before decrementing
    if (currentProfile.ai_requests_count <= 0) {
      throw new ProfileServiceError(
        "internal_error",
        "Cannot decrement AI requests count: no requests remaining",
        new Error("Attempted to decrement when count is 0 or negative")
      );
    }

    // Decrement ai_requests_count by 1
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ai_requests_count: currentProfile.ai_requests_count - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .gt("ai_requests_count", 0); // Ensure we only decrement if count > 0

    if (updateError) {
      throw new ProfileServiceError("internal_error", "Failed to decrement AI requests count", updateError);
    }

    // Fetch updated profile to return
    return getProfile(supabase, userId);
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    throw new ProfileServiceError("internal_error", "Failed to decrement AI requests count", error);
  }
}

/**
 * Retrieves user profile with preference notes.
 */
export async function getProfile(supabase: SupabaseServerClient, userId: string): Promise<ProfileResponseDto> {
  // Guard: Validate input
  if (!userId || typeof userId !== "string") {
    throw new ProfileServiceError("invalid_input", "Invalid user ID");
  }

  try {
    // Fetch profile data with preference notes
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select(
        `id,
         ai_requests_count,
         disliked_ingredients_note,
         allergens_note,
         onboarding_notification_hidden_until,
         created_at,
         updated_at`
      )
      .eq("id", userId)
      .single();

    if (profileError || !profileRow) {
      throw new ProfileServiceError("profile_not_found", "Profile not found for user", profileError);
    }

    return mapProfileRowToDto(profileRow);
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    throw new ProfileServiceError("internal_error", "Failed to retrieve profile", error);
  }
}

/**
 * Updates user profile with mutable fields.
 * Supports updating preference notes and onboarding_notification_hidden_until.
 */
export async function updateProfile(
  supabase: SupabaseServerClient,
  userId: string,
  payload: UpdateProfilePayload
): Promise<ProfileResponseDto> {
  // Guard: Validate input
  if (!userId || typeof userId !== "string") {
    throw new ProfileServiceError("invalid_input", "Invalid user ID");
  }

  // Guard: Ensure at least one field is being updated
  if (Object.keys(payload).length === 0) {
    throw new ProfileServiceError("invalid_input", "Payload must include at least one field to update");
  }

  try {
    // Normalize and prepare update payload
    const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {};

    if (payload.dislikedIngredientsNote !== undefined) {
      updatePayload.disliked_ingredients_note = normalizePreferenceNote(payload.dislikedIngredientsNote);
    }

    if (payload.allergensNote !== undefined) {
      updatePayload.allergens_note = normalizePreferenceNote(payload.allergensNote);
    }

    if (payload.onboardingNotificationHiddenUntil !== undefined) {
      updatePayload.onboarding_notification_hidden_until = payload.onboardingNotificationHiddenUntil;
    }

    // Always update the updated_at timestamp
    updatePayload.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase.from("profiles").update(updatePayload).eq("id", userId);

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps a profile row from the database to the ProfileResponseDto.
 */
function mapProfileRowToDto(row: {
  id: string;
  ai_requests_count: number;
  disliked_ingredients_note: string | null;
  allergens_note: string | null;
  onboarding_notification_hidden_until: string | null;
  created_at: string;
  updated_at: string;
}): ProfileResponseDto {
  return {
    id: row.id,
    aiRequestsCount: row.ai_requests_count,
    dislikedIngredientsNote: row.disliked_ingredients_note,
    allergensNote: row.allergens_note,
    onboardingNotificationHiddenUntil: row.onboarding_notification_hidden_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Normalizes a preference note:
 * - Trims whitespace
 * - Converts empty strings to null
 * - Returns null as-is
 */
function normalizePreferenceNote(note: string | null): string | null {
  if (note === null) {
    return null;
  }

  const trimmed = note.trim();
  return trimmed.length === 0 ? null : trimmed;
}
