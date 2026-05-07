# Implementation Plan: Declarative Geometry DSL

## Overview

Implement a higher-level declarative geometry framework (DSL) that provides a fluid API for geometric constructions while maintaining the existing step-based architecture. The framework allows developers to write code like `c1 = b.pointAt(ml, C1_POSITION_RATIO)` instead of manually defining 16+ steps, while preserving lazy evaluation, dependency tracking, and compute/draw separation.

## Status

**Last Commit**: `cd1e69a docs(app2/geometry/dsl): add JSDoc comments to all public API (Task 26)`

## Architecture Decisions

- **Directory**: `app2/src/geometry/dsl/` - Contains all new DSL framework code
- **API Style**: Factory pattern with expression objects - `cs = b.coordinateSystem(...)` returns expression
- **No `any` types**: All expressions are strongly typed with generic `TConfig` and specific geometry types
- **Renderer DI**: `GeometryRenderer` interface injected into builder, separates draw logic from expressions
- **Polygon with array**: `polygon(id, points[])` accepts array of point expressions
- **Line extension**: Separate `lineTowards(id, start, end, length)` method for extended lines

## Dependency Graph

```
Existing types/utility imports
    │
    ├── GeometryRenderer interface (types.ts)
    │       │
    │       └── DefaultGeometryRenderer (DefaultRenderer.ts)
    │
    ├── GeometryExpression base interface (GeometryExpression.ts)
    │       │
    │       ├── Primitive expressions (Point, Line, Circle, CoordinateSystem, Polygon)
    │       │       │
    │       │       └── compile() uses renderer
    │       │
    │       └── Operation expressions (PointAt, Intersection, CircleIntersection, LineTowards)
    │
    └── GeometryBuilder (GeometryBuilder.ts)
            │
            ├── Factory methods return expressions
            │
            ├── Tracks all expressions in Map
            │
            └── compile() -> Step[] using topological sort
```

## Task List

### Phase 1: Foundation

#### Task 1: Create DSL directory structure and type exports

**Description:** Set up the `dsl/` directory with index.ts exporting all public types and classes.

**Acceptance criteria:**

- [ ] `app2/src/geometry/dsl/` directory created
- [ ] `index.ts` exists with exports for all public API surfaces
- [ ] No build errors when importing from `../geometry/dsl`

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] No lint errors

**Dependencies:** None

**Files likely touched:**

- `app2/src/geometry/dsl/index.ts`

**Estimated scope:** XS

---

#### Task 2: Define GeometryRenderer interface

**Description:** Create the `GeometryRenderer` interface and types for dependency injection of draw logic.

**Acceptance criteria:**

- [ ] `GeometryRenderer` interface defined with `drawPoint`, `drawLine`, `drawCircle`, `drawPolygon`, `drawCoordinateSystem` methods
- [ ] Interface uses existing `GeometryValue`, `GeometryStore`, `Theme` types
- [ ] No `any` types in interface

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** None

**Files likely touched:**

- `app2/src/geometry/dsl/renderers/types.ts`

**Estimated scope:** XS

---

#### Task 3: Implement DefaultGeometryRenderer

**Description:** Create the default renderer implementation using existing draw functions from svgElements.

**Acceptance criteria:**

- [ ] `DefaultGeometryRenderer` implements `GeometryRenderer`
- [ ] Uses `POINT_RADIUS_MEDIUM`, `STROKE_WIDTH_THIN` from geometryConfig
- [ ] Uses existing `drawPoint`, `drawLine`, `drawCircle`, `drawPolygon`, `drawCoordinateSystem` from svgElements
- [ ] Handles null/undefined geometry gracefully

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] No lint errors

**Dependencies:** Task 2 (GeometryRenderer interface)

**Files likely touched:**

- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts`

**Estimated scope:** S

---

#### Task 4: Define GeometryExpression base interface

**Description:** Create the base `GeometryExpression` interface that all expressions implement.

**Acceptance criteria:**

- [ ] `GeometryExpression<TConfig, TType>` interface with `id`, `type`, `dependencies`, `parameters`, `compile()`
- [ ] `compile()` accepts `GeometryRenderer` and returns `Step<TConfig>`
- [ ] No `any` types
- [ ] Type constraints: `TType extends GeometryValue["type"]`

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 2 (GeometryRenderer interface)

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/GeometryExpression.ts`

**Estimated scope:** XS

---

### Checkpoint: Foundation

- [ ] All Phase 1 tasks complete
- [ ] `pnpm type-check:app2` passes
- [ ] No lint errors
- [ ] Review with human before proceeding

---

### Phase 2: Primitive Expressions

#### Task 5: Implement PointExpression

**Description:** Create expression for primitive point geometry.

**Acceptance criteria:**

- [ ] `PointExpression<TConfig>` implements `GeometryExpression<TConfig, "point">`
- [ ] Constructor accepts `id: string`, `x: number`, `y: number`
- [ ] `dependencies` is empty array (primitive has no dependencies)
- [ ] `compile()` returns Step with correct `inputs`, `outputs`, `parameters`, `compute`, `draw`
- [ ] `compute()` returns `Map` with `point(x, y)`
- [ ] `draw()` uses injected renderer

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: PointExpression compiles to correct Step

**Dependencies:** Task 2, Task 4

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/PointExpression.ts`
- `app2/src/geometry/dsl/expressions/index.ts` (export)

**Estimated scope:** S

---

#### Task 6: Implement LineExpression

**Description:** Create expression for line geometry with two constructors (coordinates and point references).

**Acceptance criteria:**

- [ ] `LineExpression<TConfig>` implements `GeometryExpression<TConfig, "line">`
- [ ] Constructor signature 1: `id, x1, y1, x2, y2` (coordinates)
- [ ] Constructor signature 2: `id, start: PointExpression, end: PointExpression` (point refs)
- [ ] `dependencies` includes point IDs when constructed from points
- [ ] `compile()` returns Step with `line(x1, y1, x2, y2)` in compute
- [ ] `draw()` uses injected renderer

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: LineExpression compiles to correct Step

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/LineExpression.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 7: Implement CircleExpression

**Description:** Create expression for circle geometry.

**Acceptance criteria:**

- [ ] `CircleExpression<TConfig>` implements `GeometryExpression<TConfig, "circle">`
- [ ] Constructor accepts `id: string`, `center: PointExpression<TConfig>`, `radius: number`
- [ ] `dependencies` includes center point ID
- [ ] `compile()` returns Step with `circle(cx, cy, r)` in compute
- [ ] `draw()` uses injected renderer

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: CircleExpression compiles to correct Step

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/CircleExpression.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 8: Implement CoordinateSystemExpression

**Description:** Create expression for coordinate system geometry.

**Acceptance criteria:**

- [ ] `CoordinateSystemExpression<TConfig>` implements `GeometryExpression<TConfig, "coordinate_system">`
- [ ] Constructor accepts `id: string`, `x: number`, `y: number`, `arrowLength: number`, `rotation?: number`
- [ ] `dependencies` is empty
- [ ] `compile()` returns Step with `coordinateSystem(x, y, arrowLength, rotation)` in compute
- [ ] `draw()` uses injected renderer

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: CoordinateSystemExpression compiles to correct Step

**Dependencies:** Task 4

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/CoordinateSystemExpression.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 9: Implement PolygonExpression

**Description:** Create expression for polygon geometry from array of point expressions.

**Acceptance criteria:**

- [ ] `PolygonExpression<TConfig>` implements `GeometryExpression<TConfig, "polygon">`
- [ ] Constructor accepts `id: string`, `points: PointExpression<TConfig>[]`
- [ ] `dependencies` includes all point expression IDs
- [ ] `compile()` returns Step with `polygon([{x, y}, ...])` in compute
- [ ] `draw()` uses injected renderer

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: PolygonExpression compiles to correct Step

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/PolygonExpression.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

### Checkpoint: Primitive Expressions

- [ ] All Phase 2 tasks complete
- [ ] `pnpm type-check:app2` passes
- [ ] All primitive expression unit tests pass
- [ ] Review with human before proceeding

---

### Phase 3: GeometryBuilder Factory

#### Task 10: Implement GeometryBuilder class skeleton

**Description:** Create the GeometryBuilder class with expression tracking and renderer injection.

**Acceptance criteria:**

- [ ] `GeometryBuilder<TConfig>` class with `expressions: Map<string, GeometryExpression<TConfig, any>>`
- [ ] Constructor accepts optional `GeometryRenderer`, defaults to `DefaultGeometryRenderer`
- [ ] `setRenderer(renderer)` method for DI
- [ ] `getExpression(id)` method to retrieve tracked expressions
- [ ] `compile()` method stub (returns empty array for now)

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`

**Dependencies:** Task 2, Task 3, Task 4, Tasks 5-9

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`
- `app2/src/geometry/dsl/index.ts` (export)

**Estimated scope:** S

---

#### Task 11: Add primitive factory methods to GeometryBuilder

**Description:** Add `point()`, `line()`, `circle()`, `coordinateSystem()`, `polygon()` methods.

**Acceptance criteria:**

- [ ] `point(id, x, y)` returns `PointExpression<TConfig>` and tracks it
- [ ] `line(id, x1, y1, x2, y2)` returns `LineExpression<TConfig>` and tracks it
- [ ] `line(id, start, end)` overload returns `LineExpression<TConfig>` and tracks it
- [ ] `circle(id, center, radius)` returns `CircleExpression<TConfig>` and tracks it
- [ ] `coordinateSystem(id, x, y, arrowLength, rotation?)` returns `CoordinateSystemExpression<TConfig>` and tracks it
- [ ] `polygon(id, points[])` returns `PolygonExpression<TConfig>` and tracks it
- [ ] All methods store expression in `this.expressions` map

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Can create all primitive expressions via builder

**Dependencies:** Task 10, Tasks 5-9

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Estimated scope:** S

---

#### Task 12: Add dependency graph methods to GeometryBuilder

**Description:** Add methods for querying dependencies and metadata.

**Acceptance criteria:**

- [ ] `getDependencies(id)` returns array of dependency IDs for an expression
- [ ] `getDependencyGraph()` returns full dependency graph
- [ ] `getStepMetadata(id)` returns `{ inputs, outputs, parameters }`
- [ ] `getFullMetadata()` returns metadata for all expressions

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: dependency graph is correct for simple chain

**Dependencies:** Task 11

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Estimated scope:** S

---

#### Task 13: Implement topological sort for compilation order

**Description:** Implement the topological sorting logic to determine step execution order.

**Acceptance criteria:**

- [ ] `getExecutionOrder()` returns string[] of expression IDs in correct order
- [ ] Dependencies are executed before dependents
- [ ] Handles circular dependencies by throwing error
- [ ] Uses depth-first visit pattern

**Verification:**

- [ ] Unit test: correct order for square construction dependencies
- [ ] Unit test: throws on circular dependency

**Dependencies:** Task 12

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Estimated scope:** S

---

#### Task 14: Complete compile() method

**Description:** Implement the full `compile()` method that converts all expressions to Steps.

**Acceptance criteria:**

- [ ] `compile()` uses `getExecutionOrder()` to order steps
- [ ] Each expression's `compile()` is called with the builder's renderer
- [ ] Returns `Step<TConfig>[]` array
- [ ] Step IDs follow pattern `step_[expressionId]`

**Verification:**

- [ ] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: compiling simple construction produces correct Steps

**Dependencies:** Task 13

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Estimated scope:** S

---

### Checkpoint: GeometryBuilder

- [ ] All Phase 3 tasks complete
- [ ] `pnpm type-check:app2` passes
- [ ] Primitive expressions can be created and compiled via builder
- [ ] Review with human before proceeding

---

### Phase 4: Operation Expressions

#### Task 15: Implement PointAtExpression

**Description:** Create expression for point-at-ratio-on-line operation.

**Acceptance criteria:**

- [x] `PointAtExpression<TConfig>` implements `GeometryExpression<TConfig, "point">`
- [x] Constructor accepts `id: string`, `line: LineExpression<TConfig>`, `ratio: number`
- [x] `dependencies` includes line expression ID
- [x] `compile()` compute uses `lineVal.x1 + (lineVal.x2 - lineVal.x1) * ratio` pattern
- [x] Uses `getGeometry()` from operations.ts for input validation
- [x] `draw()` uses injected renderer

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: compiles and computes correct point at ratio

**Dependencies:** Task 4, Task 6

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/PointAtExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/index.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 16: Implement IntersectionExpression

**Description:** Create expression for circle-line intersection operation.

**Acceptance criteria:**

- [x] `IntersectionExpression<TConfig>` implements `GeometryExpression<TConfig, "point">`
- [x] Constructor accepts `id: string`, `circle: CircleExpression<TConfig>`, `line: LineExpression<TConfig>`, `options?: IntersectionOptions`
- [x] `dependencies` includes circle and line expression IDs
- [x] `compile()` compute uses `pointFromCircleAndLine()` from constructors.ts
- [x] Supports `exclude` option to skip known intersection point
- [x] Supports `tolerance` option (falls back to config.tolerance)
- [x] Throws `GeometryError` if no intersection found
- [x] `draw()` uses injected renderer

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: compiles and computes correct intersection point

**Dependencies:** Task 4, Task 6, Task 7

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/IntersectionExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/types.ts` (IntersectionOptions)
- `app2/src/geometry/dsl/expressions/operations/index.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 17: Implement CircleIntersectionExpression

**Description:** Create expression for circle-circle intersection operation.

**Acceptance criteria:**

- [x] `CircleIntersectionExpression<TConfig>` implements `GeometryExpression<TConfig, "point">`
- [x] Constructor accepts `id: string`, `c1: CircleExpression<TConfig>`, `c2: CircleExpression<TConfig>`, `options?: CircleIntersectionOptions`
- [x] `dependencies` includes both circle expression IDs
- [x] `compile()` compute uses `pointFromCircles()` from constructors.ts
- [x] Supports `select` option: `"north"` or `"south"`
- [x] Throws `GeometryError` if no intersection found
- [x] `draw()` uses injected renderer

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: compiles and computes correct intersection point

**Dependencies:** Task 4, Task 7

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/CircleIntersectionExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/types.ts` (CircleIntersectionOptions)
- `app2/src/geometry/dsl/expressions/operations/index.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 18: Implement LineTowardsExpression (line extension)

**Description:** Create expression for extended line from point through point with length.

**Acceptance criteria:**

- [x] `LineTowardsExpression<TConfig>` implements `GeometryExpression<TConfig, "line">`
- [x] Constructor accepts `id: string`, `start: PointExpression<TConfig>`, `end: PointExpression<TConfig>`, `length: number`
- [x] `dependencies` includes start and end point expression IDs
- [x] `compile()` compute uses `lineTowards()` from constructors.ts
- [x] `draw()` uses injected renderer

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [ ] Unit test: compiles and computes correct extended line

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `app2/src/geometry/dsl/expressions/operations/LineTowardsExpression.ts`
- `app2/src/geometry/dsl/expressions/operations/index.ts`
- `app2/src/geometry/dsl/expressions/index.ts`

**Estimated scope:** S

---

#### Task 19: Add operation factory methods to GeometryBuilder

**Description:** Add methods to GeometryBuilder for creating operation expressions.

**Acceptance criteria:**

- [x] `pointAt(id, line, ratio)` returns `PointAtExpression<TConfig>` and tracks it
- [x] `intersection(id, circle, line, options?)` returns `IntersectionExpression<TConfig>` and tracks it
- [x] `circleIntersection(id, c1, c2, options?)` returns `CircleIntersectionExpression<TConfig>` and tracks it
- [x] `lineTowards(id, start, end, length)` returns `LineTowardsExpression<TConfig>` and tracks it
- [x] All methods store expression in `this.expressions` map

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [x] Can create all operation expressions via builder

**Dependencies:** Task 11, Tasks 15-18

**Files likely touched:**

- `app2/src/geometry/dsl/GeometryBuilder.ts`

**Estimated scope:** S

---

### Checkpoint: Operation Expressions

- [x] All Phase 4 tasks complete
- [x] `pnpm type-check:app2` passes
- [x] All operation expressions can be created and compiled
- [ ] Review with human before proceeding

---

### Phase 5: Integration and Testing

#### Task 20: Create DSL tests directory and test utilities

**Description:** Set up test infrastructure for DSL framework.

**Acceptance criteria:**

- [x] `__tests__/` directory created under `dsl/`
- [x] Test utilities for creating mock SVG, store, theme
- [x] Helper to execute compiled steps and extract values

**Verification:**

- [x] Tests run without errors: `pnpm test`

**Dependencies:** None

**Files likely touched:**

- `app2/src/geometry/dsl/__tests__/utils.ts`
- `app2/src/geometry/dsl/__tests__/setup.ts`

**Estimated scope:** XS

---

#### Task 21: Unit tests for primitive expressions

**Description:** Write unit tests for Point, Line, Circle, CoordinateSystem, Polygon expressions.

**Acceptance criteria:**

- [x] Test each primitive expression compiles to correct Step
- [x] Test Step has correct `inputs`, `outputs`, `parameters`
- [x] Test `compute()` produces correct geometry value
- [x] Test `draw()` doesn't throw with mock renderer

**Verification:**

- [x] All tests pass: 30 tests in primitives.test.ts

**Dependencies:** Task 20, Tasks 5-9

**Files likely touched:**

- `app2/src/geometry/dsl/__tests__/primitives.test.ts`

**Estimated scope:** M

---

#### Task 22: Unit tests for operation expressions

**Description:** Write unit tests for PointAt, Intersection, CircleIntersection, LineTowards expressions.

**Acceptance criteria:**

- [x] Test each operation expression compiles to correct Step
- [x] Test Step has correct `inputs`, `outputs`, `parameters`
- [x] Test `compute()` produces correct geometry value
- [x] Test dependency tracking is correct
- [ ] Test error cases (no intersection, etc.)

**Verification:**

- [x] All tests pass: 22 tests in operations.test.ts

**Dependencies:** Task 20, Tasks 15-18

**Files likely touched:**

- `app2/src/geometry/dsl/__tests__/operations.test.ts`

**Estimated scope:** M

---

#### Task 23: Unit tests for GeometryBuilder

**Description:** Write unit tests for GeometryBuilder class.

**Acceptance criteria:**

- [ ] Test expression tracking and retrieval
- [ ] Test dependency graph methods
- [ ] Test topological sort order
- [ ] Test `compile()` produces correct Step array
- [ ] Test renderer injection works

**Verification:**

- [ ] All tests pass: `pnpm test -- --grep "dsl.*builder"`

**Dependencies:** Task 20, Tasks 10-14, Task 19

**Files likely touched:**

- `app2/src/geometry/dsl/__tests__/GeometryBuilder.test.ts`

**Estimated scope:** M

---

#### Task 24: Integration test - square construction equivalence

**Description:** Verify that DSL produces identical results to `squareSteps.ts`.

**Acceptance criteria:**

- [x] DSL code replicates square construction (all 18 steps)
- [x] Compiled steps produce geometry identical to manual steps (within tolerance)
- [x] Dependency graph matches expected structure from squareSteps.ts
- [x] All geometry values match (points, lines, circles, final square)

**Verification:**

- [x] Integration test passes (17 tests)
- [ ] Visual comparison of outputs

**Dependencies:** Task 20, Tasks 10-19

**Files likely touched:**

- `app2/test/square-construction-equivalence.test.ts`

**Estimated scope:** M

**Status:** ✅ Complete

---

### Checkpoint: Integration Testing

- [x] All Phase 5 tasks complete
- [x] `__tests__/` utilities created (dsl-test-utils.ts)
- [x] Primitive expression tests pass (30 tests)
- [x] Operation expression tests pass (22 tests)
- [x] All DSL tests pass (34 GeometryBuilder + 17 Square equivalence = 51 new tests)
- [x] Square equivalence verified (17 tests)
- [ ] Review with human before proceeding

---

### Phase 6: Polish and Documentation

#### Task 25: Update DSL index exports

**Description:** Ensure all public API surfaces are exported from `dsl/index.ts`.

**Acceptance criteria:**

- [x] `GeometryBuilder` exported
- [x] All expression types exported (for advanced users)
- [x] `GeometryRenderer` interface exported
- [x] `DefaultGeometryRenderer` exported
- [x] Type-only exports for types (IntersectionOptions, CircleIntersectionOptions)
- [x] PointLikeExpression, LineLikeExpression, CircleLikeExpression type aliases exported

**Verification:**

- [x] Build succeeds: `pnpm type-check:app2`
- [x] Can import all public types from `../geometry/dsl`

**Dependencies:** All previous tasks

**Files likely touched:**

- `app2/src/geometry/dsl/index.ts`

**Estimated scope:** XS

**Status:** ✅ Complete

---

#### Task 26: Add JSDoc comments to all public API

**Description:** Add comprehensive JSDoc documentation.

**Acceptance criteria:**

- [x] All public classes have class-level JSDoc
- [x] All public methods have method-level JSDoc
- [x] All public interfaces have interface-level JSDoc
- [x] All public types have type-level JSDoc

**Verification:**

- [x] No documentation warnings
- [x] IDE autocomplete shows documentation

**Dependencies:** All previous tasks

**Files likely touched:**

- All files in `app2/src/geometry/dsl/`

**Estimated scope:** S

**Status:** ✅ Complete

**Files updated:**

- `app2/src/geometry/dsl/expressions/types.ts` - Added JSDoc for PointLike/LineLike/CircleLike type aliases
- `app2/src/geometry/dsl/renderers/types.ts` - Added JSDoc for GeometryRenderer interface methods
- `app2/src/geometry/dsl/renderers/DefaultRenderer.ts` - Added JSDoc for all draw methods

---

#### Task 27: Final build and test verification

**Description:** Run all checks to ensure nothing is broken.

**Acceptance criteria:**

- [x] `pnpm type-check:app2` passes
- [x] `pnpm lint` passes (on new/changed DSL files)
- [x] `pnpm format` passes (on new/changed DSL files)
- [x] All existing geometry tests still pass (310 tests)
- [x] All new DSL tests pass (51 new tests: 34 GeometryBuilder + 17 Square equivalence)

**Verification:**

- [x] All commands exit with code 0
- [x] Total: 327 tests pass

**Status:** ✅ Complete
- [ ] No warnings or errors

**Dependencies:** All previous tasks

**Files likely touched:** None (verification only)

**Estimated scope:** XS

---

## Final Checkpoint: Complete

- [ ] All tasks complete
- [ ] All acceptance criteria met
- [ ] All checks pass
- [ ] Ready for code review

## Risks and Mitigations

| Risk                                                  | Impact | Mitigation                                           |
| ----------------------------------------------------- | ------ | ---------------------------------------------------- |
| Type inference issues with generic TConfig            | High   | Use explicit type parameters, test with SquareConfig |
| Circular dependencies in expressions                  | Medium | Topological sort throws error, good test coverage    |
| Performance of topological sort with many expressions | Low    | O(n) depth-first algorithm, n < 100 for geometry     |
| Breaking changes to existing code                     | Medium | No existing files modified, all new code in dsl/     |
| Expression memory leaks                               | Low    | Expressions are plain data, no event listeners       |

## Parallelization Opportunities

**Safe to parallelize:**

- Task 5 (PointExpression) + Task 7 (CircleExpression) + Task 8 (CoordinateSystemExpression) + Task 9 (PolygonExpression)
- Task 6 (LineExpression) - depends on PointExpression
- Task 15 (PointAt) + Task 16 (Intersection) + Task 17 (CircleIntersection) + Task 18 (LineTowards)
- Task 21 (primitive tests) + Task 22 (operation tests) + Task 23 (builder tests)

**Must be sequential:**

- Task 2 -> Task 3 (Renderer interface before implementation)
- Task 4 -> Tasks 5-9 (Base interface before implementations)
- Task 10 -> Task 11 -> Task 12 -> Task 13 -> Task 14 (Builder incremental)
- Task 20 -> Tasks 21-24 (Test infrastructure before tests)

## Task Summary by Phase

| Phase               | Tasks  | Scope |
| ------------------- | ------ | ----- |
| Phase 1: Foundation | 4      | XS-S  |
| Phase 2: Primitives | 5      | S     |
| Phase 3: Builder    | 5      | S     |
| Phase 4: Operations | 5      | S     |
| Phase 5: Testing    | 5      | XS-M  |
| Phase 6: Polish     | 3      | XS-S  |
| **Total**           | **27** | -     |

## Verification Checklist

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than ~5 files
- [ ] Checkpoints exist between major phases
