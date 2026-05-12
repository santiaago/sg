# Implementation Plan: SixFold v0 Declarative DSL

## Overview

This plan implements the SixFold v0 Declarative DSL as specified in `SPEC-sixfold-dsl.md`.
The DSL will replicate the 94-step geometric construction from `app2/src/geometry/sixFoldV0Steps.ts`
using the existing Geometry DSL framework, preserving exact geometry order and construction methods.

**Spec**: `backlog/dsl/SPEC-sixfold-dsl.md`
**Reference Implementation**: `app2/src/geometry/squareDslSteps.ts`
**Manual Steps**: `app2/src/geometry/sixFoldV0Steps.ts` (94 steps, 2275 lines)
**Target**: `app2/src/geometry/sixfoldDslSteps.ts`

---

## Progress Summary

| Phase                        | Status      | Tasks | Files   |
| ---------------------------- | ----------- | ----- | ------- |
| Phase 1: Framework Extension | ✅ COMPLETE | 1-4   | 5 files |
| Phase 2: DSL Steps           | ⏳ PENDING  | 5-15  | 1 file  |
| Phase 3: Testing             | ⏳ PENDING  | 16-20 | 1 file  |

**Phase 1 Deliverables:**

- `BisectCircleAndPointExpression` class added to DSL framework
- `builder.bisectCircleAndPoint()` method available
- All exports configured
- All checks pass (type-check, lint, format)

---

## Architecture Decisions

1. **Framework Extension First**: Add `BisectCircleAndPointExpression` to DSL framework before implementing steps
2. **Order Preservation**: Create geometry expressions in exact same order as `sixFoldV0Steps.ts`
3. **Direction Constants**: Use `directions` from `@sg/geometry` (numeric: up=0, down=1, left=2, right=3)
4. **Mapping Strategy**: Map manual helper functions to DSL expressions as follows:
   - `interceptCircleLineDirHelper(c, l, directions.left)` → `builder.intersection(id, c, l, { position: directions.left })`
   - `circlesIntersectionPointHelper(c1, c2, directions.up)` → `builder.circleIntersection(id, c1, c2, { select: directions.up })`
   - `interceptCircleLineSegHelper(c, l, 0)` → `builder.intersection(id, c, l)` (default: first intersection)
   - `interceptCircleLineSegHelper(c, l, 1)` → `builder.intersection(id, c, l, { position: directions.right })` (second intersection)
   - `bisectCircleAndPoint(c, p)` → `builder.bisectCircleAndPoint(id, c, p)` (NEW)
5. **No Framework Breaking Changes**: All additions are additive; no existing DSL code modified

---

## Dependency Graph

```
Phase 1: Framework Extension
    │
    └── BisectCircleAndPointExpression
            │
            ├── File: dsl/expressions/operations/BisectCircleAndPointExpression.ts (NEW)
            ├── Export: dsl/expressions/operations/index.ts (MODIFY)
            ├── Builder method: GeometryBuilder.ts (MODIFY)
            └── Feature accessors: types.ts (MODIFY - add BisectCircleAndPoint to types if needed)

Phase 2: DSL Steps Implementation
    │
    ├── sixfoldDslSteps.ts (NEW)
    │       │
    │       ├── Import: GeometryBuilder from dsl/GeometryBuilder
    │       ├── Import: DefaultGeometryRenderer from dsl/renderers/DefaultRenderer
    │       ├── Import: SixFoldV0Config, GEOM, CUT_LINE_BY from sixFold/operations
    │       ├── Import: directions from @sg/geometry
    │       └── Export: buildSixfoldDslSteps(), DSL_SIXFOLD_STEPS_LENGTH
    │
Phase 3: Testing
    │
    └── sixfold-construction-equivalence.test.ts (NEW)
            │
            ├── Verify: Geometry ID order matches sixFoldV0Steps.ts
            ├── Verify: All geometry values match within tolerance
            ├── Verify: Dependency graphs match
            └── Verify: Step count = 94
```

---

## Task List

### Phase 1: Framework Extension - BisectCircleAndPointExpression

#### Task 1: Create BisectCircleAndPointExpression

**Description**: Create the expression class for the `bisectCircleAndPoint` operation.
This expression computes a point by bisecting a circle through a given point, matching the
behavior of `bisectCircleAndPoint` from `app2/src/geometry/constructors.ts`.

**Acceptance criteria:**

- [ ] `BisectCircleAndPointExpression<TConfig>` class implements `GeometryExpression<TConfig, "point">`
- [ ] Constructor accepts `id: string`, `circle: CircleLikeExpression<TConfig>`, `point: PointLikeExpression<TConfig>`
- [ ] `dependencies` array contains `[circle.id, point.id]`
- [ ] `parameters` array is empty
- [ ] `compile()` method uses `bisectCircleAndPoint` from constructors
- [ ] Returns `Step<TConfig>` with correct `inputs`, `outputs`, `parameters`, `compute`, `draw`
- [ ] No `any` types used

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] No lint errors
- [ ] File passes format check

**Dependencies:** None

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/BisectCircleAndPointExpression.ts` (NEW)

**Estimated scope:** S

---

#### Task 2: Export BisectCircleAndPointExpression from operations index

**Description**: Add the new expression to the operations module exports.

**Acceptance criteria:**

- [ ] `BisectCircleAndPointExpression` exported from `app2/src/geometry/dsl/expressions/operations/index.ts`
- [ ] Export follows existing pattern (type + class export)

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Import works: `import { BisectCircleAndPointExpression } from ".../operations"`

**Dependencies:** Task 1

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/index.ts` (MODIFY)

**Estimated scope:** XS

---

#### Task 3: Add bisectCircleAndPoint factory method to GeometryBuilder

**Description**: Add a factory method to `GeometryBuilder` that creates `BisectCircleAndPointExpression` instances.

**Acceptance criteria:**

- [ ] Method signature: `bisectCircleAndPoint(id: string, circle: CircleLikeExpression<TConfig>, point: PointLikeExpression<TConfig>): BisectCircleAndPointExpression<TConfig>`
- [ ] Expression registered in `this.expressions` map
- [ ] Returns the created expression for chaining
- [ ] JSDoc comment added
- [ ] No `any` types used

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] No lint errors

**Dependencies:** Task 1, Task 2

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts` (MODIFY)

**Estimated scope:** XS

---

#### Task 4: Add BisectCircleAndPointExpression to dsl index exports

**Description**: Ensure the new expression type is available from the main DSL module.

**Acceptance criteria:**

- [ ] `BisectCircleAndPointExpression` exported from `app2/src/geometry/dsl/index.ts` (if needed for type access)

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 1, Task 2, Task 3

**Files likely touched:**

- `app2/src/geometry/dsl/index.ts` (MODIFY if needed)

**Estimated scope:** XS

---

### Checkpoint: Framework Extension Complete ✅

- [x] All Phase 1 tasks complete (Tasks 1-4)
- [x] `pnpm type-check:app2` passes
- [x] `pnpm lint` passes
- [x] `pnpm format` passes
- [x] `builder.bisectCircleAndPoint()` is available and working
- [ ] Review with human before proceeding to Phase 2

---

### Phase 2: DSL Steps Implementation

#### Task 5: Create sixfoldDslSteps.ts with imports and boilerplate

**Description**: Create the target file with imports, JSDoc, and function signature matching `squareDslSteps.ts` pattern.

**Acceptance criteria:**

- [ ] File created at `app2/src/geometry/sixfoldDslSteps.ts`
- [ ] Exports: `buildSixfoldDslSteps(): Step<SixFoldV0Config>[]`
- [ ] Exports: `DSL_SIXFOLD_STEPS_LENGTH: number`
- [ ] Imports: `GeometryBuilder` from `./dsl/GeometryBuilder`
- [ ] Imports: `DefaultGeometryRenderer` from `./dsl/renderers/DefaultRenderer`
- [ ] Imports: `SixFoldV0Config`, `GEOM`, `CUT_LINE_BY` from `./sixFold/operations`
- [ ] Imports: `directions` from `@sg/geometry`
- [ ] Imports: `type Step` from `@/types/geometry`
- [ ] JSDoc comments for all exports

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] No import errors

**Dependencies:** Phase 1 complete

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (NEW)

**Estimated scope:** XS

---

#### Task 6: Implement Steps 0-4 (Coordinate System, P1, P2, LINE1, CP1)

**Description**: Translate first 5 manual steps to DSL expressions, preserving exact order.

**Reference (from sixFoldV0Steps.ts):**

- STEP_0: Coordinate system at (0,0) with arrowLength = height / 24
- STEP_1: Point P1 in CS with config p1x, p1y
- STEP_2: Point P2 in CS with config p2x, p2y
- STEP_3: Line LINE1 from P1 to P2
- STEP_4: Point CP1 on LINE1 at cp1OffsetRatio

**Acceptance criteria:**

- [ ] `cs = builder.coordinateSystem("cs", 0, 0, builder.param("height") / 24, 0)` - NOTE: Need to check if division is supported
- [ ] `p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"))`
- [ ] `p2 = builder.pointInCs("p2", cs, builder.param("p2x"), builder.param("p2y"))`
- [ ] `line1 = builder.line("line1", p1, p2)`
- [ ] `cp1 = builder.pointAt("cp1", line1, builder.param("cp1OffsetRatio"))`
- [ ] Geometry IDs in order: cs, p1, p2, line1, cp1

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Compiled steps have correct IDs

**Dependencies:** Task 5

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

**Note**: Need to verify if parameter arithmetic (division) is supported in DSL. If not, use `computeSingle` pattern or pass pre-computed value.

---

#### Task 7: Implement Steps 5-9 (C1, CP2, C2, PIC12, CPIC12)

**Reference:**

- STEP_5: Circle C1 at CP1 with config radius
- STEP_6: Point CP2 = interceptCircleLineDirHelper(C1, LINE1, directions.left)
- STEP_7: Circle C2 at CP2 with config radius
- STEP_8: Point PIC12 = circlesIntersectionPointHelper(C1, C2, directions.up)
- STEP_9: Circle CPIC12 at PIC12 with config radius

**Acceptance criteria:**

- [ ] `c1 = builder.circle("c1", cp1, builder.param("radius"))`
- [ ] `cp2 = builder.intersection("cp2", c1, line1, { position: directions.left })`
- [ ] `c2 = builder.circle("c2", cp2, builder.param("radius"))`
- [ ] `pic12 = builder.circleIntersection("pic12", c1, c2, { select: directions.up })`
- [ ] `cPic12 = builder.circle("cPic12", pic12, builder.param("radius"))`
- [ ] Geometry IDs in order: c1, cp2, c2, pic12, cPic12

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 6

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 8: Implement Steps 10-11 (P3, P4) - First bisectCircleAndPoint usage

**Reference:**

- STEP_10: Point P3 = bisectCircleAndPoint(CPIC12, CP2)
- STEP_11: Point P4 = bisectCircleAndPoint(CPIC12, CP1)

**Acceptance criteria:**

- [ ] `p3 = builder.bisectCircleAndPoint("p3", cPic12, cp2)`
- [ ] `p4 = builder.bisectCircleAndPoint("p4", cPic12, cp1)`
- [ ] Geometry IDs in order: p3, p4

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Uses new BisectCircleAndPointExpression

**Dependencies:** Task 7, Phase 1 complete

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 9: Implement Steps 12-16 (L13, L24, CP4, CP3, C4)

**Reference:**

- STEP_12: Line L13 from CP1 to P3
- STEP_13: Line L24 from CP2 to P4
- STEP_14: Point CP4 = interceptCircleLineSegHelper(C1, L13, 0)
- STEP_15: Point CP3 = interceptCircleLineSegHelper(C2, L24, 0)
- STEP_16: Circle C4 at CP4 with config radius

**Acceptance criteria:**

- [ ] `l13 = builder.line("l13", cp1, p3)`
- [ ] `l24 = builder.line("l24", cp2, p4)`
- [ ] `cp4 = builder.intersection("cp4", c1, l13)` (index 0 = default first)
- [ ] `cp3 = builder.intersection("cp3", c2, l24)` (index 0 = default first)
- [ ] `c4 = builder.circle("c4", cp4, builder.param("radius"))`
- [ ] Geometry IDs in order: l13, l24, cp4, cp3, c4

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 8

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 10: Implement Steps 17-22 (C3, PIC14, LPIC12, LPIC14, L12, L34)

**Reference:**

- STEP_17: Circle C3 at CP3 with config radius
- STEP_18: Point PIC14 = circlesIntersectionPointHelper(C3, C4, directions.left)
- STEP_19: Line LPIC12 from PIC12 to CP1
- STEP_20: Line LPIC14 from PIC12 to PIC14
- STEP_21: Line L12 from CP1 to CP2
- STEP_22: Line L34 from CP3 to CP4

**Acceptance criteria:**

- [ ] `c3 = builder.circle("c3", cp3, builder.param("radius"))`
- [ ] `pic14 = builder.circleIntersection("pic14", c3, c4, { select: directions.left })`
- [ ] `lPic12 = builder.line("lpic12", pic12, cp1)`
- [ ] `lPic14 = builder.line("lpic14", pic12, pic14)`
- [ ] `l12 = builder.line("l12", cp1, cp2)`
- [ ] `l34 = builder.line("l34", cp3, cp4)`
- [ ] Geometry IDs in order: c3, pic14, lpic12, lpic14, l12, l34

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 9

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 11: Implement Steps 23-27 (L23, L41, PI2, C1_D1, C2_D1)

**Reference (need to verify exact steps from source):**

- STEP_23: Line L23
- STEP_24: Line L41
- STEP_25: Point PI2
- STEP_26: Circle C1_D1
- STEP_27: Circle C2_D1

**Acceptance criteria:**

- [ ] Translate each step to equivalent DSL expression
- [ ] Geometry IDs in exact order: l23, l41, pi2, c1_d1, c2_d1
- [ ] All expressions compile without errors

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 10

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 12: Continue through Step 50

**Description**: Continue translating Steps 28-50 from manual to DSL.
Approximately 23 steps covering various intersections and circles.

**Acceptance criteria:**

- [ ] All steps 28-50 translated to DSL
- [ ] Geometry IDs in exact order
- [ ] Correct DSL expression types used

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 11

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** M

---

#### Task 13: Continue through Step 75

**Description**: Translate Steps 51-75 from manual to DSL.
Approximately 25 steps.

**Acceptance criteria:**

- [ ] All steps 51-75 translated to DSL
- [ ] Geometry IDs in exact order

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 12

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** M

---

#### Task 14: Continue through Step 94

**Description**: Translate remaining Steps 76-94 from manual to DSL.
Approximately 19 steps including final outline polygons.

**Acceptance criteria:**

- [ ] All steps 76-94 translated to DSL
- [ ] Final outline polygons created with `builder.polygon()`
- [ ] Geometry IDs in exact order

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] `builder.compile()` returns array

**Dependencies:** Task 13

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** M

---

#### Task 15: Export DSL_SIXFOLD_STEPS_LENGTH constant

**Description**: Add the constant export for step count.

**Acceptance criteria:**

- [ ] `export const DSL_SIXFOLD_STEPS_LENGTH = 94;` added
- [ ] Matches manual step count

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 14

**Files likely touched:**

- `app2/src/geometry/sixfoldDslSteps.ts` (MODIFY)

**Estimated scope:** XS

---

### Checkpoint: DSL Steps Implementation Complete

- [ ] All 94 steps translated to DSL
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Review with human before proceeding to Phase 3

---

### Phase 3: Testing

#### Task 16: Create equivalence test file

**Description**: Create test file to verify DSL produces identical results to manual implementation.

**Acceptance criteria:**

- [ ] Test file created at `app2/test/sixfold-construction-equivalence.test.ts`
- [ ] Imports both `sixFoldV0Steps.ts` and `sixfoldDslSteps.ts`
- [ ] Uses same test config for both

**Verification:**

- [ ] Test file compiles

**Dependencies:** Phase 2 complete

**Files likely touched:**

- `app2/test/sixfold-construction-equivalence.test.ts` (NEW)

**Estimated scope:** S

---

#### Task 17: Implement geometry order verification test

**Description**: Verify that geometry IDs appear in the same order in DSL as in manual steps.

**Acceptance criteria:**

- [ ] Test extracts geometry IDs from manual steps
- [ ] Test extracts geometry IDs from DSL steps
- [ ] Asserts arrays are equal

**Verification:**

- [ ] Test passes

**Dependencies:** Task 16

**Files likely touched:**

- `app2/test/sixfold-construction-equivalence.test.ts` (MODIFY)

**Estimated scope:** S

---

#### Task 18: Implement geometry value equivalence test

**Description**: Execute both step sets with same config and compare all geometry values.

**Acceptance criteria:**

- [ ] Both step arrays executed with same `SixFoldV0Config`
- [ ] All geometry values compared at each step
- [ ] Values match within floating point tolerance (using `approx` from `@sg/geometry`)
- [ ] Reports which geometry differs if any mismatch

**Verification:**

- [ ] Test passes with all geometry matching

**Dependencies:** Task 17

**Files likely touched:**

- `app2/test/sixfold-construction-equivalence.test.ts` (MODIFY)

**Estimated scope:** M

---

#### Task 19: Implement dependency graph verification test

**Description**: Verify that dependency graphs match between manual and DSL implementations.

**Acceptance criteria:**

- [ ] Test builds dependency graph from manual steps (inputs/outputs)
- [ ] Test builds dependency graph from DSL steps (inputs/outputs)
- [ ] Asserts graphs are structurally equivalent

**Verification:**

- [ ] Test passes

**Dependencies:** Task 18

**Files likely touched:**

- `app2/test/sixfold-construction-equivalence.test.ts` (MODIFY)

**Estimated scope:** M

---

#### Task 20: Implement step count verification

**Description**: Verify DSL produces same number of steps as manual (94).

**Acceptance criteria:**

- [ ] Assert `buildSixfoldDslSteps().length === DSL_SIXFOLD_STEPS_LENGTH`
- [ ] Assert `DSL_SIXFOLD_STEPS_LENGTH === 94`

**Verification:**

- [ ] Test passes

**Dependencies:** Task 19

**Files likely touched:**

- `app2/test/sixfold-construction-equivalence.test.ts` (MODIFY)

**Estimated scope:** XS

---

### Checkpoint: Testing Complete

- [ ] All tests pass
- [ ] `pnpm test` exits with code 0
- [ ] No test warnings
- [ ] Review with human

---

## File Summary

| File                                                                             | Action | Lines    | Status  |
| -------------------------------------------------------------------------------- | ------ | -------- | ------- |
| `app2/src/geometry/dsl/expressions/operations/BisectCircleAndPointExpression.ts` | NEW    | ~50      | Pending |
| `app2/src/geometry/dsl/expressions/operations/index.ts`                          | MODIFY | +2       | Pending |
| `app2/src/geometry/dsl/GeometryBuilder.ts`                                       | MODIFY | +15      | Pending |
| `app2/src/geometry/dsl/index.ts`                                                 | MODIFY | +1       | Pending |
| `app2/src/geometry/sixfoldDslSteps.ts`                                           | NEW    | ~400-600 | Pending |
| `app2/test/sixfold-construction-equivalence.test.ts`                             | NEW    | ~200-300 | Pending |

---

## Risks and Mitigations

| Risk                                               | Impact | Mitigation                                                                   |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Parameter arithmetic not supported in DSL          | High   | Use pre-computed values or extend parameter value types                      |
| Direction constant mapping incorrect               | High   | Test each mapping individually before full implementation                    |
| bisectCircleAndPoint semantics differ              | High   | Verify with unit test comparing manual vs DSL for single case                |
| Step order doesn't match due to dependency sorting | Medium | Use explicit step ordering or verify topological sort preserves manual order |
| Too many steps to implement correctly              | Medium | Break into smaller tasks, verify each batch compiles                         |
| Floating point differences in equivalence test     | Low    | Use `approx` from `@sg/geometry` with appropriate tolerance                  |

---

## Verification Checkpoints

### Checkpoint 1: Framework Extension (After Tasks 1-4)

- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Can import and use `builder.bisectCircleAndPoint()`

### Checkpoint 2: DSL Implementation (After Tasks 5-15)

- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] `buildSixfoldDslSteps()` returns 94 steps
- [ ] DSL steps compile without errors

### Checkpoint 3: Testing (After Tasks 16-20)

- [ ] All equivalence tests pass
- [ ] `pnpm test` exits with code 0
- [ ] Geometry order matches
- [ ] All geometry values match
- [ ] Dependency graphs match

---

## Next Steps

1. **Execute Phase 1**: Framework extension (Tasks 1-4)
2. **Verify Checkpoint 1**: Get human approval
3. **Execute Phase 2**: DSL steps implementation (Tasks 5-15)
4. **Verify Checkpoint 2**: Get human approval
5. **Execute Phase 3**: Testing (Tasks 16-20)
6. **Verify Checkpoint 3**: Final approval

---

## Notes

### Parameter Arithmetic Issue

The manual STEP_0 uses `config.height / 24` for arrowLength. The current DSL parameter system may not support division operations inline. Options:

1. Pre-compute in `computeSixFoldV0Config` and add as a config parameter
2. Extend `ParameterValue` type to support arithmetic expressions
3. Use a compute function that accepts a callback

**Decision needed during Task 6**: Check if current DSL supports arithmetic on config values. If not, extend config or use alternative approach.

### Direction Constants Mapping

The manual code uses numeric direction constants (up=0, down=1, left=2, right=3). The DSL `CircleIntersectionExpression` uses `"north"` and `"south"`. Need to verify:

- `directions.up` (0) → `"north"` or `"up"`?
- `directions.down` (1) → `"south"` or `"down"`?
- `directions.left` (2) → `"left"` (supported)
- `directions.right` (3) → `"right"` (supported)

The `IntersectionExpression` already supports `"left"` and `"right"`. The `CircleIntersectionExpression` uses `"north"` and `"south"`.

**Action**: May need to extend `CircleIntersectionOptions.select` to accept numeric direction constants, or map `directions.up` → `"north"`, `directions.down` → `"south"`.

### Step Count

Manual has 94 steps (STEP_0 through STEP_93). The DSL should produce exactly 94 steps to match.
