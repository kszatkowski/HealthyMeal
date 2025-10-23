import { z } from "zod";
import { DIFFICULTIES, MEAL_TYPES } from "@/components/views/RecipeFormView/constants";

/**
 * Validation schema for the AI recipe generation form.
 * - mealType: Required, must be one of the predefined meal types
 * - mainIngredient: Optional string for the main ingredient
 * - difficulty: Optional, must be one of the predefined difficulty levels
 */
export const generateRecipeFormSchema = z.object({
  mealType: z.enum(MEAL_TYPES, {
    required_error: "Rodzaj posiłku jest wymagany.",
  }),
  mainIngredient: z.string().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
});

/**
 * Type inferred from the Zod schema for type safety.
 * Represents the form data for AI recipe generation.
 */
export type GenerateRecipeFormViewModel = z.infer<typeof generateRecipeFormSchema>;

/**
 * Default values for the form to provide initial state.
 */
export const defaultGenerateRecipeFormValues: GenerateRecipeFormViewModel = {
  mealType: MEAL_TYPES[0],
  mainIngredient: "",
  difficulty: undefined,
};
