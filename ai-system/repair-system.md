# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: individual entries may be stale if the code has changed around them — verify fix still applies before reusing

> **Overview:** Living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents must search this before diagnosing new errors and log every fixed bug to prevent recurrence.

---

## How to Use

- **Before debugging:** Search this file for patterns matching the current error
- **After fixing a bug:** Add an entry using the template below
- **If a fix no longer applies:** Mark the entry as `[SUPERSEDED]` and link to the new entry

---

## Error Log

### TypeORM CLI Does Not Inherit Nest Config Loading

**Symptom:**
`npm run migration:run` fails with `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` or `DATABASE_URL is required for TypeORM migrations`.

**Root Cause:**
The TypeORM CLI loads `src/db/data-source.ts` directly and does not run Nest `ConfigModule.forRoot()`. If the data source depends on environment variables but does not load `.env` itself, `process.env.DATABASE_URL` can be undefined.

**Fix Applied:**
Load the repo-root `.env` inside `apps/api/src/db/data-source.ts` before creating the `DataSource`, and fail fast if `DATABASE_URL` is missing.

**Prevention:**
Treat TypeORM CLI entrypoints as standalone boot paths. Any env-dependent data source should load or validate its own configuration instead of relying on Nest app startup.

**Files Affected:**
- apps/api/src/db/data-source.ts

**Date:** 2026-06-24
**Status:** Active

### API Demo Route Missing Global Prefix

**Symptom:**
`POST /api/demo/seed` returns `404` even though the demo controller exists and the dashboard documentation calls that URL.

**Root Cause:**
The Nest API did not register a global `api` prefix, while the dashboard and setup guide already assumed all API routes lived under `/api`.

**Fix Applied:**
Add `app.setGlobalPrefix("api")` in `apps/api/src/main.ts` so the runtime route shape matches the dashboard and docs.

**Prevention:**
Keep one canonical route prefix convention for the API and use it consistently in the server bootstrap, dashboard client, and setup docs.

**Files Affected:**
- apps/api/src/main.ts

**Date:** 2026-06-24
**Status:** Active

### WhatsApp Browser Lock Blocks API Startup

**Symptom:**
API startup fails with `The browser is already running for ...\\wa-sessions\\session. Use a different userDataDir or stop the running browser first.`

**Root Cause:**
`MessagingService.onModuleInit()` awaited `WwjsAdapter.initialize()`. A stale `whatsapp-web.js` LocalAuth profile lock turned a WhatsApp runtime problem into a fatal API bootstrap failure.

**Fix Applied:**
Catch adapter initialization errors in `MessagingService` so the API can boot without WhatsApp. Log the failure and continue serving demo/admin routes.

**Prevention:**
Treat WhatsApp as an optional runtime dependency for API startup. Startup failures in the adapter should be degraded to warnings unless the app explicitly requires live WhatsApp connectivity.

**Files Affected:**
- apps/api/src/modules/messaging/messaging.service.ts

**Date:** 2026-06-24
**Status:** Active

---

## Known Error Patterns

### React / Next.js

**Hydration Mismatch**
- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, Date.now()) running during server render
- Fix: Wrap in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
- Prevention: Never access browser APIs outside useEffect in components

**Missing Key Prop**
- Symptom: `Each child in a list should have a unique "key" prop`
- Cause: `.map()` rendering without a stable unique key
- Fix: Add `key={item.id}` — use a stable unique ID, not the array index

### Node.js / Backend

**Unhandled Promise Rejection**
- Symptom: Server crashes silently or logs `UnhandledPromiseRejectionWarning`
- Cause: async function missing try/catch or `.catch()` not attached to promise
- Fix: Wrap async route handlers in try/catch; use a global async error wrapper
- Prevention: Always release DB connections in finally, not just success path

**Database Connection Pool Exhausted**
- Symptom: Requests hang indefinitely under load
- Cause: Connection pool limit too low or connections not released
- Fix: Increase pool size; ensure `client.release()` in finally blocks
- Prevention: Always release connections in finally

### Configuration / Environment

**Missing Environment Variable**
- Symptom: `undefined` values in production, features silently broken
- Cause: Variable defined in `.env.local` but not in production environment
- Fix: Add to deployment environment variables
- Prevention: Add a startup validation check that throws if required env vars are missing
