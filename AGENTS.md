# AGENTS.md - Vivien Development Guide

This file provides guidance for AI agents operating in this repository.

## Project Overview

Vivien is an enterprise and developer-focused error tracking and application performance monitoring platform built with TypeScript.

## Build, Lint, and Test Commands

### Build
```bash
bun build
```
Builds TypeScript files in `./src/` to `./dist/` using Bun, then runs TypeScript declarations.

### Testing
```bash
bun test                          # Run all tests
bun test <path>                  # Run single test file
bun test <directory>             # Run tests in directory
```
Tests use Bun's built-in test runner. All contributions must include tests.

### Type Checking
```bash
npx tsc --noEmit                  # Type check without emitting
```
Uses the TypeScript compiler with strict mode enabled.

---

## Code Style Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | snake_case | `user_name`, `error_count` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_KEY` |
| Functions | snake_case | `get_user()`, `validate_input()` |
| Classes | PascalCase | `Card`, `Monitor`, `Workflow` |
| Methods | camelCase | `log()`, `migrate()`, `resolve()` |
| Types/Interfaces | PascalCase | `HTTPLog`, `MonitorOptions` |

- Prefer single-word names for variables and functions
- Use branded names (PascalCase) for classes when appropriate
- Keep methods one word unless for:
  - Events: `onError()`, `onSuccess()`
  - Checks: `isEnabled()`, `isValid()`
  - Operations: `getUser()`, `fetchData()`

### Import Patterns

- Use `@/` alias for `./src/` imports
- Keep imports clean and minimal
- Group imports logically

```typescript
import { SQLiteError } from "bun:sqlite"
import { SQL } from "bun"
import { ZodError } from "zod"
import { ServerError, ErrorCodes } from "volter/error"
import ansi from "ansi-colors"
```

### File Structure

```
src/
    components/      # UI components (if any)
    services/       # Business logic services
    utils/          # Utility functions
    tests/          # Test files
    lib/            # Library code
    index.ts        # Main exports
```

### TypeScript Configuration

- Strict mode is enabled
- Use `esnext` module and target
- Use `bun` module resolution
- Enable `noUncheckedIndexedAccess`
- Generate declarations to `types/` directory

### Error Handling

- Errors must be predictable and explicit
- Use custom `ServerError` from `volter/error` for application errors
- Use `ZodError` for validation errors
- Handle database errors (`SQLiteError`, `PostgresError`) explicitly
- No hidden or cryptic logic
- Security checks must be obvious at a glance

```typescript
import { ServerError, ErrorCodes } from "volter/error"
import { ZodError } from "zod"

if (error instanceof ZodError) {
    throw new ServerError("Validation failed", {
        code: ErrorCodes.VALIDATION_FAILED,
    })
}
```

### Code Quality Principles

- **Minimal**: Keep code simple and readable
- **Optimized**: Every line should be efficient
- **Secure**: Functions and branches must be explicit
- **Usable**: APIs must be intuitive and predictable
- **Safe**: Code must be tested and reliable

### Best Practices

- Use modern ECMAScript features
- Prefer `for (i = 0; i < len; i++)` loops over `for...in`
- Do not repeat object key calls or function calls - store in local variables
- Functions should do one thing well
- Simplicity over cleverness

### Comments

- Use comments only for documentation, not to explain code
- Any comment style is acceptable

---

## Testing Guidelines

- All contributions must include tests
- Tests must run in both development and production
- Keep tests minimal, fast, and clear
- Test file naming: `*.test.ts` or `*.spec.ts`

---

## Contributing Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Implement changes following Modlin's standards
4. Write or update tests
5. Run `bun test` to ensure tests pass
6. Commit with clear message: `feat:`, `add:`, `fix:`, or `chore:`
7. Open a Pull Request against `main`

---

## Dependencies

- **Runtime**: Bun (latest stable)
- **Validation**: Zod v4
- **Database**: drizzle-orm, bun:sqlite
- **Utilities**: @paralleldrive/cuid2, ansi-colors
- **Error Handling**: volter (workspace)
- **Testing**: bun:test (built-in)

---

## Key Patterns

### Workflow Pattern
The `workflow()` function provides a structured pattern for handling requests:
- Input validation via Zod schemas
- Optional authentication
- Transform, existence, check, and CRUD steps
- Error handling via `onError` callback

### Monitor Pattern
The `Monitor` class handles HTTP request/response logging:
- Supports Redis and SQLite/Postgres
- Custom resolvers for log formatting
- ANSI-colored console output utilities

### Card Validation
The `Card` class and `luhn()` function validate credit card numbers using the Luhn algorithm.

---

## References

- CONTRIBUTING.md - Full contribution guidelines
- tsconfig.json - TypeScript configuration
- package.json - Dependencies and scripts
