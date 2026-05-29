# PRD: Simplify useSmartStepper by Hiding -1 from Users

## Problem Statement

The `useSmartStepper` hook exposes an implementation detail to its callers: to start in the "before first step" state (where no geometries are executed and the UI displays "Current step 0/97"), callers must explicitly pass `initialVisualIndex: -1`. This is confusing because `-1` is a sentinel value that has no semantic meaning to users of the hook. Furthermore, the UI must manually add `+1` to `currentVisualIndex` before display, which couples callers to the internal indexing scheme.

## Solution

Adopt display-ready indexing in `useSmartStepper` so that:
- `currentVisualIndex = 0` means "before first step" (no geometries executed, displays as "Current step 0/N")
- `currentVisualIndex = N` means "at Nth visual step" (displays as "Current step N/N")
- Remove the `initialVisualIndex` parameter — the hook always starts at "before first step" by default

This hides the `-1` sentinel from users, simplifies the API surface, and allows the UI to use `currentVisualIndex` directly without arithmetic transformations.

## User Stories

1. As a developer using `useSmartStepper`, I want the hook to start at "before first step" by default, so that I don't need to pass a magic number like `-1`
2. As a developer using `useSmartStepper`, I want `currentVisualIndex` to return 0 when no steps are executed, so that the value matches what the user sees in the UI
3. As a developer using `useSmartStepper`, I want to call `goToStep(0)` to navigate to "before first step", so that the API is intuitive and 0-based
4. As a developer using `useSmartStepper`, I want to display `currentVisualIndex` directly without arithmetic, so that my code is simpler and less error-prone
5. As a developer using `useSmartStepper`, I want `canGoNext` to be true when at "before first step" if there are visual steps, so that users can immediately start navigating
6. As a developer using `useSmartStepper`, I want `canGoPrev` to be false when at "before first step", so that the navigation boundary is correct
7. As a developer using `useSmartStepper`, I want `stepsUpToIndex` to be 0 when `currentVisualIndex` is 0, so that no geometries are executed in the "before first step" state
8. As a developer integrating with `GeometryPlayer`, I want to pass `currentVisualIndex` directly as `currentStep` without transformation, so that the integration is seamless
9. As a user viewing the geometry details pane, I want to see "Current step 0/97" when no step has been executed, so that the display matches my mental model
10. As a user viewing the geometry list, I want to see "Showing 0 of 0 items" when no step has been executed, so that the display is consistent
11. As a user clicking the play button from the start, I want the animation to begin from the first visual step (not auto-advance from "before first"), so that the behavior is predictable
12. As a maintainer of `useSmartStepper`, I want the internal implementation to use a transformation layer, so that future refactoring is easier
13. As a maintainer of the codebase, I want all tests to use display-ready indexing, so that the test suite documents the expected behavior clearly
14. As a maintainer of the codebase, I want the JSDoc comments to reflect the new display-ready semantics, so that the API is self-documenting

## Implementation Decisions

- **Hook API simplification:** Remove the `initialVisualIndex` parameter from `UseSmartStepperProps`. The hook will always initialize to the "before first step" state internally.

- **Display-ready indexing:** The hook returns `currentVisualIndex` in a display-ready format where 0 represents "before first step" and N represents the Nth visual step. This means `currentVisualIndex` can range from 0 to `visualStepCount` (inclusive).

- **Internal representation:** The hook maintains an internal state (`_currentVisualIndex`) using the existing -1, 0, 1... indexing, and transforms to display-ready indexing on output. This minimizes changes to the existing logic while presenting a cleaner API.

- **Navigation semantics:**
  - `canGoNext = currentVisualIndex < visualStepCount`
  - `canGoPrev = currentVisualIndex > 0`
  - `goToStep(displayIndex)` clamps to [0, visualStepCount] and converts to internal indexing

- **Execution boundary:** `stepsUpToIndex` continues to represent the exclusive upper bound for `executeSteps`. When `currentVisualIndex = 0` (before first), `stepsUpToIndex = 0`.

- **App.tsx integration updates:**
  - The play interval condition changes from `currentIndex >= 0 && currentIndex < totalVisualSteps - 1` to `currentIndex > 0 && currentIndex < totalVisualSteps` to preserve the existing behavior of not auto-advancing from "before first step"
  - `GeometryPlayer` receives `currentVisualIndex` directly (no +1 transformation)
  - Display text uses `currentVisualIndex` directly (no +1 transformation)

- **Type changes:** `UseSmartStepperProps` no longer includes `initialVisualIndex`. All other types remain unchanged.

## Testing Decisions

- Rewrite all tests in `useSmartStepper.test.tsx` using display-ready semantics (Approach B). Tests should document behavior from the caller's perspective, not the internal implementation.

- Test boundary conditions explicitly:
  - Empty steps array
  - All non-visual steps
  - Single visual step
  - Mixed visual and non-visual steps
  - Navigation from "before first step" to first step
  - Navigation between steps
  - Clamping behavior in `goToStep`

- Prior art: The existing test file already tests similar navigation and boundary logic; we preserve the same coverage with updated expectations.

## Out of Scope

- Updating SPEC-smart-stepper.md and PLAN-smart-stepper.md documentation files
- Adding the `initialVisualIndex` parameter back in the future for deep linking or state restoration (this can be added later if needed)
- Handling dynamic changes to the `steps` prop array (this is an existing limitation not introduced by these changes)
- Refactoring the internal implementation to use display-ready indexing natively (Option B) — we use transformation (Option A) for safety

## Further Notes

This is a breaking change for the `useSmartStepper` API. The only production caller (App.tsx) and the test file need updating. No other components currently use this hook. The change preserves all user-facing behavior while simplifying the developer experience.
