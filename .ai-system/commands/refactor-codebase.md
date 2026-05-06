# Refactor Codebase Command

> **Overview:** Use this to improve the structure, modularity, or design of existing code. The agent analyzes the repo, proposes changes, updates documentation, and implements safely — without breaking unrelated modules.

---

## Prompt

```
Read the following:
- .ai-context.md
- .ai-system/agents/system-architecture.md
- .ai-system/index/repo-map.md
- .ai-system/index/dependency-graph.md
- .ai-system/memory/project-decisions.md

TASK: Refactor the codebase to improve quality.

Steps:
1. Analyze current folder structure and identify problems
   - tight coupling
   - repeated logic
   - missing abstractions
   - config hardcoded in source files
   - modules doing too many things

2. Propose a refactored architecture
   - describe new folder structure
   - define module boundaries
   - identify what moves where

3. Update .ai-system/agents/system-architecture.md with proposed changes

4. Add refactoring tasks to .ai-system/planning/task-queue.md

5. Implement the refactor safely
   - move one module at a time
   - verify imports still resolve
   - do not change logic — only structure, unless instructed

6. After completion:
   - update repo-map.md
   - update dependency-graph.md
   - log the refactor in dev-history.md
```

---

## With Directive

```
Execute command: refactor-codebase.md
Directive: [your refactor goal]

Examples:
Directive: convert the project to a config-driven modular architecture
Directive: extract all database logic into a dedicated data access layer
Directive: standardise all API responses through a single response formatter utility
```

