# API Endpoint Implementation Plan: GET /api/products

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest dostarczenie listy produktów spożywczych dostępnych w katalogu. Umożliwia on klientom wyszukiwanie produktów po nazwie, paginację wyników oraz ich sortowanie. Jest to publicznie dostępny endpoint, niewymagający uwierzytelnienia.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/products`
- **Parametry zapytania (Query Parameters)**:
  - **Opcjonalne**:
    - `search` (string): Ciąg znaków do wyszukiwania w nazwach produktów. Wyszukiwanie jest niewrażliwe na wielkość liter i dopasowuje częściowe wyniki. Maksymalna długość to 50 znaków.
    - `limit` (integer): Maksymalna liczba produktów do zwrócenia w odpowiedzi. Domyślna wartość to 20, maksymalna 50.
    - `offset` (integer): Liczba produktów do pominięcia na początku listy wyników (używane do paginacji). Domyślna wartość to 0.
    - `sort` (enum): Kryterium sortowania. Dostępne wartości: `name.asc` (domyślne) lub `name.desc`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- `ProductListItemDto`: Reprezentuje pojedynczy produkt na liście.
  ```typescript
  export type ProductListItemDto = Pick<ProductRow, "id" | "name">;
  ```
- `ProductListResponseDto`: Reprezentuje pełną strukturę odpowiedzi.
  ```typescript
  export interface ProductListResponseDto {
    items: ProductListItemDto[];
    total: number;
    limit: number;
    offset: number;
  }
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  - **Content-Type**: `application/json`
  - **Struktura body**:
    ```json
    {
      "items": [
        { "id": "uuid", "name": "string" }
      ],
      "total": 142,
      "limit": 20,
      "offset": 0
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Zwracany, gdy parametry zapytania są nieprawidłowe.
    ```json
    {
      "error": "invalid_query_param",
      "details": "..." // Opcjonalne szczegóły błędu walidacji
    }
    ```
  - `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanego błędu serwera.
    ```json
    {
      "error": "internal_server_error"
    }
    ```

## 5. Przepływ danych
1. Klient wysyła żądanie `GET` do `/api/products` z opcjonalnymi parametrami zapytania.
2. Handler endpointu w Astro (`src/pages/api/products/index.ts`) odbiera żądanie.
3. Parametry zapytania są walidowane i parsowane przy użyciu predefiniowanego schematu Zod. W przypadku błędu walidacji, zwracana jest odpowiedź `400`.
4. Wywoływana jest funkcja `listProducts` z serwisu `src/lib/services/products.service.ts`, przekazując jej zwalidowane parametry.
5. Serwis `products.service.ts` buduje dwa zapytania do bazy danych Supabase:
   - Zapytanie `SELECT` z filtrowaniem (`ilike` dla `search`), sortowaniem (`order`) i paginacją (`range`) w celu pobrania odpowiedniej strony produktów.
   - Zapytanie `SELECT count()` z tym samym filtrem `search` w celu uzyskania całkowitej liczby pasujących produktów.
6. Wyniki z bazy danych są mapowane na obiekt `ProductListResponseDto`.
7. Handler endpointu otrzymuje DTO z serwisu i wysyła je jako odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania (`search`, `limit`, `offset`, `sort`) muszą być rygorystycznie walidowane za pomocą Zod, aby zapobiec atakom (np. SQL Injection) i zapewnić spójność danych.
- **Ochrona przed DoS**: `limit` jest ograniczony do maksymalnie 50 wyników, aby zapobiec nadmiernemu obciążeniu bazy danych i serwera.
- **Uwierzytelnianie**: Endpoint jest publiczny i nie wymaga uwierzytelniania.

## 7. Rozważania dotyczące wydajności
- **Indeksowanie bazy danych**: Należy upewnić się, że kolumna `name` w tabeli `products` ma odpowiedni indeks (np. `btree` z `varchar_pattern_ops` lub `trgm`), aby przyspieszyć operacje `ilike` i sortowanie.
- **Optymalizacja zapytań**: Wykonanie dwóch oddzielnych zapytań (jedno dla danych, drugie dla `count`) jest standardową i wydajną praktyką w przypadku paginacji. Należy unikać pobierania wszystkich pasujących rekordów tylko po to, by policzyć ich liczbę w aplikacji.

## 8. Etapy wdrożenia
1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/products.service.ts`.
2.  **Implementacja logiki serwisu**: W `products.service.ts` zaimplementować funkcję `listProducts(params)`. Funkcja ta powinna:
    - Przyjmować obiekt z opcjonalnymi polami `search`, `limit`, `offset`, `sort`.
    - Korzystać z klienta Supabase do interakcji z tabelą `products`.
    - Konstruować i wykonywać zapytanie o dane z użyciem `ilike`, `order` i `range`.
    - Konstruować i wykonywać zapytanie o całkowitą liczbę rekordów (`count`).
    - Zwracać obiekt zgodny z `ProductListResponseDto`.
3.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/products/index.ts`.
4.  **Implementacja handlera endpointu**: W `index.ts` zaimplementować `GET` handler, który:
    - Definiuje schemat Zod do walidacji parametrów `Astro.url.searchParams`.
    - Przeprowadza walidację. W przypadku błędu zwraca `400 Bad Request`.
    - Wywołuje funkcję `listProducts` z serwisu z poprawnymi danymi.
    - Obsługuje ewentualne błędy z serwisu, zwracając `500 Internal Server Error` i logując szczegóły.
    - Zwraca pomyślną odpowiedź `200 OK` w formacie JSON.
5.  **Weryfikacja indeksu DB**: Sprawdzić w definicji schematu Supabase (`supabase/migrations`), czy na kolumnie `products.name` istnieje indeks wspierający szybkie wyszukiwanie tekstowe i sortowanie.
