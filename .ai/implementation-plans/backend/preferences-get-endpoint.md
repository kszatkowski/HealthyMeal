# API Endpoint Implementation Plan: GET & PATCH /api/profile (Preference Notes)

This plan supersedes the legacy `GET /api/preferences` endpoint. Preference data now lives directly on the `profiles` table as two free-text fields (`disliked_ingredients_note`, `allergens_note`). Both operations are handled through `/api/profile`.

## 1. Endpoint Definition

- **Methods**: `GET`, `PATCH`
- **URL**: `/api/profile`
- **Authentication**: Required. Bearer token processed by middleware and exposed via `Astro.locals.user` and `Astro.locals.supabase`.
- **Responsibility**:
  - `GET`: Return profile metadata together with preference notes and quota counters.
  - `PATCH`: Allow updating preference notes (≤200 chars each) and the onboarding dismissal timestamp.

## 2. Request & Response Schemas

```ts
// src/types.ts (or dedicated DTO module)
export type ProfileResponseDto = {
  id: string;
  aiRequestsCount: number;
  dislikedIngredientsNote: string | null;
  allergensNote: string | null;
  onboardingNotificationHiddenUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfilePayload = {
  dislikedIngredientsNote?: string | null;
  allergensNote?: string | null;
  onboardingNotificationHiddenUntil?: string | null;
};
```

- Both notes are optional; an empty string should be normalised to `null`.
- Timestamps must be ISO 8601 strings or `null`.

## 3. Validation with Zod

Create/extend `src/lib/schemas/profile.schema.ts`:

```ts
import { z } from 'zod';

const preferenceNoteSchema = z
  .string()
  .max(200, 'Notatka może mieć maksymalnie 200 znaków')
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

export const updateProfileSchema = z
  .object({
    dislikedIngredientsNote: preferenceNoteSchema.nullable().optional(),
    allergensNote: preferenceNoteSchema.nullable().optional(),
    onboardingNotificationHiddenUntil: z
      .string()
      .datetime({ offset: true })
      .or(z.null())
      .optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Payload must include at least one field to update.',
  });
```

Helper utilities:

- Normalise incoming payload (`null`, empty string, whitespace → `null`).
- Guard against timestamps in the past before persisting dismissal data.

## 4. Service Layer

Extend `src/lib/services/profile.service.ts` (create if missing):

```ts
export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id,
       ai_requests_count,
       disliked_ingredients_note,
       allergens_note,
       onboarding_notification_hidden_until,
       created_at,
       updated_at`
    )
    .eq('id', userId)
    .single();

  if (error) throw mapSupabaseError(error);
  if (!data) throw new NotFoundError('profile_not_found');

  return mapProfileRowToDto(data);
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: UpdateProfilePayload
) {
  const normalized = normalisePreferenceNotes(payload);
  const { data, error } = await supabase
    .from('profiles')
    .update(normalized)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  if (!data) throw new NotFoundError('profile_not_found');

  return mapProfileRowToDto(data);
}
```

Implementation notes:

- `normalisePreferenceNotes` removes keys whose value is `undefined` and converts empty strings to `null`.
- `mapSupabaseError` should translate Postgres constraint failures into API error codes (`preference_note_too_long`, `timestamp_in_past`).

## 5. Endpoint Flow (`src/pages/api/profile/index.ts`)

1. `export const prerender = false;`
2. Retrieve `locals.user` and `locals.supabase`; return `401` if either missing.
3. For `GET`:
   - Call `getProfile` service.
   - Return JSON serialised `ProfileResponseDto`.
4. For `PATCH`:
   - Parse JSON body; validate with `updateProfileSchema`.
   - Perform additional guard: if `onboardingNotificationHiddenUntil` < `now()`, return `409 timestamp_in_past`.
   - Call `updateProfile` service and return updated DTO.
5. Catch validation errors → `400 invalid_payload` (include `preference_note_too_long`, `invalid_timestamp`).
6. Catch service errors and map to appropriate status codes (401/404/409/500).

## 6. Error Codes

| HTTP Status | Code                         | Description                                          |
|-------------|-----------------------------|------------------------------------------------------|
| 400         | `invalid_payload`           | JSON parse failure / unknown fields                  |
| 400         | `preference_note_too_long`  | Any note > 200 characters                            |
| 400         | `invalid_timestamp`         | Timestamp fails ISO parsing                          |
| 409         | `timestamp_in_past`         | Dismissal timestamp older than current UTC time      |
| 401         | `missing_token` / `invalid_token` | Authentication failure                           |
| 404         | `profile_not_found`         | Row missing (should be rare)                         |
| 500         | `internal_error`            | Unhandled Supabase/Postgres errors                   |

## 7. Derived Business Logic

- Onboarding alert uses `dislikedIngredientsNote` and `allergensNote`: show reminder when both are `null`/empty and dismissal timestamp is `null` or expired.
- AI generator splits notes on commas/semicolons to exclude keywords; backend should simply provide raw text to downstream services.
- Frontend should surface a 200-character counter for each textarea to match backend validation.

## 8. Implementation Checklist

1. **Database**: add `disliked_ingredients_note` and `allergens_note` (`varchar(200)`) columns to `profiles` (see DB plan).
2. **Schema**: update/create `profile.schema.ts` with validation above.
3. **Service**: implement `getProfile`, `updateProfile`, utilities for normalization and error mapping.
4. **Endpoint**: refactor `/api/profile` route to use the service and new schema; remove `/api/preferences` route.
5. **Client**: update hooks/components to call `/api/profile` for preference data.
6. **Tests**: add unit/integration tests covering validation, trimming, timestamp guards, and onboarding logic.
7. **Docs**: ensure PRD, API docs, and onboarding specifications reference the new text-field behaviour.
8. **Cleanup**: delete obsolete `preferences` service/schema files after migration.

