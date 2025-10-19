import { z } from "zod";

import {
  DIFFICULTIES,
  MAX_INGREDIENTS,
  MEAL_TYPES,
  RECIPE_INSTRUCTIONS_MAX_LENGTH,
  RECIPE_NAME_MAX_LENGTH,
  UNITS,
} from "../../components/views/RecipeFormView/constants";

/**
 * Ingredient schema for recipe commands (create/update).
 * Validates product ID (UUID), amount (positive number), and unit.
 * Uses shared constants from RecipeFormView for consistency.
 */
const recipeCommandIngredientSchema = z
  .object({
    productId: z.string().uuid("ID produktu musi być prawidłowym UUID"),
    amount: z.number({ invalid_type_error: "Ilość musi być liczbą" }).positive("Ilość musi być większa od zera"),
    unit: z.enum(UNITS, {
      errorMap: () => ({
        message: `Jednostka musi być jedną z: ${UNITS.join(", ")}`,
      }),
    }),
  })
  .strict();

/**
 * Recipe update command schema.
 * Validates all fields required to update a recipe including ingredients.
 * Matches the RecipeUpdateCommand type from types.ts.
 * Uses shared constants from RecipeFormView to avoid duplication with frontend validation.
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
    isAiGenerated: z.boolean().optional(),
    ingredients: z
      .array(recipeCommandIngredientSchema, {
        invalid_type_error: "Składniki muszą być tablicą",
      })
      .min(1, "Dodaj co najmniej jeden składnik")
      .max(MAX_INGREDIENTS, `Liczba składników nie może przekraczać ${MAX_INGREDIENTS}`),
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
