import type { SupabaseServerClient } from "../../db/supabase.client.ts";
import type { Database } from "../../db/database.types.ts";
import type { PreferenceListItemDto } from "../../types.ts";

type PreferenceServiceErrorCode = "internal_error" | "invalid_query_params";

export class PreferenceServiceError extends Error {
  constructor(
    public readonly code: PreferenceServiceErrorCode,
    message?: string,
    public readonly cause?: unknown
  ) {
    super(message ?? code);
    this.name = "PreferenceServiceError";
  }
}

/**
 * Retrieves a list of user preferences with optional filtering by preference type.
 *
 * @param supabase - The Supabase server client instance
 * @param userId - The ID of the user whose preferences to retrieve
 * @param type - Optional preference type filter ('like', 'dislike', or 'allergen')
 * @returns Promise containing an array of preference list items
 * @throws PreferenceServiceError if the query fails
 */
export async function listUserPreferences(
  supabase: SupabaseServerClient,
  userId: string,
  type?: Database["public"]["Enums"]["preference_type"]
): Promise<PreferenceListItemDto[]> {
  const query = supabase
    .from("user_preferences")
    .select(
      `
      id,
      preference_type,
      created_at,
      products(id, name)
      `
    )
    .eq("user_id", userId);

  // Apply optional type filter
  if (type) {
    query.eq("preference_type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new PreferenceServiceError("internal_error", "Failed to fetch user preferences.", error);
  }

  if (!data) {
    throw new PreferenceServiceError("internal_error", "Preference query returned no data.");
  }

  // Map database rows to PreferenceListItemDto
  const items: PreferenceListItemDto[] = data.map((row) => {
    // Ensure product data is available
    if (!row.products) {
      throw new PreferenceServiceError("internal_error", "Failed to load product data for preference.");
    }

    return {
      id: row.id,
      preferenceType: row.preference_type,
      createdAt: row.created_at,
      product: {
        id: row.products.id,
        name: row.products.name,
      },
    };
  });

  return items;
}
