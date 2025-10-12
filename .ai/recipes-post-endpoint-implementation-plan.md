# API Endpoint Implementation Plan: POST /api/recipes

## 1. Przegląd punktu końcowego
- Celem jest utworzenie nowego przepisu (manualnego lub zapisanego z draftu AI) przypisanego do zalogowanego użytkownika.
- Punkt końcowy waliduje payload, tworzy wpis w `recipes` wraz z powiązanymi `recipe_ingredients`, a następnie zwraca kompletny obiekt przepisu.
- Implementacja musi respektować Supabase RLS, korzystać z Supabase client dostępnego w `locals` i zachować spójność danych w transakcji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/recipes`
- **Nagłówki**:
  - `Authorization: Bearer <accessToken>` (wymagany)
  - `Content-Type: application/json`
- **Parametry**:
  - **Wymagane w body**:
    - `name` (`string`, 1-100 znaków)
    - `mealType` (`"breakfast"|"lunch"|"dinner"|"dessert"|"snack"`)
    - `difficulty` (`"easy"|"medium"|"hard"`)
    - `instructions` (`string`, 1-5000 znaków)
    - `ingredients` (`array` min 1, max 50) elementów ze strukturą:
      - `productId` (`uuid`)
      - `amount` (`number`, > 0, do 3 miejsc po przecinku jeśli decimal)
      - `unit` (`"gram"|"kilogram"|"milliliter"|"liter"|"teaspoon"|"tablespoon"|"cup"|"piece"`)
  - **Opcjonalne w body**:
    - `isAiGenerated` (`boolean`, domyślnie `false` jeśli pominięte)
- **Walidacja wejścia**:
  - Zod schema w pliku route; wymuszenie długości ciągów, dopuszczalnych enumów, dodatniej wartości `amount` i unikalności `productId` w liście składników.
  - Normalizacja `isAiGenerated` do `false` gdy `undefined`.
  - Odmowa pustych payloadów (`400 invalid_payload`).

## 3. Wykorzystywane typy
- `RecipeCreateCommand` (payload wejściowy) z `src/types.ts`.
- `RecipeResponseDto` (pełna odpowiedź) wraz z `RecipeIngredientDto` i `ProductListItemDto`.
- Ewentualny wewnętrzny typ `ValidatedIngredient` w service do pracy z walidowanymi składnikami.
- Dla odpowiedzi błędów: standard `ErrorResponse` (jeśli istnieje w projekcie) lub utworzenie lokalnej struktury `{ error: { code, message } }` zgodnie z planem API.

## 4. Szczegóły odpowiedzi
- **Sukces**: `201 Created` + `RecipeResponseDto` (pełny obiekt przepisu wraz z listą składników i product snapshotem).
- **Kody błędów**:
  - `400 Bad Request` – `invalid_payload`, `invalid_ingredient_unit`.
  - `401 Unauthorized` – `missing_token`, `invalid_token`.
  - `404 Not Found` – `product_not_found`.
  - `422 Unprocessable Entity` – `ingredient_limit_exceeded`, `instructions_too_long`.
  - `500 Internal Server Error` – `internal_error` dla nieoczekiwanych wyjątków.
- Odpowiedź błędu: `{ "error": { "code": string, "message": string } }`.

## 5. Przepływ danych
- Klient → `POST /api/recipes` z tokenem.
- Astro endpoint:
  1. Pobiera `locals.supabase` oraz `locals.user` (lub userId z tokena).
  2. Waliduje payload przez Zod.
  3. Tworzy `RecipeCreateCommand` i deleguje do `recipesService.createRecipe`.
- `recipesService.createRecipe` (nowy plik `src/lib/services/recipes.service.ts`):
  1. Sprawdza limit składników, duplikaty `productId` i czy jednostka należy do enumu DB.
  2. Weryfikuje istnienie wszystkich `productId` dla danego właściciela (SELECT z `products`).
  3. Otwiera transakcję (przez RPC np. `supabase.rpc("create_recipe_with_ingredients", {...})` lub przy pomocy pg pooled client) wstawiając rekord w `recipes` i powiązane `recipe_ingredients` w jednym kroku.
  4. Zwraca scalony obiekt przepisu, dopełniając relacje `product`.
- Endpoint serializuje wynik do `RecipeResponseDto` i zwraca `201`.
- Logowanie: w przypadku błędów service rzuca kontrolowane wyjątki z kodem, które endpoint mapuje na odpowiednie statusy; dodatkowo zapis logów (np. `console.error` lub dedykowany logger) z korelacją `requestId` jeśli dostępny.

## 6. Względy bezpieczeństwa
- Autoryzacja: wymaga ważnego Bearer tokena; brak → `401 missing_token`, nieprawidłowy → `401 invalid_token`.
- Autentykacja/Autoryzacja w DB: rely na RLS – wszystkie inserty muszą ustawiać `user_id = auth.uid()` (po stronie funkcji SQL lub service).
- Walidacja danych przed dostępem do DB, by ograniczyć wektory injection mimo użycia Supabase.
- Chronić przed masowym tworzeniem: opcjonalny rate limiting (np. middleware).
- Obsługa `isAiGenerated`: tylko `true` zaufane jeśli payload tak wskazuje – brak możliwości nadania innemu użytkownikowi danych.
- Pamiętać o nieujawnianiu detali w komunikatach błędów (np. nie wypisywać nazw tabel).

## 7. Obsługa błędów
- Mapowanie wyjątków w service do kodów HTTP:
  - Walidacja Zod → `400 invalid_payload`.
  - Nieobsługiwane `unit` → `400 invalid_ingredient_unit`.
  - Brak produktu → `404 product_not_found` (walidacja po SELECT).
  - Przekroczony limit składników (>50) → `422 ingredient_limit_exceeded`.
  - `instructions` > 5000 znaków → `422 instructions_too_long` (można wykryć w walidacji lub przez error z DB, mapować na 422).
  - Supabase error (np. RLS, constraint) → mapowanie na 500 z kodem `internal_error` po uprzednim zalogowaniu detali.
- Logowanie błędów: użyć server loggera (np. `locals.logger` jeśli istnieje) lub `console.error` z metadanymi (`userId`, `errorCode`, `payloadSize`).

## 8. Rozważania dotyczące wydajności
- Batch insert składników w jednym wywołaniu RPC zamiast pętli.
- Upewnić się, że SELECT produktów używa indeksu po `id` (domyślne PK).
- Ograniczyć pobierane dane produktów do `id`, `name`.
- Rozważyć caching listy produktów po stronie klienta (poza zakresem endpointu) aby zmniejszyć liczbę odwołań po walidacji.
- Monitorować rozmiar payloadu; walidacja limitu składników i długości instrukcji zapobiega dużym obciążeniom.

## 9. Etapy wdrożenia
1. Utwórz plik `src/lib/services/recipes.service.ts` z funkcją `createRecipe` (interfejs z Supabase client, userId, komendą), typami wyników i mapowaniem błędów.
2. Dodaj SQL funkcję `create_recipe_with_ingredients` (w katalogu migracji) realizującą transakcję INSERT `recipes` + `recipe_ingredients` oraz zwracającą pełny rekord.
3. W Astro route (`src/pages/api/recipes/index.ts` – do utworzenia): zaimportuj Zod schema, `recipesService`, pobierz `locals.supabase` i `locals.user`.
4. Zaimplementuj walidację Zod dla request body; mapuj błędy do `400 invalid_payload`.
5. Wywołaj `createRecipe`, przetwórz wynik do `RecipeResponseDto`, ustaw `201 Created`.
6. Dodaj mapowanie wyjątków service → HTTP status/kody błędów; zapewnij strukturalny logging.
