# levante-zod

Zod validation schemas and utility functions for the [LEVANTE framework](https://github.com/levante-framework). Published to npm as `@levante-framework/levante-zod`.

## Architecture

This is a pure TypeScript ESM library. It has two primary concerns:

1. **Firebase Functions schemas**, `src/firebase-functions/` — Zod schemas modeling the input params and result type for [LEVANTE Firebase Functions](https://github.com/levante-framework/levante-firebase-functions). Schemas are exported along with its inferred TypeScript type.

2. **CSV validation**, `src/csv/` — Zod schemas, types modeling user-uploaded CSVs used by the [LEVANTE Dashboard](https://github.com/levante-framework/levante-dashboard).

## Coding conventions

- **TypeScript strict mode** — All compiler strictness flags are on (see `tsconfig.json`). No `any`, no implicit returns, no unused locals/parameters, `exactOptionalPropertyTypes`.
- **ESM only** — Use `import`/`export`, never `require`.
- **Zod v4** — Use `z.iso.datetime()` for timestamps, `.superRefine(...)` for cross-field validation. Do not use deprecated v3 APIs.
- **Linting/formatting** — [Biome](https://biomejs.dev) enforces style. Single quotes, 2-space indent. Run `npm run check` before committing; run `npm run check:fix` to auto-fix.
- **Naming** — Schemas/types are `PascalCase`, e.g., `GetSiteOverviewParamsSchema`; helper functions use `camelCase`, e.g., `makeCustomIssue`.
- **No side effects** — The package is marked `"sideEffects": false`. All exports are pure.
- **Comments** — Only add comments for non-obvious intent. In-code `@` comments are open design questions that require team discussion before resolving; do not silently resolve them.
- **Docstrings** — Use JSDoc-style docstrings to give useful information to consumers via LSP.

## Zod conventions

- **Always use the namespace import for Zod** — Import Zod as `import * as z from 'zod';`. Never use named imports (e.g. `import { z } from 'zod'`) or default imports.

- **Prefer inline `.superRefine(fn)` over `.check(z.superRefine(fn))`** — Both are equivalent, but inline `.superRefine` is simpler for schema-specific logic. Only reach for `.check(z.superRefine(...))` when the refinement is genuinely shared across multiple schemas or when batching several checks in one call.

- **Avoid `z.nonempty`, `z.min`, and `z.max` on strings and arrays** — These length constraints emit a redundant `too_small`/`too_big` issue on top of `invalid_type` for some inputs. Use `z.superRefine` instead so invalid types produce only a single `invalid_type` issue. Mirror Zod's built-in shape (`too_small`/`too_big` with `inclusive`, `minimum`/`maximum`, `origin`) rather than a generic `custom` code.

```ts
// Prefer this:
.superRefine((data, ctx) => {
  if (data.users.length === 0) {
    ctx.addIssue(
      makeTooSmallIssue({
        input: data.users,
        minimum: 1,
        origin: 'array',
        path: ['users'],
      }),
    );
    return;
  }
  if (data.users.length > 1000) {
    ctx.addIssue(
      makeTooBigIssue({
        input: data.users,
        maximum: 1000,
        origin: 'array',
        path: ['users'],
      }),
    );
    return;
  }
})

// Over this:
users: z.array(UserSchema).nonempty().max(1000)
```

## Testing

```
npm test
npm run test:coverage
```

Colocate test files. Use [Vitest](https://vitest.dev) (`describe`/`it`/`expect`). Aim for full branch coverage of validation logic.

When adding or changing a schema or helper, add corresponding tests. Edge cases to cover: boundary values, type coercion, missing required fields, cross-field validation rules.

When a test asserts against a Zod issue, cover all of its `code`, `message`, and `path` so regressions in any of them are caught.

Use property-based testing (i.e. [fast-check](https://fast-check.dev)) when a validator has a large or complex input space — for example, cross-field rules, regex patterns, or numeric ranges — where exhaustive example-based tests would be impractical.

## Build

```
npm run build
```

Only the `dist/` directory is published (see `"files"` in `package.json`).

## What not to touch

- `dist/` — generated, never edit manually.
- `package-lock.json` — update only via `npm install` / `npm ci`.
- Version field in `package.json` — managed by the publish workflow via `npm version`.
