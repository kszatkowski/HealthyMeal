import { z } from "zod";

import {
  DIFFICULTIES,
  MAX_INGREDIENTS,
  MEAL_TYPES,
  RECIPE_INSTRUCTIONS_MAX_LENGTH,
  RECIPE_NAME_MAX_LENGTH,
  UNITS,
} from "./constants";

export const recipeIngredientSchema = z.object({
  productId: z.string().uuid("Wybierz produkt z listy"),
  productName: z.string().min(1, "Wybierz produkt"),
  amount: z.coerce.number({ invalid_type_error: "Podaj ilość" }).positive("Ilość musi być większa od zera"),
  unit: z.enum(UNITS, {
    required_error: "Wybierz jednostkę",
  }),
});

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
    .array(recipeIngredientSchema)
    .min(1, "Dodaj co najmniej jeden składnik")
    .max(MAX_INGREDIENTS, `Liczba składników nie może przekraczać ${MAX_INGREDIENTS}`),
});

export type RecipeFormViewModel = z.infer<typeof recipeFormSchema>;

export function createEmptyIngredient(): RecipeFormViewModel["ingredients"][number] {
  return {
    productId: "",
    productName: "",
    amount: 1,
    unit: UNITS[0],
  };
}

export const defaultRecipeFormValues: RecipeFormViewModel = {
  name: "",
  mealType: MEAL_TYPES[0],
  difficulty: DIFFICULTIES[0],
  instructions: "",
  ingredients: [createEmptyIngredient()],
};
