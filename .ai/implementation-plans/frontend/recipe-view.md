# Plan implementacji widoku: Szczegóły Przepisu (Recipe Details)

## 1. Przegląd
Celem tego widoku jest wyświetlenie wszystkich szczegółowych informacji o konkretnym przepisie. Użytkownik (właściciel przepisu) będzie mógł zobaczyć jego nazwę, składniki, instrukcje przygotowania oraz podjąć akcje takie jak edycja lub usunięcie przepisu. Widok będzie renderowany po stronie serwera (SSR) przez Astro w celu zapewnienia optymalnej wydajności.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką:
- **Ścieżka:** `/recipes/[recipeId]`
- **Plik implementacji:** `src/pages/recipes/[recipeId].astro`

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie następująca, z renderowaniem głównie po stronie serwera i jednym interaktywnym "ostrowem" React dla akcji użytkownika.

```
- Layout.astro
  - `RecipeDetailsPage.astro` (strona główna, fetchowanie danych)
    - Nagłówek przepisu (nazwa, kategoria, trudność)
    - Sekcja "Składniki" (mapowanie `recipe.ingredients`)
    - Sekcja "Instrukcje" (wyświetlanie `recipe.instructions`)
    - `RecipeActions.tsx` (komponent React `client:load`)
      - Przycisk "Edytuj" (nawigacja)
      - Przycisk "Usuń" (otwiera modal)
      - `RecipeDeleteDialog.tsx` (modal potwierdzający usunięcie)
```

## 4. Szczegóły komponentów

### `RecipeDetailsPage.astro`
- **Opis:** Główny plik strony Astro, odpowiedzialny za pobieranie danych o przepisie po stronie serwera przy użyciu `recipeId` z URL. Renderuje statyczną zawartość HTML i przekazuje `recipeId` do komponentu klienckiego `RecipeActions`. Obsługuje również stany błędu, takie jak `404 Not Found`.
- **Główne elementy:** `<h1>` dla nazwy przepisu, `<h2>` dla sekcji, `<ul>` dla składników, `<ol>` dla instrukcji. Wykorzystuje komponenty UI z Shadcn/ui (np. `Badge`) do wyświetlania metadanych.
- **Obsługiwane interakcje:** Brak (renderowanie po stronie serwera).
- **Obsługiwana walidacja:** Sprawdza, czy przepis został znaleziony. W przypadku błędu (np. 404 z serwisu) zwraca odpowiednią stronę błędu Astro.
- **Typy:** `RecipeResponseDto`
- **Propsy:** Brak (jest to strona).

### `RecipeActions.tsx`
- **Opis:** Interaktywny komponent React renderowany na kliencie (`client:load`). Zawiera przyciski "Edytuj" i "Usuń". Zarządza stanem modala potwierdzającego usunięcie oraz wywołuje API w celu usunięcia przepisu.
- **Główne elementy:** Komponent `Button` z Shadcn/ui dla akcji "Edytuj" i "Usuń". Zawiera logikę do otwierania i zamykania `RecipeDeleteDialog`.
- **Obsługiwane interakcje:**
  - Kliknięcie "Edytuj": Nawigacja do `/recipes/[recipeId]/edit`.
  - Kliknięcie "Usuń": Otwarcie modala `RecipeDeleteDialog`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeActionsProps`.
- **Propsy:**
  ```typescript
  interface RecipeActionsProps {
    recipeId: string;
  }
  ```

### `RecipeDeleteDialog.tsx`
- **Opis:** Komponent React wykorzystujący `AlertDialog` z biblioteki Shadcn/ui. Wyświetla ostrzeżenie i prośbę o potwierdzenie usunięcia. Jest kontrolowany przez komponent nadrzędny `RecipeActions`. Wyświetla stan ładowania podczas operacji usuwania.
- **Główne elementy:** `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`.
- **Obsługiwane interakcje:**
  - Kliknięcie "Anuluj": Zamyka modal.
  - Kliknięcie "Potwierdź": Wywołuje funkcję `onConfirm` przekazaną w propsach.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeDeleteDialogProps`.
- **Propsy:**
  ```typescript
  interface RecipeDeleteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    isPending: boolean;
  }
  ```

## 5. Typy
Widok będzie opierał się głównie na istniejącym typie `RecipeResponseDto` z `src/types.ts`. Nie ma potrzeby tworzenia nowych typów DTO ani ViewModeli, ponieważ struktura danych z API jest adekwatna do potrzeb UI.

- **`RecipeResponseDto`**: Główny obiekt danych dla przepisu.
- **`RecipeIngredientDto`**: Obiekt dla pojedynczego składnika na liście.
- **`ProductListItemDto`**: Obiekt dla produktu w ramach składnika.

## 6. Zarządzanie stanem
Zarządzanie stanem będzie ograniczone do komponentu klienckiego `RecipeActions.tsx` i będzie realizowane za pomocą hooków React (`useState`).

- **Stan lokalny w `RecipeActions.tsx`**:
  - `isDialogOpen (boolean)`: Kontroluje widoczność modala potwierdzającego.
- **Stan w customowym hooku `useDeleteRecipe`**:
  - `isPending (boolean)`: Śledzi stan ładowania podczas wywołania API `DELETE`.
  - `error (Error | null)`: Przechowuje ewentualny błąd z API.

Sugerowane jest stworzenie customowego hooka `useDeleteRecipe` w celu enkapsulacji logiki zapytania `DELETE`, obsługi stanu ładowania i błędów. Hook ten będzie używany wewnątrz `RecipeActions.tsx`.

## 7. Integracja API

1.  **Pobieranie danych (Server-Side)**
    - **Endpoint:** Bezpośrednie wywołanie funkcji serwisowej `getRecipe` z `src/lib/services/recipes.service.ts` wewnątrz frontmatter strony `[recipeId].astro`. Pozwala to uniknąć dodatkowego wywołania HTTP.
    - **Metoda:** Wywołanie serwerowe w Astro.
    - **Autoryzacja:** Kontekst użytkownika i instancja `supabase` będą dostępne w `Astro.locals`, co zapewni prawidłowe uwierzytelnienie.
    - **Odpowiedź (sukces):** Obiekt `RecipeResponseDto` zostanie użyty do wyrenderowania strony.
    - **Odpowiedź (błąd `recipe_not_found`):** Strona `[recipeId].astro` zwróci status 404.

2.  **Usuwanie przepisu (Client-Side)**
    - **Endpoint:** `DELETE /api/recipes/[recipeId]`
    - **Metoda:** Wywołanie `fetch` z przeglądarki.
    - **Autoryzacja:** Token JWT użytkownika zostanie automatycznie dołączony do żądania przez mechanizmy Supabase.
    - **Odpowiedź (sukces `204 No Content`):** Użytkownik zostanie przekierowany na stronę główną (`/`) z komunikatem o sukcesie (toast).
    - **Odpowiedź (błąd `4xx/5xx`):** Użytkownikowi zostanie wyświetlony komunikat o błędzie (toast).

## 8. Interakcje użytkownika
- **Nawigacja do widoku:** Użytkownik klika kartę przepisu na liście, co przenosi go na stronę `/recipes/[recipeId]`.
- **Kliknięcie "Edytuj":** Przenosi użytkownika na stronę `/recipes/[recipeId]/edit`.
- **Kliknięcie "Usuń":** Otwiera modal z prośbą o potwierdzenie.
- **Potwierdzenie usunięcia:** Wywołuje żądanie `DELETE`. W trakcie operacji przyciski w modalu są nieaktywne, a na przycisku "Potwierdź" widoczny jest spinner. Po sukcesie następuje przekierowanie. W razie błędu wyświetlany jest toast.

## 9. Warunki i walidacja
- **Dostęp do strony:** Middleware Astro (`src/middleware/index.ts`) zabezpiecza stronę, zapewniając, że jest ona dostępna tylko для zalogowanych użytkowników.
- **Własność przepisu:** Warstwa serwisowa (`recipes.service.ts`) weryfikuje, czy zalogowany użytkownik jest właścicielem przepisu. Jeśli nie, zwraca błąd `recipe_not_found`, co skutkuje wyświetleniem strony 404, aby nie ujawniać istnienia zasobu.

## 10. Obsługa błędów
- **Przepis nie istnieje / brak uprawnień:** Strona Astro, po otrzymaniu błędu z serwisu, renderuje standardową stronę 404.
- **Błąd sieci podczas usuwania:** Hook `useDeleteRecipe` przechwytuje błąd i wyświetla odpowiedni toast (np. "Błąd połączenia. Spróbuj ponownie.").
- **Błąd serwera podczas usuwania:** Hook `useDeleteRecipe` przechwytuje błąd na podstawie statusu odpowiedzi HTTP i wyświetla ogólny komunikat o błędzie (np. "Wystąpił błąd serwera.").

## 11. Kroki implementacji
1.  **Stworzenie pliku strony:** Utworzyć plik `src/pages/recipes/[recipeId].astro`.
2.  **Pobieranie danych:** W sekcji frontmatter pliku `.astro` dodać logikę do pobierania `recipeId` z `Astro.params` i wywołania serwisu `getRecipe` z użyciem `Astro.locals`.
3.  **Obsługa błędu 404:** Dodać blok `try...catch` wokół wywołania serwisu i zwrócić `new Response(null, { status: 404 })` w przypadku błędu `recipe_not_found`.
4.  **Struktura UI (Astro):** Zaimplementować statyczną strukturę widoku w Astro, wyświetlając nazwę, listę składników i instrukcje, używając komponentów z Shadcn/ui i stylów Tailwind.
5.  **Stworzenie komponentu `RecipeActions`:** Utworzyć plik `src/components/views/RecipeDetailsView/RecipeActions.tsx`. Dodać przyciski "Edytuj" i "Usuń".
6.  **Stworzenie komponentu `RecipeDeleteDialog`:** Rozważyć czy można użyć istniejący dialog do usuwania przepisu (`src\components\views\MyRecipesView\RecipeDeleteDialog.tsx`) lub utworzyć plik `src/components/views/RecipeDetailsView/RecipeDeleteDialog.tsx` z implementacją modala `AlertDialog` z Shadcn/ui.
7.  **Zarządzanie stanem modala:** W `RecipeActions.tsx` dodać logikę `useState` do zarządzania widocznością modala.
8.  **Implementacja hooka `useDeleteRecipe`:** Stworzyć hook, który będzie zawierał zapytanie `fetch` typu `DELETE`, zarządzanie stanem ładowania (`isPending`) i obsługę błędów.
9.  **Połączenie logiki:** Zintegrować hook `useDeleteRecipe` z komponentem `RecipeActions`, aby po potwierdzeniu w modalu wywołać funkcję usuwającą.
10. **Finalizacja i stylowanie:** Dopracować wygląd widoku zgodnie z resztą aplikacji, upewniając się, że jest w pełni responsywny.
