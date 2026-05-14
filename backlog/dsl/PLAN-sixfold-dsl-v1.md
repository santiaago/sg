# Implementation Plan: Sixfold DSL v1 with cs2 Coordinate System

## Overview

Implements the Sixfold DSL v1 with cs2 coordinate system as specified in `SPEC-sixfold-dsl-v1.md`.
cs2 created after cs at (p1x, p1y) from config. p1 created in cs2 at (0, 0). All direction choices computed relative to cs2's orientation (not hardcoded). All subsequent geometries use cs2 as parent. Critical requirement: rotating cs2 must work with zero code changes to geometry definitions.

**Spec**: `backlog/dsl/SPEC-sixfold-dsl-v1.md`
**Reference**: `app2/src/geometry/sixfoldDslSteps.ts` (v0)
**Target**: `app2/src/geometry/sixfoldDslV1Steps.ts`

## Architecture Decisions

- **New File**: Create `sixfoldDslV1Steps.ts` as separate file - preserves original v0, allows comparison
- **Framework Extension Required**: Need to support **direction computations relative to cs2's orientation** - critical for rotation support
- **cs2 Position**: cs2 at absolute (p1x, p1y) from config via `builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0)` - "based on cs" since cs is at origin
- **p1 Position**: p1 at (0, 0) in cs2 via `builder.pointInCs("p1", cs2, 0, 0)` - absolute position = (p1x, p1y)
- **cs2 Parameters**: arrowLength = 0, rotation = 0 (simplest, no visual arrow needed)
- **Parentage**: All points after cs2 defined in cs2 coordinate system
- **Direction Computation**: Direction choices must be computed relative to cs2's current orientation (not hardcoded). This ensures cs2 rotation automatically recomputes all geometry with zero code changes.
- **Transformation Propagation**: Existing dependency tracking handles automatically

## Dependency Graph

```
Phase 1: Spec & Plan
    │
    ├── SPEC-sixfold-dsl-v1.md (NEW) ✅
    └── PLAN-sixfold-dsl-v1.md (NEW) ✅ → This document

Phase 2: Framework Extension (if needed for direction computation)
    │
    └── Direction computation support (TBD based on approach)

Phase 3: DSL Implementation
    │
    └── sixfoldDslV1Steps.ts (NEW)
            │
            ├── Import: GeometryBuilder from dsl/GeometryBuilder
            ├── Import: DefaultGeometryRenderer from dsl/renderers/DefaultRenderer
            ├── Import: SixFoldV0Config, GOLDEN_RATIO from sixFold/operations
            ├── Import: type Step from @/types/geometry
            └── Export: buildSixfoldDslV1Steps(), DSL_SIXFOLD_V1_STEPS_LENGTH

Phase 4: Testing
    │
    └── sixfoldDslV1Steps.test.ts (NEW)
```

## Task List

### Phase 1: Specification & Planning

#### Task 1: Review SPEC with human

**Description**: Get human approval on `SPEC-sixfold-dsl-v1.md` before implementation. Ensure all requirements understood, open questions resolved.

**Acceptance criteria:**
- [ ] Human has reviewed SPEC document
- [ ] All open questions resolved or deferred
- [ ] Decisions table approved
- [ ] Spec saved to repository

**Verification:**
- [ ] Human confirmation received

**Dependencies**: None

**Files:**
- `backlog/dsl/SPEC-sixfold-dsl-v1.md` (REVIEW)

**Estimated scope**: XS

---

#### Task 2: Review PLAN with human

**Description**: Get human approval on this implementation plan. Confirm task breakdown, dependencies, and approach.

**Acceptance criteria:**
- [ ] Human has reviewed PLAN document
- [ ] Task breakdown approved
- [ ] No missing tasks identified
- [ ] Plan saved to repository

**Verification:**
- [ ] Human confirmation received

**Dependencies**: Task 1

**Files:**
- `backlog/dsl/PLAN-sixfold-dsl-v1.md` (REVIEW)

**Estimated scope**: XS

---

### Checkpoint: Planning Complete

- [ ] SPEC reviewed and approved
- [ ] PLAN reviewed and approved
- [ ] All open questions resolved or documented
- [ ] Ready to proceed to implementation

---

### Phase 2: Core DSL File Creation (Vertical Slice 1)

#### Task 3: Create sixfoldDslV1Steps.ts with imports and boilerplate

**Description**: Create new DSL v1 file with all required imports, matching style of sixfoldDslSteps.ts.

**Acceptance criteria:**
- [ ] File created at `app2/src/geometry/sixfoldDslV1Steps.ts`
- [ ] Exports: `buildSixfoldDslV1Steps(): Step<SixFoldV0Config>[]`
- [ ] Exports: `DSL_SIXFOLD_V1_STEPS_LENGTH: number`
- [ ] All imports match sixfoldDslSteps.ts pattern
- [ ] JSDoc comments for all exports
- [ ] File passes format check

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] No import errors
- [ ] File format correct (`pnpm format`)

**Dependencies**: Task 2

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (NEW)

**Estimated scope**: XS

---

#### Task 4: Implement Step 0 (cs) - Unchanged from v0

**Description**: Copy Step 0 from `sixfoldDslSteps.ts` unchanged. Root coordinate system at origin.

**Acceptance criteria:**
- [ ] cs created with id "cs"
- [ ] cs at (0, 0) with config-based arrowLength
- [ ] Geometry ID: cs
- [ ] Matches v0 exactly

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] Compiled step has correct ID and parameters

**Dependencies**: Task 3

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (MODIFY)

**Estimated scope**: XS

---

#### Task 5: Implement Step 1 (cs2) - NEW coordinate system

**Description**: Create cs2 coordinate system at (p1x, p1y) from config. This is "based on cs" since cs is at origin.

**Acceptance criteria:**
- [ ] cs2 created with id "cs2"
- [ ] cs2 x-position = builder.param("p1x")
- [ ] cs2 y-position = builder.param("p1y")
- [ ] cs2 arrowLength = 0
- [ ] cs2 rotation = 0
- [ ] Geometry ID: cs2

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] cs2 at correct absolute position (p1x, p1y)

**Dependencies**: Task 4

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (MODIFY)

**Estimated scope**: XS

---

#### Task 6: Implement Step 2 (p1) - Modified to use cs2

**Description**: Create p1 in cs2 at (0, 0). This gives p1 absolute position (p1x, p1y) matching v0.

**Reference (MODIFIED from v0):**
```typescript
// Original v0: const p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"));
// v1: p1 at origin of cs2
const p1 = builder.pointInCs("p1", cs2, 0, 0);
```

**Acceptance criteria:**
- [ ] p1 created with id "p1"
- [ ] p1 in cs2 coordinate system
- [ ] p1 at local coordinates (0, 0) in cs2
- [ ] p1 global position = cs2 global position = (p1x, p1y)
- [ ] Geometry ID: p1

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] p1 position correct

**Dependencies**: Task 5

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (MODIFY)

**Estimated scope**: XS

---

### Checkpoint: Core Structure Complete

- [ ] All steps 0-2 implemented (cs, cs2, p1)
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Review with human before proceeding

---

### Phase 3: Bulk Step Migration (Vertical Slice 2)

#### Task 7: Implement Steps 3-94 (p2 through outlines) - Modified to use cs2

**Description**: Copy all remaining steps from `sixfoldDslSteps.ts` but change coordinate system references from `cs` to `cs2` for all `pointInCs` calls. This is the bulk of the work.

**Key Changes:**
- Step 3: `p2 = builder.pointInCs("p2", cs2, builder.param("p2x"), builder.param("p2y"))` (was cs)
- All subsequent `pointInCs` calls use cs2 instead of cs
- Lines, circles, intersections, and other geometries keep their definitions unchanged
- Geometry IDs remain unchanged (p2, line1, c1, etc.)
- **Direction choices**: Must be computed relative to cs2 (requires framework support or workaround)

**Acceptance criteria:**
- [ ] All geometries from original v0 steps 2-93 present (now steps 3-94)
- [ ] All `pointInCs` calls use cs2 as coordinate system
- [ ] Geometry IDs match original order
- [ ] All expressions compile without errors
- [ ] Direction options use cs2 as reference frame

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] All steps compile
- [ ] No type errors

**Dependencies**: Task 6

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (MODIFY)

**Estimated scope**: L (can be broken down)

**Note**: This is the largest task. Consider breaking into smaller batches:
- Batch A: Steps 3-30 (28 steps)
- Batch B: Steps 31-60 (30 steps)
- Batch C: Steps 61-90 (30 steps)
- Batch D: Steps 91-94 (4 steps)

---

#### Task 8: Export DSL_SIXFOLD_V1_STEPS_LENGTH constant

**Description**: Add step count constant export. 95 total steps (94 v0 steps + 1 cs2).

**Acceptance criteria:**
- [ ] `export const DSL_SIXFOLD_V1_STEPS_LENGTH = 95;` added
- [ ] Constant exported from file

**Verification:**
- [ ] `pnpm type-check:app2` passes
- [ ] Constant value is correct (95)

**Dependencies**: Task 7

**Files:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` (MODIFY)

**Estimated scope**: XS

---

### Checkpoint: DSL Implementation Complete

- [ ] All steps 0-94 implemented with cs2 modification
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] `buildSixfoldDslV1Steps()` returns Step array of length 95
- [ ] `DSL_SIXFOLD_V1_STEPS_LENGTH` exported correctly
- [ ] Review with human before proceeding to testing

---

### Phase 4: Testing (Vertical Slice 3)

#### Task 9: Create test file

**Description**: Create test file for DSL v1 variant with all required imports.

**Acceptance criteria:**
- [ ] Test file created at `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts`
- [ ] Imports `buildSixfoldDslV1Steps` and `DSL_SIXFOLD_V1_STEPS_LENGTH`
- [ ] Imports `executeSteps` from step execution engine
- [ ] Imports `approx` from `@sg/geometry`
- [ ] Uses Vitest testing framework

**Verification:**
- [ ] Test file compiles
- [ ] No import errors

**Dependencies**: Task 8

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (NEW)

**Estimated scope**: XS

---

#### Task 10: Test cs2 at (p1x, p1y) from config

**Description**: Verify cs2 coordinate system at absolute position from config params.

**Acceptance criteria:**
- [ ] Test verifies cs2.x = config.p1x, cs2.y = config.p1y
- [ ] Uses `approx` for floating point comparison
- [ ] Test passes

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 9

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: S

---

#### Task 11: Test p1 at (0, 0) in cs2, absolute (p1x, p1y)

**Description**: Verify p1 is at origin of cs2 with correct absolute position.

**Acceptance criteria:**
- [ ] Test verifies p1.x = cs2.x, p1.y = cs2.y (p1 at cs2 origin)
- [ ] Test verifies p1.x = config.p1x, p1.y = config.p1y
- [ ] Uses `approx` for floating point comparison
- [ ] Test passes

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 10

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: S

---

#### Task 12: Test all points use cs2 as parent

**Description**: Verify that all pointInCs expressions use cs2.

**Acceptance criteria:**
- [ ] Test inspects compiled steps
- [ ] Verifies all `pointInCs` calls use cs2 (not cs) for steps after step 1
- [ ] Note: Not all geometries have direct cs2 dependency (e.g., line intersection)
- [ ] But all points should be defined in cs2
- [ ] Test passes

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 11

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: S

**Note**: As clarified by user - not all geometries have direct dependency on cs2. For example, a point at intersection of 2 lines depends on those lines, not directly on cs2. However, if those lines are defined using points in cs2, there is transitive dependency. Test should verify that all points are defined in cs2, and that dependency chains ultimately lead back to cs2.

---

#### Task 13: Test direction computation relative to cs2 orientation

**Description**: Verify that direction-based operations compute directions relative to cs2. Critical test for rotation support.

**Acceptance criteria:**
- [ ] Create config with cs2 rotation (e.g., 90 degrees)
- [ ] Execute steps with rotated cs2
- [ ] Verify direction-based geometries have recomputed positions relative to cs2's new orientation
- [ ] Test passes with zero code changes to geometry definitions

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 12

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: M

**Note**: This test may require framework support for direction computation. If framework doesn't support relative directions yet, this test documents the requirement and may need to be skipped or use a workaround.

---

#### Task 14: Test cs2 transformations propagate

**Description**: Verify that transformations to cs2 affect all geometries in cs2 hierarchy.

**Acceptance criteria:**
- [ ] Test verifies translation and rotation of cs2
- [ ] Verifies child geometries (points, lines, circles) reflect cs2 transformation
- [ ] Test passes

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 13

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: M

---

#### Task 15: Test step count is 95

**Description**: Verify correct number of steps.

**Acceptance criteria:**
- [ ] Test asserts `steps.length === DSL_SIXFOLD_V1_STEPS_LENGTH`
- [ ] Test asserts value is 95 (94 v0 steps + 1 cs2)
- [ ] Test passes

**Verification:**
- [ ] `pnpm test sixfoldDslV1Steps` passes

**Dependencies**: Task 14

**Files:**
- `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` (MODIFY)

**Estimated scope**: XS

---

### Checkpoint: Testing Complete

- [ ] All v1-specific tests pass
- [ ] `pnpm test` exits with code 0
- [ ] No test warnings
- [ ] cs2 position verified
- [ ] p1 position verified
- [ ] cs2 parentage verified
- [ ] Direction computation verified
- [ ] Transformation propagation verified
- [ ] Step count verified
- [ ] Review with human

---

## File Summary

| File | Action | Lines | Status | Est. Scope |
|------|--------|-------|--------|-----------|
| `backlog/dsl/SPEC-sixfold-dsl-v1.md` | NEW | ~400 | ✅ Created | XS |
| `backlog/dsl/PLAN-sixfold-dsl-v1.md` | NEW | ~400 | ✅ Created | XS |
| `app2/src/geometry/sixfoldDslV1Steps.ts` | NEW | ~340 | pending | L |
| `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts` | NEW | ~150 | pending | M |

**Total estimated scope**: M (mostly in DSL file with many similar steps)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Direction computation not supported by framework | High | Investigate framework first. May need to extend IntersectionExpression/CircleIntersectionExpression to support relativeTo option, or implement workaround using cs2's transformation matrix |
| Too many manual changes to step definitions | Medium | Use search/replace to change `cs` to `cs2` for pointInCs calls. Break Task 7 into smaller batches. |
| Step numbering off by one | Low | cs2 is step 1, original v0 step 1 (p1) becomes step 2. All subsequent steps shift by +1. Document clearly. |
| cs2 transformations don't propagate | Medium | Verify via dependency graph. If cs2 is in dependency chain, transformations should propagate automatically. |
| Large task scope (Task 7) | Medium | Break into 4 smaller batches (A-D) as noted in Task 7 |

## Verification Checkpoints

### Checkpoint 1: Planning (After Tasks 1-2)
- [ ] SPEC reviewed and approved
- [ ] PLAN reviewed and approved
- [ ] All open questions resolved or documented
- [ ] Human confirmation received

### Checkpoint 2: Core Structure (After Tasks 3-6)
- [ ] DSL file created with correct structure
- [ ] Steps 0-2 (cs, cs2, p1) implemented
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Review with human

### Checkpoint 3: DSL Complete (After Tasks 7-8)
- [ ] All 95 steps implemented
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Review with human

### Checkpoint 4: Testing Complete (After Tasks 9-15)
- [ ] All tests pass
- [ ] `pnpm test` exits with code 0
- [ ] No regressions in existing tests
- [ ] Review with human

## Open Questions for Human Review

1. **cs2 arrowLength and rotation**: Should cs2 inherit arrowLength from cs using `builder.param("coordinateSystemArrowLength")`, or use 0?
2. **Direction computation implementation**: How to implement direction choices computed relative to cs2's orientation? Need framework support - options:
   - Add `relativeTo` option to direction-based expressions
   - Create new expression types that accept a coordinate system reference
   - Use transformation matrix to compute directions at compute time
3. **"ONLY" clarification**: User does not understand this question - remove or rephrase.

## Decisions Log

| Date | Decision | Rationale | Author | Status |
|------|----------|-----------|--------|--------|
| TBD | File naming | Use v1 version naming | `sixfoldDslV1Steps.ts` | **RESOLVED** |
| TBD | cs2 position | At (p1x, p1y) from config | cs2 based on cs, uses config params | **RESOLVED** |
| TBD | p1 position | In cs2 at (0, 0) | Matches requirement | **RESOLVED** |
| TBD | Direction choices | Hardcoded / Computed relative to cs2 | **Computed relative to cs2** - ensures rotation works with zero changes | **RESOLVED** |
| TBD | Step numbering shift | Acceptable? | **Yes - shift ok** | **RESOLVED** |
| TBD | cs2 inherit from cs | Should cs2 inherit? | **Yes - inherit** | **RESOLVED** |
| TBD | Direction reference | Absolute / Relative to cs2 | **Relative to cs2 position** | **RESOLVED** |
| TBD | New file, not modify original | Preserves v0 for comparison | Pending | **RESOLVED** |

## Next Steps

1. **Immediate**: Human review SPEC and PLAN (Tasks 1-2)
2. **Next**: Create DSL file with core structure (Tasks 3-6)
3. **Then**: Migrate all steps (Task 7 - may break into batches)
4. **Then**: Export constant (Task 8)
5. **Then**: Create and run tests (Tasks 9-15)
6. **Finally**: Human review and merge

## Notes

### About cs2 and p1 Position

- cs at (0, 0) - root coordinate system
- cs2 at (p1x, p1y) from config - absolute position, "based on cs"
- p1 at (0, 0) in cs2 - absolute position = (cs2.x + 0, cs2.y + 0) = (p1x, p1y)

This ensures p1 has the same absolute position in both v0 and v1, just organized differently in the coordinate system hierarchy.

### About Direction Computation

**Critical requirement**: Directions must be computed relative to cs2's orientation, not hardcoded. When cs2 rotates:
- All direction-based geometry (circleIntersection with "north", intersection with "left", etc.) must automatically recompute
- Zero code changes to geometry definitions
- The direction computation must handle cs2's current rotation matrix

Current DSL uses hardcoded strings like `{ select: "north" }` which are relative to global coordinate system. For v1, we need either:
- Framework extension: Add `relativeTo: cs2` option to direction-based expressions
- Workaround: Compute direction vectors based on cs2's rotation at compute time

This is the key technical challenge for this feature.

### Comparison with Original v0

The main difference between `sixfoldDslSteps.ts` (v0) and `sixfoldDslV1Steps.ts`:
- cs2 inserted at step 1 at absolute (p1x, p1y) from config
- p1 moved to step 2, defined in cs2 at (0, 0) instead of in cs at (p1x, p1y)
- All `pointInCs` calls after step 2 use `cs2` instead of `cs`
- **Direction choices computed relative to cs2** (not hardcoded)
- All other geometry logic unchanged
- Final geometry should be identical to original (same absolute positions, just different coordinate system hierarchy)
  - In v0: p1 at (cs.x + p1x, cs.y + p1y) = (0 + p1x, 0 + p1y) = (p1x, p1y)
  - In v1: cs2 at (p1x, p1y), p1 at (cs2.x + 0, cs2.y + 0) = (p1x, p1y)
  - Same absolute position for p1 in both versions
