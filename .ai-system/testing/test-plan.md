# Test Plan

> **Overview:** Defines what needs to be tested and at what level. Agents reference this when writing tests or running the self-heal loop. Updated as new features are added.

---

## Unit Tests

> **Section summary:** Tests for individual functions and modules in isolation.

- [ ] [Module / function to test]
- [ ] Service layer functions
- [ ] Utility functions
- [ ] Data transformation logic

---

## Integration Tests

> **Section summary:** Tests for how modules work together, including database operations and API routes.

- [ ] API route responses (happy path)
- [ ] API route error handling
- [ ] Database CRUD operations
- [ ] Authentication flow

---

## End-to-End Tests

> **Section summary:** Tests that simulate real user journeys through the system.

- [ ] [Critical user flow 1]
- [ ] [Critical user flow 2]

---

## Performance Tests

> **Section summary:** Tests to verify the system performs acceptably under expected load.

- [ ] API response time under normal load
- [ ] Database query performance
- [ ] Page load times (frontend)

