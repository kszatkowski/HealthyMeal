import {
  MEAL_TYPE_LABELS as SHARED_MEAL_TYPE_LABELS,
  DIFFICULTY_LABELS as SHARED_DIFFICULTY_LABELS,
} from "@/lib/constants";

export const RECIPE_NAME_MAX_LENGTH = 50;
export const RECIPE_INSTRUCTIONS_MAX_LENGTH = 5000;
export const RECIPE_INGREDIENTS_MAX_LENGTH = 1000;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "dessert", "snack"] as const;
export const MEAL_TYPE_LABELS: Record<(typeof MEAL_TYPES)[number], string> = SHARED_MEAL_TYPE_LABELS as Record<
  (typeof MEAL_TYPES)[number],
  string
>;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DIFFICULTY_LABELS: Record<(typeof DIFFICULTIES)[number], string> = SHARED_DIFFICULTY_LABELS as Record<
  (typeof DIFFICULTIES)[number],
  string
>;
