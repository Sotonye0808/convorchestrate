# Development Task Queue

This queue lists actionable tasks for the current sprint.
Agents should take tasks top-to-bottom and keep them small and verifiable.
Update this file whenever the sprint focus changes.
Use .ai-system/docs/build-plan.md for detailed requirements.

## Current Sprint
All 8 build phases complete. Focus is now on demo mode, local testing setup, and deployment.

## Up Next
- [ ] Add demo mode toggle + simulated message endpoint
- [ ] Write local testing guide
- [ ] Write deployment guide
- [ ] Seed script for demo data

## Backlog
- [ ] Add on_timeout handling to WorkflowEngine
- [ ] Add media-processing queue in BullMQ
- [ ] Add OCR processing pipeline
- [ ] Add contact import via CSV upload
- [ ] Add webhook event logging to EventLog table
- [ ] Add admin user CRUD endpoints
- [ ] Add tenant management endpoints
- [ ] Integration tests with test DB

## Completed This Sprint

### Phase 2 — WhatsApp Adapter + Ingress
- [x] WwjsAdapter with LocalAuth, QR EventEmitter, rate limiter, disconnect/reconnect
- [x] RateLimiter utility (per-phone send throttling with jitter)
- [x] Message normalizer (raw -> NormalizedMessage)
- [x] MessagingModule + MessagingService with tenant/contact/workflow/session lookup
- [x] QR controller with SSE stream
- [x] EngineModule + EngineService wrapping WorkflowEngine with real ActionExecutor
- [x] @convorchestrate/adapters package installed (whatsapp-web.js + qrcode-terminal)

### Phase 3 — Media + Tagging
- [x] store_media action (download via adapter, save to disk, create Media record)
- [x] tag_user action (upsert ContactTag via QueryBuilder OR UPDATE)
- [x] MediaController with POST /media/:sessionId/upload (@fastify/multipart)
- [x] @fastify/multipart registered in main.ts
- [x] MediaModule added to AppModule

### Phase 4 — Sequential + Mediation
- [x] WorkflowEngine.processSequential() — step-based progression with current_step in session state
- [x] WorkflowEngine.processMediation() — cross-party relay with MediationContext
- [x] transition_step action (in-memory mutation + persist)
- [x] delay action inline (enqueues delayed-message job via QueueService)
- [x] trigger_webhook inline (enqueues webhook-trigger job via QueueService)
- [x] relay_to_party action (looks up MediationSession, resolves target contact, applies transform)
- [x] MediationContext built in MessagingService.handleIncoming()
- [x] resolveMediationParty() for buyer/seller pairing
- [x] 4 new core tests (2 sequential, 2 mediation)

### Phase 5 — BullMQ Queue System
- [x] bullmq + ioredis installed in api app
- [x] QueueModule (@Global) with QueueService
- [x] 3 queues: workflow-execution, delayed-message, webhook-trigger (BullMQ backoff configs)
- [x] DelayedMessageProcessor + WebhookProcessor registered as providers
- [x] Workflow handler registered from MessagingService.onModuleInit()
- [x] EngineService delay action enqueues DelayedMessageJob with delay option
- [x] EngineService trigger_webhook action enqueues WebhookTriggerJob (retries via BullMQ)
- [x] MessagingService.handleIncoming() enqueues WorkflowExecutionJob instead of direct call

### Phase 6 — Campaigns
- [x] Campaign entity created (name, workflowId, status, contactList JSONB, totals, timestamps)
- [x] CampaignService.create() / findAll() / findById()
- [x] CampaignService.launch() — iterates contact list, upserts contacts, creates sessions, enqueues campaign_start events
- [x] CampaignController: POST /campaigns, GET /campaigns, POST /campaigns/:id/launch
- [x] Rate limiting: config-driven campaign_max_sends_per_minute in tenant config
- [x] CampaignModule wired into AppModule

### Phase 7 — Admin Dashboard
- [x] AuthModule: JWT login, bcrypt, Passport JWT strategy
- [x] DashboardModule: GET /dashboard/stats (aggregate counts)
- [x] ContactsModule: GET /contacts with search, pagination, tags
- [x] WorkflowsModule: GET/PUT/POST workflows
- [x] EventsModule: GET /events with filters + replay endpoint
- [x] SessionsModule: GET /sessions with filters
- [x] SettingsModule: GET/PUT tenant config
- [x] 7 React pages: Login, Dashboard, Workflows (Monaco editor), Contacts, Campaigns, Logs, Settings
- [x] AuthContext, Layout (sidebar + topbar), ProtectedRoute
- [x] Axios client with Bearer token interceptor

### Phase 8 — Hardening + Deploy
- [x] @fastify/helmet registered (contentSecurityPolicy: false)
- [x] @fastify/cors registered (configurable from CORS_ORIGIN env)
- [x] @fastify/rate-limit (100 req/min/IP)
- [x] nestjs-pino LoggerModule with pino-pretty for dev, JSON for production
- [x] HealthModule: GET /health (status, timestamp, uptime)
- [x] Events replay: GET /events/replay/:traceId
- [x] Production Dockerfiles (root, apps/api, apps/worker) — multi-stage, non-root user
- [x] .env.example with all 10 variables
- [x] docker-compose.yml updated with restart policies

## Notes
- Adapter isolation and tenant-first queries are strict constraints
- All 8 packages build successfully
- 13 core unit tests pass (reactive, sequential, mediation workflow types)
- Preview mode and deployment guides are the final pending items
