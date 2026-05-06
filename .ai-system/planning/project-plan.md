# Project Plan

This plan tracks high-level progress across the build phases.
Each phase aligns with the detailed plan in .ai-system/docs/build-plan.md.
Update checkboxes as work is completed so progress is visible at a glance.
The task queue in planning/task-queue.md contains the actionable steps.

## Phase 0 - Monorepo Scaffold
This phase establishes the monorepo, Docker stack, and database migrations.
All foundational structure must be complete before engine work begins.

- [ ] Monorepo scaffold with apps and packages
- [ ] Docker compose for postgres, redis, api, worker, dashboard
- [ ] TypeORM entities for all tables
- [ ] Initial migration created and applied
- [ ] .env.example with required variables

## Phase 1 - Engine Core
This phase implements workflow contracts, validation, and the core engine.
Unit tests must validate the reactive workflow path.

- [ ] Workflow types and JSON schema
- [ ] MemoryProvider interface + Redis implementation
- [ ] WorkflowEngine.process() for reactive workflows
- [ ] ActionExecutor for core actions
- [ ] Unit tests for engine and conditions

## Phase 2 - WhatsApp Adapter + Ingress
This phase connects whatsapp-web.js to the engine through the API.
Inbound messages must be normalized and queued.

- [ ] Channel adapter implementation
- [ ] QR streaming controller
- [ ] Messaging module wiring
- [ ] Outbound send_message action
- [ ] Rate limiter and jitter

## Phase 3 - Media + Tagging
This phase completes contact verification workflows end-to-end.
Media storage and tagging must persist data correctly.

- [ ] store_media action
- [ ] tag_user action
- [ ] Media controller for uploads
- [ ] Verification flow manual test

## Phase 4 - Sequential + Mediation
This phase adds sequential and mediation workflow support.
Relay and delay behavior should be fully operational.

- [ ] Sequential steps and transition_step action
- [ ] Mediation session support
- [ ] relay_to_party action
- [ ] delay and trigger_webhook actions

## Phase 5 - Queue System
This phase routes all processing through BullMQ queues.
It ensures async execution and reliable retries.

- [ ] Queue module and processors
- [ ] workflow-execution queue
- [ ] delayed-message queue
- [ ] webhook-trigger queue

## Phase 6 - Campaigns
This phase enables bulk messaging and campaign management.
Rate limiting must be enforced at tenant level.

- [ ] Campaign entity and endpoints
- [ ] Campaign launch flow
- [ ] Campaign rate limiting

## Phase 7 - Admin Dashboard
This phase implements all seven required dashboard pages.
Validation and workflow editing must be fully usable.

- [ ] Login
- [ ] Dashboard home
- [ ] Workflows editor
- [ ] Contacts page
- [ ] Campaigns page
- [ ] Logs page
- [ ] Settings page

## Phase 8 - Hardening + Deploy
This phase hardens security and prepares production deployment.
Docker builds and health checks must pass.

- [ ] Helmet, CORS, rate limiting
- [ ] Structured logging with trace_id
- [ ] Health endpoints
- [ ] Production Dockerfiles
- [ ] docker compose build verified

