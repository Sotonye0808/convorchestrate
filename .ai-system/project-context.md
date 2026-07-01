# Project Context

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify if >10 sessions old or after major scope changes

> **Overview:** Why this project exists, who it serves, and what constraints govern development. Agents should read this to understand the "why" behind the work.

---

## Project Purpose

Convorchestrate is a SaaS platform for orchestrating WhatsApp workflows. It focuses on predictable, config-driven interactions rather than open chat. The platform targets teams who need to automate verification, marketing, or mediation.

---

## Target Users

| User Type | Needs | Key Interactions |
|-----------|-------|-----------------|
| Admin | Configure workflows and settings | Create workflows, manage tenants |
| Operator | Monitor sessions and campaigns | View logs, launch campaigns |
| Analyst | Review outcomes and tags | Export data, inspect sessions |

---

## Business Constraints

- Multi-tenant isolation on every query
- Config-driven behavior, no hardcoded workflow logic
- Free stack only, self-hostable infrastructure
- Adapter isolation between core and channels

---

## Current Project Phase

Phase: Active Development

Active sprint focus: Demo mode, local testing, deployment preparation

---

## Tech Decisions Already Made

| Decision | Reason |
|----------|--------|
| NestJS + Fastify | High-performance API framework |
| PostgreSQL + TypeORM | Relational data + migrations |
| Meta WhatsApp Cloud API | Official, reliable, no Puppeteer dependency (replaces whatsapp-web.js) |
| Next.js 15 + React 19 | Modern, production-tested dashboard (from wa-manager) |
| Config-driven workflows | Avoid hardcoded business rules |
| Multi-tenant isolation | Tenant_id on every query |

---

## Out of Scope

- AI/NLP message processing
- OCR-based verification
- Multi-channel support beyond WhatsApp
- Official WhatsApp Business API integration
- Payments and billing

---

## External Integrations

| Service | Purpose | Auth Method |
|---------|---------|------------|
| Meta WhatsApp Cloud API | Message transport (templates, images, text) | OAuth Bearer token |
| WhatsApp Web | Optional legacy transport (via whatsapp-web.js, deprecated) | LocalAuth session |
