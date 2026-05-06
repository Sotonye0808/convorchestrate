# Convorchestrate — AI Agent Prompt Kit

> **How to use this file:**
> This kit contains all prompts needed to build the project from zero to deployed.
> It is structured around the `.ai-system` workflow (Continue + Cline).
> Read the "Setup" section first. Then use prompts in order.
> After any interruption, use the **Resume Prompt** to get back on track instantly.

---

## SETUP — Before Your First Session

### 1. Add the plan to your project

Copy `whatsapp-orchestration-saas-plan.md` into your project root as:
```
convorchestrate/
└── .ai-system/
    └── docs/
        └── build-plan.md    ← paste the full plan here
```

### 2. Seed your `.ai-context.md`

Paste this as the entire contents of `.ai-system/.ai-context.md`:

```markdown
# Project: Convorchestrate

A config-driven, multi-tenant WhatsApp Conversation Orchestration SaaS.
Not a chatbot — a workflow execution engine for WhatsApp-based automation.

## What it does
- Automates contact verification campaigns (primary use case)
- Runs marketing engagement funnels
- Mediates buyer-seller conversations in marketplace contexts

## Stack
- NestJS 10 + Fastify | TypeScript strict mode | Node 20 LTS
- PostgreSQL 16 + TypeORM | Redis 7 + BullMQ
- whatsapp-web.js (channel adapter) | React 18 + Vite + Tailwind (dashboard)
- Turborepo monorepo

## Architecture principle
Config-driven first. No business logic hardcoded. Adapter isolation — core never
imports from adapters. Tenant-first — every query filters by tenant_id.

## Full build plan
See .ai-system/docs/build-plan.md — all phases, schemas, interfaces, and decisions.
```

### 3. Set your `general-instructions.md`

Paste this as `.ai-system/agents/general-instructions.md`:

```markdown
# Agent Instructions — Convorchestrate

## Identity
You are a senior TypeScript/NestJS engineer working on a multi-tenant
WhatsApp orchestration SaaS. You write production-quality, strictly-typed
code. You never hardcode business logic. You never import adapter packages
into core packages.

## Mandatory rules
1. Every DB query includes a tenant_id filter. No exceptions.
2. All interfaces live in packages/core or packages/memory. Apps only import from packages.
3. All workflow behaviour is defined in JSON config. The engine interprets; it never decides.
4. All errors are caught, logged with a trace_id, and either rethrown or handled gracefully.
5. Free stack only. No paid SaaS integrations.
6. TypeScript strict mode. No `any`. No implicit returns.

## Code style
- NestJS modules with explicit providers and imports arrays
- DTOs use class-validator decorators
- Services are injectable, controllers are thin
- Unit tests for all core package logic

## Before writing any file
Read .ai-system/docs/build-plan.md sections relevant to the current task.
Read .ai-system/agents/system-architecture.md if it exists.

## After completing any task
Update .ai-system/agents/task-queue.md:
- Mark completed task as [DONE]
- Note any blockers or follow-up tasks discovered
```

---

## PROMPT 1 — Bootstrap (Run Once, Session 1)

**Tool: Continue (Ctrl+Alt+B or paste into Continue chat)**

```
Execute command: .ai-system/commands/bootstrap-project.md
Directive: This is a Turborepo monorepo called convorchestrate. It is a config-driven,
multi-tenant WhatsApp conversation orchestration SaaS built with NestJS 10, PostgreSQL,
Redis, BullMQ, whatsapp-web.js, and React + Vite for the dashboard. The core
architectural rules are: adapter isolation (core never imports from adapters), tenant-first
queries (every query includes tenant_id), and config-driven workflows (no business logic
hardcoded). Read .ai-system/docs/build-plan.md for the full architecture, database schema,
TypeScript interfaces, and build phases before generating any .ai-system files.
```

**What this produces:** All `.ai-system` agent files pre-loaded with project context, so every subsequent session starts informed.

---

## PROMPT 2 — Master Execution Prompt (Main Build Driver)

**Tool: Cline (paste into Cline panel)**
**When to use:** Start of the build. Runs phases sequentially.

```
You are a senior TypeScript engineer building a production-grade SaaS called
convorchestrate. Your full build plan is at .ai-system/docs/build-plan.md.
Your agent rules are at .ai-system/agents/general-instructions.md.

Read both files fully before writing a single line of code.

## Your task
Execute the build plan from Phase 0 to Phase 8, one phase at a time.

## Execution rules
- Complete each phase fully before starting the next.
- After each phase, run `npm run build` from the repo root to verify no TypeScript errors.
- If a build error occurs, fix it before proceeding. Do not accumulate errors.
- After each phase completes, update .ai-system/agents/task-queue.md with:
  [DONE] Phase N — <phase name>
  [NEXT] Phase N+1 — <phase name>
  [NOTES] <anything discovered, any deviations from the plan>

## Phase execution order
Phase 0: Monorepo scaffold + Docker stack + DB migrations
Phase 1: Workflow engine core (packages/core) with unit tests
Phase 2: WhatsApp adapter (whatsapp-web.js) + ingress + message normalizer
Phase 3: Media storage + contact tagging (full contact verification flow working)
Phase 4: Sequential and mediation workflow types
Phase 5: BullMQ queue system (delayed messages, async execution)
Phase 6: Campaigns (bulk send, rate-limited dispatch)
Phase 7: Admin dashboard (React + Vite — all 7 pages)
Phase 8: Hardening + Docker production build + health checks

## Critical architecture constraints (never violate)
1. packages/core must have zero imports from packages/adapters
2. Every TypeORM query in a service must include a where: { tenantId } clause
3. WorkflowEngine.process() must be callable with a mock ChannelAdapter and mock
   MemoryProvider — no real infrastructure dependencies in the engine
4. All incoming WhatsApp messages are processed via a BullMQ queue, not inline
   on the webhook handler thread

## Start now with Phase 0.
```

---

## PROMPT 3 — Phase-Specific Executor

**Tool: Cline**
**When to use:** When you want to run a single specific phase (e.g. after testing Phase N manually).

Replace `[N]` and `[NAME]` with the phase number and name.

```
Read .ai-system/docs/build-plan.md section "Phase [N] — [NAME]" and
.ai-system/agents/general-instructions.md fully before starting.

Execute Phase [N] of the convorchestrate build plan completely.

After completion:
1. Run `npm run build` from the repo root and fix any TypeScript errors.
2. Run `npm run test` in packages/core and fix any failing tests.
3. Update .ai-system/agents/task-queue.md — mark Phase [N] as [DONE].
4. Write a brief summary of what was built and any deviations from the plan
   into .ai-system/agents/task-queue.md under [NOTES].

Do not start Phase [N+1]. Stop and report completion.
```

**Phase names for reference:**
- Phase 0 — Monorepo Scaffold
- Phase 1 — Engine Core
- Phase 2 — WhatsApp Adapter + Ingress
- Phase 3 — Media + Tagging
- Phase 4 — Sequential + Mediation Workflows
- Phase 5 — Queue System
- Phase 6 — Campaigns
- Phase 7 — Admin Dashboard
- Phase 8 — Hardening + Deploy

---

## PROMPT 4 — Resume After Interruption

**Tool: Continue first, then Cline**
**When to use:** Any time a session ends mid-build, context is lost, or you return after a break.

### Step 1 — Orient (Continue)

```
Read these files in order and give me a status report:
1. .ai-system/agents/task-queue.md
2. .ai-system/docs/build-plan.md
3. .ai-system/agents/system-architecture.md

Report:
- Which phase was last completed (marked [DONE])
- Which phase is currently in progress or next ([NEXT] or [IN PROGRESS])
- Any blockers or notes from the last session ([NOTES])
- The exact next action to take

Do not write any code yet. Just report.
```

### Step 2 — Resume (Cline, after reading the Continue report)

```
Read .ai-system/agents/task-queue.md to find the current phase.
Read .ai-system/docs/build-plan.md for that phase's full specification.
Read .ai-system/agents/general-instructions.md for all architecture rules.

Scan the existing codebase to understand what has already been implemented.
Do not re-implement anything that already exists and compiles correctly.

Resume the build from where it was interrupted. Complete the current phase,
then stop and report. Do not advance to the next phase automatically.

After completion, update task-queue.md.
```

---

## PROMPT 5 — Fix Build Errors

**Tool: Cline (or Continue for analysis)**
**When to use:** `npm run build` or `npm run test` fails.

```
The build has errors. Run `npm run build` from the repo root now and read all
error output carefully.

For each error:
1. Identify the root cause — do not fix symptoms.
2. Check whether the fix would violate any rule in .ai-system/agents/general-instructions.md.
3. Apply the minimal fix — do not refactor unrelated code.
4. Re-run `npm run build` after each fix to confirm resolution.

If an error reveals an architectural violation (e.g. a core package importing from
adapters, or a query missing tenant_id), fix the architecture, not just the type error.

When all errors are resolved, report:
- What was broken
- What was fixed
- Whether any plan deviations were made (update task-queue.md if so)
```

---

## PROMPT 6 — Architecture Review (Use Between Phases)

**Tool: Continue**
**When to use:** After Phase 1, Phase 4, and Phase 7 — the three major structural milestones.

```
Review the current codebase against the architecture defined in
.ai-system/docs/build-plan.md sections 1 (Core Principles), 7 (Module Architecture),
and 8 (Engine interfaces).

Check for:
1. Any import of packages/adapters from packages/core — flag as critical violation
2. Any TypeORM query in a service missing a tenant_id filter — flag as critical violation
3. Any hardcoded workflow logic in the engine (conditions, action behaviour etc.)
4. Any missing error handling in action executors
5. Any action that mutates session state without saving it back to MemoryProvider

For each issue found, state:
- File and line number
- Why it violates the architecture
- The correct fix

Do not apply fixes. This is a review only. I will apply them manually or via Cline.
```

---

## PROMPT 7 — Contact Verification End-to-End Test

**Tool: Continue (generates test plan) → you execute manually**
**When to use:** After Phase 3 is complete. This is your first real validation gate.

```
Generate a step-by-step manual test plan for the contact verification workflow.

The test should verify:
1. The Docker stack starts cleanly (postgres, redis, api, worker all healthy)
2. The WhatsApp session initialises and displays a QR code in the dashboard
3. After scanning, the bot is reachable
4. Sending any message to the bot starts a session in the database
5. Sending "DONE" updates session context (text_confirmed = true) and triggers
   the "awaiting_screenshot" reply
6. Sending an image after "DONE" stores the media file, creates a contact_tag
   row with tag="verified" and method="self_reported", and sends the
   "verification_success" reply
7. The contact and their tag appear in the dashboard Contacts page
8. The event log shows all steps with trace IDs

Format the test plan as numbered steps with expected outcomes and failure
indicators for each step. Include the exact SQL queries to run against
PostgreSQL to verify DB state at each step.
```

---

## PROMPT 8 — Dashboard Completion Check

**Tool: Continue**
**When to use:** After Phase 7, before moving to Phase 8 hardening.

```
Read .ai-system/docs/build-plan.md section "Phase 7 — Admin Dashboard".

Review the dashboard implementation (apps/dashboard/src/) against the 7 required pages:
1. Login
2. Dashboard home (summary cards)
3. Workflows (list + Monaco JSON editor)
4. Contacts (paginated, tags filter, session history)
5. Campaigns (create, CSV upload, launch, status)
6. Logs (event log table, filterable)
7. Settings (tenant config, WhatsApp QR display)

For each page, report:
- Exists and functional: YES / PARTIAL / MISSING
- If PARTIAL or MISSING: what is incomplete

Then list the 3 most important missing pieces to complete before Phase 8.
```

---

## PROMPT 9 — Pre-Deploy Checklist

**Tool: Cline**
**When to use:** Phase 8 — before final Docker build and VPS deploy.

```
Execute the Phase 8 hardening checklist from .ai-system/docs/build-plan.md.

Specifically:
1. Add Helmet + CORS + rate limiting (100 req/min per IP) to apps/api/src/main.ts
2. Verify pino structured logging is active and every log line includes trace_id
3. Implement GET /health on both api and worker — must return { status: "ok",
   uptime: <seconds>, db: "connected", redis: "connected" }
4. Write multi-stage Dockerfiles for api, worker, and dashboard
   (node:20-alpine base, non-root user, only production deps in final stage)
5. Verify docker-compose.yml has restart: unless-stopped on all services
6. Verify .env.example lists every variable used anywhere in the codebase
7. Run `docker compose up --build` locally and confirm all 5 services start clean

Do not deploy until all 7 items are confirmed green. Report status of each item.
```

---

## QUICK REFERENCE — Prompt Selection Guide

| Situation | Prompt to use |
|---|---|
| Very first session, empty repo | Prompt 1 (Bootstrap) → Prompt 2 (Master) |
| Starting fresh session on existing work | Prompt 4 (Resume) |
| Want to run one specific phase | Prompt 3 (Phase-specific) |
| Build is failing | Prompt 5 (Fix errors) |
| Completed a major milestone, want a sanity check | Prompt 6 (Architecture review) |
| Phase 3 done, want to test the real bot | Prompt 7 (E2E test plan) |
| Phase 7 done, checking dashboard completeness | Prompt 8 (Dashboard check) |
| Ready to ship, pre-deploy | Prompt 9 (Deploy checklist) |

---

## SESSION DISCIPLINE — Notes for You (Not the AI)

These are habits that will save you hours:

- **Always run Prompt 4 (Resume) at the start of every new session**, even if you remember where you left off. It forces the AI to read actual file state, not rely on its context window from the last conversation.
- **Never let Cline run two phases in one session without a manual review between them.** The build quality drops when the agent doesn't have a feedback checkpoint.
- **After Phase 1 (engine core), run the unit tests manually** before letting Cline proceed. The engine is the foundation — a bug here propagates everywhere.
- **Commit to git after each completed phase.** If a phase produces broken output, you want a clean rollback point.
- **For the WhatsApp adapter (Phase 2)**, use a spare/dedicated phone number for testing. Never use a primary business number during development — ban risk is real.
- **The task-queue.md file is your source of truth**, not your memory. If Cline ever seems confused about project state, check that file first.

---

*Prompt kit version: 1.0 — paired with build-plan.md v1.0*

