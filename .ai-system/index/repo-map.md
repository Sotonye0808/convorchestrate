# Repository Map

> **Metadata**
> - last-updated-by: execute-feature (R1 foundation)
> - last-verified-against-code: 2026-07-01
> - staleness-policy: auto-regenerable — can be derived from `Get-ChildItem -Recurse` or `tree` command. Manual content only where intent cannot be derived from structure.

> **Overview:** Visual map of the project folder structure with purpose descriptions. Updated when the folder structure changes. This file is **auto-regenerable** — use tool-based discovery (filesystem MCP, git ls-tree) for ground truth, and treat manual entries here as supplementary context, not primary navigation.

---

## Folder Structure

```
convorchestrate/
|-- apps/
|   |-- api/          -> NestJS + Fastify API (Meta Cloud API integration)
|   `-- dashboard/    -> Next.js 15 dashboard (from wa-manager)
|-- packages/
|   |-- core/         -> Workflow engine (refactored)
|   |-- schemas/      -> Workflow JSON schema + validators
|   `-- utils/        -> Shared types and helpers
|-- infrastructure/   -> Docker compose (postgres + api + dashboard)
|-- configs/          -> Workflow and tenant config samples
|-- scripts/          -> Seed scripts and tooling
|-- .ai-system/       -> AI development system
`-- package.json
```

---

## Directory Descriptions

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| apps/api | NestJS API with Meta Cloud API integration | apps/api/src/main.ts |
| apps/dashboard | Next.js 15 admin dashboard (campaigns, templates, groups, history) | apps/dashboard/app/page.tsx |
| packages/core | Workflow engine (to be refactored in R5) | packages/core/src |
| packages/schemas | Workflow JSON schema + validators | packages/schemas/src |
| packages/utils | Shared helpers | packages/utils/src |
| infrastructure | Docker compose (postgres + api + dashboard) | infrastructure/docker-compose.yml |
| configs | Sample workflow configs | configs/workflows |
| scripts | Seed and tooling | scripts/seed.ts |

## API Module Structure

```
apps/api/src/modules/
├── auth/           JWT auth (login/me)
├── campaigns/      Campaign CRUD + async send engine
├── contacts/       Contact CRUD + CSV import
├── groups/         Contact groups
├── templates/      WhatsApp template management + Meta submission
├── webhooks/       Meta delivery callback receiver
├── mediator/       Marketplace mediation (R7)
├── workflows/      Config-driven workflow execution (R5)
├── health/         Health check
└── tenants/        Multi-tenant management (R4)
```

---

## Entry Points

| Purpose | File |
|---------|------|
| API server | apps/api/src/main.ts |
| Dashboard | apps/dashboard/app/page.tsx |
| Root config | package.json |
