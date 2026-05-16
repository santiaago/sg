# Implementation Plan: Hide Non-Visual Geometry from GeometryDetails

## Overview

Fix issue where computation-only geometry (vectors, arithmetic expressions) appear in GeometryDetails as empty items (`|`). Implement Option B from SPEC: add `isVisual: boolean` property to GeometryExpression, filter non-visual geometry from store updates in DSL SVG components, and fail early on unknown geometry types in renderer.

## Progress

### Completed
- [x] **Pass 1: Tests** - Created all failing tests (Tasks 15-18)
  - `test/geometry/dsl/expressions.test.ts` - 27 tests
  - `test/geometry/renderers/defaultRenderer.test.ts` - 31 tests
  - `test/geometry/dsl/nonVisualGeometry.test.ts` - 9 tests
  - `test/geometry/dsl/allDslComponents.test.ts` - 7 tests
  - All tests FAIL as expected, documenting current broken behavior
  - Commit: `4239820` - "test(app2): add SPEC, PLAN, and failing tests for non-visual geometry fix"
- [x] **Pass 2: Foundation** - Add isVisual property (Tasks 1-4)
  - GeometryExpression interface has `readonly isVisual: boolean` (default true)
  - Step interface has `isVisual?: boolean`
  - 6 non-visual expressions set to `isVisual = false`
  - 13 visual expressions set to `isVisual = true`
  - Commit: `86776b4` - "feat(app2/geometry): add isVisual property to expressions and Step interface"
- [x] **Pass 3: Parallel** - Propagate to steps + renderer validation (Tasks 5-6, 10-14)
  - GeometryBuilder.compile() propagates isVisual from expressions to steps
  - All 5 DefaultRenderer draw methods throw descriptive errors on missing/wrong types
  - Commit: `bdc3974` - "feat(app2/geometry): propagate isVisual to steps and add renderer type validation"

### In Progress
- [ ] **Pass 4: Filtering** - Update DSL SVG components (Tasks 7-9)

### Not Started
- [ ] Final verification and manual testing

## Architecture Decisions

1. **Approach: Option B** - Add `isVisual: boolean` to GeometryExpression interface (default `true`), override to `false` in non-visual expressions
2. **Propagate to Step** - Add `isVisual?: boolean` to Step interface, set during compile() based on expression's isVisual
3. **Filter mechanism** - DSL SVG components check `step.isVisual !== false` before calling `store.update()`
4. **Early fail** - DefaultRenderer throws descriptive errors for wrong/null geometry types instead of silent returns
5. **Scope** - Apply to ALL DSL components (SquareDslSvg, SixFoldDslSvg, SixFoldDslV1Svg)

## Dependency Graph

```
GeometryExpression interface (add isVisual property)
    │
    ├── All expression implementations (set isVisual)
    │
    └── Step interface (add isVisual property)
            │
            └── GeometryBuilder.compile() (populate isVisual in steps)
                    │
                    ├── buildSixfoldDslV1Steps()
                    ├── buildSixFoldDslSteps()
                    ├── buildSquareDslSteps()
                    │
                    └── DSL SVG components (filter using step.isVisual)
                            │
                            ├── SixFoldDslV1Svg.tsx
                            ├── SixFoldDslSvg.tsx
                            └── SquareDslSvg.tsx

DefaultRenderer (fail early on unknown types)
    │
    └── SVG rendering in all DSL components
```

## Task List

### Phase 1: Foundation - isVisual Property

#### Task 1: Add isVisual to GeometryExpression interface

**Description:** Add `readonly isVisual: boolean` property with default `true` to the GeometryExpression interface. This is the base property all expressions will implement.

**Acceptance criteria:**
- [ ] GeometryExpression interface has `readonly isVisual: boolean` property
- [ ] Default value is `true` (visual by default)
- [ ] TypeScript compiles without errors

**Verification:**
- [ ] Tests pass: `pnpm type-check`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/dsl/expressions/GeometryExpression.ts`

**Estimated scope:** XS

---

#### Task 2: Add isVisual to Step interface

**Description:** Add optional `isVisual?: boolean` property to Step interface. This allows DSL SVG components to check visual status without accessing expressions directly.

**Acceptance criteria:**
- [x] Step interface has `isVisual?: boolean` property
- [x] All existing code using Step interface still compiles

**Verification:**
- [x] Tests pass: `pnpm type-check`
- [x] Build succeeds: `pnpm build`

**Dependencies:** None

**Files touched:**
- `app2/src/types/geometry.ts`

**Commit:** `86776b4`

**Estimated scope:** XS

---

#### Task 3: Set isVisual=false in non-visual expressions

**Description:** Add `readonly isVisual = false` to all non-visual expression classes (those with empty draw functions).

**Non-visual expressions:**
- VectorExpression
- AddExpression
- SubtractExpression
- MultiplyExpression
- DivideExpression
- DistanceExpression

**Acceptance criteria:**
- [ ] VectorExpression has `readonly isVisual = false`
- [ ] AddExpression has `readonly isVisual = false`
- [ ] SubtractExpression has `readonly isVisual = false`
- [ ] MultiplyExpression has `readonly isVisual = false`
- [ ] DivideExpression has `readonly isVisual = false`
- [ ] DistanceExpression has `readonly isVisual = false`
- [ ] TypeScript compiles without errors

**Verification:**
- [ ] Tests pass: `pnpm type-check`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** Task 1

**Files likely touched:**
- `app2/src/geometry/dsl/expressions/operations/VectorExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/AddExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/SubtractExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/MultiplyExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/DivideExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/DistanceExpression.ts`

**Estimated scope:** S

---

#### Task 4: Set isVisual=true in CircleWithDistanceRadiusExpression

**Description:** CircleWithDistanceRadiusExpression has a non-empty draw() but may not have been checked. Verify and ensure it has `readonly isVisual = true`.

**Acceptance criteria:**
- [ ] CircleWithDistanceRadiusExpression has `readonly isVisual = true` (explicit or default)
- [ ] All other visual expressions verified for isVisual

**Verification:**
- [ ] Tests pass: `pnpm type-check`

**Dependencies:** Task 1

**Files likely touched:**
- `app2/src/geometry/dsl/expressions/operations/CircleWithDistanceRadiusExpression.ts`

**Estimated scope:** XS

---

### Checkpoint: Phase 1 Complete

- [ ] All type checks pass (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] GeometryExpression and Step interfaces have isVisual
- [ ] All non-visual expressions have isVisual=false
- [ ] Human review before proceeding

---

### Phase 2: Propagate isVisual to Steps

#### Task 5: Update GeometryBuilder.compile() to include isVisual in steps

**Description:** Modify `GeometryBuilder.compile()` to add `isVisual` from each expression to its compiled Step. This propagates the visual status from expressions to steps.

**Acceptance criteria:**
- [x] Each compiled Step has `isVisual` property set from its expression
- [x] Visual expressions produce steps with `isVisual: true` or undefined (defaults to true)
- [x] Non-visual expressions produce steps with `isVisual: false`

**Verification:**
- [x] Tests pass: `pnpm type-check`
- [x] Build succeeds: `pnpm build`
- [x] Manual check: compiled steps have isVisual property

**Dependencies:** Task 1, Task 2, Task 3

**Files touched:**
- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Commit:** `bdc3974`

**Estimated scope:** S

---

#### Task 6: Update build step functions to pass expressions

**Description:** The current build functions (buildSixfoldDslV1Steps, buildSixFoldDslSteps, buildSquareDslSteps) create a GeometryBuilder, build expressions, call compile(), and return only the steps. We need the isVisual info to flow through. Since we added isVisual to Step in Task 5, the build functions don't need changes - the steps already have isVisual. Verify this works.

**Acceptance criteria:**
- [ ] buildSixfoldDslV1Steps() returns steps with isVisual
- [ ] buildSixFoldDslSteps() returns steps with isVisual
- [ ] buildSquareDslSteps() returns steps with isVisual

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: steps from build functions have isVisual

**Dependencies:** Task 5

**Files likely touched:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (verify only)
- `app2/src/geometry/sixFoldDslSteps.ts` (verify only)
- `app2/src/geometry/squareDslSteps.ts` (verify only)

**Estimated scope:** XS

---

### Checkpoint: Phase 2 Complete

- [ ] isVisual propagates from expressions to steps
- [ ] All build functions return steps with isVisual
- [ ] Type checks pass (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Human review before proceeding

---

### Phase 3: Filter Non-Visual in DSL SVG Components

#### Task 7: Filter non-visual geometry in SixFoldDslV1Svg.tsx

**Description:** Update `SixFoldDslV1Svg.tsx` to only call `store.update()` for geometry from visual steps (isVisual !== false).

**Acceptance criteria:**
- [ ] store.update() only called when step.isVisual !== false
- [ ] Non-visual geometry (vec_cs2_to_cs, p1_x, p1_y, etc.) NOT in store.items
- [ ] Visual geometry (cs, cs2, p1, p2, line1, etc.) still in store.items

**Verification:**
- [ ] Tests pass: `pnpm test -- nonVisualGeometry.test` (after tests created)
- [ ] Build succeeds: `pnpm build`
- [ ] Manual check: GeometryDetails no longer shows non-visual items

**Dependencies:** Task 6

**Files to touch:**
- `app2/src/components/SixFoldDslV1Svg.tsx`

**Estimated scope:** S

**Status:** TODO - Next in Pass 4

---

#### Task 8: Filter non-visual geometry in SixFoldDslSvg.tsx

**Description:** Apply same fix as Task 7 to SixFoldDslSvg.tsx.

**Acceptance criteria:**
- [ ] store.update() only called when step.isVisual !== false
- [ ] Non-visual geometry NOT in store.items
- [ ] Visual geometry still in store.items

**Verification:**
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** Task 6, Task 7

**Files to touch:**
- `app2/src/components/SixFoldDslSvg.tsx`

**Estimated scope:** S

**Status:** TODO - Next in Pass 4

---

#### Task 9: Filter non-visual geometry in SquareDslSvg.tsx

**Description:** Apply same fix as Task 7 to SquareDslSvg.tsx.

**Acceptance criteria:**
- [ ] store.update() only called when step.isVisual !== false
- [ ] Non-visual geometry NOT in store.items
- [ ] Visual geometry still in store.items

**Verification:**
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`

**Dependencies:** Task 6, Task 7

**Files to touch:**
- `app2/src/components/SquareDslSvg.tsx`

**Estimated scope:** S

**Status:** TODO - Next in Pass 4

**Estimated scope:** S

---

### Checkpoint: Phase 3 Complete

- [ ] All DSL SVG components filter non-visual geometry
- [ ] GeometryDetails no longer shows non-visual items
- [ ] Visual geometry still renders and displays correctly
- [ ] Type checks pass (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Human review before proceeding

---

### Phase 4: Fail Early on Unknown Types

#### Task 10: Add type validation to DefaultRenderer.drawPoint()

**Description:** Replace silent `return` with loud `throw` when geometry is missing or wrong type in drawPoint().

**Acceptance criteria:**
- [ ] Throws error if geometry not found: `drawPoint: geometry '{id}' not found in values`
- [ ] Throws error if wrong type: `drawPoint: geometry '{id}' is {actual}, expected point`

**Verification:**
- [ ] Tests pass: `pnpm test -- defaultRenderer.test` (after tests created)
- [ ] Build succeeds: `pnpm build`

**Dependencies:** None (can be done in parallel with other phases)

**Files likely touched:**
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** XS

---

#### Task 11: Add type validation to DefaultRenderer.drawLine()

**Description:** Same as Task 10 for drawLine().

**Acceptance criteria:**
- [ ] Throws error if geometry not found
- [ ] Throws error if wrong type (expected line)

**Verification:**
- [ ] Tests pass: `pnpm test -- defaultRenderer.test`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** XS

---

#### Task 12: Add type validation to DefaultRenderer.drawCircle()

**Description:** Same as Task 10 for drawCircle().

**Acceptance criteria:**
- [ ] Throws error if geometry not found
- [ ] Throws error if wrong type (expected circle)

**Verification:**
- [ ] Tests pass: `pnpm test -- defaultRenderer.test`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** XS

---

#### Task 13: Add type validation to DefaultRenderer.drawPolygon()

**Description:** Same as Task 10 for drawPolygon().

**Acceptance criteria:**
- [ ] Throws error if geometry not found
- [ ] Throws error if wrong type (expected polygon)

**Verification:**
- [ ] Tests pass: `pnpm test -- defaultRenderer.test`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** XS

---

#### Task 14: Add type validation to DefaultRenderer.drawCoordinateSystem()

**Description:** Same as Task 10 for drawCoordinateSystem().

**Acceptance criteria:**
- [ ] Throws error if geometry not found
- [ ] Throws error if wrong type (expected coordinate_system)

**Verification:**
- [ ] Tests pass: `pnpm test -- defaultRenderer.test`

**Dependencies:** None

**Files likely touched:**
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** XS

---

### Checkpoint: Phase 4 Complete

- [ ] All renderer draw methods validate types and throw descriptive errors
- [ ] No silent failures on wrong/missing geometry
- [ ] Type checks pass (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Human review before proceeding

---

### Phase 5: Tests

#### Task 15: Create failing tests for isVisual property

**Description:** Create test file `tests/geometry/dsl/expressions.test.ts` with tests that FAIL on current code (isVisual property doesn't exist yet) and PASS after implementation.

**Acceptance criteria:**
- [ ] Tests document current broken behavior
- [ ] Tests verify isVisual property exists on all expressions
- [ ] Tests verify correct values (false for non-visual, true for visual)
- [ ] Tests FAIL before implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- expressions.test`

**Dependencies:** None (can be created before any implementation)

**Files likely touched:**
- `app2/tests/geometry/dsl/expressions.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 16: Create failing tests for DefaultRenderer type validation

**Description:** Create test file `tests/geometry/renderers/defaultRenderer.test.ts` with tests that FAIL on current code (silent returns) and PASS after implementation (throws errors).

**Acceptance criteria:**
- [ ] Tests document current silent failure behavior
- [ ] Tests verify loud failures on wrong/missing types
- [ ] Tests FAIL before implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- defaultRenderer.test`

**Dependencies:** None

**Files likely touched:**
- `app2/tests/geometry/renderers/defaultRenderer.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 17: Create failing tests for non-visual geometry filtering

**Description:** Create test file `tests/geometry/dsl/nonVisualGeometry.test.ts` with tests that FAIL on current code (non-visual in store) and PASS after implementation (non-visual not in store).

**Acceptance criteria:**
- [ ] Tests document current broken behavior
- [ ] Tests verify non-visual geometry not in store.items
- [ ] Tests verify visual geometry still in store.items
- [ ] Tests FAIL before implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- nonVisualGeometry.test`

**Dependencies:** None

**Files likely touched:**
- `app2/tests/geometry/dsl/nonVisualGeometry.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 18: Create integration test for all DSL components

**Description:** Create test file `tests/geometry/dsl/allDslComponents.test.ts` verifying all DSL SVG components filter non-visual geometry.

**Acceptance criteria:**
- [ ] Tests verify SixFoldDslV1Svg filters correctly
- [ ] Tests verify SixFoldDslSvg filters correctly
- [ ] Tests verify SquareDslSvg filters correctly
- [ ] Tests FAIL before implementation

**Verification:**
- [ ] Tests fail: `pnpm test -- allDslComponents.test`

**Dependencies:** None

**Files likely touched:**
- `app2/tests/geometry/dsl/allDslComponents.test.ts` (NEW)

**Estimated scope:** S

---

### Checkpoint: All Tests Created

- [ ] All test files created
- [ ] All tests FAIL on current code (documenting broken behavior)
- [ ] Human review of tests before implementation

---

## Parallelization Opportunities

**Safe to parallelize (independent):**
- Task 15, 16, 17, 18 (all test creation - can be done first, before any implementation)
- Task 10, 11, 12, 13, 14 (all renderer type validation - independent of other phases)

**Must be sequential:**
- Task 1 → Task 3, 4 → Task 5 → Task 6 → Task 7, 8, 9 (foundation before usage)

**Recommended execution order:**
1. **First:** Create all failing tests (Tasks 15-18) - verify they fail
2. **Parallel group A:** Phase 1 (Tasks 1-4) - foundation
3. **Parallel group B:** Phase 4 (Tasks 10-14) - renderer validation
4. **Sequential:** Phase 2 (Task 5-6) + Phase 3 (Tasks 7-9) - filtering

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing DSL usage | High | Ensure isVisual defaults to true, all visual expressions work unchanged |
| Missing a non-visual expression | Medium | Audit all expression classes, add isVisual=false to any with empty draw() |
| Type errors in renderer | Medium | Test each draw method with wrong types before implementation |
| DSL SVG components not updated consistently | Medium | Apply same pattern to all three components, verify with integration tests |
| Performance impact of isVisual checks | Low | Boolean check is negligible |

## Execution Strategy

### Pass 1: Tests First (Tasks 15-18)
Create all failing tests before any implementation. This ensures:
- We document current broken behavior
- We have clear acceptance criteria
- We can verify fixes work

### Pass 2: Foundation (Tasks 1-4)
Add the `isVisual` property infrastructure:
- Interface changes
- Non-visual expressions marked

### Pass 3: Parallel - Renderer + Steps (Tasks 5-6, 10-14)
- Propagate isVisual to steps
- Add type validation to renderer

### Pass 4: Filtering (Tasks 7-9)
Update all DSL SVG components to filter using isVisual

### Final: Verification
- All tests pass
- All type checks pass
- Manual verification in browser

## Verification Checklist

Before considering implementation complete:

- [ ] `pnpm test` passes (all tests)
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] SixFold DSL v1 renders correctly in browser
- [ ] SixFold DSL v0 renders correctly in browser
- [ ] Square DSL renders correctly in browser
- [ ] GeometryDetails no longer shows `vec_cs2_to_cs`, `p1_x`, `p1_y`, etc.
- [ ] Unknown geometry types throw descriptive errors
- [ ] All visual geometry continues to work

## Next Steps

1. Human reviews and approves this plan
2. Execute Pass 1: Create failing tests (Tasks 15-18)
3. Execute Pass 2: Foundation (Tasks 1-4)
4. Execute Pass 3: Parallel work (Tasks 5-6, 10-14)
5. Execute Pass 4: Filtering (Tasks 7-9)
6. Final verification

5. Execute Pass 4: Filtering (Tasks 7-9)
6. Final verification
verification
