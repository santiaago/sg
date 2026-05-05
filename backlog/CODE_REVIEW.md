# CODE_REVIEW: app2 Architecture Overview

This document identifies and ranks the main pieces of the app2 system for targeted code review.

## Ranking Criteria

- **Criticality**: Impact on core functionality and user experience
- **Complexity**: Code complexity, dependencies, and maintenance burden
- **Reusability**: Used across multiple features or components
- **Risk**: Potential for bugs, performance issues, or breaking changes

---

## 1. Geometry Step System (CRITICAL - Priority 1)

**Files**:

- `app2/src/types/geometry.ts` - Core type definitions (Step, GeometryValue, GeometryNode)
- `app2/src/geometry/squareSteps.ts` - Square construction step definitions
- `app2/src/geometry/sixFoldV0Steps.ts` - Six-fold pattern step definitions
- `app2/src/geometry/operations.ts` - Pure geometry operations
- `app2/src/geometry/constructors.ts` - Geometry constructors
- `app2/src/geometry/sixFold/operations.ts` - Six-fold specific operations
- `app2/src/geometry/index.ts` - Module exports

**Responsibility**:

- Defines the lazy step-by-step geometry calculation and rendering pipeline
- Contains all geometric construction logic
- Step interface with `compute()` and `draw()` separation
- Dependency tracking between geometry elements

**Why Priority 1**:

- Core domain logic of the application
- High complexity with interdependent steps
- Any issues here cascade to rendering, state management, and UI
- Highest risk for subtle bugs in geometry calculations

**Review Focus**:

- Step definition correctness and consistency
- Dependency graph accuracy
- Pure function compliance in compute functions
- Error handling for edge cases in geometry operations
- Performance of step execution

---

## 2. React Store & State Management (CRITICAL - Priority 1)

**Files**:

- `app2/src/react-store.ts` - Geometry store hooks (useGeometryStoreSquare, useGeometryStoreSixFoldV0, useGeometryValueStore)

**Responsibility**:

- Manages SVG element references and geometry item state
- Tracks dependencies between geometry elements
- Handles addition, update, and clearing of geometry items
- Provides initial state capture for SVG attributes

**Why Priority 1**:

- Central state management for all geometry rendering
- Used by both Square and SixFoldV0 components
- Memory management concerns (SVG element cleanup)
- Potential memory leaks if not properly cleaned up

**Review Focus**:

- Memory management and cleanup (especially `clearSquareStore` in App.tsx)
- Store API consistency across variants
- Performance of state updates with many geometry items
- Type safety of stored elements (`any` usage)

---

## 3. SVG Rendering Layer (HIGH - Priority 2)

**Files**:

- `app2/src/svgElements.ts` - SVG element creation helpers (dot, line, circle, coordinateSystemArrows, tooltip functions)
- `app2/src/svg.ts` - SVG utility functions (setupSvg, buildStepMaps, pick)
- `app2/src/config/svgConfig.ts` - SVG configuration constants

**Responsibility**:

- Low-level SVG element creation and manipulation
- Tooltip rendering and positioning
- SVG setup and teardown
- Dependency map building for geometry steps

**Why Priority 2**:

- Foundational rendering layer used by all geometry components
- Tooltip system complexity with DOM manipulation
- Cross-cutting concern across all geometry visualizations

**Review Focus**:

- Tooltip positioning logic and edge cases
- SVG element cleanup and memory management
- Type extensions for custom properties (tooltip, tooltipBg)
- Accessibility of SVG elements

---

## 4. Geometry Components (HIGH - Priority 2)

**Files**:

- `app2/src/components/SquareSvg.tsx` - Square geometry SVG component
- `app2/src/components/SixFoldV0Svg.tsx` - Six-fold pattern SVG component
- `app2/src/components/GeometryPlayer.tsx` - Step navigation and playback controls

**Responsibility**:

- Render geometry steps into SVG
- Manage step execution and rendering lifecycle
- Handle user interactions with geometry (hover, selection)
- Playback control (play, pause, step forward/backward)

**Why Priority 2**:

- Direct user interaction with geometry
- Complex lifecycle with step changes and restarts
- Contains duplicate logic between Square and SixFold components

**Review Focus**:

- Code duplication between SquareSvg and SixFoldV0Svg
- Step rendering performance
- Playback interval management and cleanup
- Responsive behavior to step changes

---

## 5. App Shell & Navigation (MEDIUM - Priority 3)

**Files**:

- `app2/src/App.tsx` - Main application component
- `app2/src/main.tsx` - Application entry point
- `app2/src/components/Navigation.tsx` - Navigation component
- `app2/src/QueryProvider.tsx` - React Query provider wrapper

**Responsibility**:

- Application routing and section management
- Theme toggling (light/dark)
- URL hash-based navigation
- React Query setup

**Why Priority 3**:

- Application structure and routing
- Theme management affects all visual elements
- Navigation state management

**Review Focus**:

- Scroll behavior and hash synchronization
- Theme state propagation
- Code organization (App.tsx is very large at ~500 lines)
- Potential extraction of duplicate step control logic

---

## 6. UI Components (MEDIUM - Priority 3)

**Files**:

- `app2/src/components/GeometryList.tsx` - List of geometry items with filters
- `app2/src/components/GeometryDetails.tsx` - Detailed view of selected geometry
- `app2/src/components/CopySvgButton.tsx` - SVG copy functionality
- `app2/src/components/CopyUrlButton.tsx` - URL copy functionality

**Responsibility**:

- Geometry item listing and filtering
- Geometry detail display
- Copy-to-clipboard functionality

**Why Priority 3**:

- User-facing UI for geometry exploration
- Filtering and display logic
- Clipboard integration

**Review Focus**:

- Filter implementation correctness
- Copy functionality reliability
- Performance with many geometry items
- Accessibility of UI controls

---

## 7. Theming System (MEDIUM - Priority 3)

**Files**:

- `app2/src/themes.ts` - Theme definitions (lightTheme, darkTheme)

**Responsibility**:

- Color scheme definitions for all SVG and UI elements
- Theme type definitions

**Why Priority 3**:

- Affects visual consistency across the application
- Theme switching is a user-facing feature

**Review Focus**:

- Color constant consistency with original design
- Theme type completeness
- Documentation of color meanings

---

## 8. Hooks (LOW - Priority 4)

**Files**:

- `app2/src/hooks/useThemeAwareSteps.ts` - Theme-aware step processing

**Responsibility**:

- Custom React hooks for cross-cutting concerns

**Why Priority 4**:

- Currently minimal (one hook)
- Utility functionality

**Review Focus**:

- Hook logic correctness
- Potential for more shared hooks

---

## 9. Tests (LOW - Priority 4)

**Files**:

- `app2/src/components/GeometryList.test.tsx` - GeometryList component tests
- `app2/test/` - Additional test files
- `app2/e2e/` - Playwright E2E tests

**Responsibility**:

- Unit and integration testing
- End-to-end testing

**Why Priority 4**:

- Important but secondary to implementation review
- Current coverage appears limited

**Review Focus**:

- Test coverage gaps
- Test reliability and maintainability
- E2E test scenarios

---

## 10. Configuration & Build (LOW - Priority 4)

**Files**:

- `app2/package.json` - Dependencies and scripts
- `app2/tsconfig.json` - TypeScript configuration
- `app2/tailwind.config.js` - Tailwind CSS configuration
- `app2/vite.config.js` - Vite build configuration
- `app2/eslint.config.js` - ESLint configuration

**Responsibility**:

- Build pipeline and tooling
- Development environment setup
- Linting and code quality

**Why Priority 4**:

- Infrastructure rather than application logic
- Well-established configurations

**Review Focus**:

- Dependency versions and security
- Build optimization opportunities
- Lint rule consistency

---

## Review Order Recommendation

1. **Start with Priority 1**: Geometry Step System + React Store
   - These contain the core domain logic and state management
   - Issues here have the highest impact

2. **Proceed to Priority 2**: SVG Rendering + Geometry Components
   - Rendering layer and component logic
   - High complexity with visual output

3. **Then Priority 3**: App Shell, UI Components, Theming
   - User-facing features and application structure
   - Medium complexity

4. **Finally Priority 4**: Hooks, Tests, Configuration
   - Supporting code and infrastructure
   - Lower risk

---

## Cross-Cutting Concerns to Review Globally

After individual section reviews, conduct a global review for:

1. **Type Safety**: Usage of `any` type, especially in react-store.ts
2. **Code Duplication**: Between Square and SixFold components and steps
3. **Memory Management**: SVG element cleanup, store clearing
4. **Error Handling**: Geometry operations, DOM manipulation
5. **Performance**: Step rendering, state updates, SVG manipulation
6. **Accessibility**: SVG elements, UI controls, keyboard navigation
7. **Testing Strategy**: Unit test coverage, E2E test scenarios
