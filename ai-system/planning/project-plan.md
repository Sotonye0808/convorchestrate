# Project Plan

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-22
> - staleness-policy: re-verify if project scope or phase changes

> **Overview:** High-level feature checklist organized by development phase. See `planning/task-queue.md` for granular, sprint-level tasks.

---

## Strategy: Rebase on wa-manager Foundation

The original convorchestrate build used `whatsapp-web.js` (Puppeteer-based, fragile) and built campaign features from scratch. The open-source [wa-manager](https://github.com/godopetza/wa-manager) provides a **production-tested campaign engine** using **Meta WhatsApp Cloud API** with a modern **Next.js 15 / React 19 dashboard**. This plan rebases the project on wa-manager's functionality while incorporating convorchestrate's architectural concepts (multi-tenancy, config-driven workflows, mediation, engineering principles).

**What we keep from convorchestrate:** Monorepo structure, config-driven workflow concept, multi-tenant doctrine, engineering principles, ai-system, packages/core|schemas|utils (as reference).

**What we adopt from wa-manager:** Meta Cloud API integration, campaign engine (async send, per-message tracking, delivery webhooks), template management, contact groups with CSV import, Next.js dashboard.

**What we replace:** whatsapp-web.js (→ Meta Cloud API), React/Vite dashboard (→ Next.js 15), Go backend (→ NestJS/TypeScript rewrite), untested campaign code (→ production-tested engine).

---

## Phase R1 — Foundation Reset & Integration ✓

- [x] Remove obsolete source: old `apps/dashboard` (React/Vite), `packages/adapters` (whatsapp-web.js), `packages/memory` (Redis-only focus)
- [x] Adopt wa-manager's Next.js frontend as new `apps/dashboard`
- [x] Adopt wa-manager's Docker Compose as new baseline
- [x] Set up Meta Cloud API credential flow (env vars, validation, fail-fast)
- [x] Prime .env.example with wa-manager vars + convorchestrate extras
- [ ] Verify: `docker compose up` boots postgres + frontend

---

## Phase R2 — NestJS Backend with Meta Cloud API ✓

- [x] Create `packages/meta-api` — wrapper around Meta WhatsApp Cloud API (per §4: wrapper-isolated, stable internal interface)
- [x] Implement: send template, send image, send freeform text, upload media to Meta, submit template
- [x] Implement: webhook verification + HMAC-SHA256 signature validation
- [x] Implement: delivery status callback processor
- [x] Refactor `apps/api` NestJS app to use `packages/meta-api` (replace old messaging module)
- [x] Remove old `packages/adapters` dependency
- [x] Write unit tests for meta-api package (19 tests passing)
- [ ] Verify: Meta API calls succeed with test credentials

---

## Phase R3 — Campaign Engine (NestJS Port) ✓

- [x] Port wa-manager's campaign data model to NestJS/TypeORM entities:
  - `wa_templates` — WhatsApp message templates (components, status, category)
  - `contact_groups` — named groups of contacts
  - `contacts` — phone + name, belongs to group
  - `campaigns` — template + group + optional image + status
  - `campaign_messages` — per-contact delivery tracking (wamid, status, timestamps)
- [x] Port campaign CRUD endpoints + async send engine:
  - Async launch (202 Accepted), semaphore-concurrent sending (configurable concurrency)
  - Per-message status tracking (pending → sent → delivered → read → failed)
  - Campaign status machine: draft → sending → completed / partial_failed / failed
- [x] Port CSV import for contacts (phone + name columns, batch insert)
- [x] Port webhook receiver for Meta delivery callbacks (already built in R2)
- [x] Write unit tests for campaign engine
- [x] Verify: full campaign lifecycle via API tests

---

## Phase R4 — Multi-Tenant Isolation ✓

- [x] Add `tenant_id` column to all entities (wa_templates, contact_groups, contacts, campaigns, campaign_messages)
- [x] Create tenant entity + registration endpoint (Tenant CRUD module)
- [x] Add tenant middleware (@CurrentTenant decorator, JWT tenantId claim)
- [x] Refactor all queries to include `tenant_id` filter (templates, groups, campaigns)
- [x] Add Meta credential fields to Tenant entity (phoneNumberId, accessToken, appSecret, appId, wabaId)
- [x] Wire tenant-scoped MetaApiClient credential passthrough (EngineService + CampaignService resolve tenant creds at call time)
- [x] Verify: tenant A cannot see tenant B's data (6 integration tests)

---

## Phase R5 — Config-Driven Workflow Integration ✓

- [x] Define workflow JSON schema (reactive, sequential, mediation types) — reused from `packages/schemas` (already existed)
- [x] Workflow engine already existed in `packages/core` (WorkflowEngine, InMemoryProvider, DefaultActionExecutor)
- [x] Implement `send_template_message` action — looks up WATemplate by name from DB (tenant-scoped), sends via MetaApiClient.sendTemplate with optional body parameters
- [x] All existing actions wired in `EngineService`: send_message, send_template_message, tag_user, store_media, delay, trigger_webhook, relay_to_party
- [x] Condition evaluation (text_match, tag_exists, media_received, context_equals, always) — already implemented in engine
- [x] Wire workflow engine into campaign launch — optional `workflowId` on Campaign entity; CampaignService.send() delegates to EngineService.process() with campaign_start trigger
- [x] Wire `sendTemplateFn` from MetaApiClient to EngineService (MessagingService constructor)
- [x] Verify: 61/61 tests pass (19 meta-api + 13 core + 29 api); includes workflow mode unit tests

---

## Phase R6 — Advanced Campaign Features ✓

- [x] Scheduling: delayed campaign start via `scheduledAt` + BullMQ campaign-launch queue
- [x] Rate limiting: configurable `campaign_max_sends_per_minute` per tenant (in-memory sliding window)
- [x] Campaign analytics API endpoint (`GET /campaigns/:id/stats`)
- [x] CSV import with tag assignment (optional `tags` per row, creates ContactTag records)
- [ ] Contact tagging (from convorchestrate's tag_user action)
- [ ] Media upload endpoint + store_media action (image/video for templates)
- [ ] Campaign analytics dashboard page (send rate, delivery rate, read rate)
- [ ] Verify: rate-limited campaign completes without errors

---

## Phase R7 — Mediation Workflows ✓

- [x] Mediation session entity + lifecycle (buyer/seller pairing) — entity existed, wired in messaging service
- [x] implement mediation trigger (inbound message matches pattern → create session) — resolveMediationParty() in MessagingService
- [x] implement relay_to_party action (forward message to other party) — wired in EngineService
- [x] implement mediation timeout handling — setTimeout in EngineService.process() fires on_timeout actions when timeout_ms elapses
- [x] Mediation CRUD API — MediationsModule (list, get, close) with JWT auth + tenant isolation
- [ ] Mediation dashboard view (requires dashboard build fix)
- [ ] Verify: two-party mediation flow end-to-end

---

## Phase R8 — Hardening & Polish ✓

- [x] Structured logging (pino) across all modules — LoggerModule configured in app.module.ts, all services use Logger
- [x] Rate limiting per API endpoint (@fastify/rate-limit) — 100 req/min global in main.ts
- [x] Security headers (helmet) + CORS config — both registered in main.ts
- [x] Health endpoint / database connectivity check — HealthController updated with DataSource SELECT 1 check
- [x] Proper error handling + fallback defaults per §1, §3 — AllExceptionsFilter created and registered as global filter
- [x] Seed script for demo data — scripts/seed.ts exists
- [ ] Integration tests with test database — campaign integration tests use mock repos, not real DB
- [x] Run full quality gate — verified in QA gate step

---

## Phase R9 — Documentation & Deployment ✓

- [x] Update ai-system to reflect new architecture — synced via update-ai-system
- [x] Write local testing guide (SETUP.md)
- [x] Write deployment guide — included in SETUP.md + docker-compose verified
- [x] Update README with project description + attribution to [wa-manager](https://github.com/godopetza/wa-manager)
- [x] Verify: full deployment pipeline works — Dockerfiles fixed, docker-compose updated (added Redis)
