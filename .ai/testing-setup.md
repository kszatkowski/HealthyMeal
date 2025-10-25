# Testing Environment Setup - HealthyMeal

Dokument podsumowujący konfigurację testów jednostkowych i E2E w projekcie.

## ✅ Co zostało skonfigurowane

### 1. Pakiety (Dependencies)
- **Vitest v2.1.5** - test runner dla testów jednostkowych
- **@vitest/ui** - interfejs UI dla Vistesta
- **@testing-library/react** - utilities do testowania komponentów React
- **@testing-library/user-event** - symulacja akcji użytkownika
- **@testing-library/jest-dom** - custom matchers dla DOM
- **jsdom** - DOM implementation dla node.js
- **happy-dom** - alternatywna DOM implementation
- **@vitejs/plugin-react** - React plugin dla Vite
- **@playwright/test** - Playwright test framework
- **TypeScript 5.7.3** - statyczne typowanie

### 2. Pliki Konfiguracyjne

#### `vitest.config.ts`
- Globalne testy z `globals: true`
- Środowisko `jsdom` dla DOM testing
- Setup file: `src/test/setup.ts`
- Wzorzec plików: `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- Coverage tracking (próg 70%)
- Inline deps dla @radix-ui

#### `playwright.config.ts`
- Przeglądarka: Chromium (Desktop Chrome)
- Katalog testów: `src/e2e`
- Wzorzec plików: `**/*e2e.spec.ts`
- Reporters: HTML, JSON, JUnit, list
- Trace: on-first-retry
- Screenshot: only-on-failure
- Video: retain-on-failure
- Web server: Astro dev (localhost:3000)

#### `tsconfig.json`
- Dodane types: `["vitest/globals", "@testing-library/jest-dom"]`
- Lib: `["ES2020", "DOM", "DOM.Iterable"]`

### 3. Setup i Utilities

#### `src/test/setup.ts`
- Import `@testing-library/jest-dom/vitest`
- Cleanup po każdym teście
- Mocks dla `window.matchMedia`
- Mock `window.scrollTo`
- Mock `IntersectionObserver`
- Mock `ResizeObserver`
- Supresja console errors w testach

#### `src/test/test-utils.tsx`
- Custom render function z wrapper'ami
- Re-export z `@testing-library/react`

### 4. Pliki Demonstracyjne

#### `src/test/examples/example.test.ts`
- Testy jednostkowe podstawowych funkcji
- Przykłady mocków z `vi.fn()` i `vi.spyOn()`
- Inline snapshots
- Mocking implementacji
- Error handling z guard clauses
- Type checking w testach

#### `src/test/examples/example-component.test.tsx`
- Testy komponentu Counter
- Testy formularza LoginForm
- Testowanie interakcji użytkownika
- Accessible selectors (`getByRole()`)
- Accessibility testy
- State management testy

#### `src/e2e/examples/example.e2e.spec.ts`
- Page Object Model pattern (HomePage, LoginPage)
- Navigacja i weryfikacja stron
- Screenshot'y dla visual testing
- Testowanie flow'u logowania
- Lokalizatory dla resilience
- Test hooks (setup/teardown)
- API testing z `waitForResponse()`
- Trace viewer dla debugowania
- Parallel execution examples

### 5. NPM Scripts

```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:debug": "playwright test --debug",
  "e2e:codegen": "playwright codegen http://localhost:3000"
}
```

### 6. Git Ignore

Dodane do `.gitignore`:
- `coverage/` - pokrycie kodu
- `.nyc_output/` - NYC coverage output
- `.vitest/` - cache Vistesta
- `test-results/` - wyniki testów
- `playwright-report/` - raport Playwright
- `blob-report/` - blob report

### 7. Dokumentacja

#### `TEST_GUIDE.md`
- Komprehensywny przewodnik do testowania
- Instrukcje dla Vistesta
- Instrukcje dla Playwright
- Best practices
- Rozwiązywanie problemów
- Przykłady kodu

#### `.ai/testing-setup.md` (ten plik)
- Podsumowanie konfiguracji

## 🚀 Jak Zacząć

### Pierwsza Sesja - Uruchomienie Testów

```bash
# 1. Zainstaluj dependencies (jeśli nie są zainstalowane)
npm install

# 2. Uruchom testy jednostkowe w watch mode
npm run test:watch

# 3. (W innym terminalu) Uruchom dev server
npm run dev

# 4. W trzecim terminalu uruchom testy E2E
npm run e2e:ui
```

### Struktura Katalogów

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx          # ← Testy komponentów tutaj
├── lib/
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts          # ← Testy serwisów tutaj
│   └── utils.ts
├── test/                         # ← Konfiguracja testów
│   ├── setup.ts
│   ├── test-utils.tsx
│   └── examples/
│       ├── example.test.ts
│       └── example-component.test.tsx
└── e2e/                         # ← Testy E2E
    ├── examples/
    │   └── example.e2e.spec.ts
    └── pages/                   # ← Page Objects tutaj
        └── HomePage.ts
```

## 📋 Konwencje Nazewnictwa

### Testy Jednostkowe
- `ComponentName.test.tsx` - test komponentu React
- `functionName.test.ts` - test funkcji/servisu
- `moduleName.spec.ts` - test modułu

### Testy E2E
- `featureName.e2e.spec.ts` - test feature'u

## 🎯 Reguły Testowania

### Vitest (z `.cursor/rules/vitest-unit-testing.mdc`)
1. ✅ Używaj `vi.fn()` dla mocków funkcji
2. ✅ Używaj `vi.spyOn()` do monitorowania
3. ✅ Umieszczaj moki na górze pliku
4. ✅ Struktura: Arrange → Act → Assert
5. ✅ Guard clauses dla walidacji
6. ✅ Inline snapshots dla czytelności
7. ❌ Nie testuj detali implementacji
8. ❌ Nie tworz zbyt dużych testów

### Playwright (z `.cursor/rules/playwright-e2e-testing.mdc`)
1. ✅ Tylko przeglądarka Chromium
2. ✅ Browser contexts dla izolacji
3. ✅ Page Object Model pattern
4. ✅ Locators zamiast selektorów CSS
5. ✅ API testing dla validacji
6. ✅ Visual comparisons
7. ✅ Trace viewer do debugowania
8. ✅ Parallel execution

## ⚙️ Konfiguracyjne Progi

### Coverage Thresholds (Vitest)
```
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%
```

### Timeouts
- Vitest: default
- Playwright: 30s per test
- Web server: 120s startup

## 🔗 Dokumentacja

- **TEST_GUIDE.md** - Pełny przewodnik testowania
- **.cursor/rules/vitest-unit-testing.mdc** - Reguły Vitest
- **.cursor/rules/playwright-e2e-testing.mdc** - Reguły Playwright
- **vitest.config.ts** - Konfiguracja Vitest
- **playwright.config.ts** - Konfiguracja Playwright

## 🐛 Troubleshooting

Jeśli coś nie działa, sprawdź:
1. Czy `node_modules` są zainstalowane? `npm install`
2. Czy testy są w poprawnym katalogu?
3. Czy dev server jest uruchomiony dla testów E2E?
4. Czy używasz poprawnych importunów z `test-utils.tsx`?

Pełne rozwiązania problemów w `TEST_GUIDE.md`.

## 📊 Następne Kroki

1. Zapoznaj się z przykładowymi testami w `src/test/examples/`
2. Przeczytaj `TEST_GUIDE.md` dla szczegółów
3. Zapoznaj się z wytycznymi w `.cursor/rules/`
4. Zacznij pisać testy dla istniejących komponentów
5. Dodaj testy E2E dla głównych flow'ów użytkownika

---

**Data Setup:** October 25, 2025
**Tech Stack:** Vitest 2.1.5, Playwright 1.48.0, React Testing Library 16.0.1

## 🔧 Ważna Konfiguracja

### Vitest Integration z Astro
- **Używamy `defineConfig` zamiast `getViteConfig`** - to zapewnia poprawną integrację Vistesta z Astro bez konfliktów plugin'ów
- Plik konfiguracyjny: `vitest.config.ts` (używa `defineConfig` z 'vitest/config')
- ✅ To rozwiązuje błąd: `Cannot read properties of undefined (reading 'name')`
