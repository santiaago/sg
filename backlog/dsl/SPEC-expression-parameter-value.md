# Spec: Expression Types as ParameterValue

## Objective

Enable arithmetic and vector expression instances to be used directly as `ParameterValue` arguments in GeometryBuilder methods. Currently, passing `AddExpression`, `SubtractExpression`, `MultiplyExpression`, `DivideExpression`, or `VectorExpression` instances to methods like `pointInCs` results in a TypeScript type error, requiring developers to manually access `.value`, `.dx`, or `.dy` properties.

**User**: Geometry DSL developers using expression-based computations for geometry coordinates.

**Success Criteria:**

- Expression instances pass type-check when used as coordinate arguments
- Backward compatibility maintained for existing `.value`/`.dx`/`.dy` access patterns
- Zero runtime behavior changes
- All existing code continues to compile

## Tech Stack

- **Language**: TypeScript (ESM)
- **Framework**: Existing GeometryBuilder DSL (`app2/src/geometry/dsl/`)
- **Dependencies**: None new

## Commands

```bash
# Type check
pnpm type-check:app2

# Build
pnpm build

# Tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## Project Structure

```
app2/src/geometry/dsl/
├── types.ts                          # ParameterValue type definition (MODIFY)
├── GeometryBuilder.ts               # Builder methods (NO CHANGE)
├── expressions/
│   ├── GeometryExpression.ts        # Base expression interface
│   ├── operations/
│   │   ├── AddExpression.ts         # Needs ParameterValue compatibility
│   │   ├── SubtractExpression.ts    # Needs ParameterValue compatibility
│   │   ├── MultiplyExpression.ts    # Needs ParameterValue compatibility
│   │   ├── DivideExpression.ts      # Needs ParameterValue compatibility
│   │   └── VectorExpression.ts      # Needs ParameterValue compatibility
└── GeometryFeatureReference.ts      # Feature reference implementation

backlog/dsl/
└── SPEC-expression-parameter-value.md  # This document
```

## Code Style

Match existing DSL type definitions and expression patterns. Prefer type union extensions over interface modifications for minimal impact.

### Naming Conventions

| Entity          | Convention          | Example                                |
| --------------- | ------------------- | -------------------------------------- |
| Type names      | PascalCase          | `ParameterValue`, `GeometryExpression` |
| Interface names | PascalCase + suffix | `GeometryFeatureReferenceLike`         |
| Property names  | camelCase           | `sourceId`, `property`                 |

## Current Problem

### Type Error

```typescript
// Current code that fails type-check:
const expr = builder.add("sum", 10, 20);
const p = builder.pointInCs("p", cs, expr, expr); // ERROR

// Error message:
error TS2345: Argument of type 'AddExpression<TConfig>' is not assignable
to parameter of type 'ParameterValue<TConfig>'.
Type 'AddExpression<TConfig>' is missing the following properties from
type 'GeometryFeatureReferenceLike': sourceId, property
```

### Current Workaround

```typescript
// Must use .value property:
const expr = builder.add("sum", 10, 20);
const p = builder.pointInCs("p", cs, expr.value, expr.value); // Works

// For VectorExpression, must use .dx/.dy:
const vec = builder.vector("v", cs1, cs2);
const p = builder.pointInCs("p", cs, vec.dx, vec.dy); // Works
```

## Desired Behavior

### Direct Usage

```typescript
// Should compile without error:
const expr = builder.add("sum", 10, 20);
const p = builder.pointInCs("p", cs, expr, expr); // OK

const vec = builder.vector("v", cs1, cs2);
const p = builder.pointInCs("p", cs, vec, vec); // OK (uses vec.x)
```

### Backward Compatibility

```typescript
// Existing patterns must continue to work:
const expr = builder.add("sum", 10, 20);
const p = builder.pointInCs("p", cs, expr.value, expr.value); // Still OK

const vec = builder.vector("v", cs1, cs2);
const p = builder.pointInCs("p", cs, vec.dx, vec.dy); // Still OK
```

## Testing Strategy

**Framework**: Vitest

**Test Location**: Existing tests in `app2/test/vectorTranslation.test.ts` and other DSL test files

| Test Level  | Concern            | Coverage                                        |
| ----------- | ------------------ | ----------------------------------------------- |
| Unit        | Type compatibility | Expression instances accepted as ParameterValue |
| Integration | Builder methods    | pointInCs, line, circle accept expressions      |
| Integration | Existing code      | No regressions in current usage patterns        |

**Test Cases:**

1. AddExpression instance passed to pointInCs x coordinate
2. AddExpression instance passed to pointInCs y coordinate
3. VectorExpression instance passed to pointInCs x coordinate (uses .x)
4. VectorExpression instance passed to pointInCs y coordinate (uses .y)
5. SubtractExpression, MultiplyExpression, DivideExpression instances as coordinates
6. Existing `.value`/`.dx`/`.dy` access patterns still compile
7. All existing tests continue to pass

## Architecture Design

### Current Type Definitions

```typescript
// types.ts
export interface GeometryFeatureReferenceLike {
  readonly type: "geometry_feature_reference";
  readonly sourceId: string;
  readonly property: PropertyKey;
}

export type ParameterValue<TConfig> =
  | number
  | keyof TConfig
  | GeometryFeatureReferenceLike;

// Expression classes
export class AddExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  // ... does NOT implement GeometryFeatureReferenceLike
  get value(): GeometryFeatureReference<TConfig, Point, "x"> { ... }
}
```

### Proposed Solution: Extend ParameterValue Union

```typescript
// types.ts - MODIFY
export type ParameterValue<TConfig> =
  | number
  | keyof TConfig
  | GeometryFeatureReferenceLike
  | GeometryExpression<TConfig, "point">; // NEW: Accept expression instances
```

This allows any point-typed expression to be used directly. The GeometryExpression interface already has `id` and `type` properties that can serve as the identifier.

### Alternative: Expression Accessor Interface

```typescript
// New interface in types.ts
export interface ExpressionAccessor<TConfig> {
  readonly expressionId: string;
  readonly property?: PropertyKey; // Optional: defaults to "x" for arithmetic expressions
}

// Extend ParameterValue
export type ParameterValue<TConfig> =
  | number
  | keyof TConfig
  | GeometryFeatureReferenceLike
  | ExpressionAccessor<TConfig>;

// Modify expression classes to provide accessor
class AddExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  // ... existing code ...

  get accessor(): ExpressionAccessor<TConfig> {
    return { expressionId: this.id, property: "x" };
  }
}
```

## Boundaries

### Always Do

- Maintain backward compatibility with `.value`/`.dx`/`.dy` access patterns
- Run `pnpm type-check:app2` before considering implementation complete
- Update all affected expression classes consistently
- Document type changes in code comments

### Ask First

- Changes to core type definitions (`ParameterValue`, `GeometryFeatureReferenceLike`)
- Modifications to base `GeometryExpression` interface
- Adding new properties to expression classes

### Never Do

- Break existing type-check in any file
- Introduce `any` types in type definitions
- Remove or deprecate existing `.value`/`.dx`/`.dy` properties
- Commit without passing `pnpm type-check:app2`

## Success Criteria

Implementation complete when:

1. **Code Quality**
   - [ ] `pnpm type-check:app2` passes with no new errors
   - [ ] `pnpm lint` passes with no new errors
   - [ ] `pnpm format` passes (code properly formatted)
   - [ ] No `any` types introduced

2. **Functionality**
   - [ ] Expression instances accepted as `ParameterValue` in all GeometryBuilder methods
   - [ ] `pointInCs(cs, expr, expr)` compiles without error
   - [ ] `pointInCs(cs, vec, vec)` compiles without error
   - [ ] VectorExpression uses `.x` for x-coordinate, `.y` for y-coordinate

3. **Correctness**
   - [ ] Arithmetic expressions resolve to their `.value` property when used as ParameterValue
   - [ ] VectorExpression resolves to `.x` for x, `.y` for y when used as ParameterValue
   - [ ] Dependency tracking works correctly (expressions tracked as dependencies)

4. **Backward Compatibility**
   - [ ] Existing `.value`/`.dx`/`.dy` access patterns continue to work
   - [ ] All existing tests pass without modification
   - [ ] No breaking changes to existing code

5. **Documentation**
   - [ ] Type changes documented in code comments
   - [ ] Examples updated if any documentation exists

## Open Questions

1. **Approach selection**: Extend `ParameterValue` union (simpler) vs create `ExpressionAccessor` interface (more explicit)?
2. **Property resolution**: For VectorExpression, should passing the instance to x-coordinate use `.x` automatically, or require explicit property specification?
3. **Scope**: Should this apply to ALL `GeometryExpression` types or only point-typed expressions?

## Decisions

| #   | Decision        | Options                               | Recommendation                                                         | Status  |
| --- | --------------- | ------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Approach        | Union extension vs Accessor interface | **Union extension** (minimal change, leverages existing expression.id) | PENDING |
| 2   | Vector property | Auto-select x/y vs require explicit   | **Auto-select based on coordinate** (x uses .x, y uses .y)             | PENDING |
| 3   | Scope           | All expressions vs point-typed only   | **Point-typed only** (arithmetic and vector expressions)               | PENDING |

## Appendix A: Example Use Cases

### Use Case 1: Point Translation with Vector

```typescript
const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
const vec = builder.vector("vec", cs, cs2);

// Current (works):
const p1 = builder.pointInCs("p1", cs2, vec.dx, vec.dy);

// Desired (should work):
const p1 = builder.pointInCs("p1", cs2, vec, vec);
```

### Use Case 2: Arithmetic in Coordinates

```typescript
const offset = builder.add("offset", 10, 5);

// Current (works):
const p = builder.pointInCs("p", cs, offset.value, offset.value);

// Desired (should work):
const p = builder.pointInCs("p", cs, offset, offset);
```

### Use Case 3: Mixed Usage

```typescript
const vec = builder.vector("vec", cs1, cs2);
const offset = builder.add("offset", vec.dx, 10);

// Should all work:
const p = builder.pointInCs(
  "p",
  cs,
  builder.subtract("x", vec.dx, 5), // Expression
  offset, // Expression
  vec.dy, // Feature reference
  10, // Literal
);
```
