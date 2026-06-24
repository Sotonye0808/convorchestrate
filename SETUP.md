# Convorchestrate — Setup & Deployment Guide

## 1. Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm

### Steps

```bash
# 1. Clone and install
git clone <repo-url> convorchestrate
cd convorchestrate
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your local Postgres/Redis credentials

# 3. Create database
createdb convorchestrate

# 4. Run database migrations
cd apps/api
npx typeorm-ts-node-commonjs migration:run -d src/db/data-source.ts
cd ../..

# 5. Build all packages
npm run build

# 6. Run the API
cd apps/api
npm run dev
# API runs on http://localhost:3000

# 7. In another terminal, run the dashboard
cd apps/dashboard
npm run dev
# Dashboard runs on http://localhost:5173
```

### Running Core Tests

```bash
cd packages/core
npm run test
# Expected: 13 tests, all passing
```

---

## 2. Demo Mode (No WhatsApp Required)

Demo mode lets you test the full workflow engine without connecting to real WhatsApp. It injects simulated messages via API.

### Quick Start (One Command)

```bash
# Start API and ensure Postgres/Redis are running

# Seed demo data (creates tenant, workflow, admin user):
curl -X POST http://localhost:3000/api/demo/seed

# Response:
# {
#   "tenantId": "<uuid>",
#   "adminEmail": "admin@convorchestrate.io",
#   "adminPassword": "demo1234"
# }
```

### Inject a Test Message

```bash
curl -X POST http://localhost:3000/api/demo/message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "<tenantId-from-seed>",
    "phone": "5511999999999",
    "text": "Hello"
  }'
```

The system will:
1. Look up or create the contact
2. Find the active workflow
3. Create or reuse a session
4. Enqueue a workflow-execution job (via BullMQ)
5. The workflow engine processes the message and responds

### Try a Full Flow

```bash
# 1. Say "done" to trigger text_confirmed
curl -X POST http://localhost:3000/api/demo/message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "<tenantId>",
    "phone": "5511999999999",
    "text": "done"
  }'

# 2. Send a media message (simulated) to trigger verification
curl -X POST http://localhost:3000/api/demo/message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "<tenantId>",
    "phone": "5511999999999",
    "text": "[simulated image]",
    "type": "image"
  }'
```

### Via Dashboard

1. Open http://localhost:5173
2. Log in with `admin@convorchestrate.io` / `demo1234`
3. Go to **Settings**
4. Click **Seed Demo Data** (if not already seeded)
5. Click **Enable Demo Mode**
6. The demo message injector form appears — enter a phone number and message text
7. Click **Send** to inject a test message

---

## 3. Deploy to a Test Server (VPS)

### Requirements
- Ubuntu 24.04 VPS (minimum 2GB RAM, 2 CPU cores)
- Docker + Docker Compose installed
- Domain name (optional, for HTTPS)
- Ports 80/443 open (for dashboard), 3000 (for API)

### Step 1 — Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Step 2 — Deploy

```bash
# On the server
git clone <repo-url> convorchestrate
cd convorchestrate

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://convorchestrate:convorchestrate@postgres:5432/convorchestrate
REDIS_URL=redis://redis:6379
JWT_SECRET=<generate-a-random-secret>
NODE_ENV=production
CORS_ORIGIN=http://<your-server-ip>:5173
EOF

# Start the stack
docker compose up -d --build

# Check logs
docker compose logs -f api
```

### Step 3 — Database Migration

```bash
# Run migrations inside the API container
docker compose exec api npx typeorm-ts-node-commonjs migration:run -d dist/db/data-source.js
```

### Step 4 — Seed Admin User

```bash
# Create an admin user via the demo seed endpoint
curl -X POST http://<server-ip>:3000/api/demo/seed

# Or create manually via the API (once auth endpoint exists)
```

### Step 5 — Access

- **Dashboard:** http://<server-ip>:5173
- **API:** http://<server-ip>:3000
- **Health Check:** http://<server-ip>:3000/health

---

## 4. Using with Real WhatsApp

### QR Code Authentication

1. Start the API with `WA_SESSION_DATA_PATH` set
2. Connect to the SSE stream:
   ```
   curl -N http://localhost:3000/api/qr/<sessionId>/stream
   ```
3. A QR code will be emitted as base64 data
4. Open WhatsApp on your phone → Link Device → Scan QR
5. The session is persisted in `WA_SESSION_DATA_PATH` for reuse

### Configuration

Edit tenant config (via Settings page or PUT /api/settings/tenant):

```json
{
  "id": "<tenant-uuid>",
  "name": "My Tenant",
  "slug": "my-tenant",
  "config": {
    "templates": {
      "welcome": "Hello! Welcome to our service.",
      "awaiting_screenshot": "Please send a screenshot to verify.",
      "deal_confirmed_buyer": "Your deal has been confirmed!",
      "complete": "Thank you! Process complete."
    },
    "campaign_max_sends_per_minute": 20
  },
  "isActive": true
}
```

---

## 5. Shareholder Demo

For a live demo to shareholders:

1. **Deploy to a public VPS** using the steps above
2. **Enable demo mode** from the Settings page — no WhatsApp connection needed
3. **Use the message injector** to simulate conversations in real time
4. **Show the dashboard** — stats cards update as messages are processed
5. **Show workflow editing** — open the Workflows page, edit a workflow JSON, save it
6. **Show campaign launch** — create a campaign with a few phone numbers, launch it

### One-Click Demo Flow

```bash
# On the server
curl -X POST http://<server-ip>:3000/api/demo/seed
# Copy the tenantId from response

# Inject a welcome message
curl -X POST http://<server-ip>:3000/api/demo/message \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "<tenantId>", "phone": "5511999999999", "text": "Hello"}'

# Check stats
curl http://<server-ip>:3000/api/dashboard/stats?tenantId=<tenantId>
```

---

## 6. Architecture Overview

```
┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  Dashboard   │────▶│   API (3000)  │────▶│  PostgreSQL  │
│  (Vite:5173) │     │  NestJS+Fastify│     │             │
└──────────────┘     └───────┬───────┘     └─────────────┘
                             │                     ▲
                             ▼                     │
                      ┌──────────────┐     ┌───────┴───────┐
                      │   BullMQ     │────▶│    Redis      │
                      │  (Queues)    │     │               │
                      └──────┬───────┘     └───────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Worker     │
                      │  (Processor) │
                      └──────────────┘

Adapter Layer:
  - whatsapp-web.js (production)
  - Demo message injector (testing/demo)
```

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/health | Health check |
| POST | /api/demo/message | Inject test message (demo) |
| POST | /api/demo/seed | Seed demo data |
| GET | /api/dashboard/stats | Aggregate stats |
| GET | /api/contacts | List contacts |
| GET | /api/workflows | List workflows |
| PUT | /api/workflows/:id | Update workflow |
| POST | /api/campaigns | Create campaign |
| POST | /api/campaigns/:id/launch | Launch campaign |
| GET | /api/events | Event logs |
| GET | /api/events/replay/:traceId | Replay event chain |
| GET | /api/qr/:sessionId/stream | WhatsApp QR stream |
| POST | /api/media/:sessionId/upload | Upload media |
| GET | /api/settings/tenant | Get tenant config |
