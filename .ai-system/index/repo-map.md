# Repository Map

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: auto-regenerable — can be derived from `Get-ChildItem -Recurse` or `tree` command. Manual content only where intent cannot be derived from structure.

> **Overview:** Visual map of the project folder structure with purpose descriptions. Updated when the folder structure changes. This file is **auto-regenerable** — use tool-based discovery (filesystem MCP, git ls-tree) for ground truth, and treat manual entries here as supplementary context, not primary navigation.

---

## Folder Structure

```
convorchestrate/
|-- apps/
|   |-- api/          -> NestJS API app
|   |-- worker/       -> BullMQ worker app
|   `-- dashboard/    -> React dashboard
|-- packages/
|   |-- core/         -> Workflow engine
|   |-- adapters/     -> Channel adapters
|   |-- memory/       -> Memory providers
|   |-- schemas/      -> JSON schema validators
|   `-- utils/        -> Shared utilities
|-- infrastructure/   -> Dockerfiles + docker-compose.yml
|-- configs/          -> Workflow and tenant config samples
|-- scripts/          -> Seed scripts and tooling
|-- .ai-system/       -> AI documentation system
`-- package.json
```

---

## Directory Descriptions

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| apps/api | API app with NestJS + Fastify | apps/api/src/main.ts |
| apps/worker | Background worker | apps/worker/src/main.ts |
| apps/dashboard | React admin UI | apps/dashboard/src/main.tsx |
| packages/core | Workflow engine | packages/core/src |
| packages/adapters | Channel adapters | packages/adapters/src |
| packages/memory | Memory provider interfaces + Redis | packages/memory/src |
| packages/schemas | Workflow schema | packages/schemas/src |
| packages/utils | Shared helpers | packages/utils/src |
| infrastructure | Docker and compose | infrastructure/docker-compose.yml |
| configs | Sample workflow configs | configs/workflows |
| scripts | Seed and tooling | scripts/seed.ts |

## API Module Structure

```
apps/api/src/modules/
├── auth/           JWT auth (login/me)
├── campaigns/      Campaign CRUD + launch
├── contacts/       Contact CRUD
├── dashboard/      Dashboard stats
├── demo/           Demo/seed endpoints
├── engine/         Wraps packages/core
├── events/         Event log
├── health/         Health check
├── media/          Media uploads
├── messaging/      WhatsApp adapter wrapper + QR
├── queue/          BullMQ queues (Global module)
├── sessions/       Session queries
├── settings/       Tenant config
└── workflows/      Workflow CRUD
```

---

## Entry Points

| Purpose | File |
|---------|------|
| API server | apps/api/src/main.ts |
| Worker | apps/worker/src/main.ts |
| Dashboard | apps/dashboard/src/main.tsx |
| Root config | package.json |
