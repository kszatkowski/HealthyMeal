import type { SupabaseServerClient } from "../../db/supabase.client.ts";
import type { Database } from "../../db/database.types.ts";
import type { RecipeCreateCommand, RecipeListItemDto, RecipeListResponseDto, RecipeResponseDto } from "../../types.ts";

const MAX_INSTRUCTIONS_LENGTH = 5000;
const MAX_INGREDIENTS_LENGTH = 1000;

type RecipeServiceErrorCode =
  | "ingredients_too_long"
  | "product_not_found"
  | "instructions_too_long"
  | "invalid_query_params"
  | "recipe_not_found"
  | "internal_error";

export class RecipeServiceError extends Error {
  constructor(
    public readonly code: RecipeServiceErrorCode,
    message?: string,
    public readonly cause?: unknown
  ) {
    super(message ?? code);
    this.name = "RecipeServiceError";
  }
}

export interface RecipeListFilters {
  mealType?: Database["public"]["Enums"]["meal_type"];
  difficulty?: Database["public"]["Enums"]["recipe_difficulty"];
  isAiGenerated?: boolean;
  search?: string;
  limit: number;
  offset: number;
  sort: "createdAt.desc" | "createdAt.asc" | "name.asc";
}

const RECIPE_SORT_MAP: Record<
  RecipeListFilters["sort"],
  { column: keyof Database["public"]["Tables"]["recipes"]["Row"]; ascending: boolean }
> = {
  "createdAt.desc": { column: "created_at", ascending: false },
  "createdAt.asc": { column: "created_at", ascending: true },
  "name.asc": { column: "name", ascending: true },
};

function escapeSearchTerm(term: string): string {
  // Escape special characters for PostgreSQL LIKE patterns
  // % matches any sequence, _ matches any single character
  // Backslash escapes these special characters
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function createRecipe(
  supabase: SupabaseServerClient,
  userId: string,
  command: RecipeCreateCommand
): Promise<RecipeResponseDto> {
  validateInstructionLength(command.instructions);
  validateIngredientsLength(command.ingredients);

  const recipeInsertPayload = {
    user_id: userId,
    name: command.name,
    instructions: command.instructions,
    ingredients: command.ingredients,
    meal_type: command.mealType,
    difficulty: command.difficulty,
    is_ai_generated: command.isAiGenerated ?? false,
  } satisfies Database["public"]["Tables"]["recipes"]["Insert"];

  const { data: recipeRow, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipeInsertPayload)
    .select(
      "id, user_id, name, meal_type, difficulty, instructions, ingredients, is_ai_generated, created_at, updated_at"
    )
    .single();

  if (recipeError) {
    throw mapInsertRecipeError(recipeError);
  }

  if (!recipeRow) {
    throw new RecipeServiceError("internal_error", "Recipe creation returned no data.");
  }

  return {
    id: recipeRow.id,
    userId: recipeRow.user_id,
    name: recipeRow.name,
    mealType: recipeRow.meal_type,
    difficulty: recipeRow.difficulty,
    instructions: recipeRow.instructions,
    ingredients: recipeRow.ingredients,
    isAiGenerated: recipeRow.is_ai_generated,
    createdAt: recipeRow.created_at,
    updatedAt: recipeRow.updated_at,
  };
}

export async function updateRecipe(
  supabase: SupabaseServerClient,
  userId: string,
  recipeId: string,
  command: RecipeCreateCommand
): Promise<RecipeResponseDto> {
  // Validate input parameters
  validateInstructionLength(command.instructions);
  validateIngredientsLength(command.ingredients);

  // Verify that the recipe exists and belongs to the user
  const { data: existingRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select("id, user_id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingRecipe) {
    throw new RecipeServiceError("recipe_not_found", "Recipe not found or you don't have permission to update it.");
  }

  // Update recipe record
  const recipeUpdatePayload = {
    name: command.name,
    instructions: command.instructions,
    ingredients: command.ingredients,
    meal_type: command.mealType,
    difficulty: command.difficulty,
    is_ai_generated: command.isAiGenerated ?? false,
  } satisfies Database["public"]["Tables"]["recipes"]["Update"];

  const { error: updateRecipeError } = await supabase
    .from("recipes")
    .update(recipeUpdatePayload)
    .eq("id", recipeId)
    .eq("user_id", userId);

  if (updateRecipeError) {
    throw mapUpdateRecipeError(updateRecipeError);
  }

  // Fetch the updated recipe to return the complete response
  const { data: updatedRecipeRow, error: fetchUpdatedError } = await supabase
    .from("recipes")
    .select(
      "id, user_id, name, meal_type, difficulty, instructions, ingredients, is_ai_generated, created_at, updated_at"
    )
    .eq("id", recipeId)
    .single();

  if (fetchUpdatedError || !updatedRecipeRow) {
    throw new RecipeServiceError("internal_error", "Failed to fetch updated recipe.", fetchUpdatedError);
  }

  return {
    id: updatedRecipeRow.id,
    userId: updatedRecipeRow.user_id,
    name: updatedRecipeRow.name,
    mealType: updatedRecipeRow.meal_type,
    difficulty: updatedRecipeRow.difficulty,
    instructions: updatedRecipeRow.instructions,
    ingredients: updatedRecipeRow.ingredients,
    isAiGenerated: updatedRecipeRow.is_ai_generated,
    createdAt: updatedRecipeRow.created_at,
    updatedAt: updatedRecipeRow.updated_at,
  };
}

export async function getRecipe(
  supabase: SupabaseServerClient,
  userId: string,
  recipeId: string
): Promise<RecipeResponseDto> {
  // Fetch recipe
  const { data: recipeRow, error: recipeError } = await supabase
    .from("recipes")
    .select(
      "id, user_id, name, meal_type, difficulty, instructions, ingredients, is_ai_generated, created_at, updated_at"
    )
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (recipeError || !recipeRow) {
    throw new RecipeServiceError("recipe_not_found", "Recipe not found or you don't have permission to access it.");
  }

  return {
    id: recipeRow.id,
    userId: recipeRow.user_id,
    name: recipeRow.name,
    mealType: recipeRow.meal_type,
    difficulty: recipeRow.difficulty,
    instructions: recipeRow.instructions,
    ingredients: recipeRow.ingredients,
    isAiGenerated: recipeRow.is_ai_generated,
    createdAt: recipeRow.created_at,
    updatedAt: recipeRow.updated_at,
  };
}

export async function listRecipes(
  supabase: SupabaseServerClient,
  userId: string,
  filters: RecipeListFilters
): Promise<RecipeListResponseDto> {
  const query = supabase
    .from("recipes")
    .select("id, name, meal_type, difficulty, is_ai_generated, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId)
    .order(RECIPE_SORT_MAP[filters.sort].column as string, {
      ascending: RECIPE_SORT_MAP[filters.sort].ascending,
    })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.mealType) {
    query.eq("meal_type", filters.mealType);
  }

  if (filters.difficulty) {
    query.eq("difficulty", filters.difficulty);
  }

  if (filters.isAiGenerated !== undefined) {
    query.eq("is_ai_generated", filters.isAiGenerated);
  }

  if (filters.search) {
    const escaped = escapeSearchTerm(filters.search);
    query.or(`name.ilike.%${escaped}%,instructions.ilike.%${escaped}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new RecipeServiceError("internal_error", "Failed to list recipes.", error);
  }

  const items = (data ?? []).map<RecipeListItemDto>((row) => ({
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    difficulty: row.difficulty,
    isAiGenerated: row.is_ai_generated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    items,
    total: count ?? 0,
    limit: filters.limit,
    offset: filters.offset,
  } satisfies RecipeListResponseDto;
}

function validateInstructionLength(instructions: string): void {
  if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    throw new RecipeServiceError("instructions_too_long");
  }
}

function validateIngredientsLength(ingredients: string): void {
  if (ingredients.length > MAX_INGREDIENTS_LENGTH) {
    throw new RecipeServiceError("ingredients_too_long");
  }
}

export async function deleteRecipe(supabase: SupabaseServerClient, userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId).eq("user_id", userId);

  if (error) {
    throw new RecipeServiceError("internal_error", "Failed to delete recipe.", error);
  }
}

function mapInsertRecipeError(error: { code?: string; message: string }): RecipeServiceError {
  if (error.code === "23514" || error.code === "22001") {
    return new RecipeServiceError("instructions_too_long");
  }

  return new RecipeServiceError("internal_error", "Failed to create recipe.", error);
}

function mapUpdateRecipeError(error: { code?: string; message: string }): RecipeServiceError {
  if (error.code === "23514" || error.code === "22001") {
    return new RecipeServiceError("instructions_too_long");
  }

  return new RecipeServiceError("internal_error", "Failed to update recipe.", error);
}
