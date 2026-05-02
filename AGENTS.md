# SG Monorepo - Agent Guidelines

## Repository Overview

- **Repo**: https://github.com/santiaago/sg
- In chat replies, file references must be repo-root relative only (example: `app2/src/components/GeometryList.tsx`); never absolute paths or `~/...`.
- **Structure**: TypeScript monorepo with shared geometry utilities
- **Apps**: Svelte (`app/`), React (`app2/`)
- **Shared Package**: `@sg/geometry` (`packages/geometry/`)

## Project Structure

- source code: (original svelte `app`, new react app `app2`, shared geometry package at `packages/geometry`)
- docs: `README.md`

## Build, Test, and Development Commands

- Install deps: `pnpm install`
- Type-check/build: `pnpm build`
- TypeScript checks via `tsc` (TypeScript compiler):
  - `pnpm type-check` (checks geometry + app2)
  - `pnpm type-check:geometry` (geometry package only)
  - `pnpm type-check:app2` (React app only)
  - Manual: `cd app2 && npx tsc --noEmit`
- Lint/format: `pnpm check`
- Format check: `pnpm format` (oxfmt --check)
- Format fix: `pnpm format:fix` (oxfmt --write)
- Tests (all): `pnpm test` (vitest for geometry + app2); coverage: `pnpm test:coverage`
- Tests (geometry only): `cd packages/geometry && pnpm test`
- Tests (app2 only): `cd app2 && pnpm test`

## Agent Instructions

- When user says "check app": run `pnpm lint && pnpm fmt:check && pnpm type-check && pnpm test` to verify lint, format, TypeScript, and tests. Verify exit code is 0 and no warnings are present.

## Commit Guidelines

- **NEVER COMMIT WITHOUT EXPLICIT PERMISSION** - I will always say "commit" or "do it" or similar to authorize a commit
- Don't commit until I have reviewed the code
- Follow concise, action-oriented commit messages (e.g., `CLI: add verbose flag to send`).
- Follow commit message pattern

```
git commit -m"<type>(<scope>): <description>" \
  -m"<optional body>" \
  -m"<optional footer>"
```

- Scope is **MANDATORY** - use repo-root relative paths (e.g., `app2/squares`, `packages/geometry`, `app`, `backlog`), never `src/` or directory-only scopes like `app2`
- Group related changes; avoid bundling unrelated refactors.
- You can be author of commit messages

## Coding Style & Naming Conventions

- Language: TypeScript (ESM). Prefer strict typing; avoid `any`.
- Formatting/linting via Oxlint and Oxfmt.
- Never add `@ts-nocheck` and do not add inline lint suppressions by default. Fix root causes first; only keep a suppression when the code is intentionally correct, the rule cannot express that safely, and the comment explains why.
- Do not disable `no-explicit-any`; prefer real types, `unknown`, or a narrow adapter/helper instead. Update Oxlint/Oxfmt config only when required.
- Prefer `Result<T, E>`-style outcomes and closed error-code unions for recoverable runtime decisions.
- Keep human-readable strings for logs, CLI output, and UI; do not use freeform strings as the source of truth for internal branching.
- Avoid `?? 0`, empty-string, empty-object, or magic-string sentinels when they can change runtime meaning silently.
- If introducing a new optional field or nullable semantic in core logic, prefer an explicit union or dedicated type when the value changes behavior.
- Add brief code comments for tricky or non-obvious logic.
- Aim to keep files under ~700 LOC; guideline only (not a hard guardrail). Split/refactor when it improves clarity or testability.
- Written English: use American spelling and grammar in code, comments, docs, and UI strings (e.g. "color" not "colour", "behavior" not "behaviour", "analyze" not "analyse").
