# API Endpoint Implementation Plan: POST /api/recipes (tekstowe składniki)

Z uwagi na usunięcie predefiniowanej bazy produktów, endpoint tworzący przepis przyjmuje teraz listę składników jako zwykły tekst (maks. 1000 znaków). Dokument opisuje aktualny plan implementacji.

## 1. Cel endpointu

- Utworzenie przepisu przypisanego do zalogowanego użytkownika.
- Obsługa zarówno przepisów manualnych, jak i zapisów draftów AI (`isAiGenerated`).
- Walidacja danych wejściowych, kontrola limitów znaków oraz spójny format odpowiedzi.

## 2. Definicja endpointu

- **Metoda**: `POST`
- **Ścieżka**: `/api/recipes`
- **Nagłówki**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body** (`RecipeCreateCommand`):

```json
{
  "name": "Spicy Chickpeas",
  "mealType": "lunch",
  "difficulty": "easy",
  "ingredients": "Ciecierzyca - 200 g\nPapryka - 1 szt\nCzosnek - 2 ząbki",
  "instructions": "1. Rozgrzej patelnię...",
  "isAiGenerated": false
}
```

- **Odpowiedź** (`201 Created`): pełny obiekt przepisu (`RecipeResponseDto`) z polami: `id`, `userId`, `name`, `ingredients`, `instructions`, `mealType`, `difficulty`, `isAiGenerated`, `createdAt`, `updatedAt`.

## 3. Schemat walidacji (Zod)

`src/lib/schemas/recipes.schema.ts`:

```ts
export const recipeCreateSchema = z.object({
  name: z.string().min(1).max(50),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'snack']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z
    .string()
    .min(1, 'Lista składników jest wymagana')
    .max(1000, 'Lista składników może mieć maksymalnie 1000 znaków'),
  instructions: z
    .string()
    .min(1, 'Instrukcje są wymagane')
    .max(5000, 'Instrukcje mogą mieć maksymalnie 5000 znaków'),
  isAiGenerated: z.boolean().optional().default(false),
});
```

- Przed zapisaniem można wykonać normalizację: przycięcie białych znaków na końcach, usunięcie pustych wierszy.

## 4. Przepływ

1. Middleware uwierzytelnia użytkownika, udostępnia `locals.supabase` i `locals.user`.
2. Endpoint `POST` parsuje JSON i waliduje go schematem Zod.
3. Tworzony jest obiekt `RecipeCreateCommand`:
   - `name`, `mealType`, `difficulty`, `instructions`, `ingredients`, `isAiGenerated`.
   - `userId` pobierany z `locals.user.id`.
4. Wywołana zostaje funkcja serwisowa `createRecipe` w `src/lib/services/recipes.service.ts`:
   - `insert` do tabeli `recipes` z polami tekstowymi.
   - Zwrócony rekord mapowany jest na `RecipeResponseDto` (np. z aliasami kolumn `created_at → createdAt`).
5. Endpoint zwraca `201 Created` + JSON.

## 5. Obsługa błędów

- **401 `missing_token` / `invalid_token`** – middleware nie znalazł ważnej sesji.
- **400 `invalid_payload`** – błąd parsowania lub niezgodny z Zod.
- **422 `ingredients_too_long` / `instructions_too_long`** – gdy przekroczono limit (wykryte w walidacji lub odpowiedzi Supabase).
- **500 `internal_error`** – nieoczekiwany błąd Supabase/Postgresa (loguj z `requestId`, `userId`).

## 6. Serwis `recipes.service.ts`

```ts
export async function createRecipe(
  supabase: SupabaseClient,
  userId: string,
  payload: RecipeCreateCommand
): Promise<RecipeResponseDto> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name: payload.name.trim(),
      meal_type: payload.mealType,
      difficulty: payload.difficulty,
      ingredients: payload.ingredients.trim(),
      instructions: payload.instructions.trim(),
      is_ai_generated: payload.isAiGenerated ?? false,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);

  return mapRecipeRowToDto(data);
}
```

- `mapSupabaseError` tłumaczy błędy długości na kody `ingredients_too_long`/`instructions_too_long`.
- `mapRecipeRowToDto` konwertuje snake_case na camelCase.

## 7. Testy

- **Unit (Vitest)**: walidacja schematu Zod, mapowanie serwisu (mock Supabase).
- **Integration**: test endpointu z Supabase testowym – przypadki happy path, 401, 400, 422.
- **E2E**: Playwright – wypełnienie formularza na `/recipes/new`, zapis, weryfikacja na liście.

## 8. Checklista wdrożeniowa

1. Zaimplementuj/aktualizuj schemat Zod i typy (`RecipeCreateCommand`, `RecipeResponseDto`).
2. Uzupełnij serwis `createRecipe` o tekstowe składniki.
3. Zrefaktoruj endpoint `src/pages/api/recipes/index.ts` (`POST`).
4. Usuń odniesienia do `recipe_ingredients`, `product_id` z kodu i migracji.
5. Zaktualizuj testy jednostkowe i integracyjne.
6. Uruchom testy (`npm run test`, `npm run e2e`).
7. Zaktualizuj dokumentację (ten plik, API plan, README). 

