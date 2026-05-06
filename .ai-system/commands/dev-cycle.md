# Dev Cycle Command

> **Overview:** The master autonomous development loop. Run this to execute a full plan → implement → review → test → document cycle. Best used at the start of each working session or after completing a task.

---

## Prompt (paste into Continue, then hand off implementation to Cline)

```
You are running the AI development cycle for this project.

Before doing anything, read:
- .ai-context.md
- .ai-system/agents/system-architecture.md
- .ai-system/planning/task-queue.md
- .ai-system/checkpoints/session-log.md

Then execute the following pipeline:

PLAN
- Identify the first incomplete task in task-queue.md
- Confirm it aligns with system-architecture.md
- If architecture needs updating first, flag it

IMPLEMENT
- Make code changes safely — only touch files related to the task
- Follow the design system and architecture patterns
- Do not introduce new dependencies without noting them

REVIEW
- Check the implementation against system-architecture.md
- Flag any inconsistencies or architecture drift
- Suggest improvements if found

TEST
- Identify test cases for the implementation
- If tests exist, verify they pass
- If tests are missing, list what should be tested

DOCUMENT
- Update .ai-system/checkpoints/session-log.md with completed task and files modified
- Update .ai-system/summaries/dev-history.md with a brief summary
- Update .ai-system/agents/repair-system.md if any errors were encountered and fixed
- Mark the completed task as done [x] in task-queue.md

Explain your reasoning at each step before acting.
```

---

## With Optional Directive

```
Execute command: dev-cycle.md
Directive: [your instruction here]

Examples:
Directive: Focus only on the authentication module today
Directive: Prioritize fixing the broken API response formatter before new features
Directive: Work in small safe commits — do not refactor anything not directly related to the task
```

