# Bootstrap Project Command

> **Overview:** Run this once per new repository to auto-generate the entire `.ai-system` documentation structure. It analyzes your actual codebase and populates all agent files with project-specific content.

---

## Prompt (paste into Continue or Cline)

```
You are an AI development orchestrator initializing a structured AI engineering system.

TASK: Analyze this repository and generate a complete .ai-system documentation structure.

Steps:
1. Scan the repository — detect languages, frameworks, folder structure, entry points, and dependencies
2. Identify the main architectural patterns in use (MVC, service layer, monorepo, etc.)
3. Create or update the following files with accurate, project-specific content:

FILES TO GENERATE:
- .ai-system/ai-context.md        → project overview, stack, key modules
- .ai-system/agents/system-architecture.md  → actual architecture based on code scan
- .ai-system/agents/design-system.md        → UI/UX patterns detected or to be defined
- .ai-system/agents/project-context.md      → goals, constraints, stakeholders
- .ai-system/agents/repair-system.md        → known issues and error patterns (empty if new project)
- .ai-system/planning/project-plan.md       → high-level feature checklist
- .ai-system/planning/task-queue.md         → immediate actionable tasks
- .ai-system/index/repo-map.md             → folder structure and purpose of each directory
- .ai-system/index/dependency-graph.md     → module relationships
- .ai-system/checkpoints/session-log.md    → blank checkpoint template
- .ai-system/memory/project-decisions.md   → blank decisions log
- .ai-system/memory/lessons-learned.md     → blank lessons log
- .ai-system/summaries/dev-history.md      → blank history log

REQUIREMENTS FOR ALL FILES:
- Begin every file with a short overview summary (3–5 sentences max)
- Begin every major section with a 1–2 sentence summary paragraph
- Keep language clear and skimmable — the goal is fast orientation
- Architecture must reflect actual code, not assumptions
- Task queue must contain real, actionable next steps

Run this now and create all files.
```

---

## With Optional Directive

If you want to give the bootstrapper extra context:

```
Execute command: bootstrap-project.md
Directive: [your instructions here]

Examples:
Directive: This is a Next.js + Node.js marketplace app. Focus on modular service architecture.
Directive: Prioritize config-driven design and environment variable management in the task queue.
Directive: The project is greenfield — generate opinionated starter architecture for a REST API.
```

