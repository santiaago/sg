# Implementation Plan: Smart Stepper for Non-Visual Geometry

## Overview

Implement smart stepper that skips non-visual steps during DSL construction navigation, eliminating ghost steps in UI. Replace hardcoded step length constants with dynamic calculations based on `isVisual` property. Build reusable `useSmartStepper` hook for navigation, index mapping, and step counting.

## Architecture Decisions

1. **Reusable hook pattern:** Create `useSmartStepper` hook instead of duplicating logic in each DSL SVG component. Centralizes navigation logic, easier to maintain.

2. **Two index spaces:** Maintain both actual step index (for execution) and visual step index (for UI). Non-visual steps execute but don't appear in stepper.

3. **Dynamic step length:** Calculate visual step count at runtime from `steps.filter(s => s.isVisual !== false).length`. Remove all hardcoded `*_STEPS_LENGTH` constants.

4. **Preserve execution:** All steps (visual + non-visual) execute up to current position to maintain dependency calculations. Only UI navigation skips non-visual.

5. **Backward compatible:** Hook accepts steps array directly, no changes to Step interface required.

## Dependency Graph

```
Step interface (existing, has isVisual)
    │
    └── steps arrays (sixfoldDslV1Steps, sixFoldDslSteps, squareDslSteps)
            │
            └── useSmartStepper hook (NEW)
                    │
                    ├── SixFoldDslV1Svg.tsx
                    ├── SixFoldDslSvg.tsx
                    └── SquareDslSvg.tsx
```

## Task List

### Phase 1: Foundation - Helper Functions

---

#### Task 1: Create stepper utility functions

**Description:** Create pure utility functions for visual step navigation. No React, no hooks. Testable independently.

**Acceptance criteria:**
- [ ] `findNextVisualStep(steps: Step[], fromIndex: number): number` implemented
- [ ] `findPrevVisualStep(steps: Step[], fromIndex: number): number` implemented
- [ ] `getVisualStepIndex(steps: Step[], actualIndex: number): number` implemented
- [ ] `getActualStepIndex(steps: Step[], visualIndex: number): number` implemented
- [ ] `getVisualStepCount(steps: Step[]): number` implemented
- [ ] All functions handle edge cases (first/last step, all non-visual, all visual)

**Verification:**
- [ ] Tests pass: `pnpm test -- stepperUtils.test`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/utils/stepperUtils.ts` (NEW)
- `app2/tests/geometry/utils/stepperUtils.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 2: Create failing tests for stepper utilities

**Description:** Write comprehensive tests for stepper utility functions. Tests must FAIL before implementation (Task 1).

**Acceptance criteria:**
- [ ] Test file exists with describe blocks for each function
- [ ] Tests cover: normal navigation, edge cases (first, last, boundaries), empty arrays, all visual, all non-visual
- [ ] Tests use TypeScript types matching actual Step interface
- [ ] All tests FAIL when run against non-existent implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- stepperUtils.test` (expected)

**Dependencies:** None

**Files likely touched:**
- `app2/tests/geometry/utils/stepperUtils.test.ts` (NEW)

**Estimated scope:** S

---

### Checkpoint: Foundation

- [ ] Stepper utility functions implemented (Task 1)
- [ ] All stepper utility tests pass
- [ ] TypeScript compiles without errors
- [ ] Human review before proceeding

---

### Phase 2: Core - React Hook

---

#### Task 3: Create useSmartStepper hook

**Description:** Implement React hook that wraps stepper utilities for use in components. Manages visual step index, maps to actual step index, provides navigation functions.

**Acceptance criteria:**
- [ ] Hook exports: `currentVisualIndex`, `visualStepCount`, `stepsUpToIndex`, `goToNext`, `goToPrev`, `goToStep`, `canGoNext`, `canGoPrev`
- [ ] Hook accepts `steps: Step[]` and optional `initialVisualIndex`
- [ ] Navigation functions respect boundaries (can't go below 0 or above visualStepCount-1)
- [ ] `goToStep` accepts visual index and clamps to valid range
- [ ] Hook re-computes when steps array changes

**Verification:**
- [ ] Tests pass: `pnpm test -- useSmartStepper.test`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** Task 1 (stepper utilities)

**Files likely touched:**
- `app2/src/hooks/useSmartStepper.ts` (NEW)
- `app2/tests/hooks/useSmartStepper.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 4: Create failing tests for useSmartStepper

**Description:** Write React hook tests using `@testing-library/react-hooks` or similar. Tests must FAIL before implementation (Task 3).

**Acceptance criteria:**
- [ ] Tests cover: initial state, navigation (next/prev), direct step access, boundary conditions
- [ ] Tests verify hook returns correct values at each state
- [ ] Tests verify navigation doesn't go out of bounds
- [ ] All tests FAIL when run against non-existent implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- useSmartStepper.test` (expected)

**Dependencies:** None (can be done in parallel with Task 3)

**Files likely touched:**
- `app2/tests/hooks/useSmartStepper.test.ts` (NEW)

**Estimated scope:** S

---

### Checkpoint: Core Hook

- [ ] useSmartStepper hook implemented (Task 3)
- [ ] All useSmartStepper tests pass
- [ ] TypeScript compiles without errors
- [ ] Human review before proceeding

---

### Phase 3: Integration - SixFoldDslV1Svg

---

#### Task 5: Update SixFoldDslV1Svg.tsx to use smart stepper

**Description:** Replace current stepper logic in SixFoldDslV1Svg with useSmartStepper. Remove hardcoded DSL_SIXFOLD_V1_STEPS_LENGTH.

**Acceptance criteria:**
- [ ] Component uses `useSmartStepper` with `sixfoldDslV1Steps`
- [ ] executeSteps called with `stepsUpToIndex` (not visual index)
- [ ] UI displays visual step index: "Step {currentVisualIndex + 1}/{visualStepCount}"
- [ ] Next/prev buttons use hook's `goToNext`/`goToPrev`
- [ ] Hardcoded `DSL_SIXFOLD_V1_STEPS_LENGTH` removed or replaced with dynamic value
- [ ] All existing rendering still works

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] TypeScript compiles without errors
- [ ] Manual check: SixFold DSL v1 steps through without ghost steps

**Dependencies:** Task 3 (useSmartStepper hook)

**Files likely touched:**
- `app2/src/components/SixFoldDslV1Svg.tsx`
- `app2/src/geometry/sixfoldDslV1Steps.ts` (remove constant)

**Estimated scope:** S

---

### Checkpoint: SixFold V1 Integration

- [ ] SixFoldDslV1Svg uses smart stepper
- [ ] No ghost steps in SixFold DSL v1
- [ ] Visual step count displays correctly
- [ ] All visual geometry renders at each step

---

### Phase 4: Integration - SixFoldDslSvg

---

#### Task 6: Update SixFoldDslSvg.tsx to use smart stepper

**Description:** Apply same changes as Task 5 to SixFoldDslSvg component.

**Acceptance criteria:**
- [ ] Component uses `useSmartStepper` with `sixFoldDslSteps`
- [ ] executeSteps called with `stepsUpToIndex`
- [ ] UI displays visual step index
- [ ] Next/prev buttons use hook's navigation
- [ ] Hardcoded `DSL_SIXFOLD_STEPS_LENGTH` removed
- [ ] All existing rendering still works

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: SixFold DSL v0 steps through without ghost steps

**Dependencies:** Task 3 (useSmartStepper hook)

**Files likely touched:**
- `app2/src/components/SixFoldDslSvg.tsx`
- `app2/src/geometry/sixFoldDslSteps.ts` (remove constant)

**Estimated scope:** S

---

### Checkpoint: SixFold Integration

- [ ] Both SixFold components use smart stepper
- [ ] No ghost steps in either SixFold DSL
- [ ] Visual step counts display correctly

---

### Phase 5: Integration - SquareDslSvg

---

#### Task 7: Update SquareDslSvg.tsx to use smart stepper

**Description:** Apply same changes as Task 5 to SquareDslSvg component.

**Acceptance criteria:**
- [ ] Component uses `useSmartStepper` with `squareDslSteps`
- [ ] executeSteps called with `stepsUpToIndex`
- [ ] UI displays visual step index
- [ ] Next/prev buttons use hook's navigation
- [ ] Hardcoded `DSL_SQUARE_STEPS_LENGTH` removed
- [ ] All existing rendering still works

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: Square DSL steps through without ghost steps

**Dependencies:** Task 3 (useSmartStepper hook)

**Files likely touched:**
- `app2/src/components/SquareDslSvg.tsx`
- `app2/src/geometry/squareDslSteps.ts` (remove constant)

**Estimated scope:** S

---

### Checkpoint: All DSL Components

- [ ] All three DSL SVG components use smart stepper
- [ ] No ghost steps in any DSL construction
- [ ] All hardcoded step length constants removed
- [ ] All existing visual geometry renders correctly

---

### Phase 6: Polish

---

#### Task 8: Add integration tests for smart stepper

**Description:** Create integration tests that verify smart stepper works correctly with real DSL steps.

**Acceptance criteria:**
- [ ] Test SixFoldDslV1Svg stepper navigation
- [ ] Test SixFoldDslSvg stepper navigation
- [ ] Test SquareDslSvg stepper navigation
- [ ] Tests verify no ghost steps appear
- [ ] Tests verify step counts are correct

**Verification:**
- [ ] Tests pass: `pnpm test -- smartStepper.integration.test`

**Dependencies:** Tasks 5, 6, 7 (all integrations)

**Files likely touched:**
- `app2/tests/components/smartStepper.integration.test.ts` (NEW)

**Estimated scope:** M

---

#### Task 9: Update existing tests if needed

**Description:** Review and update any existing tests that may reference hardcoded step counts or expect ghost steps.

**Acceptance criteria:**
- [ ] All existing tests pass with new stepper logic
- [ ] Any tests referencing step counts updated to use dynamic values
- [ ] No tests broken by smart stepper changes

**Verification:**
- [ ] All tests pass: `pnpm test`

**Dependencies:** Tasks 5, 6, 7, 8

**Files likely touched:**
- Various test files (if any reference step counts)

**Estimated scope:** S

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing DSL rendering | High | Keep executeSteps logic unchanged, only change stepper UI navigation |
| Non-visual steps not executing | High | Verify all steps 0..stepsUpToIndex execute, not just visual ones |
| Hook re-renders excessively | Medium | Use useMemo for derived values in hook |
| Hardcoded constants referenced elsewhere | Medium | Grep for all `_STEPS_LENGTH` usages before removal |
| Index mapping off-by-one errors | Medium | Comprehensive unit tests for all edge cases |

## Parallelization Opportunities

**Safe to parallelize (independent):**
- Task 1 (utilities) + Task 2 (utility tests) - foundational, can be done first
- Task 3 (hook) + Task 4 (hook tests) - can start after utilities or in parallel
- Task 5, 6, 7 (DSL component updates) - independent of each other, can be parallelized

**Must be sequential:**
- Task 1 → Task 3 (utilities needed for hook)
- Tasks 5/6/7 → Task 8 (components must be updated before integration tests)

**Recommended execution order:**

```
Pass 1 (Foundation): Tasks 1-2 → verify tests fail
Pass 2 (Foundation): Task 1 → verify utility tests pass
Pass 3 (Parallel): Task 3 + Task 4 (hook + hook tests)
Pass 4 (Parallel): Tasks 5, 6, 7 (all DSL components)
Pass 5 (Polish): Tasks 8-9 (integration tests + updates)
```

## Execution Strategy

### Pass 1: Tests First (Tasks 2, 4)

Create all failing tests before implementation. Ensures:
- Clear acceptance criteria
- Can verify fixes work
- Documentation of expected behavior

### Pass 2: Foundation (Tasks 1, 3)

Implement core utilities and hook:
- Stepper utility functions (Task 1)
- useSmartStepper hook (Task 3)

### Pass 3: Parallel Integration (Tasks 5, 6, 7)

Update all three DSL SVG components in parallel:
- SixFoldDslV1Svg (Task 5)
- SixFoldDslSvg (Task 6)
- SquareDslSvg (Task 7)

### Pass 4: Polish (Tasks 8, 9)

Final verification and test updates:
- Integration tests (Task 8)
- Update existing tests (Task 9)

## Verification Checklist

Before considering implementation complete:

- [ ] `pnpm test` passes (all tests including new stepper tests)
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Manual verification: SixFold DSL v1 steps through without ghost steps
- [ ] Manual verification: SixFold DSL v0 steps through without ghost steps
- [ ] Manual verification: Square DSL steps through without ghost steps
- [ ] Step counter shows correct visual step count in all DSL components
- [ ] All visual geometry continues to render correctly at each step
- [ ] Non-visual steps still execute (dependencies work)
- [ ] All hardcoded step length constants removed

## Next Steps

1. Human reviews and approves this plan
2. Execute Pass 1: Create failing tests (Tasks 2, 4)
3. Execute Pass 2: Foundation (Tasks 1, 3)
4. Execute Pass 3: Parallel integration (Tasks 5, 6, 7)
5. Execute Pass 4: Polish (Tasks 8, 9)
6. Final verification: All success criteria met
