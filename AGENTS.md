# AGENT.md

## Before Writing Code
- Read relevant existing modules, models, and docs first — understand data flow, conventions, and dependencies before touching anything.
- Check for existing similar entities/tables before creating new ones; extend instead of duplicating.

## Code Standards
- One file = one logical concern.
- Max ~100 lines per file — split if exceeded.
- Clean, readable, self-documenting code. No dead code, no commented-out blocks.
- Follow existing project conventions (naming, folder structure, style).

## Testing
- Every new feature/module must have test cases, including edge cases (null/empty input, boundary values, invalid types, concurrency if relevant).
- Do not commit unless ALL tests pass.
- Do not skip/disable failing tests to "make them pass."

## Database
- Before creating a new table: check if an existing entity can be extended (add column/relation) instead.
- Justify new tables briefly in PR/commit message if created.

## Commits
- Small, atomic commits tied to one change.
- Commit message: what + why, not just what.
- No commit with failing tests or broken build.

## General
- Don't over-engineer — simplest correct solution wins.
- Flag ambiguity instead of guessing on critical logic.