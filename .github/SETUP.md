# GitHub Actions Setup

## Konfiguracja Pull Request CI Workflow

Ten dokument opisuje jak skonfigurować środowisko GitHub Actions dla workflow `pull-request.yml`.

## Wymagane sekrety

### 1. Environment "integration"

Najpierw utwórz środowisko `integration`:

1. Przejdź do `Settings` → `Environments`
2. Kliknij `New environment`
3. Wpisz nazwę: **integration**
4. Kliknij `Configure environment`

Następnie dodaj sekrety do środowiska `integration`:

#### Environment Secrets - integration

| Nazwa sekretu | Opis | Przykład |
|---------------|------|----------|
| `PUBLIC_SUPABASE_URL` | Publiczny URL instancji Supabase | `https://xxxxx.supabase.co` |
| `PUBLIC_SUPABASE_KEY` | Publiczny klucz API Supabase (anon key) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `E2E_USERNAME` | Email użytkownika testowego E2E | `test@10xcards.test` |
| `E2E_PASSWORD` | Hasło użytkownika testowego E2E | `SecurePassword123!` |

**Ważne:** Upewnij się, że użytkownik testowy z podanymi danymi logowania istnieje w bazie danych testowej Supabase.

### 2. Repository Secrets (opcjonalne)

Jeśli chcesz używać Codecov (obecnie wyłączone w workflow):

1. Przejdź do `Settings` → `Secrets and variables` → `Actions`
2. Kliknij `New repository secret`
3. Dodaj:

| Nazwa sekretu | Opis | Gdzie uzyskać |
|---------------|------|---------------|
| `CODECOV_TOKEN` | Token do przesyłania raportów coverage | https://codecov.io/ |

## Struktura workflow

Workflow `pull-request.yml` składa się z 4 etapów:

```
┌─────────┐
│  Lint   │
└────┬────┘
     │
     ├────────────────┐
     │                │
┌────▼────┐    ┌─────▼─────┐
│ Unit    │    │    E2E    │
│ Tests   │    │   Tests   │
└────┬────┘    └─────┬─────┘
     │                │
     └────────┬───────┘
              │
     ┌────────▼────────┐
     │  Status Comment │
     └─────────────────┘
```

1. **Lint** - Lintowanie kodu (ESLint)
2. **Unit Tests** (równolegle) - Testy jednostkowe z Vitest
3. **E2E Tests** (równolegle) - Testy E2E z Playwright
4. **Status Comment** - Komentarz w PR (tylko jeśli wszystko przeszło)

## Artifacts

Workflow generuje następujące artefakty (dostępne w zakładce Actions):

- **unit-coverage-report** - Raport coverage z testów jednostkowych (30 dni)
- **playwright-report** - Raport z testów E2E Playwright (30 dni)

## Konfiguracja bazy danych testowej

### Supabase Test Instance

1. Utwórz oddzielną instancję Supabase dla testów E2E (lub użyj lokalnej instancji)
2. Uruchom migracje z folderu `supabase/migrations/`
3. Utwórz użytkownika testowego:
   - Email: wartość z `E2E_USERNAME`
   - Hasło: wartość z `E2E_PASSWORD`

### Przykład SQL do utworzenia użytkownika testowego

```sql
-- Użyj Supabase Dashboard → Authentication → Users → Add user
-- Lub użyj API Supabase do utworzenia użytkownika
```

## Troubleshooting

### Problem: "Context access might be invalid" w linterze

**Rozwiązanie:** To jest normalne ostrzeżenie - linter nie ma dostępu do konfiguracji sekretów GitHub. Workflow będzie działać poprawnie po skonfigurowaniu sekretów.

### Problem: E2E testy failują z "E2E_USERNAME and E2E_PASSWORD must be set"

**Rozwiązanie:** 
1. Sprawdź czy sekrety `E2E_USERNAME` i `E2E_PASSWORD` są dodane do środowiska `integration`
2. Sprawdź czy nazwa środowiska jest dokładnie `integration` (case-sensitive)

### Problem: E2E testy failują z błędami logowania

**Rozwiązanie:**
1. Sprawdź czy użytkownik testowy istnieje w bazie danych Supabase
2. Sprawdź czy dane logowania są poprawne
3. Sprawdź czy `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` są poprawne

### Problem: Unit testy failują z "ECONNREFUSED"

**Rozwiązanie:** Ten problem powinien być rozwiązany przez:
1. Wykluczenie testów E2E z Vitest (`vitest.config.ts`)
2. Poprawne mockowanie fetch w testach
3. Użycie fake timers w testach timeout

### Problem: Workflow nie uruchamia się

**Rozwiązanie:**
1. Sprawdź czy Pull Request jest skierowany do brancha `master`
2. Sprawdź czy plik `.github/workflows/pull-request.yml` jest w branchu `master`
3. Sprawdź logi w zakładce Actions

## Lokalne testowanie

Przed pushowaniem zmian, przetestuj lokalnie:

```bash
# Lint
npm run lint

# Unit tests
npm run test

# Unit tests z coverage
npm run test:coverage

# E2E tests (wymaga uruchomionego środowiska)
npm run test:e2e
```

## Monitoring

Sprawdzaj status workflow w:
- Zakładka **Actions** w repozytorium GitHub
- Status checks w Pull Requestach
- Komentarze automatyczne w PR po zakończeniu wszystkich testów

## Dodatkowe zasoby

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Documentation](https://supabase.com/docs)

