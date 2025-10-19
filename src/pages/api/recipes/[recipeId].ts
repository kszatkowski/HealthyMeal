import type { APIRoute } from "astro";
import { z } from "zod";

import { deleteRecipe, RecipeServiceError } from "../../../lib/services/recipes.service.ts";

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
  recipe_not_found: 404,
  internal_error: 500,
};

/**
 * Error code to user-friendly message mapping.
 */
const errorMessageMap: Record<string, string> = {
  recipe_not_found: "Recipe not found or you don't have permission to delete it.",
  internal_error: "Failed to delete recipe due to an internal error.",
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
