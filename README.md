# 10x Cards

Nowoczesna aplikacja do nauki z fiszkami wspomagana sztuczną inteligencją. Twórz fiszki ręcznie lub generuj je automatycznie z dowolnego tekstu przy użyciu AI.

## ✨ Funkcje

- 🤖 **Generowanie fiszek z AI** - Automatycznie generuj fiszki z tekstu źródłowego
- ✍️ **Ręczne tworzenie** - Twórz własne fiszki od podstaw
- 📚 **Zarządzanie fiszkami** - Edytuj, usuwaj i organizuj swoje fiszki
- 🔄 **Tryb nauki** - Przeglądaj fiszki z intuicyjnym interfejsem
- 👆 **Gesty dotykowe** - Nawigacja swipe na urządzeniach mobilnych
- 📊 **Metryki** - Śledzenie skuteczności generowania AI
- 🔐 **Autentykacja** - Bezpieczne konta użytkowników z Supabase Auth

## 🛠️ Stack Technologiczny

### Frontend

- [Astro](https://astro.build/) v5 - Nowoczesny framework dla szybkich aplikacji webowych
- [React](https://react.dev/) v19 - Biblioteka do tworzenia interaktywnych komponentów
- [TypeScript](https://www.typescriptlang.org/) v5 - Typebezpieczny JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Komponenty UI oparte na Radix UI
- [Lucide React](https://lucide.dev/) - Ikony SVG
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

### Backend & Baza Danych

- [Supabase](https://supabase.com/) - Backend-as-a-Service (PostgreSQL, autentykacja)
- [OpenRouter](https://openrouter.ai/) - API do modeli AI

### Formularze & Walidacja

- [React Hook Form](https://react-hook-form.com/) - Zarządzanie formularzami
- [Zod](https://zod.dev/) - Walidacja schematów TypeScript

### Testowanie

- [Vitest](https://vitest.dev/) - Framework do testów jednostkowych
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Testowanie komponentów React
- [Playwright](https://playwright.dev/) - Testy E2E

### Narzędzia Deweloperskie

- [ESLint](https://eslint.org/) - Linter dla JavaScript/TypeScript
- [Prettier](https://prettier.io/) - Formatowanie kodu
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [Lint-staged](https://github.com/okonet/lint-staged) - Pre-commit linting

### Deployment

- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting aplikacji
- [GitHub Actions](https://github.com/features/actions) - CI/CD pipeline

## 📋 Wymagania

### Wymagania podstawowe

- Node.js v22.14.0 (lub nowszy)
- npm (dostarczany z Node.js)
- Klucz API OpenRouter (do generowania fiszek z AI)

### Wymagania dla Supabase

Możesz użyć **jednej z dwóch opcji**:

#### Opcja A: Supabase Cloud (łatwiejsza)
- Konto Supabase ([utwórz za darmo](https://supabase.com))
- Projekt Supabase w cloudzie

#### Opcja B: Lokalne Supabase (dla developmentu offline)
- **Docker Desktop** - [Pobierz tutaj](https://www.docker.com/products/docker-desktop/)
  - ⚠️ **Windows/Mac**: Docker Desktop jest wymagany
  - Linux: Docker Engine wystarcza
- Supabase CLI (instalowane automatycznie przez `npm install`)

## 🚀 Rozpoczęcie Pracy

### Kroki Wspólne

1. **Sklonuj repozytorium:**

```bash
git clone <repository-url>
cd 10x-cards
```

2. **Zainstaluj zależności:**

```bash
npm install
```

---

### Opcja A: Supabase Cloud (Zalecaną dla nowych użytkowników)

3. **Utwórz projekt w Supabase Cloud:**
   - Przejdź na [supabase.com](https://supabase.com)
   - Utwórz nowy projekt
   - Zapisz URL i klucz anon (znajdziesz w Project Settings → API)

4. **Skonfiguruj zmienne środowiskowe:**

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Supabase Cloud
PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
PUBLIC_SUPABASE_KEY=twoj-anon-key

# OpenRouter AI
OPENROUTER_API_KEY=twoj-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Site URL
SITE_URL=http://localhost:4321
```

5. **Uruchom migracje bazy danych:**

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

*(Zamień `[YOUR-PASSWORD]` i `[YOUR-PROJECT-REF]` na dane z Supabase Dashboard)*

6. **Uruchom serwer deweloperski:**

```bash
npm run dev
```

7. **Otwórz aplikację:**

Przejdź na [http://localhost:4321](http://localhost:4321) w przeglądarce

---

### Opcja B: Lokalne Supabase (Dla zaawansowanych)

3. **Zainstaluj i uruchom Docker Desktop:**
   - Pobierz ze strony [docker.com](https://www.docker.com/products/docker-desktop/)
   - Zainstaluj i uruchom aplikację
   - Upewnij się, że Docker Desktop działa (ikona w tray)
   - ⚠️ **Windows**: Docker Desktop musi być uruchomiony **przed** następnymi krokami

4. **Zainicjalizuj lokalne Supabase:**

```bash
npx supabase start
```

*Pierwsze uruchomienie może zająć kilka minut (pobieranie obrazów Docker)*

5. **Skonfiguruj zmienne środowiskowe:**

Po uruchomieniu `supabase start` otrzymasz dane dostępowe. Utwórz plik `.env`:

```env
# Lokalne Supabase (domyślne wartości)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=twoj-anon-key

# OpenRouter AI
OPENROUTER_API_KEY=twoj-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Site URL
SITE_URL=http://localhost:4321
```

6. **Uruchom migracje bazy danych:**

```bash
npx supabase db push
```

7. **Uruchom serwer deweloperski:**

```bash
npm run dev
```

8. **Otwórz aplikację:**

Przejdź na [http://localhost:4321](http://localhost:4321) w przeglądarce

**Przydatne komendy lokalne Supabase:**
```bash
npx supabase status          # Sprawdź status i dane dostępowe
npx supabase stop            # Zatrzymaj Supabase
npx supabase db reset        # Zresetuj bazę danych do czystego stanu
```

**Supabase Studio (lokalne dashboard):**
Po uruchomieniu `supabase start` możesz zarządzać bazą przez web interface:
- URL: http://127.0.0.1:54323
- Przeglądaj tabele, uruchamiaj query SQL, zarządzaj użytkownikami

---

### 🆘 Problemy z Konfiguracją?

**Docker nie działa:**
- Windows: Upewnij się, że WSL 2 jest zainstalowany i włączony
- Sprawdź czy Docker Desktop jest uruchomiony (ikona w tray)
- Restart Docker Desktop i spróbuj ponownie

**Supabase nie uruchamia się lokalnie:**
```bash
npx supabase stop
npx supabase start
```

**Błąd migracji:**
- Upewnij się, że Supabase (cloud lub lokalny) jest uruchomiony
- Sprawdź poprawność connection stringa / zmiennych środowiskowych

## 📦 Dostępne Skrypty

- `npm run dev` - Uruchamia serwer deweloperski
- `npm run build` - Buduje aplikację dla produkcji
- `npm run preview` - Podgląd wersji produkcyjnej
- `npm run lint` - Sprawdza kod za pomocą ESLint
- `npm run lint:fix` - Naprawia problemy ESLint
- `npm run format` - Formatuje kod za pomocą Prettier
- `npm run test` - Uruchamia testy jednostkowe
- `npm run test:ui` - Uruchamia testy w trybie UI
- `npm run test:watch` - Uruchamia testy w trybie watch
- `npm run test:coverage` - Generuje raport pokrycia kodu testami
- `npm run test:e2e` - Uruchamia testy E2E z Playwright
- `npm run test:e2e:ui` - Uruchamia testy E2E w trybie UI
- `npm run test:e2e:headed` - Uruchamia testy E2E z widoczną przeglądarką
- `npm run test:e2e:debug` - Uruchamia testy E2E w trybie debugowania

## 🚀 Deployment na Cloudflare Pages

Aplikacja jest skonfigurowana do automatycznego wdrażania na Cloudflare Pages przy użyciu GitHub Actions.

### Szybki start

1. **Skonfiguruj secrets w GitHub** (8 zmiennych - zobacz [CLOUDFLARE_DEPLOYMENT.md](.github/CLOUDFLARE_DEPLOYMENT.md))
2. **Dodaj zmienne środowiskowe w Cloudflare Pages** (5 zmiennych)
3. **Uruchom workflow** ręcznie lub push do `master`

### Dokumentacja

- 📖 [Pełna dokumentacja deployment](.github/CLOUDFLARE_DEPLOYMENT.md)
- 🚑 [Szybka naprawa problemów](.github/QUICK_FIX.md)

### Workflow CI/CD

Projekt ma dwa workflow:

- **tests-validation.yml** - Uruchamiane przy PR do master (lint, unit tests, E2E tests)
- **master.yml** - Automatyczny deployment na Cloudflare Pages (lint, unit tests, build, deploy)

## 📁 Struktura Projektu

```md
.
├── .cursor/
│ └── rules/ # Reguły AI dla Cursor IDE
├── .github/
│ └── workflows/ # GitHub Actions (CI/CD)
├── src/
│ ├── components/ # Komponenty UI (Astro & React)
│ │ └── ui/ # Komponenty Shadcn/ui
│ ├── db/ # Klienty Supabase i typy bazy danych
│ ├── hooks/ # Custom React hooks
│ ├── layouts/ # Layouty Astro
│ ├── lib/ # Serwisy i helpery
│ │ ├── client/ # Logika po stronie klienta
│ │ ├── services/ # Logika biznesowa (flashcards, AI generation)
│ │ │ └── **tests**/ # Testy jednostkowe serwisów
│ │ ├── utils/ # Funkcje pomocnicze
│ │ ├── validation/ # Schematy walidacji Zod
│ │ ├── api-client.ts # Klient API
│ │ └── utils.ts # Funkcje pomocnicze (cn, itp.)
│ ├── middleware/ # Middleware Astro (autentykacja)
│ ├── pages/ # Strony Astro
│ │ ├── api/ # Endpointy API
│ │ │ ├── auth/ # Autentykacja (logout, set-session)
│ │ │ ├── flashcards/ # CRUD fiszek
│ │ │ └── generations/ # Generowanie AI i metryki
│ │ └── auth/ # Strony autentykacji (callback)
│ ├── styles/ # Globalne style
│ ├── test/ # Konfiguracja testów
│ └── types.ts # Wspólne typy TypeScript
├── e2e/
│ ├── tests/ # Testy E2E Playwright
│ ├── page-objects/ # Page Object Model
│ └── helpers/ # Helpery testowe
├── supabase/
│ ├── migrations/ # Migracje bazy danych
│ ├── templates/ # Szablony emaili
│ └── config.toml # Konfiguracja Supabase
└── public/ # Assety publiczne
```

## 🗄️ Baza Danych

Projekt wykorzystuje Supabase PostgreSQL z następującymi tabelami:

- **flashcards** - Przechowuje fiszki użytkowników (ręczne i generowane AI)
- **generations** - Metryki sesji generowania AI
- **generation_error_logs** - Logi błędów generowania AI

Row Level Security (RLS) jest włączone dla wszystkich tabel zapewniając bezpieczeństwo danych.

## 🔐 Autentykacja

Aplikacja używa Supabase Auth do zarządzania użytkownikami. Middleware Astro zabezpiecza routes wymagające uwierzytelnienia i automatycznie przekierowuje niezalogowanych użytkowników.

## 🌐 API Endpoints

Aplikacja udostępnia REST API endpoints:

### Autentykacja

- `POST /api/auth/logout` - Wylogowanie użytkownika
- `POST /api/auth/set-session` - Ustawienie sesji po callback

### Fiszki

- `GET /api/flashcards` - Pobieranie listy fiszek (z paginacją i filtrowaniem)
- `POST /api/flashcards` - Tworzenie nowej fiszki
- `POST /api/flashcards/batch` - Tworzenie wielu fiszek (batch create z AI)
- `PATCH /api/flashcards/[id]` - Aktualizacja fiszki
- `DELETE /api/flashcards/[id]` - Usuwanie fiszki

### Generowanie AI

- `POST /api/generations` - Generowanie fiszek z AI
- `GET /api/generations` - Pobieranie metryk generowania

Wszystkie endpointy wymagają autentykacji (z wyjątkiem `/api/auth/set-session`).

## 🤖 Generowanie AI

Fiszki mogą być generowane automatycznie z tekstu źródłowego przy użyciu różnych modeli AI przez OpenRouter. Aplikacja śledzi:

- Liczbę wygenerowanych fiszek
- Akceptację bez edycji
- Akceptację po edycji
- Czas generowania
- Długość tekstu źródłowego

## 🔬 Testowanie

Projekt wykorzystuje kompleksową strategię testowania z testami jednostkowymi i E2E, zapewniając wysoką jakość kodu i niezawodność aplikacji.

### Testy Jednostkowe

Testy jednostkowe wykorzystują Vitest i React Testing Library:

- **Vitest** - Szybki i nowoczesny framework do testów
- **React Testing Library** - Do testowania komponentów React w sposób, w jaki używają ich użytkownicy
- **jsdom** / **happy-dom** - Środowiska do testowania kodu wirtualnego DOM
- **Vitest Coverage** - Do generowania raportów pokrycia kodu testami

Testy jednostkowe znajdują się w katalogu `src/lib/services/__tests__/` z dokumentacją testów w plikach `.md`.

**Aktualne pokrycie:**

- Serwisy (flashcard.service, openrouter.service)
- Walidacje Zod

**Struktura testów:**

- `src/lib/services/__tests__/flashcard.service.*.test.ts` - Testy serwisu fiszek
- `src/lib/services/__tests__/openrouter.service.*.test.ts` - Testy generowania AI
- Każdy test ma plik README.md z opisem strategii testowania

### Testy E2E

Testy E2E wykorzystują Playwright dla kompleksowego testowania przepływów użytkownika:

- **Playwright** - Nowoczesny framework do testów E2E
- **Page Object Model** - Wzorzec projektowy dla utrzymywalnych testów
- **data-testid selectors** - Odporne selektory dla stabilnych testów
- **Automatyczne zarządzanie przeglądarką** - Chromium z automatyczną konfiguracją
- **Test isolation** - Automatyczne czyszczenie bazy danych między testami
- **Serial mode** - Testy wykonują się sekwencyjnie dla uniknięcia konfliktów bazy danych

**Aktualne pokrycie:**

- Flashcard lifecycle (login → create → review)
- Multiple flashcards handling
- Immediate review availability

Testy E2E znajdują się w katalogu `e2e/`:

- `e2e/tests/` - Specyfikacje testów
- `e2e/page-objects/` - Page Objects (LoginPage, CreateFlashcardPage, ReviewPage)
- `e2e/helpers/` - Helpery testowe (auth, database cleanup)

Aby uruchomić testy E2E:

```bash
# Instalacja przeglądarek (jednorazowo)
npx playwright install chromium --with-deps

# Uruchomienie testów
npm run test:e2e

# Tryb UI (zalecany do developmentu)
npm run test:e2e:ui
```

Szczegółowa dokumentacja: [E2E Setup Guide](./e2e/SETUP.md)

## 🎨 Stylowanie

Projekt wykorzystuje Tailwind CSS 4 z komponentami Shadcn/ui. Wszystkie komponenty są w pełni dostosowywalne i responsywne.

## 🛠️ Narzędzia Deweloperskie

Projekt wykorzystuje nowoczesne narzędzia do zapewnienia wysokiej jakości kodu:

### Linting i Formatowanie

- **ESLint** - Statyczna analiza kodu TypeScript/React/Astro
  - Konfiguracja: `eslint.config.js`
  - Plugins: React, React Hooks, JSX a11y, Import, Prettier
  - `npm run lint` - Sprawdzenie kodu
  - `npm run lint:fix` - Automatyczna naprawa błędów

- **Prettier** - Automatyczne formatowanie kodu
  - Integracja z ESLint
  - `npm run format` - Formatowanie wszystkich plików
  - Obsługa: TypeScript, React, Astro, JSON, CSS, Markdown

### Git Hooks

- **Husky** - Automatyczne uruchamianie skryptów przed commitem
  - Pre-commit hook dla lint-staged

- **Lint-staged** - Linting i formatowanie tylko zmienionych plików
  - `*.{ts,tsx,astro}` → ESLint fix
  - `*.{json,css,md}` → Prettier format

### Środowiska Testowe

- **Vitest** - Framework do testów jednostkowych (config: `vitest.config.ts`)
- **Playwright** - Framework do testów E2E (config: `playwright.config.ts`)
- **jsdom/happy-dom** - Wirtualny DOM dla testów

## 🧪 Najlepsze Praktyki

Projekt przestrzega najlepszych praktyk zdefiniowanych w regułach AI:

### Architektura i Kod

- **Clean Code** - Wczesne zwracanie, obsługa błędów na początku funkcji
- **Separation of Concerns** - Rozdzielenie logiki biznesowej (services) od UI (components)
- **Type Safety** - Pełne wykorzystanie TypeScript z strictNullChecks
- **Validation** - Walidacja danych z Zod na froncie i backendzie
- **Error Handling** - Jednolite obsługiwanie błędów z custom error types

### UI/UX

- **Accessibility** - ARIA labels, semantyczny HTML, keyboard navigation
- **Responsive Design** - Mobile-first approach z Tailwind CSS
- **User Feedback** - Toast notifications dla wszystkich akcji użytkownika
- **Loading States** - Wyraźne stany ładowania i błędów

### Testowanie

- **Test Coverage** - Testy jednostkowe dla logiki biznesowej
- **E2E Tests** - Kompleksowe testy przepływów użytkownika
- **Page Object Pattern** - Utrzymywalne i reużywalne testy E2E

### Git i CI/CD

- **Pre-commit Hooks** - Automatyczny lint i format przed commitem
- **Continuous Integration** - Automatyczne testy przy PR
- **Continuous Deployment** - Automatyczny deployment do Cloudflare Pages

## 📝 Wsparcie AI Development

Projekt jest skonfigurowany do pracy z narzędziami AI development:

- **Cursor IDE** - Reguły AI w `.cursor/rules/`
- Spójne konwencje nazewnictwa i struktury
- Obszerna dokumentacja w kodzie

## 🤝 Contributing

Podczas dodawania zmian:

1. Przestrzegaj struktury projektu zdefiniowanej w regułach AI
2. Dodawaj testy dla nowej funkcjonalności
3. Upewnij się, że linter przechodzi (`npm run lint`)
4. Formatuj kod (`npm run format`)

## 🔗 Powiązane Dokumenty

- [PRD - Dokument Wymagań Produktu](./.ai/prd.md) - Oryginalny dokument wymagań MVP
- [PRD vs Implementacja - Przegląd](./.ai/prd-implementation-review.md) - Porównanie PRD z faktyczną implementacją
- [Dokumentacja Testów E2E](./e2e/README.md)
- [Setup Guide dla Testów E2E](./e2e/SETUP.md)
- [Dokumentacja Deployment](./.github/CLOUDFLARE_DEPLOYMENT.md)

## 📄 License

MIT
