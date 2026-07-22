a# Convorchestrate

WhatsApp orchestration platform — multi-tenant campaign engine, config-driven workflows, and mediation support powered by Meta WhatsApp Cloud API.

Built on top of the open-source [wa-manager](https://github.com/godopetza/wa-manager) campaign engine.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 |
| Backend | NestJS 10 + Fastify |
| Database | PostgreSQL 16 (TypeORM) |
| Queue | Redis + BullMQ |
| WhatsApp | Meta Cloud API v22.0 |

## Project Structure

```
apps/
  api/          NestJS API (campaigns, templates, groups, mediation, webhooks)
  dashboard/    Next.js admin dashboard
packages/
  core/         Config-driven workflow engine
  meta-api/     Typed Meta WhatsApp Cloud API wrapper
  schemas/      Workflow JSON schema + validators
  utils/        Shared helpers
infrastructure/ Docker Compose (postgres + api + dashboard)
scripts/        Database seed scripts
```

## Quick Start

See [SETUP.md](./SETUP.md) for local development setup.

## Attribution

This project incorporates the campaign engine from [wa-manager](https://github.com/godopetza/wa-manager) by godopetza, including async send with semaphore concurrency, per-message delivery tracking, template management, contact groups, and CSV import.
