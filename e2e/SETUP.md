# E2E Testing Setup Guide

This guide will help you set up and run E2E tests for the 10x Cards application.

## Prerequisites

Before running E2E tests, ensure you have:

1. **Node.js** installed (v22.14.0 or higher)
2. **A test Supabase project** separate from your production database
3. **Test environment variables** configured
4. **Test user account** created in your test Supabase database

## Initial Setup

### 1. Install Dependencies

All dependencies should already be installed, but if needed:

```bash
npm install
```

### 2. Install Playwright Browsers

Install the Chromium browser for E2E testing:

```bash
npx playwright install chromium --with-deps
```

### 3. Configure Test Environment

Create a `.env.test` file in the project root with your test Supabase credentials:

```env
# Supabase Test Database
PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
PUBLIC_SUPABASE_KEY=your-test-anon-key

# Test User Credentials (create this user in your test database)
E2E_USERNAME=test@10xcards.test
E2E_PASSWORD=TestPassword123!

# Playwright Configuration
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

**Important:** Create a test user account in your Supabase test database with the credentials specified in `E2E_USERNAME` and `E2E_PASSWORD`. All E2E tests will use this shared account and clean up their data after each test.

**Important:** 
- Use a **separate Supabase project** for testing
- Never use production credentials in `.env.test`
- The `.env.test` file is gitignored for security

### 4. Verify Setup

Run a quick test to verify everything is configured correctly:

```bash
npm run test:e2e:headed
```

This will run tests in headed mode so you can see what's happening.

## Running Tests

### Development

When developing new tests or debugging:

```bash
# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Headed mode (see the browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Production/CI

For automated testing:

```bash
# Headless mode (default)
npm run test:e2e

# With HTML report
npm run test:e2e && npx playwright show-report
```

## Test Database Setup

Your test Supabase database should have the same schema as production:

1. Create a new Supabase project for testing
2. Run all migrations from `supabase/migrations/` on the test database
3. Ensure RLS policies are configured correctly (note: backend tables have RLS disabled)
4. Create a test user with credentials matching `E2E_USERNAME` and `E2E_PASSWORD` from `.env.test`

You can use Supabase CLI to link to your test project:

```bash
# Link to test project
supabase link --project-ref your-test-project-ref

# Push migrations
supabase db push
```

## Continuous Integration

The E2E tests are configured to run in CI environments with:

- Headless mode
- 2 retries on failure
- Single worker for consistency
- HTML report generation

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install chromium --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    PUBLIC_SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests fail with "Cannot connect to Supabase"

- Verify `.env.test` has correct Supabase credentials
- Check that your test Supabase project is accessible
- Ensure RLS policies are properly configured

### Tests fail with "Page timeout"

- Ensure the dev server is running (started automatically by Playwright)
- Check if port 3000 is available
- Increase timeout in `playwright.config.ts` if needed
- Verify test database is accessible and has migrations applied

### Browser doesn't launch

- Reinstall Playwright browsers: `npx playwright install chromium --with-deps`
- Check for system dependencies (Linux): https://playwright.dev/docs/browsers#install-system-dependencies
- Verify no antivirus is blocking the browser

### Tests pass locally but fail in CI

- Check environment variables are set in CI
- Ensure test database is accessible from CI environment
- Verify browser dependencies are installed in CI

## Best Practices

1. **Isolated Tests**: Each test should be independent with automatic database cleanup
2. **Clean State**: Tests use a shared user account with `beforeEach` cleanup to avoid conflicts
3. **Serial Execution**: Tests run sequentially to prevent database race conditions
4. **Fast Feedback**: Run tests frequently during development using UI mode
5. **Readable Tests**: Use descriptive test names and follow Arrange-Act-Assert pattern
6. **Resilient Selectors**: Prefer `data-testid` attributes over CSS selectors
7. **Wait Strategies**: Wait for specific elements rather than arbitrary timeouts

## Next Steps

- Read the [E2E README](./README.md) for more details on test structure
- Explore existing tests in `e2e/tests/`
- Review page objects in `e2e/page-objects/`
- Write new tests for additional features

## Support

For issues or questions:
- Check [Playwright Documentation](https://playwright.dev/)
- Review existing tests for examples
- Check troubleshooting section above

