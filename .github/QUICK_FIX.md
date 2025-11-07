# 🚀 Szybka naprawa: Strona nie działa po deploymencie

## Problem: Deployment przeszedł, ale strona jest niedostępna

### ✅ Krok 1: Sprawdź zmienne środowiskowe w Cloudflare

To **najczęstsza przyczyna** problemu!

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → wybierz swój projekt
3. **Settings** → **Environment variables**
4. Sprawdź czy masz **wszystkie** te zmienne dla środowiska **Production**:

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_KEY
OPENROUTER_API_KEY
OPENROUTER_MODEL
SITE_URL
```

⚠️ **Jeśli którejkolwiek brakuje - DODAJ JĄ!**

5. Po dodaniu zmiennych, **MUSISZ** wykonać redeploy:
   - Przejdź do **Deployments** tab
   - Kliknij **⋮** (trzy kropki) przy ostatnim deploymencie
   - Wybierz **Retry deployment**

### ✅ Krok 2: Sprawdź logi błędów

1. W Cloudflare: **Workers & Pages** → Twój projekt → **Deployments**
2. Kliknij na ostatni deployment
3. Sprawdź **Deployment logs** - czy są błędy?

### ✅ Krok 3: Sprawdź czy strona zwraca błąd

1. Otwórz URL swojej strony (np. `https://twoj-projekt.pages.dev`)
2. Otwórz DevTools (F12)
3. Sprawdź zakładkę **Console** - czy są błędy?
4. Sprawdź zakładkę **Network** - jaki status HTTP zwraca strona?

**Typowe błędy:**
- **500 Internal Server Error** → Brak zmiennych środowiskowych lub błąd w kodzie
- **404 Not Found** → Problem z routingiem lub build
- **Strona pusta** → Problem z JavaScript lub SSR

### ✅ Krok 4: Sprawdź GitHub Secrets

Zmienne muszą być w **DWÓCH** miejscach!

1. **GitHub**: Settings → Secrets and variables → Actions → Repository secrets
2. **Cloudflare**: Workers & Pages → Settings → Environment variables

Upewnij się, że masz **wszystkie 8 secrets** w GitHub:
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_PROJECT_NAME
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_KEY
OPENROUTER_API_KEY
OPENROUTER_MODEL
SITE_URL
```

### ✅ Krok 5: Spróbuj lokalnie

```bash
# Zbuduj projekt lokalnie
npm run build

# Sprawdź czy folder dist/ został utworzony
ls dist/

# Sprawdź czy istnieje _worker.js
ls dist/_worker.js/
```

Jeśli build nie działa lokalnie, to nie będzie działać na Cloudflare!

### ✅ Krok 6: Sprawdź format SITE_URL

**Prawidłowy format:**
```
https://10x-cards.pages.dev
```

**Nieprawidłowe formaty:**
```
https://10x-cards.pages.dev/     ❌ (trailing slash)
http://10x-cards.pages.dev       ❌ (http zamiast https)
10x-cards.pages.dev              ❌ (brak protokołu)
```

## 📋 Checklist przed ponownym deploymentem

- [ ] Wszystkie 5 zmiennych środowiskowych są w Cloudflare Pages (Production)
- [ ] Wszystkie 8 secrets są w GitHub
- [ ] SITE_URL jest w prawidłowym formacie (https://...)
- [ ] Supabase projekt jest aktywny
- [ ] OpenRouter API key jest aktywny
- [ ] Build przechodzi lokalnie (`npm run build`)

## 🔄 Jak wykonać redeploy?

### Opcja 1: Przez Cloudflare (szybka)
1. Cloudflare → Workers & Pages → Twój projekt → Deployments
2. Kliknij **⋮** przy ostatnim deploymencie
3. **Retry deployment**

### Opcja 2: Przez GitHub Actions (pełna)
1. GitHub → Actions → Deploy to Cloudflare Pages
2. **Run workflow** → Run workflow

## 💡 Dodatkowe wskazówki

### Jak znaleźć błędy runtime w Cloudflare?

Cloudflare Pages nie pokazuje logów runtime bezpośrednio. Musisz:

1. Dodać własne logowanie w kodzie (console.log)
2. Użyć Cloudflare Workers Logs:
   - Workers & Pages → Twój projekt → Logs (Real-time Logs)
   - Włącz **Begin log stream**
   - Odśwież stronę i obserwuj logi

### Co jeśli wciąż nie działa?

1. Sprawdź `wrangler.toml` - czy jest w repo?
2. Sprawdź `astro.config.mjs` - czy ma `mode: "directory"`?
3. Sprawdź czy adapter Cloudflare jest zainstalowany: `npm list @astrojs/cloudflare`
4. Spróbuj deployment na nowej gałęzi - czasami pomaga czysty start

### Użyteczne linki

- [Cloudflare Status](https://www.cloudflarestatus.com/) - Sprawdź czy Cloudflare ma problemy
- [Cloudflare Community](https://community.cloudflare.com/) - Społeczność
- [Astro Discord](https://astro.build/chat) - Pomoc z Astro

---

**Wciąż nie działa?** Sprawdź szczegółową dokumentację w `CLOUDFLARE_DEPLOYMENT.md`

