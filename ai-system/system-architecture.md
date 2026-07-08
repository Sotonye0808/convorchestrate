# System Architecture

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify before trusting if any architecture-affecting commits have been made since last-verified-against-code

> **Overview:** How the system is structured — layers, modules, data flow, and configuration. Agents designing or changing structure must read this first.

---

## Architecture Diagram

```
Dashboard (React)
    -> API (NestJS + Fastify)
        -> Core Engine (packages/core)
            -> Memory Provider (packages/memory)
            -> Action Executor (uses adapters via app wiring)
        -> PostgreSQL (TypeORM)
        -> Redis (BullMQ / cache)
WhatsApp (whatsapp-web.js adapter)
    -> Messaging Module (API)
        -> Workflow Queue (BullMQ)
            -> Worker -> Core Engine
```

---

## Module Breakdown

| Module | Responsibility | Key Files | Dependencies |
|--------|---------------|-----------|--------------|
| apps/api | HTTP API, orchestration, adapter wiring | apps/api/src/main.ts | packages/core, packages/memory, packages/adapters, packages/utils |
| apps/worker | BullMQ processors and background jobs | apps/worker/src/main.ts | packages/core, packages/memory, packages/utils |
| apps/dashboard | Admin UI for workflows, contacts, campaigns | apps/dashboard/src/main.tsx | API only |
| packages/core | Workflow engine and action execution contracts | packages/core/src | packages/schemas, packages/utils, packages/memory (interfaces only) |
| packages/adapters | Channel adapters (whatsapp-web.js) | packages/adapters/src | External WA libs |
| packages/memory | Session/contact storage interfaces + Redis impl | packages/memory/src | ioredis |
| packages/schemas | Workflow JSON schema + validators | packages/schemas/src | ajv, zod |
| packages/utils | Shared types and helpers | packages/utils/src | none |
| configs | Example workflows and tenant configs | configs/ | none |
| infrastructure | Dockerfiles and compose | infrastructure/ | none |
| scripts | DB seed scripts | scripts/ | TypeORM |

---

## Data Flow

### Standard Request Flow
```
Browser -> API -> Service -> TypeORM -> PostgreSQL -> Response
```

### Message Ingestion Flow
```
WhatsApp -> Adapter -> API Messaging Module -> BullMQ -> Worker -> Core Engine -> Memory/DB -> Adapter send
```

### Data Persistence Flow
```
TypeORM -> PostgreSQL (tenants, workflows, sessions, contacts, logs)
Redis -> sessions, queue state
```

---

## Configuration Points

| Config Key | Purpose | Location | Default |
|-----------|---------|----------|---------|
| NODE_ENV | environment mode | .env | development |
| DATABASE_URL | Postgres connection | .env | local |
| REDIS_URL | Redis connection | .env | local |
| JWT_SECRET | dashboard auth | .env | change_me |
| WA_SESSION_DATA_PATH | WA session storage | .env | /app/data/wa-sessions |
| MEDIA_UPLOAD_PATH | media storage path | .env | /app/data/uploads |

All config points listen above should follow the fallback discipline from `standards/engineering-principles.md` §1 and §3 — every config-driven value must have a documented, safe fallback so the system degrades gracefully if the value is missing or malformed.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite + Tailwind | 18 / latest |
| Backend | NestJS + Fastify | 10 |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis + BullMQ | 7 |
| Auth | JWT | - |

---

## Known Constraints & Technical Debt

- Core must not import adapters
- Every DB query must include tenant_id
- Workflow behavior must be defined in JSON config
- Queue-based processing for inbound messages
- `import type` breaks NestJS DI — must use `import { Cls, type SomeType }` pattern
- Fastify 4 plugin compat: pin `@fastify/*` plugins to Fastify 4-compatible majors

---

## Architecture History

See `memory/architecture-history.md` for full chronology.
