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

// ============================================================================
// Request Schema
// ============================================================================

const generateRecipeRequestSchema = z
  .object({
    prompt: z
      .string({ invalid_type_error: "prompt must be a string" })
      .trim()
      .min(1, "prompt cannot be empty")
      .max(1000, "prompt must not exceed 1000 characters"),
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
// API Endpoint
// ============================================================================

export const POST: APIRoute = async ({ request }) => {
  try {
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

    const response = {
      success: true,
      data: generatedRecipe,
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
