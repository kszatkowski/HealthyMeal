# Plan implementacji widoku: Moje Przepisy (My Recipes)

## 1. Przegląd
Widok "Moje Przepisy" jest głównym interfejsem dla zalogowanego użytkownika, dostępnym pod głównym adresem URL aplikacji (`/`). Jego celem jest umożliwienie użytkownikom przeglądania, filtrowania i zarządzania swoją kolekcją przepisów. Widok ten integruje kluczowe funkcjonalności, takie jak filtrowanie według typu posiłku, paginacja, dodawanie nowych przepisów oraz generowanie ich za pomocą AI. Dodatkowo, zawiera mechanizm onboardingu dla nowych użytkowników.

## 2. Routing widoku
- **Ścieżka:** `/`
- **Dostęp:** Widok jest dostępny wyłącznie dla uwierzytelnionych użytkowników. Ochrona trasy będzie realizowana za pomocą middleware w Astro, które przekieruje niezalogowanych użytkowników na stronę logowania.

## 3. Struktura komponentów
Hierarchia komponentów React, które zostaną osadzone na stronie Astro (`src/pages/index.astro`) przy użyciu dyrektywy `client:load`.

```
- MyRecipesView (Komponent kontenerowy)
  - OnboardingAlert (Komponent warunkowy)
  - RecipesToolbar
    - Button (Shadcn/ui) - "Dodaj nowy przepis"
    - Button (Shadcn/ui) - "Generuj przepis AI"
  - MealTypeTabs
    - Tabs (Shadcn/ui)
  - RecipesList
    - Spinner (stan ładowania)
    - EmptyState (brak wyników)
    - RecipeCard[] (lista kart przepisów)
      - Card (Shadcn/ui)
      - DropdownMenu (Shadcn/ui) dla akcji (np. usuń)
  - Pagination
    - Pagination (Shadcn/ui)
```

## 4. Szczegóły komponentów

### MyRecipesView
- **Opis:** Główny komponent-kontener, który zarządza stanem całego widoku, w tym filtrami, paginacją oraz danymi przepisów. Odpowiada za komunikację z API i przekazuje dane oraz handlery do komponentów podrzędnych.
- **Główne elementy:** `div` opakowujący wszystkie komponenty widoku.
- **Obsługiwane interakcje:** Orkiestruje zmiany filtrów, paginacji i akcje usuwania przepisów.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeFiltersViewModel`, `RecipeListResponseDto`.
- **Propsy:** Brak.

### OnboardingAlert
- **Opis:** Komponent oparty na `Alert` z Shadcn/ui. Wyświetla powiadomienie zachęcające użytkownika do uzupełnienia preferencji żywieniowych. Jest widoczny tylko wtedy, gdy warunki (pobrane z API) są spełnione.
- **Główne elementy:** `Alert`, `AlertTitle`, `AlertDescription`, `Button`.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Uzupełnij profil" (nawigacja) lub "Przypomnij później" (wysłanie żądania do API w celu ukrycia powiadomienia).
- **Obsługiwana walidacja:** Brak.
- **Logika wyświetlania:** Alert jest widoczny, gdy `dislikedIngredientsNote` i `allergensNote` z `/api/profile` są puste (po trimie) oraz `onboardingNotificationHiddenUntil` jest `null` lub wcześniejsze niż `now()`.
- **Typy:** Brak.
- **Propsy:**
  ```typescript
  interface OnboardingAlertProps {
    show: boolean;
    onDismiss: () => Promise<void>;
  }
  ```

### RecipesToolbar
- **Opis:** Pasek narzędzi z głównymi przyciskami akcji, które umożliwiają nawigację do formularza dodawania nowego przepisu oraz do generatora AI.
- **Główne elementy:** `div` zawierający dwa komponenty `Button` (Shadcn/ui) opakowane w tagi `<a>` w celu nawigacji.
- **Obsługiwane interakcje:** Kliknięcie przycisków nawigacyjnych.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### MealTypeTabs
- **Opis:** Komponent `Tabs` z Shadcn/ui, który pozwala na filtrowanie listy przepisów według typu posiłku (`mealType`). Zawiera opcję "Wszystkie", która czyści ten filtr.
- **Główne elementy:** `Tabs`, `TabsList`, `TabsTrigger`.
- **Obsługiwane interakcje:** Zmiana aktywnej zakładki.
- **Obsługiwana walidacja:** Wartość aktywnej zakładki musi odpowiadać jednemu z typów posiłków lub wartości specjalnej "all".
- **Typy:** `RecipeRow["meal_type"]`.
- **Propsy:**
  ```typescript
  interface MealTypeTabsProps {
    currentValue: RecipeRow["meal_type"] | "all";
    onValueChange: (value: RecipeRow["meal_type"] | "all") => void;
  }
  ```

### RecipesList
- **Opis:** Wyświetla siatkę przepisów (`RecipeCard`), stan ładowania (`Spinner`) lub informację o braku wyników (`EmptyState`).
- **Główne elementy:** Warunkowo renderowany `Spinner`, `EmptyState` lub `div` z siatką (`grid`) komponentów `RecipeCard`.
- **Obsługiwane interakcje:** Przekazuje zdarzenie usunięcia przepisu od `RecipeCard` do `MyRecipesView`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeListItemDto`.
- **Propsy:**
  ```typescript
  interface RecipesListProps {
    recipes: RecipeListItemDto[];
    isLoading: boolean;
    onDelete: (recipeId: string) => void;
  }
  ```

### RecipeCard
- **Opis:** Karta prezentująca pojedynczy przepis. Zawiera jego nazwę, typ, poziom trudności i wskaźnik, czy został wygenerowany przez AI. Cała karta jest linkiem do szczegółów przepisu. Zawiera również menu z akcją "Usuń".
- **Główne elementy:** `Card` (Shadcn/ui) opakowany w `<a>`, `CardHeader`, `CardTitle`, `CardContent`, `Badge` oraz `DropdownMenu` na akcje.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Usuń" w menu.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeListItemDto`.
- **Propsy:**
  ```typescript
  interface RecipeCardProps {
    recipe: RecipeListItemDto;
    onDelete: (recipeId: string) => void;
  }
  ```

### Pagination
- **Opis:** Komponent `Pagination` z Shadcn/ui do nawigacji między stronami listy przepisów.
- **Główne elementy:** `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`.
- **Obsługiwane interakcje:** Kliknięcie przycisków "Poprzednia" i "Następna".
- **Obsługiwana walidacja:** Przyciski nawigacyjne są wyłączone (`disabled`), gdy użytkownik jest na pierwszej lub ostatniej stronie.
- **Typy:** `PaginationMeta`.
- **Propsy:**
  ```typescript
  interface PaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
  }
  ```

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO z `src/types.ts` oraz jeden nowy typ ViewModel do zarządzania stanem filtrów.

- **`RecipeListItemDto`**: Reprezentuje pojedynczy przepis na liście.
- **`RecipeListResponseDto`**: Reprezentuje pełną odpowiedź z API, zawierającą listę przepisów i metadane paginacji.
- **`PaginationMeta`**: Obiekt z informacjami o paginacji (`total`, `limit`, `offset`).

- **`RecipeFiltersViewModel` (Nowy typ):**
  Obiekt przechowujący aktualny stan filtrów i paginacji w interfejsie użytkownika.
  ```typescript
  // src/components/views/MyRecipesView/MyRecipesView.types.ts
  import type { RecipeRow } from "../../../db/database.types";

  export interface RecipeFiltersViewModel {
    mealType?: RecipeRow["meal_type"];
    search?: string;
    difficulty?: RecipeRow["difficulty"];
    isAiGenerated?: boolean;
    sort: 'createdAt.desc' | 'createdAt.asc' | 'name.asc';
    page: number; // 1-based index
    limit: number;
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w niestandardowym hooku `useRecipes`, co zapewni czystą separację logiki od prezentacji w komponencie `MyRecipesView`.

- **Hook `useRecipes()`:**
  - **Cel:** Abstrakcja logiki pobierania danych, filtrowania, paginacji i usuwania przepisów.
  - **Zarządzany stan:**
    - `recipes: RecipeListItemDto[]`
    - `pagination: PaginationMeta`
    - `filters: RecipeFiltersViewModel`
    - `isLoading: boolean`
    - `error: Error | null`
  - **Zwracane funkcje i wartości:**
    - `recipes`, `pagination`, `isLoading`, `error`
    - `updateFilters(newFilters: Partial<RecipeFiltersViewModel>)`: Aktualizuje filtry i automatycznie ponownie pobiera dane.
    - `deleteRecipe(recipeId: string)`: Obsługuje usuwanie przepisu z optymistycznym UI.

## 7. Integracja API
Komponent `MyRecipesView` będzie komunikował się z API za pośrednictwem hooka `useRecipes`.

- **`GET /api/recipes`**
  - **Wywołanie:** Przy pierwszym renderowaniu komponentu oraz przy każdej zmianie w `filters` (zmiana zakładki, strony paginacji itp.).
  - **Typy żądania (Query Params):** Parametry zapytania będą budowane na podstawie obiektu `RecipeFiltersViewModel`. Wartość `page` zostanie przeliczona na `offset` (`offset = (page - 1) * limit`).
  - **Typy odpowiedzi:** `RecipeListResponseDto`.
- **`GET /api/profile`**
  - **Wywołanie:** Równolegle z pierwszym pobraniem listy przepisów, aby uzyskać notatki preferencji i stan ukrycia onboardingu.
  - **Typy odpowiedzi:** `ProfileResponseDto` (jak w planie API).
  - **Obsługa:** Hook `useRecipes` może zwracać dodatkową flagę `showOnboarding`, lub można utworzyć dedykowany hook `useOnboardingNotice` korzystający z tego samego endpointu.

- **`DELETE /api/recipes/{recipeId}`** (Przyjęte założenie co do ścieżki)
  - **Wywołanie:** Po potwierdzeniu przez użytkownika w oknie dialogowym.
  - **Typy żądania:** `recipeId` jako parametr ścieżki.
  - **Typy odpowiedzi:** Oczekiwany status `204 No Content` lub podobny. Odpowiedź będzie obsługiwana w celu potwierdzenia sukcesu lub wycofania zmiany w przypadku błędu.

## 8. Interakcje użytkownika
- **Filtrowanie:** Użytkownik klika na zakładkę w `MealTypeTabs`. Wywołuje to `updateFilters` z nowym `mealType`, co powoduje ponowne pobranie i wyrenderowanie listy.
- **Paginacja:** Użytkownik klika "Następna" lub "Poprzednia" w komponencie `Pagination`. Wywołuje to `updateFilters` z nowym numerem `page`.
- **Usuwanie przepisu:**
  1. Użytkownik klika ikonę "Usuń" w `RecipeCard`.
  2. Pojawia się modalne okno dialogowe z prośbą o potwierdzenie (`AlertDialog` z Shadcn/ui).
  3. Po potwierdzeniu, wywoływana jest funkcja `deleteRecipe`.
  4. Przepis natychmiast znika z UI (optymistyczne UI).
  5. W tle wysyłane jest żądanie `DELETE` do API. W przypadku błędu, przepis wraca na listę i wyświetlany jest komunikat o błędzie (np. toast).
- **Nawigacja:** Kliknięcie `RecipeCard`, przycisku "Dodaj nowy przepis" lub "Generuj przepis AI" przenosi użytkownika na odpowiednią podstronę.

## 9. Warunki i walidacja
- **Dostęp do widoku:** Middleware Astro weryfikuje token autoryzacyjny.
- **Paginacja:** Komponent `Pagination` wyłącza przycisk "Poprzednia" na pierwszej stronie (`page === 1`) i "Następna" na ostatniej stronie (`(page * limit) >= total`).
- **Formularze (poza tym widokiem):** Walidacja parametrów (np. `limit`, `sort`) odbywa się po stronie API, zgodnie z planem implementacji endpointu. Frontend zapewnia poprawne wartości poprzez kontrolowane komponenty.

## 10. Obsługa błędów
- **Błąd pobierania danych:** Jeśli żądanie `GET /api/recipes` zakończy się błędem, hook `useRecipes` ustawi stan `error`. Komponent `RecipesList` wyświetli ogólny komunikat o błędzie zamiast listy przepisów.
- **Błąd usuwania:** W przypadku niepowodzenia żądania `DELETE`, optymistyczna aktualizacja UI zostanie wycofana, a użytkownik zobaczy powiadomienie (toast) z informacją, że nie udało się usunąć przepisu.
- **Stan pusty:** Jeśli API zwróci pustą listę (`items: []`), komponent `EmptyState` zostanie wyświetlony z zachętą do dodania pierwszego przepisu.
- **Stan ładowania:** Podczas każdego pobierania danych (`isLoading === true`), komponent `RecipesList` będzie wyświetlał komponent `Spinner`, zapewniając wizualną informację zwrotną dla użytkownika.

## 11. Kroki implementacji
**Ważne:** Na ten moment nie mamy zaimplementowanej integracji z supabase. W razie potrzeby możesz skorzystać z zamockowanego DEFAULT_USER_ID, ale mechanizm autentykacji będzie na późniejszym etapie.
1. **Struktura plików:** Utworzenie katalogu `src/components/views/MyRecipesView` i plików dla każdego komponentu (`MyRecipesView.tsx`, `OnboardingAlert.tsx`, `RecipesToolbar.tsx`, `MealTypeTabs.tsx`, `RecipesList.tsx`, `RecipeCard.tsx`, `EmptyState.tsx`, `Pagination.tsx`) oraz dla hooka `useRecipes.ts` i typów `MyRecipesView.types.ts`.
2. **Implementacja hooka `useRecipes`:** Stworzenie logiki zarządzania stanem, pobierania danych z `GET /api/recipes` i funkcji `updateFilters` oraz `deleteRecipe` (z logiką optymistycznego UI).
3. **Implementacja komponentów potomnych:** Zakodowanie wszystkich komponentów prezentacyjnych, dbając o poprawne przyjmowanie propsów i emitowanie zdarzeń (`onValueChange`, `onPageChange`, `onDelete`). Wykorzystanie komponentów z biblioteki Shadcn/ui.
4. **Implementacja komponentu `MyRecipesView`:** Zintegrowanie hooka `useRecipes` i połączenie wszystkich komponentów potomnych, przekazując im odpowiednie dane i handlery.
5. **Aktualizacja strony Astro:** W pliku `src/pages/index.astro` zaimportowanie i umieszczenie komponentu `MyRecipesView.tsx` z dyrektywą `client:load`.
6. **Stylowanie:** Dopracowanie stylów za pomocą Tailwind CSS, aby zapewnić spójność wizualną i responsywność widoku.
7. **Testowanie manualne:** Weryfikacja wszystkich interakcji użytkownika: filtrowania, paginacji, usuwania (wraz z przypadkiem błędu), stanów ładowania, pustego i błędu, a także responsywności na różnych urządzeniach.
