# Self-Heal Command

> **Overview:** Automated quality loop. Runs the full test → diagnose → fix → document cycle. Best used after large implementations or when you want the agent to proactively find and fix issues.

---

## Prompt (use with Cline for execution)

```
Run the self-healing development loop.

Steps:
1. Run available tests or linting checks
2. Collect all failures and warnings
3. For each failure:
   a. Identify root cause
   b. Check .ai-system/agents/repair-system.md for known patterns
   c. Implement the minimal fix
   d. Document the fix in repair-system.md
4. Re-run tests to confirm fixes
5. Repeat until all tests pass or failures are documented as known issues
6. Update .ai-system/testing/test-results.md
7. Update .ai-system/testing/failure-analysis.md for any unresolved issues
8. Update .ai-system/checkpoints/session-log.md

Do not refactor code unrelated to the failures.
Do not introduce new features during this loop.
```

