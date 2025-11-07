# FlashcardService.listFlashcards Tests Documentation

## Overview

This directory contains unit tests for the FlashcardService class, focusing on comprehensive testing of business logic and edge cases.

## Test Files

### `flashcard.service.listFlashcards.test.ts`

Comprehensive test suite for the `listFlashcards` method with 29 test cases covering:

#### Basic Functionality (4 tests)
- ✅ Return flashcards with default parameters
- ✅ Return empty array when no flashcards found
- ✅ Handle null data gracefully
- ✅ Handle null count gracefully

#### Pagination (4 tests)
- ✅ Correct pagination for page 1
- ✅ Correct pagination for page 2
- ✅ Correct pagination with different limits
- ✅ Handle large page numbers

#### Search Filtering (4 tests)
- ✅ Apply case-insensitive search pattern
- ✅ Handle special characters in search
- ✅ Skip search when undefined
- ✅ Handle empty search string

#### Source Filtering (3 tests)
- ✅ Filter by 'manual' source
- ✅ Filter by 'ai' source
- ✅ Skip filter when undefined

#### Sorting (4 tests)
- ✅ Sort by created_at descending (default)
- ✅ Sort by created_at ascending
- ✅ Sort by updated_at descending
- ✅ Sort by updated_at ascending

#### Combined Filters (2 tests)
- ✅ Apply search and source filters together
- ✅ Apply all filters with sorting and pagination

#### Data Transformation (2 tests)
- ✅ Remove user_id from all returned flashcards
- ✅ Preserve all other flashcard properties

#### Error Handling (2 tests)
- ✅ Throw error on database query failure
- ✅ Include database error message in thrown error

#### Query Construction (1 test)
- ✅ Construct query in correct order

#### Edge Cases (3 tests)
- ✅ Handle very long search terms (500 characters)
- ✅ Handle maximum limit value (100)
- ✅ Handle minimum limit value (1)

## Test Strategy

### Arrange-Act-Assert Pattern
All tests follow the AAA pattern:
1. **Arrange**: Set up test data and mock behavior
2. **Act**: Execute the method under test
3. **Assert**: Verify expected outcomes

### Mock Strategy
- Uses Vitest's `vi.fn()` for function mocks
- Creates chainable mock query objects to simulate Supabase client
- Preserves method chaining behavior for query building

### Coverage Focus
- ✅ Business rules validation
- ✅ Data transformation logic
- ✅ Error handling scenarios
- ✅ Edge cases and boundary conditions
- ✅ Filter combinations
- ✅ Pagination calculations

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Key Business Rules Tested

1. **Pagination**: Correct offset calculation: `offset = (page - 1) × limit`
2. **Search**: Case-insensitive search on both front and back fields
3. **Source Filter**: Only 'manual' or 'ai' values allowed
4. **Sorting**: Support for created_at and updated_at columns
5. **Data Security**: user_id must be removed from all responses
6. **Error Handling**: Database errors must be caught and rethrown with context

## Mocking Patterns

### Supabase Query Chain
```typescript
mockQuery = {
  select: vi.fn().mockReturnValue(mockQuery),
  or: vi.fn().mockReturnValue(mockQuery),
  eq: vi.fn().mockReturnValue(mockQuery),
  order: vi.fn().mockReturnValue(mockQuery),
  range: vi.fn().mockResolvedValue({ data, count, error }),
};
```

### Mock Data Structure
```typescript
const mockFlashcard = {
  id: number,
  user_id: string,      // Removed in service response
  front: string,
  back: string,
  source: "manual" | "ai",
  generation_id: number | null,
  created_at: string,
  updated_at: string,
};
```

## Future Test Considerations

1. Integration tests with actual Supabase instance
2. Performance tests for large datasets
3. Concurrent request handling
4. RLS policy validation
5. Transaction rollback scenarios

