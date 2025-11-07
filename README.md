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

- [Astro](https://astro.build/) v5 - Nowoczesny framework dla szybkich aplikacji webowych
- [React](https://react.dev/) v19 - Biblioteka do tworzenia interaktywnych komponentów
- [TypeScript](https://www.typescriptlang.org/) v5 - Typebezpieczny JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Komponenty UI oparte na Radix UI
- [Supabase](https://supabase.com/) - Backend-as-a-Service (baza danych, autentykacja)
- [OpenRouter](https://openrouter.ai/) - API do modeli AI
- [Vitest](https://vitest.dev/) - Nowoczesny framework do testów jednostkowych
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Biblioteka do testowania komponentów React

## 📋 Wymagania

- Node.js v22.14.0 (lub nowszy)
- npm (dostarczany z Node.js)
- Konto Supabase
- Klucz API OpenRouter (do generowania fiszek z AI)

## 🚀 Rozpoczęcie Pracy

1. Sklonuj repozytorium:

```bash
git clone <repository-url>
cd 10x-cards
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:

Utwórz plik `.env` w głównym katalogu projektu:

```env
PUBLIC_SUPABASE_URL=twoj-supabase-url
PUBLIC_SUPABASE_ANON_KEY=twoj-supabase-anon-key
OPENROUTER_API_KEY=twoj-openrouter-api-key
SITE_URL=twoj_site_url
```

4. Uruchom migracje bazy danych:

```bash
npx supabase db push
```

5. Uruchom serwer deweloperski:

```bash
npm run dev
```

6. Otwórz [http://localhost:4321](http://localhost:4321) w przeglądarce

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

## 📁 Struktura Projektu

```md
.
├── src/
│   ├── components/         # Komponenty UI (Astro & React)
│   │   └── ui/            # Komponenty Shadcn/ui
│   ├── db/                # Klienty Supabase i typy bazy danych
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layouty Astro
│   ├── lib/               # Serwisy i helpery
│   │   ├── services/      # Logika biznesowa (flashcards, AI generation)
│   │   ├── utils/         # Funkcje pomocnicze
│   │   └── validation/    # Schematy walidacji Zod
│   ├── middleware/        # Middleware Astro (autentykacja)
│   ├── pages/             # Strony Astro
│   │   └── api/          # Endpointy API
│   ├── styles/            # Globalne style
│   └── types.ts           # Wspólne typy TypeScript
├── supabase/
│   ├── migrations/        # Migracje bazy danych
│   └── config.toml        # Konfiguracja Supabase
└── public/                # Assety publiczne
```

## 🗄️ Baza Danych

Projekt wykorzystuje Supabase PostgreSQL z następującymi tabelami:

- **flashcards** - Przechowuje fiszki użytkowników (ręczne i generowane AI)
- **generations** - Metryki sesji generowania AI
- **generation_error_logs** - Logi błędów generowania AI

Row Level Security (RLS) jest włączone dla wszystkich tabel zapewniając bezpieczeństwo danych.

## 🔐 Autentykacja

Aplikacja używa Supabase Auth do zarządzania użytkownikami. Middleware Astro chroni chronione trasy i automatycznie przekierowuje niezalogowanych użytkowników.

## 🤖 Generowanie AI

Fiszki mogą być generowane automatycznie z tekstu źródłowego przy użyciu różnych modeli AI przez OpenRouter. Aplikacja śledzi:
- Liczbę wygenerowanych fiszek
- Akceptację bez edycji
- Akceptację po edycji
- Czas generowania
- Długość tekstu źródłowego

## 🔬 Testowanie

Projekt wykorzystuje Vitest do testów jednostkowych i integracyjnych. Główne narzędzia to:

- **Vitest** - Szybki i nowoczesny framework do testów.
- **React Testing Library** - Do testowania komponentów React w sposób, w jaki używają ich użytkownicy.
- **jsdom** / **happy-dom** - Środowiska do testowania kodu wirtualnego DOM.
- **Vitest Coverage** - Do generowania raportów pokrycia kodu testami.

Testy znajdują się w katalogach `__tests__` obok testowanych plików.

## 🎨 Stylowanie

Projekt wykorzystuje Tailwind CSS 4 z komponentami Shadcn/ui. Wszystkie komponenty są w pełni dostosowywalne i responsywne.

## 🧪 Najlepsze Praktyki

Projekt przestrzega najlepszych praktyk zdefiniowanych w regułach AI:

- Clean code z wczesnym zwracaniem i obsługą błędów
- Rozdzielenie logiki biznesowej (services) od UI (components)
- Walidacja danych z Zod
- Typebezpieczeństwo z TypeScript
- Dostępność (ARIA, semantyczny HTML)
- Responsywność (mobile-first)

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

## 📄 License

MIT
