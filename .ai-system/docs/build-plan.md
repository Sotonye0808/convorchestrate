# WhatsApp Conversation Orchestration SaaS — Master Build Plan

> **Format note:** This document is designed to be loaded as a context/system file into AI-assisted development tools (Copilot, Google AI Studio, Cursor, etc.). Every section is written to be directly actionable by an AI code assistant. Sections marked `[AI PROMPT]` are ready-to-use prompts.

---

## 0. Project Identity

| Field | Value |
|---|---|
| Project name | `convorchestrate` (working name — rename freely) |
| Primary language | TypeScript (strict mode) |
| Runtime | Node.js 20 LTS |
| Framework | NestJS 10 |
| Monorepo tool | Turborepo |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| WhatsApp layer | whatsapp-web.js (open source, better maintained than OpenWA) |
| Admin frontend | React 18 + Vite + Tailwind CSS |
| Container | Docker + Docker Compose |
| Target deployment | Single VPS (Railway, Render, or self-hosted — no paid SaaS dependency) |

---

## 1. Core Principles (never violate these in code generation)

1. **Config-driven first.** No business logic hardcoded. Every workflow behaviour lives in a JSON config loaded from DB/file. The engine interprets; it never decides.
2. **Adapter isolation.** Zero imports from `@adapters/*` inside `@core/*`. The engine communicates with the outside world only through the `ChannelAdapter` and `MemoryProvider` interfaces.
3. **Tenant-first queries.** Every DB query filters by `tenant_id`. No exceptions. Every service method accepts `tenantId` as a required parameter.
4. **Fail loudly in dev, fail gracefully in prod.** Use `NODE_ENV` guards. In production, all unhandled errors go to the event log and return a safe fallback — they never crash the process.
5. **Free stack only.** No paid SaaS integrations in the core platform. All infrastructure must be self-hostable.

---

## 2. Repository Structure

```
convorchestrate/
├── apps/
│   ├── api/                    # NestJS backend (main process)
│   ├── worker/                 # BullMQ worker process
│   └── dashboard/              # React + Vite admin frontend
├── packages/
│   ├── core/                   # Workflow engine (no external deps)
│   ├── adapters/               # Channel adapters (whatsapp-web.js etc.)
│   ├── memory/                 # Memory abstraction (Redis + DB providers)
│   ├── schemas/                # JSON Schema definitions + ajv validators
│   └── utils/                  # Shared types, constants, helpers
├── configs/
│   ├── workflows/              # Example workflow JSON files
│   └── tenants/                # Example tenant config files
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   └── Dockerfile.dashboard
│   └── docker-compose.yml
├── scripts/
│   └── seed.ts                 # DB seed script
├── turbo.json
├── package.json                # Root workspace
└── .env.example
```

---

## 3. Full Technology Stack

### Backend (apps/api + apps/worker)
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-fastify`
- `@nestjs/config` — env management
- `@nestjs/typeorm` + `typeorm` — ORM
- `pg` — PostgreSQL driver
- `ioredis` — Redis client
- `bullmq` + `@nestjs/bullmq` — queue system
- `ajv` + `ajv-formats` — JSON Schema validation
- `whatsapp-web.js` + `qrcode-terminal` — WhatsApp adapter
- `multer` — file/media uploads
- `class-validator` + `class-transformer` — DTO validation
- `@nestjs/jwt` + `bcrypt` — auth for admin dashboard

### Frontend (apps/dashboard)
- `react` + `react-dom` + `react-router-dom`
- `vite`
- `tailwindcss`
- `@tanstack/react-query` — server state
- `monaco-editor/react` — JSON workflow editor
- `axios` — HTTP client

### Shared packages
- `zod` — runtime type validation for workflow configs (in addition to ajv)
- `date-fns` — date manipulation
- `pino` — structured logging

---

## 4. Database Schema

### Tables

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,  -- human slug e.g. "contact_verification"
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,          -- "reactive" | "sequential" | "mediation"
  config JSONB NOT NULL,              -- full workflow JSON
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, workflow_id, version)
);

-- Users (contacts being orchestrated — NOT admin users)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone VARCHAR(30) NOT NULL,
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- Contact tags
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',        -- { method: "ocr", confidence: 0.87 }
  tagged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, contact_id, tag)
);

-- Conversation sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  state JSONB DEFAULT '{}',           -- current workflow state
  current_step VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active | completed | timed_out | error
  context JSONB DEFAULT '{}',         -- arbitrary context (product_id, offer etc.)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Mediation sessions (buyer-seller pairs)
CREATE TABLE mediation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  session_id UUID REFERENCES sessions(id),
  party_a_contact_id UUID NOT NULL REFERENCES contacts(id),
  party_b_contact_id UUID NOT NULL REFERENCES contacts(id),
  party_a_role VARCHAR(50) NOT NULL,  -- e.g. "buyer"
  party_b_role VARCHAR(50) NOT NULL,  -- e.g. "seller"
  context JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event log
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  contact_id UUID REFERENCES contacts(id),
  event_type VARCHAR(100) NOT NULL,
  direction VARCHAR(10),              -- "inbound" | "outbound"
  payload JSONB DEFAULT '{}',
  trace_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media store
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  session_id UUID REFERENCES sessions(id),
  type VARCHAR(50) NOT NULL,          -- "image" | "video" | "document"
  original_filename VARCHAR(500),
  storage_path VARCHAR(500) NOT NULL,
  ocr_text TEXT,
  ocr_confidence FLOAT,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users (for dashboard access)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- null = superadmin
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',   -- "superadmin" | "admin" | "viewer"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (critical for multi-tenant performance)
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_contact ON sessions(contact_id);
CREATE INDEX idx_event_logs_tenant ON event_logs(tenant_id);
CREATE INDEX idx_event_logs_trace ON event_logs(trace_id);
CREATE INDEX idx_contact_tags_tenant_contact ON contact_tags(tenant_id, contact_id);
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);
```

---

## 5. Workflow JSON Schema (the contract — define before building the engine)

### Unified workflow config type

```typescript
// packages/schemas/src/workflow.schema.ts

export type WorkflowType = 'reactive' | 'sequential' | 'mediation';

export interface WorkflowConfig {
  workflow_id: string;
  name: string;
  type: WorkflowType;
  version?: number;
  timeout_ms?: number;         // session TTL — null means never expires
  on_timeout?: Action[];       // actions to run when session times out
  triggers?: Trigger[];        // what starts or re-enters this workflow
  steps?: Step[];              // for "sequential" type
  handlers?: EventHandler[];   // for "reactive" type
  parties?: Party[];           // for "mediation" type
  relay_rules?: RelayRule[];   // for "mediation" type
}

export interface Trigger {
  type: 'message_received' | 'keyword' | 'campaign_start' | 'api_call';
  value?: string;              // keyword value if type === 'keyword'
  match?: 'exact' | 'contains' | 'regex';
}

export interface Step {
  id: string;
  name?: string;
  conditions?: Condition[];
  actions: Action[];
  next?: string;               // step id to go to next
  on_error?: Action[];
  timeout_ms?: number;         // per-step timeout
}

export interface EventHandler {
  event: string;
  conditions?: Condition[];
  actions: Action[];
}

export interface Condition {
  type: 'text_match' | 'tag_exists' | 'media_received' | 'context_equals' | 'always';
  field?: string;              // context field to check for context_equals
  value?: string | boolean;
  match?: 'exact' | 'contains' | 'regex' | 'case_insensitive';
}

export interface Action {
  type: ActionType;
  // send_message
  template?: string;
  text?: string;
  // tag_user
  tag?: string;
  tag_metadata?: Record<string, unknown>;
  // store_media
  run_ocr?: boolean;
  // trigger_webhook
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  payload?: Record<string, unknown>;
  // delay
  delay_ms?: number;
  then?: Action[];
  // set_context
  key?: string;
  value?: unknown;
  // relay_to_party (mediation only)
  to_party?: string;
  // transition
  next_step?: string;
}

export type ActionType =
  | 'send_message'
  | 'tag_user'
  | 'store_media'
  | 'trigger_webhook'
  | 'delay'
  | 'set_context'
  | 'clear_session'
  | 'relay_to_party'
  | 'transition_step';

export interface Party {
  role: string;               // e.g. "buyer", "seller"
  label: string;
}

export interface RelayRule {
  from_party: string;
  to_party: string;
  transform?: string;         // optional message prefix/transform template
}
```

---

## 6. Workflow Examples (all three use cases)

### 6.1 Contact Verification Campaign

```json
{
  "workflow_id": "contact_verification",
  "name": "Contact Verification Campaign",
  "type": "reactive",
  "timeout_ms": 172800000,
  "on_timeout": [
    { "type": "tag_user", "tag": "verification_expired" }
  ],
  "triggers": [
    { "type": "campaign_start" }
  ],
  "handlers": [
    {
      "event": "message_received",
      "conditions": [
        { "type": "text_match", "value": "done", "match": "case_insensitive" }
      ],
      "actions": [
        { "type": "set_context", "key": "text_confirmed", "value": true },
        { "type": "send_message", "template": "awaiting_screenshot" }
      ]
    },
    {
      "event": "message_received",
      "conditions": [
        { "type": "media_received" },
        { "type": "context_equals", "field": "text_confirmed", "value": true }
      ],
      "actions": [
        { "type": "store_media", "run_ocr": false },
        { "type": "tag_user", "tag": "verified", "tag_metadata": { "method": "self_reported" } },
        { "type": "send_message", "template": "verification_success" },
        { "type": "clear_session" }
      ]
    },
    {
      "event": "message_received",
      "conditions": [
        { "type": "media_received" },
        { "type": "context_equals", "field": "text_confirmed", "value": false }
      ],
      "actions": [
        { "type": "send_message", "template": "please_confirm_first" }
      ]
    }
  ]
}
```

### 6.2 Marketing Engagement Funnel

```json
{
  "workflow_id": "marketing_funnel_basic",
  "name": "Basic Marketing Funnel",
  "type": "sequential",
  "timeout_ms": 86400000,
  "triggers": [
    { "type": "campaign_start" }
  ],
  "steps": [
    {
      "id": "welcome",
      "actions": [
        { "type": "send_message", "template": "funnel_welcome" },
        { "type": "transition_step", "next_step": "wait_for_interest" }
      ]
    },
    {
      "id": "wait_for_interest",
      "timeout_ms": 3600000,
      "on_error": [
        { "type": "tag_user", "tag": "no_response" }
      ]
    },
    {
      "id": "interested",
      "conditions": [
        { "type": "text_match", "value": "yes", "match": "contains" }
      ],
      "actions": [
        { "type": "tag_user", "tag": "interested" },
        { "type": "send_message", "template": "funnel_details" },
        { "type": "trigger_webhook", "url": "{{tenant.crm_webhook}}", "method": "POST",
          "payload": { "event": "lead_captured", "contact": "{{contact.phone}}" } }
      ]
    }
  ]
}
```

### 6.3 Buyer–Seller Marketplace Mediation

```json
{
  "workflow_id": "marketplace_mediation",
  "name": "Buyer-Seller Mediation",
  "type": "mediation",
  "timeout_ms": 604800000,
  "parties": [
    { "role": "buyer", "label": "Buyer" },
    { "role": "seller", "label": "Seller" }
  ],
  "relay_rules": [
    {
      "from_party": "buyer",
      "to_party": "seller",
      "transform": "[Buyer]: {{message}}"
    },
    {
      "from_party": "seller",
      "to_party": "buyer",
      "transform": "[Seller]: {{message}}"
    }
  ],
  "handlers": [
    {
      "event": "message_received",
      "conditions": [{ "type": "always" }],
      "actions": [
        { "type": "relay_to_party", "to_party": "{{other_party}}" },
        { "type": "set_context", "key": "last_message_at", "value": "{{now}}" }
      ]
    },
    {
      "event": "message_received",
      "conditions": [
        { "type": "text_match", "value": "deal", "match": "contains" }
      ],
      "actions": [
        { "type": "tag_user", "tag": "deal_agreed" },
        { "type": "send_message", "template": "deal_confirmed_buyer" },
        { "type": "send_message", "template": "deal_confirmed_seller" },
        { "type": "trigger_webhook", "url": "{{tenant.deal_webhook}}", "method": "POST" }
      ]
    }
  ]
}
```

---

## 7. Module Architecture (NestJS)

```
apps/api/src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── auth/                   # JWT auth for dashboard
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── auth.guard.ts
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   ├── tenants.service.ts
│   │   └── tenants.controller.ts
│   ├── workflows/
│   │   ├── workflows.module.ts
│   │   ├── workflows.service.ts  # CRUD for workflow configs
│   │   └── workflows.controller.ts
│   ├── contacts/
│   │   ├── contacts.module.ts
│   │   ├── contacts.service.ts
│   │   └── contacts.controller.ts
│   ├── sessions/
│   │   ├── sessions.module.ts
│   │   └── sessions.service.ts
│   ├── engine/                 # Wraps packages/core for NestJS DI
│   │   ├── engine.module.ts
│   │   └── engine.service.ts
│   ├── messaging/              # Wraps channel adapter
│   │   ├── messaging.module.ts
│   │   ├── messaging.service.ts
│   │   └── qr.controller.ts    # Exposes QR code for WhatsApp login
│   ├── media/
│   │   ├── media.module.ts
│   │   ├── media.service.ts
│   │   └── media.controller.ts
│   ├── campaigns/
│   │   ├── campaigns.module.ts
│   │   ├── campaigns.service.ts  # Bulk send / campaign trigger
│   │   └── campaigns.controller.ts
│   └── events/
│       ├── events.module.ts
│       └── events.service.ts   # Event log writer
└── common/
    ├── decorators/
    │   └── tenant.decorator.ts
    ├── guards/
    │   └── tenant.guard.ts
    └── interceptors/
        └── logging.interceptor.ts
```

---

## 8. Core Workflow Engine (packages/core)

### Engine interface

```typescript
// packages/core/src/engine.ts

export interface EngineContext {
  tenantId: string;
  contactId: string;
  sessionId: string;
  traceId: string;
  incomingMessage?: NormalizedMessage;
  mediationContext?: MediationContext;
}

export interface NormalizedMessage {
  type: 'text' | 'image' | 'video' | 'document' | 'audio';
  text?: string;
  mediaUrl?: string;
  mediaLocalPath?: string;
  timestamp: Date;
  raw: unknown;
}

export interface MediationContext {
  sessionId: string;
  fromParty: string;
  toParty: string;
  parties: Record<string, string>; // role -> contactId
}

export class WorkflowEngine {
  constructor(
    private readonly memoryProvider: MemoryProvider,
    private readonly actionExecutor: ActionExecutor,
    private readonly logger: Logger,
  ) {}

  async process(config: WorkflowConfig, ctx: EngineContext): Promise<void> {
    // 1. Load or create session state
    // 2. Evaluate triggers/handlers based on workflow type
    // 3. Execute matching actions
    // 4. Persist new state
    // 5. Emit events
  }
}
```

### Action executor interface

```typescript
// packages/core/src/action-executor.ts

export interface ActionExecutor {
  execute(action: Action, ctx: EngineContext, state: SessionState): Promise<void>;
}
```

### Memory provider interface

```typescript
// packages/memory/src/provider.ts

export interface MemoryProvider {
  getSession(sessionId: string): Promise<SessionState | null>;
  setSession(sessionId: string, state: SessionState, ttlMs?: number): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  getContact(tenantId: string, phone: string): Promise<ContactState | null>;
  setContact(tenantId: string, phone: string, data: ContactState): Promise<void>;
}

export interface SessionState {
  sessionId: string;
  tenantId: string;
  contactId: string;
  workflowId: string;
  currentStep?: string;
  context: Record<string, unknown>;
  status: 'active' | 'completed' | 'timed_out' | 'error';
  startedAt: Date;
  updatedAt: Date;
}
```

---

## 9. Channel Adapter (packages/adapters)

```typescript
// packages/adapters/src/channel-adapter.interface.ts

export interface ChannelAdapter {
  // Lifecycle
  initialize(tenantId: string, config: AdapterConfig): Promise<void>;
  getStatus(): AdapterStatus;
  reconnect(): Promise<void>;
  onSessionDead(callback: (tenantId: string) => void): void;

  // Messaging
  sendMessage(to: string, message: OutgoingMessage): Promise<void>;
  onMessage(callback: (msg: IncomingRawMessage) => void): void;

  // Media
  downloadMedia(msg: IncomingRawMessage): Promise<Buffer>;
}

export type AdapterStatus = 'initializing' | 'qr_pending' | 'ready' | 'dead' | 'error';

export interface AdapterConfig {
  sessionDataPath?: string;
  rateLimitMs?: number;         // min ms between outgoing messages
  jitterMs?: number;            // random extra delay for naturalness
}
```

### WhatsApp Web adapter (whatsapp-web.js)

```typescript
// packages/adapters/src/whatsapp-web/wwjs.adapter.ts
// [AI PROMPT]: Implement the ChannelAdapter interface using whatsapp-web.js.
// Use LocalAuth for session persistence. Emit QR code via EventEmitter so the
// API can stream it to the dashboard. Wrap all client.sendMessage() calls with
// the rate limiter — min 1000ms between sends, plus random jitter up to 2000ms.
// Handle 'disconnected' event by calling onSessionDead callbacks and attempting
// one reconnect after 5 seconds.
```

---

## 10. Build Phases

### Phase 0 — Scaffold (Day 1)

**Goal:** Monorepo running, all packages created, Docker stack up, DB migrations run.

Tasks:
1. `npx create-turbo@latest convorchestrate --package-manager npm`
2. Set up `apps/api` with NestJS + Fastify adapter
3. Set up `apps/worker` as a bare NestJS app (BullMQ consumer only)
4. Set up `apps/dashboard` with Vite + React + Tailwind
5. Create all `packages/` with placeholder `index.ts` exports
6. Write `docker-compose.yml` with `postgres`, `redis`, `api`, `worker`, `dashboard` services
7. Write TypeORM entities for all tables in section 4
8. Run initial migration

```yaml
# infrastructure/docker-compose.yml skeleton
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: convorchestrate
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.api
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/convorchestrate
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"

  worker:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.worker
    depends_on: [postgres, redis]

  dashboard:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.dashboard
    ports:
      - "5173:80"

volumes:
  postgres_data:
```

**[AI PROMPT — Phase 0]:**
> "Scaffold a Turborepo monorepo at `convorchestrate/`. Create `apps/api` as a NestJS 10 app using the Fastify adapter. Create `apps/worker` as a NestJS app with BullMQ. Create `apps/dashboard` using Vite + React 18 + Tailwind CSS. Create packages: `core`, `adapters`, `memory`, `schemas`, `utils` — each with a `package.json`, `tsconfig.json`, and `src/index.ts`. Set up path aliases in the root `tsconfig.json` so `@core/*`, `@adapters/*` etc. resolve correctly."

---

### Phase 1 — Engine Core (Days 1–2)

**Goal:** Workflow engine processes a reactive workflow against mock data in unit tests.

Tasks:
1. Implement `WorkflowConfig` TypeScript types from section 5
2. Write JSON Schema + ajv validator for `WorkflowConfig`
3. Implement `MemoryProvider` interface with a Redis implementation
4. Implement `WorkflowEngine.process()` for `type: "reactive"` workflows only
5. Implement `ActionExecutor` with `send_message`, `tag_user`, `set_context`, `clear_session`
6. Write unit tests using mock memory + mock action executor
7. Test against the `contact_verification` workflow JSON

**[AI PROMPT — Engine]:**
> "In `packages/core/src/engine.ts`, implement `WorkflowEngine.process()`. For a workflow of `type: 'reactive'`, it should: (1) load the session state from `MemoryProvider`, (2) iterate through the workflow's `handlers[]`, (3) for each handler evaluate all `conditions[]` against the `EngineContext` — all conditions must pass, (4) if all conditions pass, execute `actions[]` in order via `ActionExecutor`, then stop processing further handlers. Session state must be saved after each action that mutates it. All errors inside action execution must be caught, logged with the `traceId`, and rethrown so the caller can decide retry behaviour."

---

### Phase 2 — WhatsApp Adapter + Ingress (Days 2–3)

**Goal:** Real WhatsApp messages flow into the engine.

Tasks:
1. Implement `WwjsAdapter` using `whatsapp-web.js` with `LocalAuth`
2. Add a `QrController` that returns the current QR code as an SSE stream
3. Implement the message normalizer (raw whatsapp-web.js message → `NormalizedMessage`)
4. Wire up `MessagingModule` in NestJS — on message received, look up tenant + contact, find active workflow, call `WorkflowEngine.process()`
5. Implement the `send_message` action — reads template from tenant config, sends via adapter
6. Add rate limiter (minimum gap between outgoing messages per phone number)
7. Test: send "DONE" to the bot, verify session state is updated in Redis

**[AI PROMPT — Adapter]:**
> "In `packages/adapters/src/whatsapp-web/wwjs.adapter.ts`, implement the `ChannelAdapter` interface using `whatsapp-web.js`. Use `LocalAuth` with the `dataPath` set to a volume-mounted path for session persistence across container restarts. Emit QR code data via an `EventEmitter` named `'qr'`. Wrap all `client.sendMessage()` calls in a queue that enforces a minimum 1200ms gap between sends to any given phone number, plus a random jitter between 0 and 1500ms. On the `'disconnected'` event, call all registered `onSessionDead` callbacks and attempt `client.initialize()` again after 5 seconds."

---

### Phase 3 — Media + Tagging (Day 3)

**Goal:** Screenshot uploads stored and contacts tagged.

Tasks:
1. Implement `store_media` action: download media from whatsapp-web.js, save to local volume (path: `/uploads/{tenantId}/{date}/{uuid}.{ext}`)
2. Implement `tag_user` action: upsert `contact_tags` row with optional `tag_metadata`
3. Add `MediaController` (`POST /media/:sessionId/upload`) for manual uploads from dashboard
4. Verify the full contact verification flow end-to-end

---

### Phase 4 — Sequential + Mediation Workflows (Days 3–4)

**Goal:** All three workflow types working.

Tasks:
1. Extend `WorkflowEngine.process()` to handle `type: "sequential"` — step-based progression with `current_step` in session state
2. Implement `transition_step` action
3. Implement `type: "mediation"` — extend session model with `MediationSession`, implement `relay_to_party` action, implement cross-party message routing
4. Add `delay` action via BullMQ: schedule a `DelayedMessageJob` that runs `send_message` after `delay_ms`
5. Add `trigger_webhook` action with retry (3 attempts, exponential backoff)

**[AI PROMPT — Mediation]:**
> "Extend `WorkflowEngine.process()` for `type: 'mediation'` workflows. When a message is received from a contact, determine which party they are by looking up `MediationSession.party_a_contact_id` / `party_b_contact_id`. Set `ctx.mediationContext.fromParty` and `ctx.mediationContext.toParty` accordingly. The `relay_to_party` action should send the incoming message text to the other party's phone number via the `ChannelAdapter`, optionally applying the `transform` template (replacing `{{message}}` with the actual text). Never deliver a message from Party A directly to Party A."

---

### Phase 5 — Queue System (Day 4)

**Goal:** Delayed messages and async action execution via BullMQ.

Tasks:
1. Set up `QueueModule` in NestJS with BullMQ, connecting to Redis
2. Define queues: `workflow-execution`, `delayed-message`, `webhook-trigger`, `media-processing`
3. Move all `WorkflowEngine.process()` calls into `workflow-execution` queue processor (so incoming messages are handled async, not blocking the HTTP thread)
4. Implement `delayed-message` processor for `delay` action
5. Implement `webhook-trigger` processor with retry logic

---

### Phase 6 — Campaigns (Day 4–5)

**Goal:** Bulk send to a list of contacts, starting sessions for each.

Tasks:
1. Create `Campaign` entity and `campaigns` table (name, workflow_id, status, contact_list JSONB, tenant_id, created_at)
2. `CampaignService.launch(campaignId)` — for each phone in the contact list, upsert the contact, create a session, enqueue a `campaign_start` event in `workflow-execution` queue
3. Add rate limiting at campaign level: no more than 20 campaign messages per minute per tenant (configurable in tenant config)
4. `CampaignController`: `POST /campaigns`, `GET /campaigns`, `POST /campaigns/:id/launch`

---

### Phase 7 — Admin Dashboard (Days 5–6)

**Goal:** Working UI to manage workflows, view logs, launch campaigns.

Pages:
1. **Login** — JWT auth against `admin_users`
2. **Dashboard home** — summary cards: active sessions, total contacts, verified contacts, active campaigns
3. **Workflows** — list + create/edit with Monaco JSON editor, schema validation inline, save/activate/deactivate
4. **Contacts** — paginated table with search, tags filter, link to session history per contact
5. **Campaigns** — create campaign (name, workflow, upload CSV of phone numbers), launch, status/progress
6. **Logs** — filterable event log table (by tenant, contact, trace ID, date range)
7. **Settings** — tenant config editor, WhatsApp QR code display for session auth

**[AI PROMPT — Dashboard]:**
> "In `apps/dashboard/src/pages/Workflows.tsx`, build a page that: (1) fetches workflows from `GET /api/workflows`, (2) displays them in a list with name, type badge, active status toggle; (3) opens a side panel with a `@monaco-editor/react` instance loaded with the workflow JSON when a workflow is clicked; (4) validates the JSON on change using the workflow schema (import from `packages/schemas`) and shows inline errors; (5) calls `PUT /api/workflows/:id` with the updated config on save."

---

### Phase 8 — Hardening + Deploy (Days 6–7)

**Goal:** Stable, containerised, running on VPS.

Tasks:
1. Add `Helmet`, CORS, and rate limiting (100 req/min per IP) to the API
2. Add `pino` structured logging with `trace_id` on every log line
3. Write a replay system: `GET /api/events/:traceId` returns the full event chain for a trace
4. Health check endpoints: `GET /health` on API and worker
5. Write production `Dockerfile`s (multi-stage builds, non-root user)
6. Write `.env.example` with all required variables
7. Test full docker-compose stack locally
8. Deploy to VPS (Railway or a bare Ubuntu 24.04 VPS with Docker installed)
9. Set up `docker-compose` auto-restart policies

---

## 11. Environment Variables

```bash
# .env.example

# App
NODE_ENV=development
PORT=3000
JWT_SECRET=change_me_in_production

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/convorchestrate

# Redis
REDIS_URL=redis://localhost:6379

# WhatsApp
WA_SESSION_DATA_PATH=/app/data/wa-sessions
WA_RATE_LIMIT_MIN_MS=1200
WA_RATE_LIMIT_JITTER_MAX_MS=1500

# Media storage
MEDIA_UPLOAD_PATH=/app/data/uploads
MAX_MEDIA_SIZE_MB=10

# Campaigns
CAMPAIGN_MAX_SENDS_PER_MINUTE=20

# Dashboard
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 12. Message Templates

Templates are stored in the tenant's `config` JSON in the `tenants` table. The engine replaces `{{variable}}` tokens at send time.

```json
{
  "templates": {
    "verification_success": "✅ Thank you! Your submission has been received and verified. Welcome aboard!",
    "awaiting_screenshot": "Great! Now please send a screenshot showing that you've saved the contact.",
    "please_confirm_first": "Please reply with *DONE* first before sending the screenshot.",
    "deal_confirmed_buyer": "🤝 Great news! The seller has agreed to your deal. Expect to be contacted shortly.",
    "deal_confirmed_seller": "🤝 Great news! The buyer has confirmed the deal.",
    "funnel_welcome": "👋 Hi {{contact.name}}! Thanks for your interest. Reply *YES* to learn more.",
    "funnel_details": "Here are the details you requested: {{tenant.funnel_details_url}}"
  }
}
```

---

## 13. Key Design Decisions (rationale for AI tools to respect)

| Decision | Rationale |
|---|---|
| `whatsapp-web.js` over OpenWA | More actively maintained, better TypeScript types, same risk profile |
| BullMQ over raw Redis pub/sub | Retry logic, delayed jobs, job visibility — essential for reliability |
| LocalAuth for WhatsApp | Session survives container restarts via volume mount — critical for stability |
| JSONB for workflow config in PostgreSQL | Queryable, versionable, no schema migration needed for config changes |
| Row-level tenant isolation (shared DB) | Right for MVP and SME market; add dedicated-DB tier later |
| Self-reported verification (Option A) | Honest UX, fast to build; OCR can be added as a background enrichment job |
| Mediation as a distinct workflow type | Cross-party relay is architecturally different from single-party workflows |
| No external AI/NLP in MVP | Keeps stack simple and free; add as optional module in Phase 2 |

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| WhatsApp account ban | Rate limiting, random jitter, `LocalAuth` for stability, use dedicated numbers per tenant/campaign |
| whatsapp-web.js session death | `onSessionDead` callback + auto-reconnect + QR re-auth flow in dashboard |
| Config JSON errors breaking engine | ajv validation on save in dashboard + validation endpoint `POST /workflows/validate` |
| Mediation: party contacts each other directly | System can't prevent this; document it as a limitation — the bot is a convenience layer, not a hard gate |
| Volume data loss on VPS | Bind-mount `wa-sessions` and `uploads` to host paths, set up daily `pg_dump` cron |

---

## 15. What NOT to Build in MVP

- AI/NLP message processing
- OCR-based screenshot verification (design the schema for it; don't implement it yet)
- Multi-channel support (SMS, Instagram)
- Official WhatsApp Business API integration
- White-label platform
- Stripe/payment integration
- Complex analytics (beyond event log queries)

---

## 16. Testing Strategy

For each phase, the minimum test surface is:

- **packages/core**: Unit tests for every condition evaluator and every action type using mock providers. No WhatsApp, no DB.
- **packages/schemas**: Validation tests — valid configs should pass, invalid configs should fail with descriptive errors.
- **apps/api**: Integration tests for campaign creation + launch flow using a test DB.
- **Manual E2E**: One test WhatsApp number running the `contact_verification` workflow end-to-end before marking Phase 3 complete.

---

## 17. AI Tool Usage Guide

When using Copilot, Cursor, or Google AI Studio with this plan:

1. **Load this file as system context** before starting any coding session.
2. **Reference section numbers** in your prompts: "Implement the `MemoryProvider` interface from section 8."
3. **Use the `[AI PROMPT]` blocks** verbatim as starting prompts — they are pre-engineered for this codebase.
4. **After each phase**, ask: "Review the code against the Core Principles in section 1 — flag any violations."
5. **For new features**, ask: "Does this fit within the MVP scope in section 15? If not, how would I add it as a plugin?"

---

*Plan version: 1.0 — generated for solo dev + AI-assisted implementation. Estimated build time with AI tools: 7–10 focused days.*

