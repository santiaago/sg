# App2 Global Architecture View

**Last Analyzed:** 2025-05-17
**Status:** Initial Analysis

## Overview

App2 is a React-based geometry visualization application that demonstrates geometric constructions through step-by-step animations. The app renders SVG-based geometric patterns (squares, sixfold patterns) with a DSL (Domain-Specific Language) for declarative geometry definitions.

## Directory Structure

```
app2/
├── src/
│   ├── main.tsx                 # Entry point - renders App wrapped in QueryProvider
│   ├── App.tsx                  # Root component - orchestrates all sections
│   ├── QueryProvider.tsx        # React Query provider wrapper
│   ├── react-store.ts           # Custom store for managing SVG geometry elements
│   │
│   ├── components/             # UI Components (12 components)
│   │   ├── Navigation.tsx       # Top navigation bar
│   │   ├── GeometryPlayer.tsx   # Step navigation controls + SVG container
│   │   ├── GeometryList.tsx     # Lists all geometry elements with filters
│   │   ├── GeometryDetails.tsx  # Shows details of current step
│   │   ├── CopyUrlButton.tsx    # Copies current URL to clipboard
│   │   ├── CopySvgButton.tsx    # Copies SVG to clipboard
│   │   └── *Svg.tsx files       # 6 SVG rendering components
│   │
│   ├── geometry/                # Core geometry logic (14 files, ~1600 lines)
│   │   ├── types/               # Geometry value types (Point, Line, Circle, Polygon, CoordinateSystem)
│   │   ├── operations.ts        # Geometry operations (distance, intersection, etc.)
│   │   ├── constructors.ts      # Geometry constructors
│   │   ├── stepBuilders.ts      # Step construction helpers
│   │   ├── stepExecution.ts     # Step execution logic
│   │   ├── *Steps.ts files       # Step definitions for each pattern (6 files)
│   │   └── dsl/                  # DSL implementation (20+ files)
│   │       ├── types.ts         # DSL types
│       ├── GeometryBuilder.ts  # Builder for DSL expressions
│       ├── expressions/        # Expression types (Circle, Line, Point, Polygon, etc.)
│       │   └── operations/      # Expression operations (intersection, bisect, etc.)
│       └── renderers/           # Rendering logic for DSL
│   │
│   ├── config/                  # Configuration files
│   │   ├── svgConfig.ts         # SVG configuration constants
│   │   └── geometryConfig.ts    # Geometry configuration
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useThemeAwareSteps.ts # Hook for theme-aware step rendering
│   │
│   ├── themes.ts                # Theme definitions (light/dark)
│   ├── svg.ts                   # SVG utility functions
│   ├── svgElements.ts           # SVG element creation utilities
│   ├── types/                   # TypeScript type definitions
│   │   └── geometry.ts          # Geometry types (shared with geometry/)
│   └── utils/                   # Utility functions
│       └── geometryHighlighting.ts
│
├── e2e/                        # Playwright E2E tests
├── test/                       # Unit tests
├── public/                     # Static assets
└── dist/                       # Build output
```

## Main Blocks & Their Responsibilities

### Block 1: Entry & Provider Layer

- **Files:** `main.tsx`, `QueryProvider.tsx`
- **Purpose:** App initialization, React Query setup
- **Complexity:** ⭐ (Very easy - straightforward React setup)
- **Refactor Need:** ❌ None - clean and simple
- **Dependencies:** React, React Query

### Block 2: App Orchestration (Root Component)

- **Files:** `App.tsx` (~1200 lines)
- **Purpose:** Main container with all geometry demonstration sections
- **Responsibility:**
  - Manages 6 geometry sections (sixfold-v0, square, square-dsl, sixfold-dsl, sixfold-dsl-v1, rotated-square)
  - Handles theme toggling (light/dark)
  - Manages navigation and URL hash-based routing
  - Controls step-by-step animation for each section
  - Orchestrates SVG rendering via store integration
- **Complexity:** ⭐⭐⭐⭐ (Hard - duplicated state management for each section)
- **Refactor Need:** ⚠️ **HIGH PRIORITY**
  - ~400 lines of duplicated play/next/prev/restart handler logic (6 sections × ~65 lines each)
  - State management could be extracted into a custom hook or component
  - Consider creating a `<GeometrySection>` wrapper component
- **Duplication Pattern:** Each section has identical state (currentStep, restartKey, isPlaying, playInterval, svgRef) and handlers (handleNextClick*, handlePrevClick*, handlePlayClick*, handleFirstStep*, handleLastStep\*)

### Block 3: State Management (React Store)

- **Files:** `react-store.ts` (~280 lines)
- **Purpose:** Custom store for managing SVG geometry elements and their dependencies
- **Responsibility:**
  - `useGeometryStore()` - manages SVG elements (circle, line, polygon, etc.)
  - `useGeometryValueStore()` - manages geometry values with dependency tracking
  - Handles element cleanup (prevents memory leaks)
  - Tracks dependencies between geometry items
- **Complexity:** ⭐⭐ (Moderate - well-structured but could use separation)
- **Refactor Need:** ⚠️ MEDIUM
  - Consider splitting into separate files (store.ts, value-store.ts)
  - `GeometryItem` interface has optional fields that could be better typed
  - Some utility functions could be extracted

### Block 4: UI Components

- **Files:** 12 component files in `components/`
- **Purpose:** Reusable UI elements
- **Complexity Breakdown:**
  - ⭐ Navigation.tsx - Simple navigation bar
  - ⭐ CopyUrlButton.tsx - Simple button with clipboard logic
  - ⭐ CopySvgButton.tsx - Simple button with SVG copy logic
  - ⭐⭐ GeometryPlayer.tsx - Player controls + SVG container (~200 lines)
  - ⭐⭐ GeometryList.tsx - Filterable list with type filters (~300 lines)
  - ⭐⭐ GeometryDetails.tsx - Step details display
  - ⭐⭐ \*Svg.tsx files (6 files) - SVG rendering components, each ~100-200 lines
- **Refactor Need:** ⚠️ MEDIUM for SVG components
  - SVG components have duplicated rendering logic
  - Could extract common SVG rendering into a shared component or hook

### Block 5: Geometry Core

- **Files:** 14 files in `geometry/` (~2000+ lines total)
- **Purpose:** Geometry computation, step definitions, DSL implementation
- **Sub-blocks:**

  #### 5a: Step Definitions
  - **Files:** `squareSteps.ts`, `rotatedSquareSteps.ts`, `sixFoldV0Steps.ts`, `squareDslSteps.ts`, `sixfoldDslSteps.ts`, `sixfoldDslV1Steps.ts`
  - **Purpose:** Define the steps for each geometric construction
  - **Complexity:** ⭐⭐⭐ (Moderate - repetitive step definitions)
  - **Refactor Need:** ⚠️ MEDIUM
    - Step definitions are verbose and repetitive
    - DSL version (v1) is more declarative and cleaner
    - Could benefit from more code generation or shared builders

  #### 5b: DSL Implementation
  - **Files:** `dsl/` directory with 20+ files
  - **Purpose:** Declarative DSL for defining geometry constructions
  - **Structure:**
    - `types.ts` - Type definitions
    - `GeometryBuilder.ts` - Builder pattern for DSL
    - `expressions/` - Expression nodes (Circle, Line, Point, Polygon, operations)
    - `renderers/` - Rendering logic for DSL expressions
    - `utils.ts` - Utility functions
  - **Complexity:** ⭐⭐⭐⭐ (Hard - complex type system, expression tree)
  - **Refactor Need:** ⚠️ HIGH PRIORITY
    - Expression files have duplicated boilerplate
    - Some expressions could be simplified or merged
    - Renderer types could be more consistent

  #### 5c: Operations & Constructors
  - **Files:** `operations.ts`, `constructors.ts`, `stepBuilders.ts`, `stepExecution.ts`
  - **Purpose:** Low-level geometry operations and helpers
  - **Complexity:** ⭐⭐ (Moderate - mathematical, well-structured)
  - **Refactor Need:** ❌ None - clean and focused

### Block 6: Configuration & Types

- **Files:** `config/`, `themes.ts`, `types/geometry.ts`
- **Purpose:** Shared configuration and type definitions
- **Complexity:** ⭐ (Easy)
- **Refactor Need:** ❌ None

### Block 7: Hooks & Utilities

- **Files:** `hooks/`, `utils/`
- **Purpose:** Custom hooks and utility functions
- **Complexity:** ⭐ (Easy)
- **Refactor Need:** ❌ None

## Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         main.tsx                                  │
│                    QueryProvider                                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  State: theme, activeSection, currentStep*6, isPlaying*6      │ │
│  │  Handlers: scrollToSection, handle*Click*6, toggleTheme       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  Navigation      │  │  GeometryPlayer  │  │  GeometryList    │   │
│  │  (nav + theme)   │  │  (controls+SVG)  │  │  (filterable)    │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  SixFoldV0Svg   │  │  SquareSvg       │  │  ... (6 total)   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
   react-store.ts        geometry/*Steps.ts    geometry/dsl/
         │                     │                     │
         ▼                     ▼                     ▼
   SVG Element           Step Definitions      DSL Expressions
   Management                                    &
                                         Renderers
```

## Dependency Flow

1. **User Interaction** → App.tsx (handlers) → Store updates
2. **Store Updates** → React re-render → SVG components
3. **SVG Components** → Use store to render geometry
4. **Step Navigation** → App.tsx updates currentStep → Re-executes step → Store updated
5. **DSL** → Declares geometry → Builder creates expressions → Renderer draws SVG

## Block Health Summary

| Block              | Files | Lines | Complexity | Refactor Priority | Notes                             |
| ------------------ | ----- | ----- | ---------- | ----------------- | --------------------------------- |
| Entry              | 2     | ~30   | ⭐         | None              | Clean                             |
| App Orchestration  | 1     | ~1200 | ⭐⭐⭐⭐   | **HIGH**          | Massive duplication               |
| React Store        | 1     | ~280  | ⭐⭐       | Medium            | Could be split                    |
| UI Components      | 12    | ~1500 | ⭐⭐       | Medium            | SVG components need consolidation |
| Geometry Steps     | 6     | ~1500 | ⭐⭐⭐     | Medium            | DSL versions cleaner              |
| DSL Implementation | 20+   | ~2000 | ⭐⭐⭐⭐   | **HIGH**          | Complex, needs simplification     |
| Operations         | 4     | ~500  | ⭐⭐       | None              | Clean                             |
| Config/Types       | 4     | ~300  | ⭐         | None              | Clean                             |
| Hooks/Utils        | 3     | ~200  | ⭐         | None              | Clean                             |

## Critical Issues

1. **App.tsx is too large** - 1200+ lines with 6 near-identical section implementations
2. **Duplicated state management** - Each geometry section has identical play/step logic
3. **DSL complexity** - Expression tree is hard to follow and maintain
4. **No separation of concerns** - App.tsx does too much (orchestration + rendering + state)

## Recommended Refactoring Order

1. **Extract GeometrySection component** from App.tsx (Highest ROI)
   - Create `<GeometrySection>` that encapsulates play/step/navigation logic
   - Reduce App.tsx from 1200 to ~300 lines
   - Estimated effort: 4-8 hours

2. **Simplify DSL expression boilerplate**
   - Create expression macros or factory functions
   - Reduce duplication in expression files
   - Estimated effort: 6-12 hours

3. **Consolidate SVG rendering components**
   - Extract common rendering logic
   - Create shared SVG utilities
   - Estimated effort: 4-6 hours

4. **Split react-store.ts** into separate files
   - geometry-store.ts, value-store.ts, utilities.ts
   - Estimated effort: 2-4 hours

## Next Steps

To deep dive into specific blocks, run:

- `cat app2/docs/architecture/01-APP-ORCHESTRATION.md` - Detailed App.tsx analysis
- `cat app2/docs/architecture/02-REACT-STORE.md` - Store analysis
- `cat app2/docs/architecture/03-GEOMETRY-CORE.md` - Geometry core analysis
- `cat app2/docs/architecture/04-DSL.md` - DSL deep dive
- `cat app2/docs/architecture/05-UI-COMPONENTS.md` - Component analysis
