# Architektura UI dla 10x Cards

## 1. Przegląd struktury UI

Aplikacja 10x Cards została zaprojektowana jako nowoczesna aplikacja webowa wykorzystująca framework Astro 5 z dynamicznymi komponentami React 19, stylizowanymi przy użyciu Tailwind 4 i biblioteki komponentów Shadcn/ui. Architektura UI opiera się na podejściu "mobile-first" z pełną responsywnością i wysokim poziomem dostępności.

### Główne założenia architektoniczne:

- **Rozdzielenie kontekstów**: Wyraźny podział między strefą tworzenia fiszek (strona główna) a zarządzaniem kolekcją (dedykowana strona)
- **Asynchroniczny interfejs**: Blokada UI z jasnymi wskaźnikami ładowania podczas operacji długotrwałych (generowanie AI)
- **Reużywalność komponentów**: Wspólne komponenty modalne i UI wykorzystywane w różnych kontekstach
- **Lokalne zarządzanie stanem**: Stan formularzy i propozycji AI zarządzany w komponentach React (useState, useReducer)
- **Optimistic updates**: Natychmiastowa aktualizacja UI z możliwością rollback przy błędach API
- **Dwupoziomowa obsługa błędów**: Inline dla walidacji pól + globalne toasty dla błędów API/sieciowych

### Technologie i narzędzia:

- **Framework**: Astro 5 (routing, SSR, statyczne strony)
- **Komponenty dynamiczne**: React 19 (interaktywne elementy UI)
- **Stylizacja**: Tailwind CSS 4
- **Biblioteka komponentów**: Shadcn/ui (dostępność, spójność)
- **Uwierzytelnianie**: Supabase Auth (JWT tokens)
- **Walidacja**: Zod (schemas po stronie klienta)

---

## 2. Lista widoków

### 2.1. Widok Logowania

**Ścieżka**: `/login`

**Typ**: Strona publiczna (niechroniona)

**Główny cel**: Umożliwienie uwierzytelnienia użytkownika w systemie poprzez adres e-mail i hasło.

**Kluczowe informacje do wyświetlenia**:
- Formularz logowania (e-mail, hasło)
- Link do rejestracji nowego konta
- Komunikaty błędów walidacji i uwierzytelniania

**Kluczowe komponenty widoku**:
- `LoginForm` (React)
  - `TextInput` dla e-mail (z walidacją formatu)
  - `PasswordInput` dla hasła (z ukrywaniem/pokazywaniem)
  - `Button` typu submit ("Zaloguj się")
  - Inline error messages pod polami
- `Link` do `/register`
- Logo aplikacji
- Opcjonalnie: ilustracja lub krótki opis wartości aplikacji

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: Autofocus na polu e-mail, enter submituje formularz, czytelne komunikaty błędów
- **Dostępność**: Etykiety pól połączone z inputami (aria-label), role="form", focus trap w formularzu
- **Bezpieczeństwo**: Pole hasła typu password, walidacja po stronie klienta (duplikowana na serwerze), obsługa błędów bez ujawniania szczegółów (np. "Nieprawidłowy e-mail lub hasło")
- **Przekierowanie**: Po udanym logowaniu → strona główna (/), jeśli użytkownik już zalogowany → automatyczne przekierowanie na /

---

### 2.2. Widok Rejestracji

**Ścieżka**: `/register`

**Typ**: Strona publiczna (niechroniona)

**Główny cel**: Umożliwienie utworzenia nowego konta użytkownika z walidacją danych wejściowych.

**Kluczowe informacje do wyświetlenia**:
- Formularz rejestracji (e-mail, hasło, potwierdzenie hasła)
- Wymagania dotyczące hasła (minimalna długość, złożoność)
- Link do logowania (dla użytkowników z kontem)
- Komunikaty błędów i sukcesu

**Kluczowe komponenty widoku**:
- `RegisterForm` (React)
  - `TextInput` dla e-mail (walidacja formatu)
  - `PasswordInput` dla hasła (wskaźnik siły hasła)
  - `PasswordInput` dla potwierdzenia hasła (walidacja zgodności)
  - `Button` typu submit ("Zarejestruj się")
  - Inline validation messages
- `PasswordStrengthIndicator` (wizualizacja siły hasła)
- `Link` do `/login`
- Lista wymagań hasła (bullets)

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: Real-time walidacja zgodności haseł, wskaźnik siły hasła, autofocus na e-mail, komunikat sukcesu przed automatycznym zalogowaniem
- **Dostępność**: Semantyczne etykiety, aria-describedby dla wymagań hasła, role i landmarks
- **Bezpieczeństwo**: Walidacja siły hasła (min. 8 znaków), walidacja po stronie klienta i serwera, automatyczne logowanie po rejestracji
- **Przekierowanie**: Po udanej rejestracji → automatyczne zalogowanie → strona główna (/)

---

### 2.3. Widok Główny / Tworzenie Fiszek

**Ścieżka**: `/`

**Typ**: Strona chroniona (wymaga uwierzytelnienia)

**Główny cel**: Centrum tworzenia nowych fiszek – zarówno przez generowanie AI jak i manualne dodawanie.

**Kluczowe informacje do wyświetlenia**:
- Zakładki: "Generuj" (AI) i "Dodaj Ręcznie"
- W trybie "Generuj": pole tekstowe, przycisk generowania, lista propozycji (po wygenerowaniu)
- W trybie "Dodaj Ręcznie": formularz z polami Przód/Tył
- Komunikaty walidacji i błędów
- Wskaźniki ładowania podczas generowania

**Kluczowe komponenty widoku**:

#### Zakładka "Generuj" (domyślnie aktywna):
- `GenerateTab` (React)
  - `TextArea` dla tekstu źródłowego
    - Character counter (min 100, max 1000)
    - Real-time validation
  - `Button` "Generuj" (disabled jeśli walidacja nie przechodzi)
  - `LoadingOverlay` (podczas generowania) z spinner i tekstem "Generuję fiszki..."
  - `ProposalsList` (po wygenerowaniu)
    - Lista 12 komponentów `ProposalCard`
      - Front i Back fiszki (teksty)
      - Status akceptacji (wizualna oznaka)
      - Przyciski akcji:
        - `IconButton` "Edytuj" (otwiera modal)
        - `IconButton` "Akceptuj" (toggle, zmienia wizualnie kartę)
        - `IconButton` "Usuń" (usuwa propozycję z listy)
  - `BatchActionsBar` (na dole listy propozycji)
    - `Button` "Zapisz Zaakceptowane" (disabled jeśli brak akceptacji)
    - `Button` "Odrzuć Wszystkie" (czyści listę i reset formularza)

#### Zakładka "Dodaj Ręcznie":
- `ManualAddTab` (React)
  - `TextArea` dla pola "Przód" (1-5000 znaków)
  - `TextArea` dla pola "Tył" (1-5000 znaków)
  - `Button` "Dodaj fiszkę" (disabled jeśli oba pola puste)
  - Inline validation messages
  - Success indicator (krótki toast lub animacja) po dodaniu

**Przepływ stanu**:
1. **Generate Tab State**:
   - `sourceText`: string
   - `isGenerating`: boolean
   - `generationId`: number | null
   - `proposals`: Array<{id, front, back, isAccepted, isEdited}>
   - `validationError`: string | null

2. **Manual Tab State**:
   - `front`: string
   - `back`: string
   - `isSubmitting`: boolean
   - `validationErrors`: {front?: string, back?: string}

**Integracja z API**:
- POST /api/generations (generowanie propozycji)
- POST /api/flashcards/batch (zapisanie zaakceptowanych propozycji)
- POST /api/flashcards (manualne dodanie pojedynczej fiszki)

**UX, dostępność i względy bezpieczeństwa**:
- **UX**:
  - Blokada UI podczas generowania (loading overlay)
  - Character counter z kolorami (czerwony < 100, zielony 100-1000, czerwony > 1000)
  - Animacja akceptacji propozycji (np. zielona ramka/tło)
  - Auto-clear formularza po zapisaniu
  - Smooth transitions między zakładkami
- **Dostępność**:
  - Tabs component z aria-selected, role="tablist"
  - Keyboard navigation (Tab, Enter, Escape)
  - Screen reader announcements dla zmian stanu (generowanie, sukces)
  - Focus management (po zamknięciu modala powrót do przycisku edycji)
- **Bezpieczeństwo**:
  - Route guard (redirect do /login jeśli brak sesji)
  - Walidacja długości tekstu po stronie klienta i serwera
  - Sanitizacja inputów przed wysłaniem do API
- **Obsługa błędów**:
  - Inline validation dla pól formularzy
  - Global toast dla błędów API (503 Service Unavailable dla problemów z OpenRouter)
  - Możliwość retry po błędzie generowania

---

### 2.4. Widok Zarządzania Kolekcją

**Ścieżka**: `/manage`

**Typ**: Strona chroniona (wymaga uwierzytelnienia)

**Główny cel**: Przeglądanie, wyszukiwanie, filtrowanie, edytowanie i usuwanie zapisanych fiszek.

**Kluczowe informacje do wyświetlenia**:
- Pasek narzędzi (wyszukiwanie, filtry, sortowanie)
- Siatka fiszek (3 kolumny na desktop, 2 na tablet, 1 na mobile)
- Każda karta fiszki: Przód (górą), Tył (dołem), ikony akcji
- Paginacja (jeśli więcej niż 30 fiszek)
- Empty state (jeśli brak fiszek)
- Przycisk "Ucz się" (uruchamia tryb przeglądania)

**Kluczowe komponenty widoku**:
- `ToolBar` (React)
  - `SearchInput` (full-text search po przód i tył)
  - `FilterDropdown` (źródło: wszystkie/manual/ai)
  - `SortDropdown` (data utworzenia/aktualizacji, asc/desc)
  - `Button` "Ucz się" (nawigacja do /review)
- `FlashcardGrid` (React)
  - Responsywna siatka (CSS Grid)
  - Lista komponentów `FlashcardCard`:
    - Badge z oznaczeniem źródła ('AI' lub 'Ręczna')
    - Tekst Przód (ograniczony do 3 linii z ellipsis)
    - Tekst Tył (ograniczony do 3 linii z ellipsis)
    - Akcje (ikony):
      - `IconButton` "Edytuj" (otwiera EditFlashcardModal)
      - `IconButton` "Usuń" (otwiera DeleteConfirmationModal)
- `PaginationControls` (jeśli total > limit)
  - Numer strony
  - Przyciski Previous/Next
  - Info: "Strona X z Y (łącznie Z fiszek)"
- `EmptyState` (gdy brak fiszek)
  - Ilustracja/ikona
  - Tekst zachęcający: "Nie masz jeszcze żadnych fiszek"
  - CTA Button: "Stwórz pierwszą fiszkę" (link do /)

**Przepływ stanu**:
- `flashcards`: Array<Flashcard>
- `pagination`: {page, limit, total, totalPages, hasNext, hasPrev}
- `filters`: {search: string, source: 'all' | 'manual' | 'ai', sort: string, order: string}
- `isLoading`: boolean
- `selectedFlashcard`: Flashcard | null (dla modali)

**Integracja z API**:
- GET /api/flashcards (z query params: page, limit, search, source, sort, order)
- PUT /api/flashcards/{id} (aktualizacja po edycji)
- DELETE /api/flashcards/{id} (usunięcie)

**Strategia synchronizacji danych**:
- **Lista fiszek**: Fetch przy montowaniu komponentu i po zmianie filtrów/paginacji
- **Edycja**: Optimistic update → na błędzie rollback + toast error
- **Usunięcie**: Optimistic update (usunięcie z listy) → na błędzie rollback + toast error
- **Dodanie nowej**: Re-fetch całej listy (user może dodać na stronie głównej, potem wrócić tu)

**UX, dostępność i względy bezpieczeństwa**:
- **UX**:
  - Real-time search z debounce (300ms)
  - Skeleton loading state podczas ładowania danych
  - Smooth transitions przy zmianie filtrów
  - Animacja usunięcia (fade-out)
  - Hover effects na kartach
  - Tooltips na ikonach akcji
  - Infinite scroll jako alternatywa paginacji (future enhancement)
- **Dostępność**:
  - Semantic HTML (main, article, button)
  - ARIA labels na ikonach akcji
  - Keyboard navigation po siatce (Tab)
  - Screen reader announcements dla zmian liczby fiszek
  - Focus indicators
- **Bezpieczeństwo**:
  - Route guard (redirect do /login)
  - RLS enforcement przez API (użytkownik widzi tylko swoje fiszki)
- **Responsywność**:
  - Desktop: 3 kolumny
  - Tablet (768-1024px): 2 kolumny
  - Mobile (<768px): 1 kolumna
  - Toolbar items wrappują na małych ekranach

---

### 2.5. Widok Przeglądania / Nauki

**Ścieżka**: `/review`

**Typ**: Strona chroniona (wymaga uwierzytelnienia)

**Główny cel**: Przeglądanie fiszek w trybie nauki – jedna fiszka na raz z możliwością odwracania (front/back).

**Kluczowe informacje do wyświetlenia**:
- Pojedyncza fiszka (duża, centralnie)
- Front (domyślnie) lub Back (po kliknięciu)
- Pozycja w sekwencji (np. "5 / 20")
- Nawigacja Previous/Next
- Przycisk "Zakończ" (powrót do /manage)
- Completion screen (po przejściu wszystkich)

**Kluczowe komponenty widoku**:
- `ReviewCard` (React)
  - Duża karta z animacją flip (CSS transform)
  - Klikalna obszar (toggle front/back)
  - Tekst fiszki (Front lub Back w zależności od stanu)
  - Wskazówka: "Kliknij, aby odwrócić" (na front side)
- `ReviewControls` (React)
  - Progress indicator: "Fiszka X z Y"
  - `Button` "Poprzednia" (disabled na pierwszej)
  - `Button` "Następna" (disabled na ostatniej)
  - `Button` "Zakończ" (exit review mode)
- `CompletionScreen` (po ostatniej fiszce)
  - Gratulacje/podsumowanie
  - `Button` "Zacznij od nowa" (reset do pierwszej fiszki)
  - `Button` "Wróć do kolekcji" (nawigacja do /manage)

**Przepływ stanu**:
- `flashcards`: Array<Flashcard> (załadowane przy montowaniu)
- `currentIndex`: number (0-based)
- `isFlipped`: boolean (czy pokazany back)
- `isLoading`: boolean

**Integracja z API**:
- GET /api/flashcards (wszystkie fiszki użytkownika, bez paginacji dla review mode lub z dużym limitem)

**Logika**:
1. Załadowanie wszystkich fiszek przy montowaniu komponentu
2. Jeśli brak fiszek → redirect do /manage z toast message
3. Wyświetlenie pierwszej fiszki (front)
4. Kliknięcie karty → toggle isFlipped
5. Next/Previous → zmiana currentIndex + reset isFlipped do false
6. Po ostatniej fiszce → pokazanie CompletionScreen

**UX, dostępność i względy bezpieczeństwa**:
- **UX**:
  - Smooth flip animation (3D transform)
  - Keyboard navigation (Arrow keys, Space to flip)
  - Progress bar wizualny (opcjonalnie)
  - Swipe gestures na mobile (left/right)
  - Auto-focus na głównej karcie
- **Dostępność**:
  - role="region" aria-label="Fiszka do nauki"
  - Keyboard controls (Space/Enter flip, Arrow keys navigate)
  - Screen reader announcements: "Przód fiszki", "Tył fiszki", "Fiszka X z Y"
  - Focus trap w review mode
- **Bezpieczeństwo**:
  - Route guard
- **Responsywność**:
  - Full-screen experience na mobile
  - Adaptacyjny rozmiar czcionki (vw units)
  - Touch-friendly przyciskontroli (min 44x44px)

---

## 3. Mapa podróży użytkownika

### 3.1. Podróż Nowego Użytkownika (First-time User)

```
START
  ↓
[Landing / Marketing Page - poza scope MVP]
  ↓
REJESTRACJA (/register)
  → Wypełnienie formularza (email, hasło)
  → Walidacja w czasie rzeczywistym
  → Submit
  → [Supabase Auth] → Utworzenie konta
  → Automatyczne zalogowanie
  ↓
STRONA GŁÓWNA (/)
  → Domyślnie zakładka "Generuj"
  → Opcja 1: Generowanie przez AI
  → Opcja 2: Przełączenie na "Dodaj Ręcznie"
```

### 3.2. Główny Przepływ: Generowanie Fiszek przez AI

```
STRONA GŁÓWNA (/) - Zakładka "Generuj"
  ↓
[Użytkownik] Wkleja tekst (100-1000 znaków)
  → Real-time character counter
  → Inline validation (kolor counter: czerwony/zielony)
  ↓
[Użytkownik] Klika "Generuj"
  ↓
[UI] Blokuje interfejs
  → Loading overlay z spinnerem
  → Tekst: "Generuję fiszki..."
  ↓
[API] POST /api/generations
  → OpenRouter generates flashcards
  → Zwraca: generation_id + 12 proposals
  ↓
[UI] Wyświetla listę 12 propozycji
  → Każda propozycja jako karta z Front/Back
  → Przyciski: Edytuj, Akceptuj, Usuń
  ↓
[Użytkownik] Przegląda propozycje:
  
  Opcja A: AKCEPTUJ (bez edycji)
    → Kliknięcie "Akceptuj"
    → Wizualna oznaka (zielona ramka/ikona)
    → Propozycja zaznaczona jako accepted
  
  Opcja B: EDYTUJ → AKCEPTUJ
    → Kliknięcie "Edytuj"
    → Otwiera się EditFlashcardModal
    → Modyfikacja Front/Back w formularzu
    → Kliknięcie "Zapisz"
    → Modal zamyka się
    → Propozycja zaktualizowana + automatycznie zaakceptowana
    → Oznaczenie: zaakceptowano z edycją (edited: true)
  
  Opcja C: USUŃ
    → Kliknięcie "Usuń"
    → Propozycja znika z listy (bez confirmacji)
    → Licznik aktualizuje się
  ↓
[Użytkownik] Po zaakceptowaniu przynajmniej 1 propozycji:
  → Przycisk "Zapisz Zaakceptowane" staje się aktywny
  ↓
[Użytkownik] Klika "Zapisz Zaakceptowane"
  ↓
[API] POST /api/flashcards/batch
  → Body: {flashcards: [...], generation_id}
  → Każda fiszka z flagą edited: true/false
  → Zapisuje fiszki w bazie
  → Aktualizuje metryki generacji (accepted_unedited_count, accepted_edited_count)
  ↓
[UI] Success toast: "Zapisano X fiszek"
  → Reset formularza (czyści textarea i listę propozycji)
  → Użytkownik może wygenerować kolejne lub przejść do zarządzania
  ↓
[Opcjonalnie] Nawigacja do /manage
  → Zobaczenie zapisanych fiszek w kolekcji
```

**Alternatywny przepływ: Odrzuć wszystkie**
```
[Użytkownik] Po wygenerowaniu propozycji
  → Kliknięcie "Odrzuć Wszystkie"
  → Propozycje znikają
  → Textarea jest wyczyszczony
  → Użytkownik może wprowadzić nowy tekst
```

### 3.3. Przepływ Alternatywny: Manualne Dodawanie Fiszki

```
STRONA GŁÓWNA (/) - Zakładka "Dodaj Ręcznie"
  ↓
[Użytkownik] Wypełnia pola:
  → Pole "Przód" (textarea, 1-5000 znaków)
  → Pole "Tył" (textarea, 1-5000 znaków)
  → Inline validation (min 1 znak w każdym)
  ↓
[Użytkownik] Klika "Dodaj fiszkę"
  ↓
[API] POST /api/flashcards
  → Body: {front, back}
  → Zwraca: utworzoną fiszkę
  ↓
[UI] Success toast: "Fiszka dodana"
  → Auto-clear formularza (oba pola puste)
  → Focus powraca do pola "Przód"
  → Użytkownik może dodać kolejną fiszkę
  ↓
[Opcjonalnie] Nawigacja do /manage
  → Zobaczenie dodanej fiszki w kolekcji
```

### 3.4. Przepływ: Zarządzanie Kolekcją

```
NAWIGACJA do /manage (z głównego menu)
  ↓
[API] GET /api/flashcards (page=1, limit=30, sort=created_at, order=desc)
  ↓
[UI] Wyświetla siatkę fiszek
  → 3 kolumny (desktop), 2 (tablet), 1 (mobile)
  → Każda karta: Front (góra), Tył (dół), badge źródła, akcje
  ↓
[Użytkownik] Może:

  OPCJA A: WYSZUKIWANIE
    → Wpisuje tekst w SearchInput
    → Debounce 300ms
    → [API] GET /api/flashcards?search=...
    → [UI] Aktualizuje siatkę z wynikami
    → Jeśli brak wyników → "Nie znaleziono fiszek"
  
  OPCJA B: FILTROWANIE
    → Wybiera źródło: Wszystkie / Ręczne / AI
    → [API] GET /api/flashcards?source=...
    → [UI] Aktualizuje siatkę
  
  OPCJA C: SORTOWANIE
    → Wybiera sort field + order
    → [API] GET /api/flashcards?sort=...&order=...
    → [UI] Aktualizuje siatkę
  
  OPCJA D: EDYCJA FISZKI
    → Kliknięcie ikony "Edytuj" na karcie
    → Otwiera się EditFlashcardModal
    → Pre-filled z Front/Back z tej fiszki
    → Modyfikacja treści
    → Kliknięcie "Zapisz"
    → [API] PUT /api/flashcards/{id}
    → [UI] Optimistic update (natychmiastowa aktualizacja w siatce)
    → Jeśli błąd API → rollback + error toast
    → Modal zamyka się
    → Focus wraca do przycisku "Edytuj"
  
  OPCJA E: USUNIĘCIE FISZKI
    → Kliknięcie ikony "Usuń" na karcie
    → Otwiera się DeleteConfirmationModal
    → Treść: "Czy na pewno chcesz usunąć tę fiszkę?"
    → Pokazuje Front/Back fiszki jako reminder
    → Kliknięcie "Usuń" (czerwony przycisk)
    → [API] DELETE /api/flashcards/{id}
    → [UI] Optimistic update (fade-out animation → usunięcie z listy)
    → Jeśli błąd API → rollback (pojawienie się karty z powrotem) + error toast
    → Success toast: "Fiszka usunięta"
    → Modal zamyka się
  
  OPCJA F: PAGINACJA (jeśli total > 30)
    → Kliknięcie "Next" lub "Previous"
    → [API] GET /api/flashcards?page=...
    → [UI] Aktualizuje siatkę
    → Scroll do góry strony
  
  OPCJA G: ROZPOCZĘCIE NAUKI
    → Kliknięcie przycisku "Ucz się"
    → Nawigacja do /review
```

**Edge case: Empty state**
```
[API] GET /api/flashcards → zwraca pustą tablicę
  ↓
[UI] Wyświetla EmptyState component
  → Ilustracja
  → Tekst: "Nie masz jeszcze żadnych fiszek"
  → CTA: "Stwórz pierwszą fiszkę"
  → Kliknięcie CTA → nawigacja do /
```

### 3.5. Przepływ: Przeglądanie Fiszek (Tryb Nauki)

```
NAWIGACJA do /review (z przycisku "Ucz się" na /manage)
  ↓
[API] GET /api/flashcards (wszystkie lub duży limit)
  ↓
[UI] Sprawdza liczbę fiszek:
  → Jeśli 0 → redirect do /manage + toast "Dodaj fiszki, aby rozpocząć naukę"
  → Jeśli >0 → rozpoczyna review mode
  ↓
[UI] Wyświetla pierwszą fiszkę (index=0, isFlipped=false)
  → Pokazuje Front
  → Progress: "Fiszka 1 z X"
  → Hint: "Kliknij, aby odwrócić"
  ↓
[Użytkownik] Interakcje:

  ODWRÓCENIE:
    → Kliknięcie karty (lub Space/Enter)
    → [UI] Flip animation (3D transform)
    → isFlipped = true
    → Pokazuje Back
    → Kliknięcie ponowne → flip z powrotem (Front)
  
  NASTĘPNA FISZKA:
    → Kliknięcie "Następna" (lub → Arrow)
    → currentIndex++
    → isFlipped = false
    → [UI] Wyświetla kolejną fiszkę (Front)
    → Progress update: "Fiszka 2 z X"
  
  POPRZEDNIA FISZKA:
    → Kliknięcie "Poprzednia" (lub ← Arrow)
    → currentIndex--
    → isFlipped = false
    → [UI] Wyświetla poprzednią fiszkę (Front)
    → Progress update
  
  ZAKOŃCZENIE:
    → Kliknięcie "Zakończ"
    → Nawigacja do /manage
  ↓
[Po ostatniej fiszce] (currentIndex === total - 1 i user klika Next)
  → [UI] Wyświetla CompletionScreen
  → Gratulacje + statystyki (np. "Przejrzałeś X fiszek")
  → Opcje:
    A) "Zacznij od nowa" → currentIndex = 0 → restart
    B) "Wróć do kolekcji" → nawigacja do /manage
```

### 3.6. Przepływ: Wylogowanie

```
[Dowolna strona] Zalogowany użytkownik
  ↓
[Header] Kliknięcie przycisku "Wyloguj"
  ↓
[Supabase Auth] supabase.auth.signOut()
  ↓
[UI] Redirect do /login
  → Session token usunięty
  → Toast: "Wylogowano pomyślnie"
```

---

## 4. Układ i struktura nawigacji

### 4.1. Główny Layout (`MainLayout.astro`)

Wszystkie chronione strony (/, /manage, /review) korzystają z tego samego layoutu zawierającego:

**Header (stały, zawsze widoczny):**
```
┌─────────────────────────────────────────────────┐
│ [Logo] 10x Cards          [User] user@email.com │
│                           [Button] Wyloguj       │
└─────────────────────────────────────────────────┘
```

Elementy:
- **Logo**: Link do / (strona główna)
- **User info**: Wyświetla e-mail zalogowanego użytkownika
- **Logout button**: Wylogowanie (wywołanie Supabase signOut)

**Navigation (pozioma pod headerem lub w headerze):**
```
[ Home / Twórz ]  [ Zarządzaj ]
```

Elementy:
- **"Home" / "Twórz"**: Link do / (aktywny jeśli currentPath === '/')
- **"Zarządzaj"**: Link do /manage (aktywny jeśli currentPath === '/manage')

**Main Content Area:**
- Dynamiczna zawartość w zależności od strony
- Centralny kontener z max-width dla czytelności (np. 1200px)
- Padding responsywny (większy na desktop, mniejszy na mobile)

**Footer (opcjonalnie w MVP):**
- Copyright
- Linki do polityki prywatności (poza scope MVP)

### 4.2. Struktura Nawigacji - Routing

#### Strony publiczne (dostępne bez logowania):
- `/login` - Logowanie
- `/register` - Rejestracja

#### Strony chronione (wymagają uwierzytelnienia):
- `/` - Strona główna (tworzenie fiszek)
- `/manage` - Zarządzanie kolekcją
- `/review` - Tryb przeglądania/nauki

#### Route Guards:
- **Logika w `MainLayout.astro`** (middleware):
  ```typescript
  const session = await supabase.auth.getSession();
  
  if (!session && protectedRoutes.includes(currentPath)) {
    return redirect('/login');
  }
  
  if (session && publicOnlyRoutes.includes(currentPath)) {
    return redirect('/');
  }
  ```

### 4.3. Nawigacja Kontekstowa

#### Z perspektywy użytkownika:

**Punkt startowy: Strona główna (/) - "Centrum tworzenia"**
- Domyślne miejsce po zalogowaniu
- Zawiera dwie zakładki (Generate / Add Manually)
- CTA: "Zobacz swoją kolekcję" → link do /manage (jeśli user dodał fiszki)

**Drugi poziom: /manage - "Centrum zarządzania"**
- Dostępny przez link w głównej nawigacji
- CTA: "Dodaj więcej fiszek" → link do /
- CTA: "Ucz się" → link do /review

**Trzeci poziom: /review - "Tryb nauki"**
- Dostępny tylko z /manage (przycisk "Ucz się")
- Tryb "immersive" – minimalna nawigacja, focus na fiszce
- Exit: Przycisk "Zakończ" → powrót do /manage

#### Breadcrumbs (opcjonalnie):
```
Home > Zarządzaj > Przeglądanie
```

Nie jest konieczny w MVP (struktura jest płaska), ale może być dodany w przyszłości.

### 4.4. Modalowe "Sub-views"

Modalne komponenty nie zmieniają URL, ale stanowią "wirtualne widoki":

1. **EditFlashcardModal**
   - Triggerowany z:
     - Listy propozycji AI (strona główna, zakładka Generate)
     - Siatki fiszek (strona /manage)
   - Zawiera: Formularz z polami Front/Back, przyciski Save/Cancel
   - Zamknięcie: Kliknięcie Cancel, Escape, kliknięcie overlay

2. **DeleteConfirmationModal**
   - Triggerowany z: Siatki fiszek (strona /manage)
   - Zawiera: Pytanie, podgląd fiszki, przyciski Delete/Cancel
   - Zamknięcie: Kliknięcie Cancel, Escape, lub po Delete (po API call)

### 4.5. Responsywna Nawigacja

**Desktop (>1024px):**
- Header poziomy z logo po lewej, user info + logout po prawej
- Navigation links w headerze (inline)
- Main content: max-width 1200px, wycentrowany

**Tablet (768-1024px):**
- Podobnie jak desktop, ale mniejsze paddinge
- Navigation może wrappować na drugą linię jeśli potrzeba

**Mobile (<768px):**
- Header skraca logo do ikony (opcjonalnie)
- User info skrócony (tylko inicjały lub ikona avatara)
- Navigation jako dropdown/hamburger menu (opcjonalnie, lub pozostaje inline jeśli tylko 2 linki)
- Main content: full-width z małymi paddingami

---

## 5. Kluczowe komponenty

### 5.1. Layout Components

#### `MainLayout.astro`
**Opis**: Główny layout aplikacji używany przez wszystkie chronione strony. Zawiera header z nawigacją, authentication guard i outlet dla zawartości strony.

**Odpowiedzialność**:
- Weryfikacja sesji użytkownika (Supabase Auth)
- Przekierowanie na /login jeśli brak sesji
- Renderowanie headera i nawigacji
- Slot dla zawartości strony

**Props**: Brak (pobiera session z Supabase)

**Zawiera**:
- `<Header />` (Astro component)
- `<Navigation />` (Astro component)
- `<slot />` (zawartość strony)
- `<ToastContainer />` (React component dla globalnych toastów)

---

#### `Header.astro`
**Opis**: Stały nagłówek aplikacji z logo, informacjami o użytkowniku i przyciskiem wylogowania.

**Props**:
- `userEmail: string` - Email zalogowanego użytkownika

**Zawiera**:
- Logo (link do /)
- User info display
- `<LogoutButton />` (React component)

---

#### `Navigation.astro`
**Opis**: Główna nawigacja między stronami aplikacji.

**Props**:
- `currentPath: string` - Aktualny URL dla oznaczenia aktywnego linku

**Zawiera**:
- Lista linków (Home, Zarządzaj)
- Active state highlighting

---

### 5.2. Authentication Components

#### `LoginForm.tsx`
**Opis**: Formularz logowania z walidacją i obsługą błędów.

**State**:
- `email: string`
- `password: string`
- `isSubmitting: boolean`
- `errors: {email?: string, password?: string, general?: string}`

**Zawiera**:
- `<TextInput />` dla email
- `<PasswordInput />` dla hasła
- `<Button />` typu submit
- Link do /register

**API Integration**: `supabase.auth.signInWithPassword()`

---

#### `RegisterForm.tsx`
**Opis**: Formularz rejestracji z walidacją hasła i wskaźnikiem siły.

**State**:
- `email: string`
- `password: string`
- `confirmPassword: string`
- `isSubmitting: boolean`
- `errors: {email?, password?, confirmPassword?, general?}`

**Zawiera**:
- `<TextInput />` dla email
- `<PasswordInput />` z `<PasswordStrengthIndicator />`
- `<PasswordInput />` dla potwierdzenia
- `<Button />` typu submit

**API Integration**: `supabase.auth.signUp()`

---

#### `LogoutButton.tsx`
**Opis**: Przycisk wylogowania w headerze.

**Props**: Brak

**Behavior**:
- onClick → `supabase.auth.signOut()`
- Redirect do /login
- Toast success message

---

### 5.3. Flashcard Creation Components

#### `GenerateTab.tsx`
**Opis**: Zakładka generowania fiszek przez AI z pełnym przepływem (input → generowanie → propozycje → zapisywanie).

**State**:
- `sourceText: string`
- `isGenerating: boolean`
- `generationId: number | null`
- `proposals: Array<{id, front, back, isAccepted, isEdited}>`
- `validationError: string | null`

**Zawiera**:
- `<TextArea />` z character counterem
- `<Button />` "Generuj"
- `<LoadingOverlay />` (podczas generowania)
- `<ProposalsList />` (po wygenerowaniu)
- `<BatchActionsBar />` (Save Accepted / Reject All)

**API Integration**:
- POST /api/generations
- POST /api/flashcards/batch

**Key Functions**:
- `handleGenerate()`: Wywołuje API, blokuje UI
- `handleAcceptProposal(id)`: Toggle acceptance
- `handleEditProposal(id)`: Otwiera modal edycji
- `handleRemoveProposal(id)`: Usuwa z listy
- `handleSaveAccepted()`: Batch save
- `handleRejectAll()`: Czyści propozycje i reset

---

#### `ProposalsList.tsx`
**Opis**: Lista propozycji fiszek po wygenerowaniu przez AI.

**Props**:
- `proposals: Array<Proposal>`
- `onAccept: (id) => void`
- `onEdit: (id) => void`
- `onRemove: (id) => void`

**Zawiera**:
- Mapowanie po `proposals` → `<ProposalCard />` dla każdego

---

#### `ProposalCard.tsx`
**Opis**: Pojedyncza propozycja fiszki z akcjami.

**Props**:
- `proposal: {id, front, back, isAccepted, isEdited}`
- `onAccept: () => void`
- `onEdit: () => void`
- `onRemove: () => void`

**Zawiera**:
- Front text (bold)
- Back text
- Visual indicator jeśli accepted (np. zielona ramka)
- Badge "Edytowano" jeśli isEdited
- Trzy icon buttons: Edit, Accept (toggle), Remove

**UX**: Hover effects, smooth transitions dla acceptance state

---

#### `BatchActionsBar.tsx`
**Opis**: Pasek akcji grupowych dla propozycji.

**Props**:
- `hasAccepted: boolean` - Czy są zaakceptowane propozycje
- `onSaveAccepted: () => void`
- `onRejectAll: () => void`

**Zawiera**:
- `<Button />` "Zapisz Zaakceptowane" (primary, disabled jeśli !hasAccepted)
- `<Button />` "Odrzuć Wszystkie" (secondary/destructive)

---

#### `ManualAddTab.tsx`
**Opis**: Zakładka manualnego dodawania fiszek z prostym formularzem.

**State**:
- `front: string`
- `back: string`
- `isSubmitting: boolean`
- `errors: {front?, back?}`

**Zawiera**:
- `<TextArea />` dla Front
- `<TextArea />` dla Back
- `<Button />` "Dodaj fiszkę" (disabled jeśli oba puste)
- Inline validation messages

**API Integration**: POST /api/flashcards

**Key Functions**:
- `handleSubmit()`: Waliduje, wywołuje API, czyści form, pokazuje toast

---

### 5.4. Flashcard Management Components

#### `FlashcardGrid.tsx`
**Opis**: Responsywna siatka fiszek w widoku zarządzania.

**Props**:
- `flashcards: Array<Flashcard>`
- `onEdit: (flashcard) => void`
- `onDelete: (flashcard) => void`

**Zawiera**:
- CSS Grid layout (1-3 kolumny w zależności od breakpoint)
- Mapowanie po `flashcards` → `<FlashcardCard />` dla każdego
- Skeleton loading state (jeśli ładowanie)
- Empty state (jeśli brak fiszek)

---

#### `FlashcardCard.tsx`
**Opis**: Karta pojedynczej fiszki w siatce.

**Props**:
- `flashcard: {id, front, back, source, created_at}`
- `onEdit: () => void`
- `onDelete: () => void`

**Zawiera**:
- Badge ze źródłem ('AI' / 'Ręczna')
- Front text (3 linie max z ellipsis)
- Back text (3 linie max z ellipsis)
- Icon buttons: Edit, Delete
- Tooltips na ikonach

**UX**: Hover effect (shadow/lift), smooth transitions

---

#### `ToolBar.tsx`
**Opis**: Pasek narzędzi z wyszukiwaniem, filtrami i sortowaniem.

**Props**:
- `filters: {search, source, sort, order}`
- `onFiltersChange: (newFilters) => void`
- `onStartReview: () => void`

**Zawiera**:
- `<SearchInput />` (full-text search)
- `<FilterDropdown />` (source: all/manual/ai)
- `<SortDropdown />` (field + order)
- `<Button />` "Ucz się" (primary)

**Behavior**:
- Debounced search (300ms)
- Wywołuje onFiltersChange przy każdej zmianie

---

#### `SearchInput.tsx`
**Opis**: Input wyszukiwania z debounce i clear button.

**Props**:
- `value: string`
- `onChange: (value) => void`
- `placeholder?: string`

**Zawiera**:
- Input z ikoną search
- Clear button (X) jeśli value nie pusty
- Debounce logic (300ms)

---

#### `FilterDropdown.tsx`
**Opis**: Dropdown filtrowania źródła fiszek.

**Props**:
- `value: 'all' | 'manual' | 'ai'`
- `onChange: (value) => void`

**Zawiera**:
- Shadcn/ui `<Select />` component
- Opcje: "Wszystkie", "Ręczne", "AI"

---

#### `SortDropdown.tsx`
**Opis**: Dropdown sortowania z polem i kierunkiem.

**Props**:
- `sort: 'created_at' | 'updated_at'`
- `order: 'asc' | 'desc'`
- `onChange: (sort, order) => void`

**Zawiera**:
- Shadcn/ui `<Select />` dla pola sortowania
- Toggle button dla kierunku (asc/desc) z ikonami ↑↓

---

#### `PaginationControls.tsx`
**Opis**: Kontrolki paginacji z informacjami o stronach.

**Props**:
- `pagination: {page, totalPages, hasNext, hasPrev, total}`
- `onPageChange: (page) => void`

**Zawiera**:
- Info text: "Strona X z Y (łącznie Z fiszek)"
- `<Button />` "Poprzednia" (disabled jeśli !hasPrev)
- `<Button />` "Następna" (disabled jeśli !hasNext)
- Opcjonalnie: direct page buttons (1, 2, ..., N)

---

#### `EmptyState.tsx`
**Opis**: Stan pustej kolekcji z CTA do dodania pierwszej fiszki.

**Props**: Brak (statyczny)

**Zawiera**:
- Ilustracja lub ikona (np. pusty folder)
- Heading: "Nie masz jeszcze żadnych fiszek"
- Description: "Stwórz swoją pierwszą fiszkę, aby rozpocząć naukę"
- `<Button />` CTA: "Stwórz pierwszą fiszkę" (link do /)

---

### 5.5. Review/Study Components

#### `ReviewCard.tsx`
**Opis**: Duża karta fiszki w trybie nauki z animacją odwracania.

**Props**:
- `flashcard: {front, back}`
- `isFlipped: boolean`
- `onFlip: () => void`

**Zawiera**:
- Obszar klikalny (cała karta)
- Front lub Back text (w zależności od isFlipped)
- Hint text: "Kliknij, aby odwrócić" (tylko na front)
- CSS 3D flip animation

**UX**: Smooth animation, responsive font size

---

#### `ReviewControls.tsx`
**Opis**: Kontrolki nawigacji w trybie nauki.

**Props**:
- `currentIndex: number`
- `total: number`
- `onPrevious: () => void`
- `onNext: () => void`
- `onExit: () => void`

**Zawiera**:
- Progress text: "Fiszka X z Y"
- `<Button />` "Poprzednia" (disabled jeśli currentIndex === 0)
- `<Button />` "Następna" (disabled jeśli currentIndex === total-1)
- `<Button />` "Zakończ" (secondary)

---

#### `CompletionScreen.tsx`
**Opis**: Ekran gratulacyjny po przejrzeniu wszystkich fiszek.

**Props**:
- `total: number`
- `onRestart: () => void`
- `onBackToCollection: () => void`

**Zawiera**:
- Heading: "Gratulacje!"
- Text: "Przejrzałeś {total} fiszek"
- Opcjonalnie: confetti animation
- `<Button />` "Zacznij od nowa" (primary)
- `<Button />` "Wróć do kolekcji" (secondary)

---

### 5.6. Shared Modal Components

#### `EditFlashcardModal.tsx`
**Opis**: Reużywalny modal do edycji fiszek (propozycji AI lub zapisanych fiszek).

**Props**:
- `isOpen: boolean`
- `flashcard: {front, back} | null`
- `onSave: (front, back) => void`
- `onClose: () => void`
- `title?: string` (domyślnie "Edytuj fiszkę")

**State**:
- `front: string`
- `back: string`
- `errors: {front?, back?}`

**Zawiera**:
- Shadcn/ui `<Dialog />` (modal backdrop + container)
- `<TextArea />` dla Front
- `<TextArea />` dla Back
- Inline validation
- `<Button />` "Zapisz" (primary)
- `<Button />` "Anuluj" (secondary)

**Behavior**:
- Pre-fill z props.flashcard
- Walidacja przed save
- onSave callback z nowymi wartościami
- Escape key i overlay click zamykają modal (wywołują onClose)
- Focus trap w modalu
- Focus management: po zamknięciu focus wraca do triggera

---

#### `DeleteConfirmationModal.tsx`
**Opis**: Modal potwierdzenia usunięcia fiszki.

**Props**:
- `isOpen: boolean`
- `flashcard: {front, back} | null`
- `onConfirm: () => void`
- `onCancel: () => void`

**Zawiera**:
- Shadcn/ui `<Dialog />`
- Heading: "Usunąć fiszkę?"
- Description: "Tej operacji nie można cofnąć."
- Podgląd fiszki (Front / Back) jako reminder
- `<Button />` "Usuń" (destructive/red)
- `<Button />` "Anuluj" (secondary)

**Behavior**:
- Escape i overlay click → onCancel
- Focus trap
- Focus management

---

### 5.7. Feedback & UI State Components

#### `ToastContainer.tsx`
**Opis**: Globalny kontener dla toastów (powiadomień) używany przez całą aplikację.

**Props**: Brak

**Zawiera**:
- Portal dla toastów (absolute positioning)
- Stack/queue toastów (max 3 visible)

**Używa**: Biblioteka typu react-hot-toast lub Shadcn/ui Toast component

**Typy toastów**:
- Success (zielony): "Fiszka dodana", "Zapisano X fiszek"
- Error (czerwony): "Błąd sieci", "Nie udało się wygenerować fiszek"
- Info (niebieski): "Sprawdź swoją skrzynkę e-mail"

---

#### `LoadingOverlay.tsx`
**Opis**: Pełnoekranowa nakładka z spinnerem podczas długotrwałych operacji (np. generowanie AI).

**Props**:
- `message?: string` (np. "Generuję fiszki...")

**Zawiera**:
- Semi-transparent backdrop (overlay)
- Centered spinner
- Optional message text

**UX**: Blokuje interakcję, wyraźnie sygnalizuje ładowanie

---

#### `Skeleton.tsx`
**Opis**: Placeholder component dla ładowania zawartości (np. siatka fiszek).

**Props**:
- `variant?: 'card' | 'text' | 'circular'`
- `count?: number` (ile skeletonów renderować)

**Zawiera**:
- Animowane tło (shimmer effect)
- Kształt dopasowany do variant

---

#### `PasswordStrengthIndicator.tsx`
**Opis**: Wizualny wskaźnik siły hasła.

**Props**:
- `password: string`

**Zawiera**:
- Progress bar lub seria dots
- Kolor w zależności od siły (czerwony/żółty/zielony)
- Text label: "Słabe" / "Średnie" / "Silne"

**Logic**: Oblicza siłę na podstawie długości, różnorodności znaków

---

### 5.8. Core UI Components (Shadcn/ui wrappers)

Te komponenty są wrapperami lub bezpośrednim użyciem Shadcn/ui:

#### `Button.tsx`
- Props: `variant` (primary/secondary/destructive), `size`, `disabled`, `onClick`, children
- Shadcn/ui Button component

#### `TextInput.tsx`
- Props: `value`, `onChange`, `placeholder`, `type`, `error`, `label`, `required`
- Shadcn/ui Input + Label

#### `TextArea.tsx`
- Props: `value`, `onChange`, `placeholder`, `rows`, `maxLength`, `error`, `label`
- Shadcn/ui Textarea + Label
- Character counter (opcjonalnie)

#### `PasswordInput.tsx`
- Props: jak TextInput + `showToggle` (show/hide password)
- Shadcn/ui Input type="password" z toggle button

#### `IconButton.tsx`
- Props: `icon`, `onClick`, `tooltip`, `variant`
- Shadcn/ui Button z tylko ikoną + Tooltip

#### `Tabs.tsx`
- Props: `tabs` (array), `activeTab`, `onTabChange`
- Shadcn/ui Tabs component

#### `Dialog.tsx` (Modal)
- Shadcn/ui Dialog (używany przez EditFlashcardModal, DeleteConfirmationModal)

#### `Select.tsx` (Dropdown)
- Shadcn/ui Select (używany przez FilterDropdown, SortDropdown)

#### `Tooltip.tsx`
- Shadcn/ui Tooltip

---

## 6. Obsługa błędów i stanów brzegowych

### 6.1. Walidacja i błędy inline

**Gdzie**: Wszystkie formularze (login, register, create flashcard, edit flashcard)

**Implementacja**:
- Walidacja po stronie klienta (Zod schemas)
- Error messages pod polami (czerwony tekst)
- Disabled submit button dopóki walidacja nie przejdzie
- Real-time validation (onChange) lub on blur

**Przykładowe komunikaty**:
- "E-mail jest wymagany"
- "Nieprawidłowy format e-maila"
- "Hasło musi mieć minimum 8 znaków"
- "Hasła nie są zgodne"
- "Pole Przód musi mieć przynajmniej 1 znak"
- "Tekst musi mieć od 100 do 1000 znaków"

---

### 6.2. Globalne błędy API i sieciowe

**Gdzie**: Wszystkie wywołania API

**Implementacja**:
- Toast component (GlobalToastContainer)
- Error handling w API call wrappers
- Rozróżnienie typów błędów:
  - **401 Unauthorized**: Redirect do /login + toast "Sesja wygasła"
  - **404 Not Found**: Toast "Nie znaleziono zasobu"
  - **422 Validation Error**: Toast z szczegółami walidacji
  - **500 Server Error**: Toast "Wystąpił błąd serwera. Spróbuj ponownie."
  - **503 Service Unavailable**: Toast "Serwis AI jest niedostępny. Spróbuj później."
  - **Network Error**: Toast "Błąd połączenia. Sprawdź internet."

**Retry mechanism**:
- Dla błędów 503 i network errors: opcja "Spróbuj ponownie" w toaście
- Dla generowania AI: przycisk "Generuj ponownie" na error state

---

### 6.3. Stany brzegowe

#### Empty States

1. **Brak fiszek w kolekcji** (/manage):
   - Component: `<EmptyState />`
   - CTA: "Stwórz pierwszą fiszkę" → link do /

2. **Brak wyników wyszukiwania** (/manage):
   - Message: "Nie znaleziono fiszek dla '{searchQuery}'"
   - CTA: "Wyczyść wyszukiwanie"

3. **Brak fiszek do nauki** (/review):
   - Redirect do /manage
   - Toast: "Dodaj fiszki, aby rozpocząć naukę"

#### Loading States

1. **Generowanie AI**:
   - Full-screen `<LoadingOverlay />` z komunikatem "Generuję fiszki..."
   - Blokada UI

2. **Ładowanie listy fiszek** (/manage):
   - Skeleton cards w siatce (3-6 skeletonów)

3. **Submitting forms**:
   - Disabled button + spinner w buttonie
   - Tekst "Zapisywanie..." lub "Dodawanie..."

#### Error States

1. **Generowanie AI failed**:
   - Error message w miejscu gdzie byłyby propozycje
   - Przycisk "Spróbuj ponownie"
   - Toast z szczegółami błędu

2. **API call failed (edit/delete)**:
   - Rollback optimistic update
   - Toast z komunikatem błędu
   - Stan UI wraca do poprzedniego

3. **Session expired**:
   - Redirect do /login
   - Toast: "Twoja sesja wygasła. Zaloguj się ponownie."

#### Edge Cases

1. **Wszystkie propozycje AI usunięte**:
   - Message: "Usunąłeś wszystkie propozycje"
   - Button "Generuj ponownie" lub "Odrzuć wszystkie" (reset)

2. **Brak zaakceptowanych propozycji**:
   - Button "Zapisz Zaakceptowane" disabled
   - Tooltip: "Zaakceptuj przynajmniej jedną propozycję"

3. **Próba zapisania bez zmian** (edit modal):
   - Walidacja: jeśli front === original && back === original
   - Toast: "Nie wprowadzono żadnych zmian"
   - Lub: automatyczne zamknięcie modala bez wywołania API

4. **Bardzo długi tekst w fiszce**:
   - Text truncation z ellipsis w `<FlashcardCard />`
   - Full text widoczny po hover (tooltip) lub w edit modal

5. **Szybkie kliknięcia (double submit)**:
   - Debounce submit buttons
   - Disabled state podczas submitting

---

### 6.4. Dostępność w obsłudze błędów

- **ARIA live regions**: Dla dynamicznych komunikatów błędów (screen reader announcements)
- **Focus management**: Po błędzie focus na pierwszym polu z błędem
- **Error summary**: Na górze formularza (opcjonalnie) z listą wszystkich błędów
- **Color + text**: Nie tylko kolor do oznaczenia błędu (ikona X lub tekst "Błąd:")

---

## 7. Integracja z API

### 7.1. API Client Service

**Plik**: `src/lib/services/api.client.ts`

**Odpowiedzialność**: Centralna warstwa komunikacji z API, obsługa błędów, autentykacja.

**Główne funkcje**:
- `apiRequest(endpoint, options)`: Wrapper dla fetch z error handling
- `getAuthHeaders()`: Pobiera JWT token z Supabase session
- `handleApiError(error)`: Mapuje błędy API na user-friendly messages

**Użycie**:
```typescript
// Przykład w komponencie
const response = await apiRequest('/api/flashcards', {
  method: 'POST',
  body: { front, back }
});
```

---

### 7.2. Mapowanie Widoków na Endpointy API

#### Widok: Home - Generate Tab
- **POST /api/generations**: Generowanie propozycji
- **POST /api/flashcards/batch**: Zapisanie zaakceptowanych propozycji

#### Widok: Home - Manual Add Tab
- **POST /api/flashcards**: Utworzenie pojedynczej fiszki

#### Widok: Manage Collection
- **GET /api/flashcards**: Pobranie listy z paginacją, filtrowaniem, sortowaniem
- **PUT /api/flashcards/{id}**: Aktualizacja fiszki (po edycji)
- **DELETE /api/flashcards/{id}**: Usunięcie fiszki

#### Widok: Review
- **GET /api/flashcards**: Pobranie wszystkich fiszek do nauki (limit 100 lub bez paginacji)

---

### 7.3. State Management Strategy

**Lokalne zarządzanie stanem**:
- Komponenty React używają `useState` lub `useReducer`
- Stan formularzy, propozycji AI, modalów – efemeryczny (resetowany po akcji)

**Server State**:
- Lista fiszek na /manage: Fetch przy montowaniu + re-fetch przy zmianie filtrów
- Brak dedykowanego cache layer w MVP (można dodać React Query w przyszłości)

**Optimistic Updates**:
- Edycja fiszki: Natychmiastowa aktualizacja w UI → na błędzie rollback
- Usunięcie fiszki: Natychmiastowe usunięcie z listy → na błędzie rollback

**Synchronizacja**:
- Po dodaniu nowej fiszki (manual lub batch): User może przejść do /manage → tam re-fetch
- Nie ma real-time sync między zakładkami (poza scope MVP)

---

## 8. Responsywność (RWD)

### 8.1. Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 8.2. Layout Adjustments

#### Header
- **Mobile**: Logo jako ikona, user info skrócony (inicjały), hamburger menu (opcjonalnie)
- **Desktop**: Pełne logo, pełny email, inline navigation

#### Flashcard Grid (/manage)
- **Mobile**: 1 kolumna
- **Tablet**: 2 kolumny
- **Desktop**: 3 kolumny

#### ToolBar (/manage)
- **Mobile**: Elementy wrappują (search full-width, filtry poniżej)
- **Desktop**: Wszystko inline

#### Forms
- **Mobile**: Pełna szerokość, większe touch targets (min 44x44px)
- **Desktop**: Ograniczona szerokość dla czytelności

#### Review Card
- **Mobile**: Full-screen, duża czcionka (4-5vw)
- **Desktop**: Centered z max-width, czcionka 2rem

---

## 9. Dostępność (a11y)

### 9.1. Kluczowe Standardy

- **WCAG 2.1 Level AA** jako cel
- Contrast ratio minimum 4.5:1 dla tekstu
- Focus indicators widoczne na wszystkich interaktywnych elementach
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)

### 9.2. Implementacja

#### Semantic HTML
- `<main>`, `<nav>`, `<header>`, `<article>`, `<button>` zamiast `<div>`
- `<form>` dla wszystkich formularzy
- `<label>` połączone z inputami

#### ARIA
- `aria-label` na ikonach bez tekstu
- `aria-describedby` dla opisów pól (np. wymagania hasła)
- `aria-live` dla dynamicznych komunikatów (loading, błędy)
- `role="alert"` dla błędów
- `aria-modal="true"` dla modalów

#### Keyboard Navigation
- Tab order logiczny
- Escape zamyka modale
- Enter submituje formularze
- Arrow keys w review mode (next/previous)
- Space flip karty w review mode

#### Focus Management
- Focus trap w modalach
- Po zamknięciu modala focus wraca do triggera
- Skip links (opcjonalnie) do głównej zawartości

#### Screen Readers
- Alt texts na obrazach (jeśli są)
- Announcements dla zmian stanu: "Generowanie fiszek", "Fiszka dodana", "Załadowano X fiszek"

---

## 10. Bezpieczeństwo

### 10.1. Autentykacja i Autoryzacja

- **JWT Tokens**: Zarządzane przez Supabase Auth
- **Route Guards**: W `MainLayout.astro` – sprawdzanie sesji, redirect do /login
- **Session Expiry**: Obsługa wygaśnięcia tokenu → redirect + toast
- **Refresh Tokens**: Automatyczne odświeżanie przez Supabase SDK

### 10.2. Input Security

- **Client-side validation**: Zod schemas (duplikacja walidacji z API)
- **Sanitization**: Inputs trimowane przed wysłaniem
- **XSS Prevention**: React automatycznie escapuje output (JSX)
- **CSRF**: Supabase Auth obsługuje (tokens w headers)

### 10.3. API Security

- **Authorization headers**: JWT token w każdym requeście do /api/*
- **RLS (Row-Level Security)**: Na poziomie bazy (Supabase) – użytkownik widzi tylko swoje dane
- **Rate Limiting**: Opcjonalnie na poziomie API (poza scope MVP)

### 10.4. Secrets Management

- **Environment Variables**: API keys (OpenRouter, Supabase) tylko na serwerze
- **No exposure**: Nigdy w kodzie klienta
- **.env files**: W .gitignore

---

## 11. Mapowanie User Stories na UI

| User Story ID | Opis | Widok/Komponenty | Status |
|---------------|------|-----------------|--------|
| US-001 | Rejestracja użytkownika | `/register` - `RegisterForm` | ✅ Covered |
| US-002 | Logowanie | `/login` - `LoginForm` | ✅ Covered |
| US-003 | Wylogowanie | Header - `LogoutButton` | ✅ Covered |
| US-004 | Generowanie propozycji AI | `/` - `GenerateTab`, `ProposalsList` | ✅ Covered |
| US-005 | Walidacja tekstu wejściowego | `/` - `GenerateTab` (character counter, validation) | ✅ Covered |
| US-006 | Zarządzanie pojedynczą propozycją | `/` - `ProposalCard` (edit/accept/remove) | ✅ Covered |
| US-007 | Akcje grupowe propozycji | `/` - `BatchActionsBar` | ✅ Covered |
| US-008 | Manualne tworzenie fiszki | `/` - `ManualAddTab` | ✅ Covered |
| US-009 | Lista zapisanych fiszek | `/manage` - `FlashcardGrid`, `FlashcardCard` | ✅ Covered |
| US-010 | Wyszukiwanie fiszek | `/manage` - `ToolBar`, `SearchInput` | ✅ Covered |
| US-011 | Edycja fiszki | `/manage` - `EditFlashcardModal` | ✅ Covered |
| US-012 | Usuwanie fiszki | `/manage` - `DeleteConfirmationModal` | ✅ Covered |
| US-013 | Przeglądanie fiszek | `/review` - `ReviewCard`, `ReviewControls` | ✅ Covered |

**Wszystkie user stories z PRD są pokryte przez architekturę UI.**

---

## 12. Punkty bólu użytkownika i rozwiązania UI

### 12.1. Problem: Czasochłonność tworzenia fiszek

**Rozwiązanie UI**:
- Zakładka "Generuj" domyślnie aktywna (promowanie AI generation)
- Szybki przepływ: wklej tekst → jedno kliknięcie → 12 gotowych propozycji
- Batch actions: Zapisanie wielu fiszek jednym kliknięciem

---

### 12.2. Problem: Potrzeba dostosowania propozycji AI

**Rozwiązanie UI**:
- Łatwy dostęp do edycji (jeden klik ikony)
- Modal edycji z pre-filled wartościami
- Możliwość akceptacji bez edycji lub edycji przed akceptacją
- Wizualna oznaka edytowanych propozycji

---

### 12.3. Problem: Zarządzanie dużą kolekcją fiszek

**Rozwiązanie UI**:
- Wyszukiwanie full-text (przód + tył)
- Filtrowanie po źródle (manual/ai)
- Sortowanie (najnowsze/najstarsze)
- Paginacja dla wydajności
- Responsywna siatka (przejrzystość)

---

### 12.4. Problem: Brak motywacji do regularnego korzystania

**Rozwiązanie UI**:
- Prosty tryb przeglądania (jeden klik "Ucz się")
- Immersive review mode (focus na nauce)
- Progress indicator (poczucie postępu)
- Completion screen (gratyfikacja)

---

### 12.5. Problem: Niepewność co do jakości propozycji AI

**Rozwiązanie UI**:
- Wyraźne oznaczenie źródła (badge 'AI' vs 'Ręczna')
- Możliwość edycji każdej propozycji przed zapisaniem
- Tracking edycji (do przyszłej analizy jakości modelu)

---

## 13. Przyszłe rozszerzenia architektury UI (poza MVP)

Architektura została zaprojektowana z myślą o skalowalności. Potencjalne rozszerzenia:

1. **Spaced Repetition Algorithm**:
   - Nowe pola w UI: due_date, difficulty, last_reviewed
   - "Smart Review" mode z algorytmem SuperMemo/Anki

2. **Talie/Kolekcje tematyczne**:
   - Nowy widok: `/decks`
   - Grupowanie fiszek w talie
   - Nawigacja deck → flashcards

3. **Tagging System**:
   - Input tagów w `EditFlashcardModal` i `ManualAddTab`
   - Filtrowanie po tagach w `/manage`

4. **Import/Export**:
   - Nowy widok: `/import`
   - Upload plików (PDF, CSV, Anki format)

5. **Social Features**:
   - Publiczne talie
   - Sharing/collaboration

6. **Gamification**:
   - Streaks, achievements
   - Progress dashboard

7. **Mobile App**:
   - Optymalizacja UI
   - Offline mode (PWA)

---

## 14. Podsumowanie kluczowych decyzji architektonicznych

1. **Rozdzielenie kontekstów**: Tworzenie (/) vs Zarządzanie (/manage) vs Nauka (/review)
2. **Reużywalność**: Wspólny `EditFlashcardModal` dla różnych kontekstów
3. **Asynchroniczność**: Blokada UI + loading states dla jasnej komunikacji
4. **Optimistic Updates**: Natychmiastowa responsywność UI z rollback na błędach
5. **Dwupoziomowa obsługa błędów**: Inline + globalne toasty
6. **Mobile-first**: Responsywny grid (1-3 kolumny) i touch-friendly controls
7. **Dostępność**: Semantic HTML, ARIA, keyboard navigation, focus management
8. **Bezpieczeństwo**: Route guards, JWT auth, client-side validation
9. **Skalowalność**: Przygotowanie na przyszłe rozszerzenia (SRS, decks, tags)

---

**Koniec dokumentu architektury UI dla 10x Cards MVP**

