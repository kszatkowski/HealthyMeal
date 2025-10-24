import type { APIRoute } from "astro";
import { z } from "zod";

import {
  openRouterService,
  SchemaValidationError,
  OpenRouterApiError,
  InvalidJsonResponseError,
  NetworkError,
} from "../../../lib/services/openrouter.service";
import { recipeUpdateCommandSchema } from "../../../lib/schemas/recipe.schema";
import { getProfile, decrementAiRequestsCount, ProfileServiceError } from "../../../lib/services/profile.service";
import type { RecipeUpdateCommand } from "../../../types";

// ============================================================================
// Request Schema
// ============================================================================

const generateRecipeRequestSchema = z
  .object({
    prompt: z
      .string({ invalid_type_error: "prompt must be a string" })
      .trim()
      .min(1, "prompt cannot be empty")
      .max(1500, "prompt must not exceed 1500 characters"),
    model: z.string().optional().describe("Optional model override from default"),
  })
  .strict();

type GenerateRecipeRequest = z.infer<typeof generateRecipeRequestSchema>;

// ============================================================================
// Error Handler
// ============================================================================

function handleError(error: unknown): { status: number; body: unknown } {
  if (error instanceof SchemaValidationError) {
    return {
      status: 422,
      body: {
        success: false,
        error: "Generated recipe does not match expected schema",
        details: error.issues,
      },
    };
  }

  if (error instanceof OpenRouterApiError) {
    return {
      status: error.status >= 500 ? 502 : 400,
      body: {
        success: false,
        error: `OpenRouter API error: ${error.message}`,
        details: error.details,
      },
    };
  }

  if (error instanceof InvalidJsonResponseError) {
    return {
      status: 502,
      body: {
        success: false,
        error: "Failed to parse AI response as valid JSON",
      },
    };
  }

  if (error instanceof NetworkError) {
    return {
      status: 503,
      body: {
        success: false,
        error: "Network error while communicating with AI service",
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        success: false,
        error: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: "Unknown error occurred",
    },
  };
}

// ============================================================================
// Response Schema
// ============================================================================

interface GenerateRecipeSuccessResponse {
  success: true;
  data: RecipeUpdateCommand;
  aiRequestsRemaining: number;
}

// ============================================================================
// API Endpoint
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  // Verify user authentication
  if (!locals.user || !locals.user.id) {
    console.warn("POST /api/recipes/generate: Unauthorized access attempt");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Authentication required. Please provide a valid token.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch user profile to check AI requests quota
    let aiRequestsRemaining = 0;
    try {
      const profile = await getProfile(locals.supabase, locals.user.id);
      aiRequestsRemaining = profile.aiRequestsCount;
    } catch (profileError) {
      if (profileError instanceof ProfileServiceError) {
        console.warn("POST /api/recipes/generate: Failed to fetch profile", {
          code: profileError.code,
        });
      }
      // Continue anyway - API quota check is not critical
    }

    // Check if user has remaining requests
    if (aiRequestsRemaining <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Daily AI request limit reached. Please try again tomorrow.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const validationResult = generateRecipeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request payload",
          details: validationResult.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt, model } = validationResult.data as GenerateRecipeRequest;

    // Generate recipe using OpenRouter service
    const generatedRecipe = await openRouterService.getStructuredResponse(prompt, {
      schema: recipeUpdateCommandSchema,
      ...(model && { model }),
    });

    // Ensure isAiGenerated is set to true for AI-generated recipes
    const recipeData: RecipeUpdateCommand = {
      ...generatedRecipe,
      isAiGenerated: true,
    };

    // Decrement AI requests count in database
    let updatedProfile;
    try {
      updatedProfile = await decrementAiRequestsCount(locals.supabase, locals.user.id);
    } catch (profileUpdateError) {
      if (profileUpdateError instanceof ProfileServiceError) {
        console.warn("POST /api/recipes/generate: Failed to decrement AI requests count", {
          code: profileUpdateError.code,
          message: profileUpdateError.message,
        });

        // If we can't decrement (no requests remaining), return 429 error
        if (
          profileUpdateError.code === "internal_error" &&
          profileUpdateError.message?.includes("no requests remaining")
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Daily AI request limit reached. Please try again tomorrow.",
            }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      // For other errors, return 500
      console.error("POST /api/recipes/generate: Unexpected error during decrement", profileUpdateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to process AI request. Please try again later.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: GenerateRecipeSuccessResponse = {
      success: true,
      data: recipeData,
      aiRequestsRemaining: updatedProfile.aiRequestsCount,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
