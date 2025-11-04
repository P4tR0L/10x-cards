# API Endpoint Implementation Plan: Update Flashcard

## 1. Przegląd punktu końcowego

**Endpoint:** `PUT /api/flashcards/{id}`

**Cel:** Aktualizacja treści istniejącej fiszki (front i back) dla zaautoryzowanego użytkownika.

**Kluczowe funkcjonalności:**
- Walidacja ID fiszki z parametru ścieżki
- Autoryzacja użytkownika za pomocą JWT Bearer token
- Walidacja danych wejściowych (front i back) za pomocą Zod
- Automatyczna weryfikacja własności fiszki przez RLS (Row Level Security)
- Aktualizacja znacznika czasowego `updated_at`
- Zwracanie zaktualizowanej fiszki bez `user_id`

## 2. Szczegóły żądania

**Metoda HTTP:** `PUT`

**Struktura URL:** `/api/flashcards/{id}`

**Parametry:**

**Parametry ścieżki (Path Parameters):**
| Parameter | Type | Required | Description | Validation |
|:----------|:-----|:---------|:------------|:-----------|
| `id` | integer | Yes | Flashcard ID | Positive integer (>= 1) |

**Nagłówki (Request Headers):**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Ciało żądania (Request Body):**
```json
{
  "front": "Photosynthesis (Updated)",
  "back": "The process by which green plants and some other organisms use sunlight to synthesize nutrients"
}
```

**Parametry ciała żądania:**
| Field | Type | Required | Constraints | Description |
|:------|:-----|:---------|:------------|:------------|
| `front` | string | Yes | 1-5000 characters, non-empty after trim | Treść przedniej strony fiszki (pytanie/pojęcie) |
| `back` | string | Yes | 1-5000 characters, non-empty after trim | Treść tylnej strony fiszki (odpowiedź/definicja) |

## 3. Wykorzystywane typy

**Z pliku `src/types.ts`:**
- `UpdateFlashcardCommand`: Command model dla aktualizacji fiszki
  ```typescript
  interface UpdateFlashcardCommand {
    front: string;
    back: string;
  }
  ```

- `FlashcardDTO`: DTO zwracane w odpowiedzi (bez `user_id`)
  ```typescript
  type FlashcardDTO = Omit<Tables<"flashcards">, "user_id">
  ```

- `FlashcardResponse`: Wrapper dla pojedynczej fiszki w odpowiedzi
  ```typescript
  type FlashcardResponse = SingleItemResponse<FlashcardDTO>
  // Struktura: { data: FlashcardDTO }
  ```

- `ErrorResponse`: Standardowa struktura błędu
  ```typescript
  interface ErrorResponse {
    error: string;
    message: string;
    details?: Record<string, string | string[]>;
  }
  ```

**Z pliku `src/lib/validation/flashcard.validation.ts`:**
- `updateFlashcardSchema`: Zod schema do walidacji
- `UpdateFlashcardInput`: Typ wygenerowany z Zod schema

## 4. Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "data": {
    "id": 150,
    "front": "Photosynthesis (Updated)",
    "back": "The process by which green plants and some other organisms use sunlight to synthesize nutrients",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-11-04T14:22:33.123Z",
    "updated_at": "2025-11-04T15:10:20.456Z"
  }
}
```

**Kody statusu odpowiedzi:**
| Status Code | Scenario | Response Body |
|:------------|:---------|:--------------|
| 200 | Pomyślna aktualizacja | `{ "data": FlashcardDTO }` |
| 400 | Nieprawidłowe ID lub malformed JSON | `{ "error": "Bad request", "message": "..." }` |
| 401 | Brak lub nieprawidłowy token JWT | `{ "error": "Unauthorized", "message": "Invalid or missing authentication token" }` |
| 404 | Fiszka nie istnieje lub należy do innego użytkownika | `{ "error": "Not found", "message": "Flashcard not found or you don't have permission to update it" }` |
| 422 | Błąd walidacji danych wejściowych | `{ "error": "Validation error", "message": "Validation failed", "details": {...} }` |
| 500 | Nieoczekiwany błąd serwera | `{ "error": "Internal server error", "message": "An unexpected error occurred" }` |

## 5. Przepływ danych

```
1. Klient → API Endpoint (PUT /api/flashcards/{id})
   ├─ Authorization: Bearer <jwt_token>
   └─ Body: { front, back }

2. API Endpoint → Walidacja ID z parametru ścieżki
   ├─ Parse string → integer
   ├─ Sprawdzenie czy ID jest liczbą całkowitą
   └─ Sprawdzenie czy ID > 0

3. API Endpoint → Supabase Auth (auth.getUser())
   ├─ Weryfikacja JWT token
   └─ Pobranie user.id z sesji

4. API Endpoint → Parse JSON body
   └─ Obsługa błędów JSON.parse

5. API Endpoint → Zod Validation (updateFlashcardSchema)
   ├─ Trim whitespace z front i back
   ├─ Sprawdzenie długości (1-5000 znaków)
   └─ Zwrócenie błędów walidacji jeśli nieprawidłowe

6. API Endpoint → FlashcardService.updateFlashcard(id, data)
   └─ Przekazanie walidowanych danych do service

7. FlashcardService → Supabase Database
   ├─ UPDATE flashcards SET front=?, back=?, updated_at=now()
   ├─ WHERE id=?
   ├─ RLS Policy sprawdza: auth.uid() = user_id
   └─ RETURNING * (all columns)

8. Supabase → FlashcardService
   ├─ Zwraca zaktualizowany wiersz lub error
   ├─ Error PGRST116 jeśli nie znaleziono (404)
   └─ Inne błędy jako database errors

9. FlashcardService → API Endpoint
   ├─ Usuwa user_id z wyniku
   └─ Zwraca FlashcardDTO

10. API Endpoint → Klient
    ├─ Status: 200 OK
    └─ Body: { data: FlashcardDTO }
```

**Interakcje z bazą danych:**
- Tabela: `flashcards`
- Operacja: `UPDATE` z warunkiem `WHERE id = ?`
- RLS Policy: `flashcards_update_policy` - użytkownik może aktualizować tylko swoje fiszki
- Automatyczna aktualizacja: `updated_at` timestamp (trigger lub domyślna wartość)

**Nie wymaga:**
- Interakcji z tabelą `generations` (fiszka zachowuje swoje źródło i generation_id)
- Logowania do `generation_error_logs` (brak operacji AI)
- Zewnętrznych API calls (brak OpenRouter)

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie (Authentication)
- **Mechanizm:** JWT Bearer token w nagłówku `Authorization`
- **Implementacja:** `context.locals.supabase.auth.getUser()`
- **Błędy:** Zwróć 401 Unauthorized jeśli:
  - Brak nagłówka Authorization
  - Token nieprawidłowy lub wygasły
  - `getUser()` zwraca error lub null

### 6.2. Autoryzacja (Authorization)
- **Mechanizm:** Row Level Security (RLS) na poziomie bazy danych
- **Policy:** `flashcards_update_policy`
  - Warunek: `auth.uid() = user_id`
  - Użytkownik może aktualizować tylko swoje fiszki
- **Obsługa:** Jeśli RLS blokuje dostęp, zwróć 404 Not Found (nie 403)
  - Zapobiega wyciekowi informacji o istnieniu fiszek innych użytkowników

### 6.3. Walidacja danych wejściowych
- **ID fiszki:**
  - Walidacja: musi być liczbą całkowitą > 0
  - Konwersja: `parseInt(id)` i sprawdzenie `!isNaN()` i `> 0`
  - Błąd: 400 Bad Request dla nieprawidłowego ID

- **Request Body:**
  - Walidacja: Zod schema (`updateFlashcardSchema`)
  - Automatyczne trim whitespace
  - Długość: 1-5000 znaków dla obu pól
  - Błąd: 422 Validation Error z szczegółami

### 6.4. Ochrona przed atakami
- **SQL Injection:** Zabezpieczone przez Supabase client (parametryzowane zapytania)
- **XSS:** Frontend powinien escapować dane przed renderowaniem
- **CSRF:** Nie dotyczy (API używa JWT, nie cookies)
- **Rate Limiting:** Rozważ implementację na poziomie middleware (poza MVP)

### 6.5. Prywatność danych
- **Nigdy nie ujawniaj `user_id` w odpowiedziach API**
- Service layer usuwa `user_id` przed zwróceniem danych
- RLS zapewnia izolację danych między użytkownikami

## 7. Obsługa błędów

### 7.1. Hierarchia obsługi błędów
```
try {
  // 1. Authentication (401)
  // 2. Parse ID from path (400)
  // 3. Validate ID (400)
  // 4. Parse JSON body (400)
  // 5. Validate body with Zod (422)
  // 6. Update flashcard via service
  //    ├─ Not found / Access denied (404)
  //    └─ Database error (500)
  // 7. Return success (200)
} catch (error) {
  // 8. Unexpected error (500)
}
```

### 7.2. Szczegółowe scenariusze błędów

**400 Bad Request - Nieprawidłowe ID:**
```json
{
  "error": "Bad request",
  "message": "Invalid flashcard ID"
}
```
**Kiedy:** ID nie jest liczbą, jest ujemne, zerem, lub NaN

**400 Bad Request - Malformed JSON:**
```json
{
  "error": "Bad request",
  "message": "Invalid request body"
}
```
**Kiedy:** `JSON.parse()` rzuca wyjątek

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```
**Kiedy:** `getUser()` zwraca error lub null

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Flashcard not found or you don't have permission to update it"
}
```
**Kiedy:**
- Fiszka o podanym ID nie istnieje
- Fiszka istnieje ale należy do innego użytkownika (RLS blokuje)
- Supabase zwraca error code PGRST116

**422 Validation Error:**
```json
{
  "error": "Validation error",
  "message": "Validation failed",
  "details": {
    "front": ["Front field cannot be empty"],
    "back": ["Back field cannot exceed 5000 characters"]
  }
}
```
**Kiedy:** Zod validation fails (puste pola, zbyt długie, nieprawidłowy typ)

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
**Kiedy:**
- Błąd połączenia z bazą danych
- Nieoczekiwany błąd w service layer
- Jakikolwiek inny nieobsłużony wyjątek

### 7.3. Logowanie błędów
- **Console logs:** Loguj wszystkie błędy 500 z pełnymi szczegółami (stack trace, timestamp)
- **Nie loguj:** Błędów walidacji (400, 422) - to normalne przypadki użycia
- **Format logów:**
  ```typescript
  console.error("[PUT /api/flashcards/{id}] Error updating flashcard:", {
    flashcardId: id,
    userId: user?.id,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  ```

### 7.4. Bezpieczeństwo komunikatów błędów
- **Nigdy nie ujawniaj:** Stack traces, szczegółów bazy danych, internal paths
- **Zawsze używaj:** Generycznych komunikatów dla błędów 500
- **Loguj szczegóły:** Na serwerze dla debugowania, nie w odpowiedzi HTTP

## 8. Rozważania dotyczące wydajności

### 8.1. Optymalizacje bazy danych
- **Indeks:** `idx_flashcards_user_id` przyspiesza sprawdzanie RLS policy
- **Single query:** Service używa jednego zapytania UPDATE z RETURNING
- **Brak N+1 problem:** Endpoint aktualizuje tylko jedną fiszkę

### 8.2. Walidacja
- **Zod parsing:** Fast i efektywny, early return przy błędzie walidacji
- **Trim w schemacie:** Preprocessing odbywa się automatycznie

### 8.3. Redukcja network roundtrips
- **RETURNING clause:** Zwraca zaktualizowany wiersz bez dodatkowego SELECT
- **RLS w bazie:** Weryfikacja autoryzacji w jednym zapytaniu

### 8.4. Potencjalne wąskie gardła
- **Brak:** Ten endpoint jest prosty i nie ma istotnych bottlenecks
- **Database connection pool:** Supabase zarządza automatycznie
- **Rate limiting:** Rozważ na poziomie middleware dla ochrony przed abuse

### 8.5. Monitoring i metryki
- **Sukces:** Nie wymaga dodatkowego trackowania (brak tabeli metryk)
- **Błędy:** Loguj do console dla monitoringu
- **Przyszłość:** Można dodać APM (Application Performance Monitoring) tools

## 9. Etapy wdrożenia

### Krok 1: Utworzenie pliku endpointu
**Lokalizacja:** `src/pages/api/flashcards/[id].ts`

**Działania:**
- Utwórz nowy plik w strukturze Astro pages
- Dodaj `export const prerender = false` na początku pliku
- Plik obsługuje dynamiczny parametr `[id]` ze ścieżki URL

### Krok 2: Zaimportowanie wymaganych zależności
```typescript
import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { updateFlashcardSchema } from "@/lib/validation/flashcard.validation";
import type { FlashcardResponse, ErrorResponse } from "@/types";
```

### Krok 3: Implementacja handlera PUT
**Struktura:**
```typescript
export const PUT: APIRoute = async (context) => {
  try {
    // Sekcja 1: Authentication
    // Sekcja 2: Parse and validate ID
    // Sekcja 3: Parse JSON body
    // Sekcja 4: Validate body with Zod
    // Sekcja 5: Update flashcard via service
    // Sekcja 6: Return success response
  } catch (error) {
    // Sekcja 7: Handle unexpected errors
  }
};
```

### Krok 4: Implementacja sekcji 1 - Authentication
```typescript
// Verify JWT token and get authenticated user
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

// Handle authentication errors
if (authError || !user) {
  const errorResponse: ErrorResponse = {
    error: "Unauthorized",
    message: "Invalid or missing authentication token",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 5: Implementacja sekcji 2 - Parse and validate ID
```typescript
// Extract flashcard ID from URL path parameter
const idParam = context.params.id;

// Validate ID is a positive integer
const flashcardId = parseInt(idParam || "", 10);
if (isNaN(flashcardId) || flashcardId <= 0) {
  const errorResponse: ErrorResponse = {
    error: "Bad request",
    message: "Invalid flashcard ID",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 6: Implementacja sekcji 3 - Parse JSON body
```typescript
// Parse JSON body and handle malformed JSON errors
let body: unknown;
try {
  body = await context.request.json();
} catch (e) {
  const errorResponse: ErrorResponse = {
    error: "Bad request",
    message: "Invalid request body",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 7: Implementacja sekcji 4 - Validate with Zod
```typescript
// Validate request body against Zod schema
const validation = updateFlashcardSchema.safeParse(body);
if (!validation.success) {
  const errorResponse: ErrorResponse = {
    error: "Validation error",
    message: "Validation failed",
    details: validation.error.flatten().fieldErrors,
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 422,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 8: Implementacja sekcji 5 - Update via service
```typescript
// Initialize service with authenticated Supabase client
const flashcardService = new FlashcardService(context.locals.supabase);

// Update flashcard (RLS ensures user can only update their own flashcards)
try {
  const flashcard = await flashcardService.updateFlashcard(
    flashcardId,
    validation.data
  );

  // Return success response with updated flashcard
  const response: FlashcardResponse = {
    data: flashcard,
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  // Handle specific service errors (404 not found)
  if (error instanceof Error && error.message.includes("not found")) {
    const errorResponse: ErrorResponse = {
      error: "Not found",
      message: "Flashcard not found or you don't have permission to update it",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Re-throw to be caught by outer catch block
  throw error;
}
```

### Krok 9: Implementacja sekcji 6 - Handle unexpected errors
```typescript
// Log error details for debugging (never expose to user)
console.error("[PUT /api/flashcards/{id}] Error updating flashcard:", {
  flashcardId: idParam,
  userId: user?.id,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});

// Return generic error response (don't leak implementation details)
const errorResponse: ErrorResponse = {
  error: "Internal server error",
  message: "An unexpected error occurred",
};
return new Response(JSON.stringify(errorResponse), {
  status: 500,
  headers: { "Content-Type": "application/json" },
});
```

### Krok 10: Dodanie dokumentacji JSDoc
- Dodaj komentarz dokumentacyjny na początku pliku
- Dodaj komentarz dokumentacyjny dla handlera PUT
- Wyjaśnij strukturę żądania, odpowiedzi i kody statusu
- Wzoruj się na istniejącym pliku `src/pages/api/flashcards/index.ts`

### Krok 11: Testowanie manualne
**Przygotowanie:**
- Uruchom lokalnie: `npm run dev`
- Uzyskaj JWT token (zaloguj się w aplikacji lub użyj Supabase dashboard)

**Test cases:**
1. **Happy path:** Prawidłowe żądanie z poprawnym ID i body
   - Expected: 200 OK z zaktualizowaną fiszką
   
2. **Invalid ID:** Żądanie z ID = "abc" lub "-1"
   - Expected: 400 Bad Request

3. **Unauthorized:** Żądanie bez tokenu lub z nieprawidłowym tokenem
   - Expected: 401 Unauthorized

4. **Not found:** Żądanie z ID nieistniejącej fiszki
   - Expected: 404 Not Found

5. **Wrong owner:** Żądanie z ID fiszki należącej do innego użytkownika
   - Expected: 404 Not Found (RLS blokuje)

6. **Invalid body:** Puste pola, zbyt długie teksty
   - Expected: 422 Validation Error z details

7. **Malformed JSON:** Nieprawidłowy JSON w body
   - Expected: 400 Bad Request

**Narzędzia testowe:**
- cURL, Postman, lub Insomnia
- Thunder Client (VS Code extension)

### Krok 12: Weryfikacja zgodności z regułami projektu
- ✅ Używa `context.locals.supabase` (nie importuje bezpośrednio)
- ✅ Używa Zod do walidacji
- ✅ Logika w service layer (`FlashcardService`)
- ✅ Early returns dla błędów
- ✅ Guard clauses na początku funkcji
- ✅ Proper error handling z user-friendly messages
- ✅ `export const prerender = false` dla API route

### Krok 13: Code review i optymalizacja
- Sprawdź czy wszystkie ścieżki błędów są obsłużone
- Zweryfikuj zgodność z TypeScript types
- Upewnij się, że error messages są konsystentne z API plan
- Sprawdź czy nie ma code duplication z innymi endpointami

### Krok 14: Przygotowanie do deployment
- Commit zmian z opisowym commit message
- Uruchom linter: `npm run lint`
- Sprawdź build produkcyjny: `npm run build`
- Update dokumentacji API jeśli potrzebne

### Krok 15: Monitoring po wdrożeniu
- Monitor error logs w środowisku produkcyjnym
- Sprawdzaj błędy 404 (może wskazywać problemy z RLS)
- Monitoruj czasy odpowiedzi (powinny być < 200ms)
- Obserwuj rate of 422 errors (mogą wskazywać problemy z frontendem)

---

## Podsumowanie

Ten plan wdrożenia dostarcza kompletny przewodnik do implementacji endpointu `PUT /api/flashcards/{id}`. Endpoint wykorzystuje istniejące komponenty (service, validation schemas) i jest zgodny z architekturą projektu oraz zasadami bezpieczeństwa.

**Kluczowe punkty:**
- ✅ Istniejący service method (`updateFlashcard`) jest gotowy do użycia
- ✅ Istniejący validation schema (`updateFlashcardSchema`) jest gotowy do użycia
- ✅ RLS w bazie danych automatycznie zabezpiecza autoryzację
- ✅ Error handling jest kompleksowy i user-friendly
- ✅ Zgodność z regułami projektu i tech stack

**Szacowany czas implementacji:** 1-2 godziny (włączając testowanie manualne)

