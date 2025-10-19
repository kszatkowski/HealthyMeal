import type { APIRoute } from "astro";
import { z } from "zod";

import { deleteRecipe, RecipeServiceError, updateRecipe, getRecipe } from "../../../lib/services/recipes.service.ts";
import { recipeIdSchema, recipeUpdateCommandSchema } from "../../../lib/schemas/recipe.schema.ts";
import type { RecipeUpdateCommand } from "../../../types.ts";

/**
 * Schema to validate the recipe ID parameter from the URL path.
 * Ensures the ID is a valid UUID.
 */
const recipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID."),
});

/**
 * Error code to HTTP status code mapping.
 * Maps service error codes to appropriate HTTP status codes.
 */
const errorStatusMap: Record<string, number> = {
  invalid_payload: 400,
  invalid_recipe_id: 400,
  invalid_ingredient_unit: 400,
  duplicate_ingredient: 400,
  product_not_found: 404,
  recipe_not_found: 404,
  ingredient_limit_exceeded: 422,
  instructions_too_long: 422,
  internal_error: 500,
};

/**
 * Error code to user-friendly message mapping.
 */
const errorMessageMap: Record<string, string> = {
  invalid_payload: "Submitted payload is invalid.",
  invalid_recipe_id: "Recipe ID must be a valid UUID.",
  invalid_ingredient_unit: "One or more ingredients use an unsupported unit.",
  duplicate_ingredient: "Each ingredient must reference a unique product.",
  product_not_found: "One or more referenced products were not found.",
  recipe_not_found: "Recipe not found or you don't have permission to access it.",
  ingredient_limit_exceeded: "The number of ingredients exceeds the allowed limit.",
  instructions_too_long: "Instructions exceed the maximum allowed length.",
  internal_error: "An internal server error occurred.",
};

/**
 * Builds a standardized error response with proper HTTP status code and error message.
 *
 * @param code - The error code
 * @param message - Optional custom message to override the default
 * @returns Response object with appropriate status and error details
 */
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

/**
 * GET /api/recipes/[recipeId]
 *
 * Fetches a single recipe belonging to the authenticated user with all its ingredients and product details.
 *
 * @param params - Route parameters including recipeId
 * @param locals - Astro context locals containing user and supabase instances
 *
 * Response codes:
 * - 200 OK: Recipe found and returned as RecipeResponseDto
 * - 400 Bad Request: Invalid recipeId format
 * - 401 Unauthorized: User not authenticated (handled by middleware)
 * - 404 Not Found: Recipe not found or doesn't belong to user
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // Validate that recipeId parameter is a valid UUID
  const paramValidation = recipeIdSchema.safeParse(params);

  if (!paramValidation.success) {
    console.warn("GET /api/recipes/[recipeId]: Invalid recipe ID format", {
      recipeId: params.recipeId,
      issues: paramValidation.error.issues,
    });

    return buildErrorResponse(
      "invalid_recipe_id",
      paramValidation.error.issues[0]?.message ?? "Recipe ID must be a valid UUID."
    );
  }

  try {
    const userId = locals.user?.id;

    // Additional safety check - user should always be present due to middleware
    if (!userId) {
      console.error("GET /api/recipes/[recipeId]: User context missing from locals");
      return buildErrorResponse("internal_error");
    }

    const { recipeId } = paramValidation.data;

    // Call the service to fetch the recipe
    const recipe = await getRecipe(locals.supabase, userId, recipeId);

    // Return 200 OK with recipe data
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof RecipeServiceError) {
      console.warn("GET /api/recipes/[recipeId]: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("GET /api/recipes/[recipeId]: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

/**
 * PUT /api/recipes/[recipeId]
 *
 * Updates an existing recipe belonging to the authenticated user.
 * Replaces all recipe properties and performs a complete ingredient list replacement
 * in an atomic transaction.
 *
 * @param params - Route parameters including recipeId
 * @param request - The HTTP request object
 * @param locals - Astro context locals containing user and supabase instances
 *
 * Request body: RecipeUpdateCommand object
 *
 * Response codes:
 * - 200 OK: Recipe successfully updated, returns RecipeResponseDto
 * - 400 Bad Request: Invalid recipeId or request payload
 * - 401 Unauthorized: User not authenticated (handled by middleware)
 * - 404 Not Found: Recipe not found or doesn't belong to user
 * - 422 Unprocessable Entity: Business logic error (e.g., ingredient limit exceeded)
 * - 500 Internal Server Error: Unexpected server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Validate that recipeId parameter is a valid UUID
  const paramValidation = recipeIdSchema.safeParse(params);

  if (!paramValidation.success) {
    console.warn("PUT /api/recipes/[recipeId]: Invalid recipe ID format", {
      recipeId: params.recipeId,
      issues: paramValidation.error.issues,
    });

    return buildErrorResponse(
      "invalid_recipe_id",
      paramValidation.error.issues[0]?.message ?? "Recipe ID must be a valid UUID."
    );
  }

  // Parse request body as JSON
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("PUT /api/recipes/[recipeId]: Failed to parse JSON payload", { error });
    return buildErrorResponse("invalid_payload", "Request body must be valid JSON.");
  }

  // Validate request body against schema
  const bodyValidation = recipeUpdateCommandSchema.safeParse(payload);

  if (!bodyValidation.success) {
    console.warn("PUT /api/recipes/[recipeId]: Payload validation failed", {
      issues: bodyValidation.error.issues,
    });

    return buildErrorResponse("invalid_payload", bodyValidation.error.issues[0]?.message);
  }

  try {
    const userId = locals.user?.id;

    // Additional safety check - user should always be present due to middleware
    if (!userId) {
      console.error("PUT /api/recipes/[recipeId]: User context missing from locals");
      return buildErrorResponse("internal_error");
    }

    const { recipeId } = paramValidation.data;
    const command: RecipeUpdateCommand = {
      name: bodyValidation.data.name,
      mealType: bodyValidation.data.mealType,
      difficulty: bodyValidation.data.difficulty,
      instructions: bodyValidation.data.instructions,
      isAiGenerated: bodyValidation.data.isAiGenerated ?? false,
      ingredients: bodyValidation.data.ingredients.map((ingredient) => ({
        productId: ingredient.productId,
        amount: ingredient.amount,
        unit: ingredient.unit,
      })),
    };

    // Call the service to update the recipe
    const updatedRecipe = await updateRecipe(locals.supabase, userId, recipeId, command);

    // Return 200 OK with updated recipe data
    return new Response(JSON.stringify(updatedRecipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof RecipeServiceError) {
      console.warn("PUT /api/recipes/[recipeId]: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("PUT /api/recipes/[recipeId]: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

/**
 * DELETE /api/recipes/[recipeId]
 *
 * Permanently deletes a recipe belonging to the authenticated user.
 * All associated ingredients are automatically deleted due to CASCADE constraints.
 *
 * @param params - Route parameters including recipeId
 * @param locals - Astro context locals containing user and supabase instances
 *
 * Response codes:
 * - 204 No Content: Recipe successfully deleted
 * - 400 Bad Request: Invalid recipeId format
 * - 401 Unauthorized: User not authenticated (handled by middleware)
 * - 404 Not Found: Recipe not found or doesn't belong to user
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Validate that recipeId parameter is a valid UUID
  const paramValidation = recipeIdParamSchema.safeParse(params);

  if (!paramValidation.success) {
    console.warn("DELETE /api/recipes/[recipeId]: Invalid recipe ID format", {
      recipeId: params.recipeId,
      issues: paramValidation.error.issues,
    });

    return buildErrorResponse(
      "invalid_recipe_id",
      paramValidation.error.issues[0]?.message ?? "Recipe ID must be a valid UUID."
    );
  }

  try {
    const userId = locals.user?.id;

    // Additional safety check - user should always be present due to middleware
    if (!userId) {
      console.error("DELETE /api/recipes/[recipeId]: User context missing from locals");
      return buildErrorResponse("internal_error");
    }

    const { recipeId } = paramValidation.data;

    // Call the service to delete the recipe
    await deleteRecipe(locals.supabase, userId, recipeId);

    // Return 204 No Content on successful deletion
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (error instanceof RecipeServiceError) {
      console.warn("DELETE /api/recipes/[recipeId]: Service error", {
        code: error.code,
        message: error.message,
      });

      return buildErrorResponse(error.code, error.message);
    }

    console.error("DELETE /api/recipes/[recipeId]: Unexpected error", { error });
    return buildErrorResponse("internal_error");
  }
};

export const prerender = false;
