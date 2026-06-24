# Lessons Learned

This file captures development process insights and patterns worth repeating.
It is distinct from error tracking and focuses on workflow improvements.
Add entries when a practice clearly improves speed or quality.
No lessons have been recorded yet.

## Lessons

## `import type` breaks NestJS Dependency Injection (2026-06-24)

NestJS uses `reflect-metadata` at runtime to inspect constructor parameter types. When you use `import type { QueueService }`, TypeScript erases the import entirely from the compiled JS output. At runtime, the parameter type resolves to `Function` (or `undefined`), and Nest throws "can't resolve dependencies".

**Fix:** Use `import { QueueService, type SomeType }` — regular import for classes (kept at runtime), `type` prefix for pure type-only exports.

**Detection:** The error shows `argument Function at index [N]` instead of the actual class name. If you see this, check for `import type` on injectable providers.

## Fastify Plugin Version Compatibility (2026-06-24)

NestJS 10 uses Fastify 4.x internally (`@nestjs/platform-fastify@10` → `fastify@4`). The `@fastify/*` plugin ecosystem has SemVer-major versions that target Fastify 5. Installing e.g. `@fastify/helmet@13` produces a runtime warning: "expected '5.x' fastify version, '4.x' is installed".

The plugin may still load, but version-mismatched plugins can cause undefined behaviour.

**Fix:** Always check `npm view @fastify/<name> versions` and install the latest version that targets Fastify 4. Known compatible versions:

| Plugin                | Fastify 5 version | Fastify 4 version |
| --------------------- | ----------------- | ----------------- |
| `@fastify/helmet`     | 13.x              | 11.x              |
| `@fastify/rate-limit` | 11.x              | 9.x               |
| `@fastify/multipart`  | 9.x               | 8.x               |

## `__dirname` resolution in monorepo with ts-node-dev (2026-06-24)

In a monorepo where source files live in `apps/api/src/` and the `.env` is at the repo root, `resolve(__dirname, '../../.env')` is WRONG.

From `convorchestrate/apps/api/src/`:

- `../../` only goes to `convorchestrate/apps/` (up from `src` to `api`, then `api` to `apps`) — not the project root.
- Need `../../../` to reach the project root from `src/`.

From `convorchestrate/apps/api/dist/` (compiled):

- Need `../../../` as well (from `dist` up to `api`, to `apps`, to root).

Both dev (ts-node) and prod (compiled) work with `../../../.env`.

**Fix:** Always verify relative path resolution against the actual `__dirname` at runtime. Add a quick inline test:

```ts
const { resolve } = require("path");
console.log(resolve(__dirname, "../../../.env"));
```

## typeorm:generate is destructive in shared-DB migrations (2026-06-24)

Running `typeorm migration:generate` on a schema that's already partially synced produces a migration that drops and recreates every constraint, index, and column — even unchanged ones. This is because TypeORM diffs the entity decorators against the current DB state, not against the last migration.

**Fix:** For targeted schema changes (add a table, alter a column), write migrations manually using `queryRunner.query()`. Only use `migration:generate` for the initial schema, or when you want to drop and recreate everything.

## TypeORM CLI must load env separately from Nest (2026-06-24)

`typeorm-ts-node-commonjs` runs `src/db/data-source.ts` directly, so Nest `ConfigModule.forRoot()` does not help migration commands. If the data source reads `process.env.DATABASE_URL`, load the repo-root `.env` inside the data source itself and validate the value before constructing `DataSource`.
