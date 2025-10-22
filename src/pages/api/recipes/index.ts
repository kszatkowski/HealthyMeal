import type { APIRoute } from "astro";
import { z } from "zod";

import { createRecipe, listRecipes, RecipeServiceError } from "../../../lib/services/recipes.service.ts";
import { recipeUpdateCommandSchema } from "../../../lib/schemas/recipe.schema.ts";
import type { RecipeCreateCommand } from "../../../types.ts";

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
  ingredients_too_long: 422,
  instructions_too_long: 422,
  internal_error: 500,
};

const errorMessageMap: Record<string, string> = {
  invalid_payload: "Submitted payload is invalid.",
  invalid_query_params: "Query parameters are invalid.",
  ingredients_too_long: "Ingredients exceed the maximum allowed length.",
  instructions_too_long: "Instructions exceed the maximum allowed length.",
  internal_error: "Failed to create recipe due to an internal error.",
};

function toRecipeCommand(input: z.infer<typeof recipeUpdateCommandSchema>): RecipeCreateCommand {
  return {
    name: input.name,
    mealType: input.mealType,
    difficulty: input.difficulty,
    instructions: input.instructions,
    isAiGenerated: input.isAiGenerated ?? false,
    ingredients: input.ingredients,
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

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("POST /api/recipes: Failed to parse JSON payload", { error });
    return buildErrorResponse("invalid_payload", "Request body must be valid JSON.");
  }

  const validation = recipeUpdateCommandSchema.safeParse(payload);

  if (!validation.success) {
    console.warn("POST /api/recipes: Payload validation failed", {
      issues: validation.error.issues,
    });

    return buildErrorResponse("invalid_payload", validation.error.issues[0]?.message);
  }

  try {
    const command = toRecipeCommand(validation.data);
    const recipe = await createRecipe(locals.supabase, locals.user?.id ?? "", command);

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

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const validation = recipeListQuerySchema.safeParse(query);

  if (!validation.success) {
    console.warn("GET /api/recipes: Query validation failed", {
      issues: validation.error.issues,
    });

    return buildErrorResponse("invalid_query_params", validation.error.issues[0]?.message);
  }

  try {
    const result = await listRecipes(locals.supabase, locals.user?.id ?? "", validation.data);

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
