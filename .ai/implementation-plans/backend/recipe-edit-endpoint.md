# API Endpoint Implementation Plan: PUT /api/recipes/{recipeId}

Aktualizacja przepisu nadal używa tego samego modelu danych co tworzenie: składniki przechowywane są jako tekst. Dokument aktualizuje poprzedni plan, usuwając zależność od tabel `recipe_ingredients` i `products`.

## 1. Definicja endpointu

- **Metoda**: `PUT`
- **Ścieżka**: `/api/recipes/{recipeId}`
- **Autoryzacja**: Wymagany Bearer token (middleware dostarcza `locals.supabase` i `locals.user`).
- **Body** (`RecipeUpdateCommand`):

```json
{
  "name": "Zupa krem z dyni",
  "mealType": "dinner",
  "difficulty": "medium",
  "ingredients": "Dynia - 500 g\nBulion warzywny - 500 ml\nImbir - 1 łyżeczka",
  "instructions": "1. Rozgrzej piekarnik...",
  "isAiGenerated": false
}
```

- `isAiGenerated` jest opcjonalne; brak oznacza `false` (wartość poprzednia jest zachowywana, jeśli pole nie zostanie przesłane).

## 2. Walidacja

Użyj tego samego schematu Zod co przy tworzeniu (`recipeCreateSchema`), ale zezwól na częściowe wysyłanie pól, jeśli endpoint ma wspierać `PATCH`. Dla `PUT` wymagamy kompletu danych.

```ts
export const recipeUpdateSchema = recipeCreateSchema.extend({
  isAiGenerated: z.boolean().optional(),
});
```

- Dodatkowo waliduj `recipeId` jako `uuid` (np. `z.string().uuid()`).
- Przytnij spacje na początku/końcu tekstu przed zapisem.

## 3. Przepływ logiki

1. Middleware weryfikuje token → brak użytkownika ⇒ `401`.
2. Handler `PUT` (
   `src/pages/api/recipes/[recipeId].ts`) pobiera `recipeId` z parametrów i JSON payload.
3. Waliduj `recipeId` oraz body;
   - Walidacja nieudana ⇒ `400 invalid_payload` / `422 ingredients_too_long` / `instructions_too_long`.
4. Wywołaj `recipesService.updateRecipe(supabase, userId, recipeId, payload)`.
5. Service:
   - `select` z `recipes` aby upewnić się, że przepis istnieje i należy do użytkownika.
   - `update` rekordu `recipes` z nowymi wartościami.
   - Korzysta z `select().single()` aby zwrócić świeży rekord.
6. Zwróć `200 OK` + `RecipeResponseDto`.

## 4. Serwis `updateRecipe`

```ts
export async function updateRecipe(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  payload: RecipeUpdateCommand
): Promise<RecipeResponseDto> {
  const { data: existing, error: fetchError } = await supabase
    .from('recipes')
    .select('id, user_id, is_ai_generated')
    .eq('id', recipeId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('recipe_not_found');
  }
  if (existing.user_id !== userId) {
    throw new ForbiddenError('recipe_not_found'); // maskuj brak uprawnień jako 404
  }

  const { data, error } = await supabase
    .from('recipes')
    .update({
      name: payload.name.trim(),
      meal_type: payload.mealType,
      difficulty: payload.difficulty,
      ingredients: payload.ingredients.trim(),
      instructions: payload.instructions.trim(),
      is_ai_generated: payload.isAiGenerated ?? existing.is_ai_generated,
    })
    .eq('id', recipeId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);

  return mapRecipeRowToDto(data);
}
```

- `mapSupabaseError` ponownie mapuje przekroczenie limitów na `422`.
- Jeżeli brak zmian (Supabase zwróci `null`), traktuj jako `recipe_not_found`.

## 5. Obsługa błędów (HTTP → kod)

| Status | Kod                        | Powód                                         |
|--------|---------------------------|-----------------------------------------------|
| 400    | `invalid_payload`         | Błąd walidacji schematu / JSON                |
| 401    | `missing_token`           | Brak sesji                                    |
| 404    | `recipe_not_found`        | Nie znaleziono przepisu dla użytkownika       |
| 422    | `ingredients_too_long`    | `ingredients` > 1000 znaków                   |
| 422    | `instructions_too_long`   | `instructions` > 5000 znaków                  |
| 500    | `internal_error`          | Inny błąd Supabase                            |

## 6. Testy

- **Unit**: mapowanie błędów, walidacja (np. długie pola), poprawność maskowania `403 → 404`.
- **Integration**: test endpointu z Supabase lokalnym – przypadek happy path, brak uprawnień, przekroczenie limitu znaków.
- **E2E**: Edycja przepisu w UI, sprawdzenie, że tekstowe składniki są zachowane.

## 7. Dodatkowe rozważania

- Jeśli `PUT` ma nadpisywać całą treść, upewnij się, że frontend wysyła pełny formularz (nie tylko zmienione pola).
- W przyszłości można rozważyć `PATCH`, ale obecnie `PUT` z pełnym payloadem jest prostszy.
- Loguj zmiany (np. `console.info` z `recipeId`, `userId`) w trybie debug dla audytu.

