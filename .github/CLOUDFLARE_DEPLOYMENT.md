# Cloudflare Pages Deployment

## Wymagane konfiguracje

### GitHub Secrets

W ustawieniach repozytorium GitHub (Settings → Secrets and variables → Actions → Repository secrets) dodaj następujące secrets:

#### Cloudflare Credentials

1. **CLOUDFLARE_API_TOKEN**
   - Wygeneruj w Cloudflare Dashboard: My Profile → API Tokens → Create Token
   - Wybierz template "Edit Cloudflare Workers" lub utwórz własny z uprawnieniami:
     - Account - Cloudflare Pages: Edit
   
2. **CLOUDFLARE_ACCOUNT_ID**
   - Znajdziesz w Cloudflare Dashboard → Workers & Pages → Overview (na prawym pasku)
   - Format: 32-znakowy ciąg

3. **CLOUDFLARE_PROJECT_NAME**
   - Nazwa projektu Cloudflare Pages (bez przestrzeni, lowercase)
   - Przykład: `10x-cards`

#### Application Environment Variables

Te zmienne są używane podczas buildu i muszą być ustawione zarówno w GitHub Secrets jak i w Cloudflare Pages:

4. **PUBLIC_SUPABASE_URL**
   - URL Twojego projektu Supabase
   
5. **PUBLIC_SUPABASE_KEY**
   - Anon/Public key z Supabase
   
6. **OPENROUTER_API_KEY**
   - API key z OpenRouter.ai
   
7. **OPENROUTER_MODEL**
   - Model AI do użycia (np. `anthropic/claude-3.5-sonnet`)
   
8. **SITE_URL**
   - URL produkcyjnej strony (np. `https://10x-cards.pages.dev`)

### GitHub Environment

1. W Settings → Environments utwórz environment o nazwie `production`
2. Opcjonalnie możesz dodać Protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches (tylko `master`)

## Workflow

Workflow `master.yml` został skonfigurowany do automatycznego wdrożenia na Cloudflare Pages przy każdym push do gałęzi `master`.

### Kroki workflow:

1. **Lint Code** - Sprawdzenie jakości kodu
2. **Unit Tests** - Uruchomienie testów jednostkowych z coverage
3. **Build Application** - Budowanie aplikacji
4. **Deploy to Cloudflare Pages** - Wdrożenie na Cloudflare Pages

### Ręczne uruchomienie

Workflow można również uruchomić ręcznie:
- Przejdź do Actions → Deploy to Cloudflare Pages → Run workflow

## Technologia

### Astro + Cloudflare Adapter

Projekt został skonfigurowany z adapterem `@astrojs/cloudflare`:

- **Package**: `@astrojs/cloudflare@^12.6.10`
- **Konfiguracja**: `astro.config.mjs`
- **Output mode**: `server` (SSR)
- **Adapter mode**: `directory` (tworzy `_worker.js` dla Cloudflare Workers/Functions)
- **Wrangler config**: `wrangler.toml`

### GitHub Actions

Używane akcje (wszystkie w najnowszych wersjach):

- `actions/checkout@v5`
- `actions/setup-node@v6`
- `actions/upload-artifact@v5`
- `actions/download-artifact@v6`
- `cloudflare/wrangler-action@v3` (zastąpienie przestarzałej `pages-action`)

## Konfiguracja zmiennych środowiskowych w Cloudflare

⚠️ **WAŻNE**: Zmienne środowiskowe muszą być skonfigurowane **ZARÓWNO** w GitHub Secrets (dla procesu build w CI/CD) **JAK I** w Cloudflare Pages (dla runtime aplikacji).

### Cloudflare Pages - Environment Variables

1. W Cloudflare Dashboard przejdź do: **Workers & Pages** → **[Twój projekt]** → **Settings** → **Environment variables**
2. Dodaj następujące zmienne dla środowiska **Production**:
   - `PUBLIC_SUPABASE_URL` - URL projektu Supabase
   - `PUBLIC_SUPABASE_KEY` - Public key z Supabase
   - `OPENROUTER_API_KEY` - API key OpenRouter
   - `OPENROUTER_MODEL` - Model AI (np. `anthropic/claude-3.5-sonnet`)
   - `SITE_URL` - URL produkcyjnej strony

### Dlaczego zmienne są potrzebne w dwóch miejscach?

- **GitHub Secrets** - używane podczas **budowania** aplikacji (build time)
- **Cloudflare Environment Variables** - używane podczas **działania** aplikacji (runtime)

## Deployment URL

Po wdrożeniu aplikacja będzie dostępna pod adresem:
- **Production**: `https://[project-name].pages.dev`
- **Preview branches**: `https://[branch].[project-name].pages.dev`

## Troubleshooting

### Build fails w GitHub Actions

1. Sprawdź logi w: **Actions** → Failed workflow → **Build Application**
2. Upewnij się, że wszystkie zmienne środowiskowe są ustawione w **GitHub Secrets**
3. Sprawdź czy dependencies instalują się poprawnie (`npm ci`)

### Deployment fails

1. Zweryfikuj secrets w GitHub (wszystkie 8 zmiennych)
2. Sprawdź uprawnienia API Token w Cloudflare
3. Upewnij się, że projekt Cloudflare Pages istnieje
4. Sprawdź logi deployment w Cloudflare: **Workers & Pages** → **[Project]** → **Deployments**

### Strona nie działa / Błąd 500

**Najczęstsze przyczyny:**

1. **Brak zmiennych środowiskowych w Cloudflare Pages**
   - Przejdź do: Workers & Pages → [Project] → Settings → Environment variables
   - Dodaj wszystkie zmienne z sekcji "Application Environment Variables"
   - Upewnij się, że są ustawione dla środowiska **Production**

2. **Nieprawidłowy URL w SITE_URL**
   - Sprawdź czy SITE_URL w Cloudflare Pages jest identyczny z faktycznym URL
   - Format: `https://twoj-projekt.pages.dev` (bez trailing slash)

3. **Problem z Supabase connection**
   - Zweryfikuj PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_KEY
   - Sprawdź czy projekt Supabase jest aktywny

4. **Problem z OpenRouter**
   - Zweryfikuj OPENROUTER_API_KEY
   - Sprawdź czy model w OPENROUTER_MODEL jest dostępny

### Strona jest pusta / błąd 404

1. Sprawdź czy build się udał w GitHub Actions
2. Sprawdź logi deployment w Cloudflare
3. Upewnij się, że `dist/` zawiera pliki (sprawdź artifacts w GitHub Actions)
4. Sprawdź czy `_worker.js/` folder został wdrożony

### Jak sprawdzić logi błędów w Cloudflare?

1. Przejdź do: **Workers & Pages** → **[Project]** → **Deployments**
2. Kliknij na ostatni deployment
3. Sprawdź **Deployment logs**
4. Dla błędów runtime: **View live** → Otwórz DevTools → sprawdź Console

### KV Session Binding Warning

Jeśli widzisz ostrzeżenie o `SESSION` KV binding:
- To jest normalne jeśli nie używasz Cloudflare KV dla sesji
- Aplikacja używa Supabase do zarządzania sesjami
- Możesz zignorować to ostrzeżenie

