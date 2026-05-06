# Update AI System Command

> **Overview:** Maintenance command. Run at the end of a sprint or after major changes to keep all agent documentation synchronized with the actual state of the codebase.

---

## Prompt

```
Read all files in .ai-system/ and compare them against the current repository state.

TASK: Synchronize the AI development system with the codebase.

Update the following:
1. .ai-system/index/repo-map.md
   - reflect any new or removed directories
   - update purpose descriptions if modules changed

2. .ai-system/index/dependency-graph.md
   - update module relationships
   - flag new dependencies introduced

3. .ai-system/index/file-summaries/
   - generate or update summaries for modified modules
   - remove summaries for deleted files

4. .ai-system/agents/system-architecture.md
   - flag any architecture drift (code doesn't match docs)
   - update architecture to reflect current state

5. .ai-system/planning/project-plan.md
   - mark completed items [x]
   - add newly discovered tasks

6. .ai-system/summaries/dev-history.md
   - add a sprint summary for work completed

7. .ai-system/memory/lessons-learned.md
   - document any recurring issues or newly discovered patterns

Report what was updated and what inconsistencies were found.
```

---

## With Directive

```
Execute command: update-ai-system.md
Directive: [focus area if needed]

Examples:
Directive: Focus on updating summaries after the authentication module refactor
Directive: Specifically check for architecture drift in the services layer
```

