# Agent Bootstrap

> **Overview:** A one-shot prompt for generating the full `.ai-system` documentation for a brand new project. Run this in Continue or Cline at the start of a project. It produces all required agent files with project-specific content derived from the actual codebase.

---

## Master Bootstrap Prompt

Paste this into Continue or Cline to initialize the system:

```
You are an AI development orchestrator.

Your task: Initialize the complete .ai-system documentation for this repository.

Step 1 — Scan the repository
- Detect languages, frameworks, entry points, folder structure
- Identify architectural patterns (service layer, MVC, monorepo, etc.)
- Map all major modules and their dependencies

Step 2 — Generate all documentation files

Create each file with:
- A short overview summary at the top (3–5 sentences)
- Section summaries at the start of each major section
- Accurate content derived from the actual codebase, not assumptions
- Clear, skimmable formatting

FILES TO CREATE:

.ai-context.md
  → Project name, purpose, stack summary, key modules list

.ai-system/agents/general-instructions.md
  → Agent protocol, core principles, execution steps, role table

.ai-system/agents/system-architecture.md
  → Architecture diagram, module breakdown, data flow, config points

.ai-system/agents/project-context.md
  → Project purpose, users, constraints, tech decisions made

.ai-system/agents/design-system.md
  → Colour palette (if detectable), component patterns, UX principles

.ai-system/agents/repair-system.md
  → Pre-populate with known patterns for the detected tech stack

.ai-system/planning/project-plan.md
  → Feature checklist inferred from codebase state

.ai-system/planning/task-queue.md
  → Immediate actionable improvement tasks

.ai-system/index/repo-map.md
  → Folder structure with purpose of each directory

.ai-system/index/dependency-graph.md
  → Module relationships as a text diagram

.ai-system/checkpoints/session-log.md
  → Blank template ready for first entry

.ai-system/memory/project-decisions.md
  → Blank with header, ready for entries

.ai-system/memory/lessons-learned.md
  → Blank with header, ready for entries

.ai-system/summaries/dev-history.md
  → First entry: "Initial project scan and .ai-system setup"

Step 3 — Report
After generating all files, list:
- What was generated
- Key architecture findings
- Recommended first tasks
```

---

## With Directive

```
Execute command: agent-bootstrap.md
Directive: [additional context about the project]

Examples:
Directive: This is a greenfield project — generate an ideal architecture for a Next.js marketplace app
Directive: Prioritise identifying technical debt and ordering the task queue by impact
Directive: The project uses Tailwind and Ant Design — include both in the design system
```

