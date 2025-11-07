# GitHub Actions Setup

## Konfiguracja Tests Validation Workflow

Ten dokument opisuje jak skonfigurować środowisko GitHub Actions dla workflow `tests-validation.yml`.

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
| `PUBLIC_SUPABASE_URL` | Publiczny URL instancji Supabase testowej | `https://xxxxx.supabase.co` |
| `PUBLIC_SUPABASE_KEY` | Publiczny klucz API Supabase (anon key) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `E2E_USERNAME` | Email użytkownika testowego E2E | `test@10xcards.test` |
| `E2E_PASSWORD` | Hasło użytkownika testowego E2E | `SecurePassword123!` |

**Ważne:** 
- Upewnij się, że użytkownik testowy z podanymi danymi logowania istnieje w bazie danych testowej Supabase.
- Wszystkie sekrety muszą być skonfigurowane w środowisku `integration`, nie jako repository secrets.

**Uwaga o OpenRouter:**
Testy E2E nie testują funkcjonalności generowania fiszek przez AI (aby uniknąć kosztów API). W związku z tym zmienne `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` i `SITE_URL` nie są wymagane dla testów.

### 2. Repository Secrets (opcjonalne)

Jeśli chcesz używać Codecov (obecnie wyłączone w workflow):

1. Przejdź do `Settings` → `Secrets and variables` → `Actions`
2. Kliknij `New repository secret`
3. Dodaj:

| Nazwa sekretu | Opis | Gdzie uzyskać |
|---------------|------|---------------|
| `CODECOV_TOKEN` | Token do przesyłania raportów coverage | https://codecov.io/ |

## Jak działa przekazywanie zmiennych środowiskowych

### W CI (GitHub Actions)

**Ważne:** Zmienne środowiskowe muszą być zdefiniowane na poziomie **job'a**, nie tylko w kroku testów!

```yaml
e2e-test:
  environment: integration
  env:
    PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
    PUBLIC_SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
  steps:
    - name: Run E2E tests
      run: npm run test:e2e
```

Zmienne są dostępne dla wszystkich kroków w job'ie, w tym dla Playwright config, który ładuje się przed uruchomieniem testów.

### Lokalnie
```bash
# Playwright ładuje .env.test automatycznie
npm run test:e2e
```
Zmienne są ładowane z pliku `.env.test` przez `dotenv`.

### Logika w `playwright.config.ts`
```typescript
// W CI: zmienne z GitHub Actions secrets (już załadowane na poziomie job'a)
// Lokalnie: zmienne z .env.test
if (!process.env.CI) {
  dotenv.config({ path: ".env.test" });
}
```

## Struktura workflow

Workflow `tests-validation.yml` składa się z 4 etapów:

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

## Uruchamianie workflow

### Automatyczne
Workflow uruchamia się automatycznie przy każdym Pull Request do brancha `master`.

### Ręczne
1. Przejdź do zakładki **Actions**
2. Wybierz workflow **Tests Validation**
3. Kliknij **Run workflow**
4. Wybierz branch i kliknij **Run workflow**

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
3. Sprawdź czy wszystkie 4 sekrety są skonfigurowane (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`, `E2E_USERNAME`, `E2E_PASSWORD`)
4. **Ważne:** Upewnij się, że zmienne środowiskowe są zdefiniowane na poziomie `env:` w job'ie `e2e-test`, nie tylko w kroku `Run E2E tests`

### Problem: E2E testy failują z błędami logowania

**Rozwiązanie:**
1. Sprawdź czy użytkownik testowy istnieje w bazie danych Supabase
2. Sprawdź czy dane logowania są poprawne
3. Sprawdź czy `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` są poprawne

### Problem: E2E testy failują z błędami Supabase connection

**Rozwiązanie:**
1. Sprawdź czy instancja Supabase jest dostępna
2. Sprawdź czy `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` są poprawnie skopiowane (bez spacji na końcu)
3. Sprawdź czy baza danych ma uruchomione wszystkie migracje

### Problem: Unit testy failują z "ECONNREFUSED"

**Rozwiązanie:** Ten problem powinien być rozwiązany przez:
1. Wykluczenie testów E2E z Vitest (`vitest.config.ts`)
2. Poprawne mockowanie fetch w testach
3. Użycie fake timers w testach timeout

### Problem: Workflow nie uruchamia się

**Rozwiązanie:**
1. Sprawdź czy Pull Request jest skierowany do brancha `master`
2. Sprawdź czy plik `.github/workflows/tests-validation.yml` jest w branchu `master`
3. Sprawdź logi w zakładce Actions

### Problem: WebServer nie startuje w CI

**Rozwiązanie:**
1. Sprawdź czy zmienne `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` są poprawnie skonfigurowane
2. Sprawdź logi webServer w Playwright report
3. Sprawdź czy port 3001 jest dostępny

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

## Różnice między środowiskiem lokalnym a CI

| Aspekt | Lokalnie | W CI (GitHub Actions) |
|--------|----------|----------------------|
| Zmienne środowiskowe | Z pliku `.env.test` | Z GitHub Secrets (na poziomie job'a) |
| WebServer command | `dotenv -e .env.test -- astro dev` | `astro dev` (zmienne już w env) |
| Playwright dotenv | Ładuje `.env.test` | Pomija (używa env z Actions) |
| Poziom env w workflow | N/A | Job level (`e2e-test.env`) |
| Retry tests | 0 | 2 |
| Workers | Domyślnie | 1 |

**Uwaga:** W CI zmienne muszą być na poziomie job'a, aby Playwright config mógł je odczytać podczas inicjalizacji.

## Dodatkowe zasoby

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Documentation](https://supabase.com/docs)

