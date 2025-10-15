# Architektura UI dla HealthyMeal

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji HealthyMeal została zaprojektowana w oparciu o framework Astro z wykorzystaniem React do tworzenia dynamicznych, interaktywnych komponentów ("wysp"). Jako podstawa systemu wizualnego posłuży biblioteka komponentów Shadcn/ui, co zapewni spójność, nowoczesny wygląd oraz wysoki standard dostępności.

Aplikacja będzie renderowana po stronie serwera (SSR) przez Astro, co zagwarantuje szybkie pierwsze załadowanie. Nawigacja będzie opierać się na stronach (MPA - Multi-Page Application), a stan aplikacji będzie zarządzany głównie lokalnie w komponentach React.

Architektura jest zorientowana na realizację kluczowych przepływów użytkownika zdefiniowanych w PRD, takich jak zarządzanie preferencjami, generowanie przepisów przez AI oraz pełne operacje CRUD na przepisach. Projekt zakłada pełną responsywność oraz hybrydową strategię obsługi błędów (inline dla walidacji i powiadomienia "toast" dla błędów ogólnych).

## 2. Lista widoków

### Widok 1: Logowanie (Login View)
- **Ścieżka:** `/login`
- **Główny cel:** Umożliwienie zarejestrowanym użytkownikom dostępu do aplikacji.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania.
- **Kluczowe komponenty widoku:**
  - `LoginForm`: Komponent React zawierający pola na e-mail i hasło, walidację oraz obsługę wysyłki.
  - Link do strony rejestracji.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty o błędach (np. "Nieprawidłowy e-mail lub hasło"). Przycisk "Zaloguj" z wbudowanym wskaźnikiem ładowania.
  - **Dostępność:** Poprawne etykiety (`label`) dla pól formularza, obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo:** Komunikacja z API przez HTTPS. Hasło przesyłane w bezpieczny sposób.

### Widok 2: Rejestracja (Register View)
- **Ścieżka:** `/register`
- **Główny cel:** Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia:** Formularz rejestracji.
- **Kluczowe komponenty widoku:**
  - `RegisterForm`: Komponent React z polami na e-mail, hasło i potwierdzenie hasła.
  - Link do strony logowania.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Walidacja `inline` dla formatu e-maila i wymagań dotyczących hasła. Po pomyślnej rejestracji automatyczne zalogowanie i przekierowanie na stronę główną.
  - **Dostępność:** Podobnie jak w widoku logowania, zapewnienie pełnej dostępności formularza.
  - **Bezpieczeństwo:** Wdrożenie walidacji po stronie serwera, aby zapobiec nieprawidłowym danym.

### Widok 3: Moje Przepisy (My Recipes View)
- **Ścieżka:** `/` (główny widok po zalogowaniu)
- **Główny cel:** Przeglądanie, filtrowanie i zarządzanie listą przepisów użytkownika. Jest to centralny punkt aplikacji, z którego inicjowane są główne akcje.
- **Kluczowe informacje do wyświetlenia:**
  - Lista przepisów użytkownika.
  - Filtry kategorii (`mealType`).
  - Informacje o liczbie przepisów i aktualnej stronie.
  - Powiadomienie onboardingowe (warunkowo).
- **Kluczowe komponenty widoku:**
  - `OnboardingAlert`: Komponent `Alert` (Shadcn/ui) wyświetlany, gdy użytkownik nie ma zdefiniowanych preferencji.
  - `RecipesToolbar`: Pasek narzędzi z przyciskami "Dodaj nowy przepis" i "Generuj przepis AI".
  - `MealTypeTabs`: Komponent `Tabs` (Shadcn/ui) do filtrowania przepisów.
  - `RecipesList`: Siatka wyświetlająca komponenty `RecipeCard`.
  - `EmptyState`: Komponent wyświetlany, gdy lista przepisów jest pusta.
  - `Pagination`: Komponent `Pagination` (Shadcn/ui) do nawigacji między stronami.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wdrożenie stanu ładowania (np. `spinner`) podczas pobierania danych. Zastosowanie "optimistic UI" przy usuwaniu przepisu. Jasne wezwanie do akcji (CTA) w stanie pustym.
  - **Dostępność:** Zakładki i paginacja muszą być w pełni dostępne z klawiatury. Karty przepisów powinny mieć logiczną strukturę nagłówków.
  - **Bezpieczeństwo:** Widok dostępny tylko dla uwierzytelnionych użytkowników. Ochrona trasy realizowana przez middleware w Astro.

### Widok 4: Formularz Przepisu (Recipe Form View)
- **Ścieżka:** `/recipes/new` (tworzenie), `/recipes/[id]/edit` (edycja)
- **Główny cel:** Tworzenie nowego przepisu lub modyfikacja istniejącego.
- **Kluczowe informacje do wyświetlenia:** Pełny formularz edycji przepisu.
- **Kluczowe komponenty widoku:**
  - `RecipeForm`: Główny komponent React zawierający wszystkie pola: `Input` (nazwa), `Select` (rodzaj posiłku, poziom trudności), `Textarea` (instrukcje).
  - `IngredientsEditor`: Dynamiczny komponent do zarządzania listą składników (dodawanie, usuwanie, edycja ilości i jednostek).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po zapisaniu następuje przekierowanie z powrotem do listy z komunikatem "toast" o sukcesie. Walidacja `inline`.
  - **Dostępność:** Wszystkie pola formularza muszą mieć etykiety. Dynamiczny edytor składników musi być obsługiwany z klawiatury.
  - **Bezpieczeństwo:** Walidacja danych wejściowych po stronie serwera. Sprawdzenie uprawnień użytkownika do edycji danego przepisu.

### Widok 5: Preferencje (Preferences View)
- **Ścieżka:** `/preferences`
- **Główny cel:** Zarządzanie preferencjami żywieniowymi użytkownika (lubię, nie lubię, alergeny).
- **Kluczowe informacje do wyświetlenia:** Trzy listy produktów powiązane z każdą kategorią preferencji.
- **Kluczowe komponenty widoku:**
  - `PreferenceColumn`: Komponent wielokrotnego użytku dla każdej kategorii ("Lubię", "Nie lubię", "Alergeny").
  - `ProductSearchInput`: Komponent `Combobox` (Shadcn/ui) zintegrowany z `GET /api/products` do wyszukiwania i dodawania produktów.
  - `PreferenceList`: Lista dodanych produktów z opcją usunięcia.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Responsywny układ (3 kolumny na desktopie, 1 na mobile). Zmiany są zapisywane natychmiast po każdej operacji (dodanie/usunięcie produktu), co jest komunikowane przez wskaźniki ładowania.
  - **Dostępność:** Zapewnienie, że interaktywne elementy są w pełni dostępne.
  - **Bezpieczeństwo:** Dostęp do widoku chroniony, operacje modyfikacji autoryzowane tokenem.

## 3. Mapa podróży użytkownika

1.  **Rejestracja i Onboarding:**
    - Użytkownik przechodzi z `(/register)` do `(/)`.
    - Na `(/)` widzi `OnboardingAlert` i `EmptyState`.
    - Klika link w alercie i przechodzi do `(/preferences)`, aby zdefiniować swoje preferencje.
2.  **Generowanie Przepisu AI:**
    - Na `(/)` klika "Generuj przepis AI", co otwiera `AI Generation Modal`.
    - Wypełnia formularz w modalu i klika "Generuj".
    - Po odpowiedzi z API zostaje przekierowany do `(/recipes/new)` z formularzem wypełnionym danymi od AI.
    - Wprowadza ewentualne poprawki i klika "Zapisz".
    - Zostaje przekierowany z powrotem na `(/)`, gdzie widzi nowy przepis na liście i otrzymuje powiadomienie "toast" o sukcesie.
3.  **Zarządzanie Przepisami (CRUD):**
    - **Tworzenie:** Użytkownik klika "Dodaj nowy przepis" na `(/)`, przechodzi do `(/recipes/new)`, wypełnia formularz i po zapisie wraca na `(/)`.
    - **Edycja:** Na `(/)` klika przycisk "Edytuj" na `RecipeCard`, co prowadzi do `(/recipes/[id]/edit)`. Po zapisaniu zmian wraca na `(/)`.
    - **Usuwanie:** Na `(/)` klika "Usuń" na `RecipeCard`, co otwiera `Delete Confirmation Modal`. Po potwierdzeniu, przepis znika z listy (optimistic UI), a w tle wysyłane jest żądanie do API. W razie błędu, element wraca na listę, a użytkownik otrzymuje powiadomienie "toast" o niepowodzeniu.

## 4. Układ i struktura nawigacji

- **Główny Układ (Layout):**
  - Spójny `Header` na górze każdej strony.
  - `Header` zawiera logo, główne linki nawigacyjne ("Moje przepisy", "Preferencje") oraz menu użytkownika (awatar/ikona z opcją "Wyloguj").
  - Poniżej `Header` znajduje się główny kontener (`<main>`), w którym renderowana jest treść bieżącego widoku.
- **Nawigacja:**
  - **Górny Pasek Nawigacyjny:** Umożliwia przełączanie się między głównymi sekcjami aplikacji: `(/)` i `(/preferences)`.
  - **Nawigacja Kontekstowa:**
    - W widoku `Moje przepisy` nawigacja jest rozszerzona o zakładki (`Tabs`) do filtrowania.
    - Przyciski akcji ("Dodaj", "Generuj") inicjują kluczowe przepływy.
    - Przyciski na kartach przepisów ("Edytuj", "Usuń") pozwalają na zarządzanie konkretnymi elementami.
  - **Dostępność:** Nawigacja jest w pełni osiągalna i obsłużona za pomocą klawiatury, z wyraźnym stanem `:focus` dla wszystkich interaktywnych elementów.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów React, które będą stanowić budulec interfejsu użytkownika:

- **`RecipeCard`:**
  - **Opis:** Karta wyświetlająca podsumowanie pojedynczego przepisu na liście. Zawiera nazwę, kategorię, poziom trudności oraz przyciski akcji.
- **`RecipeForm`:**
  - **Opis:** Kompleksowy formularz do tworzenia i edycji przepisów, zawierający walidację i logikę komunikacji z API.
- **`IngredientsEditor`:**
  - **Opis:** Interaktywny komponent wewnątrz `RecipeForm` do dynamicznego zarządzania listą składników. Wykorzystuje `Combobox` do wyszukiwania produktów.
- **`PreferenceColumn`:**
  - **Opis:** Komponent używany w widoku preferencji do zarządzania jedną z list ("Lubię", "Nie lubię", "Alergeny").
- **`AI_GenerationModal`:**
  - **Opis:** Komponent `Dialog` (Shadcn/ui) z formularzem do zbierania danych na potrzeby generowania przepisu przez AI.
- **`DeleteConfirmationDialog`:**
  - **Opis:** Komponent `AlertDialog` (Shadcn/ui) używany do potwierdzania operacji usunięcia przepisu, aby zapobiec przypadkowym akcjom.
- **`EmptyState`:**
  - **Opis:** Generyczny komponent wyświetlany, gdy na liście brakuje elementów (np. przepisów). Zawiera komunikat i opcjonalne przyciski CTA.
- **`AuthGuard`:**
  - **Opis:** Komponent wyższego rzędu (HOC) lub wrapper, który chroni trasy po stronie klienta, sprawdzając, czy użytkownik jest zalogowany.
