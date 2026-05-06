# System Architecture

Convorchestrate is a Turborepo monorepo with three apps and five shared packages.
The API handles orchestration, the worker executes background jobs, and the dashboard provides admin UX.
Core workflow logic lives in packages/core and must remain adapter-agnostic.
State is stored in PostgreSQL with Redis used for queueing and session/memory access.
This document maps how modules connect and where configuration lives.

## Architecture Diagram
This diagram summarizes the main request and message flow at a high level.
It focuses on the WhatsApp ingestion path and admin dashboard traffic.

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

## Module Breakdown
Each module has a single responsibility and clear boundaries.
Core must not import adapters; apps orchestrate the wiring.

| Module | Responsibility | Key Files | Dependencies |
|--------|----------------|-----------|--------------|
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

## Data Flow
The standard flow for inbound messages runs through the queue and engine.
The admin dashboard uses a typical REST flow to manage config and view logs.

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

## Configuration Points
Configuration is centralized via environment variables and tenant config JSON.
No hardcoded operational values should appear outside these settings.

| Config Key | Purpose | Location | Default |
| NODE_ENV | environment mode | .env | development |
| DATABASE_URL | Postgres connection | .env | local |
| REDIS_URL | Redis connection | .env | local |
| JWT_SECRET | dashboard auth | .env | change_me |
| WA_SESSION_DATA_PATH | WA session storage | .env | /app/data/wa-sessions |
| MEDIA_UPLOAD_PATH | media storage path | .env | /app/data/uploads |

## Tech Stack
These are the core technologies in use.
Add new dependencies here if introduced.

| Layer | Technology | Version |
| Frontend | React + Vite + Tailwind | 18 / latest |
| Backend | NestJS + Fastify | 10 |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis + BullMQ | 7 |
| Auth | JWT | - |

## Known Constraints & Technical Debt
These constraints are non-negotiable and guide design decisions.
Technical debt should be logged here if it impacts architecture.

- Core must not import adapters
- Every DB query must include tenant_id
- Workflow behavior must be defined in JSON config
- Queue-based processing for inbound messages

## Architecture History
This log captures major architectural changes.
Entries should be appended when structure changes.

| Date | Change | Reason |
| 2026-05-06 | Initial monorepo scaffold and AI system setup | Project start |

