# OpenRouterService.generateFlashcards - Test Documentation

## Overview

Comprehensive unit test suite for the `generateFlashcards` method of `OpenRouterService`, achieving **100% code coverage** across all metrics (statements, branches, functions, and lines).

## Test Statistics

- **Total Tests**: 25
- **Coverage**: 100% (statements, branches, functions, lines)
- **Test Duration**: ~30 seconds (includes one real-time timeout test)

## Test Categories

### 1. Successful Flashcard Generation (5 tests)

Tests the happy path and data transformation:

- ✅ **Valid Response Handling**: Verifies correct parsing of API response with expected flashcard format
- ✅ **Whitespace Trimming**: Ensures front and back fields are trimmed of leading/trailing whitespace
- ✅ **Character Limit Enforcement**: Confirms text is truncated to 5000 characters max
- ✅ **Count Mismatch Tolerance**: Validates that mismatched counts (expected vs actual) don't cause failures
- ✅ **System Prompt Verification**: Checks that correct system prompt and user message are sent to API

**Key Business Rules Tested:**
- Flashcards are properly formatted with `front` and `back` fields
- Text content is sanitized (trimmed, length-limited)
- The service is resilient to count mismatches from the AI

### 2. HTTP Error Handling (3 tests)

Tests error scenarios from the API:

- ✅ **Non-OK Status Codes**: Handles 4xx and 5xx errors with descriptive error messages
- ✅ **Response Text Parsing Failures**: Gracefully handles errors when extracting error details
- ✅ **Rate Limiting (429)**: Specific handling for rate limit errors

**Key Business Rules Tested:**
- All HTTP errors are caught and re-thrown with context
- Error messages include status codes and response text
- Fallback to "Unknown error" when response parsing fails

### 3. Timeout Handling (3 tests)

Tests the 30-second timeout mechanism:

- ✅ **Request Timeout**: Verifies AbortController triggers after 30 seconds on hanging requests
- ✅ **Timeout Cleanup (Success)**: Ensures timeout is cleared on successful responses
- ✅ **Timeout Cleanup (Error)**: Ensures timeout is cleared even when errors occur

**Key Business Rules Tested:**
- Requests automatically abort after 30 seconds
- Timeout timers are always cleaned up to prevent memory leaks
- Timeout errors are user-friendly

**Note**: The timeout test uses real timers and takes 30 seconds to run for accurate testing.

### 4. Invalid Response Structure (3 tests)

Tests validation of OpenRouter API response format:

- ✅ **Missing Choices Array**: Detects when the response lacks the choices array
- ✅ **Empty Choices Array**: Handles empty choices arrays
- ✅ **Missing Message Object**: Catches missing message property in choices

**Key Business Rules Tested:**
- Strict validation of OpenRouter API response structure
- Clear error messages for structural issues
- Fail-fast approach for malformed responses

### 5. JSON Parsing Errors (3 tests)

Tests handling of invalid JSON content:

- ✅ **Invalid JSON Content**: Catches JSON parsing errors in message content
- ✅ **Missing Flashcards Property**: Detects when parsed JSON lacks flashcards array
- ✅ **Non-Array Flashcards**: Validates that flashcards is an array type

**Key Business Rules Tested:**
- All JSON parsing errors are caught and wrapped
- Response content is validated after parsing
- Type checking for expected data structures

### 6. Missing Required Fields (3 tests)

Tests flashcard data validation:

- ✅ **Missing Front Field**: Detects flashcards without front field
- ✅ **Missing Back Field**: Detects flashcards without back field
- ✅ **Partial Array Validation**: Fails entire batch if any flashcard is invalid

**Key Business Rules Tested:**
- Every flashcard must have both front and back
- Validation applies to all flashcards in the array
- No partial successes - all or nothing approach

### 7. Network Errors (2 tests)

Tests low-level network failures:

- ✅ **Network Failures**: Handles fetch errors (connection refused, DNS failures, etc.)
- ✅ **Response JSON Parsing Failures**: Catches errors when response.json() fails

**Key Business Rules Tested:**
- All network errors propagate with original error details
- Response parsing errors are properly caught

### 8. Edge Cases (3 tests)

Tests unusual but valid scenarios:

- ✅ **Empty Flashcards Array**: Handles valid responses with zero flashcards
- ✅ **Type Coercion**: Converts non-string front/back values to strings
- ✅ **Special Characters**: Preserves Unicode, emojis, newlines, and quotes

**Key Business Rules Tested:**
- Empty arrays are valid and returned as-is
- Flexible type handling with conversion to strings
- Character encoding is preserved

## Testing Approach

### Arrange-Act-Assert Pattern

All tests follow the AAA pattern for clarity:

```typescript
// Arrange: Setup test data and mocks
const request = { sourceText: "test", count: 12 };
mockFetch.mockResolvedValue(mockResponse);

// Act: Execute the method
const result = await service.generateFlashcards(request);

// Assert: Verify expectations
expect(result).toEqual(expectedFlashcards);
```

### Mock Strategy

- **Global fetch**: Mocked using Vitest's `vi.fn()` to intercept API calls
- **Timers**: Fake timers used for most tests, real timers for the actual timeout test
- **Isolation**: Each test is fully isolated with `beforeEach` and `afterEach` cleanup

### Key Testing Decisions

1. **Real Timers for Timeout Test**: The timeout test uses real timers (`vi.useRealTimers()`) to accurately test the 30-second abort behavior without mock timing issues.

2. **Comprehensive Error Coverage**: Tests cover both expected errors (HTTP 4xx/5xx) and unexpected errors (network failures, parsing errors).

3. **Type Coercion Testing**: Explicitly tests that non-string values are converted to strings, demonstrating defensive programming.

4. **Character Limit Testing**: Uses 6000-character strings to verify truncation at exactly 5000 characters.

## Running the Tests

```bash
# Run all tests
npm test -- openrouter.service.generateFlashcards.test.ts

# Run with verbose output
npm test -- openrouter.service.generateFlashcards.test.ts --reporter=verbose

# Run with coverage
npm test -- openrouter.service --coverage

# Run in watch mode
npm test -- openrouter.service.generateFlashcards.test.ts --watch
```

## Coverage Report

```
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
openrouter.service |     100 |      100 |     100 |     100 |
```

## Key Takeaways

✅ **Complete Coverage**: All code paths, branches, and error conditions are tested  
✅ **Business Logic Validation**: All key business rules are verified  
✅ **Error Resilience**: Extensive error handling and edge case coverage  
✅ **Maintainable**: Clear test names, AAA pattern, comprehensive comments  
✅ **Fast Execution**: 24 of 25 tests run in milliseconds (one 30s timeout test)

## Future Considerations

- **Integration Tests**: Consider adding integration tests with actual OpenRouter API (using test API keys)
- **Performance Tests**: Could add tests for response time expectations (beyond timeout)
- **Retry Logic**: If retry logic is added to the service, expand timeout tests accordingly

