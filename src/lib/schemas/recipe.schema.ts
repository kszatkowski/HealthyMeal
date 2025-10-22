import { z } from "zod";

import {
  DIFFICULTIES,
  MEAL_TYPES,
  RECIPE_INSTRUCTIONS_MAX_LENGTH,
  RECIPE_NAME_MAX_LENGTH,
} from "../../components/views/RecipeFormView/constants";

const RECIPE_INGREDIENTS_MAX_LENGTH = 1000;

/**
 * Recipe update command schema.
 * Validates all fields required to update a recipe.
 * Ingredients are now stored as a single text field instead of individual records.
 */
export const recipeUpdateCommandSchema = z
  .object({
    name: z
      .string({ invalid_type_error: "Nazwa musi być tekstem" })
      .min(1, "Nazwa jest wymagana")
      .max(RECIPE_NAME_MAX_LENGTH, `Nazwa nie może przekraczać ${RECIPE_NAME_MAX_LENGTH} znaków`),
    mealType: z.enum(MEAL_TYPES, {
      errorMap: () => ({ message: "Typ posiłku musi być jednym z: śniadanie, lunch, obiad, deser, przekąska" }),
    }),
    difficulty: z.enum(DIFFICULTIES, {
      errorMap: () => ({ message: "Poziom trudności musi być jednym z: łatwy, średni, trudny" }),
    }),
    instructions: z
      .string({ invalid_type_error: "Instrukcje muszą być tekstem" })
      .min(1, "Instrukcje są wymagane")
      .max(RECIPE_INSTRUCTIONS_MAX_LENGTH, `Instrukcje nie mogą przekraczać ${RECIPE_INSTRUCTIONS_MAX_LENGTH} znaków`),
    ingredients: z
      .string({ invalid_type_error: "Składniki muszą być tekstem" })
      .min(1, "Dodaj co najmniej jeden składnik")
      .max(RECIPE_INGREDIENTS_MAX_LENGTH, `Składniki nie mogą przekraczać ${RECIPE_INGREDIENTS_MAX_LENGTH} znaków`),
    isAiGenerated: z.boolean().optional(),
  })
  .strict();

/**
 * Schema for validating recipe ID from path parameters.
 * Ensures recipeId is a valid UUID.
 */
export const recipeIdSchema = z.object({
  recipeId: z.string().uuid("ID przepisu musi być prawidłowym UUID"),
});

export type RecipeUpdateCommandInput = z.infer<typeof recipeUpdateCommandSchema>;
export type RecipeIdInput = z.infer<typeof recipeIdSchema>;
