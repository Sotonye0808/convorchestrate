# Development Task Queue

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging. Agents execute tasks top to bottom within the current sprint. Each task is sized so it can be completed in a single session.

---

## Complexity Tags

Tags help agents self-select whether a task needs the full `execute-feature.md` pipeline or a lighter `dev-cycle.md`:

| Tag | Meaning | Recommended Command |
|-----|---------|-------------------|
| `[XS]` | Trivial — single file, known pattern | dev-cycle.md |
| `[S]` | Small — 1-3 files, well-understood | dev-cycle.md |
| `[M]` | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read |
| `[L]` | Large — feature spanning modules | execute-feature.md |
| `[XL]` | Very large — architecture-affecting | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix | fix-build.md |

---

## Current Sprint

| Size | Task | Status |
|------|------|--------|
| [M] | Add demo mode toggle + simulated message endpoint | [ ] |
| [S] | Write local testing guide | [ ] |
| [S] | Write deployment guide | [ ] |
| [S] | Seed script for demo data | [ ] |

---

## Up Next

| Size | Task |
|------|------|
| [M] | Add on_timeout handling to WorkflowEngine |
| [S] | Add media-processing queue in BullMQ |
| [L] | Add OCR processing pipeline |
| [M] | Add contact import via CSV upload |
| [S] | Add webhook event logging to EventLog table |
| [XS] | Add admin user CRUD endpoints |
| [M] | Add tenant management endpoints |
| [L] | Integration tests with test DB |

---

## Completed This Sprint

| Task | Completed |
|------|-----------|
| All 8 build phases (Engine Core, WhatsApp Adapter, Media/Tagging, Sequential/Mediation, BullMQ, Campaigns, Dashboard, Hardening) | [x] |

---

## Notes

- Adapter isolation and tenant-first queries are strict constraints
- All 8 packages build successfully
- 13 core unit tests pass (reactive, sequential, mediation workflow types)
- Preview mode and deployment guides are the final pending items
