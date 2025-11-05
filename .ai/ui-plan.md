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
  - `RecipeForm`: Główny komponent React zawierający wszystkie pola: `Input` (nazwa), `Select` (rodzaj posiłku, poziom trudności), `Textarea` (instrukcje), `Textarea` (składniki).
  - Pole `ingredients` to zwykły textarea, gdzie użytkownik wpisuje składniki w formacie tekstowym (np. "Oats - 1 cup\nAlmond Milk - 1 cup").
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po zapisaniu następuje przekierowanie z powrotem do listy z komunikatem "toast" o sukcesie. Walidacja `inline`. Pole składników zawiera placeholder z przykładową zawartością pokazującą oczekiwany format.
  - **Dostępność:** Wszystkie pola formularza muszą mieć etykiety. Pole textarea musi być w pełni dostępne z klawiatury.
  - **Bezpieczeństwo:** Walidacja danych wejściowych po stronie serwera. Sprawdzenie uprawnień użytkownika do edycji danego przepisu.

### Widok 5: Preferencje (Preferences View)
- **Ścieżka:** `/preferences`
- **Główny cel:** Zarządzanie preferencjami żywieniowymi użytkownika za pomocą dwóch krótkich pól tekstowych ("Nie lubię" i "Alergeny").
- **Kluczowe informacje do wyświetlenia:** Formularz z polami tekstowymi, licznik znaków (0/200) oraz stan ostatniej aktualizacji.
- **Kluczowe komponenty widoku:**
  - `PreferenceForm`: Komponent React z `react-hook-form`, renderujący dwa pola `Textarea` (Shadcn/ui) z walidacją długości i przyciskiem zapisu.
  - `PreferenceSummary`: Opcjonalny blok ze skrótem lub wskazówkami jak formatować wpisy (np. lista oddzielona przecinkami).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Układ jednowierszowy na desktopie (dwie kolumny) i pionowy na mobile. Stały przycisk "Zapisz" z informacją o stanie (`Zapisano`, `Zapisywanie...`).
  - **Dostępność:** Pełne etykiety, opisy (`aria-describedby`) informujące o limicie znaków oraz wyraźne komunikaty błędów.
  - **Bezpieczeństwo:** Dostęp do widoku chroniony, zapis korzysta z uwierzytelnionego `/api/profile`.

### Widok 6: Przegląd Przepisu (Recipe Details View)
- **Ścieżka:** `/recipes/[id]`
- **Główny cel:** Wyświetlanie szczegółowych informacji o wybranym przepisie.
- **Kluczowe informacje do wyświetlenia:**
  - Nazwa przepisu,
  - Rodzaj posiłku,
  - Poziom trudności,
  - Lista składników z ilościami,
  - Instrukcje krok po kroku.
- **Kluczowe komponenty widoku:**
  - `RecipeDetails`: Główny komponent (może być statyczną stroną Astro) renderujący wszystkie informacje o przepisie.
  - Przyciski akcji "Edytuj" i "Usuń", prowadzące odpowiednio do `(/recipes/[id]/edit)` oraz inicjujące modal potwierdzenia usunięcia.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Czytelny i przejrzysty układ. Łatwy powrót do listy przepisów.
  - **Dostępność:** Użycie prawidłowej hierarchii nagłówków (H1 dla nazwy, H2 dla sekcji "Składniki", "Instrukcje"). Listy składników i instrukcji jako uporządkowane/nieuporządkowane listy HTML.
  - **Bezpieczeństwo:** Dostępny tylko dla właściciela przepisu. Weryfikacja uprawnień realizowana przez middleware w Astro oraz na poziomie API.

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
    - **Tworzenie (Create):** Użytkownik klika "Dodaj nowy przepis" na `(/)`, przechodzi do `(/recipes/new)`, wypełnia formularz i po zapisie wraca na `(/)`.
    - **Przeglądanie (Read):** Użytkownik na `(/)` klika w `RecipeCard` (poza przyciskami akcji), co prowadzi go do strony szczegółów przepisu `(/recipes/[id])`.
    - **Edycja (Update):** Użytkownik może przejść do edycji z dwóch miejsc: klikając przycisk "Edytuj" na `RecipeCard` na stronie `(/)` lub z poziomu widoku szczegółów `(/recipes/[id])`. Obie akcje prowadzą do `(/recipes/[id]/edit)`. Po zapisaniu zmian wraca na `(/)`.
    - **Usuwanie (Delete):** Podobnie jak w przypadku edycji, usunięcie można zainicjować z `RecipeCard` na `(/)` lub z widoku szczegółów `(/recipes/[id])`. Akcja otwiera `Delete Confirmation Modal`. Po potwierdzeniu, przepis znika z listy (optimistic UI), a w tle wysyłane jest żądanie do API. W razie błędu, element wraca na listę, a użytkownik otrzymuje powiadomienie "toast" o niepowodzeniu.

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
- **`RecipeDetails`:**
  - **Opis:** Komponent wyświetlający szczegółowe informacje o przepisie, takie jak tekst składników i instrukcje. Zawiera również przyciski akcji ("Edytuj", "Usuń").
- **`RecipeForm`:**
  - **Opis:** Kompleksowy formularz do tworzenia i edycji przepisów, zawierający pola na tekstowe składniki, instrukcje, walidację i logikę komunikacji z API.
- **`PreferenceForm`:**
  - **Opis:** Komponent formularza zarządzającego polami tekstowymi "Nie lubię" oraz "Alergeny" z walidacją limitu 200 znaków i obsługą zapisu.
- **`AI_GenerationModal`:**
  - **Opis:** Komponent `Dialog` (Shadcn/ui) z formularzem do zbierania danych na potrzeby generowania przepisu przez AI.
- **`DeleteConfirmationDialog`:**
  - **Opis:** Komponent `AlertDialog` (Shadcn/ui) używany do potwierdzania operacji usunięcia przepisu, aby zapobiec przypadkowym akcjom.
- **`EmptyState`:**
  - **Opis:** Generyczny komponent wyświetlany, gdy na liście brakuje elementów (np. przepisów). Zawiera komunikat i opcjonalne przyciski CTA.
- **`AuthGuard`:**
  - **Opis:** Komponent wyższego rzędu (HOC) lub wrapper, który chroni trasy po stronie klienta, sprawdzając, czy użytkownik jest zalogowany.
