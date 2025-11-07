# API Endpoint Implementation Plan: List Flashcards

## 1. Endpoint Overview

**Endpoint:** `GET /api/flashcards`

**Purpose:**  
Retrieve a paginated list of flashcards belonging to the authenticated user with support for filtering, searching, and sorting.

**Key Features:**
- Pagination with configurable page size (default 30, max 100 items per page)
- Full-text search across front and back fields
- Filtering by flashcard source (manual or AI-generated)
- Sortable by creation date or last update date
- Ascending or descending order
- Returns comprehensive pagination metadata

**User Story:** As an authenticated user, I want to view my flashcards in a paginated list, search through them, filter by source, and sort them by date, so I can efficiently browse and manage my collection.

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/flashcards?page={page}&limit={limit}&search={search}&source={source}&sort={sort}&order={order}
```

### Authentication
- **Required:** Yes
- **Type:** JWT Bearer Token
- **Header:** `Authorization: Bearer <jwt_token>`
- **Validation:** Token validated via `supabase.auth.getUser()`

### Query Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|:----------|:-----|:---------|:--------|:------------|:------------|
| `page` | integer | No | 1 | >= 1 | Page number (1-indexed) for pagination |
| `limit` | integer | No | 30 | 1-100 | Number of items per page |
| `search` | string | No | - | max 500 chars | Full-text search term for front/back fields |
| `source` | string | No | - | 'manual' or 'ai' | Filter by flashcard source |
| `sort` | string | No | 'created_at' | 'created_at' or 'updated_at' | Field to sort by |
| `order` | string | No | 'desc' | 'asc' or 'desc' | Sort order |

### Request Body
None (GET request)

### Request Examples

**Basic request (defaults):**
```http
GET /api/flashcards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Search with pagination:**
```http
GET /api/flashcards?search=mitochondria&page=2&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Filter AI flashcards, sort by update date:**
```http
GET /api/flashcards?source=ai&sort=updated_at&order=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Types Used

### DTOs (from `src/types.ts`)

**Input:**
```typescript
// Query parameters
export interface FlashcardListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: "manual" | "ai";
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
}
```

**Output:**
```typescript
// Single flashcard in list
export type FlashcardListItemDTO = Omit<Tables<"flashcards">, "user_id">;

// Pagination metadata
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Final response type
export type FlashcardListResponse = PaginatedResponse<FlashcardListItemDTO>;
```

**Error:**
```typescript
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string | string[]>;
}
```

### Validation Schema (to be created in `src/lib/validation/flashcard.validation.ts`)

```typescript
export const flashcardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  search: z.string().max(500).optional(),
  source: z.enum(["manual", "ai"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type FlashcardListQueryInput = z.infer<typeof flashcardListQuerySchema>;
```

### Service Method (to be added to `src/lib/services/flashcard.service.ts`)

```typescript
/**
 * Result type for listFlashcards method
 */
interface ListFlashcardsResult {
  flashcards: FlashcardDTO[];
  total: number;
}

/**
 * Lists flashcards with pagination, filtering, searching, and sorting
 */
async listFlashcards(
  userId: string,
  params: FlashcardListQueryInput
): Promise<ListFlashcardsResult>
```

---

## 4. Response Details

### Success Response (200 OK)

**Structure:**
```json
{
  "data": [
    {
      "id": 123,
      "front": "What is mitochondria?",
      "back": "The powerhouse of the cell",
      "source": "ai",
      "generation_id": 42,
      "created_at": "2025-11-04T12:34:56.789Z",
      "updated_at": "2025-11-04T12:34:56.789Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 125,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

**Headers:**
```
Content-Type: application/json
```

### Error Responses

#### 401 Unauthorized
**When:** Missing, invalid, or expired JWT token

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### 422 Unprocessable Entity
**When:** Invalid query parameters

```json
{
  "error": "Validation error",
  "message": "Invalid query parameters",
  "details": {
    "page": ["Number must be greater than or equal to 1"],
    "limit": ["Number must be less than or equal to 100"]
  }
}
```

#### 500 Internal Server Error
**When:** Unexpected server error (database failure, etc.)

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Data Flow

### Flow Diagram

```
1. Client Request
   ↓
2. Astro API Route Handler (GET)
   ↓
3. Authentication Check
   - Extract JWT from Authorization header
   - Validate via supabase.auth.getUser()
   - Get user.id for RLS
   ↓
4. Parse & Validate Query Parameters
   - Extract from context.url.searchParams
   - Validate with flashcardListQuerySchema (Zod)
   - Apply defaults (page=1, limit=30, sort=created_at, order=desc)
   ↓
5. FlashcardService.listFlashcards()
   ↓
6. Supabase Query Construction
   - Base query: from("flashcards").select("*", { count: "exact" })
   - RLS automatically filters by user_id = auth.uid()
   - If search: .or(`front.ilike.%${search}%,back.ilike.%${search}%`)
   - If source: .eq("source", source)
   - Sorting: .order(sort, { ascending: order === "asc" })
   - Pagination: .range(offset, offset + limit - 1)
   ↓
7. Database Execution
   - PostgreSQL executes query with RLS policies
   - Returns flashcards array + total count
   ↓
8. Transform Data
   - Remove user_id from each flashcard (security)
   - Calculate pagination metadata:
     * total_pages = Math.ceil(total / limit)
     * has_next = page < total_pages
     * has_prev = page > 1
   ↓
9. Format Response
   - Wrap in PaginatedResponse structure
   - Return 200 OK with JSON
```

### Database Interaction

**Query Pattern (Supabase Client API):**
```typescript
// Base query with count
let query = supabase
  .from("flashcards")
  .select("*", { count: "exact" });

// Search (if provided)
if (params.search) {
  const searchPattern = `%${params.search}%`;
  query = query.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
}

// Filter by source (if provided)
if (params.source) {
  query = query.eq("source", params.source);
}

// Sorting
query = query.order(params.sort, { ascending: params.order === "asc" });

// Pagination
const offset = (params.page - 1) * params.limit;
query = query.range(offset, offset + params.limit - 1);

// Execute
const { data, count, error } = await query;
```

**RLS Policy Applied:**
- Automatic filtering: `WHERE user_id = auth.uid()`
- User only sees their own flashcards

**Indexes Used:**
- `idx_flashcards_user_id` - filtering by user
- `idx_flashcards_created_at` - sorting by created_at
- `idx_flashcards_source` - filtering by source
- `idx_flashcards_front_back_gin` - full-text search (when search param used)
- `idx_flashcards_user_created` - composite index for common queries

---

## 6. Security Considerations

### Authentication & Authorization

1. **JWT Validation:**
   - Token extracted from `Authorization: Bearer <token>` header
   - Validated via `context.locals.supabase.auth.getUser()`
   - Expired tokens automatically rejected
   - User ID extracted from validated session

2. **Row-Level Security (RLS):**
   - Database-level enforcement: `auth.uid() = user_id`
   - Users can only access their own flashcards
   - No ability to bypass via query manipulation

3. **Data Sanitization:**
   - All query parameters validated through Zod schema
   - Type coercion prevents type confusion attacks
   - String length limits prevent buffer overflow

### Input Validation

1. **Query Parameter Validation:**
   - `page`: Must be positive integer (>= 1)
   - `limit`: Must be 1-100 (prevents DoS via large page sizes)
   - `search`: Max 500 characters (prevents performance degradation)
   - `source`: Enum validation (prevents SQL injection)
   - `sort`: Enum validation (prevents SQL injection)
   - `order`: Enum validation (prevents SQL injection)

2. **SQL Injection Prevention:**
   - All queries via Supabase client (parameterized queries)
   - Enum fields validated before database query
   - Search terms properly escaped by Supabase client

3. **NoSQL Injection Prevention:**
   - Not applicable (using PostgreSQL via Supabase)

### Data Privacy

1. **User ID Exclusion:**
   - `user_id` removed from all returned flashcards
   - Prevents exposure of internal user identifiers

2. **Error Message Sanitization:**
   - Generic error messages for 500 errors
   - No stack traces or database errors exposed to client
   - Detailed errors logged server-side only

### Rate Limiting & DoS Prevention

1. **Pagination Limits:**
   - Maximum 100 items per page
   - Prevents memory exhaustion
   - Prevents bandwidth abuse

2. **Search Query Limits:**
   - Maximum 500 characters for search term
   - Prevents expensive regex operations
   - Indexes optimize search performance

### CORS & Content-Type

1. **Content-Type:** Always `application/json`
2. **CORS:** Handled by Astro middleware (if configured)

---

## 7. Error Handling

### Error Categories & Responses

| Error Type | HTTP Code | Error Field | Message | When Occurs |
|:-----------|:----------|:------------|:--------|:------------|
| Authentication Failure | 401 | "Unauthorized" | "Invalid or missing authentication token" | No token, invalid token, expired token |
| Validation Error | 422 | "Validation error" | "Invalid query parameters" | page < 1, limit > 100, invalid enum values |
| Database Error | 500 | "Internal server error" | "An unexpected error occurred" | Supabase connection failure, query timeout |
| Unexpected Error | 500 | "Internal server error" | "An unexpected error occurred" | Any unhandled exception |

### Error Handling Strategy

1. **Guard Clauses (Early Returns):**
   ```typescript
   // Authentication check first
   if (authError || !user) {
     return new Response(JSON.stringify({...}), { status: 401 });
   }
   
   // Validation check second
   if (!validation.success) {
     return new Response(JSON.stringify({...}), { status: 422 });
   }
   ```

2. **Service Layer Error Propagation:**
   - Service throws descriptive errors
   - API route catches and maps to appropriate HTTP codes
   - Database errors wrapped in generic messages

3. **Logging Strategy:**
   ```typescript
   console.error("[GET /api/flashcards] Error:", {
     error: error instanceof Error ? error.message : String(error),
     stack: error instanceof Error ? error.stack : undefined,
     userId: user?.id,
     params: validatedParams,
     timestamp: new Date().toISOString(),
   });
   ```

4. **No Information Leakage:**
   - Never expose database structure
   - Never expose internal IDs (except flashcard IDs)
   - Never expose file paths or stack traces to client

### Specific Error Scenarios

**Scenario 1: Invalid page number**
```http
GET /api/flashcards?page=0
```
Response:
```json
{
  "error": "Validation error",
  "message": "Invalid query parameters",
  "details": {
    "page": ["Number must be greater than or equal to 1"]
  }
}
```

**Scenario 2: Limit too high**
```http
GET /api/flashcards?limit=200
```
Response:
```json
{
  "error": "Validation error",
  "message": "Invalid query parameters",
  "details": {
    "limit": ["Number must be less than or equal to 100"]
  }
}
```

**Scenario 3: Invalid source value**
```http
GET /api/flashcards?source=imported
```
Response:
```json
{
  "error": "Validation error",
  "message": "Invalid query parameters",
  "details": {
    "source": ["Invalid enum value. Expected 'manual' | 'ai'"]
  }
}
```

**Scenario 4: Database connection failure**
- Service throws error
- Caught in route handler
- Logged with full context
- Client receives generic 500 response

---

## 8. Performance Considerations

### Database Query Optimization

1. **Index Utilization:**
   - User filtering: `idx_flashcards_user_id` (BTREE)
   - Sorting by created_at: `idx_flashcards_created_at` (BTREE)
   - Sorting by updated_at: Uses updated_at field
   - Source filtering: `idx_flashcards_source` (BTREE)
   - Full-text search: `idx_flashcards_front_back_gin` (GIN)
   - Combined queries: `idx_flashcards_user_created` (composite)

2. **Query Complexity:**
   - Single query with filters, sorting, and pagination
   - Count query included in same request (`count: "exact"`)
   - Offset pagination (acceptable for MVP, consider cursor for scale)

3. **Pagination Strategy:**
   - Offset-based pagination (simple, adequate for MVP)
   - Default limit of 30 balances UX and performance
   - Maximum limit of 100 prevents abuse
   - Future consideration: Cursor-based pagination for better performance at high offsets

### Response Size Management

1. **Pagination Limits:**
   - Default 30 items per page
   - Maximum 100 items per page
   - Typical response size: ~3-5KB per flashcard × 30 = ~90-150KB

2. **Field Selection:**
   - Select only necessary fields (avoid large TEXT fields if not needed)
   - Current implementation: Select all fields (acceptable for MVP)

### Caching Strategy (Future Enhancement)

1. **Client-Side:**
   - HTTP Cache-Control headers (not implemented in MVP)
   - Consider ETags for conditional requests

2. **Server-Side:**
   - Consider Redis for frequently accessed lists
   - Cache invalidation on flashcard creation/update/delete

### Performance Metrics to Monitor

1. **Query Execution Time:**
   - Target: < 100ms for typical query (30 items)
   - Warning: > 500ms
   - Alert: > 1000ms

2. **Database Connection Pool:**
   - Monitor Supabase connection usage
   - Ensure proper connection cleanup

3. **Response Time:**
   - Target: < 200ms total (including network)
   - P95: < 500ms
   - P99: < 1000ms

### Potential Bottlenecks

1. **Full-Text Search:**
   - GIN index helps, but large result sets can be slow
   - Consider limiting search to first N characters if performance issues arise
   - Monitor query performance with `EXPLAIN ANALYZE`

2. **High Offset Pagination:**
   - OFFSET/LIMIT becomes slower with high offsets
   - Consider cursor-based pagination if users frequently access pages > 50

3. **Large User Collections:**
   - Users with 10,000+ flashcards may experience slower queries
   - Monitor and optimize if this becomes common

---

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File:** `src/lib/validation/flashcard.validation.ts`

**Action:** Add query parameter validation schema

```typescript
/**
 * Schema for flashcard list query parameters
 *
 * Validation rules:
 * - page: integer >= 1, default 1
 * - limit: integer 1-100, default 30
 * - search: max 500 characters
 * - source: 'manual' or 'ai'
 * - sort: 'created_at' or 'updated_at', default 'created_at'
 * - order: 'asc' or 'desc', default 'desc'
 *
 * Used in: GET /api/flashcards
 */
export const flashcardListQuerySchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: "Page must be a number",
    })
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  
  limit: z.coerce
    .number({
      invalid_type_error: "Limit must be a number",
    })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(30),
  
  search: z.string()
    .max(500, "Search term cannot exceed 500 characters")
    .optional(),
  
  source: z.enum(["manual", "ai"], {
    errorMap: () => ({ message: "Source must be 'manual' or 'ai'" }),
  }).optional(),
  
  sort: z.enum(["created_at", "updated_at"], {
    errorMap: () => ({ message: "Sort must be 'created_at' or 'updated_at'" }),
  }).default("created_at"),
  
  order: z.enum(["asc", "desc"], {
    errorMap: () => ({ message: "Order must be 'asc' or 'desc'" }),
  }).default("desc"),
});

/**
 * Inferred TypeScript type from flashcardListQuerySchema
 */
export type FlashcardListQueryInput = z.infer<typeof flashcardListQuerySchema>;
```

### Step 2: Add Service Method

**File:** `src/lib/services/flashcard.service.ts`

**Action:** Add `listFlashcards()` method to FlashcardService class

```typescript
/**
 * Result type for listFlashcards method
 */
interface ListFlashcardsResult {
  flashcards: FlashcardDTO[];
  total: number;
}

/**
 * Lists flashcards with pagination, filtering, searching, and sorting
 *
 * This method:
 * 1. Constructs Supabase query with filters, search, and sorting
 * 2. Applies RLS policy (automatic user_id filtering)
 * 3. Executes query with pagination (range)
 * 4. Returns flashcards array and total count
 *
 * @param userId - The ID of the authenticated user (for logging, RLS handles filtering)
 * @param params - Query parameters (validated)
 * @returns Object with flashcards array and total count
 * @throws Error if database operation fails
 *
 * @example
 * ```typescript
 * const service = new FlashcardService(supabase);
 * const result = await service.listFlashcards(user.id, {
 *   page: 1,
 *   limit: 30,
 *   search: "biology",
 *   source: "ai",
 *   sort: "created_at",
 *   order: "desc"
 * });
 * console.log(`Found ${result.total} flashcards`);
 * ```
 */
async listFlashcards(
  userId: string,
  params: FlashcardListQueryInput
): Promise<ListFlashcardsResult> {
  // Start building query with count
  let query = this.supabase
    .from("flashcards")
    .select("*", { count: "exact" });

  // Apply search filter (full-text search on front and back)
  if (params.search) {
    const searchPattern = `%${params.search}%`;
    query = query.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
  }

  // Apply source filter
  if (params.source) {
    query = query.eq("source", params.source);
  }

  // Apply sorting
  query = query.order(params.sort, { ascending: params.order === "asc" });

  // Apply pagination
  const offset = (params.page - 1) * params.limit;
  query = query.range(offset, offset + params.limit - 1);

  // Execute query
  const { data, count, error } = await query;

  // Handle database errors
  if (error) {
    throw new Error(`Failed to list flashcards: ${error.message}`);
  }

  // Transform data: remove user_id from all flashcards
  const flashcards = (data || []).map((flashcard) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...flashcardDTO } = flashcard;
    return flashcardDTO as FlashcardDTO;
  });

  // Return flashcards and total count
  return {
    flashcards,
    total: count || 0,
  };
}
```

### Step 3: Implement GET Handler in API Route

**File:** `src/pages/api/flashcards/index.ts`

**Action:** Add GET handler to existing file (currently has only POST)

```typescript
import type { FlashcardListResponse } from "@/types"; // Add to imports
import { flashcardListQuerySchema, type FlashcardListQueryInput } from "@/lib/validation/flashcard.validation"; // Add to imports

/**
 * GET /api/flashcards
 *
 * Lists flashcards with pagination, filtering, searching, and sorting.
 *
 * Query parameters:
 * - page: Page number (1-indexed, default 1)
 * - limit: Items per page (1-100, default 30)
 * - search: Search term for front/back (max 500 chars)
 * - source: Filter by source ('manual' or 'ai')
 * - sort: Sort field ('created_at' or 'updated_at', default 'created_at')
 * - order: Sort order ('asc' or 'desc', default 'desc')
 *
 * Response codes:
 * - 200 OK: Flashcards retrieved successfully
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 422 Validation Error: Invalid query parameters
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
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

    // ========================================================================
    // 2. PARSE QUERY PARAMETERS
    // ========================================================================
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search"),
      source: url.searchParams.get("source"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
    };

    // ========================================================================
    // 3. VALIDATE QUERY PARAMETERS
    // ========================================================================
    const validation = flashcardListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const errorResponse: ErrorResponse = {
        error: "Validation error",
        message: "Invalid query parameters",
        details: validation.error.flatten().fieldErrors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedParams: FlashcardListQueryInput = validation.data;

    // ========================================================================
    // 4. LIST FLASHCARDS VIA SERVICE
    // ========================================================================
    const flashcardService = new FlashcardService(context.locals.supabase);
    const { flashcards, total } = await flashcardService.listFlashcards(
      user.id,
      validatedParams
    );

    // ========================================================================
    // 5. BUILD PAGINATION METADATA
    // ========================================================================
    const totalPages = Math.ceil(total / validatedParams.limit);
    const pagination = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      total,
      total_pages: totalPages,
      has_next: validatedParams.page < totalPages,
      has_prev: validatedParams.page > 1,
    };

    // ========================================================================
    // 6. RETURN SUCCESS RESPONSE
    // ========================================================================
    const response: FlashcardListResponse = {
      data: flashcards,
      pagination,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ========================================================================
    // 7. HANDLE UNEXPECTED ERRORS
    // ========================================================================
    console.error("[GET /api/flashcards] Error listing flashcards:", {
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

### Step 4: Test the Implementation

**Manual Testing Checklist:**

1. **Authentication:**
   - [ ] Request without token returns 401
   - [ ] Request with invalid token returns 401
   - [ ] Request with valid token returns 200

2. **Default Behavior:**
   - [ ] GET /api/flashcards with no params uses defaults (page=1, limit=30, sort=created_at, order=desc)
   - [ ] Returns flashcards sorted by created_at DESC
   - [ ] Pagination metadata is correct

3. **Pagination:**
   - [ ] page=1 returns first page
   - [ ] page=2 returns second page
   - [ ] limit=10 returns 10 items
   - [ ] limit=100 returns max 100 items
   - [ ] page=0 returns 422 validation error
   - [ ] limit=101 returns 422 validation error
   - [ ] limit=0 returns 422 validation error

4. **Search:**
   - [ ] search="term" returns flashcards with "term" in front or back
   - [ ] search is case-insensitive
   - [ ] search with no results returns empty array with pagination
   - [ ] search > 500 chars returns 422 validation error

5. **Filtering:**
   - [ ] source=manual returns only manual flashcards
   - [ ] source=ai returns only AI flashcards
   - [ ] source=invalid returns 422 validation error

6. **Sorting:**
   - [ ] sort=created_at orders by creation date
   - [ ] sort=updated_at orders by update date
   - [ ] order=asc returns ascending order
   - [ ] order=desc returns descending order
   - [ ] sort=invalid returns 422 validation error
   - [ ] order=invalid returns 422 validation error

7. **Combined Filters:**
   - [ ] search + source filter works correctly
   - [ ] search + pagination works correctly
   - [ ] all parameters combined work correctly

8. **Security:**
   - [ ] User A cannot see User B's flashcards (RLS)
   - [ ] user_id is not included in response
   - [ ] Database errors return generic 500 message

9. **Edge Cases:**
   - [ ] Empty result set returns empty array with correct pagination
   - [ ] Page beyond total_pages returns empty array
   - [ ] Special characters in search term handled correctly

### Step 5: Update Documentation

**Action:** Mark the endpoint as implemented in API documentation

**File:** `.ai/api-plan.md`

Update the status of the endpoint from planned to implemented, and add implementation date.

---

## 10. Additional Considerations

### Future Enhancements (Post-MVP)

1. **Cursor-Based Pagination:**
   - More efficient for large datasets
   - Better UX for infinite scroll
   - Eliminates issues with data changes between pages

2. **Advanced Search:**
   - Full-text search with ranking (tsvector/tsquery)
   - Search term highlighting in results
   - Search suggestions/autocomplete

3. **Additional Filters:**
   - Date range filtering (created_at, updated_at)
   - Multiple source selection
   - Filter by generation_id

4. **Response Optimization:**
   - Field selection (return only requested fields)
   - Batch requests (combine multiple queries)
   - GraphQL consideration for complex queries

5. **Caching:**
   - HTTP caching headers (ETag, Last-Modified)
   - Server-side caching (Redis)
   - Cache invalidation strategy

6. **Analytics:**
   - Track popular search terms
   - Monitor query performance
   - Identify slow queries

### Dependencies

**Required Packages (Already Installed):**
- `zod` - Input validation
- `@supabase/supabase-js` - Database client
- `astro` - API route framework

**No Additional Dependencies Required**

### Deployment Notes

1. **Environment Variables:**
   - Ensure `PUBLIC_SUPABASE_URL` is set
   - Ensure `PUBLIC_SUPABASE_KEY` is set
   - Verify JWT secret is configured in Supabase

2. **Database Migrations:**
   - Ensure all indexes are created (from db-plan.md)
   - Verify RLS policies are enabled on flashcards table

3. **Monitoring:**
   - Set up error logging aggregation
   - Monitor query performance metrics
   - Set up alerts for high error rates

4. **Performance Testing:**
   - Load test with realistic data volumes
   - Test with users having 1000+ flashcards
   - Verify index usage with EXPLAIN ANALYZE

---

## 11. Success Criteria

The implementation is considered complete and successful when:

1. ✅ All query parameters are validated correctly
2. ✅ Pagination works correctly with accurate metadata
3. ✅ Search returns relevant results (case-insensitive)
4. ✅ Source filtering works for both manual and AI flashcards
5. ✅ Sorting works for both created_at and updated_at
6. ✅ Authentication is enforced (401 for missing/invalid tokens)
7. ✅ RLS ensures users only see their own flashcards
8. ✅ Error responses follow the standard ErrorResponse format
9. ✅ All manual tests pass
10. ✅ Performance meets targets (< 200ms response time)
11. ✅ No user_id exposed in responses
12. ✅ Database errors return generic 500 responses
13. ✅ Code follows project coding practices and style guide

---

**End of Implementation Plan**

