# Implementation Plan: Current Step Geometry Green Highlight

## Overview

Implement visual feedback showing geometry created in the current step as green. Highlight persists until user navigates to next/previous step. Applies to all geometry types: point, line, circle, polygon, coordinate_system.

Based on: `backlog/SPEC-current-step-green-highlight.md`

## Architecture Decisions

- **Post-draw highlighting**: Apply green color after step execution completes, not during draw. Cleaner than modifying all draw function signatures.
- **Use existing `stepId`**: Leverage `GeometryItem.stepId` field (react-store.ts:29). No schema changes needed.
- **Shared helper**: Add `applyCurrentStepHighlight` to geometryHighlighting.ts for reuse across all SVG components.
- **Theme extension**: Add `COLOR_CURRENT_STEP` to Theme interface for consistency with existing highlight colors.

## Dependency Graph

```
Repo Root
└── app2/
    └── src/
        ├── themes.ts                 # Foundation: define COLOR_CURRENT_STEP
        │
        └── utils/
            └── geometryHighlighting.ts  # Depends on: themes.ts
                    │                      # Provides: applyCurrentStepHighlight()
                    │
                    ├── components/SquareSvg.tsx          # Depends on: geometryHighlighting.ts
                    ├── components/SixFoldV0Svg.tsx       # Depends on: geometryHighlighting.ts
                    ├── components/RotatedSquareSvg.tsx   # Depends on: geometryHighlighting.ts
                    ├── components/SquareDslSvg.tsx        # Depends on: geometryHighlighting.ts
                    ├── components/SixFoldDslSvg.tsx       # Depends on: geometryHighlighting.ts
                    └── components/SixFoldDslV1Svg.tsx    # Depends on: geometryHighlighting.ts
```

Implementation order: themes.ts → geometryHighlighting.ts → all SVG components (parallelizable).

## Task List

### Phase 1: Foundation

#### Task 1: Add COLOR_CURRENT_STEP to Theme Interface

**Description:** Extend Theme interface and both theme objects with new green highlight color constant, following existing pattern (COLOR_INPUT_HIGHLIGHT, COLOR_SELECTED).

**Acceptance criteria:**
- [ ] `Theme` interface has `COLOR_CURRENT_STEP: string`
- [ ] `lightTheme.COLOR_CURRENT_STEP = "#00ff00"`
- [ ] `darkTheme.COLOR_CURRENT_STEP = "#00ff00"`
- [ ] TypeScript compilation succeeds

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] No build errors

**Dependencies:** None

**Files touched:**
- `app2/src/themes.ts`

**Scope:** XS (1 file, ~5 lines)

---

#### Task 2: Add applyCurrentStepHighlight Helper Function

**Description:** Create helper function in geometryHighlighting.ts that iterates store items and applies green color to geometries matching current step ID. Handles all geometry types including coordinate_system with arrow markers.

**Acceptance criteria:**
- [ ] Function signature: `applyCurrentStepHighlight(svg: SVGSVGElement, store: GeometryStore, currentStepId: string, theme: Theme): void`
- [ ] Handles point: sets fill to COLOR_CURRENT_STEP
- [ ] Handles line, circle, polygon: sets stroke to COLOR_CURRENT_STEP
- [ ] Handles coordinate_system: applies to child arrows via `applyToCsArrows`, updates arrowhead marker via `updateArrowheadMarkerColor`
- [ ] Only processes items where `item.element && item.stepId === currentStepId`
- [ ] TypeScript compilation succeeds

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Function imports correctly in test file

**Dependencies:** Task 1 (COLOR_CURRENT_STEP must exist in Theme)

**Files touched:**
- `app2/src/utils/geometryHighlighting.ts`

**Scope:** S (1 file, ~30 lines)

---

### Checkpoint: Foundation Complete

- [ ] Task 1 complete: Theme extended
- [ ] Task 2 complete: Helper function added
- [ ] Type-check passes: `pnpm type-check:app2`
- [ ] All existing tests still pass
- [ ] Ready for SVG component updates

---

### Phase 2: SVG Components (Parallelizable)

All 6 tasks are independent. Can be executed in parallel or sequentially.

#### Task 3: Update SquareSvg Component

**Description:** In SquareSvg.tsx, after step execution and store update, compute currentStepId and call applyCurrentStepHighlight to color current step geometries green.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? SQUARE_STEPS[currentStep - 1].id : ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting
- [ ] Works for all geometry types in SQUARE_STEPS

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: Square construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/SquareSvg.tsx`

**Scope:** S (1 file, ~10 lines)

---

#### Task 4: Update SixFoldV0Svg Component

**Description:** Same pattern as Task 3, applied to SixFoldV0Svg.tsx.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? SIX_FOLD_V0_STEPS[currentStep - 1].id : ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: SixFold V0 construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/SixFoldV0Svg.tsx`

**Scope:** S (1 file, ~10 lines)

---

#### Task 5: Update RotatedSquareSvg Component

**Description:** Same pattern as Task 3, applied to RotatedSquareSvg.tsx.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? ROTATED_SQUARE_STEPS[currentStep - 1].id : ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: Rotated square construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/RotatedSquareSvg.tsx`

**Scope:** S (1 file, ~10 lines)

---

#### Task 6: Update SquareDslSvg Component

**Description:** Same pattern as Task 3, applied to SquareDslSvg.tsx.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? squareDslSteps[currentStep - 1]?.id ?? ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting
- [ ] Handle undefined step gracefully (DSL steps may be dynamic)

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: DSL square construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/SquareDslSvg.tsx`

**Scope:** S (1 file, ~10 lines)

---

#### Task 7: Update SixFoldDslSvg Component

**Description:** Same pattern as Task 3, applied to SixFoldDslSvg.tsx.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? sixfoldDslSteps[currentStep - 1]?.id ?? ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: DSL sixfold construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/SixFoldDslSvg.tsx`

**Scope:** S (1 file, ~10 lines)

---

#### Task 8: Update SixFoldDslV1Svg Component

**Description:** Same pattern as Task 3, applied to SixFoldDslV1Svg.tsx.

**Acceptance criteria:**
- [ ] Compute `currentStepId = currentStep > 0 ? sixfoldDslV1Steps[currentStep - 1]?.id ?? ""`
- [ ] Call `applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme)` after store updates
- [ ] Import `applyCurrentStepHighlight` from geometryHighlighting

**Verification:**
- [ ] Type-check: `pnpm type-check:app2`
- [ ] Manual: DSL sixfold v1 construction shows green for current step

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/components/SixFoldDslV1Svg.tsx`

**Scope:** S (1 file, ~10 lines)

---

### Checkpoint: Core Feature Complete

- [ ] Tasks 3-8 complete: All SVG components updated
- [ ] Type-check passes: `pnpm type-check:app2`
- [ ] All existing tests pass: `pnpm test`
- [ ] Manual verification: Each construction type shows green for current step
- [ ] Green highlight persists until next/prev clicked
- [ ] Green correctly moves to new step on navigation

---

### Phase 3: Tests

#### Task 9: Unit Tests for applyCurrentStepHighlight

**Description:** Add unit tests for the new helper function, covering all geometry types.

**Acceptance criteria:**
- [ ] Test applies green fill to point geometries with matching stepId
- [ ] Test applies green stroke to line, circle, polygon geometries with matching stepId
- [ ] Test handles coordinate_system: applies green to child arrows
- [ ] Test does not modify geometries with non-matching stepId
- [ ] Test handles null/undefined element gracefully

**Verification:**
- [ ] Tests pass: `pnpm test -- geometryHighlighting`
- [ ] Coverage includes all branches in applyCurrentStepHighlight

**Dependencies:** Task 1, Task 2

**Files touched:**
- `app2/src/utils/geometryHighlighting.test.ts` (new file or existing)

**Scope:** S (1 file, ~40 lines)

---

#### Task 10: Integration Tests for SVG Components

**Description:** Add integration tests verifying green highlight appears on current step geometry in at least one SVG component (e.g., SquareSvg).

**Acceptance criteria:**
- [ ] Test verifies geometry from step N has green color when currentStep = N+1
- [ ] Test verifies geometry from step N-1 does NOT have green color when currentStep = N+1
- [ ] Test verifies color changes when currentStep changes

**Verification:**
- [ ] Tests pass: `pnpm test`

**Dependencies:** Task 3 (or any SVG component task), Task 9

**Files touched:**
- `app2/src/components/SquareSvg.test.tsx` (new file)

**Scope:** M (1-2 files, ~50 lines)

---

### Checkpoint: Tests Complete

- [ ] Task 9 complete: Unit tests for helper function
- [ ] Task 10 complete: Integration tests for SVG component
- [ ] All tests pass: `pnpm test`
- [ ] Type-check passes: `pnpm type-check:app2`
- [ ] Format clean: `pnpm format:fix` (if needed)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Color conflict with existing highlights | Medium | Test that selection (red) and input highlight (orange) override green. Document precedence in spec. |
| DSL steps have undefined IDs | Low | Use optional chaining (`?.id`) and fallback to empty string. Verify in manual testing. |
| Performance: iterating store on every step | Low | Store typically <50 items. Negligible overhead. |
| SVG element recreation timing | Medium | Post-draw approach ensures elements exist before highlighting. Verify in tests. |

## Parallelization Opportunities

| Task Group | Can Parallelize? | Notes |
|------------|-----------------|-------|
| Tasks 3-8 (SVG components) | **Yes** | All 6 components independent. Same pattern, different files. |
| Task 9-10 (tests) | **Yes** | Test tasks independent of each other. Run after foundation (Tasks 1-2). |
| Task 1-2 (foundation) | **No** | Sequential: Task 2 depends on Task 1. |

**Suggested parallel execution:**
- Session A: Task 1 → Task 2 → Task 9
- Session B: Tasks 3-8 (all in parallel)
- Session C: Task 10

## Success Criteria (From Spec)

All criteria from `SPEC-current-step-green-highlight.md` must be met:

1. **Theme Extension**: `Theme` interface includes `COLOR_CURRENT_STEP: string` with value `#00ff00`
2. **Step Tracking**: Each `GeometryItem` in store has accurate `stepId` matching its creating step
3. **Color Application**: Geometry with `stepId` matching current step renders with `COLOR_CURRENT_STEP`
4. **Color Reversion**: Geometry from other steps renders with theme default colors
5. **Instant Update**: Color changes immediately when next/prev step clicked
6. **All Types**: Works for point, line, circle, polygon, coordinate_system
7. **No Regressions**: All existing tests pass
8. **Type Safety**: No `any` types, TypeScript compilation succeeds
