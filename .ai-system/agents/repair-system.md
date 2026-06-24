# Repair System - Error Knowledge Base

This file tracks errors encountered during development and how they were fixed.
It prevents repeating known issues and speeds up debugging.
Entries are added chronologically with clear root cause and prevention notes.
If a fix changes architecture or behavior, note it here.

## How to Use This File

Use this file before debugging to check for similar issues.
After fixing a bug, add a new entry using the template below.

## Error Log

No errors have been logged yet.
Add new entries below as they appear.

### [TEMPLATE - copy this for each new error]

```
## [Error Title / Short Description]

**Symptom:**
[What the developer or user sees - error message, broken behaviour, etc.]

**Root Cause:**
[The actual technical reason this happened]

**Fix Applied:**
[What change was made to resolve it]

**Prevention:**
[How to avoid this in future - pattern, lint rule, architecture change, etc.]

**Files Affected:**
[List of files that were changed]

**Date:** [YYYY-MM-DD]
```

## Known Error Patterns

No recurring patterns have been recorded yet.
Add patterns when the same class of error repeats.

## TypeORM CLI Does Not Inherit Nest Config Loading

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

## API Demo Route Missing Global Prefix

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

## WhatsApp Browser Lock Blocks API Startup

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
