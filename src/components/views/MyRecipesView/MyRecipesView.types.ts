import type { Database } from "../../../db/database.types";

export interface RecipeFiltersViewModel {
  mealType?: Database["public"]["Enums"]["meal_type"];
  search?: string;
  difficulty?: Database["public"]["Enums"]["recipe_difficulty"];
  isAiGenerated?: boolean;
  sort: "createdAt.desc" | "createdAt.asc" | "name.asc";
  page: number;
  limit: number;
}
