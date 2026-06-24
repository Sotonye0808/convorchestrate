# Repository Map

This file maps the current folder structure of the monorepo.
It helps agents quickly locate code and understand module boundaries.
Update it when the directory layout changes.
Paths here reflect the current scaffold.

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

## Entry Points

| Purpose | File |
|---------|------|
| API server | apps/api/src/main.ts |
| Worker | apps/worker/src/main.ts |
| Dashboard | apps/dashboard/src/main.tsx |
| Root config | package.json |
