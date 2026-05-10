# Implementation Plan: Parameterized Geometry DSL with Geometry Feature References

## Overview

Implement a unified parameterization system allowing geometry expressions to reference numeric values from config parameters (`TConfig`) and other geometry features (e.g., `c1.r`), creating a declarative, type-safe, dependency-tracked system.

This plan decomposes the work described in [SPEC-parameterized-dsl.md](./SPEC-parameterized-dsl.md) into small, verifiable tasks with explicit acceptance criteria.

---

## Architecture Decisions

| Decision                                                                 | Rationale                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Use dot notation for feature access (e.g., `c1.r`)                       | Most natural, type-safe, good IDE support                           |
| Support both abbreviations and full names (e.g., `c1.r` and `c1.radius`) | Balance conciseness with readability                                |
| Compute derived properties on-demand                                     | Simpler, always current, no caching complexity                      |
| Zero runtime overhead                                                    | No config validation at construction time, errors at compute time   |
| Backward compatible                                                      | All existing code with numeric literals continues to work unchanged |

---

## Dependency Graph

```
Core Types (types.ts)
    │
    ├── GeometryFeatureReference.ts
    │
    └── Expression Types (expressions/types.ts) → Needs feature accessor interfaces
            │
            ├── CircleExpression.ts
            ├── PointInCoordinateSystemExpression.ts
            ├── LineTowardsExpression.ts
            ├── PointAtExpression.ts
            ├── CoordinateSystemExpression.ts
            ├── PointExpression.ts
            └── LineExpression.ts
                    │
                    └── GeometryBuilder.ts → Add param() and geom() helpers
                            │
                            └── squareDslSteps.ts → Use feature references
```

---

## Task List

### Phase 1: Foundation (Core Infrastructure)

#### Task 1: Create core type definitions

**Description:** Create the `ParameterValue<TConfig>` union type, `NumericPropertyOf<T>` helper type, and `isGeometryFeatureReference()` type guard in `app2/src/geometry/dsl/types.ts`.

**Acceptance criteria:**

- [ ] `ParameterValue<TConfig>` type defined as `number | keyof TConfig | GeometryFeatureReference<TConfig, any, any>`
- [ ] `NumericPropertyOf<T>` helper type extracts numeric property names from GeometryValue types
- [ ] `isGeometryFeatureReference()` type guard correctly identifies feature references

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] Manual type test in a temporary file confirms all types work correctly

**Dependencies:** None

**Files touched:**

- `app2/src/geometry/dsl/types.ts` (NEW)

**Estimated scope:** XS (1 file, ~30 lines)

---

#### Task 2: Create GeometryFeatureReference class

**Description:** Implement the `GeometryFeatureReference<TConfig, T, K>` class with `sourceId`, `property`, `resolve()`, and `toString()` methods in `app2/src/geometry/dsl/GeometryFeatureReference.ts`.

**Acceptance criteria:**

- [ ] Class has `type`, `sourceId`, `property` readonly fields
- [ ] `type` is `"geometry_feature_reference"` for runtime type checking
- [ ] `resolve(inputs: Map<string, GeometryValue>): number` resolves to numeric value
- [ ] `toString()` returns `"geom:{sourceId}.{property}"`
- [ ] Throws descriptive errors for missing source geometry
- [ ] Throws descriptive errors for non-numeric property

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] Temporary test file verifies construction and resolution

**Dependencies:** Task 1

**Files touched:**

- `app2/src/geometry/dsl/GeometryFeatureReference.ts` (NEW)

**Estimated scope:** XS (1 file, ~60 lines)

---

### Phase 2: Expression Type Definitions

#### Task 3: Add feature accessor interfaces to expression types

**Description:** Extend the type aliases in `expressions/types.ts` to include feature accessor getters for Point, Circle, Line, CoordinateSystem.

**Acceptance criteria:**

- [ ] `PointLikeExpression<TConfig>` extended with `x`, `y` accessors
- [ ] `CircleLikeExpression<TConfig>` extended with `cx`, `cy`, `r`, `radius` accessors
- [ ] `LineLikeExpression<TConfig>` extended with `x1`, `y1`, `x2`, `y2`, `length` accessors
- [ ] `CoordinateSystemExpression<TConfig>` extended with `x`, `y`, `arrowLength`, `rotation` accessors
- [ ] All accessors return `GeometryFeatureReference` with correct generic parameters

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All existing expression files still compile without errors

**Dependencies:** Task 1, Task 2

**Files touched:**

- `app2/src/geometry/dsl/expressions/types.ts` (MODIFY)

**Estimated scope:** S (1 file, ~50 lines)

---

### Phase 3: Update Expression Implementations

#### Task 4: Update CircleExpression with parameter support

**Description:** Modify `CircleExpression` to accept `ParameterValue<TConfig>` for radius, add feature accessors, and track dependencies.

**Acceptance criteria:**

- [ ] Constructor accepts `radius: ParameterValue<TConfig>`
- [ ] Feature accessors: `cx`, `cy`, `r`, `radius` return `GeometryFeatureReference`
- [ ] Config parameter references tracked in `parameters` array
- [ ] Geometry feature references tracked in `dependencies` array
- [ ] `compile()` resolves radius at compute time
- [ ] Backward compatible with numeric literals

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All existing tests still pass

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/CircleExpression.ts` (MODIFY)

**Estimated scope:** S (1 file, ~40 lines changed)

---

#### Task 5: Update PointInCoordinateSystemExpression with parameter support

**Description:** Modify to accept `ParameterValue<TConfig>` for `localX` and `localY`, add feature accessors `x`, `y`.

**Acceptance criteria:**

- [ ] Constructor accepts `localX: ParameterValue<TConfig>`, `localY: ParameterValue<TConfig>`
- [ ] Feature accessors return `GeometryFeatureReference`
- [ ] Both parameters properly tracked in `dependencies` and `parameters` arrays
- [ ] Backward compatible with numeric literals

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] Existing tests still pass

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/PointInCoordinateSystemExpression.ts` (MODIFY)

**Estimated scope:** S (1 file, ~40 lines changed)

---

#### Task 6: Update LineTowardsExpression with parameter support

**Description:** Modify to accept `ParameterValue<TConfig>` for `length`, add feature accessors.

**Acceptance criteria:**

- [ ] Constructor accepts `length: ParameterValue<TConfig>`
- [ ] Feature accessors: `x1`, `y1`, `x2`, `y2`, `length` return `GeometryFeatureReference`
- [ ] Length parameter properly tracked in `dependencies`/`parameters`
- [ ] Backward compatible with numeric literals

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] Existing tests still pass

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/operations/LineTowardsExpression.ts` (MODIFY)

**Estimated scope:** S (1 file, ~30 lines changed)

---

#### Task 7: Update PointAtExpression with parameter support

**Description:** Modify to accept `ParameterValue<TConfig>` for `ratio`, add feature accessors.

**Acceptance criteria:**

- [ ] Constructor accepts `ratio: ParameterValue<TConfig>`
- [ ] Feature accessors: `x`, `y` return `GeometryFeatureReference`
- [ ] Ratio parameter properly tracked
- [ ] Backward compatible with numeric literals

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] Existing tests still pass

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/operations/PointAtExpression.ts` (MODIFY)

**Estimated scope:** S (1 file, ~30 lines changed)

---

#### Task 8: Add feature accessors to PointExpression

**Description:** Add `x`, `y` feature accessors to `PointExpression`.

**Acceptance criteria:**

- [ ] Both properties exposed as `GeometryFeatureReference` getters
- [ ] Backward compatible

**Verification:**

- [ ] `pnpm type-check:app2` passes

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/PointExpression.ts` (MODIFY)

**Estimated scope:** XS (1 file, ~15 lines added)

---

#### Task 9: Add feature accessors to LineExpression

**Description:** Add `x1`, `y1`, `x2`, `y2`, `length` feature accessors to `LineExpression`.

**Acceptance criteria:**

- [ ] All properties exposed as `GeometryFeatureReference` getters
- [ ] `length` computed on-demand when resolved
- [ ] Backward compatible

**Verification:**

- [ ] `pnpm type-check:app2` passes

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/LineExpression.ts` (MODIFY)

**Estimated scope:** XS (1 file, ~20 lines added)

---

#### Task 10: Add feature accessors to CoordinateSystemExpression

**Description:** Add `x`, `y`, `arrowLength`, `rotation` feature accessors.

**Acceptance criteria:**

- [ ] All numeric properties exposed as `GeometryFeatureReference` getters
- [ ] Backward compatible

**Verification:**

- [ ] `pnpm type-check:app2` passes

**Dependencies:** Task 2, Task 3

**Files touched:**

- `app2/src/geometry/dsl/expressions/CoordinateSystemExpression.ts` (MODIFY)

**Estimated scope:** XS (1 file, ~20 lines added)

---

### Phase 4: Builder Enhancement

#### Task 11: Add builder helper methods

**Description:** Add `param<K>()` and `geom<T, K>()` helper methods to `GeometryBuilder` for improved readability.

**Acceptance criteria:**

- [ ] `param<K extends keyof TConfig>(key: K): K` returns config key with type safety
- [ ] `geom<T extends GeometryValue, K extends NumericPropertyOf<T>>(expr: GeometryExpression<TConfig, T["type"]>, key: K): GeometryFeatureReference<TConfig, T, K>` creates feature reference with type safety
- [ ] Both methods improve readability over raw string literals

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All existing tests still pass

**Dependencies:** Task 1, Task 2

**Files touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts` (MODIFY)

**Estimated scope:** S (1 file, ~20 lines added)

---

### Checkpoint 1: Core Infrastructure Complete

**Verify before proceeding:**

- [ ] `pnpm type-check:app2` exits with code 0
- [ ] `pnpm test` exits with code 0 (all existing tests pass)
- [ ] No breaking changes to existing functionality
- [ ] All new types compile correctly
- [ ] Human review before proceeding to Phase 5

---

### Phase 5: Shared Utility (Optional Optimization)

#### Task 12: Create shared parameter resolution helper

**Description:** Extract a shared `resolveParameter()` utility function to avoid code duplication across expressions.

**Acceptance criteria:**

- [ ] Function in `app2/src/geometry/dsl/utils.ts` handles all three parameter sources
- [ ] Type-safe with proper generics
- [ ] All expressions can use this shared helper

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All expressions compile and work correctly

**Dependencies:** Task 2

**Files touched:**

- `app2/src/geometry/dsl/utils.ts` (NEW)

**Estimated scope:** XS (1 file, ~25 lines)

**Note:** Optional — expressions can have their own resolution logic initially, then refactor to shared utility later.

---

### Phase 6: New Tests

#### Task 13: Create GeometryFeatureReference unit tests

**Description:** Comprehensive tests for the `GeometryFeatureReference` class.

**Acceptance criteria:**

- [ ] Construction with valid source expression and property
- [ ] `resolve()` with valid inputs returns correct numeric value
- [ ] `resolve()` throws for missing source geometry
- [ ] `resolve()` throws for non-numeric property
- [ ] `toString()` returns correct format
- [ ] `isGeometryFeatureReference()` type guard works correctly
- [ ] 100% code coverage for `GeometryFeatureReference.ts`

**Verification:**

- [ ] `pnpm test GeometryFeatureReference` exits with code 0
- [ ] Coverage report shows 100% for the file

**Dependencies:** Task 2

**Files touched:**

- `app2/test/GeometryFeatureReference.test.ts` (NEW)

**Estimated scope:** S (1 file, ~100 lines)

---

#### Task 14: Create parameter resolution tests

**Description:** Tests for parameter resolution across all sources and edge cases.

**Acceptance criteria:**

- [ ] Literal number resolution works
- [ ] Config parameter resolution works
- [ ] Feature reference resolution works
- [ ] Error cases: missing config parameter throws
- [ ] Error cases: missing geometry reference throws
- [ ] Mixed parameter types in single expression work correctly
- [ ] Dependency tracking verified

**Verification:**

- [ ] `pnpm test parameter-resolution` exits with code 0
- [ ] Coverage for parameter resolution code

**Dependencies:** Task 4, Task 5, Task 6, Task 7, Task 11

**Files touched:**

- `app2/test/parameter-resolution.test.ts` (NEW)

**Estimated scope:** M (1 file, ~150 lines)

---

#### Task 15: Extend existing expression tests

**Description:** Add test cases to existing expression test files for parameter support.

**Acceptance criteria:**

- [ ] CircleExpression tests: config parameter radius, feature reference radius
- [ ] PointInCoordinateSystemExpression tests: config parameters
- [ ] PointAtExpression tests: config ratio, feature reference ratio
- [ ] LineTowardsExpression tests: config length, feature reference length
- [ ] All existing tests continue to pass

**Verification:**

- [ ] `pnpm test GeometryBuilder` exits with code 0
- [ ] New tests integrated into existing test files

**Dependencies:** Task 4, Task 5, Task 6, Task 7, Task 11

**Files touched:**

- `app2/test/GeometryBuilder.test.ts` (MODIFY)

**Estimated scope:** M (1 file, ~80 lines added)

---

### Checkpoint 2: All Tests Pass

**Verify before proceeding:**

- [ ] `pnpm test` exits with code 0 (327+ existing + 30+ new tests)
- [ ] `pnpm type-check:app2` exits with code 0
- [ ] Code coverage for new code: 100%
- [ ] All acceptance criteria from Tasks 13-15 met
- [ ] Human review before proceeding

---

### Phase 7: Example and Documentation

#### Task 16: Update squareDslSteps.ts with feature references

**Description:** Update the square construction to demonstrate feature reference usage, replacing duplicated config values.

**Acceptance criteria:**

- [ ] Uses `c1_c.r` for `c2_c` radius (instead of `config.circleRadius`)
- [ ] Uses `c1_c.r` for `ci` radius
- [ ] Optionally uses `builder.param()` for config references where clarity improves
- [ ] Maintains exact same geometric output as original
- [ ] All existing square construction tests pass

**Verification:**

- [ ] `pnpm test square-construction-equivalence` exits with code 0

**Dependencies:** Task 4, Task 5, Task 6, Task 7, Task 11

**Files touched:**

- `app2/src/geometry/squareDslSteps.ts` (MODIFY)

**Estimated scope:** S (1 file, ~20 lines changed)

---

### Final Checkpoint: Implementation Complete

**Verify before review:**

- [ ] All acceptance criteria from SPEC met
- [ ] `pnpm test` exits with code 0
- [ ] `pnpm type-check` exits with code 0
- [ ] `pnpm format:check` exits with code 0
- [ ] `pnpm lint` exits with code 0
- [ ] Minimum 30 new tests added and passing
- [ ] Code coverage for new code: 100%
- [ ] No breaking changes to existing functionality
- [ ] All files follow existing code style and patterns
- [ ] All new code has JSDoc comments
- [ ] Ready for human review

---

## Risks and Mitigations

| Risk                                      | Impact   | Mitigation                                                                                                      |
| ----------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| Type errors in complex generics           | High     | Use simple type aliases, test each file individually, verify with `pnpm type-check:app2` after each change      |
| Breaking existing code                    | Critical | Run existing tests after each modification, ensure backward compatibility by keeping numeric literals supported |
| Circular dependency in feature references | Medium   | Existing topological sort in `getExecutionOrder()` already handles this correctly                               |
| Performance regression                    | Low      | Feature references are lightweight (2 string fields), resolution at compute time has minimal overhead           |
| Missing dependency tracking               | High     | Unit tests explicitly verify `dependencies` and `parameters` arrays contain correct values                      |
| Merge conflicts                           | Medium   | Work on feature branch, keep changes focused and small                                                          |

---

## Task Sizing Summary

| Size      | Files | Scope                            | Count        |
| --------- | ----- | -------------------------------- | ------------ |
| XS        | 1     | Single function or config change | 7            |
| S         | 1-2   | One component or endpoint        | 7            |
| M         | 3-5   | One feature slice                | 2            |
| **Total** |       |                                  | **16 tasks** |

---

## Implementation Order Summary

```
Phase 1 (Foundation):
  Task 1: types.ts (NEW)
  Task 2: GeometryFeatureReference.ts (NEW)

Phase 2 (Type Definitions):
  Task 3: expressions/types.ts (MODIFY)

Phase 3 (Expression Updates):
  Task 4: CircleExpression.ts (MODIFY)
  Task 5: PointInCoordinateSystemExpression.ts (MODIFY)
  Task 6: LineTowardsExpression.ts (MODIFY)
  Task 7: PointAtExpression.ts (MODIFY)
  Task 8: PointExpression.ts (MODIFY)
  Task 9: LineExpression.ts (MODIFY)
  Task 10: CoordinateSystemExpression.ts (MODIFY)

Phase 4 (Builder):
  Task 11: GeometryBuilder.ts (MODIFY)

Checkpoint 1

Phase 5 (Optional):
  Task 12: utils.ts (NEW)

Phase 6 (Tests):
  Task 13: GeometryFeatureReference.test.ts (NEW)
  Task 14: parameter-resolution.test.ts (NEW)
  Task 15: GeometryBuilder.test.ts (MODIFY)

Checkpoint 2

Phase 7 (Example):
  Task 16: squareDslSteps.ts (MODIFY)

Final Checkpoint
```

---

## File Modification Summary

| File                                                                     | Change Type | Estimated Lines |
| ------------------------------------------------------------------------ | ----------- | --------------- |
| `app2/src/geometry/dsl/types.ts`                                         | NEW         | ~30             |
| `app2/src/geometry/dsl/GeometryFeatureReference.ts`                      | NEW         | ~60             |
| `app2/src/geometry/dsl/expressions/types.ts`                             | MODIFY      | ~50             |
| `app2/src/geometry/dsl/GeometryBuilder.ts`                               | MODIFY      | ~20             |
| `app2/src/geometry/dsl/expressions/CircleExpression.ts`                  | MODIFY      | ~40             |
| `app2/src/geometry/dsl/expressions/PointInCoordinateSystemExpression.ts` | MODIFY      | ~40             |
| `app2/src/geometry/dsl/expressions/operations/LineTowardsExpression.ts`  | MODIFY      | ~30             |
| `app2/src/geometry/dsl/expressions/operations/PointAtExpression.ts`      | MODIFY      | ~30             |
| `app2/src/geometry/dsl/expressions/PointExpression.ts`                   | MODIFY      | ~15             |
| `app2/src/geometry/dsl/expressions/LineExpression.ts`                    | MODIFY      | ~20             |
| `app2/src/geometry/dsl/expressions/CoordinateSystemExpression.ts`        | MODIFY      | ~20             |
| `app2/src/geometry/dsl/utils.ts`                                         | NEW         | ~25             |
| `app2/test/GeometryFeatureReference.test.ts`                             | NEW         | ~100            |
| `app2/test/parameter-resolution.test.ts`                                 | NEW         | ~150            |
| `app2/test/GeometryBuilder.test.ts`                                      | MODIFY      | ~80             |
| `app2/src/geometry/squareDslSteps.ts`                                    | MODIFY      | ~20             |
| **Total**                                                                |             | **~700 lines**  |

---

## Parallelization Opportunities

The following tasks can be worked on in parallel once their dependencies are complete:

| Task       | Can Parallelize    | Notes                                                 |
| ---------- | ------------------ | ----------------------------------------------------- |
| Task 3     | After Task 1,2     | Type definitions are independent                      |
| Task 4-7   | After Task 2,3     | Each expression is independent                        |
| Task 8-10  | After Task 2,3     | Each expression is independent                        |
| Task 11    | After Task 1,2     | Builder only needs types and GeometryFeatureReference |
| Task 13    | After Task 2       | Feature reference tests only need the class           |
| Task 14-15 | After Tasks 4-7,11 | Need expressions to be updated                        |
| Task 16    | After Tasks 4-7,11 | Needs expressions and builder helpers                 |

**Recommended parallel groups:**

- Group A (Core): Task 1, Task 2, Task 3, Task 11
- Group B (Expressions): Task 4, Task 5, Task 6, Task 7
- Group C (Expressions): Task 8, Task 9, Task 10
- Group D (Tests): Task 13, Task 14, Task 15
- Group E (Example): Task 16

---

## Quality Gates Checklist

Before any commit or PR:

- [ ] `pnpm type-check` passes
- [ ] `pnpm type-check:app2` passes
- [ ] `pnpm test` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm lint` passes
- [ ] No `@ts-nocheck` or inline suppressions added
- [ ] No dead code or commented-out code
- [ ] All new code has JSDoc comments
- [ ] Code follows existing style patterns

---

## References

- **Spec:** [SPEC-parameterized-dsl.md](./SPEC-parameterized-dsl.md)
- **Related Code:** `app2/src/geometry/dsl/`
- **Type Definitions:** `app2/src/types/geometry.ts`
- **Existing Tests:** `app2/test/GeometryBuilder.test.ts`
- **Square Construction:** `app2/src/geometry/squareDslSteps.ts`

---

## Revision History

| Date       | Author       | Change               |
| ---------- | ------------ | -------------------- |
| 2025-01-XX | Mistral Vibe | Initial plan created |

---

_This plan follows the planning-and-task-breakdown skill methodology with vertical slicing, explicit acceptance criteria, and verification checkpoints._
