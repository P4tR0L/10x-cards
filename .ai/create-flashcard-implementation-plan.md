# API Endpoint Implementation Plan: Create Single Flashcard (Manual)

## 1. Przegląd punktu końcowego

**Endpoint:** `POST /api/flashcards`

**Cel:** Umożliwienie użytkownikom tworzenia pojedynczej fiszki w sposób ręczny (nie generowanej przez AI).

**Kluczowe funkcje:**
- Przyjmuje dane przedniej i tylnej strony fiszki
- Automatycznie przypisuje fiszkę do zalogowanego użytkownika
- Ustawia źródło na 'manual' i generation_id na NULL
- Zwraca utworzoną fiszkę z wygenerowanym ID i timestampami

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
/api/flashcards
```

### Request Headers
| Header | Wartość | Wymagany | Opis |
|--------|---------|----------|------|
| `Authorization` | `Bearer <jwt_token>` | Tak | Token JWT z Supabase Auth |
| `Content-Type` | `application/json` | Tak | Format danych wejściowych |

### Request Body

**Struktura JSON:**
```json
{
  "front": "Photosynthesis",
  "back": "The process by which plants convert light energy into chemical energy"
}
```

**Parametry:**

| Pole | Typ | Wymagany | Ograniczenia | Opis |
|------|-----|----------|--------------|------|
| `front` | string | Tak | 1-5000 znaków, non-empty po trim | Przednia strona fiszki (pytanie/pojęcie) |
| `back` | string | Tak | 1-5000 znaków, non-empty po trim | Tylna strona fiszki (odpowiedź/definicja) |

**Uwagi:**
- Pola są trimowane przed walidacją
- Puste stringi (po trim) są odrzucane
- Maksymalna długość odpowiada limitom w bazie danych (VARCHAR(5000))

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**CreateFlashcardCommand** (Input):
```typescript
interface CreateFlashcardCommand {
  front: string;
  back: string;
}
```

**FlashcardDTO** (Output):
```typescript
type FlashcardDTO = Omit<Tables<"flashcards">, "user_id">;
// Zawiera: id, front, back, source, generation_id, created_at, updated_at
```

**FlashcardResponse** (Response Wrapper):
```typescript
type FlashcardResponse = SingleItemResponse<FlashcardDTO>;
// Struktura: { data: FlashcardDTO }
```

**ErrorResponse** (Błędy):
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string | string[]>;
}
```

### Database Types

**FlashcardInsert** (dla operacji INSERT):
```typescript
type FlashcardInsert = TablesInsert<"flashcards">;
// Zawiera wszystkie pola wymagane do insertu
```

## 4. Szczegóły odpowiedzi

### Sukces: 201 Created

**Struktura:**
```json
{
  "data": {
    "id": 150,
    "front": "Photosynthesis",
    "back": "The process by which plants convert light energy into chemical energy",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-11-04T14:22:33.123Z",
    "updated_at": "2025-11-04T14:22:33.123Z"
  }
}
```

**Headers:**
```
Content-Type: application/json
```

### Błędy

#### 400 Bad Request
**Przyczyny:**
- Malformed JSON w request body
- Brak Content-Type header
- Nieprawidłowa struktura danych

**Response:**
```json
{
  "error": "Bad request",
  "message": "Invalid request body"
}
```

#### 401 Unauthorized
**Przyczyny:**
- Brak tokenu Authorization
- Nieprawidłowy token JWT
- Wygasły token JWT
- Brak sesji użytkownika

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### 422 Validation Error
**Przyczyny:**
- Pola front lub back są puste po trim
- Pola przekraczają 5000 znaków
- Brakujące wymagane pola

**Response:**
```json
{
  "error": "Validation error",
  "message": "Validation failed",
  "details": {
    "front": "Front field cannot be empty",
    "back": "Back field cannot exceed 5000 characters"
  }
}
```

#### 500 Internal Server Error
**Przyczyny:**
- Błędy bazy danych
- Nieoczekiwane wyjątki aplikacji
- Problemy z połączeniem do Supabase

**Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Request przychodzi do endpointu POST /api/flashcards
   ↓
2. Middleware weryfikuje token JWT i tworzy sesję Supabase
   ↓
3. Endpoint pobiera user_id z context.locals.supabase
   ↓
4. Parsing request body (JSON)
   ↓
5. Walidacja danych wejściowych (Zod schema)
   ↓
6. Wywołanie flashcardService.createManualFlashcard(userId, data)
   ↓
7. Service przygotowuje dane do insertu:
   - user_id (z parametru)
   - front, back (z request body)
   - source: 'manual'
   - generation_id: null
   ↓
8. Insert do tabeli flashcards przez Supabase client
   ↓
9. RLS Policy sprawdza: auth.uid() = user_id
   ↓
10. Baza danych:
    - Generuje ID (BIGINT IDENTITY)
    - Ustawia created_at i updated_at (now())
    - Sprawdza CHECK constraints
    ↓
11. Zwrócenie utworzonej fiszki (z ID i timestampami)
    ↓
12. Service mapuje na FlashcardDTO (usuwa user_id)
    ↓
13. Endpoint opakowuje w FlashcardResponse { data: ... }
    ↓
14. Zwrócenie odpowiedzi 201 Created
```

### Interakcje z bazą danych

**Query:**
```sql
INSERT INTO flashcards (user_id, front, back, source, generation_id)
VALUES ($1, $2, $3, 'manual', NULL)
RETURNING *;
```

**Parametry:**
- `$1`: UUID użytkownika z sesji
- `$2`: front (string, trimmed)
- `$3`: back (string, trimmed)

**RLS Policy stosowana:**
- `flashcards_insert_policy`: `auth.uid() = user_id`

**CHECK Constraints sprawdzane:**
- `length(front) > 0`
- `length(back) > 0`
- `source IN ('manual', 'ai')`

## 6. Względy bezpieczeństwa

### Authentication (Uwierzytelnianie)

**Mechanizm:**
- Token JWT z Supabase Auth w nagłówku Authorization
- Middleware Astro weryfikuje token i tworzy sesję
- Sesja dostępna przez `context.locals.supabase`

**Implementacja:**
```typescript
const { data: { user }, error } = await context.locals.supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({
    error: "Unauthorized",
    message: "Invalid or missing authentication token"
  }), { status: 401 });
}
```

### Authorization (Autoryzacja)

**Row-Level Security (RLS):**
- Włączona na tabeli flashcards
- Insert policy: `auth.uid() = user_id`
- Automatyczne sprawdzenie przez PostgreSQL

**Dodatkowe zabezpieczenia:**
- user_id NIGDY nie pochodzi z request body
- user_id ZAWSZE pobierany z sesji: `user.id`
- Uniemożliwia użytkownikom tworzenie fiszek dla innych

### Walidacja danych

**Poziom aplikacji (Zod):**
```typescript
const createFlashcardSchema = z.object({
  front: z.string()
    .trim()
    .min(1, "Front field cannot be empty")
    .max(5000, "Front field cannot exceed 5000 characters"),
  back: z.string()
    .trim()
    .min(1, "Back field cannot be empty")
    .max(5000, "Back field cannot exceed 5000 characters")
});
```

**Poziom bazy danych:**
- CHECK constraints: `length(front) > 0`, `length(back) > 0`
- VARCHAR(5000) limits
- NOT NULL constraints

**Obrona przed atakami:**
- SQL Injection: Parametryzowane zapytania Supabase SDK
- XSS: Walidacja długości (sanityzacja na frontendzie)
- Command Injection: Brak wykonywania komend systemowych

### Content-Type Validation

- Wymagany header: `Content-Type: application/json`
- Odrzucanie innych typów (400 Bad Request)

### Rate Limiting

**Status MVP:** Nie implementowane (poza zakresem MVP)

**Przyszłe rozważania:**
- Middleware rate-limiting per user
- Limit: np. 100 requests/minute per user
- Odpowiedź: 429 Too Many Requests

## 7. Obsługa błędów

### Hierarchia obsługi błędów

```
1. Middleware errors (401 Unauthorized)
   ↓
2. JSON parsing errors (400 Bad Request)
   ↓
3. Validation errors (422 Validation Error)
   ↓
4. Service/Database errors (500 Internal Server Error)
   ↓
5. Unexpected errors (500 Internal Server Error)
```

### Szczegółowe scenariusze

#### 1. Brak autoryzacji (401)

**Trigger:**
- Brak nagłówka Authorization
- Token JWT nieprawidłowy/wygasły
- `context.locals.supabase.auth.getUser()` zwraca błąd

**Handling:**
```typescript
if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Invalid or missing authentication token"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** Nie logować (normalna sytuacja)

#### 2. Nieprawidłowe dane wejściowe (400)

**Trigger:**
- Malformed JSON
- Brak Content-Type
- Request body nie jest obiektem

**Handling:**
```typescript
try {
  const body = await request.json();
} catch (e) {
  return new Response(
    JSON.stringify({
      error: "Bad request",
      message: "Invalid request body"
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** Opcjonalne (debug level)

#### 3. Błędy walidacji (422)

**Trigger:**
- Zod schema validation fails
- front lub back puste po trim
- front lub back > 5000 znaków

**Handling:**
```typescript
const validation = createFlashcardSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      message: "Validation failed",
      details: validation.error.flatten().fieldErrors
    }),
    { status: 422, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** Opcjonalne (info level)

#### 4. Błędy bazy danych (500)

**Trigger:**
- Połączenie z bazą danych niesprawne
- CHECK constraint violation (nie powinno się zdarzyć po walidacji Zod)
- RLS policy violation (nie powinno się zdarzyć przy poprawnym user_id)

**Handling:**
```typescript
try {
  const flashcard = await flashcardService.createManualFlashcard(user.id, validatedData);
  // ...
} catch (error) {
  console.error("Error creating flashcard:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** TAK - console.error z pełnym stack trace

#### 5. Nieoczekiwane błędy (500)

**Trigger:**
- Wyjątki aplikacji
- Błędy runtime
- Null pointer exceptions

**Handling:**
- Globalne try-catch w endpoint handler
- Zwrot generycznego 500 Internal Server Error
- **NIGDY nie ujawniać szczegółów błędu użytkownikowi**

**Logging:** TAK - console.error z pełnym stack trace

### Strategia logowania

**Co logować:**
- Wszystkie błędy 500 (server-side)
- User ID i timestamp
- Stack trace
- Request context (bez wrażliwych danych)

**Czego NIE logować:**
- Tokeny JWT
- Hasła (nie występują w tym endpoint)
- Pełne request body (może zawierać dane wrażliwe)

**Format logu:**
```typescript
console.error("[POST /api/flashcards] Error creating flashcard", {
  userId: user.id,
  timestamp: new Date().toISOString(),
  error: error.message,
  stack: error.stack
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Połączenie z bazą danych
**Problem:** Każdy request wykonuje INSERT do PostgreSQL

**Mitigation:**
- Supabase pooling połączeń (domyślnie skonfigurowany)
- RLS wykonywane na poziomie bazy (wydajne)
- Indeksy: `idx_flashcards_user_id` przyspiesza RLS checks

**MVP:** Wystarczające bez dodatkowych optymalizacji

#### 2. Walidacja Zod
**Problem:** Parsing schema dla każdego requestu

**Mitigation:**
- Zod jest bardzo wydajne dla prostych schematów
- Schema kompilowane raz przy starcie aplikacji
- Brak głębokich nested obiektów

**MVP:** Nie stanowi problemu

#### 3. JWT Verification
**Problem:** Weryfikacja tokenu dla każdego requestu

**Mitigation:**
- Obsługiwane przez middleware (jednorazowo per request)
- Supabase SDK cache'uje sesję
- Używa szybkich crypto operacji

**MVP:** Nie stanowi problemu

#### 4. JSON Serialization
**Problem:** Parsing i stringify JSON dla każdego requestu

**Mitigation:**
- Natywny JSON.parse/stringify w Node.js (bardzo szybki)
- Małe payload (< 10KB dla pojedynczej fiszki)

**MVP:** Nie stanowi problemu

### Strategie optymalizacji

#### Obecne (MVP)

1. **Indeksy bazy danych:**
   - `idx_flashcards_user_id` (BTREE)
   - `idx_flashcards_created_at` (BTREE DESC)
   - RLS wykorzystuje te indeksy automatycznie

2. **Connection pooling:**
   - Supabase zarządza poolem połączeń
   - Brak potrzeby zarządzania po stronie aplikacji

3. **Single query:**
   - Jeden INSERT RETURNING
   - Brak N+1 query problem

#### Przyszłe (poza MVP)

1. **Rate limiting:**
   - Zapobieganie spam/abuse
   - Ochrona bazy danych przed przeciążeniem

2. **Caching:**
   - Nie dotyczy POST endpoint (modyfikacja danych)
   - Cache dla GET endpoints (list, single)

3. **Batch operations:**
   - Już zaimplementowane: POST /api/flashcards/batch
   - Wydajniejsze dla tworzenia wielu fiszek

4. **Monitoring:**
   - Instrumentacja (np. OpenTelemetry)
   - Monitorowanie czasów odpowiedzi
   - Alerty przy degradacji wydajności

### Oczekiwana wydajność

**Response time:**
- P50: < 100ms
- P95: < 300ms
- P99: < 500ms

**Throughput:**
- MVP: 100 requests/second (wystarczające dla małej/średniej aplikacji)
- Skalowalność: Supabase skaluje się automatycznie

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

**Utworzyć pliki:**

```
src/pages/api/flashcards/index.ts         # Główny endpoint handler
src/lib/services/flashcard.service.ts     # Business logic service
src/lib/validation/flashcard.validation.ts # Zod schemas
```

**Struktura:**
- `index.ts`: Obsługa routingu (GET, POST)
- `flashcard.service.ts`: Logika biznesowa oddzielona od routingu
- `flashcard.validation.ts`: Wszystkie schematy walidacji fiszek

### Krok 2: Implementacja walidacji (flashcard.validation.ts)

**Zadania:**
1. Zaimportować `zod`
2. Zdefiniować `createFlashcardSchema`
3. Wyeksportować schema i typ

**Kod:**
```typescript
import { z } from "zod";

export const createFlashcardSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front field cannot be empty")
    .max(5000, "Front field cannot exceed 5000 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back field cannot be empty")
    .max(5000, "Back field cannot exceed 5000 characters"),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
```

**Testy do napisania:**
- ✅ Walidacja poprawnych danych
- ✅ Odrzucenie pustych stringów
- ✅ Odrzucenie stringów > 5000 znaków
- ✅ Trimowanie whitespace

### Krok 3: Implementacja service (flashcard.service.ts)

**Zadania:**
1. Zaimportować typy z `types.ts` i `database.types.ts`
2. Zaimportować `SupabaseClient` type
3. Zaimplementować metodę `createManualFlashcard`

**Kod:**
```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, FlashcardInsert } from "@/types";
import type { CreateFlashcardInput } from "@/lib/validation/flashcard.validation";

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  async createManualFlashcard(
    userId: string,
    data: CreateFlashcardInput
  ): Promise<FlashcardDTO> {
    const insertData: FlashcardInsert = {
      user_id: userId,
      front: data.front,
      back: data.back,
      source: "manual",
      generation_id: null,
    };

    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    // Usuń user_id przed zwróceniem (FlashcardDTO nie zawiera user_id)
    const { user_id, ...flashcardDTO } = flashcard;
    return flashcardDTO as FlashcardDTO;
  }
}
```

**Testy do napisania:**
- ✅ Pomyślne utworzenie fiszki
- ✅ Poprawne mapowanie danych
- ✅ Usunięcie user_id z odpowiedzi
- ✅ Obsługa błędów bazy danych

### Krok 4: Implementacja endpoint handler (index.ts)

**Zadania:**
1. Eksportować `export const prerender = false`
2. Zaimplementować funkcję `POST`
3. Obsłużyć authentication
4. Obsłużyć parsing i walidację
5. Wywołać service
6. Zwrócić odpowiedź

**Kod:**
```typescript
import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { createFlashcardSchema } from "@/lib/validation/flashcard.validation";
import type { FlashcardResponse, ErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Authentication
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

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

    // 2. Parse request body
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

    // 3. Validate input
    const validation = createFlashcardSchema.safeParse(body);
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

    // 4. Create flashcard via service
    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.createManualFlashcard(
      user.id,
      validation.data
    );

    // 5. Return success response
    const response: FlashcardResponse = {
      data: flashcard,
    };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle unexpected errors
    console.error("[POST /api/flashcards] Error creating flashcard:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Testy do napisania:**
- ✅ 201 Created dla poprawnych danych
- ✅ 401 Unauthorized bez tokenu
- ✅ 400 Bad Request dla malformed JSON
- ✅ 422 Validation Error dla nieprawidłowych danych
- ✅ 500 Internal Server Error dla błędów bazy

### Krok 5: Weryfikacja middleware

**Zadania:**
1. Sprawdzić `src/middleware/index.ts`
2. Upewnić się, że JWT verification działa
3. Upewnić się, że `context.locals.supabase` jest dostępny

**Oczekiwana konfiguracja:**
```typescript
// middleware/index.ts powinien:
// 1. Tworzyć Supabase client z cookies
// 2. Weryfikować sesję użytkownika (opcjonalnie)
// 3. Dodawać supabase client do context.locals
```

**Weryfikacja:**
- Sprawdzić, czy middleware jest poprawnie skonfigurowany
- Sprawdzić, czy `context.locals.supabase` ma typ `SupabaseClient`

### Krok 6: Weryfikacja typów TypeScript

**Zadania:**
1. Uruchomić `npx tsc --noEmit`
2. Poprawić błędy typowania
3. Upewnić się, że wszystkie importy są poprawne

**Sprawdzić:**
- Import `SupabaseClient` z `@/db/supabase.client`
- Import typów z `@/types`
- Import Zod schemas z `@/lib/validation/flashcard.validation`
- Context types w Astro

### Krok 7: Testowanie manualne

**Scenariusze testowe:**

**Test 1: Poprawne utworzenie fiszki**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Test Question",
    "back": "Test Answer"
  }'
```
**Oczekiwany wynik:** 201 Created z FlashcardDTO

**Test 2: Brak autoryzacji**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Test Question",
    "back": "Test Answer"
  }'
```
**Oczekiwany wynik:** 401 Unauthorized

**Test 3: Nieprawidłowy JSON**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```
**Oczekiwany wynik:** 400 Bad Request

**Test 4: Walidacja - puste pole**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "",
    "back": "Test Answer"
  }'
```
**Oczekiwany wynik:** 422 Validation Error

**Test 5: Walidacja - przekroczenie limitu**
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "'$(python3 -c 'print("A" * 5001)')'",
    "back": "Test Answer"
  }'
```
**Oczekiwany wynik:** 422 Validation Error

### Krok 8: Weryfikacja bazy danych

**Zadania:**
1. Połączyć się z Supabase Dashboard lub lokalną bazą
2. Sprawdzić, czy fiszka została utworzona
3. Sprawdzić poprawność danych

**Zapytanie SQL:**
```sql
SELECT * FROM flashcards 
WHERE source = 'manual' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Weryfikacja:**
- ✅ `source` = 'manual'
- ✅ `generation_id` = NULL
- ✅ `user_id` = UUID zalogowanego użytkownika
- ✅ `front` i `back` zawierają poprawne dane
- ✅ `created_at` i `updated_at` są ustawione

### Krok 9: Weryfikacja RLS policies

**Zadania:**
1. Utworzyć fiszkę jako User A
2. Spróbować odczytać fiszkę jako User B
3. Upewnić się, że User B NIE widzi fiszki User A

**Test:**
```typescript
// 1. Utworzyć fiszkę jako User A (przez API)
// 2. Spróbować direct query jako User B:
const { data, error } = await supabaseClientB
  .from('flashcards')
  .select('*')
  .eq('user_id', userA.id);

// Oczekiwany wynik: data = [] (pusta tablica)
// RLS blokuje dostęp
```

### Krok 10: Linting i formatowanie

**Zadania:**
1. Uruchomić linter: `npm run lint` (lub podobne)
2. Poprawić błędy lintingu
3. Sformatować kod: `npm run format` (lub podobne)

**Sprawdzić:**
- Brak błędów ESLint
- Kod sformatowany zgodnie z Prettier/config
- Import order poprawny
- Brak unused variables

### Krok 11: Dokumentacja i komentarze

**Zadania:**
1. Dodać JSDoc comments do funkcji service
2. Dodać komentarze do skomplikowanych sekcji kodu
3. Upewnić się, że kod jest czytelny

**Przykład:**
```typescript
/**
 * Creates a new manual flashcard for the authenticated user.
 * 
 * @param userId - The ID of the user creating the flashcard
 * @param data - The flashcard data (front and back)
 * @returns The created flashcard without user_id
 * @throws Error if database operation fails
 */
async createManualFlashcard(
  userId: string,
  data: CreateFlashcardInput
): Promise<FlashcardDTO> {
  // Implementation...
}
```

### Krok 12: Code review checklist

**Przed zatwierdzeniem sprawdzić:**

- [ ] Wszystkie typy TypeScript są poprawne (brak `any`)
- [ ] Authentication sprawdzany na początku
- [ ] user_id pobierany z sesji, NIE z request body
- [ ] Wszystkie błędy są obsłużone (try-catch)
- [ ] Błędy 500 są logowane z console.error
- [ ] Wrażliwe dane NIE są ujawniane w error messages
- [ ] Validation errors zawierają szczegóły w `details`
- [ ] Response headers zawierają `Content-Type: application/json`
- [ ] Status codes są poprawne (201, 400, 401, 422, 500)
- [ ] Service jest oddzielony od endpoint handler
- [ ] Zod schema jest zdefiniowany w osobnym pliku
- [ ] RLS policies działają poprawnie
- [ ] Kod jest sformatowany i bez błędów lintingu
- [ ] Brak console.log (tylko console.error dla błędów)
- [ ] Import paths używają aliasów (np. `@/types`)

### Krok 13: Deployment readiness

**Przed wdrożeniem na produkcję:**

1. **Environment variables:**
   - `SUPABASE_URL` ustawiony
   - `SUPABASE_ANON_KEY` ustawiony
   - Supabase project skonfigurowany

2. **Database migrations:**
   - Tabela `flashcards` istnieje
   - RLS policies włączone
   - Indeksy utworzone

3. **Monitoring:**
   - Logi aplikacji skonfigurowane
   - Error tracking (opcjonalnie: Sentry)
   - Performance monitoring (opcjonalnie)

4. **Security:**
   - HTTPS wymuszony
   - CORS skonfigurowany (jeśli dotyczy)
   - Rate limiting (opcjonalnie dla MVP)

## Podsumowanie

Ten plan implementacji dostarcza kompleksowych wskazówek dla zespołu programistów do wdrożenia endpointu `POST /api/flashcards`. Plan pokrywa wszystkie aspekty: strukturę danych, bezpieczeństwo, walidację, obsługę błędów, wydajność oraz szczegółowe kroki implementacji z przykładami kodu i testami.

**Kluczowe punkty:**
- Bezpieczeństwo: JWT + RLS
- Walidacja: Zod schema + DB constraints
- Separacja: Service layer oddzielony od routing
- Błędy: Szczegółowa obsługa z odpowiednimi kodami
- Testy: Manualne scenariusze testowe
- Gotowość: Deployment checklist

**Czas implementacji (szacunkowy):**
- Junior Developer: 4-6 godzin
- Mid Developer: 2-3 godziny
- Senior Developer: 1-2 godziny

**Zależności:**
- Supabase client skonfigurowany
- Middleware authentication działający
- Database migrations wykonane
- TypeScript i Zod zainstalowane

