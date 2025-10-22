# Recipe Generation Endpoint Documentation

## Overview

The `/api/recipes/generate` endpoint uses the OpenRouter AI service to generate structured recipe data based on a user prompt. The generated recipe automatically matches the `recipeUpdateCommandSchema` structure.

## Endpoint

```
POST /api/recipes/generate
```

## Request

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body

```typescript
interface GenerateRecipeRequest {
  prompt: string;        // Required: Description of desired recipe (1-500 chars)
  model?: string;        // Optional: Override default model
}
```

### Example Request

```bash
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a healthy low-carb chicken recipe with broccoli that can be prepared in 30 minutes"
  }'
```

With optional model override:

```bash
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a vegan pasta recipe with seasonal vegetables",
    "model": "anthropic/claude-3.5-sonnet"
  }'
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Grilled Lemon Herb Chicken with Roasted Broccoli",
    "mealType": "lunch",
    "difficulty": "easy",
    "instructions": "1. Preheat oven to 400°F. 2. Season chicken with lemon, herbs, salt and pepper. 3. Place on baking sheet with broccoli florets. 4. Roast for 25-30 minutes until chicken is cooked through.",
    "isAiGenerated": true,
    "ingredients": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 2,
        "unit": "piece"
      },
      {
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "amount": 300,
        "unit": "g"
      }
    ]
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Payload
```json
{
  "success": false,
  "error": "Invalid request payload",
  "details": [
    {
      "path": ["prompt"],
      "message": "prompt cannot be empty"
    }
  ]
}
```

#### 422 Unprocessable Entity - Schema Validation Failed
```json
{
  "success": false,
  "error": "Generated recipe does not match expected schema",
  "details": [
    {
      "path": ["ingredients"],
      "message": "Ingredients must be an array"
    }
  ]
}
```

#### 502 Bad Gateway - AI Response Parse Error
```json
{
  "success": false,
  "error": "Failed to parse AI response as valid JSON"
}
```

#### 503 Service Unavailable - Network Error
```json
{
  "success": false,
  "error": "Network error while communicating with AI service"
}
```

#### 500 Internal Server Error - OpenRouter API Error
```json
{
  "success": false,
  "error": "OpenRouter API error: Rate limit exceeded",
  "details": {
    "error": {
      "code": "rate_limit_exceeded"
    }
  }
}
```

## Implementation Details

### Flow

1. **Request Validation** - Validates request payload against `generateRecipeRequestSchema`
2. **Schema Definition** - Uses `recipeUpdateCommandSchema` as the structure the AI must follow
3. **AI Generation** - Calls `openRouterService.getStructuredResponse()` with the schema
4. **Response Parsing** - OpenRouter returns structured JSON in tool_calls format
5. **Validation** - Response is validated against the schema via Zod
6. **Return** - Returns validated data or detailed error information

### Error Handling

The endpoint handles different error types with appropriate HTTP status codes:

- **SchemaValidationError** (422) - AI response doesn't match recipe schema
- **OpenRouterApiError** (400/502) - OpenRouter API returned error
- **InvalidJsonResponseError** (502) - Failed to parse AI response
- **NetworkError** (503) - Network connectivity issue
- **Other Errors** (500) - Unexpected errors

## Example Integration (React Hook)

```typescript
async function generateRecipe(prompt: string) {
  const response = await fetch("/api/recipes/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const { data } = await response.json();
  return data;
}
```

## Configuration

The endpoint uses:
- **Default Model**: `tngtech/deepseek-r1t2-chimera:free` (configurable via `OPENROUTER_API_KEY`)
- **API Key**: Required in `OPENROUTER_API_KEY` environment variable
- **Temperature**: Not specified (uses model default)
- **Max Tokens**: Not specified (uses model default)

## Notes

- The `isAiGenerated` flag is automatically set to `true` for generated recipes
- Product IDs in ingredients must be valid UUIDs pointing to existing products
- Recipe names must be 1-200 characters
- Instructions must be 1-2000 characters
- Maximum 50 ingredients per recipe

## Testing

To test the endpoint locally:

```bash
# Make sure your .env has OPENROUTER_API_KEY
npm run dev

# In another terminal
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Quick 15 minute pasta dinner"}'
```


