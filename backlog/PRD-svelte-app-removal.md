# PRD: Remove Svelte App from Monorepo

## Problem Statement

The Svelte application in `app/` directory is deprecated. It was the first implementation, later superseded by the TypeScript React application (`app2/`) with a declarative DSL. The deprecated Svelte app:

- Blocks **type system consolidation** between `@sg/geometry` and `app2` (see ADR-0003)
- Adds unnecessary maintenance burden
- Confuses repository structure and documentation
- Prevents clean evolution of the shared geometry package

## Solution

Complete removal of the Svelte application from the monorepo. Create a git tag (`pre-svelte-removal`) before deletion to preserve history for future reference. Update all documentation, scripts, and configuration files that reference the Svelte app.

## User Stories

1. As a maintainer, I want the deprecated Svelte app removed, so that I don't have to maintain dead code
2. As a maintainer, I want type system consolidation unblocked, so that `@sg/geometry` and `app2` can share a single type system
3. As a developer, I want clear repository structure, so that I can understand the codebase quickly
4. As a developer, I want accurate documentation, so that I don't follow outdated instructions for the Svelte app
5. As a CI/CD pipeline, I want only relevant apps built and tested, so that build times are minimized
6. As a worktree manager, I want scripts updated, so that worktree creation doesn't fail due to missing app/ directory
7. As a future investigator, I want a git tag preserving pre-removal state, so that I can recover the Svelte app if needed

## Implementation Decisions

### Modules to Modify

- **Workspace configuration**: Remove `app` from pnpm workspace list
- **Root package scripts**: Remove Svelte-specific scripts (`build:apps`, `test:apps`), update `dev` and `build` to reference only app2
- **Worktree manager**: Remove Svelte app file copying logic
- **Documentation**: Update AGENTS.md, README.md, WORKTREE.md to remove Svelte references
- **Git ignore**: Remove stale entries for `app/.nyc_output/` and `app/coverage/`
- **ADR documentation**: Update ADR-0003 to note Svelte removal is complete, type consolidation pending
- **Backlog tracking**: Mark removal task as complete in backlog/12-05-26.md

### Technical Clarifications

- Svelte app (`app/`) is entirely self-contained with no external dependencies from other repo packages (app2 only depends on @sg/geometry)
- Removal is complete: entire `app/` directory deleted, not archived in-place
- Type system consolidation between app2 and @sg/geometry is a separate, subsequent effort
- Git history preserved via tag for recovery if needed

### Architectural Decisions

- Single app architecture: After removal, app2 becomes the sole application in the monorepo
- Workspace simplification: pnpm workspace reduced from 3 to 2 members (packages/geometry, app2)
- Script simplification: Root package.json scripts reflect single-app reality

## Testing Decisions

### Verification Strategy

- **Install**: `pnpm install` completes without errors (cleans orphaned dependencies)
- **Build**: `pnpm build` successfully builds packages and app2
- **Type check**: `pnpm type-check` passes for all TypeScript code
- **Test**: `pnpm test` passes all unit tests
- **Git status**: Only expected file changes present (no unexpected deletions)

### What Makes a Good Test

Tests verify external behavior only: that the monorepo builds, type-checks, and tests pass without the Svelte app. No implementation details of the removal process are tested.

### Prior Art

Existing CI workflow (app2-pr.yml) already tests app2 independently. This workflow will continue to function unchanged after removal.

## Out of Scope

- Type system consolidation between `@sg/geometry` and `app2` (separate PR, noted in ADR-0003)
- Migration of any Svelte app functionality to app2 (already complete)
- Creation of new ADR for this removal (decision is straightforward deprecation cleanup)
- Updates to worktree directories (`.worktrees/`) - these are gitignored and will be updated on next worktree creation

## Further Notes

- The Svelte app was the original implementation, later replaced by TypeScript React app with DSL
- Removal enables ADR-0003's type consolidation plan
- Backlog task "remove svelte app" (backlog/12-05-26.md) will be marked complete
- Execution order: tag → update files → delete app/ → pnpm install → verify → commit
