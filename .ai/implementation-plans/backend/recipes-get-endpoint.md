# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego
- Zapewnia listę przepisów należących do uwierzytelnionego użytkownika wraz z metadanymi paginacji.
- Udostępnia filtrowanie po typie posiłku, trudności, flagach AI, wyszukiwaniu po nazwie/instrukcjach, oraz kontrolę paginacji i sortowania.
- Służy klientowi (frontend Astro/React) jako źródło danych do grupowania przepisów według kontekstu UI.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/recipes`
- **Nagłówki**: `Authorization: Bearer <accessToken>` (wymagany)
- **Parametry zapytania**:
  - `mealType?: "breakfast"|"lunch"|"dinner"|"dessert"|"snack"`
  - `difficulty?: "easy"|"medium"|"hard"`
  - `isAiGenerated?: boolean` (`"true"|"false"` → bool)
  - `search?: string` (trim, max 50 znaków, `ilike` na `name` i `instructions`)
  - `limit?: number` (domyślnie 20, zakres 1–50)
  - `offset?: number` (domyślnie 0, >=0)
  - `sort?: "createdAt.desc"|"createdAt.asc"|"name.asc"` (domyślnie `createdAt.desc`)
- **Walidacja**: Zod schema w route – rzutowanie wartości, domyślne, biała lista sortów, walidacja długości i zakresów; błędne dane → `400 invalid_query_params`.
- **Powiązane typy**: wykorzystać `RecipeListResponseDto`, `RecipeListItemDto`, `PaginationMeta`, oraz nowy wewnętrzny typ filtra w serwisie (np. `RecipeListFilters`).

## 3. Szczegóły odpowiedzi
- **Sukces (200)**: obiekt `RecipeListResponseDto` (`items: RecipeListItemDto[]`, `total`, `limit`, `offset`).
- **Brak wyników**: zwrócić pustą tablicę `items` z poprawnymi metadanymi (200).
- **Nagłówki**: `Content-Type: application/json`.
- **Błędy**:
  - `400 Bad Request` – `invalid_query_params` (zawiera komunikat walidacji).
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `500 Internal Server Error` – `internal_error`.
- **Format błędu**: `{ "error": { "code": string, "message": string } }`, zgodnie z istniejącą konwencją.

## 4. Przepływ danych
- Klient → `GET /api/recipes` z tokenem.
- Astro route (`src/pages/api/recipes/index.ts` lub osobny plik jeśli refaktor) wykonuje:
  1. Pobranie `locals.supabase` i `locals.user` (z middleware autoryzacji).
  2. Walidację query paramów przez Zod, mapowanie na `RecipeListFilters` oraz `PaginationMeta`.
  3. Delegację do `recipesService.listRecipes(supabase, userId, filters)`.
- `recipesService.listRecipes` (rozszerzenie `src/lib/services/recipes.service.ts`):
  1. Buduje zapytanie `supabase.from("recipes")` z `eq("user_id", userId)` oraz filtrami (`eq`, `is`, `ilike` z escapowaniem `%`/`_`).
  2. Ustawia `order` wg mapy sortowania (`created_at`, `name`), `limit`, `range` (`range(offset, offset+limit-1)`).
  3. Korzysta z `select("id, name, meal_type, difficulty, is_ai_generated, created_at, updated_at", { count: "exact" })` dla paginacji.
  4. Zwraca `RecipeListResponseDto` z `total` (wartość `count ?? 0`), `limit`, `offset`.
- Route serializuje wynik do JSON i zwraca `200`.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: wymagany Bearer token; jeśli brak/niepoprawny → `401`.
- Autoryzacja: filtr `user_id = locals.user.id`; poleganie na Supabase RLS jako dodatkowa warstwa.
- Ograniczenie ekspozycji danych: explicit select kolumn w `select` (bez `instructions`).
- Walidacja/normalizacja `search` (trim, usunięcie nadmiarowych wildcardów) by zapobiec pattern injection.
- Biała lista sortów i walidacja typów, aby uniemożliwić arbitralne zapytania do DB.
- Rozważyć rate limiting (future work) dla ochrony przed enumeracją.

## 6. Obsługa błędów
- Mapowanie błędów walidacji Zod → `400 invalid_query_params` z pierwszym komunikatem.
- Brak tokena / nieudane `locals.user` → `401 missing_token`/`invalid_token` (obsługa w middleware; endpoint potwierdza).
- Błędy Supabase (`error` w odpowiedzi) → log `console.error` i `500 internal_error` (bez ujawniania detali).
- Unexpected runtime → fallback `500 internal_error`.
- Logowanie: `console.warn` dla błędów walidacji, `console.error` dla wyjątków serwisowych; kontekst (`userId`, `filters`, `requestId` jeśli dostępny).

## 7. Wydajność
- Limit ≤50 i offset kontrolowany, aby utrzymać niewielkie zakresy.
- Zapytanie wybiera tylko potrzebne kolumny, bez joinów; reliance na indeksy (`user_id`, `created_at`, `name`).
- Pojedyncze zapytanie Supabase z `count: "exact"`; monitorować koszty – w razie potrzeby przełączyć na `estimated`.

## 8. Kroki implementacji
1. Dodaj Zod schema walidującą query parametry w `src/pages/api/recipes/index.ts` (lub przenieś route do dedykowanego pliku GET przy refaktorze), wraz z helperem parsującym do struktur typowanych.
2. Zaimplementuj w `recipes.service.ts` funkcję `listRecipes({ supabase, userId, filters })` zwracającą `RecipeListResponseDto`; uwzględnij mapowanie sortowania, filtrów i obsługę błędów (wyrzucaj `RecipeServiceError` z kodami `invalid_query_params` lub `internal_error`).
3. W endpointzie `GET` pobierz użytkownika z `locals`, przekaż filtry do serwisu i zwróć wynik w odpowiedzi `200`.
4. Rozszerz `RecipeServiceError` o kod `invalid_query_params` (jeśli użyty w serwisie), zaktualizuj mapy kodów/statusów w endpointzie.
5. Na tym etapie jak w przypadku implementacji POST - używamy tylko DEFAULT_USER_ID jako użytkownika i nie martwimy się autentykacją, ponieważ będzie to zaimplementowane na późniejszym etapie.
