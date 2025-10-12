import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "../../../db/supabase.client.ts";
import { createRecipe, listRecipes, RecipeServiceError } from "../../../lib/services/recipes.service.ts";
import type { RecipeCreateCommand } from "../../../types.ts";

const ingredientSchema = z
  .object({
    productId: z.string().uuid(),
    amount: z.number({ invalid_type_error: "amount must be a number" }).positive("amount must be greater than zero"),
    unit: z.enum(["gram", "kilogram", "milliliter", "liter", "teaspoon", "tablespoon", "cup", "piece"]),
  })
  .strict();

const recipeSchema = z
  .object({
    name: z
      .string({ invalid_type_error: "name must be a string" })
      .min(1, "name must not be empty")
      .max(100, "name must not exceed 100 characters"),
    mealType: z.enum(["breakfast", "lunch", "dinner", "dessert", "snack"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    instructions: z
      .string({ invalid_type_error: "instructions must be a string" })
      .min(1, "instructions must not be empty")
      .max(5000, "instructions must not exceed 5000 characters"),
    isAiGenerated: z.boolean().optional(),
    ingredients: z
      .array(ingredientSchema, {
        invalid_type_error: "ingredients must be an array",
      })
      .min(1, "ingredients must include at least one item")
      .max(50, "ingredients must not exceed 50 items"),
  })
  .strict();

const recipeListQuerySchema = z
  .object({
    mealType: z.enum(["breakfast", "lunch", "dinner", "dessert", "snack"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    isAiGenerated: z
      .enum(["true", "false"], {
        invalid_type_error: "isAiGenerated must be a boolean value",
      })
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      }),
    search: z
      .string({ invalid_type_error: "search must be a string" })
      .trim()
      .min(1, "search must not be empty")
      .max(50, "search must not exceed 50 characters")
      .optional(),
    limit: z.coerce
      .number({ invalid_type_error: "limit must be a number" })
      .int("limit must be an integer")
      .min(1, "limit must be between 1 and 50")
      .max(50, "limit must be between 1 and 50")
      .default(20),
    offset: z.coerce
      .number({ invalid_type_error: "offset must be a number" })
      .int("offset must be an integer")
      .min(0, "offset must be 0 or greater")
      .default(0),
    sort: z
      .enum(["createdAt.desc", "createdAt.asc", "name.asc"], {
        invalid_type_error: "sort must be one of createdAt.desc, createdAt.asc, or name.asc",
      })
      .default("createdAt.desc"),
  })
  .strict();

const errorStatusMap: Record<string, number> = {
  invalid_payload: 400,
  invalid_query_params: 400,
  invalid_ingredient_unit: 400,
  duplicate_ingredient: 400,
  product_not_found: 404,
  ingredient_limit_exceeded: 422,
  instructions_too_long: 422,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  invalid_payload: "Submitted payload is invalid.",
  invalid_query_params: "Query parameters are invalid.",
  invalid_ingredient_unit: "One or more ingredients use an unsupported unit.",
  duplicate_ingredient: "Each ingredient must reference a unique product.",
  product_not_found: "One or more referenced products were not found.",
  ingredient_limit_exceeded: "The number of ingredients exceeds the allowed limit.",
  instructions_too_long: "Instructions exceed the maximum allowed length.",
  internal_error: "Failed to create recipe due to an internal error.",
};

function toRecipeCommand(input: z.infer<typeof recipeSchema>): RecipeCreateCommand {
  return {
    name: input.name,
    mealType: input.mealType,
    difficulty: input.difficulty,
    instructions: input.instructions,
    isAiGenerated: input.isAiGenerated ?? false,
    ingredients: input.ingredients.map((ingredient) => ({
      productId: ingredient.productId,
      amount: ingredient.amount,
      unit: ingredient.unit,
    })),
  } satisfies RecipeCreateCommand;
}

function buildErrorResponse(code: string, message?: string) {
  const status = errorStatusMap[code] ?? 500;
  return new Response(
    JSON.stringify({
      error: {
        code,
        message: message ?? errorMessageMap[code] ?? errorMessageMap.internal_error,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("POST /api/recipes: Failed to parse JSON payload", { error });
    return buildErrorResponse("invalid_payload", "Request body must be valid JSON.");
  }

  const validation = recipeSchema.safeParse(payload);

  if (!validation.success) {
    console.warn("POST /api/recipes: Payload validation failed", {
      issues: validation.error.issues,
    });

    return buildErrorResponse("invalid_payload", validation.error.issues[0]?.message);
  }

  try {
    const command = toRecipeCommand(validation.data);
    const recipe = await createRecipe(command);

    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof RecipeServiceError) {
      console.warn("POST /api/recipes: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("POST /api/recipes: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const validation = recipeListQuerySchema.safeParse(query);

  if (!validation.success) {
    console.warn("GET /api/recipes: Query validation failed", {
      issues: validation.error.issues,
    });

    return buildErrorResponse("invalid_query_params", validation.error.issues[0]?.message);
  }

  const userId = DEFAULT_USER_ID;

  try {
    const result = await listRecipes(userId, validation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof RecipeServiceError) {
      console.warn("GET /api/recipes: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("GET /api/recipes: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
