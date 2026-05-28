# Spec: Vector Translation Support in DSL

## Objective

Enable vector-based point translation in the declarative geometry DSL. Currently, attempting to compute vector differences between coordinate systems (e.g., `cs.x - cs2.x`) produces NaN because `GeometryFeatureReference` objects cannot be subtracted directly. This prevents expressing geometric transformations as vector operations.

**User**: Geometry construction developers needing to translate points using computed vectors.

**Success Criteria:**

- [ ] Vector arithmetic (addition, subtraction) supported for `ParameterValue` types
- [ ] `cs.x - cs2.x` pattern produces numeric vector component, not NaN
- [ ] Points can be defined as `p1x + vector_dx, p1y + vector_dy` in DSL
- [ ] Type-safe API with no `any` casts required
- [ ] Compatible with existing `GeometryBuilder` API
- [ ] Zero breaking changes to existing DSL code

## Tech Stack

- **Language**: TypeScript (ESM)
- **Framework**: Existing GeometryBuilder DSL (`app2/src/geometry/dsl/`)
- **Dependencies**: None new (uses existing expression pattern)

## Commands

```bash
# Type check
pnpm type-check:app2

# Lint
pnpm lint

# Format check
pnpm format

# Format fix
pnpm format:fix

# Tests
pnpm test

# Build
pnpm build
```

## Project Structure

```
app2/src/geometry/dsl/
├── expressions/
│   ├── operations/
│   │   ├── VectorExpression.ts          # NEW: dx, dy computation
│   │   ├── AddExpression.ts             # NEW: a + b
│   │   ├── SubtractExpression.ts        # NEW: a - b
│   │   ├── MultiplyExpression.ts        # NEW: a * b
│   │   └── DivideExpression.ts          # NEW: a / b
│   └── index.ts                         # MODIFY: export new expressions
├── GeometryBuilder.ts                   # MODIFY: add helper methods
└── types.ts                             # No changes needed

app2/src/geometry/
└── __tests__/
    └── vectorTranslation.test.ts        # NEW: tests for vector operations

backlog/dsl/
└── SPEC-vector-translation.md           # This document
```

## Code Style

Match existing DSL expression patterns. See `DistanceExpression.ts` for reference implementation pattern.

### Naming Conventions

| Entity             | Convention              | Example                                           |
| ------------------ | ----------------------- | ------------------------------------------------- |
| Expression classes | PascalCase + Expression | `VectorExpression`, `AddExpression`               |
| Method names       | camelCase               | `vector`, `add`, `subtract`, `multiply`, `divide` |
| Property accessors | getters                 | `get dx()`, `get dy()`, `get value()`             |
| Helper methods     | builder prefix          | `builder.vector()`, `builder.add()`               |

### Example Structure

```typescript
// VectorExpression.ts - computes dx, dy between two points/coordinate systems
import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point } from "@/types/geometry";
import { getGeometry } from "../../../operations";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointLikeExpression, CoordinateSystemLikeExpression } from "../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import type { ParameterValue } from "../../types";

export class VectorExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[] = [];

  private readonly fromId: string;
  private readonly toId: string;

  constructor(
    id: string,
    from: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
    to: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
  ) {
    this.id = id;
    this.fromId = from.id;
    this.toId = to.id;
    this.dependencies = [from.id, to.id];
  }

  get dx(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  get dy(): GeometryFeatureReference<TConfig, Point, "y"> {
    return new GeometryFeatureReference(this, "y");
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _params: TConfig,
      ): Map<string, GeometryValue> => {
        const fromValue = inputs.get(this.fromId);
        const toValue = inputs.get(this.toId);
        if (!fromValue || !toValue) {
          throw new Error(`VectorExpression ${this.id}: missing geometry`);
        }
        const fromX = (fromValue as Point).x;
        const fromY = (fromValue as Point).y;
        const toX = (toValue as Point).x;
        const toY = (toValue as Point).y;
        const dx = toX - fromX;
        const dy = toY - fromY;
        return new Map([[this.id, point(dx, dy)]]);
      },
      draw: (): void => {},
    };
  }
}

// Usage in sixfoldDslV1Steps.ts
const vec = builder.vector("vec_cs_cs2", cs, cs2);
const p1 = builder.pointInCs(
  "p1",
  cs2,
  builder.add("p1x_translated", builder.param("p1x"), vec.dx),
  builder.add("p1y_translated", builder.param("p1y"), vec.dy),
);
```

## Testing Strategy

**Framework**: Vitest

**Test Location**: `app2/src/geometry/__tests__/vectorTranslation.test.ts`

| Test Level  | Concern            | Coverage                                                  |
| ----------- | ------------------ | --------------------------------------------------------- |
| Unit        | VectorExpression   | dx, dy computed correctly                                 |
| Unit        | AddExpression      | Sum of two ParameterValues                                |
| Unit        | SubtractExpression | Difference of two ParameterValues                         |
| Integration | Builder methods    | `builder.vector()`, `builder.add()`, `builder.subtract()` |
| Integration | Chained operations | `add(subtract(a, b), c)`                                  |
| Integration | With pointInCs     | Vector translation in coordinate systems                  |

**Test Cases:**

1. Vector between two points: dx = p2.x - p1.x, dy = p2.y - p1.y
2. Vector between coordinate systems: dx = cs2.x - cs.x, dy = cs2.y - cs.y
3. Add two config params: result = paramA + paramB
4. Subtract config param from feature ref: result = cs.x - paramOffset
5. Chained: `add(paramX, subtract(cs2.x, cs.x))`
6. Point translation: p defined as (p1x + dx, p1y + dy) produces correct absolute position
7. Type safety: All expressions properly typed, no `any`

## Boundaries

### Always Do

- Follow existing expression pattern (see `DistanceExpression`)
- Maintain type safety throughout
- Add JSDoc comments to all new types and methods
- Keep expressions immutable
- Use existing `GeometryFeatureReference` for output access

### Ask First

- Changes to `ParameterValue` type definition
- Modifications to core expression compilation logic
- Adding new geometry value types

### Never Do

- Modify existing expression implementations
- Break existing type-check, lint, or test
- Use `any` type in new code
- Commit without passing `pnpm type-check:app2`

## Architecture Design

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vector Translation Support                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              GeometryBuilder (EXTENDED)                         │  │
│  │   + vector(id, from, to): VectorExpression                     │  │
│  │   + add(id, a, b): AddExpression                               │  │
│  │   + subtract(id, a, b): SubtractExpression                     │  │
│  │   + multiply(id, a, b): MultiplyExpression                      │  │
│  │   + divide(id, a, b): DivideExpression                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │VectorExpression│    │  AddExpression  │    │SubtractExpression│      │
│  │  .dx         │    │                │    │                │        │
│  │  .dy         │    │  .value       │    │  .value       │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│  ┌──────────────┐    ┌──────────────┐                              │
│  │MultiplyExpression│    │DivideExpression │                         │
│  │  .value      │    │  .value       │                         │
│  └──────────────┘    └──────────────┘                              │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              ParameterValue (EXTENDED)                          │  │
│  │   number | keyof TConfig | GeometryFeatureReference |      │  │
│  │   | AddExpression | SubtractExpression | VectorExpression    │  │
│  │   | MultiplyExpression | DivideExpression                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Expression Pattern**: Follow `DistanceExpression` model - expressions that compute values and expose them via feature references
2. **VectorExpression**: Computes (dx, dy) between two geometry objects, stores as point with x=dx, y=dy, exposes `.dx` and `.dy`
3. **Arithmetic Expressions**: `AddExpression`, `SubtractExpression`, `MultiplyExpression`, `DivideExpression` compute scalar values, expose `.value`
4. **Builder Helpers**: Add `builder.vector()`, `builder.add()`, `builder.subtract()`, `builder.multiply()`, `builder.divide()` for ergonomic API
5. **Type Extension**: `ParameterValue` type remains unchanged (already accepts `GeometryFeatureReferenceLike`, which new expressions implement)
6. **Lazy Creation**: Expressions are created lazily on first use of their accessor properties

### Data Flow

```
User Code:
  builder.vector("vec1", cs, cs2)
  → VectorExpression("vec1", cs.id, cs2.id)
  → Step: compute dx = cs2.x - cs.x, dy = cs2.y - cs.y
  → Output: point(dx, dy) stored as "vec1"
  → Access: vec1.dx (GeometryFeatureReference to vec1.x)

User Code:
  builder.add("sum1", builder.param("p1x"), vec1.dx)
  → AddExpression("sum1", paramRef("p1x"), vec1.dx)
  → Step: compute sum = p1x + dx
  → Output: point(sum, 0) stored as "sum1"
  → Access: sum1.value (GeometryFeatureReference to sum1.x)
```

## Configuration

No configuration changes needed. Uses existing `SixFoldV0Config`.

## Dependencies

### File Dependencies

```
app2/src/geometry/dsl/expressions/operations/VectorExpression.ts (NEW)
├── app2/src/geometry/dsl/GeometryFeatureReference.ts
├── app2/src/geometry/dsl/expressions/GeometryExpression.ts
├── app2/src/geometry/dsl/expressions/types.ts
└── app2/src/types/geometry.ts

app2/src/geometry/dsl/expressions/operations/AddExpression.ts (NEW)
├── app2/src/geometry/dsl/GeometryFeatureReference.ts
├── app2/src/geometry/dsl/expressions/GeometryExpression.ts
└── app2/src/types/geometry.ts

app2/src/geometry/dsl/expressions/operations/SubtractExpression.ts (NEW)
├── app2/src/geometry/dsl/GeometryFeatureReference.ts
├── app2/src/geometry/dsl/expressions/GeometryExpression.ts
└── app2/src/types/geometry.ts

app2/src/geometry/dsl/expressions/operations/MultiplyExpression.ts (NEW)
├── app2/src/geometry/dsl/GeometryFeatureReference.ts
├── app2/src/geometry/dsl/expressions/GeometryExpression.ts
└── app2/src/types/geometry.ts

app2/src/geometry/dsl/expressions/operations/DivideExpression.ts (NEW)
├── app2/src/geometry/dsl/GeometryFeatureReference.ts
├── app2/src/geometry/dsl/expressions/GeometryExpression.ts
└── app2/src/types/geometry.ts

app2/src/geometry/dsl/GeometryBuilder.ts (MODIFY)
├── + import VectorExpression
├── + import AddExpression
├── + import SubtractExpression
├── + import MultiplyExpression
├── + import DivideExpression
├── + vector() method
├── + add() method
├── + subtract() method
├── + multiply() method
└── + divide() method

app2/src/geometry/dsl/expressions/operations/index.ts (MODIFY)
├── + export VectorExpression
├── + export AddExpression
├── + export SubtractExpression
├── + export MultiplyExpression
└── + export DivideExpression
```

## Success Criteria

Implementation complete when:

1. **Code Quality**
   - [ ] `pnpm type-check:app2` passes with no errors
   - [ ] `pnpm lint` passes with no errors
   - [ ] `pnpm format` passes (code properly formatted)
   - [ ] No `any` types used
   - [ ] All new symbols have JSDoc comments

2. **Functionality**
   - [ ] `builder.vector(id, from, to)` creates VectorExpression
   - [ ] `builder.add(id, a, b)` creates AddExpression
   - [ ] `builder.subtract(id, a, b)` creates SubtractExpression
   - [ ] `builder.multiply(id, a, b)` creates MultiplyExpression
   - [ ] `builder.divide(id, a, b)` creates DivideExpression
   - [ ] VectorExpression exposes `.dx` and `.dy` properties
   - [ ] Arithmetic expressions expose `.value` property
   - [ ] All expressions compile to valid Steps
   - [ ] Expressions created lazily (on first access)

3. **Correctness**
   - [ ] Vector between cs and cs2: dx = cs2.x - cs.x, dy = cs2.y - cs.y
   - [ ] Add: result = a + b
   - [ ] Subtract: result = a - b
   - [ ] Multiply: result = a \* b
   - [ ] Divide: result = a / b
   - [ ] Geometry values correct within floating point tolerance (1e-9)
   - [ ] Dependency tracking works (expressions depend on inputs)

4. **Integration**
   - [ ] `sixfoldDslV1Steps.ts` can use new expressions without `any` casts
   - [ ] NaN issue resolved in user's code
   - [ ] Existing `pnpm test` passes
   - [ ] Existing `pnpm build` passes
   - [ ] No breaking changes to existing code

5. **Tests**
   - [ ] All vectorTranslation.test.ts tests pass
   - [ ] Coverage for all new expression types

## Test-Driven Development

```typescript
// app2/src/geometry/__tests__/vectorTranslation.test.ts
import { GeometryBuilder } from "../dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "../dsl/renderers/DefaultRenderer";
import { executeSteps } from "../stepExecution";
import { approx } from "@sg/geometry";

interface TestConfig {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

describe("Vector Translation", () => {
  const config: TestConfig = { p1x: 10, p1y: 20, p2x: 30, p2y: 40 };

  describe("VectorExpression", () => {
    it("computes dx and dy between coordinate systems", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      const vec = builder.vector("vec", cs, cs2);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const vecResult = results.get("vec");

      expect(approx(vecResult.x, 100)).toBeTrue(); // cs2.x - cs.x = 100 - 0
      expect(approx(vecResult.y, 200)).toBeTrue(); // cs2.y - cs.y = 200 - 0
    });

    it("computes dx and dy between points", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const p1 = builder.point("p1", 10, 20);
      const p2 = builder.point("p2", 40, 60);
      const vec = builder.vector("vec", p1, p2);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const vecResult = results.get("vec");

      expect(approx(vecResult.x, 30)).toBeTrue(); // 40 - 10
      expect(approx(vecResult.y, 40)).toBeTrue(); // 60 - 20
    });
  });

  describe("AddExpression", () => {
    it("adds two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const sum = builder.add("sum", 10, 20);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const sumResult = results.get("sum");

      expect(approx(sumResult.x, 30)).toBeTrue();
    });

    it("adds config param and vector component", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      const vec = builder.vector("vec", cs, cs2);
      const sumX = builder.add("sumX", builder.param("p1x"), vec.dx);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const sumResult = results.get("sumX");

      expect(approx(sumResult.x, 110)).toBeTrue(); // 10 + 100
    });
  });

  describe("SubtractExpression", () => {
    it("subtracts two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const diff = builder.subtract("diff", 20, 10);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const diffResult = results.get("diff");

      expect(approx(diffResult.x, 10)).toBeTrue();
    });
  });

  describe("MultiplyExpression", () => {
    it("multiplies two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const product = builder.multiply("product", 10, 3);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const productResult = results.get("product");

      expect(approx(productResult.x, 30)).toBeTrue();
    });
  });

  describe("DivideExpression", () => {
    it("divides two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const quotient = builder.divide("quotient", 30, 10);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const quotientResult = results.get("quotient");

      expect(approx(quotientResult.x, 3)).toBeTrue();
    });
  });

  describe("Point Translation", () => {
    it("translates point using vector components", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      const vec = builder.vector("vec_cs_cs2", cs, cs2);

      const p1 = builder.pointInCs(
        "p1",
        cs2,
        builder.add("p1x_translated", builder.param("p1x"), vec.dx),
        builder.add("p1y_translated", builder.param("p1y"), vec.dy),
      );

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const p1Result = results.get("p1");

      // p1 in cs2 at (10+100, 20+200) = (110, 220) local
      // cs2 at (100, 200) absolute
      // globalX = 100 + 110 = 210, globalY = 200 + 220 = 420
      expect(approx(p1Result.x, 210)).toBeTrue();
      expect(approx(p1Result.y, 420)).toBeTrue();
    });
  });

  describe("Chained Operations", () => {
    it("chains arithmetic operations", () => {
      const builder = new GeometryBuilder<TestConfig>();
      // (10 + 20) * 2 = 60
      const sum = builder.add("sum", 10, 20);
      const product = builder.multiply("product", sum.value, 2);

      const steps = builder.compile();
      const results = executeSteps(steps, config);
      const productResult = results.get("product");

      expect(approx(productResult.x, 60)).toBeTrue();
    });
  });
});
```

## Decisions

| #   | Decision           | Options                      | Recommendation                            | Status       |
| --- | ------------------ | ---------------------------- | ----------------------------------------- | ------------ |
| 1   | Arithmetic scope   | Add/Sub only vs Full (+-\*/) | **Full (+-\*/)**                          | **RESOLVED** |
| 2   | Property naming    | `.value` vs specific         | **`.value`**                              | **RESOLVED** |
| 3   | Vector from points | Yes vs No                    | **Yes**                                   | **RESOLVED** |
| 4   | Expression types   | Separate classes vs Generic  | **Separate classes** (clearer, type-safe) | **RESOLVED** |
| 5   | Creation           | Eager vs Lazy                | **Lazy**                                  | **RESOLVED** |

## Appendix A: Current Problem Code

```typescript
// sixfoldDslV1Steps.ts - Lines 27-28 (WRONG - produces NaN)
const x_vector_cs2_cs = (cs.x as any) - (cs2.x as any); // NaN
const y_vector_cs2_cs = (cs.y as any) - (cs2.y as any); // NaN

// Lines 31-32 (WRONG - uses NaN values)
const p1 = builder.pointInCs(
  "p1",
  cs2,
  (builder.param("p1x") as any) + x_vector_cs2_cs,
  (builder.param("p1y") as any) + y_vector_cs2_cs,
);
```

**Why it fails:** `cs.x` and `cs2.x` are `GeometryFeatureReference` objects. Subtracting objects with `-` operator produces NaN.
