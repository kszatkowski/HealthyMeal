# Plan implementacji widoku: Generowanie Przepisu AI

## 1. Przegląd
Celem jest implementacja nowej funkcjonalności generowania przepisów kulinarnych przy użyciu AI. Użytkownik, za pomocą dedykowanego przycisku na stronie głównej, otworzy modal z formularzem, w którym określi parametry pożądanego przepisu. Po pomyślnym wygenerowaniu, zostanie przekierowany do formularza tworzenia nowego przepisu, który będzie wstępnie wypełniony danymi otrzymanymi od AI, gotowymi do edycji i zapisu.

## 2. Routing widoku
- **Przycisk inicjujący**: ` / ` (wewnątrz `MyRecipesView`)
- **Modal generowania**: Wyświetlany nad widokiem `/`
- **Docelowy widok po generacji**: ` /recipes/new ` (istniejący widok z nową logiką do wstępnego wypełniania formularza)

## 3. Struktura komponentów
Komponent `RecipesToolbar` już istnieje. Nowe komponenty zostaną umieszczone w `src/components/views/MyRecipesView/`. Istniejący przycisk `<a>` zostanie zrefaktoryzowany do nowego komponentu `GenerateRecipeButton`.

```
MyRecipesView.tsx
└── RecipesToolbar.tsx (Istniejący)
    └── GenerateRecipeButton.tsx (Refaktoryzacja istniejącego przycisku)
        (Zarządza stanem otwarcia modala)
└── GenerateRecipeModal.tsx (Nowy)
    └── GenerateRecipeForm.tsx (Nowy)
        ├── Select (dla mealType)
        ├── Input (dla mainIngredient)
        ├── Select (dla difficulty)
        └── Button (Submit)
```
Komponent `src/components/views/RecipeFormView/RecipeForm.tsx` zostanie zmodyfikowany, aby obsługiwać wypełnianie danych z `sessionStorage`.

## 4. Szczegóły komponentów
### `GenerateRecipeButton.tsx`
- **Opis komponentu**: Komponent ten zastąpi istniejący link `<a>` w `RecipesToolbar.tsx`. Będzie to przycisk, którego kliknięcie otwiera `GenerateRecipeModal`. Jest nieaktywny, jeśli użytkownik wykorzystał dzienny limit zapytań do AI.
- **Główne elementy**: Komponent `Button` z biblioteki `shadcn/ui`.
- **Obsługiwane interakcje**: `onClick`.
- **Obsługiwana walidacja**: Przycisk jest wyłączony (`disabled`), gdy `requestsRemaining <= 0`.
- **Typy**: Brak specyficznych typów DTO/ViewModel.
- **Props**:
  ```typescript
  interface GenerateRecipeButtonProps {
    onOpen: () => void;
    requestsRemaining: number;
  }
  ```

### `GenerateRecipeModal.tsx`
- **Opis komponentu**: Modal (`Dialog` z `shadcn/ui`) zawierający formularz do generowania przepisu. Zarządza komunikacją z API, obsługuje stany ładowania i błędów, a po sukcesie inicjuje przekierowanie.
- **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` oraz komponent `GenerateRecipeForm`.
- **Obsługiwane interakcje**: Otwarcie/zamknięcie modala, obsługa zdarzenia `onSubmit` z formularza.
- **Obsługiwana walidacja**: Wyświetla komunikat, jeśli dzienny limit zapytań został osiągnięty.
- **Typy**: `GenerateRecipeFormViewModel`.
- **Props**:
  ```typescript
  interface GenerateRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestsRemaining: number;
    onGenerationSuccess: (newCount: number) => void;
  }
  ```

### `GenerateRecipeForm.tsx`
- **Opis komponentu**: Właściwy formularz do specyfikacji przepisu, zbudowany przy użyciu `shadcn/ui`, `react-hook-form` i `zod`. Odpowiada za walidację po stronie klienta i przekazanie danych do `GenerateRecipeModal`.
- **Główne elementy**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Select`, `Input`, `Button`.
- **Obsługiwane interakcje**: Wprowadzanie danych, `onSubmit`.
- **Obsługiwana walidacja**:
  - `mealType`: pole wymagane, musi być jednym z `MEAL_TYPES`.
  - `mainIngredient`: pole opcjonalne (string).
  - `difficulty`: pole opcjonalne, musi być jednym z `DIFFICULTIES`.
- **Typy**: `GenerateRecipeFormViewModel`.
- **Props**:
  ```typescript
  interface GenerateRecipeFormProps {
    onSubmit: (data: GenerateRecipeFormViewModel) => void;
    isSubmitting: boolean;
    requestsRemaining: number;
  }
  ```

## 5. Typy
### `GenerateRecipeFormViewModel`
- **Opis**: Reprezentuje dane formularza generowania przepisu po stronie klienta. Typy dla `mealType` i `difficulty` są reużywane z istniejących stałych w aplikacji, aby zapewnić spójność.
- **Struktura (Typ generowany z Zod)**:
  ```typescript
  // Typ będzie wyinferowany ze schematu Zod
  type GenerateRecipeFormViewModel = z.infer<typeof generateRecipeFormSchema>;

  // Co daje w rezultacie:
  // {
  //   mealType: "breakfast" | "lunch" | "dinner" | "dessert" | "snack";
  //   mainIngredient?: string;
  //   difficulty?: "easy" | "medium" | "hard";
  // }
  ```
- **Schemat Zod (do walidacji)**:
  ```typescript
  import { z } from "zod";
  import { MEAL_TYPES, DIFFICULTIES } from "@/components/views/RecipeFormView/constants";

  const generateRecipeFormSchema = z.object({
    mealType: z.enum(MEAL_TYPES, {
      required_error: "Rodzaj posiłku jest wymagany.",
    }),
    mainIngredient: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
  });
  ```

## 6. Zarządzanie stanem
### Custom Hook: `useGenerateRecipe`
- **Cel**: Hermetyzacja logiki związanej z wywołaniem API, zarządzaniem stanem ładowania, obsługą błędów oraz przekierowaniem. Hook będzie używany wewnątrz `GenerateRecipeModal`.
- **Zarządzany stan**:
  - `isGenerating: boolean`: Informuje o trwającym procesie generowania.
  - `error: string | null`: Przechowuje komunikaty o błędach z API.
- **Udostępniane funkcje**:
  - `generateRecipe(formData: GenerateRecipeFormViewModel): Promise<RecipeUpdateCommand | null>`:
    1.  Ustawia `isGenerating` na `true`.
    2.  Tworzy `prompt` w języku naturalnym na podstawie `formData`.
    3.  Wysyła żądanie `POST` do `/api/recipes/generate`.
    4.  W przypadku sukcesu:
        - Zapisuje otrzymany obiekt przepisu (`RecipeUpdateCommand`) w `sessionStorage` pod kluczem `ai-generated-recipe`.
        - Zwraca dane przepisu.
    5.  W przypadku błędu:
        - Ustawia stan `error` na podstawie odpowiedzi API.
        - Zwraca `null`.
    6.  Na końcu ustawia `isGenerating` na `false`.

### Stan w `RecipeForm.tsx`
Komponent zostanie rozszerzony o `useEffect`, który przy pierwszym renderowaniu sprawdzi `sessionStorage`. Jeśli znajdzie dane pod kluczem `ai-generated-recipe`, użyje metody `reset` z `react-hook-form`, aby wypełnić formularz, a następnie usunie wpis z `sessionStorage`.

## 7. Integracja API
### Endpoint: `POST /api/recipes/generate`
- **Żądanie (Request)**:
  - Frontend na podstawie `GenerateRecipeFormViewModel` tworzy `prompt` tekstowy.
  - **Przykładowy `prompt`**: `Create an ${difficulty || 'easy'} ${mealType} recipe, with ${mainIngredient || 'any main ingredient'}.`
  - **Body**:
    ```typescript
    interface GenerateRecipeRequest {
      prompt: string;
    }
    ```
- **Odpowiedź (Response) - Sukces (200 OK)**:
  - Zgodnie z implementacją, odpowiedź zawiera obiekt `RecipeUpdateCommand` oraz zaktualizowaną liczbę pozostałych zapytań.
  - **Body**:
    ```typescript
    interface GenerateRecipeResponse {
      success: true;
      data: RecipeUpdateCommand; // Typ z src/types.ts
      aiRequestsRemaining: number;
    }
    ```
- **Odpowiedź (Response) - Błąd**:
  - **Body**:
    ```typescript
    interface ErrorResponse {
      success: false;
      error: string;
      details?: any;
    }
    ```

## 8. Interakcje użytkownika
1.  **Kliknięcie "Generuj przepis AI"**: Otwiera modal `GenerateRecipeModal`.
2.  **Wypełnienie formularza i kliknięcie "Generuj"**:
    - Przycisk "Generuj" wyświetla spinner i staje się nieaktywny.
    - W przypadku sukcesu: modal jest zamykany, następuje przekierowanie do `/recipes/new`, a formularz na tej stronie jest wypełniony danymi.
    - W przypadku błędu: Wyświetlany jest toast (`sonner`) z komunikatem błędu, a formularz ponownie staje się aktywny.
3.  **Lądowanie na `/recipes/new` po generacji**: Użytkownik widzi formularz wypełniony sugestiami od AI i może je dowolnie modyfikować przed zapisem.
4.  **Próba generacji z zerowym limitem zapytań**: Przycisk "Generuj przepis AI" oraz przycisk "Generuj" w formularzu są nieaktywne.

## 9. Warunki i walidacja
- **Warunek**: Użytkownik musi mieć > 0 zapytań do AI.
  - **Walidacja**: Sprawdzane na poziomie komponentów `GenerateRecipeButton` i `GenerateRecipeForm` (dezaktywacja przycisków). API stanowi ostateczne źródło prawdy.
- **Warunek**: Pole "Rodzaj posiłku" (`mealType`) jest wymagane.
  - **Walidacja**: Realizowana w `GenerateRecipeForm` przy użyciu `react-hook-form` i `zod`, wyświetlając komunikat błędu pod polem.

## 10. Obsługa błędów
- **Błędy walidacji formularza**: Komunikaty o błędach wyświetlane są bezpośrednio pod odpowiednimi polami formularza.
- **Błędy API (4xx, 5xx)**: Komunikat błędu zwrócony w ciele odpowiedzi API jest przechwytywany przez hook `useGenerateRecipe` i wyświetlany użytkownikowi za pomocą komponentu `Sonner` (toast).
- **Błędy sieciowe**: Hook `useGenerateRecipe` obsługuje błędy sieciowe (np. brak połączenia), wyświetlając generyczny komunikat o problemie z siecią.
- **Osiągnięcie limitu zapytań**: Jeśli frontendowa walidacja zawiedzie, błąd z API zostanie obsłużony jak każdy inny błąd API, a stan licznika zapytań zostanie zaktualizowany.

## 11. Kroki implementacji
1.  **Utworzenie typów i schematu walidacji**: Zdefiniowanie `GenerateRecipeFormViewModel` oraz schematu `zod` w nowym pliku `src/components/views/MyRecipesView/schema.ts`.
2.  **Stworzenie hooka `useGenerateRecipe`**: Implementacja logiki do komunikacji z API, zarządzania stanem i obsługi `sessionStorage`.
3.  **Implementacja komponentu `GenerateRecipeForm.tsx`**: Stworzenie formularza z polami `mealType`, `mainIngredient`, `difficulty` z wykorzystaniem `react-hook-form` i `zod`.
4.  **Implementacja komponentu `GenerateRecipeModal.tsx`**: Stworzenie modala, który będzie zawierał `GenerateRecipeForm` i wykorzystywał hook `useGenerateRecipe`.
5.  **Refaktoryzacja przycisku w `RecipesToolbar.tsx`**:
    - Stworzenie nowego komponentu `GenerateRecipeButton.tsx`.
    - Zastąpienie istniejącego linku `<a href="/recipes/generate">` w `RecipesToolbar.tsx` nowym komponentem `GenerateRecipeButton`.
6.  **Integracja w `MyRecipesView.tsx`**:
    - Przekazanie do `RecipesToolbar` i `GenerateRecipeButton` logiki do otwierania modala oraz informacji o pozostałych zapytaniach do AI.
    - Dodanie `GenerateRecipeModal` do głównego widoku.
    - Implementacja logiki zarządzania stanem widoczności modala.
7.  **Modyfikacja `RecipeForm.tsx`**: Dodanie `useEffect` do sprawdzania i wczytywania danych z `sessionStorage` przy inicjalizacji formularza na stronie `/recipes/new`.
8.  **Testowanie**: Przeprowadzenie testów manualnych obejmujących scenariusz sukcesu, wszystkie przypadki błędów oraz przypadki brzegowe (np. odświeżenie strony `/recipes/new` po wypełnieniu danych).
