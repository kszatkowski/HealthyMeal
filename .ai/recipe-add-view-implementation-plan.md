# Plan implementacji widoku Formularza Przepisu

## 1. Przegląd
Widok Formularza Przepisu umożliwia użytkownikom tworzenie nowych, własnych przepisów kulinarnych. Składa się z formularza zawierającego pola na podstawowe informacje o przepisie, takie jak nazwa, rodzaj posiłku i poziom trudności, a także edytor do dynamicznego zarządzania listą składników oraz pole tekstowe na instrukcje przygotowania. Po pomyślnym zapisaniu formularza użytkownik jest przekierowywany do listy swoich przepisów.

## 2. Routing widoku
- **Tworzenie nowego przepisu:** `/recipes/new`
- **Edycja istniejącego przepisu:** `/recipes/[id]/edit` (poza zakresem tego planu)

Strona zostanie zaimplementowana w pliku `src/pages/recipes/new.astro`.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie następująca:

```
- RecipeFormView.astro
  - Layout.astro
    - Navbar.tsx
    - RecipeForm.tsx (client:load)
      - Form (z biblioteki react-hook-form)
        - Input (dla nazwy przepisu)
        - Select (dla rodzaju posiłku)
        - Select (dla poziomu trudności)
        - Textarea (dla instrukcji)
        - IngredientsEditor.tsx
          - [Pętla po składnikach]
            - ProductSearchInput.tsx
            - Input (dla ilości)
            - Select (dla jednostki)
            - Button (do usunięcia składnika)
          - Button (do dodania nowego składnika)
        - Button (do zapisu formularza)
```

## 4. Szczegóły komponentów

### `RecipeForm.tsx`
- **Opis komponentu:** Główny komponent React, który zarządza całym stanem formularza. Wykorzystuje bibliotekę `react-hook-form` do obsługi pól, walidacji i procesu zapisu. Renderuje wszystkie elementy UI formularza i orkiestruje komunikację z API.
- **Główne elementy:** Komponent `<form>` opakowujący komponenty `Input`, `Select`, `Textarea` i `Button` z `shadcn/ui`, a także niestandardowy komponent `IngredientsEditor`.
- **Obsługiwane interakcje:**
  - Wprowadzanie danych w polach formularza.
  - Zapisanie formularza.
- **Obsługiwana walidacja:**
  - Walidacja wszystkich pól formularza zgodnie ze schematem zdefiniowanym w sekcji 9.
- **Typy:** `RecipeFormViewModel`, `RecipeCreateCommand`.
- **Propsy:** Brak.

### `IngredientsEditor.tsx`
- **Opis komponentu:** Komponent do dynamicznego zarządzania listą składników. Umożliwia dodawanie, usuwanie i edycję poszczególnych wierszy składników. Jest kontrolowany przez `RecipeForm` za pomocą hooka `useFieldArray` z `react-hook-form`.
- **Główne elementy:** Lista wierszy składników, przycisk "Dodaj składnik". Każdy wiersz zawiera `ProductSearchInput`, `Input` (ilość), `Select` (jednostka) i `Button` (usuń).
- **Obsługiwane interakcje:**
  - `onAddIngredient`: Dodaje nowy, pusty wiersz do listy składników.
  - `onRemoveIngredient(index)`: Usuwa wiersz o podanym indeksie.
  - `onUpdateIngredient(index, data)`: Aktualizuje dane w wierszu o podanym indeksie.
- **Obsługiwana walidacja:**
  - Minimalna liczba składników: 1.
  - Maksymalna liczba składników: 50.
- **Typy:** `RecipeCommandIngredient[]`.
- **Propsy:** `control`, `register`, `errors` (przekazane z `react-hook-form`).

### `ProductSearchInput.tsx`
- **Opis komponentu:** Komponent typu "Combobox" lub "Autocomplete" do wyszukiwania i wybierania produktów z bazy danych. Będzie on wysyłał zapytania do API w miarę wpisywania tekstu przez użytkownika i wyświetlał pasujące wyniki.
- **Główne elementy:** `Input` zintegrowany z listą rozwijaną wyników wyszukiwania.
- **Obsługiwane interakcje:**
  - Wpisywanie tekstu w celu wyszukania produktu.
  - Wybór produktu z listy wyników.
- **Obsługiwana walidacja:**
  - Wymaga wyboru poprawnego produktu z listy.
- **Typy:** `ProductListItemDto`.
- **Propsy:** `value`, `onChange`.

## 5. Typy

### `RecipeFormViewModel`
Model widoku używany przez `react-hook-form` do zarządzania stanem formularza. Jest to rozszerzona wersja `RecipeCreateCommand` o pole `productName` dla celów wyświetlania w UI.

```typescript
import { z } from "zod";

const recipeFormSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(50, "Nazwa nie może przekraczać 50 znaków"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "dessert", "snack"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  instructions: z.string().min(1, "Instrukcje są wymagane").max(5000, "Instrukcje nie mogą przekraczać 5000 znaków"),
  ingredients: z.array(z.object({
    productId: z.string().uuid("Nieprawidłowy produkt"),
    // Pole używane tylko w UI do wyświetlania nazwy, usuwane przed wysłaniem do API
    productName: z.string().min(1, "Nazwa produktu jest wymagana"),
    amount: z.coerce.number().positive("Ilość musi być większa od zera"),
    unit: z.enum(["gram", "kilogram", "milliliter", "liter", "teaspoon", "tablespoon", "cup", "piece"]),
  })).min(1, "Należy dodać co najmniej jeden składnik").max(50, "Liczba składników nie może przekraczać 50"),
});

type RecipeFormViewModel = z.infer<typeof recipeFormSchema>;
```

## 6. Zarządzanie stanem
Stan formularza będzie w całości zarządzany przez bibliotekę `react-hook-form`.

- **Hook `useForm`**: Zostanie użyty w komponencie `RecipeForm` do inicjalizacji formularza, rejestracji pól i obsługi procesu zapisu.
  - `resolver`: Zostanie skonfigurowany z `@hookform/resolvers/zod`, aby automatycznie walidować formularz na podstawie zdefiniowanego `recipeFormSchema`.
- **Hook `useFieldArray`**: Zostanie użyty wewnątrz `RecipeForm` do zarządzania dynamiczną listą składników. Udostępni on metody `fields`, `append` i `remove`, które zostaną przekazane do komponentu `IngredientsEditor`.
- **Niestandardowy hook `useRecipeForm`**: Opcjonalnie można stworzyć ten hook, aby zamknąć w nim całą logikę związaną z `useForm`, `useFieldArray` oraz funkcją `onSubmit` wysyłającą dane do API.

## 7. Integracja API

### Wyszukiwanie produktów (nowy endpoint)
- **Endpoint:** `GET /api/products?search={query}`
- **Opis:** Ten endpoint (który musi zostać stworzony) będzie używany przez komponent `ProductSearchInput` do pobierania listy produktów pasujących do zapytania użytkownika.
- **Typ odpowiedzi:** `ProductListResponseDto`.

### Tworzenie przepisu
- **Endpoint:** `POST /api/recipes`
- **Opis:** Główny punkt końcowy do zapisu nowego przepisu.
- **Typ żądania (`body`):** `RecipeCreateCommand`. Przed wysłaniem, dane z `RecipeFormViewModel` muszą zostać przekształcone poprzez usunięcie pola `productName` z każdego składnika.
- **Typ odpowiedzi (sukces `201`):** `RecipeResponseDto`.
- **Obsługa:** Po otrzymaniu odpowiedzi `201 Created`, aplikacja powinna wyświetlić powiadomienie "toast" o sukcesie i przekierować użytkownika na stronę główną (listę przepisów). W przypadku błędu, należy wyświetlić generyczny komunikat o błędzie.

## 8. Interakcje użytkownika
- **Wypełnianie formularza:** Użytkownik wpisuje dane w pola tekstowe i wybiera opcje z list rozwijanych. Stan jest na bieżąco aktualizowany przez `react-hook-form`.
- **Dodawanie składnika:** Użytkownik klika przycisk "Dodaj składnik", co powoduje dodanie nowego, pustego wiersza w `IngredientsEditor`.
- **Usuwanie składnika:** Użytkownik klika ikonę kosza obok składnika, co natychmiast usuwa go z formularza.
- **Wybór produktu:** Użytkownik wpisuje nazwę produktu w `ProductSearchInput`, wybiera pozycję z listy, co aktualizuje `productId` i `productName` dla danego składnika.
- **Zapis:** Użytkownik klika "Zapisz przepis". Jeśli formularz jest poprawny, dane są wysyłane do API. W trakcie wysyłania przycisk jest nieaktywny.

## 9. Warunki i walidacja
Walidacja będzie realizowana po stronie klienta za pomocą Zod, odzwierciedlając reguły zaimplementowane na backendzie.
- **`name`**: Wymagane, max. 50 znaków.
- **`mealType`**: Wymagane, musi być jedną z predefiniowanych wartości.
- **`difficulty`**: Wymagane, musi być jedną z predefiniowanych wartości.
- **`instructions`**: Wymagane, max. 5000 znaków.
- **`ingredients`**: Wymagana jest co najmniej 1 pozycja i maksymalnie 50.
- **`ingredient.product`**: Wymagany wybór z listy.
- **`ingredient.amount`**: Wymagane, musi być liczbą dodatnią.
- **`ingredient.unit`**: Wymagane.

Komunikaty o błędach będą wyświetlane pod odpowiednimi polami formularza, gdy reguły walidacji nie zostaną spełnione.

## 10. Obsługa błędów
- **Błędy walidacji:** Obsługiwane automatycznie przez `react-hook-form` i `zodResolver`. Użytkownik zobaczy komunikaty inline, a formularz nie zostanie wysłany.
- **Błędy API (np. `4xx`, `5xx`):** W bloku `catch` funkcji `onSubmit`, zostanie wyświetlone powiadomienie "toast" (np. za pomocą `sonner`) z ogólnym komunikatem, np. "Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.". Szczegółowe informacje o błędzie zostaną zalogowane w konsoli deweloperskiej.
- **Błędy sieciowe:** Traktowane tak samo jak błędy API. Przycisk zapisu zostanie ponownie aktywowany, aby umożliwić ponowną próbę.

## 11. Kroki implementacji
1.  **Stworzenie strony Astro:** Utworzenie pliku `src/pages/recipes/new.astro`, który będzie renderował główny layout i osadzał komponent React.
2.  **Utworzenie komponentu `RecipeForm`:** Stworzenie pliku `src/components/views/RecipeFormView/RecipeForm.tsx` z podstawową strukturą formularza przy użyciu komponentów `shadcn/ui` i `react-hook-form`.
3.  **Implementacja schematu walidacji:** Zdefiniowanie `recipeFormSchema` przy użyciu Zod w pliku z komponentem `RecipeForm`.
4.  **Stworzenie komponentu `IngredientsEditor`:** Utworzenie pliku `src/components/views/RecipeFormView/IngredientsEditor.tsx` i zintegrowanie go z `RecipeForm` za pomocą `useFieldArray`.
5.  **Stworzenie komponentu `ProductSearchInput`:** Utworzenie pliku `src/components/views/RecipeFormView/ProductSearchInput.tsx` (zakładając, że istnieje API do wyszukiwania produktów).
6.  **Implementacja logiki zapisu:** Dodanie funkcji `onSubmit` w `RecipeForm`, która będzie transformować dane z ViewModel na DTO, wysyłać żądanie `POST /api/recipes` i obsługiwać odpowiedź.
7.  **Obsługa przekierowania i powiadomień:** Zintegrowanie z `sonner` do wyświetlania powiadomień "toast" i implementacja przekierowania po pomyślnym zapisie.
8.  **Stylowanie i dopracowanie UX:** Dopracowanie wyglądu formularza, komunikatów o błędach i stanu ładowania przycisku zapisu.
9.  **Testowanie manualne:** Dokładne przetestowanie wszystkich ścieżek użytkownika, w tym walidacji i obsługi błędów.
