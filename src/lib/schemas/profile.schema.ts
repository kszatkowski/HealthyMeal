import { z } from "zod";

/**
 * Schema for preference notes - free text fields with 200 character limit
 */
const preferenceNoteSchema = z
  .string()
  .max(200, "Notatka może mieć maksymalnie 200 znaków")
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .or(z.null());

/**
 * Schema for ISO 8601 timestamps with optional null
 */
const isoTimestampSchema = z.string().datetime({ offset: true }).or(z.null()).optional();

/**
 * Schema for updating profile fields
 * At least one preference field must be provided
 */
export const updateProfileSchema = z
  .object({
    dislikedIngredientsNote: preferenceNoteSchema.optional(),
    allergensNote: preferenceNoteSchema.optional(),
    onboardingNotificationHiddenUntil: isoTimestampSchema,
  })
  .strict()
  .refine(
    (payload) => {
      const hasDislikedIngredients = payload.dislikedIngredientsNote !== null && payload.dislikedIngredientsNote !== undefined;
      const hasAllergens = payload.allergensNote !== null && payload.allergensNote !== undefined;
      return hasDislikedIngredients || hasAllergens;
    },
    {
      message: "Przynajmniej jedno pole preferencji musi być wypełnione",
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
