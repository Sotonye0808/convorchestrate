# Dependency Graph

This graph describes how modules depend on each other.
It enforces adapter isolation and prevents architectural drift.
Update it whenever new packages or dependencies are introduced.
Use this to validate layering decisions.

## Module Dependency Map

```
apps/api
  -> packages/core
  -> packages/memory
  -> packages/adapters
  -> packages/schemas
  -> packages/utils

apps/worker
  -> packages/core
  -> packages/memory
  -> packages/utils

packages/core
  -> packages/schemas
  -> packages/utils
  -> packages/memory (interfaces only)

packages/adapters
  -> whatsapp-web.js

packages/memory
  -> ioredis

packages/schemas
  -> ajv, zod

packages/utils
  -> (no internal dependencies)
```

## External Dependencies

| Package | Purpose | Used In |
|---------|---------|---------|
| @nestjs/core | API framework | apps/api, apps/worker |
| @nestjs/platform-fastify | Fastify adapter | apps/api |
| typeorm | ORM | apps/api |
| pg | Postgres driver | apps/api |
| ioredis | Redis client | packages/memory |
| bullmq | Queueing | apps/api, apps/worker |
| whatsapp-web.js | WA adapter | packages/adapters |
| react | UI | apps/dashboard |
| vite | UI tooling | apps/dashboard |

## Circular Dependency Warnings
None detected at this time.

## Dependency Rules
- packages/core must not import packages/adapters
- apps should import shared packages, not the other way around
- packages/utils must not depend on app code

