# API Endpoint Implementation Plan: GET /api/preferences

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za pobieranie listy preferencji żywieniowych (`like`, `dislike`, `allergen`) dla uwierzytelnionego użytkownika. Umożliwia opcjonalne filtrowanie wyników na podstawie typu preferencji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/preferences`
- **Nagłówki**:
  - Wymagane: `Authorization: Bearer <accessToken>`
- **Parametry zapytania (Query Parameters)**:
  - Opcjonalne:
    - `type`: `string` - Filtruje preferencje według typu. Dozwolone wartości: `like`, `dislike`, `allergen`.
- **Request Body**: Brak

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego wykorzystane zostaną następujące, już istniejące, typy DTO z `src/types.ts`:
- `PreferenceListItemDto`: Definiuje strukturę pojedynczego obiektu preferencji w odpowiedzi.
- `PreferenceListResponseDto`: Definiuje strukturę głównego obiektu odpowiedzi, zawierającego listę preferencji.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi sukcesu (200 OK)**:
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
- **Kody statusu**:
  - `200 OK`: Pomyślnie zwrócono listę preferencji.
  - `400 Bad Request`: Nieprawidłowa wartość parametru `type`.
  - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` do `/api/preferences` z tokenem JWT w nagłówku `Authorization`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT i jeśli jest ważny, dołącza informacje o użytkowniku do `Astro.locals.user`.
3.  Handler API (`src/pages/api/preferences/index.ts`) jest wywoływany.
4.  Handler sprawdza, czy `Astro.locals.user` istnieje. Jeśli nie, zwraca błąd `401 Unauthorized`.
5.  Handler parsuje i waliduje opcjonalny parametr `type` z URL przy użyciu schematu Zod. W przypadku błędu walidacji zwraca `400 Bad Request`.
6.  Handler wywołuje funkcję `listUserPreferences` z nowo utworzonego serwisu `preferences.service.ts`, przekazując `userId` z `Astro.locals.user` oraz zwalidowany `type`.
7.  Funkcja `listUserPreferences` wykonuje zapytanie do bazy danych Supabase do tabeli `user_preferences`.
    - Zapytanie filtruje rekordy na podstawie `user_id`.
    - Jeśli parametr `type` został podany, zapytanie dodatkowo filtruje po `preference_type`.
    - Zapytanie wykonuje `JOIN` z tabelą `products`, aby pobrać nazwę produktu.
8.  Serwis mapuje wyniki z bazy danych na strukturę `PreferenceListItemDto`.
9.  Handler API otrzymuje dane z serwisu i opakowuje je w obiekt `PreferenceListResponseDto`.
10. Handler zwraca odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony do uwierzytelnionych użytkowników. Middleware jest odpowiedzialne za weryfikację tokenu.
- **Autoryzacja**: Logika serwisu musi bezwzględnie używać `user_id` z sesji zalogowanego użytkownika we wszystkich zapytaniach do bazy danych, aby zapobiec dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Parametr `type` musi być walidowany przy użyciu Zod, aby upewnić się, że jest to jedna z oczekiwanych wartości. Zapobiega to błędom i potencjalnym atakom.

## 7. Obsługa błędów
- **Brak użytkownika (401)**: Jeśli `Astro.locals.user` jest `null` lub `undefined` po przejściu przez middleware, handler powinien zwrócić odpowiedź `401 Unauthorized`.
- **Błąd walidacji (400)**: Jeśli walidacja Zod dla parametru `type` zakończy się niepowodzeniem, handler zwróci `400 Bad Request` z informacją o błędzie.
- **Błąd serwera (500)**: Wszelkie nieoczekiwane błędy, takie jak problemy z połączeniem z bazą danych, będą przechwytywane w bloku `try...catch`, logowane na serwerze i zwracany będzie ogólny błąd `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Należy upewnić się, że kolumny `user_id` i `preference_type` w tabeli `user_preferences` są odpowiednio zindeksowane, aby zapewnić wysoką wydajność zapytań, zwłaszcza przy dużej ilości danych.

## 9. Etapy wdrożenia
1.  **Utworzenie schematu walidacji**:
    - Utwórz nowy plik `src/lib/schemas/preferences.schema.ts`.
    - Zdefiniuj w nim schemat Zod do walidacji parametrów zapytania (`type`).
2.  **Utworzenie serwisu**:
    - Utwórz nowy plik `src/lib/services/preferences.service.ts`.
    - Zaimplementuj funkcję `listUserPreferences(supabase: SupabaseClient, userId: string, type?: string)`, która będzie zawierała logikę zapytania do bazy danych Supabase.
    - Funkcja powinna zwracać `Promise<PreferenceListItemDto[]>`.
3.  **Implementacja punktu końcowego API**:
    - Utwórz nowy plik `src/pages/api/preferences/index.ts`.
    - Zaimplementuj handler `GET`, który będzie obsługiwał żądania.
    - W handlerze:
        - Pobierz klienta Supabase i sesję użytkownika z `Astro.locals`.
        - Przeprowadź walidację parametrów zapytania za pomocą utworzonego schematu Zod.
        - Wywołaj funkcję `listUserPreferences` z serwisu.
        - Zbuduj i zwróć odpowiedź `PreferenceListResponseDto` w formacie JSON.
        - Zaimplementuj obsługę błędów `try...catch`.
4.  **Ustawienia Astro**:
    - Upewnij się, że w pliku `src/pages/api/preferences/index.ts` znajduje się `export const prerender = false;`, aby wymusić renderowanie dynamiczne.
