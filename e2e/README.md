# E2E Tests with Playwright

This directory contains end-to-end (E2E) tests for the 10x Cards application using Playwright.

## Structure

```
e2e/
├── helpers/           # Reusable test helpers and utilities
│   ├── auth.ts       # Authentication helpers (login)
│   └── database.ts   # Database cleanup utilities
├── page-objects/     # Page Object Model implementations
│   ├── LoginPage.ts
│   ├── CreateFlashcardPage.ts
│   └── ReviewPage.ts
├── tests/            # Test specifications
│   └── flashcard-lifecycle.spec.ts
├── README.md         # This file
└── SETUP.md          # Setup and configuration guide
```

## Running Tests

### Prerequisites

1. Ensure you have a test Supabase database configured in `.env.test`
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install chromium`

### Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/tests/flashcard-lifecycle.spec.ts

# Run tests matching pattern
npx playwright test --grep "should allow user to login"
```

## Test Structure

All tests follow the **Arrange-Act-Assert** pattern for clarity:

```typescript
test('test description', async ({ page }) => {
  // Arrange - Set up test data and preconditions
  const flashcardFront = 'Question';
  const flashcardBack = 'Answer';

  // Act - Perform actions
  await loginAsTestUser(page);
  await createPage.createFlashcard(flashcardFront, flashcardBack);

  // Assert - Verify outcomes
  await expect(createPage.successMessage).toBeVisible();
});
```

## Page Object Model

We use the Page Object Model (POM) pattern to:
- Encapsulate page interactions
- Improve test maintainability
- Reduce code duplication
- Make tests more readable

Example:

```typescript
import { CreateFlashcardPage } from '../page-objects/CreateFlashcardPage';

await page.goto('/');
const createPage = new CreateFlashcardPage(page);
await createPage.switchToManualTab();
await createPage.createFlashcard('Front', 'Back');
```

## Best Practices

### Selectors

1. **Prefer `data-testid` attributes** for test-specific selectors:
   ```typescript
   page.getByTestId('flashcard-front')
   ```

2. **Use semantic selectors** when `data-testid` is not available:
   ```typescript
   page.locator('button[type="submit"]')
   page.locator('text=/Dodaj fiszkę/')
   ```

3. **Avoid fragile selectors**:
   - ❌ `page.locator('.class-name-123')`
   - ❌ `page.locator('div > div > button')`
   - ✅ `page.locator('button', { hasText: 'Submit' })`

### Test Isolation

- Each test should be independent
- Use browser contexts for isolation
- Tests run serially to avoid database conflicts
- Clean up test data using `beforeEach` hook

### Assertions

- Use specific matchers:
  ```typescript
  await expect(element).toBeVisible();
  await expect(element).toHaveText('Expected text');
  await expect(page).toHaveURL('/expected-path');
  ```

### Performance

- Tests run serially by default to avoid database conflicts
- Use `page.waitForLoadState()` sparingly
- Prefer waiting for specific elements over arbitrary timeouts
- Clean up test data in `beforeEach` for isolation

## Environment Variables

Create a `.env.test` file with your test Supabase credentials:

```env
PUBLIC_SUPABASE_URL=your_test_supabase_url
PUBLIC_SUPABASE_KEY=your_test_supabase_anon_key
E2E_USERNAME=test@10xcards.test
E2E_PASSWORD=TestPassword123!
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Test Coverage

Current test suites:

- ✅ **Flashcard Lifecycle** - Core user journey (login → create → review)
- ✅ **Multiple Flashcards** - Creating and reviewing multiple flashcards
- ✅ **Immediate Review** - Flashcards available for review after creation

All tests use a shared test user account with automatic database cleanup between tests.

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### Step-by-Step Debugging

```bash
# Debug mode with step-through
npm run test:e2e:debug
```

### Trace Viewer

After a test failure, view the trace:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

- Screenshots are captured on failure
- Videos are retained on failure
- Located in `test-results/` directory

## CI/CD Integration

In CI environments, tests:
- Run in headless mode
- Retry failed tests up to 2 times
- Use a single worker for consistency
- Generate HTML reports

## Writing New Tests

1. Create a new test file in `e2e/tests/`
2. Import necessary page objects from `e2e/page-objects/`
3. Use helpers from `e2e/helpers/` for common tasks (auth, database cleanup)
4. Follow the Arrange-Act-Assert pattern
5. Add descriptive test names
6. Use `data-testid` selectors where needed
7. Use `test.describe.configure({ mode: "serial" })` for tests that share database state

Example:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';
import { deleteAllFlashcards, waitForDatabaseSync } from '../helpers/database';
import { CreateFlashcardPage } from '../page-objects/CreateFlashcardPage';

test.describe('Feature Name', () => {
  // Run tests serially to avoid database conflicts
  test.describe.configure({ mode: "serial" });

  // Clean up before each test
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await deleteAllFlashcards(page);
    await waitForDatabaseSync();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/');
    const createPage = new CreateFlashcardPage(page);
    
    // Act
    await createPage.switchToManualTab();
    await createPage.createFlashcard('Front', 'Back');
    
    // Assert
    await expect(createPage.successMessage).toBeVisible();
  });
});
```

## Troubleshooting

### Test fails with "element not found"

- Check if the element exists in the DOM
- Verify selector syntax
- Wait for page load state if needed
- Use `page.pause()` to inspect the page

### Test times out

- Increase timeout in `playwright.config.ts`
- Check if server is running
- Verify network connectivity
- Look for blocking operations

### Browser not launching

- Reinstall browsers: `npx playwright install chromium`
- Check system dependencies
- Verify antivirus settings

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

