# REST API Plan

## 1. Resources
- `Auth` → Supabase `auth.users` (email/password authentication)
- `Profile` → `profiles` (per-user application metadata, preference notes, onboarding state)
- `Recipe` → `recipes` with nested `recipe_ingredients`
- `AIRecipeGeneration` → Virtual resource orchestrating AI draft creation and quota tracking
- `OnboardingNotice` → Derived state from `profiles`

## 2. Endpoints

### Profile

**GET** `/api/profile`
- Description: Retrieve the authenticated user profile, including preference notes and quota metadata.
- Headers: `Authorization: Bearer <accessToken>`
- Response 200 JSON:
```json
{
  "id": "34f1f3c0-7c26-4f01-9dea-38ec90ed2aef",
  "aiRequestsCount": 2,
  "dislikedIngredientsNote": "seler naciowy, tofu",
  "allergensNote": "orzechy, mleko",
  "onboardingNotificationHiddenUntil": "2025-10-13T00:00:00Z",
  "createdAt": "2025-10-01T09:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```
- Success Codes:
  - `200 OK` – profile found.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `profile_not_found`.

**PATCH** `/api/profile`
- Description: Update mutable profile fields (preference notes and onboarding dismissal timestamp).
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON:
```json
{
  "dislikedIngredientsNote": "seler naciowy, tofu",
  "allergensNote": "orzechy, mleko",
  "onboardingNotificationHiddenUntil": "2025-10-13T00:00:00Z"
}
```
- Response 200 JSON: Updated profile payload as in GET.
- Success Codes:
  - `200 OK` – profile updated.
- Error Codes:
  - `400 Bad Request` – `invalid_timestamp`, `payload_required`, `preference_note_too_long`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `409 Conflict` – `timestamp_in_past`.

### Recipes

**GET** `/api/recipes`
- Description: List recipes owned by the user, grouped logically on the client.
- Headers: `Authorization: Bearer <accessToken>`
- Query Parameters:
  - `mealType` (`breakfast`|`lunch`|`dinner`|`dessert`|`snack`, optional).
  - `difficulty` (`easy`|`medium`|`hard`, optional).
  - `isAiGenerated` (boolean, optional).
  - `search` (string, optional, matches name and instructions, max 50 chars).
  - `limit` (integer, optional, default 20, max 50).
  - `offset` (integer, optional, default 0).
  - `sort` (`createdAt.desc` | `createdAt.asc` | `name.asc`, optional, default `createdAt.desc`).
- Response 200 JSON:
```json
{
  "items": [
    {
      "id": "7b01c4c8-6da1-4690-9a04-7a1d784a75f1",
      "name": "Almond Oatmeal",
      "mealType": "breakfast",
      "difficulty": "easy",
      "isAiGenerated": true,
      "createdAt": "2025-10-10T10:00:00Z",
      "updatedAt": "2025-10-10T10:05:00Z"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```
- Success Codes:
  - `200 OK` – list returned.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.

**POST** `/api/recipes`
- Description: Create a new manual or AI-adapted recipe.
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON:
```json
{
  "name": "Chickpea Salad",
  "mealType": "lunch",
  "difficulty": "easy",
  "instructions": "Mix ingredients and serve.",
  "ingredients": "Chickpeas - 200g\nRed Onion - 50g\nLemon Juice - 2tbsp\nOlive Oil - 3tbsp\nSalt and Pepper to taste",
  "isAiGenerated": false
}
```
- Response 201 JSON: Full recipe payload (see GET by ID).
- Success Codes:
  - `201 Created` – recipe saved.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `422 Unprocessable Entity` – `ingredients_too_long`.

**GET** `/api/recipes/{recipeId}`
- Description: Retrieve a single recipe with ingredients.
- Headers: `Authorization: Bearer <accessToken>`
- Response 200 JSON:
```json
{
  "id": "7b01c4c8-6da1-4690-9a04-7a1d784a75f1",
  "userId": "34f1f3c0-7c26-4f01-9dea-38ec90ed2aef",
  "name": "Almond Oatmeal",
  "mealType": "breakfast",
  "difficulty": "easy",
  "instructions": "Combine oats, almond milk, and almonds.",
  "ingredients": "Oats - 1 cup\nAlmond Milk - 1 cup\nAlmonds - 50g\nHoney - 1tbsp",
  "isAiGenerated": true,
  "createdAt": "2025-10-10T10:00:00Z",
  "updatedAt": "2025-10-10T10:05:00Z"
}
```
- Success Codes:
  - `200 OK` – recipe found.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `recipe_not_found`.

**PUT** `/api/recipes/{recipeId}`
- Description: Replace recipe properties and ingredient text.
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON: Same schema as POST.
- Response 200 JSON: Updated recipe payload.
- Success Codes:
  - `200 OK` – recipe updated.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `recipe_not_found`.
  - `422 Unprocessable Entity` – `ingredients_too_long`.

**DELETE** `/api/recipes/{recipeId}`
- Description: Permanently delete a recipe.
- Headers: `Authorization: Bearer <accessToken>`
- Response: `204 No Content`.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `recipe_not_found`.

### AI Recipe Generation

**POST** `/api/ai/recipes`
- Description: Generate a draft recipe using preferences and decrement daily quota.
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON:
```json
{
  "mealType": "dinner",
  "mainIngredient": "chickpea",
  "difficulty": "medium"
}
```
- Response 201 JSON:
```json
{
  "draft": {
    "name": "Herbed Chickpea Stew",
    "mealType": "dinner",
    "difficulty": "medium",
    "instructions": "1. Podgrzej oliwę...",
    "ingredients": "Ciecierzyca - 200 g\nBulion warzywny - 400 ml\nLiść laurowy - 1 szt",
    "isAiGenerated": true
  },
  "aiRequestsRemaining": 1
}
```
- Success Codes:
  - `201 Created` – draft generated.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`, `invalid_meal_type`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `403 Forbidden` – `ai_quota_exceeded`.
  - `422 Unprocessable Entity` – `preference_conflict_detected`.

- Description: Persist the latest AI draft as a stored recipe (idempotent per draft).
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON: Same schema as `/api/recipes` with `isAiGenerated: true`.
- Response 201 JSON: Stored recipe payload.
- Success Codes:
  - `201 Created` – recipe saved from AI draft.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `draft_not_found`.
  - `422 Unprocessable Entity` – `ingredients_too_long`.

### Onboarding Notice

**GET** `/api/onboarding-notice`
- Description: Determine whether the onboarding reminder should show for the user.
- Headers: `Authorization: Bearer <accessToken>`
- Response 200 JSON:
```json
{
  "show": false,
  "dismissibleUntil": "2025-10-13T00:00:00Z"
}
```
- Success Codes:
  - `200 OK` – evaluation computed.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.

**POST** `/api/onboarding-notice/dismiss`
- Description: Hide the onboarding reminder for 48 hours by updating profile timestamp.
- Headers: `Authorization: Bearer <accessToken>`
- Response 200 JSON:
```json
{
  "hiddenUntil": "2025-10-13T00:00:00Z"
}
```
- Success Codes:
  - `200 OK` – dismissal recorded.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `409 Conflict` – `timestamp_in_past`.

## 3. Validation and Business Logic
- General
  - Accept and emit timestamps in ISO 8601 UTC format.
  - Standardize error body as `{ "error": { "code": string, "message": string } }`.
  - Guard all numeric query params (`limit`, `offset`) with bounds and defaults.

- Profile
  - `onboardingNotificationHiddenUntil` must be null or ≥ current timestamp.
  - `dislikedIngredientsNote` and `allergensNote` are optional strings trimmed on save and limited to 200 characters.
  - Profile auto-created by database trigger `handle_new_user` upon registration.

- Recipes
  - `name` ≤ 50 chars; `instructions` ≤ 5000 chars (VARCHAR constraints).
  - `ingredients` ≤ 1000 chars stored as plain text (VARCHAR constraint).
  - `mealType` and `difficulty` constrained by enums; validate early.
  - `isAiGenerated` defaults false but must be persisted when saving AI output.
  - Ingredients are expected to be formatted as human-readable text (e.g., "Ingredient - Amount Unit\nIngredient 2 - Amount Unit").

- AI Recipe Generation
  - Check `profiles.ai_requests_count > 0` before invoking model; decrement atomically using RPC or transaction.
  - Enforce alignment with preference notes: tokenize comma/semicolon separated terms (case-insensitive) and instruct the model to avoid allergens/dislikes while treating empty fields as no constraints.
  - Log user ID, request payload, and response metadata for audit.
  - If post-processing detects conflicting keywords in AI output (simple string match against tokens), respond with `422 preference_conflict_detected` without decrementing quota.
  - AI-generated ingredients should be serialized to the text field in the standard format.

- Onboarding Notice
  - `show` when both preference notes are empty/whitespace-only and `hiddenUntil` is null or expired.
  - Dismissal sets `onboardingNotificationHiddenUntil = now + 2 days`; reuse profile validation.

- Security & Performance
  - Apply input sanitation to thwart SQL injection (`PostgREST` equivalent using parameterized queries via Supabase SDK).
  - Preference notes are short text fields—strip HTML tags and normalize whitespace before persistence.
