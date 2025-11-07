# Plan Testów dla Aplikacji "10x-cards"

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji webowej "10x-cards", która jest narzędziem do tworzenia i nauki z fiszek. Plan obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie wysokiej jakości, niezawodności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym. Projekt oparty jest na stosie technologicznym obejmującym Astro, React, TypeScript, Tailwind CSS oraz Supabase jako backend.

### 1.2. Cele testowania

Główne cele procesu testowania to:

- **Weryfikacja funkcjonalna**: Upewnienie się, że wszystkie funkcjonalności aplikacji działają zgodnie z wymaganiami, w tym uwierzytelnianie, zarządzanie fiszkami, generowanie AI oraz tryb nauki.
- **Zapewnienie jakości UI/UX**: Sprawdzenie, czy interfejs użytkownika jest intuicyjny, spójny, responsywny i wolny od defektów wizualnych na kluczowych urządzeniach i przeglądarkach.
- **Identyfikacja i eliminacja błędów**: Wykrycie, zaraportowanie i śledzenie błędów w celu ich naprawy przed wydaniem.
- **Ocena wydajności**: Weryfikacja, czy aplikacja działa płynnie, a czasy odpowiedzi serwera są akceptowalne.
- **Weryfikacja bezpieczeństwa**: Upewnienie się, że dane użytkowników są bezpieczne i że aplikacja jest odporna na podstawowe ataki.
- **Zapewnienie stabilności**: Sprawdzenie, czy aplikacja jest stabilna i potrafi poprawnie obsługiwać błędy oraz sytuacje wyjątkowe (np. problemy z siecią, błędy API).

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- Moduł uwierzytelniania (rejestracja, logowanie, wylogowywanie, ochrona tras).
- Zarządzanie fiszkami (tworzenie, odczyt, aktualizacja, usuwanie - CRUD).
- Operacje wsadowe na fiszkach (np. masowe usuwanie).
- Generowanie fiszek przy użyciu AI (na podstawie tematu).
- Akceptacja i odrzucanie wygenerowanych propozycji.
- Tryb nauki (przeglądanie fiszek, ocenianie odpowiedzi, śledzenie postępów).
- Walidacja danych wejściowych po stronie klienta i serwera.
- Responsywność interfejsu użytkownika (RWD).

### 2.2. Funkcjonalności wyłączone z testów

- Testy obciążeniowe na dużą skalę (poza zakresem MVP).
- Testy integracji z zewnętrznymi dostawcami usług, które nie są kluczowe dla działania aplikacji (np. systemy analityczne, jeśli zostaną dodane).

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests)**: Weryfikacja pojedynczych funkcji, komponentów i hooków w izolacji. Skupią się na logice biznesowej w serwisach (`*.service.ts`), funkcjach pomocniczych (`utils.ts`) oraz logice komponentów React.
- **Testy komponentów (Component Tests)**: Testowanie komponentów React w izolacji, symulowanie interakcji użytkownika i weryfikacja renderowania oraz zmian stanu.
- **Testy integracyjne (Integration Tests)**: Sprawdzenie współpracy pomiędzy różnymi częściami systemu, np. frontend <-> API, API <-> baza danych. Testowanie endpointów API w Astro.
- **Testy End-to-End (E2E)**: Symulacja pełnych scenariuszy użytkownika w przeglądarce, np. od rejestracji, przez stworzenie fiszki, po sesję nauki.
- **Testy manualne eksploracyjne**: Ręczne testowanie aplikacji w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych.
- **Testy wizualne (Visual Regression Testing)**: Automatyczne porównywanie zrzutów ekranu UI w celu wykrycia niezamierzonych zmian w wyglądzie.
- **Testy dostępności (Accessibility a11y)**: Weryfikacja, czy aplikacja jest zgodna ze standardami WCAG, aby zapewnić jej użyteczność dla osób z niepełnosprawnościami.
- **Testy kompatybilności**: Sprawdzenie działania aplikacji na różnych przeglądarkach i urządzeniach.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie

- **TC1**: Użytkownik może pomyślnie założyć konto przy użyciu poprawnych danych.
- **TC2**: Użytkownik nie może założyć konta z zajętym adresem e-mail.
- **TC3**: Użytkownik może pomyślnie zalogować się przy użyciu poprawnych danych.
- **TC4**: Użytkownik nie może zalogować się przy użyciu niepoprawnych danych.
- **TC5**: Użytkownik jest przekierowywany do panelu po zalogowaniu.
- **TC6**: Użytkownik może się wylogować.
- **TC7**: Niezalogowany użytkownik nie ma dostępu do chronionych stron (np. `/manage`, `/review`).

### 4.2. Zarządzanie fiszkami

- **TC8**: Zalogowany użytkownik może stworzyć nową fiszkę (ręcznie).
- **TC9**: Stworzona fiszka jest widoczna na liście fiszek.
- **TC10**: Użytkownik może edytować istniejącą fiszkę.
- **TC11**: Użytkownik może usunąć pojedynczą fiszkę.
- **TC12**: Użytkownik może zaznaczyć wiele fiszek i usunąć je w jednej akcji.
- **TC13**: Walidacja formularza tworzenia/edycji fiszki działa poprawnie (np. puste pola).

### 4.3. Generowanie fiszek AI

- **TC14**: Użytkownik może wprowadzić temat i wygenerować propozycje fiszek.
- **TC15**: Aplikacja wyświetla wskaźnik ładowania podczas generowania.
- **TC16**: Wygenerowane propozycje są wyświetlane na liście.
- **TC17**: Użytkownik może zaakceptować propozycję, co powoduje dodanie jej do jego zestawu fiszek.
- **TC18**: Użytkownik może odrzucić propozycję.
- **TC19**: Aplikacja poprawnie obsługuje błędy z API generującego (np. wyświetla komunikat o błędzie).

### 4.4. Tryb nauki

- **TC20**: Użytkownik może rozpocząć sesję nauki.
- **TC21**: Fiszki są wyświetlane jedna po drugiej.
- **TC22**: Użytkownik może odkryć odpowiedź na fiszce.
- **TC23**: Użytkownik może ocenić swoją znajomość fiszki.
- **TC24**: Aplikacja przechodzi do następnej fiszki po ocenie.
- **TC25**: Po zakończeniu sesji wyświetlany jest ekran podsumowujący.

## 5. Środowisko testowe

- **Środowisko deweloperskie (Lokalne)**: Używane do uruchamiania testów jednostkowych i komponentowych podczas rozwoju.
- **Środowisko Staging/Testowe**:
    - Oddzielna instancja aplikacji wdrożona w środowisku zbliżonym do produkcyjnego.
    - Osobna baza danych Supabase, odizolowana od danych produkcyjnych, wypełniona danymi testowymi.
    - Na tym środowisku będą uruchamiane testy E2E oraz przeprowadzane testy manualne.
- **Przeglądarki**:
    - Google Chrome (najnowsza wersja)
    - Mozilla Firefox (najnowsza wersja)
    - Safari (najnowsza wersja)
- **Urządzenia**:
    - Desktop (rozdzielczość 1920x1080)
    - Tablet (symulacja w narzędziach deweloperskich, np. iPad)
    - Mobile (symulacja w narzędziach deweloperskich, np. iPhone 12)

## 6. Narzędzia do testowania

- **Framework do testów jednostkowych/komponentowych**: Vitest z React Testing Library.
- **Framework do testów E2E**: Playwright.
- **Narzędzie do testów wizualnych**: Playwright.
- **Narzędzie do testów dostępności**: Axe / Lighthouse.
- **System do zarządzania testami i błędami**: Jira / GitHub Issues.
- **Automatyzacja CI/CD**: GitHub Actions (do automatycznego uruchamiania testów po każdym pushu).

## 7. Harmonogram testów

Proces testowy będzie prowadzony w sposób ciągły, zintegrowany z cyklem rozwoju (CI/CD).

- **Sprint (2 tygodnie)**:
    - **Tydzień 1**: Testowanie nowych funkcjonalności (jednostkowe, komponentowe, manualne) równolegle z developmentem.
    - **Tydzień 2**: Testy regresji (automatyczne E2E i manualne) przed wydaniem. Stabilizacja i naprawa błędów.
- **Przed wdrożeniem produkcyjnym**: Pełna regresja E2E oraz testy eksploracyjne na środowisku stagingowym.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

- Nowa funkcjonalność jest wdrożona na środowisku testowym.
- Testy jednostkowe i komponentowe dla nowej funkcjonalności przechodzą pomyślnie.
- Dokumentacja lub opis funkcjonalności jest dostępny dla testera.

### 8.2. Kryteria wyjścia (zakończenia testów)

- 100% testów jednostkowych i integracyjnych przechodzi pomyślnie.
- 95% testów E2E przechodzi pomyślnie.
- Brak otwartych błędów krytycznych i blokujących.
- Wszystkie zidentyfikowane błędy o wysokim priorytecie zostały naprawione i zweryfikowane.
- Dokumentacja testowa została zaktualizowana.

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy**:
    - Pisanie testów jednostkowych i komponentowych.
    - Naprawa błędów zgłoszonych przez zespół QA.
    - Utrzymanie i konfiguracja środowisk testowych.
- **Inżynier QA / Tester**:
    - Tworzenie i utrzymanie planu testów.
    - Projektowanie i implementacja testów E2E.
    - Wykonywanie testów manualnych i eksploracyjnych.
    - Raportowanie i weryfikacja błędów.
    - Analiza wyników testów i raportowanie statusu jakości.
- **Product Owner / Manager**:
    - Definiowanie wymagań i kryteriów akceptacji.
    - Priorytetyzacja błędów.
    - Ostateczna akceptacja funkcjonalności.

## 10. Procedury raportowania błędów

Wszystkie znalezione błędy będą raportowane w systemie śledzenia błędów (np. GitHub Issues) i powinny zawierać następujące informacje:

- **Tytuł**: Zwięzły i jasny opis problemu.
- **Środowisko**: Gdzie błąd wystąpił (np. przeglądarka, system operacyjny, środowisko testowe).
- **Kroki do odtworzenia**: Szczegółowa, ponumerowana lista kroków potrzebnych do odtworzenia błędu.
- **Obserwowany rezultat**: Co się stało po wykonaniu kroków.
- **Oczekiwany rezultat**: Co powinno się stać.
- **Priorytet/Waga**: Określenie wpływu błędu na aplikację (np. Krytyczny, Wysoki, Średni, Niski).
- **Załączniki**: Zrzuty ekranu, nagrania wideo lub logi konsoli, które pomogą w diagnozie problemu.
