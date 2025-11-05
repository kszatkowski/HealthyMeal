# Plan implementacji widoku Formularza Przepisu (tekstowe składniki)

Zmiana wymagań usuwa zależność od predefiniowanej bazy produktów. Widok tworzenia przepisu powinien zatem korzystać z prostego pola tekstowego na składniki. Dokument opisuje aktualny plan implementacji zgodny z nowym modelem danych.

## 1. Przegląd

Widok umożliwia stworzenie nowego przepisu lub edycję wstępnie wygenerowanego przepisu AI. Formularz zawiera pola: nazwa, rodzaj posiłku, poziom trudności, składniki (textarea), instrukcje (textarea) oraz przełącznik `isAiGenerated` (ukryty / kontrolowany przez logikę). Po zapisaniu użytkownik wraca do listy przepisów.

## 2. Routing

- **Nowy przepis**: `/recipes/new`
- **Edycja istniejącego**: `/recipes/[id]/edit` (reused formularz)
- Strona Astro: `src/pages/recipes/new.astro` osadzająca komponent React `RecipeForm` z dyrektywą `client:load`.

## 3. Struktura komponentów

```
recipes/new.astro
└── Layout.astro
    └── RecipeForm (client:load)
        ├── Input (nazwa)
        ├── Select (rodzaj posiłku)
        ├── Select (poziom trudności)
        ├── Textarea (składniki)
        ├── Textarea (instrukcje)
        └── Button (zapisz)
```

## 4. Komponent `RecipeForm`

- **Lokalizacja**: `src/components/views/RecipeFormView/RecipeForm.tsx`
- **Biblioteki**: `react-hook-form`, `zod`, komponenty `shadcn/ui` (`Input`, `Select`, `Textarea`, `Button`, `Form`, `FormField`, `FormMessage`).
- **Stany specjalne**:
  - `isSubmitting` (disable przycisk, pokaż spinner w przycisku)
  - `isPrefilledFromAI` (opcjonalny banner informujący użytkownika)
- **Obsługa AI**: jeżeli w `sessionStorage` pod kluczem `ai-generated-recipe` znajdują się dane, użyj `form.reset` i oznacz formularz jako prefill.

## 5. Schemat walidacji

```ts
const recipeFormSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(50),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'snack']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z
    .string()
    .min(1, 'Lista składników jest wymagana')
    .max(1000, 'Lista składników może mieć maksymalnie 1000 znaków'),
  instructions: z
    .string()
    .min(1, 'Instrukcje są wymagane')
    .max(5000, 'Instrukcje mogą mieć maksymalnie 5000 znaków'),
  isAiGenerated: z.boolean().default(false),
});

type RecipeFormViewModel = z.infer<typeof recipeFormSchema>;
```

- Walidacja odbywa się po stronie klienta (Zod + `@hookform/resolvers/zod`) oraz jest zgodna z API.
- Dodaj pomocniczy formatter, który zapewni, że każda linia składników ma format `Nazwa - ilość jednostka` (opcjonalny placeholder zamiast hard walidacji).

## 6. Obsługa zdarzeń

- `onSubmit`:
  1. Waliduj dane (`handleSubmit`).
  2. Wysyłaj `POST /api/recipes` z `RecipeCreateCommand` (zawiera `ingredients` jako tekst).
  3. Po sukcesie: pokaż toast `sonner`, wyczyść `sessionStorage`, nawiguj do `/`.
  4. Po błędzie: wyświetl toast z treścią błędu, zresetuj `isSubmitting`.
- `useEffect` inicjalizujący formularz danymi z AI (jak w poprzednim planie).

## 7. UI/UX

- Dla pól `ingredients` i `instructions` pokaż liczniki znaków (`value.length / limit`).
- Placeholder składników (np. `"Jajka - 2 szt\nMasło - 20 g"`).
- Zadbaj o responsywne rozmieszczenie pól (w mobilnym widoku wszystkie elementy w jednej kolumnie).
- Komunikaty błędów poniżej pól `Textarea`.

## 8. Integracja API

- **POST `/api/recipes`** – payload zgodny z `RecipeCreateCommand` (już tekstowe składniki).
- **PUT `/api/recipes/[id]`** – reużywa tego samego ViewModelu podczas edycji.
- Ustaw `Content-Type: application/json`, korzystaj z `fetch` (lub dedykowanego klienta API jeśli istnieje).

## 9. Testy

- **Unit**: testy `RecipeForm` przy użyciu React Testing Library – happy path, walidacja limitów znaków, obsługa błędów.
- **Integration**: testy serwisu/form hooków, verifying transform `RecipeFormViewModel → RecipeCreateCommand`.
- **E2E (Playwright)**: scenariusz dodania przepisu z tekstową listą składników oraz scenariusz walidacji (np. zbyt długie pole `ingredients`).

## 10. Kroki wdrożenia

1. Utwórz/zmodyfikuj komponent `RecipeForm` z nową strukturą pól.
2. Usuń stare komponenty (`IngredientsEditor`, `ProductSearchInput`) oraz związane z nimi typy/hooki.
3. Uaktualnij importy w `recipes/new.astro` i `recipes/[id]/edit.astro`.
4. Zaktualizuj istniejące hooki i serwisy, aby nie oczekiwały tablicy składników.
5. Zastąp w testach referencje do comboboxa na zwykłe textarea input.
6. Ręcznie przetestuj przepływy: dodanie, edycja, formularz wypełniony przez AI.
7. Uruchom `npm run test` oraz `npm run e2e`.

