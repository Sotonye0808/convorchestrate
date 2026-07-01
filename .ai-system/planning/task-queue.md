# Development Task Queue

> **Metadata**
> - last-updated-by: plan-feature (wa-manager integration)
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging. Agents execute tasks top to bottom within the current sprint. Each task is sized so it can be completed in a single session.

---

## Complexity Tags

Tags help agents self-select whether a task needs the full `execute-feature.md` pipeline or a lighter `dev-cycle.md`:

| Tag | Meaning | Recommended Command |
|-----|---------|-------------------|
| `[XS]` | Trivial — single file, known pattern | dev-cycle.md |
| `[S]` | Small — 1-3 files, well-understood | dev-cycle.md |
| `[M]` | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read |
| `[L]` | Large — feature spanning modules | execute-feature.md |
| `[XL]` | Very large — architecture-affecting | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix | fix-build.md |

---

## Repository Layout (Post-Rebase)

```
convorchestrate/
├── apps/
│   ├── api/              → NestJS + Fastify API (Meta Cloud API integration)
│   └── dashboard/        → Next.js 15 dashboard (from wa-manager)
├── packages/
│   ├── core/             → Workflow engine, action system
│   ├── meta-api/         → Meta WhatsApp Cloud API wrapper (NEW)
│   ├── schemas/          → Workflow JSON schema, validators
│   └── utils/            → Shared types and helpers
├── infrastructure/       → Docker compose (postgres + api + dashboard)
├── configs/              → Workflow config samples, tenant configs
├── scripts/              → Seed scripts
└── .ai-system/           → AI development system
```

**Removed:** `apps/worker` (queue logic absorbed into API via BullMQ), `packages/adapters` (whatsapp-web.js → Meta Cloud API), `packages/memory` (Redis concerns folded into api).

---

## Current Sprint — R1 Foundation Reset

| Size | Task | Status |
|------|------|--------|
| [XL] | R1: Foundation Reset & Integration | [x] |
| [XL] | R2: NestJS Backend with Meta Cloud API | [ ] |
| [XL] | R3: Campaign Engine (NestJS Port) | [ ] |
| [XL] | R4: Multi-Tenant Isolation | [ ] |
| [XL] | R5: Config-Driven Workflow Integration | [ ] |
| [L] | R6: Advanced Campaign Features | [ ] |
| [L] | R7: Mediation Workflows | [ ] |
| [M] | R8: Hardening & Polish | [ ] |
| [M] | R9: Documentation & Deployment | [ ] |

---

## R1 Breakdown — Immediate Actions

| Size | Task | Status |
|------|------|--------|
| [S] | Remove obsolete source files (old dashboard, adapters, memory packages) | [x] |
| [M] | Copy wa-manager frontend into apps/dashboard; adapt package.json, tsconfig | [x] |
| [M] | Copy + adapt wa-manager Docker Compose as new infrastructure baseline | [x] |
| [S] | Set up Meta Cloud API env vars + startup validation (fail-fast if missing) | [x] |
| [S] | Update .env.example with wa-manager vars + convorchestrate extras | [x] |
| [S] | Verify docker compose builds and boots postgres + frontend | [ ] |

---

## R2 Breakdown

| Size | Task |
|------|------|
| [M] | Create packages/meta-api — typed wrapper around Meta Cloud REST API |
| [L] | Implement core Meta API methods: sendTemplate, sendImage, sendText, uploadMedia, submitTemplate, listTemplates |
| [M] | Implement webhook verification (GET) + HMAC-SHA256 signature validation (POST) |
| [M] | Implement delivery status callback processor (wamid → campaign_messages status update) |
| [L] | Refactor apps/api: integrate meta-api, remove old messaging module, update app.module |
| [M] | Write unit tests for meta-api package with mocked HTTP |

---

## R3 Breakdown

| Size | Task |
|------|------|
| [M] | Create TypeORM entities: WATemplate, ContactGroup, Contact, Campaign, CampaignMessage |
| [L] | Port campaign CRUD + async send engine (semaphore-concurrent, per-message tracking) |
| [M] | Port CSV import for contacts (papaparse, batch insert) |
| [M] | Port webhook receiver for Meta delivery callbacks |
| [M] | Write unit tests for campaign engine |
| [S] | Write integration test: full campaign lifecycle via API |

---

## R4 Breakdown

| Size | Task |
|------|------|
| [M] | Add tenant_id to all entities; create Tenant entity |
| [M] | Add tenant middleware (resolve from JWT claims) |
| [L] | Refactor all queries to filter by tenant_id |
| [M] | Support tenant-scoped Meta credential override |
| [M] | Test: tenant isolation (A cannot see B's data) |

---

## R5 Breakdown

| Size | Task |
|------|------|
| [M] | Port workflow JSON schema from packages/schemas |
| [M] | Create packages/workflow-engine — lightweight interpreter |
| [M] | Implement workflow actions: send_template_message, send_image, etc. |
| [M] | Wire workflow engine into campaign launch |
| [M] | Write unit tests for workflow engine |

---

## Notes

- All old v1 build phases are **superseded** by the wa-manager rebase
- The Meta WhatsApp Cloud API replaces whatsapp-web.js as the message transport (official API, no Puppeteer dependency)
- The Next.js dashboard from wa-manager replaces the old React/Vite dashboard
- Engineering principles (§1-10) apply to every phase — reviewer role checks compliance before sign-off
- Original wa-manager: https://github.com/godopetza/wa-manager
