# Dependency Graph

> **Metadata**
> - last-updated-by: execute-feature (R6 sync)
> - last-verified-against-code: 2026-07-14
> - staleness-policy: auto-regenerable — can be derived from import analysis tools. Manual content only for conventions and rules that cannot be inferred from code.

> **Overview:** Maps how modules depend on each other. Agents use this to understand the impact of changes. This file is **auto-regenerable** — prefer tool-based import analysis for ground truth, and treat manual entries as supplementary.

---

## Module Dependency Map

```
apps/api
  -> @convorchestrate/core
  -> @convorchestrate/meta-api
  -> @convorchestrate/schemas
  -> @convorchestrate/utils
  -> nestjs-pino, bullmq, ioredis, typeorm
  -> @nestjs/*, @fastify/*, passport, jwt, bcrypt

apps/dashboard
  -> next, react, react-dom
  -> @radix-ui/*, recharts, @monaco-editor/react, lucide-react

packages/core
  -> @convorchestrate/schemas (types + validators)
  -> (self-contained: InMemoryProvider replaces @convorchestrate/memory)

packages/meta-api
  -> (no @convorchestrate/* internal deps — fetch-based, zero runtime deps)

packages/schemas
  -> ajv, ajv-formats, zod

packages/utils
  -> (no internal dependencies)
```

**Removed:** `apps/worker`, `packages/adapters` (whatsapp-web.js), `packages/memory` (Redis) — all superseded by wa-manager rebase

---

## External Dependencies

| Package | Purpose | Used In |
|---------|---------|---------|
| @nestjs/core | NestJS runtime | apps/api |
| @nestjs/common | NestJS decorators, guards | apps/api |
| @nestjs/platform-fastify | Fastify adapter | apps/api |
| @nestjs/config | Env config loading | apps/api |
| @nestjs/jwt | JWT token utilities | apps/api |
| @nestjs/passport | Auth integration | apps/api |
| @nestjs/typeorm | TypeORM NestJS integration | apps/api |
| @fastify/cors | CORS middleware | apps/api |
| @fastify/helmet | Security headers | apps/api |
| @fastify/rate-limit | Rate limiting | apps/api |
| @fastify/multipart | File upload handling | apps/api |
| typeorm | ORM | apps/api |
| pg | Postgres driver | apps/api |
| ioredis | Redis client | apps/api |
| bullmq | Queueing | apps/api |
| reflect-metadata | TypeScript decorator metadata | apps/api |
| rxjs | Reactive extensions | apps/api |
| nestjs-pino | Structured logging | apps/api |
| pino | Logger | apps/api |
| passport + passport-jwt | Auth strategies | apps/api |
| bcrypt | Password hashing | apps/api |
| jsonwebtoken | JWT encode/decode | apps/api |
| ajv + ajv-formats | JSON schema validation | packages/schemas |
| zod | Runtime type validation | packages/schemas |
| next | React framework + SSR | apps/dashboard |
| react + react-dom | UI framework | apps/dashboard |
| @radix-ui/* | Accessible UI primitives | apps/dashboard |
| recharts | Charting library | apps/dashboard |
| @monaco-editor/react | Code editor component | apps/dashboard |
| lucide-react | Icon library | apps/dashboard |

---

## Circular Dependency Warnings

None detected at this time.

---

## Dependency Rules

- packages/core must not import packages/adapters (removed — now uses InMemoryProvider directly)
- apps should import shared packages, not the other way around
- packages/utils must not depend on app code
- Controllers may depend on Services — not the other way around
- packages/meta-api must have zero internal @convorchestrate/* dependencies (pure fetch-based Meta API wrapper)
