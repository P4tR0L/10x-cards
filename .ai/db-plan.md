# Schemat Bazy Danych - 10x Cards MVP

## 1. Tabele

### Tabela: `flashcards`

Przechowuje wszystkie fiszki utworzone przez użytkowników, zarówno manualnie, jak i wygenerowane przez AI.

| Kolumna         | Typ danych    | Ograniczenia                                                      | Opis                                                    |
|:----------------|:--------------|:------------------------------------------------------------------|:--------------------------------------------------------|
| `id`            | `BIGINT`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`                     | Unikalny identyfikator fiszki                           |
| `user_id`       | `UUID`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`        | Identyfikator właściciela fiszki                        |
| `front`         | `VARCHAR(5000)` | `NOT NULL`, `CHECK (length(front) > 0)`                         | Treść przedniej strony fiszki (pojęcie/pytanie)         |
| `back`          | `VARCHAR(5000)` | `NOT NULL`, `CHECK (length(back) > 0)`                          | Treść tylnej strony fiszki (definicja/odpowiedź)        |
| `source`        | `VARCHAR(20)` | `NOT NULL`, `CHECK (source IN ('manual', 'ai'))`                  | Źródło utworzenia fiszki (manual/ai)                    |
| `generation_id` | `BIGINT`      | `REFERENCES generations(id) ON DELETE SET NULL`                   | Identyfikator generacji AI (NULL dla fiszek manualnych) |
| `created_at`    | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                       | Znacznik czasowy utworzenia fiszki                      |
| `updated_at`    | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                       | Znacznik czasowy ostatniej modyfikacji                  |

**Uwagi:**
- `ON DELETE CASCADE` zapewnia automatyczne usunięcie wszystkich fiszek użytkownika po usunięciu jego konta
- Ograniczenie długości (max 5000 znaków) chroni przed nadmiernym wykorzystaniem miejsca
- `updated_at` przydatne do śledzenia modyfikacji i potencjalnych przyszłych funkcji
- Kolumna `source` rozróżnia fiszki utworzone manualnie od wygenerowanych przez AI
- `generation_id` łączy fiszkę z konkretną sesją generacji AI, NULL dla fiszek manualnych

### Tabela: `generations`

Tabela do zbierania metryk związanych z generowaniem fiszek przez AI, wspierająca analizę wskaźników sukcesu MVP.

| Kolumna                    | Typ danych    | Ograniczenia                                                  | Opis                                                        |
|:---------------------------|:--------------|:--------------------------------------------------------------|:------------------------------------------------------------|
| `id`                       | `BIGINT`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`                 | Unikalny identyfikator sesji generacji                      |
| `user_id`                  | `UUID`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE SET NULL`   | Identyfikator użytkownika przeprowadzającego generację      |
| `model`                    | `VARCHAR(100)`| `NOT NULL`                                                    | Model LLM użyty do generacji (np. 'gpt-4', 'claude-3')     |
| `generated_count`          | `INTEGER`     | `NOT NULL`, `CHECK (generated_count > 0)`                     | Liczba fiszek wygenerowanych przez AI                      |
| `accepted_unedited_count`  | `INTEGER`     | `CHECK (accepted_unedited_count >= 0)`                        | Liczba fiszek zaakceptowanych bez edycji                   |
| `accepted_edited_count`    | `INTEGER`     | `CHECK (accepted_edited_count >= 0)`                          | Liczba fiszek zaakceptowanych po edycji                    |
| `source_text_hash`         | `VARCHAR(64)` | `NOT NULL`                                                    | Hash SHA-256 tekstu źródłowego użytego do generacji        |
| `source_text_length`       | `INTEGER`     | `NOT NULL`, `CHECK (source_text_length > 0)`                  | Długość tekstu źródłowego w znakach                        |
| `generation_duration`      | `INTEGER`     | `NOT NULL`, `CHECK (generation_duration >= 0)`                | Czas trwania generacji w milisekundach                     |
| `created_at`               | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                   | Znacznik czasowy rozpoczęcia generacji                      |
| `updated_at`               | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                   | Znacznik czasowy ostatniej aktualizacji (akceptacji)        |

**Uwagi:**
- `ON DELETE SET NULL` zachowuje dane metryczne nawet po usunięciu konta użytkownika
- `GENERATED ALWAYS AS IDENTITY` zapewnia automatyczne generowanie unikalnych identyfikatorów
- Pola `accepted_unedited_count` i `accepted_edited_count` są nullable - mogą być aktualizowane później, gdy użytkownik akceptuje/odrzuca fiszki
- `source_text_hash` pozwala na identyfikację duplikatów i analizę, które teksty źródłowe generują najlepsze wyniki
- `source_text_length` pomaga w analizie wpływu długości tekstu na jakość generacji
- `generation_duration` umożliwia monitorowanie wydajności API i identyfikację problemów z czasem odpowiedzi
- `updated_at` aktualizowany przy każdej zmianie liczników akceptacji

### Tabela: `generation_error_logs`

Tabela do trackowania błędów występujących podczas generowania fiszek przez AI, umożliwiająca analizę problemów i poprawę jakości usługi.

| Kolumna              | Typ danych    | Ograniczenia                                                | Opis                                                           |
|:---------------------|:--------------|:------------------------------------------------------------|:---------------------------------------------------------------|
| `id`                 | `BIGINT`      | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY`               | Unikalny identyfikator wpisu błędu                             |
| `user_id`            | `UUID`        | `REFERENCES auth.users(id) ON DELETE SET NULL`             | Identyfikator użytkownika (NULL dla błędów systemowych)        |
| `model`              | `VARCHAR(100)`|                                                             | Model LLM użyty podczas próby generacji (opcjonalny)           |
| `source_text_hash`   | `VARCHAR(64)` |                                                             | Hash SHA-256 tekstu źródłowego (opcjonalny)                    |
| `source_text_length` | `INTEGER`     | `CHECK (source_text_length IS NULL OR source_text_length > 0)` | Długość tekstu źródłowego w znakach (opcjonalny)            |
| `error_code`         | `VARCHAR(50)` |                                                             | Kod błędu zwrócony przez API/system (opcjonalny)               |
| `error_message`      | `TEXT`        | `NOT NULL`, `CHECK (length(error_message) > 0)`            | Komunikat opisujący błąd                                       |
| `created_at`         | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                 | Znacznik czasowy wystąpienia błędu                             |

**Uwagi:**
- `user_id` może być NULL dla błędów systemowych niezwiązanych z konkretnym użytkownikiem
- `ON DELETE SET NULL` zachowuje logi błędów do analizy nawet po usunięciu konta użytkownika
- Pole `model` jest opcjonalne (nullable) - błąd może wystąpić przed wyborem modelu
- `source_text_hash` i `source_text_length` pozwalają na analizę korelacji między właściwościami tekstu źródłowego a błędami
- `GENERATED ALWAYS AS IDENTITY` zapewnia automatyczne generowanie unikalnych identyfikatorów
- Tabela służy wyłącznie do celów analitycznych, debugowania i monitoringu

## 2. Relacje między tabelami

### `flashcards` → `auth.users`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każda fiszka należy do dokładnie jednego użytkownika. Jeden użytkownik może mieć wiele fiszek.
- **Klucz obcy:** `flashcards.user_id` → `auth.users.id`
- **Akcja przy usunięciu:** `CASCADE` (usunięcie użytkownika usuwa wszystkie jego fiszki)

### `flashcards` → `generations`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każda fiszka wygenerowana przez AI jest powiązana z dokładnie jedną sesją generacji. Jedna sesja generacji może wygenerować wiele fiszek. Relacja jest opcjonalna - fiszki manualne mają `generation_id = NULL`.
- **Klucz obcy:** `flashcards.generation_id` → `generations.id`
- **Akcja przy usunięciu:** `SET NULL` (usunięcie generacji nie usuwa fiszek, tylko rozłącza powiązanie)

### `generations` → `auth.users`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każdy wpis generacji jest powiązany z jednym użytkownikiem. Jeden użytkownik może mieć wiele sesji generacji.
- **Klucz obcy:** `generations.user_id` → `auth.users.id`
- **Akcja przy usunięciu:** `SET NULL` (zachowanie danych metrycznych po usunięciu użytkownika)

### `generation_error_logs` → `auth.users`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każdy wpis w logu błędów może być powiązany z jednym użytkownikiem. Jeden użytkownik może mieć wiele wpisów błędów. Relacja jest opcjonalna (nullable) dla błędów systemowych.
- **Klucz obcy:** `generation_error_logs.user_id` → `auth.users.id`
- **Akcja przy usunięciu:** `SET NULL` (zachowanie logów błędów do analizy po usunięciu użytkownika)

## 3. Indeksy

### Tabela: `flashcards`

| Nazwa indeksu                    | Typ indeksu | Kolumny                  | Uzasadnienie                                                                           |
|:---------------------------------|:------------|:-------------------------|:---------------------------------------------------------------------------------------|
| `idx_flashcards_user_id`         | `BTREE`     | `user_id`                | Kluczowy dla wydajności zapytań filtrujących fiszki konkretnego użytkownika (US-010)  |
| `idx_flashcards_generation_id`   | `BTREE`     | `generation_id`          | Umożliwia szybkie pobieranie wszystkich fiszek z danej sesji generacji                |
| `idx_flashcards_created_at`      | `BTREE`     | `created_at DESC`        | Przyspiesza domyślne sortowanie od najnowszych do najstarszych (US-010)               |
| `idx_flashcards_user_created`    | `BTREE`     | `user_id, created_at DESC` | Indeks kompozytowy dla częstych zapytań łączących filtrowanie i sortowanie         |
| `idx_flashcards_source`          | `BTREE`     | `source`                 | Przyspiesza filtrowanie fiszek według źródła (manual/ai)                               |
| `idx_flashcards_front_back_gin`  | `GIN`       | `front, back`            | Pełnotekstowe wyszukiwanie dla funkcjonalności filtrowania/wyszukiwania (US-011)      |

**Uwagi:**
- Indeks GIN (`idx_flashcards_front_back_gin`) może wymagać użycia `to_tsvector()` dla efektywnego pełnotekstowego wyszukiwania
- Indeks kompozytowy `idx_flashcards_user_created` optymalizuje najczęstszy wzorzec zapytań w aplikacji
- Indeks na `generation_id` wspiera analizy wydajności generacji i pobieranie powiązanych fiszek

### Tabela: `generations`

| Nazwa indeksu                      | Typ indeksu | Kolumny                   | Uzasadnienie                                                             |
|:-----------------------------------|:------------|:--------------------------|:-------------------------------------------------------------------------|
| `idx_generations_user_id`          | `BTREE`     | `user_id`                 | Umożliwia szybkie agregacje metryk per użytkownik                        |
| `idx_generations_model`            | `BTREE`     | `model`                   | Przyspiesza analizy wydajności i porównania różnych modeli LLM           |
| `idx_generations_created_at`       | `BTREE`     | `created_at DESC`         | Przyspiesza analizy trendów czasowych i raportowanie metryk              |
| `idx_generations_source_hash`      | `BTREE`     | `source_text_hash`        | Umożliwia szybkie wyszukiwanie duplikatów i analizy popularnych tekstów  |

### Tabela: `generation_error_logs`

| Nazwa indeksu                          | Typ indeksu | Kolumny                  | Uzasadnienie                                                                |
|:---------------------------------------|:------------|:-------------------------|:----------------------------------------------------------------------------|
| `idx_generation_error_logs_user_id`    | `BTREE`     | `user_id`                | Umożliwia szybkie filtrowanie błędów per użytkownik                         |
| `idx_generation_error_logs_model`      | `BTREE`     | `model`                  | Przyspiesza analizy błędów według modelu LLM                                |
| `idx_generation_error_logs_created_at` | `BTREE`     | `created_at DESC`        | Umożliwia szybkie pobieranie najnowszych błędów i analizy trendów czasowych |
| `idx_generation_error_logs_source_hash`| `BTREE`     | `source_text_hash`       | Umożliwia identyfikację problemów z konkretnymi tekstami źródłowymi         |

**Uwagi:**
- Indeks na `user_id` wspiera analizy błędów per użytkownik i identyfikację problematycznych kont
- Indeks na `model` pozwala na identyfikację modeli z najwyższym wskaźnikiem błędów
- Sortowanie DESC na `created_at` optymalizuje wyświetlanie najnowszych błędów
- Indeks na `source_text_hash` pomaga w identyfikacji problematycznych tekstów źródłowych

## 4. Row-Level Security (RLS)

### Tabela: `flashcards`

**Włączenie RLS:**
```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
```

**Polityki bezpieczeństwa:**

#### Polityka SELECT (Odczyt)
- **Nazwa:** `flashcards_select_policy`
- **Operacja:** `SELECT`
- **Reguła:** Użytkownik może odczytywać tylko swoje własne fiszki
- **Warunek:** `auth.uid() = user_id`

#### Polityka INSERT (Tworzenie)
- **Nazwa:** `flashcards_insert_policy`
- **Operacja:** `INSERT`
- **Reguła:** Użytkownik może tworzyć fiszki tylko dla samego siebie
- **Warunek:** `auth.uid() = user_id`

#### Polityka UPDATE (Aktualizacja)
- **Nazwa:** `flashcards_update_policy`
- **Operacja:** `UPDATE`
- **Reguła:** Użytkownik może aktualizować tylko swoje własne fiszki
- **Warunek:** `auth.uid() = user_id`

#### Polityka DELETE (Usuwanie)
- **Nazwa:** `flashcards_delete_policy`
- **Operacja:** `DELETE`
- **Reguła:** Użytkownik może usuwać tylko swoje własne fiszki
- **Warunek:** `auth.uid() = user_id`

### Tabela: `generations`

**Brak RLS:**
- Tabela `generations` służy wyłącznie do celów analitycznych i zbierania metryk
- Dostęp do tej tabeli powinien być kontrolowany na poziomie aplikacji/API
- Użytkownicy końcowi nie mają bezpośredniego dostępu do tej tabeli przez Supabase Client

### Tabela: `generation_error_logs`

**Brak RLS:**
- Tabela `generation_error_logs` służy wyłącznie do celów debugowania, monitoringu i analizy błędów
- Dostęp do tej tabeli powinien być ściśle kontrolowany na poziomie aplikacji/API
- Użytkownicy końcowi nie mają bezpośredniego dostępu do tej tabeli przez Supabase Client
- Tylko administratorzy i systemy monitorujące powinny mieć dostęp do tych danych
- Należy zapewnić rotację/archiwizację starych logów zgodnie z polityką retencji danych

## 5. Dodatkowe uwagi i decyzje projektowe

### Normalizacja
- Schemat jest znormalizowany do 3NF (Third Normal Form)
- Wszystkie tabele mają jasno zdefiniowane klucze podstawowe
- Brak redundancji danych między tabelami
- Dla MVP nie jest wymagana denormalizacja ze względów wydajnościowych

### Typy danych
- **BIGINT dla kluczy głównych tabel aplikacyjnych:** Zapewnia wystarczający zakres dla długoterminowego wzrostu (do 9 quintillion wpisów), łatwiejsze w użyciu niż UUID w kontekście sortowania i indeksowania
- **UUID dla user_id:** Wykorzystuje wbudowany system autentykacji Supabase (auth.users używa UUID)
- **VARCHAR z limitami dla treści fiszek:** `VARCHAR(5000)` dla `front` i `back` zapewnia ochronę przed nadmiernym wykorzystaniem miejsca przy zachowaniu elastyczności
- **VARCHAR(20) dla source:** Wystarczające dla wartości 'manual' i 'ai', z możliwością przyszłego rozszerzenia
- **TIMESTAMPTZ:** Przechowywanie znaczników czasowych z informacją o strefie czasowej zapewnia spójność w środowisku globalnym
- **INTEGER dla liczników i metryk:** Wystarczający zakres (do ~2 miliardy) dla liczby generowanych fiszek i długości tekstów
- **VARCHAR(64) dla hash:** SHA-256 generuje 64-znakowy hash w formacie hex, idealny rozmiar dla tego typu danych
- **VARCHAR(100) dla model:** Pozwala na długie nazwy modeli (np. 'claude-3-opus-20240229', 'gpt-4-turbo-preview')

### Bezpieczeństwo
- RLS na poziomie bazy danych zapewnia dodatkową warstwę bezpieczeństwa niezależną od logiki aplikacji
- Kaskadowe usuwanie (`ON DELETE CASCADE`) zapewnia RODO compliance - usunięcie użytkownika usuwa wszystkie jego dane osobowe
- Ograniczenia CHECK walidują dane na poziomie bazy danych

### Skalowalność
- Indeksy są zaprojektowane z myślą o najczęstszych wzorcach zapytań
- Struktura pozwala na łatwe dodanie przyszłych funkcji (np. zestawy fiszek, tagi) bez konieczności przebudowy
- `BIGINT` dla wszystkich tabel zapewnia przestrzeń na długoterminowy wzrost danych
- `source_text_hash` w tabelach `generations` i `generation_error_logs` umożliwia deduplikację i analizę bez przechowywania pełnych tekstów
- Tabela `generation_error_logs` powinna mieć zaimplementowaną strategię retencji danych (np. automatyczne archiwizowanie/usuwanie logów starszych niż 90 dni)

### Przyszłe rozszerzenia (poza MVP)
Aktualna struktura umożliwia łatwe dodanie w przyszłości:
- Tabela `decks` (zestawy fiszek) z relacją many-to-many do `flashcards`
- Tabela `tags` z relacją many-to-many do `flashcards`
- Tabela `learning_sessions` do śledzenia sesji nauki
- Tabela `spaced_repetition_data` dla algorytmów powtórek
- Rozszerzenie kolumny `source` o dodatkowe wartości (np. 'import', 'api')

### Metryki sukcesu
Schemat wspiera obliczanie metryk MVP:
- **Wskaźnik akceptacji AI (ogólny):** `SUM(accepted_unedited_count + accepted_edited_count) / SUM(generated_count)` z tabeli `generations`
- **Wskaźnik akceptacji bez edycji:** `SUM(accepted_unedited_count) / SUM(generated_count)` - mierzy jakość generacji AI
- **Wskaźnik edycji:** `SUM(accepted_edited_count) / SUM(accepted_unedited_count + accepted_edited_count)` - procent zaakceptowanych fiszek wymagających edycji
- **Wskaźnik akceptacji per model:** Grupowanie według `model` umożliwia porównanie wydajności różnych modeli LLM
- **Wskaźnik wykorzystania AI:** `COUNT(*) WHERE source='ai' / COUNT(*)` z tabeli `flashcards` - procent fiszek wygenerowanych przez AI
- **Analiza długości tekstu źródłowego:** Korelacja między `source_text_length` a wskaźnikami akceptacji pomaga zoptymalizować długość inputu
- **Analiza czasu generacji:** Agregacja `generation_duration` pozwala na monitorowanie wydajności API i identyfikację problemów
- **Wskaźnik błędów generacji:** `COUNT(*) FROM generation_error_logs` / `COUNT(*) FROM generations` - procent nieudanych prób generacji
- **Wskaźnik błędów per model:** Grupowanie błędów według `model` pozwala na identyfikację modeli z najwyższą awaryjnością
- **Identyfikacja problematycznych tekstów:** Analiza `source_text_hash` w obu tabelach pozwala zidentyfikować teksty źródłowe powodujące błędy
- **Identyfikacja problematycznych użytkowników:** Zliczanie błędów per `user_id` umożliwia wykrycie nadużyć lub problemów z konkretnymi kontami
- **Optymalizacja kosztów:** Analiza użycia modeli pozwala na optymalizację kosztów API poprzez identyfikację najbardziej efektywnego modelu

### Migracje
- Schemat jest gotowy do implementacji za pomocą narzędzi migracji Supabase
- Zaleca się utworzenie oddzielnych plików migracji dla:
  1. Utworzenia tabel (`flashcards`, `generations`, `generation_error_logs`)
  2. Utworzenia indeksów (dla wszystkich trzech tabel)
  3. Włączenia RLS i utworzenia polityk (tylko dla `flashcards`)
- Tabela `generation_error_logs` może być dodana w osobnej migracji już po wdrożeniu MVP, jeśli nie jest krytyczna w pierwszej wersji
- Kolejność tworzenia tabel: najpierw `generations`, potem `flashcards` (ze względu na klucz obcy `generation_id`)

