import { supabaseClient, DEFAULT_USER_ID } from "../../db/supabase.client.ts";
import type { Database } from "../../db/database.types.ts";
import type { ProductListItemDto, RecipeCreateCommand, RecipeIngredientDto, RecipeResponseDto } from "../../types.ts";

const MAX_INGREDIENTS = 50;
const MAX_INSTRUCTIONS_LENGTH = 5000;

const ALLOWED_UNITS: Database["public"]["Enums"]["recipe_unit"][] = [
  "gram",
  "kilogram",
  "milliliter",
  "liter",
  "teaspoon",
  "tablespoon",
  "cup",
  "piece",
];

type RecipeServiceErrorCode =
  | "ingredient_limit_exceeded"
  | "duplicate_ingredient"
  | "product_not_found"
  | "instructions_too_long"
  | "invalid_ingredient_unit"
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

export async function createRecipe(command: RecipeCreateCommand): Promise<RecipeResponseDto> {
  validateIngredientCount(command.ingredients);
  validateInstructionLength(command.instructions);
  validateUnits(command.ingredients);
  ensureUniqueIngredients(command.ingredients);

  const productMap = await fetchProductsMap(command.ingredients.map((item) => item.productId));

  if (productMap.size !== command.ingredients.length) {
    throw new RecipeServiceError("product_not_found", "One or more referenced products do not exist.");
  }

  const recipeInsertPayload = {
    user_id: DEFAULT_USER_ID,
    name: command.name,
    instructions: command.instructions,
    meal_type: command.mealType,
    difficulty: command.difficulty,
    is_ai_generated: command.isAiGenerated ?? false,
  } satisfies Database["public"]["Tables"]["recipes"]["Insert"];

  const { data: recipeRow, error: recipeError } = await supabaseClient
    .from("recipes")
    .insert(recipeInsertPayload)
    .select("id, user_id, name, meal_type, difficulty, instructions, is_ai_generated, created_at, updated_at")
    .single();

  if (recipeError) {
    throw mapInsertRecipeError(recipeError);
  }

  if (!recipeRow) {
    throw new RecipeServiceError("internal_error", "Recipe creation returned no data.");
  }

  const ingredientInsertPayload = command.ingredients.map((ingredient) => ({
    recipe_id: recipeRow.id,
    product_id: ingredient.productId,
    amount: ingredient.amount,
    unit: ingredient.unit,
  })) satisfies Database["public"]["Tables"]["recipe_ingredients"]["Insert"][];

  const { data: ingredientRows, error: ingredientError } = await supabaseClient
    .from("recipe_ingredients")
    .insert(ingredientInsertPayload)
    .select("id, product_id, amount, unit");

  if (ingredientError) {
    await cleanupRecipeOnFailure(recipeRow.id);
    throw mapInsertIngredientsError(ingredientError);
  }

  if (!ingredientRows) {
    await cleanupRecipeOnFailure(recipeRow.id);
    throw new RecipeServiceError("internal_error", "Ingredient creation returned no data.");
  }

  const ingredients = ingredientRows.map<RecipeIngredientDto>((ingredient) => {
    const product = productMap.get(ingredient.product_id);

    if (!product) {
      throw new RecipeServiceError("internal_error", "Failed to correlate product snapshot for ingredient.");
    }

    return {
      id: ingredient.id,
      amount: ingredient.amount,
      unit: ingredient.unit,
      product,
    };
  });

  return {
    id: recipeRow.id,
    userId: recipeRow.user_id,
    name: recipeRow.name,
    mealType: recipeRow.meal_type,
    difficulty: recipeRow.difficulty,
    instructions: recipeRow.instructions,
    isAiGenerated: recipeRow.is_ai_generated,
    createdAt: recipeRow.created_at,
    updatedAt: recipeRow.updated_at,
    ingredients,
  };
}

function validateIngredientCount(ingredients: RecipeCreateCommand["ingredients"]): void {
  if (ingredients.length > MAX_INGREDIENTS) {
    throw new RecipeServiceError("ingredient_limit_exceeded");
  }
}

function validateInstructionLength(instructions: string): void {
  if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    throw new RecipeServiceError("instructions_too_long");
  }
}

function validateUnits(ingredients: RecipeCreateCommand["ingredients"]): void {
  const invalid = ingredients.find((ingredient) => !ALLOWED_UNITS.includes(ingredient.unit));

  if (invalid) {
    throw new RecipeServiceError("invalid_ingredient_unit");
  }
}

function ensureUniqueIngredients(ingredients: RecipeCreateCommand["ingredients"]): void {
  const identifiers = new Set<string>();

  for (const ingredient of ingredients) {
    if (identifiers.has(ingredient.productId)) {
      throw new RecipeServiceError("duplicate_ingredient");
    }

    identifiers.add(ingredient.productId);
  }
}

async function fetchProductsMap(productIds: string[]): Promise<Map<string, ProductListItemDto>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabaseClient.from("products").select("id, name").in("id", productIds);

  if (error) {
    throw new RecipeServiceError("internal_error", "Failed to fetch products.", error);
  }

  const map = new Map<string, ProductListItemDto>();
  data?.forEach((product) => {
    map.set(product.id, { id: product.id, name: product.name });
  });

  return map;
}

async function cleanupRecipeOnFailure(recipeId: string): Promise<void> {
  await supabaseClient.from("recipes").delete().eq("id", recipeId);
}

function mapInsertRecipeError(error: { code?: string; message: string }): RecipeServiceError {
  if (error.code === "23514" || error.code === "22001") {
    return new RecipeServiceError("instructions_too_long");
  }

  return new RecipeServiceError("internal_error", "Failed to create recipe.", error);
}

function mapInsertIngredientsError(error: { code?: string; message: string }): RecipeServiceError {
  if (error.code === "23514") {
    return new RecipeServiceError("invalid_ingredient_unit");
  }

  return new RecipeServiceError("internal_error", "Failed to store recipe ingredients.", error);
}
