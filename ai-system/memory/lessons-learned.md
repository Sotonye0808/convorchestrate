# Lessons Learned

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Practical knowledge accumulated during development — things that worked well, things that didn't, and patterns worth repeating. Different from `repair-system.md` (tracks errors); this file tracks development process insights and architectural wisdom. Uses supersedes/superseded-by links for evolving practices.

---

## Entry Format

```
## [Lesson Title]

**Context:**
[What situation this came from]

**What We Learned:**
[The insight or pattern discovered]

**Apply When:**
[When future agents/developers should use this knowledge]

**Supersedes:** [link to any prior lesson this replaces, or None]
**Superseded by:** [link to any newer lesson that replaces this, or None]
```

---

## Lessons

## `import type` Breaks NestJS Dependency Injection

**Context:**
NestJS uses `reflect-metadata` at runtime to inspect constructor parameter types. When you use `import type { QueueService }`, TypeScript erases the import entirely from the compiled JS output. At runtime, the parameter type resolves to `Function` (or `undefined`), and Nest throws "can't resolve dependencies".

**What We Learned:**
Use `import { QueueService, type SomeType }` — regular import for classes (kept at runtime), `type` prefix for pure type-only exports.

**Apply When:**
Whenever importing injectable NestJS providers. The error shows `argument Function at index [N]` instead of the actual class name. If you see this, check for `import type` on injectable providers.

**Supersedes:** None
**Superseded by:** None

## Fastify Plugin Version Compatibility

**Context:**
NestJS 10 uses Fastify 4.x internally (`@nestjs/platform-fastify@10` -> `fastify@4`). The `@fastify/*` plugin ecosystem has SemVer-major versions that target Fastify 5.

**What We Learned:**
Always check `npm view @fastify/<name> versions` and install the latest version that targets Fastify 4. Known compatible versions: `@fastify/helmet@11`, `@fastify/rate-limit@9`, `@fastify/multipart@8`.

**Apply When:**
Adding or updating any `@fastify/*` plugin.

**Supersedes:** None
**Superseded by:** None

## `__dirname` Resolution in Monorepo with ts-node-dev

**Context:**
In a monorepo where source files live in `apps/api/src/` and the `.env` is at the repo root, `resolve(__dirname, '../../.env')` is WRONG. From `convorchestrate/apps/api/src/`, `../../` only goes to `convorchestrate/apps/`.

**What We Learned:**
Need `../../../.env` to reach the project root from `src/`. Both dev (ts-node) and prod (compiled) work with `../../../.env`.

**Apply When:**
Setting up relative path resolution in monorepo packages.

**Supersedes:** None
**Superseded by:** None

## typeorm:generate is Destructive in Shared-DB Migrations

**Context:**
Running `typeorm migration:generate` on a schema that's already partially synced produces a migration that drops and recreates every constraint, index, and column.

**What We Learned:**
For targeted schema changes (add a table, alter a column), write migrations manually using `queryRunner.query()`. Only use `migration:generate` for the initial schema.

**Apply When:**
Writing TypeORM migrations for an existing schema.

**Supersedes:** None
**Superseded by:** None

## TypeORM CLI Must Load Env Separately from Nest

**Context:**
`typeorm-ts-node-commonjs` runs `src/db/data-source.ts` directly, so Nest `ConfigModule.forRoot()` does not help migration commands.

**What We Learned:**
Load the repo-root `.env` inside the data source itself and validate the value before constructing `DataSource`.

**Apply When:**
Configuring TypeORM data source files for CLI use.

**Supersedes:** None
**Superseded by:** None
