# Development Task Queue

This queue lists actionable tasks for the current sprint.
Agents should take tasks top-to-bottom and keep them small and verifiable.
Update this file whenever the sprint focus changes.
Use .ai-system/docs/build-plan.md for detailed requirements.

## Current Sprint
Phase 0 is complete. Phase 1 tasks can begin next.

- [ ] Implement workflow types and schema validation
- [ ] Implement MemoryProvider interface and Redis adapter
- [ ] Implement WorkflowEngine.process() for reactive workflows
- [ ] Add unit tests for reactive workflow execution

## Up Next
Phase 2 tasks will follow after Phase 1 passes build and tests.

- [ ] Implement WhatsApp adapter (whatsapp-web.js)
- [ ] Add QR streaming controller
- [ ] Wire messaging module and inbound queue

## Backlog
Items that are useful but not required for the next sprint.
Prioritize them when sprint focus shifts.

- [ ] Add seed script in scripts/seed.ts
- [ ] Add configs/workflows examples from build-plan.md
- [ ] Add configs/tenants examples from build-plan.md

## Completed This Sprint

- [x] Align apps/api scaffold with NestJS 10 + Fastify
- [x] Align apps/worker scaffold for background processing
- [x] Add package-level tsconfig.json files for all packages
- [x] Add TypeORM entities for all tables in build-plan.md
- [x] Create initial TypeORM migration and data source config
- [x] Expand docker-compose.yml to include api, worker, dashboard services
- [x] Add .env.example with required variables
- [x] Run npm run build and fix TypeScript errors

## Notes
- Adapter isolation and tenant-first queries are strict constraints
- BullMQ dependencies will be added in Phase 5 when queues are wired
