# REST API Plan - 10x Cards MVP

## 1. Overview

This API follows REST principles and is designed to support the 10x Cards flashcard application. The API handles AI-powered flashcard generation, manual flashcard creation, and flashcard collection management. All endpoints require authentication through Supabase Auth, with Row-Level Security (RLS) enforced at the database level.

### Base URL
```
/api
```

### Authentication
All API endpoints (except health checks) require a valid Supabase Auth JWT token passed in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## 2. Resources

### Primary Resources

| Resource | Database Table | Description |
|:---------|:--------------|:------------|
| **Flashcards** | `flashcards` | User's flashcard collection (manual and AI-generated) |
| **Generations** | `generations` | AI generation sessions with metrics tracking |
| **Generation Errors** | `generation_error_logs` | Error logs for failed AI generations (internal use) |

### Resource Relationships

- **Flashcards** → **Users**: Many-to-One (each flashcard belongs to one user)
- **Flashcards** → **Generations**: Many-to-One (AI-generated flashcards reference their generation session)
- **Generations** → **Users**: Many-to-One (each generation session belongs to one user)

## 3. API Endpoints

### 3.1. Flashcards Resource

#### 3.1.1. List Flashcards

**Endpoint:** `GET /api/flashcards`

**Description:** Retrieve paginated list of user's flashcards with optional filtering, searching, and sorting.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|:----------|:-----|:---------|:--------|:------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 30 | Items per page (max 100) |
| `search` | string | No | - | Search term for full-text search on front and back |
| `source` | string | No | - | Filter by source: 'manual' or 'ai' |
| `sort` | string | No | 'created_at' | Sort field: 'created_at', 'updated_at' |
| `order` | string | No | 'desc' | Sort order: 'asc' or 'desc' |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "front": "Mitochondria",
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

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 422 | Invalid parameters | `{"error": "Validation error", "message": "Invalid query parameters", "details": {...}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.1.2. Get Single Flashcard

**Endpoint:** `GET /api/flashcards/{id}`

**Description:** Retrieve a specific flashcard by ID.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `id` | integer | Flashcard ID |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "front": "Mitochondria",
    "back": "The powerhouse of the cell",
    "source": "ai",
    "generation_id": 42,
    "created_at": "2025-11-04T12:34:56.789Z",
    "updated_at": "2025-11-04T12:34:56.789Z"
  }
}
```

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Not found | `{"error": "Not found", "message": "Flashcard not found or you don't have permission to access it"}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.1.3. Create Single Flashcard (Manual)

**Endpoint:** `POST /api/flashcards`

**Description:** Create a single flashcard manually.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "front": "Photosynthesis",
  "back": "The process by which plants convert light energy into chemical energy"
}
```

**Request Body Validation:**

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:------------|
| `front` | string | Yes | 1-5000 characters, non-empty |
| `back` | string | Yes | 1-5000 characters, non-empty |

**Response (201 Created):**
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

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 400 | Bad request | `{"error": "Bad request", "message": "Invalid request body"}` |
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 422 | Validation error | `{"error": "Validation error", "message": "Validation failed", "details": {"front": "Field is required"}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.1.4. Create Multiple Flashcards (Batch)

**Endpoint:** `POST /api/flashcards/batch`

**Description:** Create multiple flashcards at once (typically used after AI generation when user accepts proposals).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "flashcards": [
    {
      "front": "Mitochondria",
      "back": "The powerhouse of the cell",
      "edited": false
    },
    {
      "front": "Ribosome",
      "back": "Organelle responsible for protein synthesis",
      "edited": true
    }
  ],
  "generation_id": 42
}
```

**Request Body Validation:**

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:------------|
| `flashcards` | array | Yes | 1-50 items |
| `flashcards[].front` | string | Yes | 1-5000 characters, non-empty |
| `flashcards[].back` | string | Yes | 1-5000 characters, non-empty |
| `flashcards[].edited` | boolean | Yes | Indicates if user edited this proposal |
| `generation_id` | integer | Yes | Must exist in generations table |

**Response (201 Created):**
```json
{
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 151,
        "front": "Mitochondria",
        "back": "The powerhouse of the cell",
        "source": "ai",
        "generation_id": 42,
        "created_at": "2025-11-04T14:30:00.000Z",
        "updated_at": "2025-11-04T14:30:00.000Z"
      },
      {
        "id": 152,
        "front": "Ribosome",
        "back": "Organelle responsible for protein synthesis",
        "source": "ai",
        "generation_id": 42,
        "created_at": "2025-11-04T14:30:00.001Z",
        "updated_at": "2025-11-04T14:30:00.001Z"
      }
    ]
  }
}
```

**Side Effects:**
- Updates the associated generation record with acceptance metrics (accepted_unedited_count, accepted_edited_count)

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 400 | Bad request | `{"error": "Bad request", "message": "Invalid request body"}` |
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Generation not found | `{"error": "Not found", "message": "Generation session not found"}` |
| 422 | Validation error | `{"error": "Validation error", "message": "Validation failed", "details": {...}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.1.5. Update Flashcard

**Endpoint:** `PUT /api/flashcards/{id}`

**Description:** Update an existing flashcard's content.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `id` | integer | Flashcard ID |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "front": "Photosynthesis (Updated)",
  "back": "The process by which green plants and some other organisms use sunlight to synthesize nutrients"
}
```

**Request Body Validation:**

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:------------|
| `front` | string | Yes | 1-5000 characters, non-empty |
| `back` | string | Yes | 1-5000 characters, non-empty |

**Response (200 OK):**
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

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 400 | Bad request | `{"error": "Bad request", "message": "Invalid request body"}` |
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Not found | `{"error": "Not found", "message": "Flashcard not found or you don't have permission to update it"}` |
| 422 | Validation error | `{"error": "Validation error", "message": "Validation failed", "details": {...}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.1.6. Delete Flashcard

**Endpoint:** `DELETE /api/flashcards/{id}`

**Description:** Delete a specific flashcard.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `id` | integer | Flashcard ID |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (204 No Content):**
No response body.

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Not found | `{"error": "Not found", "message": "Flashcard not found or you don't have permission to delete it"}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

### 3.2. Generations Resource

#### 3.2.1. Generate Flashcards with AI

**Endpoint:** `POST /api/generations`

**Description:** Generate flashcard proposals from source text using AI. This endpoint calls the OpenRouter API, creates a generation record for metrics tracking, and returns proposals for user review.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "source_text": "Mitochondria are organelles found in most eukaryotic cells. They are often called the powerhouse of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy. Mitochondria have a double membrane structure..."
}
```

**Request Body Validation:**

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:------------|
| `source_text` | string | Yes | 100-1000 characters |

**Response (200 OK):**
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
      },
      {
        "front": "Double membrane structure",
        "back": "The structural characteristic of mitochondria consisting of an outer and inner membrane"
      }
      // ... 9 more proposals
    ]
  }
}
```

**Business Logic:**
1. Validate source text length (100-1000 characters)
2. Generate SHA-256 hash of source text
3. Call OpenRouter API with privacy mode enabled
4. Request exactly 12 flashcard proposals in structured format
5. Measure generation duration (in milliseconds)
6. Create generation record in database with initial metrics
7. Return proposals to user (not saved as flashcards yet)
8. On error, log to generation_error_logs table

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 400 | Bad request | `{"error": "Bad request", "message": "Invalid request body"}` |
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 422 | Validation error | `{"error": "Validation error", "message": "Source text must be between 100 and 1000 characters", "details": {"source_text": "Length must be 100-1000 characters"}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |
| 503 | AI service unavailable | `{"error": "Service unavailable", "message": "AI generation service is currently unavailable. Please try again later."}` |

---

#### 3.2.2. Get Generation Details

**Endpoint:** `GET /api/generations/{id}`

**Description:** Retrieve details of a specific generation session.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `id` | integer | Generation ID |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 42,
    "model": "anthropic/claude-3-haiku",
    "generated_count": 12,
    "accepted_unedited_count": 8,
    "accepted_edited_count": 3,
    "source_text_hash": "a3d5e8f...",
    "source_text_length": 456,
    "generation_duration": 3245,
    "created_at": "2025-11-04T14:25:00.000Z",
    "updated_at": "2025-11-04T14:30:00.000Z"
  }
}
```

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Not found | `{"error": "Not found", "message": "Generation not found"}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

#### 3.2.3. Update Generation Metrics

**Endpoint:** `PATCH /api/generations/{id}`

**Description:** Update acceptance metrics for a generation session. This endpoint is called automatically when flashcards are saved via the batch endpoint.

**Note:** This endpoint is primarily for internal use and is called automatically by the `POST /api/flashcards/batch` endpoint. It may not need to be directly exposed to the frontend.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `id` | integer | Generation ID |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accepted_unedited_count": 8,
  "accepted_edited_count": 3
}
```

**Request Body Validation:**

| Field | Type | Required | Constraints |
|:------|:-----|:---------|:------------|
| `accepted_unedited_count` | integer | No | >= 0 |
| `accepted_edited_count` | integer | No | >= 0 |

**Response (200 OK):**
```json
{
  "data": {
    "id": 42,
    "model": "anthropic/claude-3-haiku",
    "generated_count": 12,
    "accepted_unedited_count": 8,
    "accepted_edited_count": 3,
    "source_text_hash": "a3d5e8f...",
    "source_text_length": 456,
    "generation_duration": 3245,
    "created_at": "2025-11-04T14:25:00.000Z",
    "updated_at": "2025-11-04T14:30:05.123Z"
  }
}
```

**Error Responses:**

| Code | Description | Response Body |
|:-----|:------------|:--------------|
| 400 | Bad request | `{"error": "Bad request", "message": "Invalid request body"}` |
| 401 | Unauthorized | `{"error": "Unauthorized", "message": "Invalid or missing authentication token"}` |
| 404 | Not found | `{"error": "Not found", "message": "Generation not found"}` |
| 422 | Validation error | `{"error": "Validation error", "message": "Validation failed", "details": {...}}` |
| 500 | Server error | `{"error": "Internal server error", "message": "An unexpected error occurred"}` |

---

### 3.3. Health & Status

#### 3.3.1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check API health status.

**Request Headers:**
None required (public endpoint)

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T15:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 4. Authentication and Authorization

### 4.1. Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication. 

#### Implementation Details:

1. **Frontend Authentication:**
   - Use Supabase Auth SDK for all authentication operations (sign up, sign in, sign out)
   - The SDK automatically manages JWT tokens and refresh tokens
   - No custom authentication endpoints are needed

2. **API Authentication:**
   - All API endpoints (except `/api/health`) require a valid JWT token
   - Token must be passed in the `Authorization` header: `Bearer <jwt_token>`
   - API endpoints extract `user_id` from the JWT token using Supabase libraries
   - Invalid or expired tokens return `401 Unauthorized`

3. **Token Extraction:**
   ```typescript
   // Example in Astro endpoint
   import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
   
   const supabase = createServerSupabaseClient({ req, res });
   const { data: { user }, error } = await supabase.auth.getUser();
   
   if (error || !user) {
     return new Response(JSON.stringify({
       error: 'Unauthorized',
       message: 'Invalid or missing authentication token'
     }), { status: 401 });
   }
   
   const userId = user.id; // Use this for database queries
   ```

### 4.2. Authorization

Authorization is enforced at two levels:

1. **Row-Level Security (RLS) at Database Level:**
   - RLS is enabled on the `flashcards` table
   - Policies ensure users can only access their own flashcards
   - Supabase automatically enforces these policies using the JWT token
   - No additional authorization logic needed in API code for flashcards

2. **Application-Level Authorization:**
   - `generations` table access is controlled at the API level
   - API endpoints verify that the authenticated user owns the generation record
   - Example check:
     ```typescript
     const { data: generation } = await supabase
       .from('generations')
       .select('*')
       .eq('id', generationId)
       .eq('user_id', userId)
       .single();
     
     if (!generation) {
       return new Response(JSON.stringify({
         error: 'Not found',
         message: 'Generation not found'
       }), { status: 404 });
     }
     ```

### 4.3. Session Management

- Supabase Auth SDK handles session management automatically
- Access tokens expire after 1 hour by default
- Refresh tokens are used to obtain new access tokens
- The SDK automatically refreshes tokens before they expire

## 5. Validation and Business Logic

### 5.1. Input Validation Rules

#### Flashcard Validation

| Field | Validation Rules |
|:------|:-----------------|
| `front` | Required, string, 1-5000 characters, trimmed, non-empty after trimming |
| `back` | Required, string, 1-5000 characters, trimmed, non-empty after trimming |
| `source` | Automatically set by API ('manual' or 'ai'), not user-provided |
| `generation_id` | Optional, must exist in generations table if provided, user must own the generation |

#### Generation Input Validation

| Field | Validation Rules |
|:------|:-----------------|
| `source_text` | Required, string, 100-1000 characters, trimmed |

#### Batch Creation Validation

| Field | Validation Rules |
|:------|:-----------------|
| `flashcards` | Required, array, 1-50 items |
| `flashcards[].front` | Same as flashcard front validation |
| `flashcards[].back` | Same as flashcard back validation |
| `flashcards[].edited` | Required, boolean |
| `generation_id` | Required, integer, must exist in generations table, user must own the generation |

#### List/Search Query Validation

| Parameter | Validation Rules |
|:----------|:-----------------|
| `page` | Optional, integer, >= 1, default 1 |
| `limit` | Optional, integer, 1-100, default 30 |
| `search` | Optional, string, max 500 characters |
| `source` | Optional, enum: 'manual' or 'ai' |
| `sort` | Optional, enum: 'created_at', 'updated_at', default 'created_at' |
| `order` | Optional, enum: 'asc', 'desc', default 'desc' |

### 5.2. Business Logic Implementation

#### 5.2.1. AI Generation Flow

**Sequence:**
1. User submits source text (100-1000 chars)
2. API validates input
3. API generates SHA-256 hash of source text
4. API calls OpenRouter with:
   - Model selection (e.g., Claude 3 Haiku for cost-efficiency)
   - Privacy mode enabled
   - Structured prompt requesting exactly 12 flashcards
   - Format: Array of {front: string, back: string}
5. API measures generation duration
6. API creates generation record with:
   - user_id (from JWT)
   - model name
   - generated_count: 12
   - source_text_hash
   - source_text_length
   - generation_duration
   - accepted counts: null (to be updated later)
7. API returns generation_id and proposals (not saved as flashcards yet)
8. If OpenRouter call fails:
   - Log error to generation_error_logs
   - Return 503 error to user

**Prompt Engineering:**
The API should use a well-crafted prompt for OpenRouter, example:
```
Generate exactly 12 educational flashcards from the following text. 
Each flashcard should have a 'front' (concept/term) and 'back' (definition/explanation).
Return as a JSON array with this structure: [{"front": "...", "back": "..."}, ...]

Text: {source_text}

Requirements:
- Focus on key concepts and important information
- Front should be concise (1-10 words)
- Back should be clear and educational (1-3 sentences)
- Avoid duplicates
- Generate exactly 12 flashcards
```

#### 5.2.2. Flashcard Acceptance Flow

**Sequence:**
1. User reviews 12 proposals in frontend
2. User can:
   - Accept proposal as-is (mark for saving)
   - Edit proposal then accept (mark for saving)
   - Remove proposal (don't save)
3. User clicks "Save Accepted"
4. Frontend calls `POST /api/flashcards/batch` with:
   - Array of accepted flashcards
   - Each item includes `edited: boolean` flag
   - generation_id reference
5. API validates all flashcards
6. API creates flashcard records with:
   - user_id (from JWT)
   - front, back (from request)
   - source: 'ai'
   - generation_id
7. API counts:
   - accepted_unedited_count: flashcards where edited=false
   - accepted_edited_count: flashcards where edited=true
8. API updates generation record with counts
9. API returns created flashcards

**Metrics Calculation:**
```typescript
const acceptedUnedited = flashcards.filter(f => !f.edited).length;
const acceptedEdited = flashcards.filter(f => f.edited).length;

// Update generation record
await supabase
  .from('generations')
  .update({
    accepted_unedited_count: acceptedUnedited,
    accepted_edited_count: acceptedEdited,
    updated_at: new Date().toISOString()
  })
  .eq('id', generation_id);
```

#### 5.2.3. Manual Creation Flow

**Sequence:**
1. User enters front and back text
2. User clicks "Add Flashcard"
3. Frontend calls `POST /api/flashcards`
4. API validates input
5. API creates flashcard with:
   - user_id (from JWT)
   - front, back (from request)
   - source: 'manual'
   - generation_id: null
6. API returns created flashcard
7. Frontend clears form for next entry

#### 5.2.4. Search and Filter Logic

**Full-Text Search:**
- Use PostgreSQL's full-text search with GIN index
- Search across both front and back fields
- Case-insensitive matching
- Example query:
  ```sql
  SELECT * FROM flashcards
  WHERE user_id = $1
    AND (front ILIKE '%' || $2 || '%' OR back ILIKE '%' || $2 || '%')
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
  ```

**Filtering:**
- By source: Filter flashcards by 'manual' or 'ai'
- Combined with search if both provided

**Sorting:**
- Default: created_at DESC (newest first)
- Alternatives: created_at ASC, updated_at DESC, updated_at ASC

**Pagination:**
- Cursor-based pagination could be implemented for better performance with large datasets
- Offset-based pagination is sufficient for MVP

#### 5.2.5. Error Logging

When AI generation fails, log to generation_error_logs:
```typescript
await supabase.from('generation_error_logs').insert({
  user_id: userId,
  model: selectedModel,
  source_text_hash: hash,
  source_text_length: sourceText.length,
  error_code: error.code || null,
  error_message: error.message,
  created_at: new Date().toISOString()
});
```

This allows for:
- Debugging generation issues
- Monitoring API reliability
- Identifying problematic source texts
- Tracking error rates per model

### 5.3. Database Constraints Enforcement

The following constraints are enforced at the database level and will result in appropriate API error responses:

**Flashcards Table:**
- `user_id` FK constraint: Ensures flashcard belongs to valid user
- `generation_id` FK constraint: Ensures valid generation reference (if provided)
- `front` CHECK: length(front) > 0
- `back` CHECK: length(back) > 0
- `source` CHECK: source IN ('manual', 'ai')

**Generations Table:**
- `user_id` FK constraint: Ensures generation belongs to valid user
- `generated_count` CHECK: generated_count > 0
- `accepted_unedited_count` CHECK: accepted_unedited_count >= 0
- `accepted_edited_count` CHECK: accepted_edited_count >= 0
- `source_text_length` CHECK: source_text_length > 0
- `generation_duration` CHECK: generation_duration >= 0

API should catch database constraint violations and return appropriate 422 Validation Error responses with clear messages.

## 6. Error Handling Strategy

### 6.1. Standard Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field1": "Field-specific error message",
    "field2": "Another field error"
  }
}
```

The `details` field is optional and included only for validation errors.

### 6.2. HTTP Status Codes

| Code | Usage |
|:-----|:------|
| 200 | Successful GET, PUT, PATCH requests |
| 201 | Successful POST request (resource created) |
| 204 | Successful DELETE request (no content) |
| 400 | Bad request (malformed JSON, invalid structure) |
| 401 | Unauthorized (missing or invalid auth token) |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Resource not found or user doesn't own it |
| 422 | Validation error (invalid field values) |
| 429 | Rate limit exceeded (future consideration) |
| 500 | Internal server error |
| 503 | Service unavailable (external service down, e.g., OpenRouter) |

### 6.3. Rate Limiting (Future Consideration)

While not implemented in MVP, the API should be designed with rate limiting in mind:

- Per-user limits on AI generation (e.g., 100 generations per day)
- Global rate limits to prevent abuse
- Return 429 status with Retry-After header
- Track usage in database for analytics

## 7. Performance Considerations

### 7.1. Database Optimization

**Indexed Queries:**
- All list queries use indexes defined in the schema
- `idx_flashcards_user_created` optimizes the default list query (filter by user, sort by created_at)
- `idx_flashcards_front_back_gin` enables efficient full-text search

**Query Optimization:**
- Use SELECT only needed fields
- Leverage Supabase's automatic query optimization
- Consider implementing cursor-based pagination for very large collections

### 7.2. Caching Strategy (Future Enhancement)

Not implemented in MVP, but consider:
- Cache generation results temporarily (1 hour) to allow users to come back
- Cache user's flashcard count for pagination
- Use ETags for conditional requests

### 7.3. Response Times

Target response times:
- Simple CRUD operations: < 100ms
- List with pagination: < 200ms
- AI generation: 2-5 seconds (dependent on OpenRouter)

### 7.4. Connection Pooling

- Supabase handles connection pooling automatically
- Recommended: Use connection pooler for API routes

## 8. API Versioning

### 8.1. Versioning Strategy

**For MVP:** No versioning needed. All endpoints use `/api/*` prefix.

**Future:** When breaking changes are needed:
- Version in URL path: `/api/v2/*`
- Maintain v1 for backward compatibility
- Deprecation notices in responses
- Clear migration documentation

### 8.2. Breaking vs Non-Breaking Changes

**Non-breaking (can be added without versioning):**
- Adding new optional fields to responses
- Adding new optional parameters to requests
- Adding new endpoints
- Adding new enum values (with care)

**Breaking (require new version):**
- Removing fields from responses
- Changing field types
- Making optional fields required
- Removing endpoints
- Changing authentication mechanism

## 9. Testing Recommendations

### 9.1. Unit Tests

Test each endpoint with:
- Valid inputs (happy path)
- Invalid inputs (validation)
- Missing authentication
- Wrong user (authorization)
- Edge cases (empty strings, max length, etc.)

### 9.2. Integration Tests

Test complete flows:
- Full AI generation and acceptance flow
- Manual creation and editing flow
- Search and pagination
- Error handling and logging

### 9.3. Load Testing

Verify performance under load:
- 100 concurrent users listing flashcards
- Multiple AI generations simultaneously
- Database query performance with 10,000+ flashcards per user

## 10. OpenRouter Integration Details

### 10.1. API Configuration

**Base URL:** `https://openrouter.ai/api/v1/chat/completions`

**Required Headers:**
```
Authorization: Bearer <OPENROUTER_API_KEY>
HTTP-Referer: <YOUR_SITE_URL>
X-Title: 10x Cards
```

**Privacy Mode:**
Add to request body:
```json
{
  "models": ["anthropic/claude-3-haiku"],
  "allow_fallbacks": false,
  "privacy_mode": true
}
```

### 10.2. Model Selection

**Recommended for MVP:**
- Primary: `anthropic/claude-3-haiku` (fast, cost-effective, good quality)
- Fallback: `openai/gpt-3.5-turbo` (if Claude unavailable)

**Model Selection Strategy:**
- Start with most cost-effective model
- Monitor acceptance rates in generations table
- Upgrade to better models if acceptance rates are too low
- Allow model experimentation by tracking metrics per model

### 10.3. Request Format

```json
{
  "model": "anthropic/claude-3-haiku",
  "messages": [
    {
      "role": "user",
      "content": "<PROMPT_WITH_SOURCE_TEXT>"
    }
  ],
  "response_format": {
    "type": "json_object"
  },
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 10.4. Response Parsing

Expected OpenRouter response structure:
```json
{
  "id": "gen-xxx",
  "model": "anthropic/claude-3-haiku",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "[{\"front\":\"...\",\"back\":\"...\"},...] "
      }
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 400,
    "total_tokens": 550
  }
}
```

Parse the content field as JSON to extract flashcard proposals.

### 10.5. Error Handling

**OpenRouter Error Codes:**
- 400: Invalid request
- 401: Invalid API key
- 402: Insufficient credits
- 429: Rate limit exceeded
- 500: OpenRouter server error

**Handling Strategy:**
- Retry transient errors (429, 500) with exponential backoff
- Log all errors to generation_error_logs
- Return user-friendly messages (don't expose internal errors)
- Consider fallback to different model on repeated failures

## 11. Security Considerations

### 11.1. Input Sanitization

- Trim all string inputs
- Escape special characters for database queries (handled by Supabase client)
- Validate string lengths before database operations
- Reject requests with unexpected fields

### 11.2. API Key Security

- Store OpenRouter API key in environment variables
- Never expose in client-side code
- Rotate keys periodically
- Use different keys for development and production

### 11.3. Rate Limiting (Future)

Implement to prevent abuse:
- Per-user limits on API calls
- Stricter limits on expensive operations (AI generation)
- IP-based limits for unauthenticated endpoints

### 11.4. CORS Configuration

Configure CORS appropriately:
```typescript
// For Astro production
const corsOrigins = process.env.NODE_ENV === 'production'
  ? ['https://yourdomain.com']
  : ['http://localhost:4321'];
```

### 11.5. HTTPS Only

- Enforce HTTPS in production
- Redirect HTTP to HTTPS
- Use secure cookies for sessions (handled by Supabase)

## 12. Monitoring and Logging

### 12.1. Logging Strategy

**Log Levels:**
- INFO: Normal operations (generation started, flashcard created)
- WARN: Recoverable errors (retry successful, validation failures)
- ERROR: Unrecoverable errors (OpenRouter failures, database errors)

**What to Log:**
- All API requests (method, path, user_id, timestamp)
- All errors with full stack traces
- AI generation metrics (duration, token usage)
- Slow queries (> 1 second)

### 12.2. Metrics to Track

**Application Metrics:**
- Request count per endpoint
- Response time percentiles (p50, p95, p99)
- Error rates by endpoint and error type
- Active users (daily/monthly)

**Business Metrics:**
- AI generations per day
- Acceptance rates (overall and per model)
- Flashcards created (AI vs manual)
- Average flashcards per user
- AI generation duration trends

**Infrastructure Metrics:**
- Database connection pool usage
- API memory usage
- CPU usage
- Network latency to OpenRouter

### 12.3. Alerting

Set up alerts for:
- Error rate > 5%
- API response time > 2 seconds (95th percentile)
- OpenRouter availability < 95%
- Database connection issues
- Unusual spike in traffic

## 13. Documentation

### 13.1. API Documentation

Generate and maintain:
- OpenAPI/Swagger specification
- Interactive API explorer
- Code examples in TypeScript
- Postman collection

### 13.2. Developer Onboarding

Provide:
- Setup guide for local development
- Environment variables documentation
- Database schema explanation
- Testing guidelines
- Deployment instructions

## 14. Migration Path from MVP

### 14.1. Future Enhancements

Potential additions post-MVP:
- Spaced repetition algorithm endpoints
- Deck/collection management
- Tagging system
- Import/export functionality
- Collaborative features
- Mobile app support (may need GraphQL or optimization)

### 14.2. Backward Compatibility

When adding features:
- Add new endpoints rather than modifying existing ones
- Make new fields optional
- Maintain existing response structures
- Version API if breaking changes are necessary

---

## Appendix A: Complete Endpoint Summary

| Method | Path | Auth Required | Description |
|:-------|:-----|:--------------|:------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/flashcards` | Yes | List flashcards with pagination/search |
| GET | `/api/flashcards/{id}` | Yes | Get single flashcard |
| POST | `/api/flashcards` | Yes | Create single flashcard (manual) |
| POST | `/api/flashcards/batch` | Yes | Create multiple flashcards (AI accepted) |
| PUT | `/api/flashcards/{id}` | Yes | Update flashcard |
| DELETE | `/api/flashcards/{id}` | Yes | Delete flashcard |
| POST | `/api/generations` | Yes | Generate flashcard proposals with AI |
| GET | `/api/generations/{id}` | Yes | Get generation details |
| PATCH | `/api/generations/{id}` | Yes | Update generation metrics (internal) |

---

## Appendix B: Example Request/Response Flows

### Flow 1: Complete AI Generation and Acceptance

**Step 1: Generate proposals**
```
POST /api/generations
Authorization: Bearer <token>
Content-Type: application/json

{
  "source_text": "Photosynthesis is the process..."
}

Response 200:
{
  "data": {
    "generation_id": 100,
    "model": "anthropic/claude-3-haiku",
    "generated_count": 12,
    "proposals": [...]
  }
}
```

**Step 2: User reviews in frontend, edits some, accepts 10**

**Step 3: Save accepted flashcards**
```
POST /api/flashcards/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "flashcards": [
    {"front": "...", "back": "...", "edited": false},
    {"front": "...", "back": "...", "edited": true},
    // ... 8 more
  ],
  "generation_id": 100
}

Response 201:
{
  "data": {
    "created_count": 10,
    "flashcards": [...]
  }
}
```

**Step 4: Check metrics**
```
GET /api/generations/100
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "id": 100,
    "generated_count": 12,
    "accepted_unedited_count": 7,
    "accepted_edited_count": 3,
    ...
  }
}
```

### Flow 2: Manual Creation

```
POST /api/flashcards
Authorization: Bearer <token>
Content-Type: application/json

{
  "front": "What is mitosis?",
  "back": "Cell division that results in two identical daughter cells"
}

Response 201:
{
  "data": {
    "id": 501,
    "front": "What is mitosis?",
    "back": "Cell division that results in two identical daughter cells",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-11-04T16:00:00.000Z",
    "updated_at": "2025-11-04T16:00:00.000Z"
  }
}
```

### Flow 3: Search and Filter

```
GET /api/flashcards?search=mitochondria&source=ai&page=1&limit=20
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": 123,
      "front": "Mitochondria",
      "back": "The powerhouse of the cell",
      "source": "ai",
      "generation_id": 42,
      "created_at": "2025-11-03T10:00:00.000Z",
      "updated_at": "2025-11-03T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

## 9. Implementation Status

This section tracks the implementation status of each API endpoint.

### Legend
- ✅ **IMPLEMENTED** - Fully implemented and tested
- 🚧 **IN PROGRESS** - Currently being implemented
- 📋 **PLANNED** - Specified but not yet started

### Flashcards Resource

| Endpoint | Method | Status | Implementation Date | Notes |
|:---------|:-------|:-------|:-------------------|:------|
| `/api/flashcards` | GET | ✅ IMPLEMENTED | 2025-11-04 | List with pagination, filtering, search, sorting |
| `/api/flashcards` | POST | ✅ IMPLEMENTED | - | Create manual flashcard |
| `/api/flashcards/{id}` | GET | 📋 PLANNED | - | Get single flashcard - Service method exists, needs API handler |
| `/api/flashcards/{id}` | PUT | ✅ IMPLEMENTED | - | Update flashcard |
| `/api/flashcards/{id}` | DELETE | ✅ IMPLEMENTED | - | Delete flashcard |
| `/api/flashcards/batch` | POST | ✅ IMPLEMENTED | - | Batch create from AI generation |

### Generations Resource

| Endpoint | Method | Status | Implementation Date | Notes |
|:---------|:-------|:-------|:-------------------|:------|
| `/api/generations` | POST | ✅ IMPLEMENTED | - | Generate flashcards with AI |
| `/api/generations/{id}` | PATCH | 📋 PLANNED | - | Update generation metrics |

### Implementation Details

#### GET /api/flashcards (List Flashcards)
- **Status:** ✅ IMPLEMENTED
- **Date:** 2025-11-04
- **Files Modified:**
  - `src/lib/validation/flashcard.validation.ts` - Added query parameter validation
  - `src/lib/services/flashcard.service.ts` - Added `listFlashcards()` method
  - `src/pages/api/flashcards/index.ts` - Added GET handler
- **Testing Guide:** `.ai/list-flashcards-testing-guide.md`
- **Implementation Plan:** `.ai/list-flashcards-implementation-plan.md`
- **Features:**
  - Pagination (1-100 items per page, default 30)
  - Full-text search (front/back fields)
  - Source filtering (manual/ai)
  - Sorting (created_at/updated_at, asc/desc)
  - Pagination metadata (total, total_pages, has_next, has_prev)
  - JWT authentication
  - Zod validation
  - RLS enforcement
  - Security (user_id excluded)

---

**End of API Plan**

