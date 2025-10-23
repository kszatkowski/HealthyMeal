import { z } from "zod";

import {
  DIFFICULTIES,
  MEAL_TYPES,
  RECIPE_INSTRUCTIONS_MAX_LENGTH,
  RECIPE_NAME_MAX_LENGTH,
  RECIPE_INGREDIENTS_MAX_LENGTH,
} from "./constants";

export const recipeFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(RECIPE_NAME_MAX_LENGTH, `Nazwa nie może przekraczać ${RECIPE_NAME_MAX_LENGTH} znaków`),
  mealType: z.enum(MEAL_TYPES, {
    required_error: "Wybierz typ posiłku",
  }),
  difficulty: z.enum(DIFFICULTIES, {
    required_error: "Wybierz poziom trudności",
  }),
  instructions: z
    .string()
    .min(1, "Instrukcje są wymagane")
    .max(RECIPE_INSTRUCTIONS_MAX_LENGTH, `Instrukcje nie mogą przekraczać ${RECIPE_INSTRUCTIONS_MAX_LENGTH} znaków`),
  ingredients: z
    .string()
    .min(1, "Dodaj co najmniej jeden składnik")
    .max(RECIPE_INGREDIENTS_MAX_LENGTH, `Składniki nie mogą przekraczać ${RECIPE_INGREDIENTS_MAX_LENGTH} znaków`),
  isAiGenerated: z.boolean().optional(),
});

export type RecipeFormViewModel = z.infer<typeof recipeFormSchema>;

export const defaultRecipeFormValues: RecipeFormViewModel = {
  name: "",
  mealType: MEAL_TYPES[0],
  difficulty: DIFFICULTIES[0],
  instructions: "",
  ingredients: "",
  isAiGenerated: false,
};
