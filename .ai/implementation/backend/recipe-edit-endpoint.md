# API Endpoint Implementation Plan: Update Recipe

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan wdrożenia punktu końcowego `PUT /api/recipes/{recipeId}`, który umożliwia zastąpienie istniejącego przepisu nowymi danymi. Operacja obejmuje aktualizację podstawowych właściwości przepisu oraz pełną wymianę listy składników w ramach jednej transakcji atomowej.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PUT`
- **Struktura URL**: `/api/recipes/{recipeId}`
- **Parametry**:
  - **Wymagane**:
    - `recipeId` (w ścieżce): Identyfikator `uuid` przepisu do aktualizacji.
    - `Authorization` (w nagłówku): Token dostępowy w formacie `Bearer <accessToken>`.
  - **Opcjonalne**: Brak
- **Ciało żądania (Request Body)**:
  Obiekt JSON zgodny ze strukturą `RecipeUpdateCommand`.
  ```json
  {
    "name": "string",
    "mealType": "breakfast" | "lunch" | "dinner" | "snack",
    "difficulty": "easy" | "medium" | "hard",
    "instructions": "string",
    "isAiGenerated": "boolean",
    "ingredients": [
      {
        "productId": "uuid",
        "amount": "number",
        "unit": "g" | "ml" | "pcs" | "tsp" | "tbsp"
      }
    ]
  }
  ```

## 3. Wykorzystywane typy
- **Modele wejściowe (Command)**:
  - `RecipeUpdateCommand`
  - `RecipeCommandIngredient`
- **Modele wyjściowe (DTO)**:
  - `RecipeResponseDto`
  - `RecipeIngredientDto`

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`200 OK`)**:
  Zwraca zaktualizowany obiekt przepisu w formacie `RecipeResponseDto`.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane w żądaniu.
  - `401 Unauthorized`: Błąd uwierzytelniania.
  - `404 Not Found`: Nie znaleziono przepisu.
  - `422 Unprocessable Entity`: Przekroczono limit składników.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1. Żądanie `PUT` trafia do serwera Astro.
2. Middleware (`src/middleware/index.ts`) weryfikuje token JWT. Jeśli jest poprawny, dołącza dane użytkownika do `context.locals`. W przeciwnym razie zwraca `401 Unauthorized`.
3. Handler w `src/pages/api/recipes/[recipeId].ts` jest wywoływany.
4. Handler weryfikuje obecność użytkownika w `context.locals`.
5. `recipeId` jest odczytywany z parametrów ścieżki, a ciało żądania jest parsowane.
6. Schemat walidacji Zod jest używany do sprawdzenia poprawności `recipeId` i ciała żądania. W przypadku błędu zwracany jest status `400 Bad Request` lub `422 Unprocessable Entity`.
7. Handler wywołuje funkcję `recipesService.updateRecipe()` przekazując `supabaseClient`, `userId`, `recipeId` oraz zwalidowane dane.
8. Funkcja `updateRecipe` w `src/lib/services/recipes.service.ts` wykonuje transakcję bazodanową:
   a. Weryfikuje, czy przepis o danym `recipeId` istnieje i należy do `userId`. Jeśli nie, zwraca błąd `recipe_not_found`.
   b. Aktualizuje rekord w tabeli `recipes`.
   c. Usuwa wszystkie istniejące rekordy z `recipe_ingredients` dla danego `recipe_id`.
   d. Wstawia nowe rekordy składników do `recipe_ingredients`.
   e. Jeśli jakikolwiek krok się nie powiedzie, transakcja jest wycofywana.
9. Po pomyślnej transakcji, serwis pobiera pełne dane zaktualizowanego przepisu i mapuje je na `RecipeResponseDto`.
10. Handler odbiera wynik z serwisu i zwraca odpowiedź JSON: `200 OK` z danymi przepisu lub odpowiedni kod błędu.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą ważnego tokena JWT, co jest egzekwowane przez middleware.
- **Autoryzacja**: Logika w serwisie musi bezwzględnie sprawdzać, czy `user_id` w tabeli `recipes` pasuje do ID uwierzytelnionego użytkownika. Zapobiega to modyfikacji przepisów przez nieuprawnione osoby.
- **Walidacja danych wejściowych**: Stosowanie `Zod` do walidacji wszystkich danych wejściowych chroni przed błędami przetwarzania i potencjalnymi atakami (np. NoSQL injection, jeśli byłoby to relevantne).
- **Ochrona przed SQL Injection**: Wykorzystanie metod z biblioteki klienckiej Supabase zapewnia parametryzację zapytań i chroni przed atakami SQL Injection.

## 7. Obsługa błędów
| Kod statusu | Kod błędu (w odpowiedzi) | Przyczyna |
|---|---|---|
| `400 Bad Request` | `invalid_payload` | Błąd walidacji Zod dla ciała żądania lub `recipeId`. |
| `401 Unauthorized` | `missing_token` / `invalid_token` | Brak lub nieprawidłowy token JWT. |
| `404 Not Found` | `recipe_not_found` | Przepis nie istnieje lub nie należy do użytkownika. |
| `422 Unprocessable Entity` | `ingredient_limit_exceeded`| Przekroczono maksymalną liczbę składników (np. 50). |
| `500 Internal Server Error`| `internal_server_error`| Niepowodzenie transakcji DB lub inny nieoczekiwany błąd. |

## 8. Rozważania dotyczące wydajności
- **Transakcje**: Zamknięcie operacji na bazach `recipes` i `recipe_ingredients` w jednej transakcji jest kluczowe nie tylko dla integralności danych, ale także dla wydajności, minimalizując liczbę oddzielnych operacji I/O.
- **Indeksowanie**: Należy upewnić się, że kolumny `recipes.user_id` oraz `recipe_ingredients.recipe_id` są zaindeksowane w celu przyspieszenia operacji wyszukiwania i łączenia.

## 9. Etapy wdrożenia
1. **Schemat walidacji**: W pliku `src/lib/schemas/recipe.schema.ts` (jeśli nie istnieje, należy go utworzyć. Zwróć uwagę że istnieje schema `recipeIngredientSchema` w katalogu `RecipeFormView`), zdefiniować schemat Zod dla `RecipeUpdateCommand`. Uwzględnić walidację typów, długości stringów oraz limit na liczbę składników (np. `.array().max(50)`).
2. **Endpoint API**: Utworzyć nowy plik `src/pages/api/recipes/[recipeId].ts`.
3. **Implementacja handlera**: W nowym pliku zaimplementować handler `PUT`. Handler powinien:
   - Sprawdzić uwierzytelnienie użytkownika.
   - Zwalidować `recipeId` i ciało żądania za pomocą schematu Zod.
   - Wywołać odpowiednią funkcję serwisu.
   - Obsłużyć odpowiedzi (sukces i błędy) i zwrócić odpowiedni status HTTP.
4. **Logika serwisu**: W `src/lib/services/recipes.service.ts` dodać nową funkcję `updateRecipe`.
5. **Implementacja transakcji**: Wewnątrz `updateRecipe` zaimplementować logikę transakcyjną. Ze względu na ograniczenia klienta Supabase.js, najlepszym podejściem do zapewnienia atomowości jest stworzenie i wywołanie funkcji PostgreSQL za pomocą `supabase.rpc()`. Funkcja ta powinna przyjmować wszystkie dane i wykonywać operacje `UPDATE`, `DELETE` i `INSERT` w jednej transakcji.
6. **Mapowanie DTO**: Po pomyślnym wykonaniu transakcji, pobrać zaktualizowane dane i zmapować je na `RecipeResponseDto`.
7. **Testowanie**: Przygotować i przeprowadzić testy manualne lub automatyczne (jeśli dotyczy) dla wszystkich scenariuszy, w tym ścieżki sukcesu i przypadków błędów.
