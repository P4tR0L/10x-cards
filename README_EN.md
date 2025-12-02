# 10x Cards

A modern AI-powered flashcard learning application. Create flashcards manually or generate them automatically from any text using AI.

## ✨ Features

- 🤖 **AI Flashcard Generation** - Automatically generate flashcards from source text
- ✍️ **Manual Creation** - Create your own flashcards from scratch
- 📚 **Flashcard Management** - Edit, delete, and organize your flashcards
- 🔄 **Study Mode** - Review flashcards with an intuitive interface
- 👆 **Touch Gestures** - Swipe navigation on mobile devices
- 📊 **Metrics** - Track AI generation effectiveness
- 🔐 **Authentication** - Secure user accounts with Supabase Auth

## 🛠️ Technology Stack

### Frontend

- [Astro](https://astro.build/) v5 - Modern framework for fast web applications
- [React](https://react.dev/) v19 - Library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components based on Radix UI
- [Lucide React](https://lucide.dev/) - SVG icons
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

### Backend & Database

- [Supabase](https://supabase.com/) - Backend-as-a-Service (PostgreSQL, authentication)
- [OpenRouter](https://openrouter.ai/) - AI models API

### Forms & Validation

- [React Hook Form](https://react-hook-form.com/) - Form management
- [Zod](https://zod.dev/) - TypeScript schema validation

### Testing

- [Vitest](https://vitest.dev/) - Unit testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React component testing
- [Playwright](https://playwright.dev/) - E2E tests

### Development Tools

- [ESLint](https://eslint.org/) - JavaScript/TypeScript linter
- [Prettier](https://prettier.io/) - Code formatter
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [Lint-staged](https://github.com/okonet/lint-staged) - Pre-commit linting

### Deployment

- [Cloudflare Pages](https://pages.cloudflare.com/) - Application hosting
- [GitHub Actions](https://github.com/features/actions) - CI/CD pipeline

## 📋 Requirements

### Basic Requirements

- Node.js v22.14.0 (or newer)
- npm (included with Node.js)
- OpenRouter API key (for AI flashcard generation)

### Supabase Requirements

You can use **one of two options**:

#### Option A: Supabase Cloud (easier)
- Supabase account ([create for free](https://supabase.com))
- Supabase project in the cloud

#### Option B: Local Supabase (for offline development)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
  - ⚠️ **Windows/Mac**: Docker Desktop is required
  - Linux: Docker Engine is sufficient
- Supabase CLI (installed automatically via `npm install`)

## 🚀 Getting Started

### Common Steps

1. **Clone the repository:**

```bash
git clone <repository-url>
cd 10x-cards
```

2. **Install dependencies:**

```bash
npm install
```

---

### Option A: Supabase Cloud (Recommended for new users)

3. **Create a project in Supabase Cloud:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save the URL and anon key (found in Project Settings → API)

4. **Configure environment variables:**

Create a `.env` file in the project root:

```env
# Supabase Cloud
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Site URL
SITE_URL=http://localhost:4321
```

5. **Run database migrations:**

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

*(Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your Supabase Dashboard credentials)*

6. **Start the development server:**

```bash
npm run dev
```

7. **Open the application:**

Navigate to [http://localhost:4321](http://localhost:4321) in your browser

---

### Option B: Local Supabase (For advanced users)

3. **Install and run Docker Desktop:**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Install and launch the application
   - Ensure Docker Desktop is running (icon in tray)
   - ⚠️ **Windows**: Docker Desktop must be running **before** the next steps

4. **Initialize local Supabase:**

```bash
npx supabase start
```

*First run may take several minutes (downloading Docker images)*

5. **Configure environment variables:**

After running `supabase start`, you'll receive access credentials. Create a `.env` file:

```env
# Local Supabase (default values)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=your-anon-key

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Site URL
SITE_URL=http://localhost:4321
```

6. **Run database migrations:**

```bash
npx supabase db push
```

7. **Start the development server:**

```bash
npm run dev
```

8. **Open the application:**

Navigate to [http://localhost:4321](http://localhost:4321) in your browser

**Useful local Supabase commands:**
```bash
npx supabase status          # Check status and access credentials
npx supabase stop            # Stop Supabase
npx supabase db reset        # Reset database to clean state
```

**Supabase Studio (local dashboard):**
After running `supabase start`, you can manage the database through the web interface:
- URL: http://127.0.0.1:54323
- Browse tables, run SQL queries, manage users

---

### 🆘 Configuration Issues?

**Docker not working:**
- Windows: Ensure WSL 2 is installed and enabled
- Check that Docker Desktop is running (icon in tray)
- Restart Docker Desktop and try again

**Supabase won't start locally:**
```bash
npx supabase stop
npx supabase start
```

**Migration error:**
- Ensure Supabase (cloud or local) is running
- Check the connection string / environment variables are correct

## 📦 Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build
- `npm run lint` - Checks code with ESLint
- `npm run lint:fix` - Fixes ESLint issues
- `npm run format` - Formats code with Prettier
- `npm run test` - Runs unit tests
- `npm run test:ui` - Runs tests in UI mode
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:coverage` - Generates test coverage report
- `npm run test:e2e` - Runs E2E tests with Playwright
- `npm run test:e2e:ui` - Runs E2E tests in UI mode
- `npm run test:e2e:headed` - Runs E2E tests with visible browser
- `npm run test:e2e:debug` - Runs E2E tests in debug mode

## 🚀 Deployment to Cloudflare Pages

The application is configured for automatic deployment to Cloudflare Pages using GitHub Actions.

### Quick start

1. **Configure secrets in GitHub** (8 variables - see [CLOUDFLARE_DEPLOYMENT.md](.github/CLOUDFLARE_DEPLOYMENT.md))
2. **Add environment variables in Cloudflare Pages** (5 variables)
3. **Run workflow** manually or push to `master`

### Documentation

- 📖 [Full deployment documentation](.github/CLOUDFLARE_DEPLOYMENT.md)
- 🚑 [Quick troubleshooting guide](.github/QUICK_FIX.md)

### CI/CD Workflow

The project has two workflows:

- **tests-validation.yml** - Runs on PR to master (lint, unit tests, E2E tests)
- **master.yml** - Automatic deployment to Cloudflare Pages (lint, unit tests, build, deploy)

## 📁 Project Structure

```md
.
├── .cursor/
│ └── rules/ # AI rules for Cursor IDE
├── .github/
│ └── workflows/ # GitHub Actions (CI/CD)
├── src/
│ ├── components/ # UI components (Astro & React)
│ │ └── ui/ # Shadcn/ui components
│ ├── db/ # Supabase clients and database types
│ ├── hooks/ # Custom React hooks
│ ├── layouts/ # Astro layouts
│ ├── lib/ # Services and helpers
│ │ ├── client/ # Client-side logic
│ │ ├── services/ # Business logic (flashcards, AI generation)
│ │ │ └── __tests__/ # Service unit tests
│ │ ├── utils/ # Helper functions
│ │ ├── validation/ # Zod validation schemas
│ │ ├── api-client.ts # API client
│ │ └── utils.ts # Helper functions (cn, etc.)
│ ├── middleware/ # Astro middleware (authentication)
│ ├── pages/ # Astro pages
│ │ ├── api/ # API endpoints
│ │ │ ├── auth/ # Authentication (logout, set-session)
│ │ │ ├── flashcards/ # Flashcard CRUD
│ │ │ └── generations/ # AI generation and metrics
│ │ └── auth/ # Authentication pages (callback)
│ ├── styles/ # Global styles
│ ├── test/ # Test configuration
│ └── types.ts # Common TypeScript types
├── e2e/
│ ├── tests/ # Playwright E2E tests
│ ├── page-objects/ # Page Object Model
│ └── helpers/ # Test helpers
├── supabase/
│ ├── migrations/ # Database migrations
│ ├── templates/ # Email templates
│ └── config.toml # Supabase configuration
└── public/ # Public assets
```

## 🗄️ Database

The project uses Supabase PostgreSQL with the following tables:

- **flashcards** - Stores user flashcards (manual and AI-generated)
- **generations** - AI generation session metrics
- **generation_error_logs** - AI generation error logs

Row Level Security (RLS) is enabled for all tables ensuring data security.

## 🔐 Authentication

The application uses Supabase Auth for user management. Astro middleware secures routes requiring authentication and automatically redirects unauthenticated users.

## 🌐 API Endpoints

The application exposes REST API endpoints:

### Authentication

- `POST /api/auth/logout` - Log out user
- `POST /api/auth/set-session` - Set session after callback

### Flashcards

- `GET /api/flashcards` - Get list of flashcards (with pagination and filtering)
- `POST /api/flashcards` - Create a new flashcard
- `POST /api/flashcards/batch` - Create multiple flashcards (batch create from AI)
- `PATCH /api/flashcards/[id]` - Update a flashcard
- `DELETE /api/flashcards/[id]` - Delete a flashcard

### AI Generation

- `POST /api/generations` - Generate flashcards with AI
- `GET /api/generations` - Get generation metrics

All endpoints require authentication (except `/api/auth/set-session`).

## 🤖 AI Generation

Flashcards can be automatically generated from source text using various AI models through OpenRouter. The application tracks:

- Number of generated flashcards
- Acceptance without edits
- Acceptance after edits
- Generation time
- Source text length

## 🔬 Testing

The project uses a comprehensive testing strategy with unit and E2E tests, ensuring high code quality and application reliability.

### Unit Tests

Unit tests use Vitest and React Testing Library:

- **Vitest** - Fast and modern testing framework
- **React Testing Library** - For testing React components the way users interact with them
- **jsdom** / **happy-dom** - Environments for testing virtual DOM code
- **Vitest Coverage** - For generating test coverage reports

Unit tests are located in the `src/lib/services/__tests__/` directory with test documentation in `.md` files.

**Current coverage:**

- Services (flashcard.service, openrouter.service)
- Zod validations

**Test structure:**

- `src/lib/services/__tests__/flashcard.service.*.test.ts` - Flashcard service tests
- `src/lib/services/__tests__/openrouter.service.*.test.ts` - AI generation tests
- Each test has a README.md file describing the testing strategy

### E2E Tests

E2E tests use Playwright for comprehensive user flow testing:

- **Playwright** - Modern E2E testing framework
- **Page Object Model** - Design pattern for maintainable tests
- **data-testid selectors** - Resilient selectors for stable tests
- **Automatic browser management** - Chromium with automatic configuration
- **Test isolation** - Automatic database cleanup between tests
- **Serial mode** - Tests run sequentially to avoid database conflicts

**Current coverage:**

- Flashcard lifecycle (login → create → review)
- Multiple flashcards handling
- Immediate review availability

E2E tests are located in the `e2e/` directory:

- `e2e/tests/` - Test specifications
- `e2e/page-objects/` - Page Objects (LoginPage, CreateFlashcardPage, ReviewPage)
- `e2e/helpers/` - Test helpers (auth, database cleanup)

To run E2E tests:

```bash
# Install browsers (one-time)
npx playwright install chromium --with-deps

# Run tests
npm run test:e2e

# UI mode (recommended for development)
npm run test:e2e:ui
```

Detailed documentation: [E2E Setup Guide](./e2e/SETUP.md)

## 🎨 Styling

The project uses Tailwind CSS 4 with Shadcn/ui components. All components are fully customizable and responsive.

## 🛠️ Development Tools

The project uses modern tools to ensure high code quality:

### Linting and Formatting

- **ESLint** - Static code analysis for TypeScript/React/Astro
  - Configuration: `eslint.config.js`
  - Plugins: React, React Hooks, JSX a11y, Import, Prettier
  - `npm run lint` - Check code
  - `npm run lint:fix` - Automatically fix errors

- **Prettier** - Automatic code formatting
  - Integration with ESLint
  - `npm run format` - Format all files
  - Supports: TypeScript, React, Astro, JSON, CSS, Markdown

### Git Hooks

- **Husky** - Automatically run scripts before commit
  - Pre-commit hook for lint-staged

- **Lint-staged** - Linting and formatting only changed files
  - `*.{ts,tsx,astro}` → ESLint fix
  - `*.{json,css,md}` → Prettier format

### Test Environments

- **Vitest** - Unit testing framework (config: `vitest.config.ts`)
- **Playwright** - E2E testing framework (config: `playwright.config.ts`)
- **jsdom/happy-dom** - Virtual DOM for tests

## 🧪 Best Practices

The project follows best practices defined in AI rules:

### Architecture and Code

- **Clean Code** - Early returns, error handling at the beginning of functions
- **Separation of Concerns** - Separation of business logic (services) from UI (components)
- **Type Safety** - Full use of TypeScript with strictNullChecks
- **Validation** - Data validation with Zod on frontend and backend
- **Error Handling** - Consistent error handling with custom error types

### UI/UX

- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **User Feedback** - Toast notifications for all user actions
- **Loading States** - Clear loading and error states

### Testing

- **Test Coverage** - Unit tests for business logic
- **E2E Tests** - Comprehensive user flow tests
- **Page Object Pattern** - Maintainable and reusable E2E tests

### Git and CI/CD

- **Pre-commit Hooks** - Automatic lint and format before commit
- **Continuous Integration** - Automatic tests on PR
- **Continuous Deployment** - Automatic deployment to Cloudflare Pages

## 📝 AI Development Support

The project is configured to work with AI development tools:

- **Cursor IDE** - AI rules in `.cursor/rules/`
- Consistent naming conventions and structure
- Extensive documentation in code

## 🤝 Contributing

When making changes:

1. Follow the project structure defined in AI rules
2. Add tests for new functionality
3. Ensure linter passes (`npm run lint`)
4. Format code (`npm run format`)

## 🔗 Related Documents

- [PRD - Product Requirements Document](./.ai/prd.md) - Original MVP requirements document
- [PRD vs Implementation - Review](./.ai/prd-implementation-review.md) - Comparison of PRD with actual implementation
- [E2E Tests Documentation](./e2e/README.md)
- [E2E Tests Setup Guide](./e2e/SETUP.md)
- [Deployment Documentation](./.github/CLOUDFLARE_DEPLOYMENT.md)

## 📄 License

MIT
