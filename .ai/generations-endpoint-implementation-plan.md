# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generations` jest odpowiedzialny za generowanie propozycji fiszek z tekstu źródłowego przy użyciu sztucznej inteligencji (OpenRouter API). Główne cele endpointu to:

- Walidacja tekstu źródłowego dostarczonego przez użytkownika
- Wywołanie API OpenRouter z trybem prywatności
- Wygenerowanie dokładnie 12 propozycji fiszek w formacie "Pojęcie" - "Definicja"
- Utworzenie rekordu generacji w bazie danych w celu śledzenia metryk
- Zwrócenie propozycji do użytkownika bez zapisywania ich jako fiszek (zapisywane dopiero po akceptacji)
- Logowanie błędów do tabeli `generation_error_logs` w przypadku niepowodzenia

Endpoint jest kluczowy dla MVP, ponieważ umożliwia realizację głównej wartości produktu - szybkie tworzenie wysokiej jakości fiszek przy pomocy AI.

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
POST /api/generations
```

### Nagłówki żądania
| Nagłówek | Typ | Wymagany | Opis |
|:---------|:----|:---------|:-----|
| `Authorization` | string | Tak | Bearer token JWT z Supabase Auth |
| `Content-Type` | string | Tak | `application/json` |

### Parametry
**Wymagane:**
- `source_text` (string) - tekst źródłowy do wygenerowania fiszek, długość 100-1000 znaków

**Opcjonalne:**
- Brak

### Request Body
```typescript
{
  source_text: string; // 100-1000 characters
}
```

**Przykład:**
```json
{
  "source_text": "Mitochondria are organelles found in most eukaryotic cells. They are often called the powerhouse of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy. Mitochondria have a double membrane structure..."
}
```

## 3. Wykorzystywane typy

### DTOs i Command Models

**Input:**
- `CreateGenerationCommand` - Command model do walidacji żądania
  ```typescript
  interface CreateGenerationCommand {
    source_text: string;
  }
  ```

**Output:**
- `GenerateFlashcardsResponse` - Struktura odpowiedzi z danymi generacji
  ```typescript
  interface GenerateFlashcardsResponse {
    generation_id: number;
    model: string;
    generated_count: number;
    generation_duration: number;
    proposals: GenerationProposalDTO[];
  }
  ```

- `GenerationProposalDTO` - Pojedyncza propozycja fiszki
  ```typescript
  interface GenerationProposalDTO {
    front: string;
    back: string;
  }
  ```

- `GenerateResponse` - Wrapper dla odpowiedzi
  ```typescript
  type GenerateResponse = SingleItemResponse<GenerateFlashcardsResponse>;
  ```

**Database:**
- `GenerationInsert` - Typ do wstawiania rekordu generacji
- `GenerationErrorLogInsert` - Typ do logowania błędów

**Error:**
- `ErrorResponse` - Standardowa struktura błędu
  ```typescript
  interface ErrorResponse {
    error: string;
    message: string;
    details?: Record<string, string | string[]>;
  }
  ```

### Zod Schema dla walidacji

Należy stworzyć schema Zod w pliku walidacji:

```typescript
const createGenerationSchema = z.object({
  source_text: z.string()
    .trim()
    .min(100, 'Source text must be at least 100 characters long')
    .max(1000, 'Source text must not exceed 1000 characters')
});
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "data": {
    "generation_id": 42,
    "model": "anthropic/claude-3-haiku",
    "generated_count": 12,
    "generation_duration": 3245,
    "proposals": [
      {
        "front": "Mitochondria",
        "back": "Organelles found in most eukaryotic cells, often called the powerhouse of the cell"
      },
      {
        "front": "ATP",
        "back": "Adenosine triphosphate - the main source of chemical energy in cells"
      }
      // ... 10 more proposals
    ]
  }
}
```

### Kody statusu

| Kod | Znaczenie | Scenariusz |
|:----|:----------|:-----------|
| 201 | Created | Pomyślnie wygenerowano propozycje fiszek |
| 400 | Bad Request | Nieprawidłowy format body żądania (nie JSON, brak wymaganych pól) |
| 401 | Unauthorized | Brak lub nieprawidłowy token JWT |
| 422 | Unprocessable Entity | Błąd walidacji - źródłowy tekst nie spełnia wymagań długości |
| 500 | Internal Server Error | Nieoczekiwany błąd serwera |
| 503 | Service Unavailable | Usługa OpenRouter jest niedostępna lub zwróciła błąd |

### Struktury błędów

**400 Bad Request:**
```json
{
  "error": "Bad request",
  "message": "Invalid request body"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**422 Validation Error:**
```json
{
  "error": "Validation error",
  "message": "Source text must be between 100 and 1000 characters",
  "details": {
    "source_text": "Length must be 100-1000 characters"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**503 Service Unavailable:**
```json
{
  "error": "Service unavailable",
  "message": "AI generation service is currently unavailable. Please try again later."
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Request Przyjęcie
   ├─> Middleware: Uwierzytelnienie użytkownika (Supabase Auth)
   └─> Walidacja Authorization header

2. Walidacja Input
   ├─> Parse JSON body
   ├─> Walidacja Zod schema
   └─> Trim i sprawdzenie długości source_text (100-1000 chars)

3. Przygotowanie danych
   ├─> Obliczenie SHA-256 hash tekstu źródłowego
   └─> Zapisanie długości tekstu źródłowego

4. Wywołanie OpenRouter API
   ├─> Uruchomienie timera
   ├─> Wysłanie request do OpenRouter
   │   ├─> Model: anthropic/claude-3-haiku (lub inny skonfigurowany)
   │   ├─> Privacy mode: enabled
   │   └─> Prompt: Wygeneruj dokładnie 12 fiszek
   ├─> Odebranie odpowiedzi
   └─> Zatrzymanie timera (generation_duration)

5. Zapisanie metryki w bazie danych
   ├─> Utworzenie rekordu w tabeli 'generations'
   │   ├─> user_id: z auth.uid()
   │   ├─> model: nazwa użytego modelu
   │   ├─> generated_count: 12
   │   ├─> source_text_hash: obliczony hash
   │   ├─> source_text_length: długość tekstu
   │   └─> generation_duration: czas w milisekundach
   └─> Otrzymanie generation_id

6. Response Formatting
   ├─> Mapowanie odpowiedzi OpenRouter na GenerationProposalDTO[]
   ├─> Utworzenie GenerateFlashcardsResponse
   └─> Opakowanie w SingleItemResponse wrapper

7. Zwrócenie odpowiedzi (201 Created)

--- W przypadku błędu ---

Error Handling:
   ├─> Błąd walidacji → 422 + details
   ├─> Błąd OpenRouter API → 503 + log do generation_error_logs
   ├─> Błąd bazy danych → 500 + log do generation_error_logs
   └─> Inne błędy → 500 + log do generation_error_logs
```

### Interakcje z zewnętrznymi systemami

**Supabase:**
- Tabela `generations` - zapis metryki generacji
- Tabela `generation_error_logs` - logowanie błędów
- `auth.users` - pobranie user_id przez `auth.uid()`

**OpenRouter API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Headers:
  - `Authorization: Bearer ${OPENROUTER_API_KEY}`
  - `HTTP-Referer: ${SITE_URL}`
  - `X-Title: 10x Cards`
- Body:
  ```json
  {
    "model": "anthropic/claude-3-haiku",
    "messages": [
      {
        "role": "system",
        "content": "You are a flashcard generation assistant..."
      },
      {
        "role": "user",
        "content": "<source_text>"
      }
    ]
  }
  ```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- **Wymagane:** Bearer token JWT w nagłówku `Authorization`
- **Mechanizm:** Middleware Astro sprawdza token przez `context.locals.supabase.auth.getUser()`
- **Akcja przy braku/nieprawidłowym tokenie:** Zwrot 401 Unauthorized

### Autoryzacja
- Użytkownik może generować fiszki tylko dla samego siebie
- `user_id` w rekordzie `generations` pochodzi z `auth.uid()`, nie z request body
- Brak możliwości generowania fiszek dla innych użytkowników

### Walidacja danych wejściowych
- **Walidacja długości tekstu:** 100-1000 znaków (po trim)
- **Sanityzacja:** Użycie `.trim()` przed walidacją i zapisem
- **Format:** Sprawdzenie czy request body jest prawidłowym JSON
- **SQL Injection:** Ochrona przez Supabase parametrized queries
- **XSS:** Nie dotyczy (API endpoint, nie renderowanie HTML)

### Ochrona danych osobowych (RODO)
- **Nie przechowujemy pełnego tekstu źródłowego** - tylko SHA-256 hash i długość
- Hash pozwala na analizę duplikatów bez naruszania prywatności
- Privacy mode w OpenRouter - dane nie są wykorzystywane do treningu modeli

### Rate Limiting
- **MVP:** Brak twardych limitów (zgodnie z PRD)
- **Przyszłość:** Należy rozważyć implementację limitów per użytkownik/IP
- **Monitoring:** Śledzenie liczby generacji per user_id w tabeli `generations`

### Bezpieczeństwo API Key
- **OpenRouter API Key:** Przechowywany w zmiennych środowiskowych (`OPENROUTER_API_KEY`)
- **Nigdy nie ekspozycja klucza** w response ani w logach
- **Dostęp:** Tylko backend ma dostęp do klucza

### CORS
- Konfiguracja CORS w Astro dla dozwolonych origin
- Ograniczenie do domeny aplikacji w produkcji

## 7. Obsługa błędów

### Scenariusze błędów

#### 1. Brak lub nieprawidłowy token JWT (401)
**Przyczyna:**
- Brak nagłówka `Authorization`
- Nieprawidłowy format tokenu
- Token wygasł
- Token jest nieprawidłowy

**Obsługa:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    }),
    { status: 401 }
  );
}
```

**Logowanie:** Brak (błąd użytkownika, nie systemowy)

#### 2. Nieprawidłowy format body (400)
**Przyczyna:**
- Body nie jest prawidłowym JSON
- Brak wymaganego pola `source_text`

**Obsługa:**
```typescript
try {
  const body = await request.json();
} catch (error) {
  return new Response(
    JSON.stringify({
      error: 'Bad request',
      message: 'Invalid request body'
    }),
    { status: 400 }
  );
}
```

**Logowanie:** Brak (błąd użytkownika)

#### 3. Błąd walidacji tekstu źródłowego (422)
**Przyczyna:**
- Tekst krótszy niż 100 znaków
- Tekst dłuższy niż 1000 znaków

**Obsługa:**
```typescript
const validation = createGenerationSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: 'Validation error',
      message: validation.error.errors[0].message,
      details: {
        source_text: validation.error.errors.map(e => e.message)
      }
    }),
    { status: 422 }
  );
}
```

**Logowanie:** Brak (błąd użytkownika)

#### 4. Błąd OpenRouter API (503)
**Przyczyna:**
- OpenRouter API jest niedostępny (timeout, 5xx)
- Rate limit OpenRouter został przekroczony
- Błąd sieci

**Obsługa:**
```typescript
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    // ... config
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }
} catch (error) {
  // Log to generation_error_logs
  await logGenerationError({
    user_id: user.id,
    model: selectedModel,
    source_text_hash: sourceTextHash,
    source_text_length: sourceText.length,
    error_code: error.code || 'OPENROUTER_ERROR',
    error_message: error.message
  });
  
  return new Response(
    JSON.stringify({
      error: 'Service unavailable',
      message: 'AI generation service is currently unavailable. Please try again later.'
    }),
    { status: 503 }
  );
}
```

**Logowanie:** **TAK** - do tabeli `generation_error_logs`

#### 5. Błąd parsowania odpowiedzi OpenRouter (500)
**Przyczyna:**
- OpenRouter zwrócił nieprawidłową strukturę
- Brak oczekiwanych pól w odpowiedzi
- Model nie wygenerował 12 fiszek

**Obsługa:**
```typescript
try {
  const data = await response.json();
  const proposals = parseProposals(data); // może rzucić błąd
  
  if (proposals.length !== 12) {
    throw new Error('Expected 12 proposals, got ' + proposals.length);
  }
} catch (error) {
  // Log to generation_error_logs
  await logGenerationError({
    user_id: user.id,
    model: selectedModel,
    source_text_hash: sourceTextHash,
    source_text_length: sourceText.length,
    error_code: 'PARSE_ERROR',
    error_message: error.message
  });
  
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500 }
  );
}
```

**Logowanie:** **TAK** - do tabeli `generation_error_logs`

#### 6. Błąd zapisu do bazy danych (500)
**Przyczyna:**
- Błąd połączenia z Supabase
- Naruszenie ograniczeń bazy danych
- Timeout bazy danych

**Obsługa:**
```typescript
const { data, error } = await supabase
  .from('generations')
  .insert(generationRecord)
  .select()
  .single();

if (error) {
  // Log to generation_error_logs (try-catch, jeśli to też nie zadziała - console.error)
  try {
    await logGenerationError({
      user_id: user.id,
      model: selectedModel,
      source_text_hash: sourceTextHash,
      source_text_length: sourceText.length,
      error_code: 'DATABASE_ERROR',
      error_message: error.message
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
  
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500 }
  );
}
```

**Logowanie:** **TAK** - do tabeli `generation_error_logs` (jeśli możliwe)

### Struktura logowania błędów

Funkcja pomocnicza do logowania błędów:

```typescript
async function logGenerationError(
  supabase: SupabaseClient,
  errorData: {
    user_id: string | null;
    model?: string;
    source_text_hash?: string;
    source_text_length?: number;
    error_code?: string;
    error_message: string;
  }
): Promise<void> {
  try {
    await supabase
      .from('generation_error_logs')
      .insert({
        user_id: errorData.user_id,
        model: errorData.model || null,
        source_text_hash: errorData.source_text_hash || null,
        source_text_length: errorData.source_text_length || null,
        error_code: errorData.error_code || null,
        error_message: errorData.error_message
      });
  } catch (error) {
    // Jeśli logowanie nie uda się, tylko console.error
    console.error('Failed to log generation error:', error);
  }
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Czas odpowiedzi OpenRouter API
**Problem:** Wywołanie API OpenRouter może trwać 2-5 sekund lub dłużej
**Mitigacja:**
- Wybranie szybkiego modelu (np. `claude-3-haiku` zamiast `claude-3-opus`)
- Implementacja timeout (np. 30 sekund)
- Wyświetlanie loadera w UI

#### 2. Limity rate OpenRouter
**Problem:** Przekroczenie limitów może zablokować generowanie
**Mitigacja:**
- Monitorowanie użycia przez metryki w tabeli `generations`
- Ustawienie limitów finansowych w OpenRouter dashboard
- Przyszła implementacja queue dla requestów

#### 3. Zapis do bazy danych
**Problem:** Każde wywołanie tworzy rekord w `generations`
**Mitigacja:**
- Indeks na `user_id` już zdefiniowany w schemacie
- Pojedyncza operacja INSERT jest szybka
- Rozważenie batch insert w przyszłości (jeśli będą dodatkowe zapisy)

#### 4. Hash calculation (SHA-256)
**Problem:** Obliczanie hash może być kosztowne dla długich tekstów
**Mitigacja:**
- Maksymalna długość tekstu to 1000 znaków (niewielka)
- SHA-256 jest szybki dla małych inputów
- Używanie natywnego `crypto` API Node.js

### Strategie optymalizacji

#### Caching
- **MVP:** Brak cachowania (każde wywołanie generuje świeże propozycje)
- **Przyszłość:** Rozważenie cachowania na podstawie `source_text_hash`
  - Jeśli ten sam hash istnieje w ciągu ostatnich X godzin, zwróć cached results
  - Wymaga dodania kolumny do przechowywania cache

#### Connection Pooling
- Supabase SDK automatycznie zarządza connection pooling
- Brak potrzeby dodatkowej konfiguracji w MVP

#### Timeout Configuration
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  signal: controller.signal,
  // ... rest of config
});

clearTimeout(timeoutId);
```

#### Monitoring wydajności
- Śledzenie `generation_duration` w tabeli `generations`
- Alerty jeśli średni czas > 10 sekund
- Dashboard z metrykami OpenRouter API

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury

#### 1.1. Utworzenie pliku service dla OpenRouter
**Lokalizacja:** `src/lib/services/openrouter.service.ts`

**Zawartość:**
```typescript
export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  siteUrl: string;
  appName: string;
}

export interface GenerateFlashcardsRequest {
  sourceText: string;
  count: number;
}

export interface FlashcardProposal {
  front: string;
  back: string;
}

export class OpenRouterService {
  constructor(private config: OpenRouterConfig) {}
  
  async generateFlashcards(
    request: GenerateFlashcardsRequest
  ): Promise<FlashcardProposal[]> {
    // Implementacja
  }
}
```

**Odpowiedzialność:**
- Wywołanie OpenRouter API
- Formatowanie promptu
- Parsowanie odpowiedzi
- Error handling dla błędów API

#### 1.2. Utworzenie pliku service dla generacji
**Lokalizacja:** `src/lib/services/generation.service.ts`

**Zawartość:**
```typescript
export class GenerationService {
  constructor(private supabase: SupabaseClient<Database>) {}
  
  async createGeneration(data: GenerationInsert): Promise<GenerationEntity> {
    // Zapis do tabeli generations
  }
  
  async logError(error: GenerationErrorLogInsert): Promise<void> {
    // Zapis do tabeli generation_error_logs
  }
}
```

**Odpowiedzialność:**
- Operacje CRUD na tabeli `generations`
- Logowanie błędów do `generation_error_logs`

#### 1.3. Utworzenie pliku utility dla hashowania
**Lokalizacja:** `src/lib/utils/hash.ts`

**Zawartość:**
```typescript
import crypto from 'crypto';

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
```

#### 1.4. Utworzenie schema walidacji
**Lokalizacja:** `src/lib/validation/generation.validation.ts`

**Zawartość:**
```typescript
import { z } from 'zod';

export const createGenerationSchema = z.object({
  source_text: z.string()
    .trim()
    .min(100, 'Source text must be at least 100 characters long')
    .max(1000, 'Source text must not exceed 1000 characters')
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
```

#### 1.5. Dodanie zmiennych środowiskowych
**Lokalizacja:** `.env` (local) i deployment environment

**Zmienne:**
```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3-haiku
SITE_URL=http://localhost:4321
```

**Aktualizacja:** `src/env.d.ts`
```typescript
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly SITE_URL: string;
}
```

### Faza 2: Implementacja endpoint

#### 2.1. Utworzenie pliku endpoint
**Lokalizacja:** `src/pages/api/generations/index.ts`

**Struktura:**
```typescript
export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  // Implementacja
};
```

#### 2.2. Implementacja uwierzytelnienia
```typescript
// 1. Pobranie Supabase client z context.locals
const supabase = context.locals.supabase;

// 2. Weryfikacja tokena JWT
const { data: { user }, error: authError } = await supabase.auth.getUser();

// 3. Obsługa błędu uwierzytelnienia
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

#### 2.3. Implementacja parsowania i walidacji body
```typescript
// 1. Parse JSON body
let body: unknown;
try {
  body = await context.request.json();
} catch (error) {
  return new Response(
    JSON.stringify({
      error: 'Bad request',
      message: 'Invalid request body'
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// 2. Walidacja Zod
const validation = createGenerationSchema.safeParse(body);
if (!validation.success) {
  const firstError = validation.error.errors[0];
  return new Response(
    JSON.stringify({
      error: 'Validation error',
      message: firstError.message,
      details: {
        source_text: validation.error.errors.map(e => e.message)
      }
    }),
    { status: 422, headers: { 'Content-Type': 'application/json' } }
  );
}

const { source_text } = validation.data;
```

#### 2.4. Przygotowanie danych do generacji
```typescript
// 1. Hash tekstu źródłowego
const sourceTextHash = hashText(source_text);

// 2. Długość tekstu
const sourceTextLength = source_text.length;

// 3. Wybór modelu
const model = import.meta.env.OPENROUTER_MODEL;

// 4. Start timer
const startTime = Date.now();
```

#### 2.5. Wywołanie OpenRouter API
```typescript
// 1. Inicjalizacja service
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  model: model,
  siteUrl: import.meta.env.SITE_URL,
  appName: '10x Cards'
});

// 2. Wywołanie generacji
let proposals: FlashcardProposal[];
try {
  proposals = await openRouterService.generateFlashcards({
    sourceText: source_text,
    count: 12
  });
} catch (error) {
  // Stop timer
  const duration = Date.now() - startTime;
  
  // Log error
  const generationService = new GenerationService(supabase);
  await generationService.logError({
    user_id: user.id,
    model: model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: error.code || 'OPENROUTER_ERROR',
    error_message: error.message
  });
  
  return new Response(
    JSON.stringify({
      error: 'Service unavailable',
      message: 'AI generation service is currently unavailable. Please try again later.'
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

// 3. Stop timer
const generationDuration = Date.now() - startTime;
```

#### 2.6. Zapis metryki do bazy danych
```typescript
const generationService = new GenerationService(supabase);

let generation: GenerationEntity;
try {
  generation = await generationService.createGeneration({
    user_id: user.id,
    model: model,
    generated_count: proposals.length,
    accepted_unedited_count: null,
    accepted_edited_count: null,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    generation_duration: generationDuration
  });
} catch (error) {
  // Log error
  await generationService.logError({
    user_id: user.id,
    model: model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: 'DATABASE_ERROR',
    error_message: error.message
  });
  
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

#### 2.7. Formatowanie i zwrot odpowiedzi
```typescript
// 1. Mapowanie proposals na DTO
const proposalDTOs: GenerationProposalDTO[] = proposals.map(p => ({
  front: p.front,
  back: p.back
}));

// 2. Utworzenie response data
const responseData: GenerateFlashcardsResponse = {
  generation_id: generation.id,
  model: generation.model,
  generated_count: generation.generated_count,
  generation_duration: generation.generation_duration,
  proposals: proposalDTOs
};

// 3. Opakowanie w wrapper
const response: GenerateResponse = {
  data: responseData
};

// 4. Zwrot 201 Created
return new Response(
  JSON.stringify(response),
  { 
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  }
);
```

### Faza 3: Implementacja OpenRouter Service

#### 3.1. Utworzenie promptu systemowego
```typescript
private createSystemPrompt(): string {
  return `You are a flashcard generation assistant. Your task is to create high-quality flashcards from the provided text.

Rules:
1. Generate exactly 12 flashcards
2. Each flashcard should have:
   - Front: A concept, term, or question (max 200 characters)
   - Back: A definition, explanation, or answer (max 500 characters)
3. Focus on the most important concepts
4. Make flashcards clear and concise
5. Ensure each flashcard tests a single concept
6. Return ONLY valid JSON in this format:
{
  "flashcards": [
    {"front": "concept", "back": "definition"},
    ...
  ]
}`;
}
```

#### 3.2. Implementacja wywołania API
```typescript
async generateFlashcards(
  request: GenerateFlashcardsRequest
): Promise<FlashcardProposal[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.siteUrl,
        'X-Title': this.config.appName,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.createSystemPrompt()
          },
          {
            role: 'user',
            content: request.sourceText
          }
        ]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OpenRouter API returned ${response.status}`);
    }
    
    const data = await response.json();
    return this.parseResponse(data, request.count);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}
```

#### 3.3. Implementacja parsowania odpowiedzi
```typescript
private parseResponse(data: any, expectedCount: number): FlashcardProposal[] {
  // 1. Sprawdzenie struktury odpowiedzi
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid OpenRouter response structure');
  }
  
  // 2. Wyciągnięcie contentu
  const content = data.choices[0].message.content;
  
  // 3. Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('Failed to parse OpenRouter response as JSON');
  }
  
  // 4. Walidacja struktury
  if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
    throw new Error('Invalid flashcards structure in response');
  }
  
  // 5. Mapowanie i walidacja każdej fiszki
  const proposals: FlashcardProposal[] = parsed.flashcards.map((card: any) => {
    if (!card.front || !card.back) {
      throw new Error('Flashcard missing front or back');
    }
    
    return {
      front: String(card.front).trim().substring(0, 5000),
      back: String(card.back).trim().substring(0, 5000)
    };
  });
  
  // 6. Sprawdzenie liczby
  if (proposals.length !== expectedCount) {
    console.warn(`Expected ${expectedCount} flashcards, got ${proposals.length}`);
  }
  
  return proposals;
}
```

### Faza 4: Implementacja Generation Service

#### 4.1. Implementacja createGeneration
```typescript
async createGeneration(data: GenerationInsert): Promise<GenerationEntity> {
  const { data: generation, error } = await this.supabase
    .from('generations')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create generation: ${error.message}`);
  }
  
  return generation;
}
```

#### 4.2. Implementacja logError
```typescript
async logError(errorData: GenerationErrorLogInsert): Promise<void> {
  try {
    const { error } = await this.supabase
      .from('generation_error_logs')
      .insert(errorData);
    
    if (error) {
      console.error('Failed to log generation error:', error);
    }
  } catch (error) {
    // Silent fail - nie chcemy rzucać błędem przy logowaniu błędu
    console.error('Exception while logging error:', error);
  }
}
```

### Faza 5: Testowanie

#### 5.1. Testy manualne
- [ ] Test z prawidłowym tekstem (100-1000 znaków)
- [ ] Test z tekstem za krótkim (<100 znaków) → 422
- [ ] Test z tekstem za długim (>1000 znaków) → 422
- [ ] Test bez tokena JWT → 401
- [ ] Test z nieprawidłowym tokenem → 401
- [ ] Test z nieprawidłowym JSON body → 400
- [ ] Test timeout OpenRouter (mock long response)
- [ ] Test błędu OpenRouter API (mock 500)
- [ ] Test parsowania nieprawidłowej odpowiedzi OpenRouter

#### 5.2. Weryfikacja bazy danych
- [ ] Sprawdzenie czy rekord w `generations` jest tworzony
- [ ] Sprawdzenie czy `generation_id` jest zwracany
- [ ] Sprawdzenie czy błędy są logowane do `generation_error_logs`
- [ ] Sprawdzenie czy hash i długość tekstu są poprawnie zapisywane

#### 5.3. Weryfikacja metryk
- [ ] Sprawdzenie czy `generation_duration` jest w rozsądnym zakresie (2-10s)
- [ ] Sprawdzenie czy `generated_count` = 12
- [ ] Sprawdzenie czy `model` jest poprawnie zapisany

#### 5.4. Testowanie wydajności
- [ ] Zmierzenie średniego czasu odpowiedzi (cel: <10s)
- [ ] Test z wieloma równoczesnymi requestami
- [ ] Monitoring zużycia pamięci

### Faza 6: Dokumentacja i deployment

#### 6.1. Dokumentacja
- [ ] Aktualizacja README z instrukcjami konfiguracji zmiennych środowiskowych
- [ ] Dodanie przykładów użycia endpoint w dokumentacji API
- [ ] Dokumentacja error codes i ich znaczenia

#### 6.2. Deployment checklist
- [ ] Ustawienie zmiennych środowiskowych w production
- [ ] Weryfikacja limitów finansowych w OpenRouter
- [ ] Konfiguracja CORS dla production domain
- [ ] Włączenie monitoringu błędów (Sentry lub podobne)
- [ ] Konfiguracja alertów dla wysokiego czasu odpowiedzi

#### 6.3. Monitoring post-deployment
- [ ] Dashboard z metrykami generacji
- [ ] Alerty dla wskaźnika błędów >5%
- [ ] Monitoring kosztów OpenRouter API
- [ ] Analiza najpopularniejszych modeli i czasów odpowiedzi

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowe wdrożenie endpointu `POST /api/generations` zgodnie ze specyfikacją API, wymaganiami bezpieczeństwa i najlepszymi praktykami. Kluczowe punkty:

1. **Bezpieczeństwo:** Pełna walidacja input, uwierzytelnienie JWT, brak przechowywania pełnego tekstu źródłowego
2. **Niezawodność:** Obsługa wszystkich scenariuszy błędów, logowanie do bazy danych, timeout protection
3. **Metryki:** Śledzenie wszystkich kluczowych metryk dla analizy MVP
4. **Wydajność:** Wybór szybkiego modelu, timeout configuration, monitoring
5. **Maintainability:** Wydzielenie logiki do services, czyste separowanie odpowiedzialności

Implementacja powinna zająć około 1-2 dni roboczych dla doświadczonego developera.

