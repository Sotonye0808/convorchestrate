# System Architecture

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-22
> - staleness-policy: re-verify before trusting if any architecture-affecting commits have been made since last-verified-against-code

> **Overview:** How the system is structured — layers, modules, data flow, and configuration. Agents designing or changing structure must read this first.

---

## Architecture Diagram

```
Dashboard (Next.js 15)
    -> API (NestJS + Fastify)
        -> Core Engine (packages/core)
            -> InMemoryProvider (self-contained, no Redis dependency)
            -> Action Executor (uses MetaApiClient via app wiring)
        -> Meta Cloud API Client (packages/meta-api)
            -> HTTPS -> graph.facebook.com (Meta REST API)
        -> PostgreSQL (TypeORM)
        -> Redis (BullMQ queue state)
Meta Cloud API Webhook
    -> Webhooks Module (apps/api)
        -> Delivery Status Processor (updates campaign_messages)
        -> Messaging Service -> Workflow Queue (BullMQ)
            -> Engine Service -> Core Engine
```

---

## Module Breakdown

| Module | Responsibility | Key Files | Dependencies |
|--------|---------------|-----------|--------------|
| apps/api | HTTP API, orchestration, Meta API wiring, webhooks | apps/api/src/main.ts | packages/core, packages/meta-api, packages/schemas, packages/utils |
| apps/api modules/templates | WhatsApp template CRUD + Meta submission + sync | apps/api/src/modules/templates/ | MetaApiClient (via MessagingModule) |
| apps/api modules/groups | Contact group CRUD + CSV import | apps/api/src/modules/groups/ | TypeORM |
| apps/api modules/campaigns | Campaign CRUD + async send engine (direct + workflow mode) | apps/api/src/modules/campaigns/ | WATemplate, ContactGroup, Workflow, MetaApiClient, EngineService |
| apps/api modules/webhooks | Meta delivery callback receiver → campaign_messages | apps/api/src/modules/webhooks/ | CampaignMessage entity |
| apps/api modules/mediations | Mediation session CRUD (list, get, close) | apps/api/src/modules/mediations/ | TypeORM MediationSession |
| apps/dashboard | Admin UI for campaigns, templates, groups, history | apps/dashboard/app/page.tsx | API only |
| packages/core | Workflow engine, action execution, InMemoryProvider | packages/core/src/engine.ts | packages/schemas |
| packages/meta-api | Typed Meta WhatsApp Cloud REST API wrapper | packages/meta-api/src/index.ts | none (fetch-based) |
| packages/schemas | Workflow JSON schema + validators | packages/schemas/src | ajv, zod |
| packages/utils | Shared types and helpers | packages/utils/src | none |
| infrastructure | Dockerfiles and compose | infrastructure/ | none |
| configs | Example workflows and tenant configs | configs/ | none |
| scripts | DB seed scripts | scripts/ | TypeORM |

**Removed:** `apps/worker` (queue logic absorbed into API), `packages/adapters` (whatsapp-web.js → Meta Cloud API), `packages/memory` (replaced by InMemoryProvider in core)

---

## Data Flow

### Standard Request Flow
```
Browser -> API -> Service -> TypeORM -> PostgreSQL -> Response
```

### Message Ingestion Flow
```
Meta Webhook -> WebhooksController -> WebhooksService
    ├── delivery status → campaign_messages update (wamid lookup)
    └── incoming message → MessagingService -> BullMQ -> EngineService -> Core Engine -> MetaApiClient.send
```

### Campaign Send Flow (R5 — dual mode)
```
Dashboard API -> Campaign Service (async send with semaphore concurrency)
    ├── Direct mode (no workflowId) — MetaApiClient.sendTemplate (per contact)
    └── Workflow mode (has workflowId) — EngineService.process (campaign_start trigger)
        -> WorkflowEngine -> handlers -> send_template_message -> MetaApiClient.sendTemplate
    -> Meta delivery webhook -> WebhooksService (status update on campaign_messages)
```

### Mediation Flow (R7)
```
Incoming message (keyword match)
    -> MessagingService.handleIncoming()
        -> resolveMediationParty() [create session or find existing, assign roles]
        -> MediationContext attached to EngineContext
    -> EngineService.process() [mediation type]
        -> processMediation() [evaluate handlers with mediation context]
            -> relay_to_party action [resolve other party, forward message]
            -> tag_user, send_message, etc.
        -> If timeout_ms configured: setTimeout -> on_timeout actions + mark session "timed_out"
    -> Mediations CRUD API [list, get, close sessions]
```

---

## Configuration Points

| Config Key | Purpose | Location | Default |
|-----------|---------|----------|---------|
| NODE_ENV | environment mode | .env | development |
| DATABASE_URL | Postgres connection | .env | local |
| REDIS_URL | Redis connection | .env | local |
| JWT_SECRET | dashboard auth | .env | change_me |
| META_PHONE_NUMBER_ID | Meta Cloud API sender | .env | (required) |
| META_ACCESS_TOKEN | Meta Cloud API auth | .env | (required) |
| META_APP_SECRET | Webhook HMAC validation | .env | (required) |
| META_APP_ID | Media upload | .env | (required) |
| META_WABA_ID | Template management | .env | (required) |
| META_API_VERSION | Graph API version | .env | v22.0 |
| META_WEBHOOK_VERIFY_TOKEN | Webhook challenge token | .env | (optional) |
| OLD_META_APP_SECRET | Zero-downtime key rotation | .env | (optional) |
| MEDIA_UPLOAD_PATH | media storage path | .env | ./uploads |

All config points must follow the fallback discipline from `standards/engineering-principles.md` §1 and §3 — every config-driven value must have a documented, safe fallback so the system degrades gracefully if the value is missing or malformed.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js + React | 15 / 19 |
| Backend | NestJS + Fastify | 10 |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis + BullMQ | 7 |
| Auth | JWT | - |
| WhatsApp | Meta WhatsApp Cloud API | v22.0 |

---

## Global Infrastructure
- AllExceptionsFilter registered in main.ts catches unhandled exceptions, logs via pino, returns structured JSON error response
- Health endpoint checks DB connectivity (SELECT 1) in addition to uptime

## Known Constraints & Technical Debt

- Core must not import adapters (now self-contained with InMemoryProvider)
- Every DB query must include tenant_id (enforced from R4)
- Workflow behavior must be defined in JSON config
- Queue-based processing for inbound messages
- `import type` breaks NestJS DI — must use `import { Cls, type SomeType }` pattern
- Fastify 4 plugin compat: pin `@fastify/*` plugins to Fastify 4-compatible majors
- Meta webhook raw body must be captured via Fastify `preParsing` hook for HMAC signature validation
- apps/api/Dockerfile fixed — removed stale worker reference, corrected port to 8080
- `@radix-ui/react-badge` npm install fail — dashboard dependency not in registry, not blocking build

---

## Architecture History

See `memory/architecture-history.md` for full chronology.
