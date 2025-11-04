# Schemat Bazy Danych - 10x Cards MVP

## 1. Tabele

### Tabela: `flashcards`

Przechowuje wszystkie fiszki utworzone przez użytkowników, zarówno manualnie, jak i wygenerowane przez AI.

| Kolumna      | Typ danych    | Ograniczenia                                                      | Opis                                                    |
|:-------------|:--------------|:------------------------------------------------------------------|:--------------------------------------------------------|
| `id`         | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                        | Unikalny identyfikator fiszki                           |
| `user_id`    | `UUID`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`        | Identyfikator właściciela fiszki                        |
| `front`      | `TEXT`        | `NOT NULL`, `CHECK (length(front) > 0 AND length(front) <= 5000)` | Treść przedniej strony fiszki (pojęcie/pytanie)         |
| `back`       | `TEXT`        | `NOT NULL`, `CHECK (length(back) > 0 AND length(back) <= 5000)`  | Treść tylnej strony fiszki (definicja/odpowiedź)        |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                       | Znacznik czasowy utworzenia fiszki                      |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                       | Znacznik czasowy ostatniej modyfikacji                  |

**Uwagi:**
- `ON DELETE CASCADE` zapewnia automatyczne usunięcie wszystkich fiszek użytkownika po usunięciu jego konta
- Ograniczenie długości (max 5000 znaków) chroni przed nadmiernym wykorzystaniem miejsca
- `updated_at` przydatne do śledzenia modyfikacji i potencjalnych przyszłych funkcji

### Tabela: `generation_logs`

Tabela do zbierania metryk związanych z generowaniem fiszek przez AI, wspierająca analizę wskaźników sukcesu MVP.

| Kolumna           | Typ danych    | Ograniczenia                                                  | Opis                                                        |
|:------------------|:--------------|:--------------------------------------------------------------|:------------------------------------------------------------|
| `id`              | `BIGSERIAL`   | `PRIMARY KEY`                                                 | Unikalny identyfikator wpisu w logu                         |
| `user_id`         | `UUID`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE SET NULL`   | Identyfikator użytkownika przeprowadzającego generację      |
| `generated_count` | `SMALLINT`    | `NOT NULL`, `CHECK (generated_count > 0)`                     | Liczba fiszek wygenerowanych przez AI                      |
| `accepted_count`  | `SMALLINT`    | `NOT NULL`, `CHECK (accepted_count >= 0 AND accepted_count <= generated_count)` | Liczba fiszek zaakceptowanych przez użytkownika |
| `created_at`      | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                   | Znacznik czasowy zdarzenia generacji                        |

**Uwagi:**
- `ON DELETE SET NULL` zachowuje dane metryczne nawet po usunięciu konta użytkownika
- `BIGSERIAL` zapewnia wystarczającą przestrzeń na długoterminowe zbieranie metryk
- Dodatkowe ograniczenie `accepted_count <= generated_count` zapewnia integralność danych
- Tabela służy wyłącznie do celów analitycznych i nie jest wykorzystywana w logice aplikacji

## 2. Relacje między tabelami

### `flashcards` → `auth.users`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każda fiszka należy do dokładnie jednego użytkownika. Jeden użytkownik może mieć wiele fiszek.
- **Klucz obcy:** `flashcards.user_id` → `auth.users.id`
- **Akcja przy usunięciu:** `CASCADE` (usunięcie użytkownika usuwa wszystkie jego fiszki)

### `generation_logs` → `auth.users`
- **Typ relacji:** Wiele-do-jednego (Many-to-One)
- **Opis:** Każdy wpis w logu generacji jest powiązany z jednym użytkownikiem. Jeden użytkownik może mieć wiele wpisów w logach.
- **Klucz obcy:** `generation_logs.user_id` → `auth.users.id`
- **Akcja przy usunięciu:** `SET NULL` (zachowanie danych metrycznych po usunięciu użytkownika)

## 3. Indeksy

### Tabela: `flashcards`

| Nazwa indeksu                    | Typ indeksu | Kolumny                  | Uzasadnienie                                                                           |
|:---------------------------------|:------------|:-------------------------|:---------------------------------------------------------------------------------------|
| `idx_flashcards_user_id`         | `BTREE`     | `user_id`                | Kluczowy dla wydajności zapytań filtrujących fiszki konkretnego użytkownika (US-010)  |
| `idx_flashcards_created_at`      | `BTREE`     | `created_at DESC`        | Przyspiesza domyślne sortowanie od najnowszych do najstarszych (US-010)               |
| `idx_flashcards_user_created`    | `BTREE`     | `user_id, created_at DESC` | Indeks kompozytowy dla częstych zapytań łączących filtrowanie i sortowanie         |
| `idx_flashcards_front_back_gin`  | `GIN`       | `front, back`            | Pełnotekstowe wyszukiwanie dla funkcjonalności filtrowania/wyszukiwania (US-011)      |

**Uwagi:**
- Indeks GIN (`idx_flashcards_front_back_gin`) może wymagać użycia `to_tsvector()` dla efektywnego pełnotekstowego wyszukiwania
- Indeks kompozytowy `idx_flashcards_user_created` optymalizuje najczęstszy wzorzec zapytań w aplikacji

### Tabela: `generation_logs`

| Nazwa indeksu                      | Typ indeksu | Kolumny       | Uzasadnienie                                                             |
|:-----------------------------------|:------------|:--------------|:-------------------------------------------------------------------------|
| `idx_generation_logs_user_id`      | `BTREE`     | `user_id`     | Umożliwia szybkie agregacje metryk per użytkownik                        |
| `idx_generation_logs_created_at`   | `BTREE`     | `created_at`  | Przyspiesza analizy trendów czasowych i raportowanie metryk              |

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

### Tabela: `generation_logs`

**Brak RLS:**
- Tabela `generation_logs` służy wyłącznie do celów analitycznych i zbierania metryk
- Dostęp do tej tabeli powinien być kontrolowany na poziomie aplikacji/API
- Użytkownicy końcowi nie mają bezpośredniego dostępu do tej tabeli przez Supabase Client

## 5. Dodatkowe uwagi i decyzje projektowe

### Normalizacja
- Schemat jest znormalizowany do 3NF (Third Normal Form)
- Wszystkie tabele mają jasno zdefiniowane klucze podstawowe
- Brak redundancji danych między tabelami
- Dla MVP nie jest wymagana denormalizacja ze względów wydajnościowych

### Typy danych
- **UUID dla kluczy głównych:** Zapewnia globalną unikalność, lepsze bezpieczeństwo (brak przewidywalności ID) oraz ułatwia przyszłą dystrybucję danych
- **TEXT dla treści fiszek:** Większa elastyczność niż VARCHAR, brak różnicy w wydajności w PostgreSQL
- **TIMESTAMPTZ:** Przechowywanie znaczników czasowych z informacją o strefie czasowej zapewnia spójność w środowisku globalnym
- **SMALLINT dla liczników:** Wystarczający zakres (0-32767) dla liczby generowanych fiszek przy jednorazowej generacji

### Bezpieczeństwo
- RLS na poziomie bazy danych zapewnia dodatkową warstwę bezpieczeństwa niezależną od logiki aplikacji
- Kaskadowe usuwanie (`ON DELETE CASCADE`) zapewnia RODO compliance - usunięcie użytkownika usuwa wszystkie jego dane osobowe
- Ograniczenia CHECK walidują dane na poziomie bazy danych

### Skalowalność
- Indeksy są zaprojektowane z myślą o najczęstszych wzorcach zapytań
- Struktura pozwala na łatwe dodanie przyszłych funkcji (np. zestawy fiszek, tagi) bez konieczności przebudowy
- `BIGSERIAL` dla `generation_logs` zapewnia przestrzeń na długoterminowe zbieranie danych

### Przyszłe rozszerzenia (poza MVP)
Aktualna struktura umożliwia łatwe dodanie w przyszłości:
- Tabela `decks` (zestawy fiszek) z relacją many-to-many do `flashcards`
- Tabela `tags` z relacją many-to-many do `flashcards`
- Tabela `learning_sessions` do śledzenia sesji nauki
- Tabela `spaced_repetition_data` dla algorytmów powtórek
- Kolumna `source` w `flashcards` do rozróżnienia źródła (AI vs manual)

### Metryki sukcesu
Schemat wspiera obliczanie metryk MVP:
- **Wskaźnik akceptacji AI:** `SUM(accepted_count) / SUM(generated_count)` z tabeli `generation_logs`
- **Wskaźnik wykorzystania AI:** Porównanie liczby wpisów w `generation_logs` (generacje) z całkowitą liczbą fiszek w `flashcards` (wymaga dodatkowego śledzenia źródła fiszki lub analizy temporalnej)

### Migracje
- Schemat jest gotowy do implementacji za pomocą narzędzi migracji Supabase
- Zaleca się utworzenie oddzielnych plików migracji dla:
  1. Utworzenia tabel
  2. Utworzenia indeksów
  3. Włączenia RLS i utworzenia polityk

