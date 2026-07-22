# Repository Map

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-22
> - staleness-policy: auto-regenerable — can be derived from `Get-ChildItem -Recurse` or `tree` command. Manual content only where intent cannot be derived from structure.

> **Overview:** Visual map of the project folder structure with purpose descriptions. Updated when the folder structure changes. This file is **auto-regenerable** — use tool-based discovery (filesystem MCP, git ls-tree) for ground truth, and treat manual entries here as supplementary context, not primary navigation.

---

## Folder Structure

```
convorchestrate/
|-- apps/
|   |-- api/          -> NestJS + Fastify API (Meta Cloud API integration + webhooks)
|   `-- dashboard/    -> Next.js 15 dashboard (from wa-manager)
|-- packages/
|   |-- core/         -> Workflow engine, action executor, InMemoryProvider
|   |-- meta-api/     -> Typed Meta WhatsApp Cloud API wrapper (NEW)
|   |-- schemas/      -> Workflow JSON schema + validators
|   `-- utils/        -> Shared types and helpers
|-- infrastructure/   -> Docker compose (postgres + api + dashboard)
|-- configs/          -> Workflow and tenant config samples
|-- scripts/          -> Seed scripts and tooling
|-- ai-system/       -> AI development system
`-- package.json
```

**Removed (v1→v2):** `apps/worker`, `packages/adapters` (whatsapp-web.js), `packages/memory` (Redis provider)

---

## Directory Descriptions

| Directory        | Purpose                                                            | Key Files                         |
| ---------------- | ------------------------------------------------------------------ | --------------------------------- |
| apps/api         | NestJS API with Meta Cloud API integration + webhook handling      | apps/api/src/main.ts              |
| apps/dashboard   | Next.js 15 admin dashboard (campaigns, templates, groups, history) | apps/dashboard/app/page.tsx       |
| packages/core    | Workflow engine, action executor, InMemoryProvider                  | packages/core/src/engine.ts       |
| packages/meta-api| Typed Meta WhatsApp Cloud REST API wrapper                          | packages/meta-api/src             |
| packages/schemas | Workflow JSON schema + validators                                  | packages/schemas/src              |
| packages/utils   | Shared helpers                                                     | packages/utils/src                |
| infrastructure   | Docker compose (postgres + api + dashboard)                        | infrastructure/docker-compose.yml |
| configs          | Sample workflow configs                                            | configs/workflows                 |
| scripts          | Seed and tooling                                                   | scripts/seed.ts                   |

## API Module Structure

```
apps/api/src/modules/
├── auth/            JWT auth (login/me)
├── campaigns/       Campaign CRUD + async send engine (wa-manager model)
├── contacts/        Contact CRUD + CSV import
├── dashboard/       Dashboard API routes
├── demo/            Demo seed and simulated message injection
├── engine/          Workflow engine bridge (MetaApiClient send function wiring)
├── events/          Event log module
├── groups/          Contact group CRUD + CSV import (wa-manager model)
├── health/          Health check (DB connectivity)
├── mediations/      Mediation session CRUD (list, get, close) (with DB connectivity)
├── mediations/      Mediation session CRUD (list, get, close)
├── media/           Media upload and storage
├── messaging/       Messaging service (incoming webhook → workflow queue)
├── queue/           BullMQ queue service (workflow-execution, delayed-message, webhook-trigger, campaign-launch)
├── sessions/        Session management
├── settings/        Tenant settings
├── templates/       WhatsApp template CRUD + Meta submission + sync (wa-manager model)
├── tenants/         Multi-tenant CRUD + Meta credential management
├── webhooks/        Meta delivery callback receiver
└── workflows/       Config-driven workflow execution
```

---

## Entry Points

| Purpose     | File                        |
| ----------- | --------------------------- |
| API server  | apps/api/src/main.ts        |
| Dashboard   | apps/dashboard/app/page.tsx |
| Root config | package.json                |
