# Development History

> **Metadata**
>
> - last-updated-by: execute-feature (R6 sync)
> - last-verified-against-code: 2026-07-14
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological log of completed development work. Each sprint ends with a summary entry. Agents add entries after completing tasks. Useful for understanding what has been built, when decisions were made, and what patterns have emerged.

---

## Entry Format

```
## [Date] — [Sprint or Session Title]

**Summary:**
[2-4 sentence overview of what was accomplished]

**Completed:**
- [task 1]
- [task 2]

**Key Changes:**
- [important architectural or behavioural change]

**Next Sprint Focus:**
[What comes next]
```

---

## History

## 2026-05-06 — AI System Bootstrap

**Summary:**
Bootstrapped the ai-system documentation from the build plan and current scaffold.

**Completed:**

- Generated ai-system docs, repo map, dependency graph
- Seeded Phase 0 task queue

**Next Sprint Focus:**
Complete Phase 0 (entities, migrations, docker compose, build)

## 2026-05-06 — Phase 0 Complete

**Summary:**
Scaffold reconciled to the build plan with valid package names, workspace configs, and entity definitions.

**Completed:**

- Apps, packages, configs aligned to Phase 0
- TypeORM entities and migration created
- Build succeeded across all workspaces

**Next Sprint Focus:**
Phase 1 engine core and workflow schema

## 2026-06-23 — Phases 1-3 Complete

**Summary:**
Engine core, WhatsApp adapter, media + tagging implemented. Architecture review completed.

**Completed:**

- persistState config-driven fix, package-name imports
- WwjsAdapter with QR streaming, rate limiter
- MessagingModule, EngineModule, MediaModule
- 8 core unit tests

**Build & Test:**

- 8/8 packages build, 8/8 tests pass

**Next Sprint Focus:**
Phase 4 — Sequential + Mediation workflows

## 2026-06-23 — Phases 4-8 Complete (Full Build)

**Summary:**
All 8 build phases completed in a single session. The system handles reactive, sequential, and mediation workflows through a BullMQ queue system, with campaign management, a full admin dashboard, and production hardening.

**Completed:**

- Phase 4: Sequential + Mediation workflow engine, relay/relay_to_party, delay, webhook actions
- Phase 5: BullMQ queue system (workflow-execution, delayed-message, webhook-trigger)
- Phase 6: Campaigns (entity, launch flow, rate-limited dispatch)
- Phase 7: Admin dashboard (7 backend API modules + 7 React pages with Monaco editor)
- Phase 8: Helmet, CORS, rate limiting, pino logging, health endpoints, Dockerfiles, docker-compose

**Build & Test:**

- 8/8 packages build
- 13/13 core tests pass (reactive, sequential, mediation)
- Dashboard Vite build succeeds (108 modules)

**Key Changes:**

- All incoming messages flow through BullMQ, not inline on webhook thread
- Adapter isolation: engine only speaks through ChannelAdapter + MemoryProvider interfaces
- Tenant-first queries enforced throughout all services
- Config-driven workflows (JSON schema validated via ajv)
- Campaign rate limiting via tenant config (campaign_max_sends_per_minute)

**Next Sprint Focus:**
Demo/preview mode, local testing setup, deployment guide

## 2026-07-01 — Update-AI-System Drift Sync

**Summary:**
Ran `update-ai-system.md` as a post-migration deep consistency check. Scanned all `ai-system/` docs against actual repo state. Found and fixed dependency graph drift.

**Completed:**

- Updated `index/dependency-graph.md` — corrected module dependency map and expanded external dependencies table from 9 to 31 entries
- Architected: worker has zero `@convorchestrate/*` deps (only NestJS runtime); core has no `@convorchestrate/utils` dep; API has full external dep list
- All other docs verified in sync: repo-map, system-architecture, project-plan, planning, memory, checkpoints, testing

**Key Changes:**

- dependency-graph.md now reflects actual package.json declarations rather than inferred structure

**Next Sprint Focus:**
Demo/preview mode, local testing setup, deployment guide

## 2026-07-01 — Migration to v2 ai-system

**Summary:**
Project migrated from ai-system v1 to v2. All documentation updated to vendor-neutral, function-based role structure with explicit protocols and metadata headers.

**Completed:**

- Migrated all v1 content into v2 templates
- Added freshness metadata and supersedes links to all files
- Adopted new protocols/ entry protocol, quality gate, tiering, escalation, verification
- Replaced tool-based agent roles with function-based roles

**Key Changes:**

- Zero vendor references — tool-agnostic system
- 9-criterion quality gate with pattern adherence check
- Interruption safety via checkpoints/in-progress.md
- Freshness metadata on every file
- Auto-regenerable markers on index files

**Next Sprint Focus:**
Demo/preview mode, local testing setup, deployment guide

## 2026-07-08 — R3 Campaign Engine (NestJS Port)

**Summary:**
Ported wa-manager's campaign data model and async send engine to NestJS/TypeORM. Created WATemplate, ContactGroup entities. Updated Contact (added groupId), Campaign (templateId/groupId/imageUrl), CampaignMessage (entity relations). Built TemplatesModule (CRUD + Meta submission + sync + upload-image), GroupsModule (CRUD + CSV import), and refactored CampaignModule to wa-manager's async send model with semaphore-concurrent sending and per-message tracking. All wired into AppModule with MessagingModule DI for MetaApiClient.

**Completed:**
- Created WATemplate entity — wa-manager model (name, language, category, components, metaId, metaStatus, rejectReason)
- Created ContactGroup entity — named groups for campaign targeting
- Updated Contact entity — added groupId FK, removed tenant-id constraints for wa-manager model
- Updated Campaign entity — added templateId, groupId, imageUrl, sentCount/failCount, campaign status machine
- Updated CampaignMessage entity — proper ManyToOne relations to Campaign and Contact, index on waMessageId
- Built TemplatesModule — CRUD endpoints, submitToMeta, syncFromMeta, uploadImage
- Built GroupsModule — CRUD, add/remove contacts, CSV import with batch insert
- Refactored CampaignModule — wa-manager send model (async send, semaphore concurrency, per-message tracking)
- Fixed webhooks.service.ts — TypeORM Partial type issue with relation fields (Record<string, unknown>)
- Updated app.module.ts — registered TemplatesModule, GroupsModule, WATemplate, ContactGroup entities

**Key Changes:**
- Campaign send no longer uses BullMQ workflow queue — direct async send with semaphore concurrency
- Campaign model no longer references workflow or tenant — simplified wa-manager model (template+group)
- Two new API modules: /templates and /groups
- Campaign messages tracked per-contact with status machine (pending → sent → delivered → read → failed)

**Build & Test:**
- 5/5 packages build (core, meta-api, schemas, utils, api)
- 19/19 meta-api tests pass
- 13/13 core tests pass

**Next Sprint Focus:**
Write unit tests for campaign engine, integration test for full campaign lifecycle.

## 2026-07-08 — R3 Complete — All Tests Passing

**Summary:**
Completed R3 with 18 tests (13 unit + 5 integration) covering the full campaign lifecycle. Unit tests mock TypeORM repositories and MetaApiClient to test CampaignService in isolation. Integration tests exercise the controller layer end-to-end with a mocked service. R3 is now fully complete: entities, TemplatesModule, GroupsModule, CampaignModule (async send engine with semaphore concurrency, per-message tracking), webhook receiver, CSV import, unit tests, integration tests.

**Completed:**
- 13 unit tests for CampaignService (create validation, send flow with success/failure, findAll/findOne/getMessages/delete)
- 5 integration tests for CampaignController (full lifecycle, 404 handling, conflict prevention, empty state, optional fields)

**Build & Test:**
- 5/5 packages build
- 19/19 meta-api tests pass
- 13/13 core tests pass
- 18/18 api tests pass

**Next Sprint Focus:**
R4 — Multi-Tenant Isolation

## 2026-07-08 — R5 Config-Driven Workflow Integration

**Summary:**
Added `send_template_message` action type to the workflow engine, wired the workflow engine into campaign launch path as an alternative to direct template sending, and wrote tests. The `send_template_message` action looks up a WATemplate by name from the DB (tenant-scoped) and sends it via MetaApiClient.sendTemplate with optional body parameters. Campaigns can now optionally reference a Workflow — when `workflowId` is set, `CampaignService.send()` delegates to `EngineService.process()` with a `campaign_start` trigger, allowing the workflow's handlers to orchestrate sending.

**Completed:**
- Added `send_template_message` to `ActionType` union + JSON schema in `packages/schemas`
- Added `template_params?: string[]` to Action interface for template body variable substitution
- Added `send_template_message` handler to `DefaultActionExecutor` (warns in core, implemented in app wiring)
- Added `setSendTemplateFunction` to `EngineService` and wired it to `MetaApiClient.sendTemplate` in `MessagingService`
- Added `WATemplate` repository injection to `EngineModule` + `EngineService` for tenant-scoped template lookups
- Fixed `send_template_message` handler to look up contact phone number (not UUID) before sending
- Added optional `workflowId` column + `@ManyToOne(() => Workflow)` relation to Campaign entity
- Updated `CampaignModule` — imports `EngineModule`, adds Workflow entity
- Refactored `CampaignService.send()` — supports two modes: direct template send (existing) and workflow engine mode (when campaign.workflowId is set)
- Updated `CampaignController.create()` — accepts optional `workflowId`
- 8 new unit tests: workflow create (success + not-found), workflow send (success + engine error)
- Updated integration tests to pass new constructor params (WorkflowRepo + EngineService)

**Key Changes:**
- `send_template_message` action enables workflows to send WhatsApp templates by name (resolved via DB)
- Campaign workflow mode provides an alternative launch path using the existing `WorkflowEngine` — workflows can orchestrate complex multi-step campaigns
- WATemplate repo added to EngineModule for action executor template lookups

**Build & Test:**
- 5/5 packages build
- 61/61 tests pass (19 meta-api + 13 core + 29 api)
- New tests: 8 unit (create with workflowId, workflow send success/fail) + integration test updates

**Next Sprint Focus:**
R6 — Advanced Campaign Features (scheduling, A/B testing, analytics)

## 2026-07-14 — R4 Deferred: Tenant-Scoped MetaApiClient

**Summary:**
Completed the deferred R4 item: tenant-scoped MetaApiClient credential passthrough. Both EngineService (for workflow engine send_template_message actions) and CampaignService (for direct campaign sends) now resolve the tenant's Meta credentials (phoneNumberId, accessToken) from the Tenant entity at call time and pass them to MetaApiClient methods. Existing tests continue to work (fall back to global env creds when tenant has no stored credentials), and a new unit test verifies the credential passthrough.

**Completed:**
- EngineService.send_template_message handler: looks up tenant credentials and passes to sendTemplateFn callback
- MessagingService.sendTemplate: forwards tenantCreds to MetaApiClient.sendTemplate
- CampaignService.send() direct mode: looks up tenant credentials once before the send loop, passes to MetaApiClient.sendTemplate per contact
- CampaignModule: added Tenant entity to TypeOrm.forFeature
- New unit test: "passes tenant credentials to MetaApiClient when tenant has phoneNumberId and accessToken"

**Key Changes:**
- Tenant credential resolution is now done at point-of-use (EngineService + CampaignService), not via a request-scoped factory
- Falls back gracefully to global env vars when tenant has no stored credentials
- No architectural restructuring needed — leverages existing MetaApiClient.tenantCreds parameter

**Build & Test:**
- 5/5 packages build
- 30/30 API tests pass (24 unit + 6 integration)

**Next Sprint Focus:**
R6 — Advanced Campaign Features

## 2026-07-14 — R6 Advanced Campaign Features

**Summary:**
Implemented four advanced campaign features: (1) campaign scheduling via `scheduledAt` column + BullMQ campaign-launch queue with delayed job dispatch, (2) per-tenant rate limiting using `campaign_max_sends_per_minute` from Tenant config with in-memory sliding window enforcement, (3) campaign analytics API endpoint (`GET /campaigns/:id/stats`) returning aggregated delivery metrics, and (4) CSV import with tag assignment — GroupsService `importCsv()` now accepts optional `tags` per row and creates `ContactTag` records. All 29 tests pass (23 unit + 6 integration).

**Completed:**
- Added `scheduledAt` column to Campaign entity
- Added `campaign-launch` queue to QueueService with CampaignLaunchJob type + worker
- CampaignService.send() routes to queue when `scheduledAt` is in the future; sets status to "scheduled" and returns early
- Campaign status "scheduled" guarded by ConflictException (prevents double-scheduling)
- Rate limiting: reads `campaign_max_sends_per_minute` from Tenant.config JSON; `acquireRateLimit()` with in-memory sliding window per tenant
- Analytics endpoint: `GET /campaigns/:id/stats` returns total, pending, sent, delivered, read, failed + sentRate/deliveryRate/readRate
- CSV import: GroupsService.importCsv() accepts `tags?: string[]` per row; saves ContactTag records via ContactTagRepo
- GroupsModule: added ContactTag to TypeOrm.forFeature
- 5 new test cases: scheduling (scheduled sends to queue, ConflictException for already scheduled), getStats (aggregated counts), create with scheduledAt, rate limit (respects campaign_max_sends_per_minute)

**Key Changes:**
- Campaign send flow now has three paths: immediate send (no scheduledAt, or past), scheduled queue (future scheduledAt), or ConflictException (already scheduled/sending)
- Rate limiting is purely additive — no effect unless `campaign_max_sends_per_minute` is set in Tenant config
- Contact tags now have an import path via Groups CSV, complementing the existing tag_user workflow action

**Build & Test:**
- 5/5 packages build
- 29/29 tests pass (23 unit + 6 integration)

**Next Sprint Focus:**
R7 — Mediation Workflows

## 2026-07-14 — R7 Mediation Workflows + R8 Hardening

**Summary:**
Completed R7 Mediation Workflows and R8 Hardening & Polish. R7: Built the MediationsModule with CRUD API (list, get, close mediation sessions), added mediation timeout handling via setTimeout that fires on_timeout actions from the workflow config, and verified the existing mediation infrastructure (entity, resolveMediationParty, relay_to_party action) was already wired end-to-end. R8: Added global AllExceptionsFilter for proper error handling, updated HealthController with database connectivity check (SELECT 1), and verified all existing hardening (helmet, CORS, rate-limit, pino logging, seed script) was already in place.

**Completed (R7):**
- Created MediationsModule with controller + service (GET /mediations, GET /mediations/:id, POST /mediations/:id/close)
- Added JwtAuthGuard + @CurrentTenant to mediation endpoints for tenant isolation
- Mediation timeout: EngineService.process() schedules setTimeout when config.type === "mediation" and timeout_ms > 0; fires on_timeout actions and marks session "timed_out"
- 5 new mediation tests (findAll, findOne, findOne not found, close active, close already closed)
- Registered MediationsModule in app.module.ts

**Completed (R8):**
- Created AllExceptionsFilter (global error handler with structured logging)
- Registered AllExceptionsFilter in main.ts via useGlobalFilters()
- Updated HealthController with @InjectDataSource() and SELECT 1 health check
- Verified: Helmet, CORS, @fastify/rate-limit (100 req/min), pino LoggerModule all already configured
- Verified: scripts/seed.ts exists and functional

**Build & Test:**
- 5/5 packages build
- 34/34 tests pass (29 api + 5 mediation)

**Next Sprint Focus:**
R9 — Documentation & Deployment

## 2026-07-14 — R9 Documentation & Deployment

**Summary:**
Completed the final project phase. Updated README.md with project description, architecture overview, and wa-manager attribution. Created SETUP.md with local development setup guide covering prerequisites, installation, Meta API setup, testing, and Docker Compose usage. Fixed the API Dockerfile (removed stale `apps/worker` reference, corrected port to 8080). Updated docker-compose.yml to include a Redis service and pass REDIS_URL to the API. All R1-R9 phases are now complete.

**Completed:**
- Updated README.md — project description, architecture table, attribution to wa-manager
- Created SETUP.md — local dev guide (prerequisites, install, Meta setup, tests, Docker)
- Fixed apps/api/Dockerfile — removed worker ref, corrected EXPOSE port to 8080
- Updated infrastructure/docker-compose.yml — added Redis service with healthcheck, REDIS_URL env var

**Build & Test:**
- 5/5 packages build
- 34/34 tests pass

**Next Sprint Focus:**
All phases complete. Project is ready for production deployment and maintenance.

## 2026-07-08 — R4 Multi-Tenant Isolation

**Summary:**
Added full multi-tenant isolation across all entities and services. Made tenantId required on WATemplate, ContactGroup, CampaignMessage, and AdminUser entities. Added Meta credential fields to Tenant entity (phoneNumberId, accessToken, appSecret, appId, wabaId). Added tenantId to JWT payload. Created @CurrentTenant() decorator and TenantsModule (CRUD). Refactored Templates, Groups, and Campaigns services to filter all queries by tenantId. Added JwtAuthGuard to all affected API controllers. 6 tenant isolation integration tests verify cross-tenant data separation.

**Completed:**
- Made tenantId required on 4 entities (WATemplate, ContactGroup, CampaignMessage, AdminUser)
- Added Meta credential columns to Tenant entity
- Added tenantId to JWT payload (auth.service, jwt.strategy)
- Created @CurrentTenant() decorator for extracting tenantId from JWT
- Created TenantsModule with full CRUD
- Refactored TemplatesModule — all queries scoped to tenantId
- Refactored GroupsModule — all queries scoped to tenantId
- Refactored CampaignsModule — all queries scoped to tenantId, campaign_message tenantId propagation
- Exported JwtAuthGuard from AuthModule for use across controllers
- 6 integration tests covering tenant isolation scenarios

**Key Changes:**
- tenantId is now always required on tenant-scoped entities (no nullable columns)
- JWT includes tenantId extracted from AdminUser record
- All template/group/campaign endpoints require JWT auth
- Controllers extract tenantId from JWT via @CurrentTenant() decorator
- Tenant entity stores per-tenant Meta credentials (credential override wiring deferred)

**Build & Test:**
- 5/5 packages build
- 51/51 tests pass (19 meta-api + 13 core + 19 api)

**Next Sprint Focus:**
R5 — Config-Driven Workflow Integration

## 2026-07-01 — R1 Foundation Reset & R2 Meta API Backend

**Summary:**
Executed the wa-manager rebase. R1 removed obsolete v1 code (old dashboard, adapters, memory, worker packages) and adopted wa-manager's Next.js dashboard + Docker Compose. R2 created `packages/meta-api` (typed Meta Cloud API wrapper with sendTemplate, sendText, sendImage, uploadMedia, submitTemplate, listTemplates, webhook HMAC validation) and refactored the NestJS API to use it — replacing the whatsapp-web.js adapter with Meta Cloud API webhooks.

**Completed:**

- R1: Removed obsolete `apps/dashboard` (old React/Vite), `packages/adapters`, `packages/memory`, `apps/worker`
- R1: Adopted wa-manager's Next.js 15 frontend as new `apps/dashboard`
- R1: Wrote new `infrastructure/docker-compose.yml` (postgres + api + dashboard)
- R1: Updated `.env.example` with Meta Cloud API vars
- R2: Created `packages/meta-api` — typed wrapper around Meta WhatsApp Cloud REST API
- R2: Implemented core Meta methods: sendTemplate, sendImage, sendText, uploadMedia, submitTemplate, listTemplates
- R2: Implemented webhook verification (GET challenge) + HMAC-SHA256 signature validation (with OLD_META_APP_SECRET rotation)
- R2: Created CampaignMessage entity for delivery status tracking
- R2: Created WebhooksModule (controller + service) for Meta delivery callbacks
- R2: Refactored MessagingModule to use MetaApiClient instead of WwjsAdapter
- R2: Refactored EngineService to use sendMessageFn callback (wired to MetaApiClient)
- R2: Refactored DelayedMessageProcessor to use sendMessageFn callback
- R2: Fixed packages/core to self-contain MemoryProvider/SessionState types (removed dependency on deleted @convorchestrate/memory)
- R2: Removed old qr.controller.ts, message-normalizer.ts (whatsapp-web.js artifacts)

**Key Changes:**

- WhatsApp transport switched from Puppeteer-based whatsapp-web.js to Meta's official Cloud API
- Session state management moved from RedisMemoryProvider to InMemoryProvider (in core)
- Incoming message flow: Meta Webhook → WebhooksController → MessagingService → BullMQ → EngineService → MetaApiClient
- Internal message interface changed from IncomingRawMessage (whatsapp-web.js format) to IncomingWebhookMessage (Meta webhook format)

**Build & Test:**

- 5/5 packages build (core, meta-api, schemas, utils, api)
- 19/19 meta-api tests pass
- 13/13 core engine tests pass

**Next Sprint Focus:**
R3 — Campaign Engine NestJS Port. Create TypeORM entities (WATemplate, ContactGroup, Contact, Campaign, CampaignMessage), port campaign CRUD + async send engine with per-message tracking, port CSV import, port webhook receiver.
