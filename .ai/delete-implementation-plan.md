# API Endpoint Implementation Plan: DELETE /api/flashcards/{id}

## 1. Przegląd punktu końcowego

**Endpoint:** `DELETE /api/flashcards/{id}`

**Cel:** Usunięcie konkretnej fiszki należącej do uwierzytelnionego użytkownika.

**Funkcjonalność:**
- Uwierzytelnia użytkownika za pomocą JWT tokena
- Waliduje parametr ID jako dodatnią liczbę całkowitą
- Usuwa fiszkę z bazy danych (jeśli należy do użytkownika)
- Zwraca status 204 No Content w przypadku sukcesu
- Wykorzystuje RLS (Row Level Security) do zapewnienia że użytkownik może usunąć tylko swoje fiszki

**Kontekst bezpieczeństwa:**
- RLS policy `flashcards_delete_policy` zapewnia że `auth.uid() = user_id`
- Endpoint nie ujawnia informacji o istnieniu fiszek należących do innych użytkowników (404 dla obu przypadków: nie istnieje / brak dostępu)

## 2. Szczegóły żądania

### Metoda HTTP
`DELETE`

### Struktura URL
```
DELETE /api/flashcards/{id}
```

### Parametry

#### Path Parameters (Wymagane)
| Parameter | Type | Validation | Description |
|:----------|:-----|:-----------|:------------|
| `id` | integer | Positive integer (> 0) | Unikalny identyfikator fiszki do usunięcia |

#### Request Headers (Wymagane)
```
Authorization: Bearer <jwt_token>
```

**JWT Token requirements:**
- Musi być prawidłowy token wydany przez Supabase Auth
- Nie może być wygasły
- Musi zawierać prawidłowy `user_id` w payload

#### Request Body
Brak - DELETE nie przyjmuje body

## 3. Wykorzystywane typy

### Typy z `src/types.ts`

#### ErrorResponse
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string | string[]>;
}
```

**Wykorzystanie:** Wszystkie odpowiedzi błędów (400, 401, 404, 500)

### Typy wewnętrzne service

#### FlashcardEntity (wewnętrzne użycie)
```typescript
type FlashcardEntity = Tables<"flashcards">;
```

**Wykorzystanie:** Wewnętrznie w `FlashcardService.deleteFlashcard()` do weryfikacji istnienia fiszki przed usunięciem

### Brak dedykowanych typów dla DELETE
- Endpoint nie zwraca danych (204 No Content)
- Endpoint nie przyjmuje body
- Używa tylko `ErrorResponse` dla błędów

## 4. Szczegóły odpowiedzi

### Sukces (204 No Content)

**Status Code:** `204`

**Response Body:** Brak (empty body)

**Response Headers:**
```
Content-Length: 0
```

**Kiedy zwracana:**
- Fiszka została pomyślnie usunięta
- Fiszka należała do uwierzytelnionego użytkownika
- RLS policy zezwoliła na operację

### Błąd - Invalid ID (400 Bad Request)

**Status Code:** `400`

**Response Body:**
```json
{
  "error": "Bad request",
  "message": "Invalid flashcard ID"
}
```

**Response Headers:**
```
Content-Type: application/json
```

**Kiedy zwracana:**
- ID nie jest liczbą całkowitą (np. "abc", "12.5")
- ID jest ujemne lub zero (np. "0", "-5")

### Błąd - Unauthorized (401 Unauthorized)

**Status Code:** `401`

**Response Body:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Response Headers:**
```
Content-Type: application/json
```

**Kiedy zwracana:**
- Brak nagłówka Authorization
- Token JWT jest nieprawidłowy lub uszkodzony
- Token JWT wygasł
- Token JWT nie ma prawidłowego `user_id`

### Błąd - Not Found (404 Not Found)

**Status Code:** `404`

**Response Body:**
```json
{
  "error": "Not found",
  "message": "Flashcard not found or you don't have permission to delete it"
}
```

**Response Headers:**
```
Content-Type: application/json
```

**Kiedy zwracana:**
- Fiszka o podanym ID nie istnieje w bazie danych
- Fiszka istnieje ale należy do innego użytkownika (RLS zablokował dostęp)

**Uwaga bezpieczeństwa:** Łączymy oba przypadki w jeden komunikat aby nie ujawniać informacji o istnieniu zasobów należących do innych użytkowników (zabezpieczenie przed IDOR enumeration).

### Błąd - Internal Server Error (500)

**Status Code:** `500`

**Response Body:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Response Headers:**
```
Content-Type: application/json
```

**Kiedy zwracana:**
- Nieoczekiwany błąd bazy danych
- Błąd sieci/komunikacji z Supabase
- Nieobsłużony wyjątek w kodzie aplikacji

**Logging:** Pełne szczegóły błędu są logowane do console.error z timestamp i stacktrace, ale nie są ujawniane użytkownikowi.

## 5. Przepływ danych

### Diagram przepływu

```
[Client Request] 
    ↓
[1. Authentication Check]
    ├─ Invalid/Missing Token → 401 Response
    └─ Valid Token
        ↓
[2. Parse & Validate ID]
    ├─ Invalid ID → 400 Response
    └─ Valid ID
        ↓
[3. FlashcardService.deleteFlashcard(id)]
    ↓
[4. Supabase DELETE Query with RLS]
    ├─ No rows deleted → Service throws Error
    └─ 1 row deleted
        ↓
[5. Success: 204 No Content]
```

### Szczegółowy przepływ

#### Krok 1: Autentykacja
```typescript
const { data: { user }, error: authError } = 
  await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return 401 Unauthorized
}
```

**Interakcja z Supabase:**
- `auth.getUser()` weryfikuje JWT token z nagłówka Authorization
- Zwraca dane użytkownika lub błąd autentykacji
- Token jest automatycznie wyodrębniany z nagłówka przez middleware

#### Krok 2: Walidacja ID
```typescript
const flashcardId = parseInt(context.params.id || "", 10);

if (isNaN(flashcardId) || flashcardId <= 0) {
  return 400 Bad Request
}
```

**Walidacja:**
- Parsowanie stringa do integer
- Sprawdzenie czy wynik nie jest NaN
- Sprawdzenie czy wartość jest dodatnia

#### Krok 3: Wywołanie service
```typescript
const flashcardService = new FlashcardService(context.locals.supabase);
await flashcardService.deleteFlashcard(flashcardId);
```

**Inicjalizacja service:**
- Service otrzymuje uwierzytelniony Supabase client
- Client zawiera context użytkownika (JWT) dla RLS

#### Krok 4: Operacja DELETE w bazie danych
```typescript
// W FlashcardService.deleteFlashcard()
const { data, error } = await this.supabase
  .from("flashcards")
  .delete()
  .eq("id", flashcardId)
  .select(); // Zwraca usunięte wiersze

if (error) {
  throw new Error(`Failed to delete flashcard: ${error.message}`);
}

if (!data || data.length === 0) {
  throw new Error("Flashcard not found or access denied");
}
```

**RLS Policy w akcji:**
- Policy `flashcards_delete_policy`: `WHERE auth.uid() = user_id`
- Jeśli fiszka nie należy do użytkownika, RLS nie zwróci żadnych wierszy
- Jeśli fiszka nie istnieje, również 0 wierszy

**Database Operations:**
1. Supabase konstruuje query: `DELETE FROM flashcards WHERE id = {flashcardId} AND user_id = auth.uid()`
2. PostgreSQL wykonuje query
3. Trigger `updated_at` (jeśli istnieje) nie jest wywoływany dla DELETE
4. Zwraca liczbę usuniętych wierszy (0 lub 1)

#### Krok 5: Obsługa wyniku
```typescript
// W endpoincie
try {
  await flashcardService.deleteFlashcard(flashcardId);
  return 204 No Content;
} catch (error) {
  if (error.message.includes("not found")) {
    return 404 Not Found;
  }
  throw error; // Przekazanie do głównego error handlera
}
```

### Interakcje z zewnętrznymi systemami

#### Supabase PostgreSQL
- **Operacja:** DELETE query z RLS
- **Endpoint:** Supabase REST API (przez SDK)
- **Timeout:** Default Supabase client timeout (~60s)
- **Retry policy:** Brak automatycznych retry (single request)
- **Error codes:** PostgreSQL error codes (mapped przez Supabase)

#### Supabase Auth
- **Operacja:** JWT verification
- **Endpoint:** Supabase Auth API
- **Caching:** JWT verification może być cache'owana przez Supabase
- **Timeout:** Default auth timeout (~30s)

### Brak interakcji z:
- OpenRouter/AI services (nie dotyczy DELETE)
- generation_error_logs table (nie dotyczy DELETE)
- generations table (nie jest aktualizowana przy DELETE fiszki)

## 6. Względy bezpieczeństwa

### Autentykacja

**Mechanizm:** JWT Bearer token w nagłówku Authorization

**Implementacja:**
```typescript
const { data: { user }, error: authError } = 
  await context.locals.supabase.auth.getUser();
```

**Weryfikacja:**
- Token musi być prawidłowym JWT wydanym przez Supabase
- Signature musi być prawidłowa (weryfikowana przez Supabase)
- Token nie może być wygasły
- User ID musi istnieć w `auth.users`

**Middleware:** 
- Astro middleware (`src/middleware/index.ts`) konfiguruje Supabase client z tokenem z nagłówka

### Autoryzacja (Row Level Security)

**RLS Policy:** `flashcards_delete_policy`

```sql
CREATE POLICY flashcards_delete_policy ON flashcards
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Działanie:**
- PostgreSQL automatycznie dodaje warunek `WHERE auth.uid() = user_id` do każdego DELETE
- Jeśli warunek nie jest spełniony, query nie usuwa żadnych wierszy
- Użytkownik nie może usunąć fiszek innych użytkowników nawet znając ID

**Bezpieczeństwo:**
- Autoryzacja na poziomie bazy danych (defense in depth)
- Niezależna od logiki aplikacji
- Nie można ominąć nawet przy błędach w kodzie aplikacji

### Ochrona przed IDOR (Insecure Direct Object Reference)

**Problem:** Atakujący może próbować usuwać fiszki innych użytkowników zgadując ID

**Ochrona:**
1. **RLS Policy:** Zapobiega usunięciu fiszek innych użytkowników
2. **Generyczny komunikat błędu:** 404 dla obu przypadków (nie istnieje / brak dostępu)
3. **Brak information disclosure:** Nie ujawniamy czy fiszka istnieje

**Przykład ataku:**
```
User A (ID: user-123) próbuje usunąć fiszkę należącą do User B
DELETE /api/flashcards/999 (należy do User B)

Response: 404 "Flashcard not found or you don't have permission to delete it"
```

Atakujący nie może określić czy fiszka 999 w ogóle istnieje.

### Walidacja danych wejściowych

**ID Parameter:**
```typescript
const flashcardId = parseInt(context.params.id || "", 10);

if (isNaN(flashcardId) || flashcardId <= 0) {
  return 400 Bad Request;
}
```

**Ochrona przed:**
- SQL Injection: Parametry są sanitizowane przez Supabase ORM
- Type confusion: Walidacja typu (integer)
- Negative IDs: Sprawdzenie wartości > 0
- Non-numeric IDs: Sprawdzenie NaN

### Ochrona przed DOS/Rate Limiting

**Obecna implementacja:** Brak (MVP)

**Przyszłe rozszerzenia:**
- Rate limiting per user (np. max 100 DELETE/minute)
- Rate limiting per IP (np. max 1000 DELETE/minute)
- Implementacja w Astro middleware lub reverse proxy (nginx)

### Information Disclosure Prevention

**Zabezpieczenia:**
1. **Nie ujawniamy szczegółów błędów bazy danych** (generic 500)
2. **Nie ujawniamy stack traces** (tylko w logach serwera)
3. **Nie ujawniamy istnienia zasobów** (generic 404)
4. **Nie ujawniamy user_id innych użytkowników**

**Error logging:**
```typescript
console.error("[DELETE /api/flashcards/{id}] Error:", {
  flashcardId: context.params.id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});

// User widzi tylko:
return 500 "An unexpected error occurred"
```

### CORS & Headers

**Security headers (powinny być ustawione przez Astro/middleware):**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

**CORS:**
- Konfiguracja w Astro dla dozwolonych origins
- Dla MVP: same-origin policy

## 7. Obsługa błędów

### Hierarchia obsługi błędów

```
Try-Catch Główny (endpoint)
  ├─ Authentication Error → 401
  ├─ Validation Error (ID) → 400
  ├─ Try-Catch Service Call
  │   ├─ "not found" Error → 404
  │   └─ Other Service Error → re-throw
  └─ Unexpected Error → 500
```

### Tabela błędów

| Error Type | HTTP Code | Error Code | Message | Details | Logging |
|:-----------|:----------|:-----------|:--------|:--------|:--------|
| Missing/Invalid Token | 401 | Unauthorized | Invalid or missing authentication token | - | Warning |
| Invalid ID format | 400 | Bad request | Invalid flashcard ID | - | Info |
| Flashcard not found | 404 | Not found | Flashcard not found or you don't have permission to delete it | - | Info |
| Database error | 500 | Internal server error | An unexpected error occurred | Hidden | Error |
| Network error | 500 | Internal server error | An unexpected error occurred | Hidden | Error |
| Unknown error | 500 | Internal server error | An unexpected error occurred | Hidden | Error |

### Szczegółowa obsługa każdego typu błędu

#### 1. Authentication Errors (401)

**Scenariusze:**
- Brak nagłówka Authorization
- Token nieprawidłowy/uszkodzony
- Token wygasły
- User nie istnieje w auth.users

**Kod:**
```typescript
const { data: { user }, error: authError } = 
  await context.locals.supabase.auth.getUser();

if (authError || !user) {
  const errorResponse: ErrorResponse = {
    error: "Unauthorized",
    message: "Invalid or missing authentication token"
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
```

**Logging:**
```typescript
console.warn("[DELETE /api/flashcards/{id}] Unauthorized access attempt:", {
  authError: authError?.message,
  timestamp: new Date().toISOString()
});
```

#### 2. Validation Errors (400)

**Scenariusze:**
- ID nie jest liczbą: "abc", "12.5", "1e10"
- ID jest zerem lub ujemne: "0", "-5"
- ID jest pustym stringiem: ""

**Kod:**
```typescript
const idParam = context.params.id;
const flashcardId = parseInt(idParam || "", 10);

if (isNaN(flashcardId) || flashcardId <= 0) {
  const errorResponse: ErrorResponse = {
    error: "Bad request",
    message: "Invalid flashcard ID"
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}
```

**Logging:**
```typescript
console.info("[DELETE /api/flashcards/{id}] Invalid ID:", {
  providedId: idParam,
  timestamp: new Date().toISOString()
});
```

#### 3. Not Found Errors (404)

**Scenariusze:**
- Fiszka o podanym ID nie istnieje
- Fiszka istnieje ale należy do innego użytkownika (RLS)

**Service code (modyfikacja wymagana):**
```typescript
// W FlashcardService.deleteFlashcard()
async deleteFlashcard(flashcardId: number): Promise<void> {
  const { data, error } = await this.supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId)
    .select(); // Zwraca usunięte wiersze

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  // Sprawdzenie czy cokolwiek zostało usunięte
  if (!data || data.length === 0) {
    throw new Error("Flashcard not found or access denied");
  }
}
```

**Endpoint code:**
```typescript
try {
  await flashcardService.deleteFlashcard(flashcardId);
  // ... success 204
} catch (error) {
  if (error instanceof Error && error.message.includes("not found")) {
    const errorResponse: ErrorResponse = {
      error: "Not found",
      message: "Flashcard not found or you don't have permission to delete it"
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  throw error; // Re-throw dla głównego catch
}
```

**Logging:**
```typescript
console.info("[DELETE /api/flashcards/{id}] Flashcard not found:", {
  flashcardId,
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

#### 4. Database Errors (500)

**Scenariusze:**
- Błąd połączenia z bazą danych
- Timeout query
- Constraint violation (nie powinno się zdarzyć dla DELETE)
- PostgreSQL error

**Kod:**
```typescript
// Główny try-catch w endpoincie
catch (error) {
  console.error("[DELETE /api/flashcards/{id}] Error deleting flashcard:", {
    flashcardId: context.params.id,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  const errorResponse: ErrorResponse = {
    error: "Internal server error",
    message: "An unexpected error occurred"
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

**Monitoring (przyszłe rozszerzenie):**
- Alert dla > 5% 500 errors
- Dashboard z metrykami błędów
- Integration z Sentry/monitoring service

### Error Response Structure

Wszystkie błędy używają standardowego `ErrorResponse`:

```typescript
interface ErrorResponse {
  error: string;        // Krótki kod błędu
  message: string;      // Czytelny komunikat dla użytkownika
  details?: Record<string, string | string[]>; // Opcjonalne szczegóły (nie używane w DELETE)
}
```

**Przykłady:**
```json
// 401
{"error": "Unauthorized", "message": "Invalid or missing authentication token"}

// 400
{"error": "Bad request", "message": "Invalid flashcard ID"}

// 404
{"error": "Not found", "message": "Flashcard not found or you don't have permission to delete it"}

// 500
{"error": "Internal server error", "message": "An unexpected error occurred"}
```

## 8. Rozważania dotyczące wydajności

### Database Query Performance

**Query complexity:** Bardzo prosta (single DELETE by primary key)

```sql
DELETE FROM flashcards 
WHERE id = $1 AND user_id = auth.uid()
RETURNING *;
```

**Performance characteristics:**
- **Index usage:** PRIMARY KEY index na `id` (automatic)
- **Complexity:** O(1) - direct lookup by primary key
- **Locks:** Row-level lock na usuwanym wierszu (krótkotrwały)
- **Expected latency:** < 10ms (local database), < 50ms (remote)

**Optimization:**
- Nie wymaga dodatkowych indeksów (PK wystarczy)
- Nie wymaga optymalizacji - najbardziej efektywna możliwa operacja

### Network Performance

**Request size:**
- Headers: ~500 bytes (Authorization token, standard headers)
- Body: 0 bytes (DELETE nie ma body)
- **Total request:** ~500 bytes

**Response size:**
- Success (204): 0 bytes (empty body)
- Error (40x/500): ~100 bytes (JSON error)
- **Average response:** ~10 bytes

**Bandwidth impact:** Minimalny

### Potential Bottlenecks

#### 1. Authentication (JWT verification)
**Impact:** ~10-30ms per request

**Mitigation:**
- Supabase cache'uje weryfikację tokenu
- Używamy długich expiration times (np. 1h)
- Refresh token mechanism dla długich sesji

#### 2. Database connection pool
**Impact:** Może być problem przy bardzo wysokim ruchu

**Mitigation (przyszłość):**
- Connection pooling w Supabase (automatic)
- Monitoring pool usage
- Scaling database instances

#### 3. Rate limiting (brak w MVP)
**Impact:** Brak obecnie

**Przyszłe wdrożenie:**
- Rate limiting middleware
- Redis dla distributed rate limiting
- Per-user limits (prevent abuse)

### Scalability Considerations

**Current MVP limits:**
- Single Supabase instance
- No caching layer
- No CDN
- No load balancing

**Estimated capacity (MVP):**
- **Concurrent requests:** ~1000/sec (Supabase free tier)
- **Average response time:** < 100ms
- **P95 response time:** < 200ms

**Scaling strategy (future):**
1. **Horizontal scaling:** Multiple Astro instances + load balancer
2. **Database scaling:** Supabase Pro tier + read replicas
3. **Caching:** Redis for session/user data (nie dotyczy DELETE bezpośrednio)
4. **CDN:** CloudFlare for static assets (nie dotyczy API)

### Monitoring & Metrics

**Key metrics to track:**
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (% of 40x/50x responses)
- Database query time
- Authentication time

**Alerting thresholds (production):**
- P95 response time > 500ms
- Error rate > 5%
- Request rate spike > 200% of baseline

### Optimization Recommendations

**Current (MVP):**
- ✅ No optimization needed - operacja jest już maksymalnie wydajna
- ✅ Primary key lookup jest najszybszą możliwą operacją
- ✅ Single database round-trip

**Future (post-MVP):**
- Implement rate limiting (security > performance)
- Add monitoring/observability
- Consider soft deletes jeśli będzie potrzeba undo/recovery
- Add database query timeout (prevent hanging connections)

## 9. Etapy wdrożenia

### Krok 1: Modyfikacja FlashcardService

**Plik:** `src/lib/services/flashcard.service.ts`

**Cel:** Zmodyfikować metodę `deleteFlashcard()` aby zwracała błąd 404 gdy fiszka nie istnieje lub brak dostępu.

**Obecna implementacja (linie 156-162):**
```typescript
async deleteFlashcard(flashcardId: number): Promise<void> {
  const { error } = await this.supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }
}
```

**Nowa implementacja:**
```typescript
/**
 * Deletes a flashcard by ID
 *
 * This method uses RLS to ensure users can only delete their own flashcards.
 * If no rows are deleted (flashcard doesn't exist or access denied), throws a specific error.
 *
 * @param flashcardId - The ID of the flashcard to delete
 * @throws Error with "not found" message if flashcard doesn't exist or access denied
 * @throws Error for other database failures
 */
async deleteFlashcard(flashcardId: number): Promise<void> {
  // Delete and return deleted rows to verify success
  const { data, error } = await this.supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId)
    .select(); // Returns deleted rows

  // Handle database errors
  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  // Check if any rows were deleted
  // data will be empty array if:
  // - Flashcard doesn't exist
  // - Flashcard exists but belongs to another user (RLS blocked)
  if (!data || data.length === 0) {
    throw new Error("Flashcard not found or access denied");
  }
}
```

**Zmiany:**
- Dodano `.select()` po `.delete()` aby zwrócić usunięte wiersze
- Dodano sprawdzenie czy `data` jest puste
- Rzucamy specyficzny błąd zawierający "not found" dla 404

**Dlaczego ta zmiana:**
- Supabase DELETE domyślnie zwraca sukces nawet jeśli 0 wierszy zostało usuniętych
- Musimy weryfikować czy operacja faktycznie coś usunęła
- Pozwala to rozróżnić sukces (204) od not found (404)

### Krok 2: Utworzenie pliku endpointu

**Plik:** `src/pages/api/flashcards/[id].ts`

**Cel:** Dodać export `DELETE` do istniejącego pliku (który już ma `PUT`).

**Akcja:** 
Otworzyć plik `src/pages/api/flashcards/[id].ts` i dodać eksport DELETE po eksporcie PUT.

**Lokalizacja w pliku:** Po zakończeniu funkcji `PUT` (po linii 172), przed końcem pliku.

### Krok 3: Implementacja DELETE endpoint handler

**Plik:** `src/pages/api/flashcards/[id].ts`

**Kod do dodania:**

```typescript
/**
 * DELETE /api/flashcards/{id}
 *
 * Deletes an existing flashcard for the authenticated user.
 *
 * Path parameters:
 * - id: Flashcard ID (positive integer)
 *
 * Response codes:
 * - 204 No Content: Flashcard deleted successfully
 * - 400 Bad Request: Invalid flashcard ID
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Flashcard not found or access denied
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    // Verify JWT token and get authenticated user from Supabase session
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Handle authentication errors (missing token, invalid token, expired token)
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

    // ========================================================================
    // 2. PARSE AND VALIDATE ID
    // ========================================================================
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

    // ========================================================================
    // 3. DELETE FLASHCARD VIA SERVICE
    // ========================================================================
    // Initialize service with authenticated Supabase client
    const flashcardService = new FlashcardService(context.locals.supabase);

    // Delete flashcard (RLS ensures user can only delete their own flashcards)
    try {
      await flashcardService.deleteFlashcard(flashcardId);

      // Return success response (204 No Content - no body)
      return new Response(null, {
        status: 204,
      });
    } catch (error) {
      // Handle specific service errors (404 not found)
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse: ErrorResponse = {
          error: "Not found",
          message: "Flashcard not found or you don't have permission to delete it",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Re-throw to be caught by outer catch block
      throw error;
    }
  } catch (error) {
    // ========================================================================
    // 4. HANDLE UNEXPECTED ERRORS
    // ========================================================================
    // Log error details for debugging (never expose to user)
    console.error("[DELETE /api/flashcards/{id}] Error deleting flashcard:", {
      flashcardId: context.params.id,
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
  }
};
```

**Struktura kodu:**
1. **Sekcja 1:** Authentication check (identical to PUT)
2. **Sekcja 2:** Parse and validate ID (identical to PUT)
3. **Sekcja 3:** Delete flashcard via service + handle 404
4. **Sekcja 4:** Global error handler for unexpected errors

**Kluczowe elementy:**
- Zwracamy `new Response(null, { status: 204 })` dla sukcesu (no content)
- Nested try-catch dla obsługi 404 z service
- Szczegółowe komentarze wyjaśniające każdy krok
- Consistent error handling pattern z resztą API

### Krok 4: Testowanie lokalne

**Cel:** Zweryfikować że endpoint działa poprawnie dla wszystkich scenariuszy.

#### 4.1. Setup środowiska testowego

```bash
# Uruchom Supabase lokalnie (jeśli używasz local dev)
supabase start

# Uruchom Astro dev server
npm run dev
```

#### 4.2. Przygotowanie danych testowych

**Utwórz test user:**
- Zaloguj się przez aplikację lub użyj Supabase Studio
- Zanotuj user ID i uzyskaj JWT token

**Utwórz test flashcard:**
```bash
# POST /api/flashcards
curl -X POST http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front": "Test question", "back": "Test answer"}'

# Zanotuj ID zwróconej fiszki (np. 123)
```

#### 4.3. Test cases

**Test 1: Sukces - DELETE własnej fiszki**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 204 No Content, brak body
```

**Test 2: Błąd 401 - Brak tokena**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/123 -v

# Expected: 401 Unauthorized
# Body: {"error":"Unauthorized","message":"Invalid or missing authentication token"}
```

**Test 3: Błąd 401 - Nieprawidłowy token**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/123 \
  -H "Authorization: Bearer invalid_token" \
  -v

# Expected: 401 Unauthorized
```

**Test 4: Błąd 400 - Nieprawidłowy ID (nie-liczba)**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/abc \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 400 Bad Request
# Body: {"error":"Bad request","message":"Invalid flashcard ID"}
```

**Test 5: Błąd 400 - Nieprawidłowy ID (zero)**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 400 Bad Request
```

**Test 6: Błąd 404 - Fiszka nie istnieje**
```bash
curl -X DELETE http://localhost:4321/api/flashcards/999999 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected: 404 Not Found
# Body: {"error":"Not found","message":"Flashcard not found or you don't have permission to delete it"}
```

**Test 7: Błąd 404 - Fiszka należy do innego użytkownika**
```bash
# Utwórz fiszkę jako User A, spróbuj usunąć jako User B
curl -X DELETE http://localhost:4321/api/flashcards/123 \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -v

# Expected: 404 Not Found (nie 403 - security best practice)
```

**Test 8: Idempotency - DELETE dwa razy tej samej fiszki**
```bash
# Pierwszy DELETE
curl -X DELETE http://localhost:4321/api/flashcards/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
# Expected: 204 No Content

# Drugi DELETE (ta sama fiszka)
curl -X DELETE http://localhost:4321/api/flashcards/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
# Expected: 404 Not Found (fiszka już nie istnieje)
```

#### 4.4. Weryfikacja w bazie danych

**Sprawdź że fiszka została usunięta:**
```sql
-- W Supabase Studio lub psql
SELECT * FROM flashcards WHERE id = 123;
-- Expected: 0 rows (fiszka usunięta)
```

**Sprawdź że RLS działa:**
```sql
-- Sprawdź RLS policies
SELECT * FROM pg_policies WHERE tablename = 'flashcards' AND cmd = 'DELETE';
-- Expected: flashcards_delete_policy visible
```

### Krok 5: Code review & quality checks

#### 5.1. Linting
```bash
npm run lint

# Expected: No linting errors
```

#### 5.2. Type checking
```bash
npx tsc --noEmit

# Expected: No type errors
```

#### 5.3. Code review checklist

- [ ] Kod zgodny z regułami projektu (early returns, error handling first)
- [ ] Komentarze jasno wyjaśniają logikę
- [ ] Typy TypeScript poprawne (ErrorResponse, APIRoute)
- [ ] Error messages czytelne i spójne z resztą API
- [ ] Security best practices (generic 404, no info disclosure)
- [ ] Logging zawiera wszystkie potrzebne informacje
- [ ] Kod jest DRY (uses FlashcardService)
- [ ] Consistent formatting z resztą pliku [id].ts

### Krok 6: Dokumentacja

#### 6.1. Aktualizacja API documentation

**Plik:** `.ai/api-plan.md`

**Akcja:** Sprawdź że sekcja "3.1.6. Delete Flashcard" jest kompletna i aktualna.

**Weryfikacja:**
- [ ] Request format opisany
- [ ] Response codes opisane
- [ ] Error responses z przykładami
- [ ] Security requirements wyjaśnione

#### 6.2. Komentarze w kodzie

**Weryfikacja:**
- [ ] JSDoc dla funkcji DELETE
- [ ] Inline comments wyjaśniają dlaczego, nie co
- [ ] Error handling paths udokumentowane
- [ ] RLS behavior wyjaśniony w komentarzach

### Krok 7: Integration testing (opcjonalne dla MVP)

**Cel:** Zautomatyzować test cases z kroku 4.

**Framework:** Vitest + Supertest (lub podobne)

**Przykładowy test:**
```typescript
// tests/api/flashcards/delete.test.ts
import { describe, it, expect } from 'vitest';

describe('DELETE /api/flashcards/{id}', () => {
  it('should delete own flashcard and return 204', async () => {
    // Arrange: Create flashcard
    const flashcard = await createTestFlashcard(testUser);
    
    // Act: Delete flashcard
    const response = await deleteFlashcard(flashcard.id, testUserToken);
    
    // Assert
    expect(response.status).toBe(204);
    expect(response.body).toBeUndefined();
    
    // Verify deletion in database
    const deleted = await getFlashcard(flashcard.id);
    expect(deleted).toBeNull();
  });

  it('should return 404 when deleting non-existent flashcard', async () => {
    const response = await deleteFlashcard(999999, testUserToken);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
  });

  // ... więcej test cases
});
```

**Uwaga:** To jest opcjonalne dla MVP, ale zalecane dla produkcji.

### Krok 8: Deployment checklist

#### 8.1. Pre-deployment

- [ ] Wszystkie testy przechodzą
- [ ] Linting i type checking bez błędów
- [ ] Code review zakończony
- [ ] Database migrations deployed (RLS policies exist)
- [ ] Environment variables configured (Supabase URL, anon key)

#### 8.2. Deployment

```bash
# Build aplikacji
npm run build

# Deploy (metoda zależy od hostingu)
# DigitalOcean: Docker image push
# Vercel: git push
# Netlify: git push
```

#### 8.3. Post-deployment verification

**Smoke tests na produkcji:**
```bash
# Test 1: Health check (jeśli istnieje)
curl https://your-domain.com/api/health

# Test 2: DELETE with valid token
curl -X DELETE https://your-domain.com/api/flashcards/{test_id} \
  -H "Authorization: Bearer PROD_TOKEN"

# Expected: 204 or 404 (depending on if flashcard exists)
```

**Monitoring:**
- [ ] Check error logs (no 500 errors)
- [ ] Check response times (< 200ms p95)
- [ ] Verify RLS policies active on production database
- [ ] Test from different client (browser, Postman)

#### 8.4. Rollback plan

**If deployment fails:**
1. Revert to previous build/commit
2. Verify previous version still works
3. Debug issue in staging environment
4. Re-deploy when fixed

**Database rollback (unlikely needed for DELETE endpoint):**
- DELETE endpoint doesn't modify schema
- No migrations to rollback
- If RLS policies broken, re-run migration

### Krok 9: Monitoring & maintenance

#### 9.1. Setup monitoring (post-MVP)

**Metrics to track:**
- DELETE request rate
- Error rate by status code (400/401/404/500)
- Response time percentiles (p50, p95, p99)
- Failed authentication attempts (401s)

**Tools:**
- Supabase Dashboard (database metrics)
- Application logs (console.error outputs)
- Future: Sentry, Datadog, or similar APM

#### 9.2. Alerting rules

**Critical alerts:**
- 500 error rate > 5%
- Response time p95 > 1 second
- Authentication failure rate > 20%

**Warning alerts:**
- 404 rate significantly above baseline (possible enumeration attack)
- Spike in DELETE requests (possible abuse)

#### 9.3. Maintenance tasks

**Weekly:**
- Review error logs for patterns
- Check response time trends
- Verify no security incidents

**Monthly:**
- Review and optimize slow queries (if any)
- Update dependencies
- Review and prune old logs

---

## Summary

Ten plan wdrożenia zapewnia kompleksowe wskazówki dla implementacji endpointu `DELETE /api/flashcards/{id}`. Kluczowe punkty:

1. **Bezpieczeństwo:** RLS policies + JWT authentication + generic error messages
2. **Wydajność:** Optymalna (single PK lookup, no additional indexes needed)
3. **Spójność:** Consistent z istniejącymi endpointami (POST, PUT)
4. **Jakość:** Szczegółowe komentarze, proper error handling, type safety

**Szacowany czas implementacji:** 1-2 godziny dla doświadczonego developera (włączając testing).

**Dependencies:**
- ✅ FlashcardService już istnieje (wymaga modyfikacji)
- ✅ Supabase client configured
- ✅ RLS policies deployed
- ✅ ErrorResponse type defined

**Next steps after implementation:**
1. Implement GET /api/flashcards (list endpoint) - jeszcze TODO
2. Add rate limiting middleware
3. Setup comprehensive monitoring
4. Consider soft deletes for recovery feature

