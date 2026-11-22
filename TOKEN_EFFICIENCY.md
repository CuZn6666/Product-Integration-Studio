# Token Efficient Development Protocol

> Objective: maximize **verified progress per token**. Be concise in communication, selective in inspection, and thorough in implementation. Never trade correctness for shorter output.

## 1. Start with context once

- Read `AGENTS.md`, `WORKPACKAGE.md`, and this file at the start of a coding session.
- Check `git status --short` and inspect the relevant project structure. Reuse what exists.
- Pick the **first incomplete work package**. Identify its acceptance checks before editing.
- Re-read files only when they changed or a specific detail is needed. Do not repeatedly paste project descriptions into the conversation.

## 2. Inspect with precision

- Search filenames with `rg --files`; search definitions or symbols with `rg -n`.
- Open only relevant source files and small surrounding ranges. Exclude `node_modules`, `target`, `dist`, generated databases, and lockfile dumps from routine inspection.
- Prefer compact error excerpts and test summaries. Read complete logs only when a short excerpt does not explain the failure.
- Never dump an entire repository, dependency tree, or generated file into context without a specific reason.

## 3. Build in vertical slices

- Implement the smallest end-to-end change that satisfies the current acceptance check.
- Reuse the agreed stack: Spring Boot + H2 in `Backend/`, React + TypeScript + PrimeReact + React Flow in `Front/`.
- Prefer existing patterns, minimal dependencies, simple data flows, and readable code. Avoid speculative abstractions and unrelated refactoring.
- Make focused edits; preserve unrelated user changes. Do not regenerate working files merely to change a few lines.
- Make reasonable reversible decisions autonomously. Ask only when missing information materially changes functionality or requires permission.

## 4. Verify with the cheapest sufficient check

1. After a small edit, run the most relevant focused check.
2. At a work-package boundary, run the package's full acceptance checks.
3. Before declaring the MVP complete, run backend tests, frontend build, and the real local demo flow.

Use existing scripts: `cd Backend && ./mvnw test` (or `mvn test` when no wrapper exists), `cd Front && npm run build`. Do not reinstall dependencies or rerun an unchanged full suite without a reason.

When a check fails, inspect the relevant error, fix the cause, and rerun that check. Never mark a package complete on unexecuted assumptions.

## 5. Communicate only decisions and evidence

- Skip long planning essays, repeated summaries, full-file code dumps, and unsolicited tutorials.
- For routine progress, use **at most four short lines**:

```text
WP-0X: completed / in progress
Changed: <key files and behavior>
Verified: <command and result>
Next: <single next action or blocker>
```

- Report in Chinese; keep code identifiers, commands, API names, and UI labels in English.
- Update the checkboxes in `WORKPACKAGE.md` instead of maintaining duplicate progress documents.
- At the end, give the exact run commands, verified results, remaining limitations, and demo entry point. Link to files instead of reproducing their contents.

## 6. Boundaries that must not be optimized away

- Keep input validation, meaningful error handling, tests, accurate status reports, and the working 2-minute demo.
- Never fabricate results, suppress failing tests, silently delete code, or overwrite credentials.
- Do not commit, push, deploy, access paid cloud services, or introduce real ERP integrations without permission.
- No artificial time or token quotas for work packages. **Completion means passing the acceptance criteria**, not consuming a planned amount of effort.

**Default operating loop:** inspect narrowly → implement → verify → mark done → continue.
