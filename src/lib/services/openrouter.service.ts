import type { ZodSchema } from "zod";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// ============================================================================
// Custom Error Classes
// ============================================================================

class OpenRouterApiError extends Error {
  public readonly name = "OpenRouterApiError";

  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, OpenRouterApiError.prototype);
  }
}

class SchemaValidationError extends Error {
  public readonly name = "SchemaValidationError";

  constructor(
    message: string,
    public readonly issues: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

class InvalidJsonResponseError extends Error {
  public readonly name = "InvalidJsonResponseError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidJsonResponseError.prototype);
  }
}

class NetworkError extends Error {
  public readonly name = "NetworkError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

interface OpenRouterServiceConfig {
  apiKey?: string;
  defaultModel?: string;
  siteUrl?: string;
  appName?: string;
}

interface GetStructuredResponseOptions<T extends ZodSchema> {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  schema: T;
}

// ============================================================================
// OpenRouter Service
// ============================================================================

class OpenRouterService {
  private readonly config: Required<OpenRouterServiceConfig>;

  private readonly apiBaseUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(config: OpenRouterServiceConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.");
    }

    this.config = {
      apiKey,
      defaultModel: config.defaultModel ?? "meta-llama/llama-3.3-70b-instruct:free",
      siteUrl: config.siteUrl ?? process.env.PUBLIC_SITE_URL ?? "http://localhost:3000",
      appName: config.appName ?? "HealthyMeal",
    };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  async getStructuredResponse<T extends ZodSchema>(
    prompt: string,
    options: GetStructuredResponseOptions<T>
  ): Promise<z.infer<T>> {
    if (!prompt) {
      throw new Error("Prompt cannot be empty.");
    }

    const payload = this._buildPayload(prompt, options);
    const rawResponse = await this._callApi(payload);
    const validatedData = await this._parseAndValidateResponse(rawResponse, options.schema);

    return validatedData;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private _buildPayload<T extends ZodSchema>(prompt: string, options: GetStructuredResponseOptions<T>): object {
    const { schema, model, temperature, maxTokens } = options;

    const jsonSchema = zodToJsonSchema(schema, {
      name: "structuredResponse",
    }) as object;

    const toolName = (jsonSchema as Record<string, string>).title ?? "structured_response_formatter";

    const payload = {
      model: model ?? this.config.defaultModel,
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      tool_choice: { type: "function", function: { name: toolName } },
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: "Formats the response into a structured JSON object based on the provided schema.",
            parameters: jsonSchema,
          },
        },
      ],
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that only responds with structured JSON that adheres to " +
            "the provided tool schema. Always use the provided function to format your response.",
        },
        { role: "user", content: prompt },
      ],
    };

    return payload;
  }

  private async _callApi(payload: object): Promise<Response> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(this.apiBaseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": this.config.siteUrl,
            "X-Title": this.config.appName,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new OpenRouterApiError(`OpenRouter API error: ${response.statusText}`, response.status, errorData);
        }

        return response;
      } catch (error) {
        lastError =
          error instanceof OpenRouterApiError
            ? error
            : new NetworkError(`Network error on attempt ${attempt + 1}: ${String(error)}`);

        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError ?? new NetworkError("Failed to call OpenRouter API after multiple attempts");
  }

  private async _parseAndValidateResponse<T extends ZodSchema>(response: Response, schema: T): Promise<z.infer<T>> {
    let responseData: unknown;

    try {
      responseData = await response.json();
    } catch (error) {
      throw new InvalidJsonResponseError(`Failed to parse API response as JSON: ${String(error)}`);
    }

    const data = responseData as Record<string, unknown>;
    const choices = data.choices as { message?: { tool_calls?: unknown[] } }[] | undefined;

    if (!choices?.[0]?.message?.tool_calls?.[0]) {
      throw new InvalidJsonResponseError("Invalid response structure: missing tool_calls in response");
    }

    const firstChoice = choices[0] as Record<string, unknown>;

    if (!firstChoice.message) {
      throw new InvalidJsonResponseError("Invalid response structure: missing message");
    }

    const message = firstChoice.message as Record<string, unknown> & { tool_calls?: unknown };
    const toolCalls = message.tool_calls as Record<string, unknown>[];

    if (!toolCalls?.[0]) {
      throw new InvalidJsonResponseError("Invalid response structure: missing tool_calls");
    }

    const functionData = toolCalls[0];

    if (!functionData.function) {
      throw new InvalidJsonResponseError("Invalid response structure: missing function");
    }

    const func = functionData.function as Record<string, unknown>;

    if (!func.arguments) {
      throw new InvalidJsonResponseError("Invalid response structure: missing function arguments");
    }

    let parsedJson: unknown;

    try {
      parsedJson = typeof func.arguments === "string" ? JSON.parse(func.arguments as string) : func.arguments;
    } catch (error) {
      throw new InvalidJsonResponseError(`Failed to parse function arguments as JSON: ${String(error)}`);
    }

    const validationResult = schema.safeParse(parsedJson);

    if (!validationResult.success) {
      throw new SchemaValidationError(
        `Response does not match the provided schema: ${validationResult.error.message}`,
        validationResult.error.issues
      );
    }

    return validationResult.data;
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

export const openRouterService = new OpenRouterService();

// ============================================================================
// Type Exports
// ============================================================================

export type { OpenRouterServiceConfig, GetStructuredResponseOptions };
export { OpenRouterApiError, SchemaValidationError, InvalidJsonResponseError, NetworkError };
