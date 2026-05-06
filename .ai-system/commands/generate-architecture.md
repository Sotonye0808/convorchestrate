# Generate Architecture Command

> **Overview:** Use this to produce or refresh the system architecture documentation. Can be run on an existing codebase to document what's there, or on a greenfield project to design what should be built.

---

## Prompt

```
Read:
- .ai-context.md
- .ai-system/index/repo-map.md
- .ai-system/index/dependency-graph.md
- .ai-system/memory/project-decisions.md

TASK: Generate or update the system architecture documentation.

Produce the following in .ai-system/agents/system-architecture.md:

1. Overview summary (3–5 sentences describing the system)

2. System diagram (text-based, showing layers and relationships)

3. Module breakdown
   - Name of each module
   - Responsibility
   - Dependencies
   - Key files

4. Data flow
   - How a typical request flows through the system
   - Authentication path if applicable
   - Data persistence path

5. Configuration points
   - What is configurable
   - Where config is defined
   - Environment variables in use

6. Known constraints or technical debt

Each section must begin with a 1–2 sentence summary.
Architecture must reflect actual code — do not invent structure that doesn't exist.
```

---

## With Directive

```
Execute command: generate-architecture.md
Directive: [your architectural goal]

Examples:
Directive: Design the architecture for a new microservices migration
Directive: Document the current monolith before we begin refactoring
Directive: Add a proposed event-driven layer to the existing architecture doc
```

