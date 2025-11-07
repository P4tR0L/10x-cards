# ⚠️ WYMAGANE DZIAŁANIE - Napraw swój deployment

## 🎯 Co należy zrobić?

Twój deployment na Cloudflare przeszedł, ale strona nie działa **najprawdopodobniej z powodu braku zmiennych środowiskowych**.

## 📝 Kroki do wykonania

### Krok 1: Dodaj zmienne środowiskowe w Cloudflare Pages

To jest **KLUCZOWY** krok, który najprawdopodobnie rozwiąże Twój problem!

1. Otwórz [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do: **Workers & Pages**
3. Wybierz swój projekt (np. `10x-cards`)
4. Kliknij **Settings** (w górnym menu)
5. Przewiń do sekcji **Environment variables**
6. Kliknij **Add variables**

Dodaj następujące zmienne dla środowiska **Production**:

| Variable name | Value | Gdzie znaleźć? |
|---------------|-------|----------------|
| `PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Project Settings → API |
| `PUBLIC_SUPABASE_KEY` | `eyJxxx...` | Supabase Dashboard → Project Settings → API → anon/public key |
| `OPENROUTER_API_KEY` | `sk-or-xxx...` | OpenRouter Dashboard → Keys |
| `OPENROUTER_MODEL` | `anthropic/claude-3.5-sonnet` | Dowolny model z OpenRouter |
| `SITE_URL` | `https://twoj-projekt.pages.dev` | URL Twojego projektu Cloudflare Pages |

7. Kliknij **Save**

### Krok 2: Dodaj zmienne do GitHub Secrets (dla kolejnych deployments)

1. Otwórz swoje repozytorium na GitHub
2. Przejdź do: **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**

Dodaj te same 5 zmiennych co w Cloudflare PLUS 3 dodatkowe dla workflow:

**Zmienne aplikacji (muszą być takie same jak w Cloudflare):**
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `SITE_URL`

**Zmienne Cloudflare (tylko dla GitHub):**
- `CLOUDFLARE_API_TOKEN` - Wygeneruj w Cloudflare: My Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` - Znajdziesz w Cloudflare: Workers & Pages → Overview (prawy panel)
- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu (np. `10x-cards`)

### Krok 3: Wykonaj Retry Deployment

Po dodaniu zmiennych w Cloudflare Pages:

1. W Cloudflare: **Workers & Pages** → Twój projekt → **Deployments**
2. Znajdź ostatni deployment
3. Kliknij **⋮** (trzy kropki)
4. Wybierz **Retry deployment**

### Krok 4: Sprawdź czy działa

1. Poczekaj 1-2 minuty na zakończenie deployment
2. Otwórz URL swojego projektu (np. `https://twoj-projekt.pages.dev`)
3. Strona powinna się załadować! 🎉

## 🔍 Jeśli wciąż nie działa

1. **Sprawdź logi deployment w Cloudflare:**
   - Workers & Pages → Twój projekt → Deployments → Kliknij na deployment → View logs

2. **Sprawdź DevTools w przeglądarce:**
   - Otwórz stronę → F12 → Console
   - Czy są jakieś błędy JavaScript?

3. **Sprawdź czy wszystkie zmienne są ustawione:**
   - Cloudflare: Settings → Environment variables
   - Powinno być 5 zmiennych dla Production

4. **Przeczytaj szczegółową dokumentację:**
   - [QUICK_FIX.md](./QUICK_FIX.md) - Szybkie rozwiązywanie problemów
   - [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Pełna dokumentacja

## 📋 Checklist

Zaznacz wykonane kroki:

- [ ] Dodałem 5 zmiennych środowiskowych w Cloudflare Pages (Production)
- [ ] Dodałem 8 secrets w GitHub
- [ ] Wykonałem Retry deployment w Cloudflare
- [ ] Sprawdziłem czy SITE_URL jest w formacie `https://...` (bez trailing slash)
- [ ] Strona się załadowała! 🎉

## 💡 Pro Tips

- **SITE_URL** musi być dokładnie taki sam w GitHub i Cloudflare
- Po każdej zmianie zmiennych w Cloudflare musisz wykonać **Retry deployment**
- Zmienne w GitHub są używane tylko podczas buildu, zmienne w Cloudflare podczas runtime
- Sprawdź czy Twój projekt Supabase jest aktywny (nie zapauzowany)

## 🆘 Potrzebujesz pomocy?

Jeśli wykonałeś wszystkie kroki a strona wciąż nie działa:

1. Sprawdź [QUICK_FIX.md](./QUICK_FIX.md) - szczegółowe troubleshooting
2. Sprawdź logi w Cloudflare Deployments
3. Sprawdź Console w DevTools przeglądarki

---

**Pamiętaj:** 99% problemów z deploymentem na Cloudflare Pages wynika z braku zmiennych środowiskowych! 

