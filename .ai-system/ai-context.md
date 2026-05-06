# Project: Convorchestrate

Convorchestrate is a config-driven, multi-tenant WhatsApp conversation orchestration SaaS.
It executes workflows defined in JSON and avoids hardcoded business rules.
The system is built as a Turborepo monorepo with NestJS services, a React dashboard, and shared packages.
PostgreSQL stores core data while Redis powers cache and queues.
This file is the quick orientation entry point for AI tools.

## What it does
This project automates WhatsApp-based workflows for verification, marketing, and mediation.
It is designed to run predictable, auditable flows rather than open-ended chat.
- Automates contact verification campaigns (primary use case)
- Runs marketing engagement funnels
- Mediates buyer-seller conversations in marketplace contexts

## Stack
The stack is intentionally free-tier and self-hostable.
It uses NestJS for API and worker services, React for the dashboard, and shared TypeScript packages.
- NestJS 10 + Fastify | TypeScript strict mode | Node 20 LTS
- PostgreSQL 16 + TypeORM | Redis 7 + BullMQ
- whatsapp-web.js (channel adapter) | React 18 + Vite + Tailwind (dashboard)
- Turborepo monorepo

## Architecture principles
The architecture is tenant-first and config-driven.
Core workflow logic never imports adapters, and all behavior is driven by JSON config.
- Config-driven first: no hardcoded workflow logic
- Adapter isolation: core never imports adapters
- Tenant-first: every query filters by tenant_id

## Build plan reference
See .ai-system/docs/build-plan.md for phases, schema, and implementation detail.

