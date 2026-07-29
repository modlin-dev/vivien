# Contributing to Vivien by Modlin

Thank you for considering contributing to Modlin. Our goal is to build developer tools and products that are **minimal, optimized, secure, usable, and safe**. This document describes the standards and workflow you must follow when contributing.

## Code of Conduct

By participating, you agree to maintain a professional and respectful environment. We follow the [Contributor Covenant 3.0](/CODE_OF_CONDUCT.md) Code of Conduct.

## Principles

- **Minimal**: Code must be simple to read and use.
- **Optimized**: Every line should be efficient and purposeful.
- **Secure**: Functions and branches must be explicit and safe.
- **Usable**: APIs must be intuitive and predictable.
- **Safe**: Code must be tested and reliable across dev and prod.

## Development Environment

- **Language:** TypeScript, using modern ECMAScript features.
- **Package policy:**
    - Use only the latest stable versions.
    - Avoid unoptimized or unnecessary packages.
    - If a solution does not exist, create a new one-word branded tool or function.

## Naming Conventions

- **Variables:** snake_case
    - Try using a single lowercase word.
- **Constants:** UPPER_SNAKE_CASE
    - Use only when something is not defined during runtime.
- **Functions:** snake_case
    - Try keeping it one worded that just describes what it does e.g. `hash` is used for hashing `string` to `SHA-256`.
- **Classes:** PascalCase
    - Preferably branded (`Resend`, `Volter`).
- **Methods:** camelCase
    - Keep it one word unless for events (`onError()`), checks (`isEnabled()`), or operations (`getUser()`).
- **Types / Interfaces / Namespaces**: PascalCase
    - With clear names.
- **Comments:** Any
    - Only for documentation, not for explaining code.

## Code Style

- Use modern, clean syntax.
- Prefer `for (i = 0; i < len; i++)` loops over `for...in`.
- Do not repeat object key calls or function calls. Store results in a local variable.
- Use the `@/` alias for `./src/`.
- Follow a standard file structure:

```
src/
    components/
    services/
    utils/
    tests/
    lib/
    index.ts
```

## Accessibility and Standards

- All web code must follow **[a11y standards](https://developer.mozilla.org/en-US/docs/Web/Accessibility)**.
- All web/server code must comply with **[WinterTC (formerly WinterCG) standards](https://wintertc.org/)**.

## Error Handling and Security

- Error handling must be predictable and explicit.
- No hidden or cryptic logic.
- Security checks must be obvious at a glance.

## Testing

- All contributions must include tests written with `bun test`.
- Tests must run in both development and production environments.
- Keep tests minimal, fast, and clear.

## Best Practices

- Simplicity over cleverness.
- Functions must do one thing well.
- Use modern ECMAScript features where they improve clarity.
- Imports must be clean and minimal.

## Contribution Workflow

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Implement changes following Modlin’s standards.
4. Write or update tests.
5. Run `bun test` to ensure all tests pass.
6. Commit changes with a clear message:
    - `feat: description`
    - `add: description`
    - `fix: description`
    - `chore: description`
7. Open a Pull Request against `main`.
8. A maintainer will review your changes.

## Commit Messages

Commit changes with a clear message:
    - `feat: description`
    - `add: description`
    - `fix: description`
    - `chore: description`

## Pull Request Guidelines

- Keep PRs small and focused.
- Write clear descriptions of what is being changed and why.
- Link related issues.
- Ensure all CI checks pass before requesting review.

## Licensing

By contributing, you agree that your contributions will be licensed under the project’s license. See [LICENSE](/LICENSE) for details.
