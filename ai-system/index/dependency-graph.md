# Dependency Graph

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-01
> - staleness-policy: auto-regenerable — can be derived from import analysis tools. Manual content only for conventions and rules that cannot be inferred from code.

> **Overview:** Maps how modules depend on each other. Agents use this to understand the impact of changes. This file is **auto-regenerable** — prefer tool-based import analysis for ground truth, and treat manual entries as supplementary.

---

## Module Dependency Map

```
apps/api
  -> @convorchestrate/core
  -> @convorchestrate/memory
  -> @convorchestrate/adapters
  -> @convorchestrate/schemas
  -> @convorchestrate/utils
  -> nestjs-pino, bullmq, ioredis, typeorm
  -> @nestjs/*, @fastify/*, passport, jwt, bcrypt

apps/worker
  -> @nestjs/common, @nestjs/core, reflect-metadata, rxjs
  -> (no @convorchestrate/* direct dependency)

apps/dashboard
  -> react, react-dom, react-router-dom
  -> axios, recharts, @monaco-editor/react

packages/core
  -> @convorchestrate/schemas
  -> @convorchestrate/memory (interfaces only)

packages/adapters
  -> whatsapp-web.js
  -> qrcode-terminal

packages/memory
  -> ioredis

packages/schemas
  -> ajv, ajv-formats, zod

packages/utils
  -> (no internal dependencies)
```

---

## External Dependencies

| Package | Purpose | Used In |
|---------|---------|---------|
| @nestjs/core | NestJS runtime | apps/api, apps/worker |
| @nestjs/common | NestJS decorators, guards | apps/api, apps/worker |
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
| ioredis | Redis client | apps/api, packages/memory |
| bullmq | Queueing | apps/api |
| reflect-metadata | TypeScript decorator metadata | apps/api, apps/worker |
| rxjs | Reactive extensions | apps/api, apps/worker |
| nestjs-pino | Structured logging | apps/api |
| pino | Logger | apps/api |
| passport + passport-jwt | Auth strategies | apps/api |
| bcrypt | Password hashing | apps/api |
| jsonwebtoken | JWT encode/decode | apps/api |
| multer | Multipart parsing | apps/api |
| whatsapp-web.js | WhatsApp Web adapter | packages/adapters |
| qrcode-terminal | QR code display | packages/adapters |
| ajv + ajv-formats | JSON schema validation | packages/schemas |
| zod | Runtime type validation | packages/schemas |
| react + react-dom | UI framework | apps/dashboard |
| react-router-dom | Client routing | apps/dashboard |
| axios | HTTP client | apps/dashboard |
| recharts | Charting library | apps/dashboard |
| @monaco-editor/react | Code editor component | apps/dashboard |

---

## Circular Dependency Warnings

None detected at this time.

---

## Dependency Rules

- packages/core must not import packages/adapters
- apps should import shared packages, not the other way around
- packages/utils must not depend on app code
- Controllers may depend on Services — not the other way around
