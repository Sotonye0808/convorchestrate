# Project Decisions

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Log of significant architectural, technical, and product decisions. Agents consult this before proposing changes to avoid contradicting prior reasoning. Uses supersedes/superseded-by links so contradictory entries are explicitly resolved rather than both appearing equally valid.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Role / Agent / Developer]
**Supersedes:** [link to any prior decision this replaces, or None]
**Superseded by:** [link to any newer decision that replaces this, or None]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

## WhatsApp Transport via whatsapp-web.js

**Decision:** Use whatsapp-web.js with LocalAuth for session persistence.
**Date:** 2026-05-06
**Made by:** Project plan
**Supersedes:** None
**Superseded by:** None

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
**Supersedes:** None
**Superseded by:** None

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
**Supersedes:** None
**Superseded by:** None

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
**Supersedes:** None
**Superseded by:** None

**Reason:**
Shared DB multi-tenant model requires strict isolation for security and correctness.

**Alternatives Considered:**
Separate databases per tenant.

**Implications:**
Repository methods must enforce tenant filters.

## Config-Driven State Persistence

**Decision:** State persistence after action execution is controlled by the `persist_state` field on each Action in the workflow config, not by hardcoded logic in the engine.
**Date:** 2026-06-23
**Made by:** Architecture review
**Supersedes:** None
**Superseded by:** None

**Reason:**
The original engine hardcoded which action types are "state-mutating" (set_context, clear_session, transition_step). This violates the config-driven principle — the engine should not decide this. The persist_state field moves this decision to the config author, with sensible defaults maintained in the engine for backward compatibility.

**Alternatives Considered:**
- Hardcoded set in the engine (original approach — rejected for violating section 1.1)
- Separate mutating/non-mutating action type categories in schema (rejected — adds type complexity)

**Implications:**
- Workflow configs can now explicitly opt-in or opt-out of state persistence per action
- Existing configs without persist_state use the engine's default set (unchanged behavior)
- The STATE_MUTATING_TYPES set in engine.ts serves as the documentation of defaults

## Fastify 4 Plugin Pinning

**Decision:** Pin `@fastify/*` plugins to versions compatible with Fastify 4.x.
**Date:** 2026-06-24
**Made by:** Runtime error during startup
**Supersedes:** None
**Superseded by:** None

**Reason:**
NestJS 10's `@nestjs/platform-fastify` depends on Fastify 4.x. The `@fastify/*` plugin ecosystem has moved to Fastify 5.x for newer major versions.

**Alternatives Considered:**
- Upgrading NestJS to v11 for Fastify 5 support (not yet stable, would require major migration)
- Removing the plugins entirely (loses Helmet, rate limiting, multipart upload)
- Ignoring the warnings (undocumented behaviour risk)

**Implications:**
- New `@fastify/*` plugins added in future must be checked for Fastify 4 compatibility
- A future NestJS upgrade can unlock Fastify 5 and the latest plugin versions

## Mediation Sessions — party_b_contact_id Made Nullable

**Decision:** Allow `party_b_contact_id` in `mediation_sessions` to be NULL.
**Date:** 2026-06-24
**Made by:** Schema review
**Supersedes:** None
**Superseded by:** None

**Reason:**
When creating a mediation session, Party B (the respondent) may not be known at creation time. They are discovered dynamically when a message arrives that matches the mediation trigger.

**Alternatives Considered:**
- Requiring a placeholder contact (rejected — adds confusion)

**Implications:**
- Migration alters `mediation_sessions` to make `party_b_contact_id` nullable
- Engine's `resolveMediationParty()` must handle the case where `partyBContactId` is null
