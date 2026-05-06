# Fix Build Command

> **Overview:** The self-healing loop. Run this when tests are failing, the build is broken, or you've hit a runtime error. The agent diagnoses, fixes, and documents the fix in the repair system so future agents avoid the same problem.

---

## Prompt

```
Read:
- .ai-system/agents/repair-system.md
- .ai-system/testing/test-results.md (if it exists)
- .ai-system/testing/failure-analysis.md (if it exists)

TASK: Run the self-healing development loop.

Steps:
1. Examine the error or failing test
2. Check repair-system.md for known patterns that match this error
3. Identify the root cause — do not guess, trace the actual execution path
4. Implement the minimal fix — do not refactor unrelated code
5. Verify the fix resolves the error
6. Update .ai-system/agents/repair-system.md with:
   - error description
   - root cause
   - solution applied
   - prevention strategy
7. Update .ai-system/testing/test-results.md
8. Update .ai-system/checkpoints/session-log.md

If the error is complex, break it into sub-problems and solve each one.
```

---

## With Directive

```
Execute command: fix-build.md
Directive: [describe the error or paste the error message]

Examples:
Directive: TypeError: Cannot read properties of undefined reading 'map' in UserList component
Directive: Database connection pool exhausted under load — fix and add connection limit config
Directive: Next.js hydration mismatch on the dashboard page
```

