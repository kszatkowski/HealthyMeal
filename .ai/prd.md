# Dokument wymagań produktu (PRD) - HealthyMeal
## 1. Przegląd produktu
HealthyMeal to aplikacja mobilna w wersji MVP (Minimum Viable Product), której celem jest rozwiązywanie problemu czasochłonnego dostosowywania przepisów kulinarnych do indywidualnych potrzeb żywieniowych. Aplikacja wykorzystuje sztuczną inteligencję do generowania i modyfikowania przepisów w oparciu o zdefiniowane przez użytkownika preferencje, takie jak ulubione składniki, nielubiane produkty oraz alergeny.

Główne funkcjonalności aplikacji obejmują:
- Prosty system uwierzytelniania użytkowników oparty na adresie e-mail i haśle.
- Profil użytkownika z możliwością szczegółowego zdefiniowania preferencji żywieniowych.
- Moduł generatora przepisów AI, który tworzy spersonalizowane propozycje posiłków.
- System zarządzania przepisami (CRUD), umożliwiający zapisywanie, przeglądanie, edytowanie i usuwanie zarówno przepisów wygenerowanych przez AI, jak i dodanych ręcznie przez użytkownika.

## 2. Problem użytkownika
Użytkownicy, którzy chcą świadomie zarządzać swoją dietą, napotykają na problem z dostosowaniem ogólnodostępnych przepisów do swoich osobistych wymagań. Proces ten jest często manualny, frustrujący i wymaga wiedzy kulinarnej. Konieczność modyfikacji składników, unikania alergenów czy dopasowywania potraw do własnych upodobań smakowych sprawia, że gotowanie staje się wyzwaniem, a nie przyjemnością. HealthyMeal adresuje ten problem, automatyzując proces personalizacji przepisów i dostarczając gotowe, dopasowane rozwiązania.

## 3. Wymagania funkcjonalne
- FR-01: System Kont: Użytkownicy mogą zakładać konto, logować się i wylogowywać przy użyciu adresu e-mail i hasła.
- FR-02: Profil Preferencji: Użytkownik ma możliwość wpisania swoich preferencji w dwóch polach tekstowych ("nie lubię" oraz "alergeny"), po maksymalnie 200 znaków każde.
- FR-03: Generator AI: Dostępny jest formularz do generowania przepisów, który uwzględnia preferencje użytkownika. Formularz zawiera wymagane pole "rodzaj posiłku" oraz opcjonalne pola "główny składnik" i "poziom trudności".
- FR-04: Limit Zapytań AI: Każdy użytkownik ma dzienny limit 3 zapytań do generatora AI. Limit jest resetowany o północy.
- FR-05: Zarządzanie Przepisami (CRUD): Użytkownicy mogą tworzyć własne przepisy, zapisywać propozycje od AI, edytować wszystkie swoje przepisy oraz je usuwać.
- FR-06: Ustrukturyzowany Edytor: Edytor przepisów posiada oddzielne pola na składniki, ich ilości oraz instrukcje przygotowania w formie tekstowej.
- FR-07: Kategoryzacja: Wszystkie przepisy (własne i AI) są automatycznie kategoryzowane według "rodzaju posiłku" w celu ułatwienia przeglądania.
- FR-08: Onboarding: Nowi użytkownicy, którzy nie uzupełnili profilu preferencji, otrzymują nieinwazyjne powiadomienie z zachętą do jego wypełnienia. Powiadomienie można tymczasowo ukryć na 2 dni.

## 4. Granice produktu
Poniższe funkcjonalności nie wchodzą w zakres wersji MVP i mogą być rozważane w przyszłych iteracjach produktu:
- Import przepisów z zewnętrznych stron internetowych (URL).
- Obsługa multimediów, takich jak zdjęcia czy filmy do przepisów.
- Funkcje społecznościowe, w tym udostępnianie przepisów innym użytkownikom, komentowanie czy ocenianie.
- Zaawansowane opcje logowania (np. przez konta społecznościowe).

## 5. Historyjki użytkowników

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do spersonalizowanych funkcji.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. System waliduje poprawność formatu adresu e-mail.
  3. Hasło musi mieć co najmniej 8 znaków.
  4. System sprawdza, czy hasło i jego potwierdzenie są identyczne.
  5. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.

- ID: US-002
- Tytuł: Logowanie do aplikacji i bezpieczny dostęp
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do moich zapisanych przepisów i preferencji.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. Po poprawnym wprowadzeniu danych użytkownik zostaje zalogowany i przekierowany na stronę główną.
  3. W przypadku podania błędnych danych, wyświetlany jest komunikat o nieprawidłowym loginie lub haśle.
  4. Każda strona wymaga aktualnie zalogowanego użytkownika. Jedynym wyjątkiem jest rejestracja.
  5. Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).

- ID: US-003
- Tytuł: Zarządzanie preferencjami żywieniowymi
- Opis: Jako użytkownik, chcę móc zdefiniować w moim profilu, których produktów nie lubię, oraz które wywołują u mnie alergie, aby otrzymywać przepisy idealnie dopasowane do moich potrzeb.
- Kryteria akceptacji:
  1. W profilu użytkownika dostępne są dwie sekcje: "nie lubię" oraz "alergeny".
  2. Każda sekcja zawiera jedno pole tekstowe (pojedyncza linia lub textarea) do wpisania preferencji.
  3. Długość tekstu w każdym polu jest ograniczona do 200 znaków.
  4. System nie korzysta z predefiniowanej bazy produktów; użytkownik wpisuje własne nazwy składników.

- ID: US-004
- Tytuł: Onboarding i zachęta do uzupełnienia profilu
- Opis: Jako nowy użytkownik z nieuzupełnionym profilem, chcę otrzymywać dyskretne przypomnienie o konieczności wypełnienia preferencji, aby w pełni korzystać z możliwości personalizacji aplikacji.
- Kryteria akceptacji:
  1. Jeśli użytkownik nie uzupełnił pól "nie lubię" oraz "alergeny", na stronie głównej wyświetlane jest powiadomienie.
  2. Powiadomienie zawiera przycisk przenoszący do edycji profilu oraz opcję "Przypomnij mi później".
  3. Wybranie opcji "Przypomnij mi później" ukrywa powiadomienie na 2 dni.

- ID: US-005
- Tytuł: Generowanie przepisu przez AI
- Opis: Jako użytkownik, chcę móc wygenerować nowy przepis za pomocą AI, podając rodzaj posiłku, aby szybko znaleźć inspirację kulinarną zgodną z moimi preferencjami.
- Kryteria akceptacji:
  1. Formularz generowania zawiera pole wyboru "rodzaj posiłku" (wymagane) oraz opcjonalne pola tekstowe "główny składnik" i "poziom trudności".
  2. Wygenerowany przepis jest zgodny z preferencjami ("nie lubię", "alergeny") zdefiniowanymi w profilu użytkownika.
  3. Użytkownik może wygenerować maksymalnie 3 przepisy dziennie. Próba czwartego generowania skutkuje wyświetleniem komunikatu o limicie.
  4. Po wygenerowaniu przepisu, użytkownik widzi jego pełną treść (składniki, ilości, instrukcje) i ma możliwość jego edycji lub zapisania.

- ID: US-006
- Tytuł: Dodawanie własnego przepisu
- Opis: Jako użytkownik, chcę mieć możliwość dodania własnego, prywatnego przepisu do aplikacji, aby przechowywać wszystkie moje ulubione potrawy w jednym miejscu.
- Kryteria akceptacji:
  1. Formularz dodawania przepisu zawiera ustrukturyzowane pola: nazwa, rodzaj posiłku (do kategoryzacji), lista składników z ilościami oraz pole tekstowe na instrukcje.
  2. Po wypełnieniu formularza i zapisaniu, przepis pojawia się na liście moich przepisów w odpowiedniej kategorii.

- ID: US-007
- Tytuł: Edycja przepisu
- Opis: Jako użytkownik, chcę móc edytować każdy przepis (zarówno własny, jak i wygenerowany przez AI) przed i po zapisaniu, aby dostosować go idealnie do moich oczekiwań.
- Kryteria akceptacji:
  1. Każdy przepis na liście oraz na ekranie szczegółów ma opcję "Edytuj".
  2. Ekran edycji wygląda tak samo jak formularz dodawania przepisu i pozwala na modyfikację wszystkich pól.
  3. Zapisane zmiany nadpisują poprzednią wersję przepisu.

- ID: US-008
- Tytuł: Przeglądanie listy przepisów
- Opis: Jako użytkownik, chcę móc przeglądać listę moich zapisanych przepisów, pogrupowanych według kategorii, aby łatwo odnaleźć poszukiwaną potrawę i zarządzać nią.
- Kryteria akceptacji:
  1. Główny widok po zalogowaniu (`/`) przedstawia listę przepisów użytkownika w formie siatki kart.
  2. Użytkownik może filtrować przepisy według "rodzaju posiłku".
  3. Kliknięcie na kartę przepisu (poza przyciskami akcji) przenosi do widoku szczegółów (zgodnie z US-009).
  4. Każda karta przepisu zawiera przyciski akcji "Edytuj" i "Usuń".

- ID: US-009
- Tytuł: Przeglądanie szczegółów przepisu
- Opis: Jako użytkownik, chcę mieć dostęp do szczegółowego widoku przepisu, aby zobaczyć wszystkie jego składniki, instrukcje przygotowania oraz mieć możliwość zarządzania nim.
- Kryteria akceptacji:
  1. Widok szczegółów przepisu (`/recipes/[id]`) jest dostępny po kliknięciu w kartę przepisu na liście.
  2. Widok wyświetla pełne informacje: nazwę, rodzaj posiłku, poziom trudności, listę składników z ilościami oraz instrukcje krok po kroku.
  3. W widoku dostępne są przyciski akcji "Edytuj" i "Usuń".
  4. Przycisk "Edytuj" przekierowuje na stronę edycji przepisu (`/recipes/[id]/edit`).
  5. Przycisk "Usuń" inicjuje modal z prośbą o potwierdzenie usunięcia przepisu.
  6. Widok jest dostępny tylko dla właściciela przepisu.

- ID: US-010
- Tytuł: Nawigacja w aplikacji i zarządzanie sesją
- Opis: Jako zalogowany użytkownik, chcę mieć dostęp do paska nawigacyjnego z przyciskami do zarządzania preferencjami i wylogowania, aby łatwo poruszać się po aplikacji i zarządzać swoją sesją.
- Kryteria akceptacji:
  1. Navigation Bar jest wyświetlany na wszystkich stronach aplikacji po zalogowaniu i jest przyklejony do górnej krawędzi strony podczas przewijania. Navigation Bar powinien znaleźć się w głównym layoucie aplikacji Layout.astro.
  2. Po prawej stronie Navigation Bar znajdują się dwa przyciski: "Preferencje" i "Wyloguj".
  3. Kliknięcie przycisku "Preferencje" przekierowuje użytkownika do strony zarządzania preferencjami.
  4. Kliknięcie przycisku "Wyloguj" powoduje zakończenie sesji użytkownika i automatyczne przekierowanie na stronę logowania.

## 6. Metryki sukcesu
Kluczowe wskaźniki efektywności (KPI), które będą mierzyć sukces produktu w wersji MVP, to:
- Zaangażowanie w personalizację: 90% zarejestrowanych użytkowników posiada wypełnione obie obowiązkowe kategorie w profilu preferencji ("nie lubię" oraz "alergeny").
- Regularne korzystanie z kluczowej funkcji: 75% aktywnych użytkowników generuje co najmniej jeden przepis za pomocą modułu AI w ciągu tygodnia.
