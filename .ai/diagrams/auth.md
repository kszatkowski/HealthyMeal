<authentication_analysis>
1.  **Przepływy autentykacji**:
    -   **Rejestracja**: Nowy użytkownik tworzy konto za pomocą adresu e-mail i hasła. Po pomyślnej rejestracji jest automatycznie logowany.
    -   **Logowanie**: Zarejestrowany użytkownik loguje się, podając swój e-mail i hasło.
    -   **Wylogowywanie**: Zalogowany użytkownik kończy swoją sesję.
    -   **Zarządzanie sesją**: Middleware chroni trasy, sprawdzając ważność sesji (tokenu) w ciasteczkach przy każdym żądaniu.
    -   **Odświeżanie tokenu**: Biblioteka kliencka Supabase automatycznie zarządza odświeżaniem wygasłych tokenów dostępowych, o ile token odświeżający jest nadal ważny.

2.  **Główni aktorzy i ich interakcje**:
    -   **Przeglądarka (Użytkownik)**: Inicjuje żądania, przesyła formularze (logowanie/rejestracja) i przechowuje tokeny sesji w ciasteczkach (cookies).
    -   **Astro Middleware**: Działa jako strażnik dla chronionych stron. Przechwytuje każde żądanie, weryfikuje sesję z ciasteczek i przekierowuje niezalogowanych użytkowników. Udostępnia dane sesji do stron przez `Astro.locals`.
    -   **Astro API**: Zestaw endpointów (`/api/auth/*`) obsługujących logikę rejestracji, logowania i wylogowywania poprzez komunikację z Supabase Auth. Odpowiedzialne za ustawianie i usuwanie ciasteczek sesji.
    -   **Supabase Auth**: Usługa backendowa, która zarządza tożsamościami użytkowników, uwierzytelnianiem, wydawaniem i weryfikacją tokenów JWT (access & refresh tokens).

3.  **Procesy weryfikacji i odświeżania tokenów**:
    -   Middleware przy każdym żądaniu do chronionej trasy używa serwerowego klienta Supabase do odczytania i zweryfikowania sesji z ciasteczek HTTP.
    -   Jeśli token dostępowy wygasł, klient Supabase automatycznie próbuje go odświeżyć, używając tokenu odświeżającego.
    -   Jeśli odświeżenie się powiedzie, nowe tokeny są zapisywane w ciasteczkach, a sesja jest kontynuowana.
    -   Jeśli odświeżenie się nie powiedzie (np. token odświeżający również wygasł), użytkownik jest traktowany jako niezalogowany i przekierowywany na stronę logowania.

4.  **Opis kroków autentykacji**:
    -   **Logowanie**: Użytkownik wysyła formularz z danymi. Astro API wywołuje `signInWithPassword` w Supabase. Jeśli dane są poprawne, Supabase zwraca sesję, a Astro API zapisuje ją w ciasteczkach i zwraca sukces, co powoduje przekierowanie na stronę główną.
    -   **Dostęp do chronionej strony**: Middleware sprawdza ciasteczka. Jeśli sesja jest ważna (lub zostanie pomyślnie odświeżona), żądanie jest przepuszczane dalej. W przeciwnym razie następuje przekierowanie do `/login`.
    -   **Wylogowanie**: Użytkownik inicjuje akcję wylogowania. Astro API wywołuje `signOut` w Supabase, co unieważnia tokeny, a następnie usuwa ciasteczko sesji.
</authentication_analysis>

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber

    participant Browser
    participant Middleware
    participant Astro API
    participant Supabase Auth

    %% === Przepływ logowania ===
    Note over Browser, Supabase Auth: Przepływ logowania użytkownika

    Browser->>Astro API: POST /api/auth/login (email, hasło)
    activate Astro API

    Astro API->>Supabase Auth: signInWithPassword(email, hasło)
    activate Supabase Auth
    Supabase Auth-->>Astro API: Sesja (access & refresh token)
    deactivate Supabase Auth

    Astro API->>Browser: Odpowiedź 200 OK + Ustawienie Ciasteczek Sesji
    deactivate Astro API

    Browser->>Browser: Przekierowanie na stronę główną ('/')

    %% === Dostęp do chronionej strony (sesja ważna) ===
    Note over Browser, Supabase Auth: Dostęp do chronionej strony (sesja ważna)
    
    Browser->>Middleware: GET /chroniona-strona
    activate Middleware

    Middleware->>Supabase Auth: Walidacja tokenu z ciasteczek
    activate Supabase Auth
    Supabase Auth-->>Middleware: Token jest prawidłowy
    deactivate Supabase Auth
    
    Middleware->>Browser: Zwrócenie chronionej strony (200 OK)
    deactivate Middleware

    %% === Dostęp do chronionej strony (token wygasł, odświeżenie) ===
    Note over Browser, Supabase Auth: Dostęp do chronionej strony (token wygasł, odświeżenie)

    Browser->>Middleware: GET /chroniona-strona
    activate Middleware

    Middleware->>Supabase Auth: Walidacja tokenu z ciasteczek
    activate Supabase Auth

    alt Token dostępowy wygasł
        Supabase Auth->>Supabase Auth: Użycie refresh tokena do wygenerowania nowej sesji
        Supabase Auth-->>Middleware: Nowa sesja (nowy access & refresh token)
    end
    deactivate Supabase Auth
    
    Middleware->>Browser: Odpowiedź 200 OK (z zaktualizowanymi ciasteczkami)
    deactivate Middleware

    %% === Dostęp do chronionej strony (sesja nieważna) ===
    Note over Browser, Supabase Auth: Dostęp do chronionej strony (sesja nieważna)

    Browser->>Middleware: GET /chroniona-strona
    activate Middleware

    Middleware->>Supabase Auth: Walidacja tokenu z ciasteczek
    activate Supabase Auth
    Supabase Auth-->>Middleware: Sesja nieważna (odświeżenie nieudane)
    deactivate Supabase Auth

    Middleware->>Browser: Przekierowanie na /login (302 Found)
    deactivate Middleware

    %% === Przepływ wylogowania ===
    Note over Browser, Supabase Auth: Przepływ wylogowania użytkownika

    Browser->>Astro API: POST /api/auth/logout
    activate Astro API

    Astro API->>Supabase Auth: signOut()
    activate Supabase Auth
    Supabase Auth-->>Astro API: Potwierdzenie wylogowania
    deactivate Supabase Auth

    Astro API->>Browser: Odpowiedź 200 OK + Usunięcie Ciasteczek Sesji
    deactivate Astro API

    Browser->>Browser: Przekierowanie na stronę logowania ('/login')

```
</mermaid_diagram>
