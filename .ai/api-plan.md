# REST API Plan

## 1. Resources
- `Auth` → Supabase `auth.users` (email/password authentication)
- `Profile` → `profiles` (per-user application metadata)
- `Product` → `products` (ingredient catalog)
- `UserPreference` → `user_preferences` (likes/dislikes/allergens)
- `Recipe` → `recipes` with nested `recipe_ingredients`
- `AIRecipeGeneration` → Virtual resource orchestrating AI draft creation and quota tracking
- `OnboardingNotice` → Derived state from `profiles` and `user_preferences`

## 2. Endpoints

### Profile

**GET** `/api/profile`
- Description: Retrieve the authenticated user profile plus preference counters.
- Headers: `Authorization: Bearer <accessToken>`
- Response 200 JSON:
```json
{
  "id": "34f1f3c0-7c26-4f01-9dea-38ec90ed2aef",
  "aiRequestsCount": 2,
  "onboardingNotificationHiddenUntil": "2025-10-13T00:00:00Z",
  "createdAt": "2025-10-01T09:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z",
  "likesCount": 5,
  "dislikesCount": 1,
  "allergensCount": 0
}
```
- Success Codes:
  - `200 OK` – profile found.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `profile_not_found`.

**PATCH** `/api/profile`
- Description: Update mutable profile fields (currently onboarding dismissal timestamp).
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON:
```json
{
  "onboardingNotificationHiddenUntil": "2025-10-13T00:00:00Z"
}
```
- Response 200 JSON: Updated profile payload as in GET.
- Success Codes:
  - `200 OK` – profile updated.
- Error Codes:
  - `400 Bad Request` – `invalid_timestamp`, `payload_required`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `409 Conflict` – `timestamp_in_past`.

### Products

**GET** `/api/products`
- Description: List catalog products with search, pagination, and sorting.
- Query Parameters:
  - `search` (string, optional, max 50 chars, case-insensitive partial match).
  - `limit` (integer, optional, default 20, max 50).
  - `offset` (integer, optional, default 0).
  - `sort` (`name.asc` | `name.desc`, optional, default `name.asc`).
- Response 200 JSON:
```json
{
  "items": [
    { "id": "6d9011b0-0719-4d7a-8be3-262b8b2ab885", "name": "Almond" }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```
- Success Codes:
  - `200 OK` – list returned.
- Error Codes:
  - `400 Bad Request` – `invalid_query_param`.

**GET** `/api/products/{productId}`
- Description: Fetch a single product by ID.
- Response 200 JSON:
```json
{
  "id": "6d9011b0-0719-4d7a-8be3-262b8b2ab885",
  "name": "Almond"
}
```
- Success Codes:
  - `200 OK` – product found.
- Error Codes:
  - `404 Not Found` – `product_not_found`.

### User Preferences

**GET** `/api/preferences`
- Description: List user preferences, optionally filtered by type.
- Headers: `Authorization: Bearer <accessToken>`
- Query Parameters:
  - `type` (`like` | `dislike` | `allergen`, optional).
- Response 200 JSON:
```json
{
  "items": [
    {
      "id": "9348f004-5f09-43be-9f10-410df34718a6",
      "preferenceType": "like",
      "createdAt": "2025-10-10T18:00:00Z",
      "product": {
        "id": "6d9011b0-0719-4d7a-8be3-262b8b2ab885",
        "name": "Almond"
      }
    }
  ]
}
```
- Success Codes:
  - `200 OK` – preferences listed.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.

**POST** `/api/preferences`
- Description: Create a new preference entry enforcing conflict and quota rules.
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON:
```json
{
  "productId": "6d9011b0-0719-4d7a-8be3-262b8b2ab885",
  "preferenceType": "like"
}
```
- Response 201 JSON: Preference resource as returned by GET.
- Success Codes:
  - `201 Created` – preference added.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`, `unknown_product`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `409 Conflict` – `conflict_existing_preference`.
  - `422 Unprocessable Entity` – `preference_limit_reached`.

**DELETE** `/api/preferences/{preferenceId}`
- Description: Remove a preference belonging to the user.
- Headers: `Authorization: Bearer <accessToken>`
- Response: `204 No Content`.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `preference_not_found`.

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
  "ingredients": [
    {
      "productId": "f4108d45-8d68-4a11-92d0-0c3c6e05ca1e",
      "amount": 200,
      "unit": "gram"
    }
  ],
  "isAiGenerated": false
}
```
- Response 201 JSON: Full recipe payload (see GET by ID).
- Success Codes:
  - `201 Created` – recipe saved.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`, `invalid_ingredient_unit`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `product_not_found`.
  - `422 Unprocessable Entity` – `ingredient_limit_exceeded`, `instructions_too_long`.

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
  "isAiGenerated": true,
  "createdAt": "2025-10-10T10:00:00Z",
  "updatedAt": "2025-10-10T10:05:00Z",
  "ingredients": [
    {
      "id": "1d2c7c45-43ce-4d76-90b5-cf74fd7024d6",
      "product": {
        "id": "6d9011b0-0719-4d7a-8be3-262b8b2ab885",
        "name": "Almond"
      },
      "amount": 50,
      "unit": "gram"
    }
  ]
}
```
- Success Codes:
  - `200 OK` – recipe found.
- Error Codes:
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `recipe_not_found`.

**PUT** `/api/recipes/{recipeId}`
- Description: Replace recipe properties and ingredient list.
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON: Same schema as POST.
- Response 200 JSON: Updated recipe payload.
- Success Codes:
  - `200 OK` – recipe updated.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`, `invalid_ingredient_unit`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `recipe_not_found`.
  - `422 Unprocessable Entity` – `ingredient_limit_exceeded`.

**DELETE** `/api/recipes/{recipeId}`
- Description: Permanently delete a recipe with cascading ingredients.
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
    "instructions": "...",
    "ingredients": [
      { "name": "Chickpea", "amount": 200, "unit": "gram" }
    ]
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

**POST** `/api/ai/recipes/save`
- Description: Persist the latest AI draft as a stored recipe (idempotent per draft).
- Headers: `Authorization: Bearer <accessToken>`
- Request JSON: Same schema as `/api/recipes` with `isAiGenerated: true` and materialized ingredient product IDs.
- Response 201 JSON: Stored recipe payload.
- Success Codes:
  - `201 Created` – recipe saved from AI draft.
- Error Codes:
  - `400 Bad Request` – `invalid_payload`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `draft_not_found`, `product_not_found`.
  - `422 Unprocessable Entity` – `ingredient_limit_exceeded`.

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
  - Profile auto-created by database trigger `handle_new_user` upon registration.

- Products
  - Names unique (`UNIQUE (name)`); client should debounce search queries.
  - Index `idx_recipes_meal_type` informs filter design for recipes.

- User Preferences
  - `preferenceType` limited to `like|dislike|allergen`; enforce via request validation.
  - DB trigger `validate_user_preferences` enforces: no duplicates per product, category limit of 30, conflict messaging; API surfaces friendly errors.
  - Deletions cascade via foreign keys when user removed.

- Recipes
  - `name` ≤ 100 chars; `instructions` ≤ 5000 chars (VARCHAR constraints).
  - `mealType`, `difficulty`, `unit` constrained by enums; validate early.
  - Ingredients require positive `amount` and at least one entry; limit to 50 to maintain payload size.
  - Updates replace ingredient set within a transaction to maintain integrity.
  - `isAiGenerated` defaults false but must be persisted when saving AI output.

- AI Recipe Generation
  - Check `profiles.ai_requests_count > 0` before invoking model; decrement atomically using RPC or transaction.
  - Enforce alignment with preferences: exclude allergens/dislikes, prioritize likes when constructing prompt/result.
  - Log user ID, request payload, and response metadata for audit.
  - When AI output includes forbidden ingredients, respond with `422 preference_conflict_detected` without decrementing quota.

- Onboarding Notice
  - `show` when both likes and dislikes lists are empty and `hiddenUntil` is null or expired.
  - Dismissal sets `onboardingNotificationHiddenUntil = now + 2 days`; reuse profile validation.

- Security & Performance
  - Apply input sanitation to thwart SQL injection (`PostgREST` equivalent using parameterized queries via Supabase SDK).
  - Consider pagination caching for `/api/products` via HTTP `Cache-Control` headers (public) while private endpoints use `Cache-Control: no-store`.
