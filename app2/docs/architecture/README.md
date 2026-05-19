# App2 Architecture Documentation

**Last Updated:** 2025-05-17
**Documentation Folder:** `app2/docs/architecture/`

## Purpose

This folder contains architectural analysis of the app2 codebase, documenting:
- Main code blocks and their responsibilities
- Interactions between components
- Complexity assessments
- Refactoring recommendations
- Last analysis date for each block

## Documentation Structure

```
app2/docs/architecture/
├── README.md                    # This file - navigation & overview
├── 00-GLOBAL-VIEW.md           # High-level architecture map
├── 01-APP-ORCHESTRATION.md     # Deep dive: App.tsx analysis
├── 02-REACT-STORE.md           # Deep dive: react-store.ts analysis
├── 03-GEOMETRY-CORE.md         # Deep dive: geometry/ directory
├── 04-DSL.md                   # Deep dive: geometry/dsl/ directory
├── 05-UI-COMPONENTS.md         # Deep dive: components/ directory
└── REFACATORING-PLAN.md         # Actionable refactoring roadmap
```

## Quick Links

| Document | Focus | Last Analyzed |
|----------|-------|---------------|
| [00-GLOBAL-VIEW.md](./00-GLOBAL-VIEW.md) | Overall architecture, block overview | 2025-05-17 |
| 01-APP-ORCHESTRATION.md | App.tsx deep dive | Not yet analyzed |
| 02-REACT-STORE.md | react-store.ts deep dive | Not yet analyzed |
| 03-GEOMETRY-CORE.md | geometry/ directory | Not yet analyzed |
| 04-DSL.md | geometry/dsl/ directory | Not yet analyzed |
| 05-UI-COMPONENTS.md | components/ directory | Not yet analyzed |

## Current Status

- ✅ Global view completed (2025-05-17)
- ⏳ Deep dive documents: pending user direction

## How to Use

1. **Start here:** Read [00-GLOBAL-VIEW.md](./00-GLOBAL-VIEW.md) for the big picture
2. **Deep dive:** Tell me which block to analyze next (e.g., "analyze App.tsx" or "analyze the DSL")
3. **Take action:** Use REFACATORING-PLAN.md (coming soon) for implementation guidance

## Analysis Metadata

Each document includes:
- **Last Analyzed:** Date of most recent analysis
- **Analyst:** (to be added)
- **Status:** Initial / In Progress / Complete
- **Version:** Codebase commit hash at time of analysis

## Codebase Snapshot (at last analysis)

- Total source files: 65 TypeScript files
- Total lines (src): ~8000+ lines
- Components: 12
- Geometry files: 14+
- DSL files: 20+
- Tests: Unit tests in `test/`, E2E in `e2e/`

## Quick Commands

```bash
# Count lines in src
find app2/src -name "*.ts*" -not -path "*/node_modules/*" | xargs wc -l

# List all components
ls -la app2/src/components/

# List all geometry files
ls -la app2/src/geometry/

# List all DSL files
find app2/src/geometry/dsl -name "*.ts"
```
