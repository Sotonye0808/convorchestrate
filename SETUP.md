# Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16
- Redis 7
- Meta WhatsApp Cloud API credentials (see below)

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis (via Docker Compose or local install):

```bash
docker compose -f infrastructure/docker-compose.yml up postgres -d
```

4. Run database migrations:

```bash
npm run build --workspace=apps/api
npm run migration:run --workspace=apps/api
```

5. (Optional) Seed demo data:

```bash
npx ts-node scripts/seed.ts
```

6. Start the API:

```bash
npm run dev --workspace=apps/api
```

7. In a separate terminal, start the dashboard:

```bash
npm run dev --workspace=apps/dashboard
```

The API will be available at `http://localhost:8080/api` and the dashboard at `http://localhost:3000`.

## Meta WhatsApp Cloud API Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your App → WhatsApp → API Setup
2. Copy the **Phone Number ID**, **Access Token**, **WABA ID**, and **App Secret** into your `.env`
3. Set up a webhook endpoint pointing to `https://your-ngrok-url.ngrok-free.app/api/webhooks/meta` with the verify token from your `.env`

## Running Tests

```bash
# All packages
npm test --workspaces

# Individual packages
npm test --workspace=apps/api
npm test --workspace=packages/core
npm test --workspace=packages/meta-api
```

## Full Docker Compose

To run everything (API + dashboard + database) in Docker:

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

This starts PostgreSQL, the NestJS API (port 8080), and the Next.js dashboard (port 3000).
