export const RECIPE_NAME_MAX_LENGTH = 50;
export const RECIPE_INSTRUCTIONS_MAX_LENGTH = 5000;
export const MAX_INGREDIENTS = 50;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "dessert", "snack"] as const;
export const MEAL_TYPE_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
  breakfast: "Śniadanie",
  lunch: "Lunch",
  dinner: "Obiad",
  dessert: "Deser",
  snack: "Przekąska",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DIFFICULTY_LABELS: Record<(typeof DIFFICULTIES)[number], string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

export const UNITS = ["gram", "kilogram", "milliliter", "liter", "teaspoon", "tablespoon", "cup", "piece"] as const;
export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  gram: "gram",
  kilogram: "kilogram",
  milliliter: "mililitr",
  liter: "litr",
  teaspoon: "łyżeczka",
  tablespoon: "łyżka",
  cup: "szklanka",
  piece: "sztuka",
};
