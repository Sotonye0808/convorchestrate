# Development Task Queue

> **Metadata**
>
> - last-updated-by: execute-feature (R5 sync)
> - last-verified-against-code: 2026-07-08
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging. Agents execute tasks top to bottom within the current sprint. Each task is sized so it can be completed in a single session.

---

## Complexity Tags

Tags help agents self-select whether a task needs the full `execute-feature.md` pipeline or a lighter `dev-cycle.md`:

| Tag     | Meaning                                  | Recommended Command                         |
| ------- | ---------------------------------------- | ------------------------------------------- |
| `[XS]`  | Trivial — single file, known pattern     | dev-cycle.md                                |
| `[S]`   | Small — 1-3 files, well-understood       | dev-cycle.md                                |
| `[M]`   | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read     |
| `[L]`   | Large — feature spanning modules         | execute-feature.md                          |
| `[XL]`  | Very large — architecture-affecting      | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix                                  | fix-build.md                                |

---

## Repository Layout (Post-Rebase)

```
convorchestrate/
├── apps/
│   ├── api/              → NestJS + Fastify API (Meta Cloud API integration)
│   └── dashboard/        → Next.js 15 dashboard (from wa-manager)
├── packages/
│   ├── core/             → Workflow engine, action system, InMemoryProvider
│   ├── meta-api/         → Meta WhatsApp Cloud API wrapper
│   ├── schemas/          → Workflow JSON schema, validators
│   └── utils/            → Shared types and helpers
├── infrastructure/       → Docker compose (postgres + api + dashboard)
├── configs/              → Workflow config samples, tenant configs
├── scripts/              → Seed scripts
└── ai-system/           → AI development system
```

**Removed:** `apps/worker` (queue logic absorbed into API via BullMQ), `packages/adapters` (whatsapp-web.js → Meta Cloud API), `packages/memory` (replaced by InMemoryProvider in core).

---

## Current Sprint — R3 Campaign Engine Port

| Size | Task                                   | Status |
| ---- | -------------------------------------- | ------ |
| [XL] | R1: Foundation Reset & Integration     | [x]    |
| [XL] | R2: NestJS Backend with Meta Cloud API | [x]    |
| [XL] | R3: Campaign Engine (NestJS Port)      | [x]    |
| [XL] | R4: Multi-Tenant Isolation             | [~]    |
| [XL] | R5: Config-Driven Workflow Integration | [x]    |
| [L]  | R6: Advanced Campaign Features         | [x]    |
| [L]  | R7: Mediation Workflows                | [x]    |
| [M]  | R8: Hardening & Polish                 | [x]    |
| [M]  | R9: Documentation & Deployment         | [x]    |

---

## R3 Breakdown

| Size | Task                                                                                  | Status |
| ---- | ------------------------------------------------------------------------------------- | ------ |
| [M]  | Create TypeORM entities: WATemplate, ContactGroup, Contact, Campaign, CampaignMessage | [x]    |
| [L]  | Port campaign CRUD + async send engine (semaphore-concurrent, per-message tracking)   | [x]    |
| [M]  | Port CSV import for contacts (papaparse, batch insert)                                | [x]    |
| [M]  | Port webhook receiver for Meta delivery callbacks                                     | [x]    |
| [M]  | Write unit tests for campaign engine                                                  | [x]    |
| [S]  | Write integration test: full campaign lifecycle via API                               | [x]    |

---

## R4 Breakdown

| Size | Task                                                           | Status |
| ---- | -------------------------------------------------------------- | ------ |
| [M]  | Add tenant_id to all entities; enhance Tenant entity           | [x]    |
| [M]  | Add tenant middleware (resolve from JWT claims)                | [x]    |
| [L]  | Refactor all queries to filter by tenant_id                    | [x]    |
| [M]  | Add Meta credential fields to Tenant entity                    | [x]    |
| [M]  | Test: tenant isolation (A cannot see B's data)                 | [x]    |
| [L]  | Wire tenant-scoped MetaApiClient (credential passthrough at call time) | [x]    |

---

## R5 Breakdown

| Size | Task                                                                         | Status |
| ---- | ---------------------------------------------------------------------------- | ------ |
| [M]  | Add send_template_message action to schema + engine + wiring                 | [x]    |
| [M]  | Wire workflow engine into campaign launch (workflowId on Campaign entity)    | [x]    |
| [M]  | Write unit + integration tests for workflow integration                      | [x]    |

---

## Notes

- All old v1 build phases are **superseded** by the wa-manager rebase
- The Meta WhatsApp Cloud API replaces whatsapp-web.js as the message transport (official API, no Puppeteer dependency)
- The Next.js dashboard from wa-manager replaces the old React/Vite dashboard
- Engineering principles (§1-10) apply to every phase — reviewer role checks compliance before sign-off
- Original wa-manager: https://github.com/godopetza/wa-manager
