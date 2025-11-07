# 📧 Email Templates - 10x Cards

Custom email templates dla Supabase Auth, dopasowane do branding aplikacji 10x Cards.

## 📝 Dostępne Template'y

### **confirmation.html** - Potwierdzenie rejestracji
- Wysyłany po rejestracji nowego użytkownika
- Zawiera link do aktywacji konta
- Ważność: 24 godziny

## 🎨 Design

Template'y są zaprojektowane w stylu Dark Mode z:
- Gradient indigo/purple dopasowany do aplikacji
- Responsywny layout (mobile-first)
- Logo 10x Cards
- Czytelna typografia
- Accessibility features

## 🚀 Użycie

### Dla lokalnego developmentu (Supabase CLI)

Template'y są automatycznie używane w lokalnym środowisku - konfiguracja jest w `supabase/config.toml`.

Aby przetestować:

```bash
# Uruchom lokalną instancję Supabase
npx supabase start

# Zarejestruj użytkownika przez aplikację
# Email będzie widoczny w Inbucket: http://localhost:54324
```

### Dla produkcji (Supabase Dashboard)

1. **Otwórz Supabase Dashboard**
   - Przejdź do [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Wybierz swój projekt

2. **Edytuj template**
   - Authentication → **Email Templates**
   - Wybierz template "Confirm signup"
   - Skopiuj zawartość z pliku `confirmation.html`
   - Dostosuj jeśli potrzeba
   - Kliknij **Save**

3. **Przetestuj**
   - Zarejestruj nowego użytkownika
   - Sprawdź skrzynkę email

## 🔧 Dostępne zmienne w template'ach

Supabase udostępnia następujące zmienne (Go template syntax):

- `{{ .ConfirmationURL }}` - pełny link do potwierdzenia/resetu
- `{{ .Email }}` - adres email użytkownika
- `{{ .SiteURL }}` - URL aplikacji (z Supabase config)
- `{{ .Token }}` - raw token (rzadko używany)
- `{{ .TokenHash }}` - hash tokenu (rzadko używany)

## 🎨 Customizacja

### Zmiana kolorów

Główne kolory w template'ach:

```css
/* Gradient primary */
background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);

/* Background */
background-color: #0f172a;

/* Card background */
background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
```

### Dodanie logo

Logo SVG jest inline w template'ach. Aby zmienić:

1. Znajdź sekcję `.logo-icon svg`
2. Zamień na swoje logo (zalecane: inline SVG dla kompatybilności z email clients)

### Dodanie więcej template'ów (przyszłość)

W przyszłości możesz dodać:

- **invite.html** - zaproszenia do aplikacji
- **magic_link.html** - magic link login
- **recovery.html** - reset hasła
- **email_change.html** - potwierdzenie zmiany emaila

Stwórz plik w tym katalogu i dodaj konfigurację do `supabase/config.toml`.

## ⚠️ Ważne uwagi

1. **Email clients różnią się w renderowaniu HTML**
   - Template'y używają inline styles dla kompatybilności
   - Testuj na różnych klientach (Gmail, Outlook, Apple Mail)

2. **Linki muszą być bezwzględne**
   - Używaj `{{ .ConfirmationURL }}` zamiast relatywnych ścieżek
   - Upewnij się, że SITE_URL w Supabase jest poprawny

3. **Lokalne vs Produkcja**
   - Lokalne template'y: `supabase/templates/`
   - Produkcyjne template'y: Supabase Dashboard
   - Muszą być sync'owane ręcznie

## 📚 Zasoby

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [HTML Email Best Practices](https://www.campaignmonitor.com/css/)
- [Can I Email?](https://www.caniemail.com/) - CSS support w email clients

## 🤝 Contributing

Przy edycji template'ów:

1. Testuj w lokalnym Inbucket
2. Sprawdź responsywność (mobile/desktop)
3. Upewnij się, że wszystkie linki działają
4. Zachowaj spójny branding z aplikacją

