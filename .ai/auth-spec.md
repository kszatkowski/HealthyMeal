# Specyfikacja Techniczna Modułu Uwierzytelniania - HealthyMeal

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania dla aplikacji HealthyMeal. Specyfikacja bazuje na wymaganiach zawartych w pliku PRD (historyjki US-001 i US-002) oraz na zdefiniowanym stosie technologicznym (Astro, React, Supabase).

Celem jest stworzenie bezpiecznego i wydajnego systemu rejestracji, logowania, wylogowywania oraz ochrony zasobów aplikacji, zintegrowanego z Astro i Supabase Auth.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty (Astro)

Architektura frontendu zostanie rozszerzona o nowe strony dedykowane procesom uwierzytelniania oraz modyfikację istniejących layoutów w celu obsługi stanu zalogowanego i niezalogowanego użytkownika.

-   **`src/pages/login.astro` (Nowa)**
    -   **Cel:** Wyświetlenie formularza logowania.
    -   **Layout:** Będzie używać nowego `src/layouts/AuthLayout.astro`, który zawierać będzie tylko podstawową strukturę HTML bez elementów nawigacyjnych przeznaczonych dla zalogowanych użytkowników.
    -   **Komponent:** Osadzi komponent `src/components/auth/LoginForm.tsx` (client-side React).

-   **`src/pages/register.astro` (Nowa)**
    -   **Cel:** Wyświetlenie formularza rejestracji.
    -   **Layout:** Również będzie używać `src/layouts/AuthLayout.astro`.
    -   **Komponent:** Osadzi komponent `src/components/auth/RegisterForm.tsx` (client-side React).

-   **`src/layouts/Layout.astro` (Modyfikacja)**
    -   **Cel:** Główny layout aplikacji dla zalogowanych użytkowników.
    -   **Zmiany:** Zostanie dodana logika warunkowa, która na podstawie danych o sesji użytkownika (przekazanych z middleware przez `Astro.locals`) będzie renderować komponent `Navbar.tsx` z nawigacją.

-   **`src/layouts/AuthLayout.astro` (Nowy)**
    -   **Cel:** Uproszczony layout dla stron `login` i `register`.
    -   **Struktura:** Minimalna struktura HTML, nagłówek z logo aplikacji, wyśrodkowany kontener na formularz. Brak paska nawigacyjnego.

### 2.2. Komponenty (React)

Interaktywne elementy formularzy zostaną zaimplementowane jako komponenty React, co pozwoli na dynamiczną walidację i komunikację z backendem bez przeładowywania strony.

-   **`src/components/auth/LoginForm.tsx` (Nowy)**
    -   **Struktura:** Zbudowany przy użyciu komponentów `Card`, `Input`, `Button` z `shadcn/ui`.
    -   **Pola:** Email, Hasło.
    -   **Logika:**
        -   Zarządzanie stanem formularza (np. przy użyciu `react-hook-form`).
        -   Walidacja po stronie klienta z użyciem biblioteki `zod` (np. sprawdzanie formatu e-mail, wymagane pola).
        -   Obsługa wysyłki formularza: wywołanie `POST /api/auth/login` za pomocą `fetch`.
        -   Obsługa odpowiedzi: w przypadku sukcesu, przekierowanie na stronę główną (`/`); w przypadku błędu, wyświetlenie komunikatu

-   **`src/components/auth/RegisterForm.tsx` (Nowy)**
    -   **Struktura:** Analogiczna do `LoginForm.tsx`.
    -   **Pola:** Email, Hasło, Potwierdź Hasło.
    -   **Logika:**
        -   Walidacja `zod`: format e-mail, minimalna długość hasła (8 znaków), zgodność haseł.
        -   Obsługa wysyłki formularza: wywołanie `POST /api/auth/register`.
        -   Obsługa odpowiedzi: w przypadku sukcesu, automatyczne zalogowanie i przekierowanie na stronę główną; w przypadku błędu (np. użytkownik już istnieje), wyświetlenie stosownego komunikatu.

-   **`src/components/layout/Navbar.tsx` (Nowy)**
    -   **Cel:** Pasek nawigacyjny dla zalogowanego użytkownika.
    -   **Struktura:** Komponent React renderowany w `Layout.astro`.
    -   **Elementy:** Link "Preferencje" kierujący do profilu użytkownika, przycisk "Wyloguj".
    -   **Logika przycisku "Wyloguj":**
        -   Wywołanie `POST /api/auth/logout`.
        -   Po otrzymaniu pomyślnej odpowiedzi, przekierowanie użytkownika do `/login`.

### 2.3. Scenariusze i Obsługa Błędów

-   **Walidacja:** Komunikaty o błędach walidacji (np. "Nieprawidłowy format e-mail", "Hasło musi mieć co najmniej 8 znaków") będą wyświetlane bezpośrednio pod odpowiednimi polami formularza.
-   **Błędy API:** Ogólne błędy (np. "Nieprawidłowy login lub hasło", "Użytkownik o tym adresie e-mail już istnieje") będą wyświetlane jako komponent `Alert` z `shadcn/ui` nad przyciskiem "Zaloguj" / "Zarejestruj".
-   **Przekierowania:** Po pomyślnej autentykacji (logowanie, rejestracja) strona zostanie przeładowana i przekierowana na stronę główną.

## 3. Logika Backendowa

Backend zostanie zrealizowany w oparciu o Astro API Routes (server endpoints), które będą komunikować się z Supabase Auth.

### 3.1. Endpointy API

-   **`src/pages/api/auth/register.ts`**
    -   **Metoda:** `POST`
    -   **Payload:** `{ email: string, password: string }`
    -   **Logika:**
        1.  Walidacja danych wejściowych przy użyciu `zod`.
        2.  Wywołanie funkcji `supabase.auth.signUp()` z przekazanymi danymi.
        3.  Jeśli rejestracja się powiedzie, Supabase automatycznie utworzy sesję. Endpoint odczyta ją i ustawi w `Astro.cookies`.
        4.  Zwraca status `200 OK` w przypadku sukcesu lub `400 Bad Request` / `409 Conflict` z odpowiednim komunikatem błędu.

-   **`src/pages/api/auth/login.ts`**
    -   **Metoda:** `POST`
    -   **Payload:** `{ email: string, password: string }`
    -   **Logika:**
        1.  Walidacja danych wejściowych.
        2.  Wywołanie `supabase.auth.signInWithPassword()`.
        3.  Jeśli logowanie się powiedzie, sesja zostanie ustawiona w `Astro.cookies`.
        4.  Zwraca status `200 OK` lub `401 Unauthorized` w przypadku niepowodzenia.

-   **`src/pages/api/auth/logout.ts`**
    -   **Metoda:** `POST`
    -   **Logika:**
        1.  Wywołanie `supabase.auth.signOut()`.
        2.  Usunięcie ciasteczka sesji za pomocą `Astro.cookies.delete()`.
        3.  Zwraca status `200 OK`.

### 3.2. Walidacja i Modele Danych

Do walidacji danych wejściowych po stronie serwera zostanie użyta biblioteka `zod`, co zapewni spójność z walidacją na frontendzie i ochroni API przed nieprawidłowymi danymi.

```typescript
// src/lib/schemas/auth.schema.ts

import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu e-mail.'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków.'),
});

export const LoginSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu e-mail.'),
  password: z.string().min(1, 'Hasło jest wymagane.'),
});
```

## 4. System Uwierzytelniania (Integracja z Supabase)

### 4.1. Konfiguracja Klienta Supabase

-   **`src/db/supabase.server.ts`:** Utworzony zostanie serwerowy klient Supabase, który będzie używany w middleware i endpointach API. Będzie on skonfigurowany do odczytywania i zapisywania sesji z ciasteczek HTTP.
-   **Zmienne środowiskowe:** Klucze `SUPABASE_URL` i `SUPABASE_ANON_KEY` będą przechowywane w pliku `.env` i wykorzystywane do inicjalizacji klienta.

### 4.2. Middleware

Centralnym punktem logiki uwierzytelniania będzie Astro Middleware.

-   **`src/middleware/index.ts`**
    -   **Logika:**
        1.  Middleware będzie uruchamiany dla każdego żądania.
        2.  Definiuje publiczne ścieżki (np. `/login`, `/register`, `/api/auth/*`).
        3.  Dla wszystkich innych ścieżek, middleware będzie próbował odczytać sesję użytkownika z ciasteczek za pomocą klienta Supabase.
        4.  **Jeśli użytkownik nie jest zalogowany:** Nastąpi przekierowanie do `/login`.
        5.  **Jeśli użytkownik jest zalogowany:**
            -   Dane użytkownika i sesji zostaną umieszczone w `Astro.locals` (np. `context.locals.user`), dzięki czemu będą dostępne wewnątrz każdej chronionej strony Astro.
            -   Jeśli zalogowany użytkownik spróbuje wejść na `/login` lub `/register`, zostanie przekierowany na stronę główną (`/`).
        6.  Przejście do następnego kroku (`next()`).

Ta architektura zapewnia solidne podstawy pod bezpieczny i skalowalny system uwierzytelniania, wykorzystując nowoczesne praktyki i w pełni integrując się z wybranym stosem technologicznym.
