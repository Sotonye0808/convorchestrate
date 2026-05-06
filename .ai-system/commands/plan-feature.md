# Plan Feature Command

> **Overview:** Use this before implementing any new feature. It analyzes architecture impact, identifies required modules, and updates the task queue with concrete steps before any code is written.

---

## Prompt

```
Read the following before responding:
- .ai-context.md
- .ai-system/agents/system-architecture.md
- .ai-system/agents/design-system.md
- .ai-system/planning/project-plan.md
- .ai-system/planning/task-queue.md

TASK: Plan the implementation of a new feature.

Produce:
1. Feature summary — what it does and why it's needed
2. Architecture impact — which existing modules are affected
3. New modules or services required
4. Data flow — how data moves through the feature
5. UI/UX considerations aligned with design-system.md
6. Potential risks or edge cases
7. List of concrete implementation tasks → append these to task-queue.md
8. Any architecture doc updates needed → note them for system-architecture.md

Do not write any code yet. Planning only.
```

---

## With Directive

```
Execute command: plan-feature.md
Directive: [describe the feature]

Examples:
Directive: implement role-based authentication with JWT and refresh tokens
Directive: add a real-time notifications system using WebSockets
Directive: build a configurable export module that supports CSV, PDF, and JSON
```

