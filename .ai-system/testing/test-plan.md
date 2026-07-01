# Test Plan

> **Metadata**
> - last-updated-by: migration-v1-to-v2
> - last-verified-against-code: 2026-07-01
> - staleness-policy: re-verify if new features are added

> **Overview:** Defines what needs to be tested and at what level. Referenced by `verify-work.md` during the quality gate. Updated as new features are added.

---

## Unit Tests

- [x] Core engine unit tests (reactive, sequential, mediation)
- [ ] Service layer functions
- [ ] Utility functions
- [ ] Data transformation logic

---

## Integration Tests

- [ ] API route responses (happy path)
- [ ] API route error handling
- [ ] Database CRUD operations
- [ ] Authentication flow

---

## End-to-End Tests

- [ ] Message ingestion → workflow execution → response
- [ ] Campaign launch → dispatch → completion

---

## Performance Tests

- [ ] API response time under normal load
- [ ] Database query performance
- [ ] Page load times (frontend)
