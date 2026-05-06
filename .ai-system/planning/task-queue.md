# Development Task Queue

This queue lists actionable tasks for the current sprint.
Agents should take tasks top-to-bottom and keep them small and verifiable.
Update this file whenever the sprint focus changes.
Use .ai-system/docs/build-plan.md for detailed requirements.

## Current Sprint
The current sprint is Phase 0: scaffold and migrations.
Complete these tasks before moving to Phase 1.

- [ ] Align apps/api scaffold with NestJS 10 + Fastify (module + main.ts)
- [ ] Align apps/worker scaffold for BullMQ processing
- [ ] Add package-level tsconfig.json files for all packages
- [ ] Add TypeORM entities for all tables in build-plan.md
- [ ] Create initial TypeORM migration and config
- [ ] Expand docker-compose.yml to include api, worker, dashboard services
- [ ] Add .env.example with required variables
- [ ] Run npm run build and fix any TypeScript errors

## Up Next
These tasks begin Phase 1 once Phase 0 is complete.
Do not start them until the build passes.

- [ ] Implement workflow types and schema validation
- [ ] Implement MemoryProvider interface and Redis adapter
- [ ] Implement WorkflowEngine.process() for reactive workflows

## Backlog
Items that are useful but not required for Phase 0.
Prioritize them when the sprint focus shifts.

- [ ] Add seed script in scripts/seed.ts
- [ ] Add configs/workflows examples from build-plan.md
- [ ] Add configs/tenants examples from build-plan.md

## Completed This Sprint
No tasks completed yet in this sprint.
Move completed tasks here as they finish.

- [ ] (none)

## Notes
- Adapter isolation and tenant-first queries are strict constraints
- Do not hardcode workflow logic; use JSON config

