# OpenRouter Service Implementation Plan

This document outlines the design and step-by-step implementation plan for an `OpenRouterService` in a TypeScript environment, tailored for an Astro application. The service will act as a robust wrapper around the OpenRouter API, with a primary focus on generating strongly-typed, structured JSON responses from Large Language Models (LLMs).

## 1. Service Description

The `OpenRouterService` provides a simplified interface for interacting with the OpenRouter chat completions API. Its core feature is to accept a user prompt and a Zod schema, and in turn, return a validated JavaScript object that conforms to that schema. This abstracts away the complexities of payload construction, API communication, response parsing, and error handling.

The service is designed to be a server-side singleton, ensuring that the API key and other sensitive configurations are never exposed to the client.

## 2. Constructor Description

The service's constructor will initialize the client with the necessary configuration.

```typescript
import type { ZodSchema } from 'zod';

// Service configuration options
interface OpenRouterServiceConfig {
  apiKey?: string; // Defaults to process.env.OPENROUTER_API_KEY
  defaultModel?: string; // Defaults to 'google/gemini-flash-1.5'
  siteUrl?: string; // Defaults to process.env.PUBLIC_SITE_URL
  appName?: string; // Defaults to 'HealthyMeal'
}

// Options for each individual API call
interface GetStructuredResponseOptions<T extends ZodSchema> {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  schema: T;
}

class OpenRouterService {
  private readonly config: Required<OpenRouterServiceConfig>;

  constructor(config: OpenRouterServiceConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.');
    }

    this.config = {
      apiKey,
      defaultModel: config.defaultModel ?? 'google/gemini-flash-1.5',
      siteUrl: config.siteUrl ?? process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000',
      appName: config.appName ?? 'HealthyMeal',
    };
  }
}
```

## 3. Public Methods and Fields

The service will expose a single public method to handle all primary interactions.

### `getStructuredResponse<T extends ZodSchema>(prompt: string, options: GetStructuredResponseOptions<T>): Promise<z.infer<T>>`

This is the main method of the service. It orchestrates the entire process of sending a prompt to the LLM and getting a structured, validated response.

-   **Parameters**:
    -   `prompt` (string): The user-facing prompt or query to send to the model.
    -   `options` (object):
        -   `schema` (ZodSchema): The Zod schema that the model's response must adhere to.
        -   `model` (string, optional): The OpenRouter model to use for this specific request. Overrides the service's default.
        -   `temperature` (number, optional): The generation temperature.
        -   `maxTokens` (number, optional): The maximum number of tokens to generate.
-   **Returns**: A `Promise` that resolves to an object of the type inferred from the provided Zod schema.
-   **Throws**:
    -   `OpenRouterApiError`: For errors returned by the OpenRouter API (e.g., 4xx, 5xx status codes).
    -   `NetworkError`: For issues with the underlying network request.
    -   `InvalidJsonResponseError`: If the model returns a response that is not valid JSON.
    -   `SchemaValidationError`: If the model's JSON response does not validate against the provided Zod schema.

## 4. Private Methods and Fields

The internal logic will be broken down into several private methods to maintain clarity and separation of concerns.

### `_buildPayload(prompt: string, options: GetStructuredResponseOptions<T>)`

Constructs the full request body for the OpenRouter API, including messages, model parameters, and the formatted `tools` object derived from the Zod schema.

### `_callApi(payload: object)`

Executes the `fetch` request to the OpenRouter endpoint. It will handle setting headers, the request body, and perform initial response validation (checking the HTTP status). It will also implement a retry mechanism for transient errors.

### `_parseAndValidateResponse<T extends ZodSchema>(response: Response, schema: T)`

Parses the raw API response. It extracts the stringified JSON from the `tool_calls` section of the response, parses it into a JavaScript object, and then validates this object against the provided Zod schema.

## 5. Obsługa błędów

Custom error classes will be defined to provide specific details about what went wrong, allowing the calling code to handle failures gracefully.

```typescript
// Example custom error classes
class OpenRouterApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'OpenRouterApiError';
  }
}

class SchemaValidationError extends Error {
  constructor(message: string, public issues: any) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

class InvalidJsonResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidJsonResponseError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

## 6. Kwestie bezpieczeństwa

1.  **API Key Management**: The OpenRouter API key will be stored exclusively in server-side environment variables (`.env`). The service class will only be instantiated and used in server-side contexts (e.g., Astro API endpoints), ensuring the key is never exposed to the client browser.
2.  **Input Sanitization**: While the prompt is passed to a third-party service, no part of the prompt is ever directly used in database queries or rendered as HTML, mitigating risks of injection attacks within our application.
3.  **Dependency Management**: Use trusted libraries (`zod`, `zod-to-json-schema`) and keep them updated to patch any security vulnerabilities.

## 7. Plan wdrożenia krok po kroku

**Krok 1: Instalacja zależności**

Dodaj `zod` do walidacji schematów i `zod-to-json-schema` do konwersji schematów na format, którego wymaga OpenRouter.

```bash
npm install zod zod-to-json-schema
```

**Krok 2: Konfiguracja zmiennych środowiskowych**

Dodaj swój klucz API OpenRouter do pliku `.env` w głównym katalogu projektu.

```env
# .env
OPENROUTER_API_KEY="sk-or-v1-..."
PUBLIC_SITE_URL="http://localhost:4321"
```

**Krok 3: Utworzenie pliku usługi**

Utwórz nowy plik w `src/lib/services/openrouter.service.ts`. W tym pliku zdefiniujesz klasę `OpenRouterService` oraz powiązane z nią typy i niestandardowe błędy.

**Krok 4: Implementacja konstruktora i niestandardowych błędów**

W `openrouter.service.ts` dodaj niestandardowe klasy błędów i konstruktor, jak opisano w sekcjach 2 i 5. Zapewni to, że usługa zainicjuje się poprawnie i będzie gotowa do obsługi błędów.

**Krok 5: Implementacja metody `_buildPayload`**

Ta metoda będzie używać `zod-to-json-schema`, aby przekształcić schemat Zod w prawidłowy obiekt `tools` dla API OpenRouter.

```typescript
// Inside OpenRouterService class in openrouter.service.ts
import { z, ZodSchema } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

private _buildPayload<T extends ZodSchema>(prompt: string, options: GetStructuredResponseOptions<T>) {
  const { schema, model, temperature, maxTokens } = options;
  const jsonSchema = zodToJsonSchema(schema, 'structuredResponse');

  const toolName = jsonSchema.description ?? 'structured_response_formatter';

  return {
    model: model ?? this.config.defaultModel,
    temperature,
    max_tokens: maxTokens,
    tool_choice: { type: 'function', function: { name: toolName } },
    tools: [{
      type: 'function',
      function: {
        name: toolName,
        description: 'Formats the response into a structured JSON object based on the provided schema.',
        parameters: jsonSchema,
      },
    }],
    messages: [
      { role: 'system', content: 'You are a helpful assistant that only responds with structured JSON that adheres to the provided tool schema.' },
      { role: 'user', content: prompt },
    ],
  };
}
```

**Krok 6: Implementacja metod `_callApi` i `_parseAndValidateResponse`**

Zaimplementuj logikę do wywoływania API `fetch` i przetwarzania odpowiedzi. Upewnij się, że poprawnie obsługujesz statusy błędów HTTP i błędy parsowania.

**Krok 7: Implementacja publicznej metody `getStructuredResponse`**

Połącz wszystkie prywatne metody w ramach `getStructuredResponse`. Ta metoda będzie działać jako główny punkt wejścia do usługi.

```typescript
// Inside OpenRouterService class in openrouter.service.ts
async getStructuredResponse<T extends ZodSchema>(prompt: string, options: GetStructuredResponseOptions<T>): Promise<z.infer<T>> {
  if (!prompt) {
    throw new Error('Prompt cannot be empty.');
  }
  
  const payload = this._buildPayload(prompt, options);
  const rawResponse = await this._callApi(payload);
  const validatedData = await this._parseAndValidateResponse(rawResponse, options.schema);
  
  return validatedData;
}
```

**Krok 8: Utworzenie instancji singletona**

Aby upewnić się, że w całej aplikacji używana jest tylko jedna instancja usługi, wyeksportuj preinicjalizowaną instancję z pliku usługi.

```typescript
// At the end of src/lib/services/openrouter.service.ts
export const openRouterService = new OpenRouterService();
```

**Krok 9: Użycie usługi w punkcie końcowym API Astro**

Na koniec użyj usługi w punkcie końcowym API, aby wygenerować ustrukturyzowane dane na podstawie danych wejściowych użytkownika.

```typescript
// Example usage in an Astro API endpoint: src/pages/api/recipes/generate.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { openRouterService } from '~/lib/services/openrouter.service';

const recipeSchema = z.object({
  name: z.string().describe('The creative name of the recipe.'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'snack']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.string().describe('Ingredients as a single text field with each ingredient on a new line.'),
  instructions: z.string().describe('Step-by-step cooking instructions.'),
  isAiGenerated: z.boolean().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const { prompt } = await request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
  }

  try {
    const recipe = await openRouterService.getStructuredResponse(prompt, {
      schema: recipeSchema,
      model: 'anthropic/claude-3.5-sonnet', // Model suited for creative tasks
    });

    return new Response(JSON.stringify(recipe), { status: 200 });
  } catch (error) {
    console.error(error);
    // Here you can handle specific error types (e.g., SchemaValidationError)
    return new Response(JSON.stringify({ error: 'Failed to generate recipe.' }), { status: 500 });
  }
};
```
