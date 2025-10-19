# API Endpoint Implementation Plan: DELETE /api/recipes/{recipeId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom trwałe usunięcie jednego ze swoich przepisów. Usunięcie przepisu powoduje również kaskadowe usunięcie wszystkich powiązanych z nim składników z tabeli `recipe_ingredients` dzięki zdefiniowanym więzom integralności w bazie danych. Operacja jest nieodwracalna.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/recipes/{recipeId}`
- **Parametry**:
  - **Wymagane**:
    - `recipeId` (w ścieżce): Unikalny identyfikator (UUID) przepisu, który ma zostać usunięty.
  - **Nagłówki**:
    - `Authorization`: `Bearer <accessToken>` - token JWT uwierzytelniający użytkownika.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **Command Model**: `RecipeDeleteCommand`
  ```typescript
  export interface RecipeDeleteCommand {
    recipeId: RecipeRow["id"];
  }
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Treść**: Brak.
- **Odpowiedzi błędów**:
  - **Kod stanu**: `400 Bad Request` - w przypadku nieprawidłowego formatu `recipeId`.
  - **Kod stanu**: `401 Unauthorized` - w przypadku braku lub nieprawidłowego tokenu JWT.
  - **Kod stanu**: `404 Not Found` - jeśli przepis o podanym ID nie istnieje lub nie należy do użytkownika.
  - **Kod stanu**: `500 Internal Server Error` - w przypadku wewnętrznych błędów serwera.

## 5. Przepływ danych
1.  Użytkownik wysyła żądanie `DELETE` na adres `/api/recipes/{recipeId}` z ważnym tokenem JWT w nagłówku `Authorization`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT i dołącza sesję użytkownika do `Astro.locals`. Jeśli token jest nieprawidłowy, zwraca `401 Unauthorized`.
3.  Handler punktu końcowego w `src/pages/api/recipes/[recipeId].ts` odbiera żądanie.
4.  Handler waliduje parametr `recipeId` z URL przy użyciu Zod, aby upewnić się, że jest to prawidłowy UUID. W przypadku błędu zwraca `400 Bad Request`.
5.  Handler wywołuje funkcję `deleteRecipe` z serwisu `recipes.service.ts`, przekazując `recipeId` oraz `userId` pobrane z `Astro.locals.user.id`.
6.  Funkcja `deleteRecipe` w serwisie konstruuje i wykonuje zapytanie do Supabase, aby usunąć przepis z tabeli `recipes`, używając klauzuli `WHERE` do dopasowania zarówno `id`, jak i `user_id`.
7.  Baza danych PostgreSQL, dzięki klauzuli `ON DELETE CASCADE` w tabeli `recipe_ingredients`, automatycznie usuwa wszystkie składniki powiązane z usuwanym przepisem.
8.  Serwis sprawdza wynik operacji. Jeśli żaden wiersz nie został usunięty (co oznacza, że przepis nie istnieje lub nie należy do użytkownika), zwraca błąd `recipe_not_found`.
9.  Handler punktu końcowego na podstawie wyniku z serwisu zwraca odpowiedni kod statusu: `204 No Content` w przypadku sukcesu lub odpowiedni kod błędu (`404` lub `500`).

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą ważnego tokenu JWT, co jest weryfikowane przez middleware.
- **Autoryzacja**: Logika biznesowa w serwisie musi bezwzględnie weryfikować, czy `user_id` powiązany z przepisem jest identyczny z `id` uwierzytelnionego użytkownika. Zapobiega to możliwości usunięcia zasobów przez nieuprawnionych użytkowników (IDOR).
- **Walidacja danych wejściowych**: Parametr `recipeId` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności
- Operacja `DELETE` jest wysoce wydajna, ponieważ opiera się na kluczu głównym (`id`) tabeli `recipes`.
- Klauzula `ON DELETE CASCADE` jest zoptymalizowana na poziomie bazy danych i nie powinna stanowić wąskiego gardła przy usuwaniu powiązanych składników.
- Należy upewnić się, że kolumny `id` oraz `user_id` w tabeli `recipes` są poprawnie zindeksowane, aby przyspieszyć wyszukiwanie.

## 8. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stworzyć nowy plik `src/pages/api/recipes/[recipeId].ts`.
2.  **Implementacja handlera `DELETE`**: W nowo utworzonym pliku zaimplementować `export const DELETE: APIRoute = async ({ params, locals }) => { ... }`.
3.  **Walidacja `recipeId`**: Wewnątrz handlera dodać walidację `params.recipeId` za pomocą schemy Zod dla UUID.
4.  **Aktualizacja serwisu**: W pliku `src/lib/services/recipes.service.ts` dodać nową asynchroniczną funkcję `deleteRecipe({ recipeId, userId }: { recipeId: string; userId: string; })`.
5.  **Implementacja logiki usuwania**: W `deleteRecipe` zaimplementować logikę usuwania przepisu z Supabase, filtrując po `id` i `user_id`. Należy sprawdzić `error` oraz `count` w odpowiedzi od Supabase, aby obsłużyć przypadki błędów oraz scenariusz, w którym przepis nie został znaleziony.
6.  **Integracja handlera z serwisem**: W handlerze `DELETE` wywołać nową funkcję z serwisu i przekazać jej wymagane parametry.
7.  **Obsługa odpowiedzi**: Zaimplementować zwracanie kodów statusu `204`, `404`, `400` i `500` w zależności od wyniku operacji w serwisie.
8.  **Testowanie (manualne/automatyczne)**: Zweryfikować poprawność działania endpointu, w tym scenariusze sukcesu, braku autoryzacji, próby usunięcia cudzego przepisu oraz nieistniejącego przepisu.
