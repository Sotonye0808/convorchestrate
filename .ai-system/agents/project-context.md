# Project Context

Convorchestrate is a SaaS platform for orchestrating WhatsApp workflows.
It focuses on predictable, config-driven interactions rather than open chat.
The platform targets teams who need to automate verification, marketing, or mediation.
This document explains the purpose, users, and constraints driving the build.

## Project Purpose
The goal is to run WhatsApp workflows using JSON configuration and a reliable engine.
The system must support multi-tenant operation and safe orchestration at scale.

## Target Users
These users manage and monitor workflows via the admin dashboard.
They need clear visibility into contacts, sessions, and outcomes.

| User Type | Needs | Key Interactions |
|-----------|-------|-----------------|
| Admin | Configure workflows and settings | Create workflows, manage tenants |
| Operator | Monitor sessions and campaigns | View logs, launch campaigns |
| Analyst | Review outcomes and tags | Export data, inspect sessions |

## Business Constraints
These constraints are non-negotiable and should guide all decisions.
They come directly from the build plan and architecture rules.

- Multi-tenant isolation on every query
- Config-driven behavior, no hardcoded workflow logic
- Free stack only, self-hostable infrastructure
- Adapter isolation between core and channels

## Current Project Phase
This project is in active development. All 8 build phases are complete (scaffold → hardening).
The API app starts successfully with all modules initialized and all routes mapped.

Phase: Active Development
Active sprint focus: Testing, demo mode, and deployment

## Tech Decisions Already Made
These decisions are locked unless explicitly revisited.
They reflect the plan in .ai-system/docs/build-plan.md.

| Decision | Reason |
|----------|--------|
| NestJS + Fastify | High-performance API framework |
| PostgreSQL + TypeORM | Relational data + migrations |
| Redis + BullMQ | Queueing and background jobs |
| whatsapp-web.js | Most maintained WhatsApp Web adapter |
| Config-driven workflows | Avoid hardcoded business rules |

## Out of Scope
This scope list prevents early feature creep.
Items here should not be built in the MVP.

- AI/NLP message processing
- OCR-based verification
- Multi-channel support beyond WhatsApp
- Official WhatsApp Business API integration
- Payments and billing

## External Integrations
Only required external integrations are listed here.
Keep this list minimal and self-hostable.

| Service | Purpose | Auth Method |
|---------|---------|------------|
| WhatsApp Web | Message transport | LocalAuth session |

