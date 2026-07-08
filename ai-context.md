# Project AI Context — Convorchestrate

> **Metadata**
>
> - last-updated-by: R2-meta-api-refactor
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify before trusting if project structure has changed

> **Overview:** Project overview — the very first file any AI agent should read. Provides a 30-second orientation to what this project is, what stack it uses, and where to find everything.

---

## Quick Reference

| Field            | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| Project Name     | Convorchestrate                                           |
| Type             | Web App / SaaS                                            |
| Primary Language | TypeScript                                                |
| Frontend         | Next.js 15 + React 19 (dashboard adopted from wa-manager) |
| Backend          | NestJS 10 + Fastify                                       |
| Database         | PostgreSQL 16 + TypeORM                                   |
| Queue/Cache      | Redis 7 + BullMQ                                          |
| WhatsApp         | Meta WhatsApp Cloud API (packages/meta-api)               |
| Monorepo         | Turborepo                                                 |

---

## What It Does

Convorchestrate is a config-driven, multi-tenant WhatsApp conversation orchestration SaaS. It executes workflows defined in JSON and avoids hardcoded business rules. The system automates contact verification campaigns, runs marketing engagement funnels, and mediates buyer-seller conversations in marketplace contexts. Rebased on [wa-manager](https://github.com/godopetza/wa-manager) — an open-source WhatsApp campaign manager.

---

## Key Modules

| Module    | Location          | Purpose                                             |
| --------- | ----------------- | --------------------------------------------------- |
| API       | apps/api          | NestJS HTTP API, Meta Cloud API integration         |
| Dashboard | apps/dashboard    | Next.js 15 admin UI (wa-manager frontend)           |
| Core      | packages/core     | Workflow engine, action execution, InMemoryProvider |
| Meta API  | packages/meta-api | Typed Meta WhatsApp Cloud REST API wrapper          |
| Schemas   | packages/schemas  | Workflow JSON schema + validators                   |
| Utils     | packages/utils    | Shared types and helpers                            |

**Removed (v1 → v2):** `apps/worker`, `packages/adapters` (whatsapp-web.js), `packages/memory` — replaced by Meta Cloud API + InMemoryProvider

---

## Architecture Principles

- **Config-driven first**: no hardcoded workflow logic
- **Wrapper isolation**: Meta API behind stable MetaApiClient interface
- **Tenant-first**: every query filters by tenant_id (planned for Phase R4)
- **All messages through BullMQ**: never inline on webhook thread
- **Fallback discipline**: tenant credential overrides, OLD_META_APP_SECRET rotation

---

## Entry Point

The AI system documentation lives in `ai-system/`. Start with: `ai-system/protocols/entry-protocol.md`

---

## Active Development Focus

Phased migration from v1 to wa-manager foundation. R1 (Foundation Reset) and R2 (Meta API Backend) are complete. Upcoming: R3 (Campaign Engine Port — port wa-manager campaign data model to TypeORM + async send engine + CSV import + delivery tracking), R4 (Multi-tenancy), R5 (Config-driven Workflows), R6-R9 (hardening, docs, deployment).
