# Project Plan

This plan tracks high-level progress across the build phases.
Each phase aligns with the detailed plan in .ai-system/docs/build-plan.md.
Update checkboxes as work is completed so progress is visible at a glance.
The task queue in planning/task-queue.md contains the actionable steps.

## Phase 0 - Monorepo Scaffold
- [x] Monorepo scaffold with apps and packages
- [x] Docker compose for postgres, redis, api, worker, dashboard
- [x] TypeORM entities for all tables
- [x] Initial migration created and applied
- [x] .env.example with required variables

## Phase 1 - Engine Core
- [x] Workflow types and JSON schema
- [x] MemoryProvider interface + Redis implementation
- [x] WorkflowEngine.process() for reactive workflows
- [x] ActionExecutor for core actions
- [x] Unit tests for engine and conditions

## Phase 2 - WhatsApp Adapter + Ingress
- [x] Channel adapter implementation
- [x] QR streaming controller
- [x] Messaging module wiring
- [x] Outbound send_message action
- [x] Rate limiter and jitter

## Phase 3 - Media + Tagging
- [x] store_media action
- [x] tag_user action
- [x] Media controller for uploads
- [x] Verification flow manual test

## Phase 4 - Sequential + Mediation
- [x] Sequential steps and transition_step action
- [x] Mediation session support
- [x] relay_to_party action
- [x] delay and trigger_webhook actions

## Phase 5 - Queue System
- [x] Queue module and processors
- [x] workflow-execution queue
- [x] delayed-message queue
- [x] webhook-trigger queue

## Phase 6 - Campaigns
- [x] Campaign entity and endpoints
- [x] Campaign launch flow
- [x] Campaign rate limiting

## Phase 7 - Admin Dashboard
- [x] Login
- [x] Dashboard home
- [x] Workflows editor
- [x] Contacts page
- [x] Campaigns page
- [x] Logs page
- [x] Settings page

## Phase 8 - Hardening + Deploy
- [x] Helmet, CORS, rate limiting
- [x] Structured logging with trace_id
- [x] Health endpoints
- [x] Production Dockerfiles
- [x] docker compose build verified

## Post-Launch — Demo Mode + Testing
- [x] Demo mode toggle in admin dashboard
- [x] Simulated message endpoint for testing
- [x] Seed script for demo data
- [x] Local testing guide (SETUP.md)
- [x] Deployment guide (SETUP.md)
