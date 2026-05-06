# Project Decisions

This file records major architecture and product decisions.
It prevents re-litigating choices and preserves the rationale.
Add new entries when decisions affect long-term direction.
Use the format below for consistency.

## Decisions

## WhatsApp Transport via whatsapp-web.js

**Decision:** Use whatsapp-web.js with LocalAuth for session persistence.
**Date:** 2026-05-06
**Made by:** Project plan

**Reason:**
It is actively maintained with solid TypeScript support and keeps the stack free.

**Alternatives Considered:**
OpenWA, official WhatsApp Business API.

**Implications:**
Adapter must handle reconnects and QR re-auth flows.

## Queueing with BullMQ

**Decision:** Use BullMQ on top of Redis for asynchronous execution.
**Date:** 2026-05-06
**Made by:** Project plan

**Reason:**
BullMQ provides retries, delays, and visibility needed for workflow execution.

**Alternatives Considered:**
Raw Redis pub/sub, custom job scheduler.

**Implications:**
Worker app is required and all message processing must be queued.

## Config-Driven Workflow Engine

**Decision:** All workflow behavior is defined in JSON config stored in DB.
**Date:** 2026-05-06
**Made by:** Project plan

**Reason:**
This keeps the engine generic and prevents hardcoded business logic.

**Alternatives Considered:**
Hardcoded rules or code-based workflows.

**Implications:**
Schema validation and config tooling are mandatory.

## Tenant-First Data Isolation

**Decision:** Every query includes tenant_id and services accept tenantId.
**Date:** 2026-05-06
**Made by:** Project plan

**Reason:**
Shared DB multi-tenant model requires strict isolation for security and correctness.

**Alternatives Considered:**
Separate databases per tenant.

**Implications:**
Repository methods must enforce tenant filters.

