# PRD: Migrate Square and SixFold DSL to useSmartStepper

## Problem Statement

As a developer maintaining the SG Geometry application, the geometry construction sections in App.tsx have inconsistent step management: sixfold-dsl-v1 uses `useSmartStepper` for smart navigation (skipping non-visual steps), while square-dsl and sixfold-dsl use simple state-based step counting. This inconsistency prevents extracting reusable components and creates code duplication across the three sections. Each section duplicates ~75 lines of step navigation, play/pause, and restart logic. Migrating all sections to useSmartStepper enables a subsequent refactor to reduce duplication.

## Solution

Migrate the square-dsl and sixfold-dsl sections in App.tsx to use `useSmartStepper`, following the exact pattern established by sixfold-dsl-v1. This aligns all geometry sections on a consistent step management approach, enabling future extraction of a reusable GeometrySection component. The migration maintains identical user-facing behavior since square and sixfold DSLs contain only visual steps (useSmartStepper will skip no steps for these constructions).

The solution uses a **follow-the-leader pattern**: sixfold-dsl-v1 is the source of truth. All migration decisions defer to how v1 implements the same functionality.

## User Stories

### Consistency & Maintainability

1. As a developer, I want all geometry sections to use the same step management approach, so that the codebase is consistent and predictable
2. As a developer, I want square and sixfold DSLs to use useSmartStepper like sixfold-dsl-v1, so that there is a single pattern to follow
3. As a developer, I want step navigation to use the same semantics across all sections, so that I can reason about the code uniformly

### Code Quality

4. As a developer, I want to eliminate duplicate step navigation code between sections, so that changes to navigation logic only need to be made in one place
5. As a developer, I want play/pause interval logic to follow the same pattern in all sections, so that the implementation is consistent
6. As a developer, I want restart logic (store.clear + restartKey) to be implemented consistently, so that behavior is predictable

### Verification

7. As a developer, I want the migrated square section to have identical user-facing behavior to the current implementation, so that the migration is non-breaking
8. As a developer, I want the migrated sixfold section to have identical user-facing behavior to the current implementation, so that the migration is non-breaking
9. As a developer, I want the GeometryPlayer UI (slider, step counter) to display the same values as before, so that users see no difference
10. As a developer, I want the SVG rendering to show the same geometries at each step as before, so that the visual output is unchanged

### Future-Proofing

11. As a developer, I want square and sixfold DSLs to be ready for potential future non-visual steps, so that adding them later requires no refactoring
12. As a developer, I want all sections to use the same hook interface, so that extracting shared components is straightforward

## Implementation Decisions

### Modules to Modify

- **App.tsx**: The only file that changes. Each geometry section (square-dsl, sixfold-dsl) will be updated to use useSmartStepper.

### Interface Changes

- Each section will use `useSmartStepper({ steps: buildXxxDslSteps() })` to manage step state
- `currentVisualIndex` from useSmartStepper will be passed to GeometryPlayer as `currentStep`
- `visualStepCount - 1` from useSmartStepper will be passed to GeometryPlayer as `totalSteps`
- `stepsUpToIndex` from useSmartStepper will be passed to the SVG component as `currentStep` and to useThemeAwareSteps

### Technical Clarifications

- **Step semantics**: useSmartStepper uses display-ready indexing where 0 = before first step, 1..N = visual steps. For square and sixfold (all steps visual), `stepsUpToIndex = currentVisualIndex` and the behavior matches the current simple counting exactly.
- **Interval pattern**: Follow v1 exactly — use refs (`currentVisualIndexRef`, `visualStepCountRef`) updated via useEffect to avoid stale closures in setInterval callbacks.
- **Handler pattern**: Follow v1 exactly — stop playing on manual navigation, use stepper methods (`goToNext`, `goToPrev`, `goToStep`), include store.clear() and restartKey increment in first/last handlers.
- **Last step**: Use `goToStep(visualStepCount)` to navigate to the end state (after all steps).

### Specific Interactions

- GeometryPlayer receives `currentVisualIndex` for display (slider position, step counter)
- SVG components receive `stepsUpToIndex` for rendering (exclusive upper bound on steps to execute)
- useThemeAwareSteps receives `stepsUpToIndex` to determine when to clear geometry
- Handlers call `store.clear()` before `goToStep(0)` or `goToStep(visualStepCount)` for first/last navigation

## Testing Decisions

### What Makes a Good Test

- Test external behavior only: verify that at each step, the correct geometries are rendered and the UI displays the correct step information
- Do not test implementation details like internal state or hook internals
- Test the integration: GeometryPlayer slider, step counter, SVG rendering, play/pause functionality

### Modules to Test

- **App.tsx geometry sections**: Integration tests verifying step navigation works correctly
- Each section independently: square-dsl, sixfold-dsl after migration

### Prior Art

- Existing tests in the codebase for geometry rendering and step navigation
- v1 section already uses useSmartStepper and can serve as a reference for expected behavior

## Out of Scope

- Refactoring App.tsx to extract reusable GeometrySection component (separate PRD)
- Adding new geometry sections
- Changing the visual appearance of any section
- Modifying the DSL step builders (squareDslSteps, sixfoldDslSteps)
- Modifying GeometryPlayer, GeometryDetails, GeometryList, or SVG components
- Theme or styling changes

## Further Notes

- **PR Structure**: Two commits in a single PR — first commit migrates square-dsl, second commit migrates sixfold-dsl. This allows easy reversion of individual migrations if issues arise.
- **Follow-the-leader**: For any question during implementation, the answer is "do what sixfold-dsl-v1 does".
- **After this PR**: The next step is refactoring App.tsx to extract a GeometrySection component that eliminates the remaining duplication between the three geometry sections.
