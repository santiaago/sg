# Tasks: Declarative Geometry Framework Implementation

## Overview
Discrete, implementable tasks for building the declarative geometry framework. Tasks are ordered by dependency and include explicit acceptance criteria and verification steps.

---

## Phase A: Core Framework

### Task 1: Create declarative directory structure
- **Task**: Set up the new declarative module directory with type definitions
- **Acceptance**: 
  - `app2/src/declarative/` directory exists
  - `app2/src/declarative/index.ts` exists with placeholder exports
  - TypeScript compiles without errors
- **Verify**: `npx tsc --noEmit -p app2/tsconfig.json`
- **Files**: 
  - `app2/src/declarative/index.ts`
  - `app2/src/declarative/geometry.ts` (empty stub)
  - `app2/src/declarative/operations.ts` (empty stub)
  - `app2/src/declarative/stepGenerator.ts` (empty stub)
  - `app2/src/declarative/dsl.ts` (empty stub)

### Task 2: Implement base geometry types
- **Task**: Create the `DeclarativeGeometry` type and factory functions in `geometry.ts`
- **Acceptance**:
  - `DeclarativeGeometry<T>` interface defined with id, value, inputs, parameters, operation
  - Factory function `createDeclGeom` that creates DeclarativeGeometry objects
  - Type-safe getter functions for each geometry type
  - TypeScript compiles and all types resolve correctly
- **Verify**: 
  - Type check passes
  - Can create a DeclarativeGeometry<Point> manually
- **Files**: `app2/src/declarative/geometry.ts`

### Task 3: Implement step generator
- **Task**: Create `toStep` and `toSteps` functions in `stepGenerator.ts`
- **Acceptance**:
  - Function that converts DeclarativeGeometry to Step object
  - Properly sets inputs, outputs, parameters from DeclarativeGeometry metadata
  - Generate compute function that uses the wrapped operation
  - Generate draw function using existing draw utilities
  - Topological sort of dependencies
  - Cycle detection with descriptive errors
- **Verify**: 
  - Unit tests for step generation pass
  - Can convert a simple declarative geometry to a Step
- **Files**: `app2/src/declarative/stepGenerator.ts`

### Task 4: Implement primitive constructors
- **Task**: Add `point`, `line`, `circle`, `polygon`, `coordinateSystem` functions to `operations.ts`
- **Acceptance**:
  - Each function accepts appropriate parameters
  - Each function returns DeclarativeGeometry<T>
  - Functions support both raw values and DeclarativeGeometry inputs
  - TypeScript properly infers return types
- **Verify**:
  - Type check passes
  - Can create point, line, circle declaratively
- **Files**: `app2/src/declarative/operations.ts`

### Task 5: Implement derived operations
- **Task**: Add `pointAt`, `intersection` functions to `operations.ts`
- **Acceptance**:
  - `pointAt(line, ratio)` returns point at ratio along line
  - `intersection(circle, line, direction)` returns intersection point
  - Operations track their inputs and parameters correctly
  - Type-safe with proper overloads
- **Verify**:
  - Type check passes
  - Unit tests for operations pass
- **Files**: `app2/src/declarative/operations.ts`

### Task 6: Implement DSL utilities
- **Task**: Create GeometryBuilder class and singleton in `dsl.ts`
- **Acceptance**:
  - GeometryBuilder class with set, get, toSteps, clear methods
  - Singleton builder exported for convenience
  - Builder maintains map of geometries by ID
  - toSteps() returns properly ordered Step array
- **Verify**:
  - Type check passes
  - Can use builder to create and retrieve geometries
- **Files**: `app2/src/declarative/dsl.ts`

### Task 7: Create public API exports
- **Task**: Set up proper exports in `index.ts`
- **Acceptance**:
  - All public functions exported
  - Clean API surface
  - TypeScript module resolution works
- **Verify**: Can import from `../declarative` and use all public APIs
- **Files**: `app2/src/declarative/index.ts`

---

## Phase B: Proof-of-Concept

### Task 8: Create SquaresV2 component
- **Task**: Implement SquaresV2.tsx using declarative API
- **Acceptance**:
  - Component mirrors SquareSvg structure
  - Uses declarative API for all geometry construction
  - All 18 steps replicated using declarative syntax
  - Component renders without errors
- **Verify**:
  - TypeScript compiles
  - Component can be imported and used
  - No runtime errors when rendering
- **Files**: `app2/src/components/SquaresV2.tsx`

### Task 9: Create SquaresV2 SVG component
- **Task**: Create SquaresV2Svg.tsx (SVG-only version, matching SquareSvg pattern)
- **Acceptance**:
  - Follows same pattern as SquareSvg.tsx
  - Uses declarative API internally
  - Exports SQUARES_V2_STEPS for reference
  - Properly handles theme and store
- **Verify**:
  - Type check passes
  - Component renders
- **Files**: `app2/src/components/SquaresV2Svg.tsx`

### Task 10: Optional - Generate squaresV2Steps.ts
- **Task**: Create reference file showing generated steps
- **Acceptance**:
  - Exports SQUARES_V2_STEPS array
  - Steps match declarative construction
  - Can be used for debugging/reference
- **Verify**: Steps array is valid
- **Files**: `app2/src/geometry/squaresV2Steps.ts`

---

## Phase C: Testing

### Task 11: Unit tests for geometry.ts
- **Task**: Write comprehensive tests for base geometry types
- **Acceptance**:
  - Tests for DeclarativeGeometry creation
  - Tests for type guards
  - Tests for value access
  - 100% coverage of geometry.ts
- **Verify**: `npm test -- app2/src/declarative/geometry.test.ts`
- **Files**: `app2/src/declarative/geometry.test.ts`

### Task 12: Unit tests for operations.ts
- **Task**: Write tests for all geometry operations
- **Acceptance**:
  - Tests for each primitive constructor
  - Tests for each derived operation
  - Tests for type inference
  - Edge case tests (invalid inputs, etc.)
- **Verify**: `npm test -- app2/src/declarative/operations.test.ts`
- **Files**: `app2/src/declarative/operations.test.ts`

### Task 13: Unit tests for stepGenerator.ts
- **Task**: Write tests for step generation
- **Acceptance**:
  - Tests for toStep function
  - Tests for toSteps function
  - Tests for topological sort
  - Tests for cycle detection
- **Verify**: `npm test -- app2/src/declarative/stepGenerator.test.ts`
- **Files**: `app2/src/declarative/stepGenerator.test.ts`

### Task 14: Unit tests for dsl.ts
- **Task**: Write tests for GeometryBuilder
- **Acceptance**:
  - Tests for set/get methods
  - Tests for toSteps method
  - Tests for clear method
  - Tests for singleton pattern
- **Verify**: `npm test -- app2/src/declarative/dsl.test.ts`
- **Files**: `app2/src/declarative/dsl.test.ts`

### Task 15: Integration test for SquaresV2
- **Task**: Verify SquaresV2 produces same results as SquareSvg
- **Acceptance**:
  - Test that both components produce identical geometry at each step
  - Test with multiple configurations
  - Performance comparison (optional)
- **Verify**: `npm test -- app2/src/components/SquaresV2.test.tsx`
- **Files**: `app2/src/components/SquaresV2.test.tsx`

---

## Phase D: Validation

### Task 16: Type check all new code
- **Task**: Run TypeScript type checker on all new files
- **Acceptance**: No type errors
- **Verify**: `npx tsc --noEmit -p app2/tsconfig.json`
- **Files**: All new files

### Task 17: Lint all new code
- **Task**: Run linter on all new files
- **Acceptance**: No lint errors
- **Verify**: `npm run lint`
- **Files**: All new files

### Task 18: Build app2
- **Task**: Ensure app2 builds successfully
- **Acceptance**: Build completes without errors
- **Verify**: `npm run build:app2`
- **Files**: N/A

---

## Phase E: Documentation

### Task 19: Update SPEC with implementation details
- **Task**: Document any changes from original SPEC
- **Acceptance**: SPEC is up to date
- **Verify**: Manual review
- **Files**: `app2/docs/SPEC-declarative-geometry.md`

### Task 20: Add README for declarative module
- **Task**: Create usage documentation
- **Acceptance**: 
  - API documentation
  - Usage examples
  - Getting started guide
- **Verify**: Manual review
- **Files**: `app2/src/declarative/README.md`

---

## Task Summary

| Phase | Task | Priority | Estimated Time |
|-------|------|----------|----------------|
| A | 1: Directory structure | High | 0.5h |
| A | 2: Base geometry types | High | 2h |
| A | 3: Step generator | High | 2h |
| A | 4: Primitive constructors | High | 1.5h |
| A | 5: Derived operations | High | 2h |
| A | 6: DSL utilities | High | 1.5h |
| A | 7: Public API exports | Medium | 0.5h |
| B | 8: SquaresV2 component | High | 2h |
| B | 9: SquaresV2Svg component | High | 1.5h |
| B | 10: squaresV2Steps.ts | Low | 0.5h |
| C | 11: geometry.ts tests | High | 1h |
| C | 12: operations.ts tests | High | 1.5h |
| C | 13: stepGenerator.ts tests | High | 1.5h |
| C | 14: dsl.ts tests | Medium | 1h |
| C | 15: SquaresV2 integration test | High | 1h |
| D | 16: Type check | High | 0.5h |
| D | 17: Lint | Medium | 0.5h |
| D | 18: Build | High | 0.5h |
| E | 19: Update SPEC | Medium | 0.5h |
| E | 20: README | Low | 1h |

**Total Estimated Time**: ~24 hours

---

## Dependency Graph

```
Task 1 (Directory)
    └── No dependencies

Task 2 (geometry.ts)
    └── Task 1

Task 3 (stepGenerator.ts)
    └── Task 2

Task 4 (Primitive constructors)
    └── Task 2

Task 5 (Derived operations)
    ├── Task 2
    └── Task 4

Task 6 (DSL utilities)
    ├── Task 2
    ├── Task 3
    └── Task 5

Task 7 (Public API)
    ├── Task 2
    ├── Task 3
    ├── Task 4
    ├── Task 5
    └── Task 6

Phase B Tasks (8, 9, 10)
    └── Task 7

Phase C Tasks (11-15)
    └── Corresponding implementation tasks

Phase D Tasks (16-18)
    └── All implementation and test tasks

Phase E Tasks (19-20)
    └── All previous tasks
```

---

**Status**: Awaiting human review
**Next**: Implementation (Phase A, Task 1)
