# Plan Testów dla Aplikacji HealthyMeal

**Wersja:** 1.0
**Data:** 23.10.2025
**Autor:** [Twoje Imię i Nazwisko], Inżynier QA

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje strategię, zakres, zasoby i harmonogram działań testowych dla aplikacji webowej HealthyMeal. Aplikacja ma na celu umożliwienie użytkownikom zarządzania przepisami kulinarnymi oraz generowania nowych przepisów przy użyciu sztucznej inteligencji.

### 1.2. Cele Testowania

Główne cele procesu testowego to:
- Zapewnienie wysokiej jakości i stabilności aplikacji przed wdrożeniem produkcyjnym.
- Weryfikacja, czy wszystkie wymagania funkcjonalne i niefunkcjonalne zostały spełnione.
- Identyfikacja, udokumentowanie i śledzenie defektów.
- Zapewnienie bezpieczeństwa danych użytkowników.
- Potwierdzenie niezawodności integracji z usługami zewnętrznymi (Supabase, Openrouter.ai).
- Zapewnienie pozytywnego doświadczenia użytkownika (UX) na różnych urządzeniach i przeglądarkach.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

- Moduł uwierzytelniania (rejestracja, logowanie, wylogowywanie, zarządzanie sesją).
- Pełen cykl życia przepisów (tworzenie, odczyt, aktualizacja, usuwanie - CRUD).
- Generator przepisów AI.
- Zarządzanie profilem użytkownika.
- Zarządzanie preferencjami żywieniowymi.
- Ochrona tras i API.
- Walidacja formularzy po stronie klienta i serwera.

### 2.2. Funkcjonalności wyłączone z testów

- Testy wydajnościowe usług zewnętrznych (Supabase, Openrouter.ai) - skupiamy się na integracji.
- Testy samego modelu językowego AI - weryfikujemy jedynie integrację i przetwarzanie odpowiedzi.

## 3. Typy Testów

Proces testowy zostanie podzielony na następujące poziomy i typy:

- **Testy Jednostkowe (Unit Tests)**: Weryfikacja pojedynczych funkcji, komponentów React i logiki w serwisach w izolacji od reszty systemu.
- **Testy Integracyjne (Integration Tests)**: Testowanie interakcji pomiędzy komponentami, np. komunikacji serwisu z klientem Supabase, czy poprawności działania endpointów API w Astro.
- **Testy End-to-End (E2E Tests)**: Automatyzacja scenariuszy z perspektywy użytkownika, symulująca jego interakcję z aplikacją w przeglądarce. Obejmą kluczowe ścieżki, takie jak rejestracja -> logowanie -> stworzenie przepisu -> wylogowanie.
- **Testy Bezpieczeństwa (Security Tests)**: Manualne i automatyczne testy weryfikujące odporność na podstawowe ataki (np. XSS, nieautoryzowany dostęp do API) oraz poprawność konfiguracji Row Level Security.
- **Testy Kompatybilności (Compatibility Tests)**: Weryfikacja poprawnego działania i wyświetlania aplikacji na najnowszych wersjach przeglądarek: Chrome, Firefox, Safari.
- **Testy Manualne (Manual Exploratory Tests)**: Ręczna eksploracja aplikacji w celu znalezienia błędów, które mogły zostać pominięte przez testy automatyczne, ze szczególnym uwzględnieniem UX/UI.

## 4. Scenariusze Testowe (Przykłady Wysokopoziomowe)

### 4.1. Uwierzytelnianie

- **Scenariusz 1 (Happy Path)**: Użytkownik pomyślnie rejestruje się, loguje, uzyskuje dostęp do chronionej strony, a następnie wylogowuje się.
- **Scenariusz 2**: Użytkownik próbuje zalogować się z nieprawidłowymi danymi i otrzymuje stosowny komunikat błędu.
- **Scenariusz 3**: Użytkownik próbuje zarejestrować się z zajętym adresem e-mail.
- **Scenariusz 4**: Niezalogowany użytkownik próbuje uzyskać dostęp do strony z przepisami i zostaje przekierowany na stronę logowania.

### 4.2. Zarządzanie Przepisami

- **Scenariusz 1 (Happy Path)**: Zalogowany użytkownik tworzy nowy przepis, wypełniając wszystkie wymagane pola, zapisuje go, a następnie widzi go na liście swoich przepisów.
- **Scenariusz 2**: Użytkownik edytuje istniejący przepis i weryfikuje, czy zmiany zostały zapisane.
- **Scenariusz 3**: Użytkownik usuwa przepis i potwierdza operację w oknie dialogowym.
- **Scenariusz 4**: Użytkownik próbuje zapisać formularz przepisu z nieprawidłowymi danymi (np. puste pola) i widzi komunikaty walidacyjne.

### 4.3. Generator AI

- **Scenariusz 1 (Happy Path)**: Użytkownik wprowadza preferencje, generuje przepis i otrzymuje poprawnie sformatowany wynik.
- **Scenariusz 2**: Aplikacja poprawnie obsługuje błąd odpowiedzi z API Openrouter i wyświetla użytkownikowi odpowiedni komunikat.

## 5. Środowisko Testowe

- **Baza Danych**: Oddzielny projekt w Supabase przeznaczony wyłącznie do celów testowych, z wyizolowaną bazą danych i skonfigurowanymi kluczami API.
- **Aplikacja**: Uruchomiona lokalnie lub na dedykowanym serwerze stagingowym w trybie produkcyjnym.
- **Przeglądarki**: Google Chrome (desktop), Mozilla Firefox (desktop), Safari (desktop/emulacja).

## 6. Narzędzia do Testowania

- **Framework do testów jednostkowych i integracyjnych**: [Vitest](https://vitest.dev/) (zgodny z ekosystemem Vite/Astro).
- **Biblioteka do testowania komponentów React**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- **Framework do testów E2E**: [Playwright](https://playwright.dev/).
- **Mockowanie API**: `msw` (Mock Service Worker) do mockowania zewnętrznych API (Supabase, Openrouter) w testach.
- **Zarządzanie Zgłoszeniami**: GitHub Issues.

## 7. Harmonogram Testów

Proces testowy będzie prowadzony równolegle z procesem deweloperskim, zgodnie z metodyką Agile.
- **Testy jednostkowe i integracyjne**: Pisane na bieżąco przez deweloperów w ramach każdego zadania.
- **Testy E2E**: Rozwijane iteracyjnie, wraz z dodawaniem nowych kluczowych funkcjonalności.
- **Faza testów regresji**: Przed każdym wydaniem zostanie przeprowadzony pełen cykl testów automatycznych oraz manualnych testów eksploracyjnych (ok. 1-2 dni).

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria wejścia

- Ukończono implementację funkcjonalności.
- Kod przeszedł code review.
- Aplikacja została pomyślnie zbudowana i wdrożona na środowisku testowym.

### 8.2. Kryteria wyjścia (gotowość do wdrożenia)

- 100% testów jednostkowych i integracyjnych zakończonych powodzeniem.
- 95% krytycznych i wysokopriorytetowych scenariuszy E2E zakończonych powodzeniem.
- Brak otwartych błędów o priorytecie krytycznym (Blocker) i wysokim (Critical).
- Wszystkie zidentyfikowane błędy zostały zaraportowane i ocenione przez zespół.

## 9. Role i Odpowiedzialności

- **Deweloperzy**: Odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla tworzonego przez siebie kodu.
- **Inżynier QA**: Odpowiedzialny za tworzenie i utrzymanie testów E2E, przeprowadzanie testów manualnych, zarządzanie procesem zgłaszania błędów oraz finalną akceptację jakości wersji.
- **Product Owner**: Odpowiedzialny za priorytetyzację błędów i akceptację funkcjonalności.

## 10. Procedury Raportowania Błędów

Wszystkie znalezione defekty będą raportowane jako "Issues" w repozytorium GitHub projektu.

Każde zgłoszenie powinno zawierać:
- **Tytuł**: Krótki, zwięzły opis problemu.
- **Opis**:
    - Kroki do reprodukcji błędu.
    - Oczekiwany rezultat.
    - Rzeczywisty rezultat.
- **Środowisko**: Wersja przeglądarki, system operacyjny.
- **Zrzuty ekranu/Nagrania wideo**: Jeśli to możliwe.
- **Etykiety**: `bug`, priorytet (`P0-Blocker`, `P1-Critical`, `P2-Major`, `P3-Minor`), nazwa modułu (np. `auth`, `recipes`).
