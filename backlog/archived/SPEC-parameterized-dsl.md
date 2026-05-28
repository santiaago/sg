# Spec: Parameterized Geometry DSL with Geometry Feature References

## Table of Contents

1. [Objective](#objective)
2. [Tech Stack](#tech-stack)
3. [Commands](#commands)
4. [Project Structure](#project-structure)
5. [Code Style](#code-style)
6. [Testing Strategy](#testing-strategy)
7. [Boundaries](#boundaries)
8. [Success Criteria](#success-criteria)
9. [Core Concepts](#core-concepts)
10. [Architecture Overview](#architecture-overview)
11. [Type System](#type-system)
12. [Expression Interface](#expression-interface)
13. [Parameter Sources](#parameter-sources)
14. [Expression Implementations](#expression-implementations)
15. [Builder Integration](#builder-integration)
16. [Dependency Tracking](#dependency-tracking)
17. [Example: Square Construction](#example-square-construction)
18. [Migration Strategy](#migration-strategy)
19. [Open Questions](#open-questions)
20. [Decision Log](#decision-log)
21. [References](#references)
22. [Appendix](#appendix)

---

## Document Info

- **Status:** Draft for Review
- **Author:** Mistral Vibe
- **Date:** 2025-01-XX
- **Related PR:** `sas/wt-01-geo-framework-spec` branch

---

## Objective

### Problem Statement

The Geometry DSL currently requires all numeric values (radius, coordinates, ratios, lengths) to be hardcoded at construction time. This creates several problems:

1. **Couples computation from declaration** — Values must be pre-computed before building geometry expressions
2. **Reduces reusability** — Expressions cannot adapt to different configurations without reconstruction
3. **Clutters code** — Requires `computeSquareConfig()` to be called before building steps
4. **Duplicates values** — Same geometric properties (e.g., radius) must be repeated across multiple expressions
5. **Hides relationships** — Geometric dependencies are implicit (via config) rather than explicit

### Solution

Implement a **unified parameterization system** that allows geometry expressions to reference numeric values from **two sources**:

1. **Configuration parameters** — External values from a `TConfig` object
2. **Geometry features** — Properties of other geometry expressions (e.g., `c1.r` for a circle's radius)

This creates a **declarative, type-safe, dependency-tracked** system where:

- Geometry structure is separate from value computation
- Relationships between geometries are explicit
- The same expression graph can produce different results with different inputs
- No value duplication or pre-computation is required

### User Stories

**As a geometry construction author**, I want to:

- Reference configuration values by key so I can separate declaration from computation
- Reference properties from existing geometries so I can express direct geometric relationships
- Mix both approaches in the same construction for maximum flexibility
- Have all dependencies automatically tracked for correct execution order

---

## Tech Stack

- **Language:** TypeScript 5.x (ESM)
- **Framework:** React (app2)
- **Build:** Vite + Vitest
- **Lint/Format:** Oxlint + Oxfmt
- **Type Check:** `tsc --noEmit`

---

## Commands

```bash
# Install dependencies
pnpm install

# Type checking (geometry package only)
pnpm type-check:geometry

# Type checking (app2 only)
pnpm type-check:app2

# Type checking (all)
pnpm type-check

# Run all tests
pnpm test

# Run app2 tests only
cd app2 && pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint and format check
pnpm check

# Format fix
pnpm format:fix
```

---

## Project Structure

```
app2/
├── src/
│   └── geometry/
│       ├── dsl/
│       │   ├── GeometryBuilder.ts                    # Main DSL facade
│       │   ├── GeometryFeatureReference.ts           # Feature reference class
│       │   ├── expressions/
│       │   │   ├── GeometryExpression.ts              # Base expression interface
│       │   │   ├── types.ts                           # Expression type definitions
│       │   │   ├── CircleExpression.ts                # Circle expression
│       │   │   ├── PointExpression.ts                 # Point expression
│       │   │   ├── PointInCoordinateSystemExpression.ts
│       │   │   ├── LineExpression.ts                  # Line expression
│       │   │   ├── CoordinateSystemExpression.ts      # Coordinate system
│       │   │   ├── PolygonExpression.ts               # Polygon expression
│       │   │   └── operations/
│       │   │       ├── PointAtExpression.ts          # Point-at operation
│       │   │       ├── LineTowardsExpression.ts       # Line-towards operation
│       │   │       ├── IntersectionExpression.ts      # Line-circle intersection
│       │   │       └── CircleIntersectionExpression.ts # Circle-circle intersection
│       │   └── renderers/
│       │       └── types.ts                          # Renderer type definitions
│       ├── operations.ts                              # Config types + utilities
│       └── squareDslSteps.ts                          # Square construction example
└── test/
    ├── GeometryBuilder.test.ts                      # Expression tests
    ├── GeometryFeatureReference.test.ts             # Feature reference tests
    └── square-construction-equivalence.test.ts      # Equivalence tests
```

---

## Code Style

### Naming Conventions

| Concept                 | Convention                             | Example                                            |
| ----------------------- | -------------------------------------- | -------------------------------------------------- |
| Expression classes      | PascalCase, suffix `Expression`        | `CircleExpression`, `PointAtExpression`            |
| Feature reference class | PascalCase, suffix `Reference`         | `GeometryFeatureReference`                         |
| Builder methods         | camelCase                              | `pointInCs`, `circle`, `param`, `geom`             |
| Config types            | PascalCase, suffix `Config`            | `SquareConfig`                                     |
| Config keys             | SCREAMING_SNAKE_CASE                   | `CIRCLE_RADIUS`, `C1_POSITION_RATIO`               |
| Geometry IDs            | lowercase_with_underscores             | `p1`, `c1_c`, `line_main`                          |
| Private fields          | `private readonly`                     | `private readonly radius: ParameterValue<TConfig>` |
| Type aliases            | PascalCase                             | `ParameterValue`, `NumericPropertyOf`              |
| Helper functions        | camelCase, prefix `is` for type guards | `isGeometryFeatureReference`                       |

### Type Safety Rules

1. **All numeric parameters** must accept `ParameterValue<TConfig>` which is:

   ```typescript
   type ParameterValue<TConfig> =
     | number // Literal value
     | keyof TConfig // Config parameter reference
     | GeometryFeatureReference<TConfig, any, any>; // Geometry feature reference
   ```

2. **Type guards** must be used for runtime checks:
   - `typeof value === "string"` → config parameter
   - `isGeometryFeatureReference(value)` → feature reference
   - Otherwise → numeric literal

3. **Feature accessors** must return `GeometryFeatureReference`, not the actual value

4. **Never use `any`** for parameter or feature reference types

5. **All generic types** must be properly constrained

### Example Pattern

```typescript
// Expression class with parameter support
class CircleExpression<TConfig> implements GeometryExpression<TConfig, "circle"> {
  readonly id: string;
  readonly type = "circle" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly centerId: string;
  private readonly radius: ParameterValue<TConfig>;

  // Feature accessors - return references, not values
  get r(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return new GeometryFeatureReference(this, "r");
  }
  get radius(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return this.r;
  }

  constructor(id: string, center: PointLikeExpression<TConfig>, radius: ParameterValue<TConfig>) {
    this.id = id;
    this.centerId = center.id;
    this.radius = radius;
    this.dependencies = [center.id];
    this.parameters = [];

    // Track dependencies based on radius type
    if (isGeometryFeatureReference(radius)) {
      this.dependencies.push(radius.sourceId);
    } else if (typeof radius === "string") {
      this.parameters.push(radius as keyof TConfig);
    }
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>, params: TConfig) => {
        const center = inputs.get(this.centerId);
        if (!center || !isPoint(center)) {
          throw new Error(`CircleExpression ${this.id}: missing or invalid center`);
        }

        const r = this.resolveNumber(inputs, params, this.radius, "radius");
        return new Map([[this.id, circle(center.x, center.y, r)]]);
      },
      draw: renderer.drawCircle.bind(null, this.id),
    };
  }

  // Shared resolution helper
  private resolveNumber(
    inputs: Map<string, GeometryValue>,
    params: TConfig,
    value: ParameterValue<TConfig>,
    paramName: string,
  ): number {
    if (typeof value === "number") {
      return value;
    } else if (typeof value === "string") {
      const result = params[value as keyof TConfig] as number | undefined;
      if (result === undefined) {
        throw new Error(`Missing config parameter: ${value}`);
      }
      return result;
    } else if (isGeometryFeatureReference(value)) {
      return value.resolve(inputs);
    }
    throw new Error(`Invalid ${paramName} type`);
  }
}
```

---

## Testing Strategy

### Test Framework

- **Unit tests:** Vitest (`test/*.test.ts`)
- **Integration tests:** Vitest (`test/*.test.tsx`)
- **E2E tests:** Playwright (`e2e/*.spec.ts`)

### Coverage Expectations

| Area                                                         | Coverage                    |
| ------------------------------------------------------------ | --------------------------- |
| `GeometryFeatureReference` class                             | 100%                        |
| All expression classes                                       | 100%                        |
| All parameter source types (number, config, feature)         | 100%                        |
| All geometry types (Point, Line, Circle, etc.)               | 100%                        |
| Error paths (missing config, missing geometry, invalid type) | 100%                        |
| Type safety                                                  | Verified via `tsc --noEmit` |

### Test Locations

```
app2/test/
├── GeometryFeatureReference.test.ts    # Feature reference unit tests
├── GeometryBuilder.test.ts             # Builder + expression tests
├── CircleExpression.test.ts            # Circle with all parameter types
├── PointExpression.test.ts             # Point with all parameter types
├── LineTowardsExpression.test.ts       # LineTowards with all parameter types
├── PointAtExpression.test.ts           # PointAt with all parameter types
├── square-construction-equivalence.test.ts # Integration tests
└── parameter-resolution.test.ts        # Parameter resolution edge cases
```

### Verification Commands

```bash
# Run all app2 tests
cd app2 && pnpm test

# Run specific test files
cd app2 && pnpm test GeometryFeatureReference
cd app2 && pnpm test parameter-resolution

# Type check
cd app2 && npx tsc --noEmit

# Verify no regressions
cd app2 && pnpm test --run
```

---

## Boundaries

### Always Do

1. ✅ **Maintain backward compatibility** — All existing code with numeric literals must continue to work unchanged
2. ✅ **Preserve type safety** — No `any` types, all generics properly constrained
3. ✅ **Follow existing patterns** — All expressions use the same parameter resolution approach
4. ✅ **Track all dependencies** — Both config parameters and geometry features must be tracked
5. ✅ **Update JSDoc** — All new code has complete documentation
6. ✅ **Zero runtime overhead** — Feature references are lightweight, resolution at compute time
7. ✅ **Validate at runtime** — Throw descriptive errors for missing/invalid references
8. ✅ **Resolve at compute time** — Never resolve feature references at construction time

### Ask First

1. ❓ Breaking changes to `GeometryExpression` or `Step` interfaces
2. ❓ Adding new runtime dependencies
3. ❓ Modifying type definitions in shared packages
4. ❓ Changes to existing public API signatures
5. ❓ Performance-sensitive changes to compute methods

### Never Do

1. ❌ Commit code that doesn't pass `pnpm type-check`
2. ❌ Commit code that doesn't pass `pnpm test`
3. ❌ Use `@ts-nocheck` or inline suppressions without justification
4. ❌ Leave dead code or commented-out code
5. ❌ Introduce circular dependencies
6. ❌ Resolve feature references at construction time
7. ❌ Use string literals for geometry IDs (must be type-checked)

---

## Success Criteria

### Functional Requirements

#### Core System

- [ ] `GeometryFeatureReference<TConfig, T, K>` class implemented
- [ ] `ParameterValue<TConfig>` type defined
- [ ] `NumericPropertyOf<T>` helper type defined
- [ ] `isGeometryFeatureReference()` type guard implemented
- [ ] `resolve()` method on feature references works correctly

#### Expression Support

- [ ] `CircleExpression` accepts `ParameterValue<TConfig>` for radius
- [ ] `CircleExpression` exposes `r`, `radius`, `cx`, `cy` feature accessors
- [ ] `PointInCoordinateSystemExpression` accepts `ParameterValue<TConfig>` for localX/localY
- [ ] `PointInCoordinateSystemExpression` exposes `x`, `y` feature accessors
- [ ] `LineTowardsExpression` accepts `ParameterValue<TConfig>` for length
- [ ] `LineTowardsExpression` exposes `x1`, `y1`, `x2`, `y2`, `length` feature accessors
- [ ] `PointAtExpression` accepts `ParameterValue<TConfig>` for ratio
- [ ] `PointAtExpression` exposes `x`, `y` feature accessors
- [ ] All other expressions maintain compatibility

#### Builder Integration

- [ ] `GeometryBuilder.param<K extends keyof TConfig>(key: K): K` implemented
- [ ] `GeometryBuilder.geom<T, K>(expr: GeometryExpression<TConfig, T>, key: K)` implemented
- [ ] All builder methods accept all `ParameterValue<TConfig>` types

#### Dependency Tracking

- [ ] Config parameter references tracked in `parameters` array
- [ ] Geometry feature references tracked in `dependencies` array
- [ ] Transitive dependencies handled correctly by topological sort
- [ ] Circular dependencies detected and reported

### Non-Functional Requirements

- [ ] All existing tests continue to pass (327+ tests)
- [ ] TypeScript compilation succeeds with `--noEmit`
- [ ] No runtime performance regression (< 5% impact)
- [ ] Code follows existing style and patterns
- [ ] JSDoc comments on all new functionality
- [ ] Feature reference resolution is O(1)

### Quality Gates

- [ ] `pnpm test` → exit code 0
- [ ] `pnpm type-check` → exit code 0
- [ ] `pnpm format:check` → exit code 0
- [ ] `pnpm lint` → exit code 0
- [ ] All new tests pass (minimum 30 new tests)
- [ ] Code coverage for new code: 100%

---

## Core Concepts

### Parameter Sources

The DSL supports **three sources** for numeric values:

| Source  | Type                                      | Example          | Use Case                    |
| ------- | ----------------------------------------- | ---------------- | --------------------------- |
| Literal | `number`                                  | `10`, `0.5`      | Hardcoded values            |
| Config  | `keyof TConfig`                           | `"circleRadius"` | External configuration      |
| Feature | `GeometryFeatureReference<TConfig, T, K>` | `c1.r`           | Another geometry's property |

### Unified Type: ParameterValue

```typescript
type ParameterValue<TConfig> = number | keyof TConfig | GeometryFeatureReference<TConfig, any, any>;
```

This single type represents all possible numeric inputs to geometry expressions.

### Geometry Feature Reference

A lightweight object that:

- Stores the **source geometry ID**
- Stores the **property name** to access
- Is **resolved at compute time** from the inputs Map
- Creates **explicit dependencies** between expressions

```typescript
class GeometryFeatureReference<TConfig, T extends GeometryValue, K extends keyof T> {
  readonly type = "geometry_feature_reference" as const;
  readonly sourceId: string;
  readonly property: K;

  resolve(inputs: Map<string, GeometryValue>): number;
}
```

### Feature Accessors

Each geometry expression exposes its numeric properties as **getters** that return `GeometryFeatureReference` objects:

```typescript
// Circle
c1.r; // Radius (short form)
c1.radius; // Radius (full name)
c1.cx; // Center X
c1.cy; // Center Y

// Point
p1.x; // X coordinate
p1.y; // Y coordinate

// Line
line1.x1; // Start X
line1.y1; // Start Y
line1.x2; // End X
line1.y2; // End Y
line1.length; // Computed length

// Coordinate System
cs.x; // Origin X
cs.y; // Origin Y
cs.arrowLength; // Arrow length
cs.rotation; // Rotation angle
```

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      User Code (Construction Author)                      │
├─────────────────────────────────────────────────────────────────────┤
│  builder.circle("c1", center, 10)                                     │
│  builder.circle("c2", center2, builder.param("radius"))              │
│  builder.circle("c3", center3, c1.r)                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GeometryBuilder<TConfig>                         │
├─────────────────────────────────────────────────────────────────────┤
│  expressions: Map<string, GeometryExpression<TConfig, any>>           │
│  param<K>(key: K): K                                                    │
│  geom<T, K>(expr: GeometryExpression<TConfig, T>, key: K): Reference   │
│  compile(): Step<TConfig>[]                                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GeometryExpression<TConfig, TType>                     │
├─────────────────────────────────────────────────────────────────────┤
│  + id: string                                                          │
│  + type: TType                                                        │
│  + dependencies: string[]  (geometry IDs this depends on)              │
│  + parameters: (keyof TConfig)[]  (config keys this needs)            │
│  + compile(): Step<TConfig>                                           │
│  + [feature accessors]  (e.g., r, x, y, cx, cy, length)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────────────────┬───────────────────────────┐
              ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Literal Value      │    │  Config Parameter    │    │ Geometry Feature     │
│   (number)           │    │  (keyof TConfig)     │    │ (GeometryFeatureRef) │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          GeometryFeatureReference                           │
├─────────────────────────────────────────────────────────────────────┤
│  + type: "geometry_feature_reference"                                   │
│  + sourceId: string  (ID of source geometry)                            │
│  + property: K  (property name on source)                              │
│  + resolve(inputs): number  (called at compute time)                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            Step<TConfig>                                    │
├─────────────────────────────────────────────────────────────────────┤
│  + id: string                                                          │
│  + inputs: string[]  (geometry IDs needed)                              │
│  + outputs: string[]  (geometry IDs produced)                           │
│  + parameters: (keyof TConfig)[]  (config keys needed)                 │
│  + compute(inputs, params): Map<string, GeometryValue>                 │
│  + draw(svg, values, store, theme): void                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Construction Time                        Compute Time
────────────────                        ────────────

1. User: builder.circle("c1", center, 10)
   ↓
2. Builder: Create CircleExpression
   - id: "c1"
   - centerId: "center"
   - radius: 10 (number)
   - dependencies: ["center"]
   - parameters: []
   ↓
3. Builder: Store in expressions Map
   ↓
4. User: builder.circle("c2", center2, c1.r)
   ↓
5. Builder: Create CircleExpression
   - id: "c2"
   - centerId: "center2"
   - radius: GeometryFeatureReference(c1, "r")
   - dependencies: ["center2", "c1"]  ← c1 added!
   - parameters: []
   ↓
6. Builder: Store in expressions Map
   ↓
7. User: builder.compile()
   ↓
8. Builder: Topological sort → [c1, c2]
   ↓
9. Step Execution:
   │
   ├─ Step 1: step_c1
   │   compute(inputs={center}, params):
   │   - Resolve radius: 10 (literal)
   │   - Return: Map["c1", Circle{...}]
   │
   └─ Step 2: step_c2
       compute(inputs={center2, c1}, params):
       - Resolve radius: c1.r.resolve()
       - c1.r.resolve() → inputs.get("c1").r → 10
       - Return: Map["c2", Circle{...}]
```

---

## Type System

### Core Types

```typescript
// File: app2/src/geometry/dsl/types.ts

import type { GeometryValue } from "@/types/geometry";
import type { GeometryExpression } from "./expressions/GeometryExpression";
import type { GeometryFeatureReference } from "./GeometryFeatureReference";

/**
 * All possible sources for a numeric parameter value.
 * This is the unified type that all expression numeric parameters accept.
 */
export type ParameterValue<TConfig> =
  | number
  | keyof TConfig
  | GeometryFeatureReference<TConfig, any, any>;

/**
 * Extract only the numeric property names from a GeometryValue type.
 * Used to ensure type safety when creating feature accessors.
 */
export type NumericPropertyOf<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * Type guard for GeometryFeatureReference.
 * Enables runtime type checking and type narrowing.
 */
export function isGeometryFeatureReference(
  value: unknown,
): value is GeometryFeatureReference<unknown, unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: unknown }).type === "geometry_feature_reference"
  );
}
```

### Geometry Feature Reference

```typescript
// File: app2/src/geometry/dsl/GeometryFeatureReference.ts

import type { GeometryValue } from "@/types/geometry";
import type { GeometryExpression } from "./expressions/GeometryExpression";

/**
 * Represents a reference to a numeric property of a geometry expression.
 *
 * Feature references are lightweight objects (2 string fields) that defer
 * value resolution to compute time. They enable explicit geometric relationships
 * between expressions while maintaining lazy evaluation.
 *
 * @typeparam TConfig - The configuration type for the construction
 * @typeparam T - The GeometryValue type (Point, Line, Circle, etc.)
 * @typeparam K - The specific property name (must be numeric)
 */
export class GeometryFeatureReference<TConfig, T extends GeometryValue, K extends keyof T> {
  /** Type discriminator for runtime checks */
  readonly type = "geometry_feature_reference" as const;

  /** ID of the source geometry expression */
  readonly sourceId: string;

  /** Property name to access on the source geometry */
  readonly property: K;

  /**
   * Create a feature reference.
   *
   * @param source - The source geometry expression
   * @param property - The numeric property name to reference
   */
  constructor(source: GeometryExpression<TConfig, T["type"]>, property: K) {
    this.sourceId = source.id;
    this.property = property;
  }

  /**
   * Resolve this reference to its numeric value.
   * Called at compute time with access to all previously computed geometries.
   *
   * @param inputs - Map of geometry IDs to their computed values
   * @returns The numeric value of the referenced property
   * @throws Error if source geometry is missing or property is not numeric
   */
  resolve(inputs: Map<string, GeometryValue>): number {
    const sourceValue = inputs.get(this.sourceId);
    if (!sourceValue) {
      throw new Error(`GeometryFeatureReference: source geometry '${this.sourceId}' not found`);
    }

    const value = (sourceValue as any)[this.property];
    if (typeof value !== "number") {
      throw new Error(
        `GeometryFeatureReference: property '${String(this.property)}' on ` +
          `'${this.sourceId}' is not a number (got ${typeof value})`,
      );
    }

    return value;
  }

  /**
   * String representation for debugging.
   */
  toString(): string {
    return `geom:${this.sourceId}.${String(this.property)}`;
  }
}
```

---

## Expression Interface

### Base Interface

```typescript
// File: app2/src/geometry/dsl/expressions/GeometryExpression.ts

import type { Step, GeometryValue } from "@/types/geometry";
import type { GeometryRenderer } from "../renderers/types";

/**
 * Base interface for all geometry expressions in the DSL.
 *
 * An expression:
 * - Has a unique ID for the geometry it produces
 * - Knows its geometry type (point, line, circle, etc.)
 * - Tracks geometry dependencies (input geometry IDs it needs)
 * - Tracks config parameter dependencies (non-geometry values it needs)
 * - Can compile itself into a Step for execution
 */
export interface GeometryExpression<TConfig, TType extends GeometryValue["type"]> {
  /** Unique identifier for this geometry expression and its output */
  readonly id: string;

  /** The type of geometry this expression produces */
  readonly type: TType;

  /** IDs of other geometry expressions this one depends on */
  readonly dependencies: string[];

  /** Names of configuration properties (from TConfig) this expression needs */
  readonly parameters: (keyof TConfig)[];

  /**
   * Compile this expression into a Step that can be executed.
   *
   * @param renderer - The renderer to use for drawing
   * @returns A Step that produces this geometry when executed
   */
  compile(renderer: GeometryRenderer): Step<TConfig>;
}
```

### Type Aliases with Feature Accessors

```typescript
// File: app2/src/geometry/dsl/expressions/types.ts

import type { GeometryExpression } from "./GeometryExpression";
import type { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { Point, Line, Circle, Polygon, CoordinateSystem } from "@/types/geometry";

// Base types (for backwards compatibility)
export type PointLikeExpression<TConfig> = GeometryExpression<TConfig, "point">;
export type LineLikeExpression<TConfig> = GeometryExpression<TConfig, "line">;
export type CircleLikeExpression<TConfig> = GeometryExpression<TConfig, "circle">;

// Extended types with feature accessors
export interface PointLikeExpression<TConfig> extends GeometryExpression<TConfig, "point"> {
  /** Access the x-coordinate as a feature reference */
  readonly x: GeometryFeatureReference<TConfig, Point, "x">;
  /** Access the y-coordinate as a feature reference */
  readonly y: GeometryFeatureReference<TConfig, Point, "y">;
}

export interface CircleLikeExpression<TConfig> extends GeometryExpression<TConfig, "circle"> {
  /** Access the center x-coordinate as a feature reference */
  readonly cx: GeometryFeatureReference<TConfig, Circle, "cx">;
  /** Access the center y-coordinate as a feature reference */
  readonly cy: GeometryFeatureReference<TConfig, Circle, "cy">;
  /** Access the radius as a feature reference (abbreviation) */
  readonly r: GeometryFeatureReference<TConfig, Circle, "r">;
  /** Access the radius as a feature reference (full name) */
  readonly radius: GeometryFeatureReference<TConfig, Circle, "r">;
}

export interface LineLikeExpression<TConfig> extends GeometryExpression<TConfig, "line"> {
  /** Access the start x-coordinate as a feature reference */
  readonly x1: GeometryFeatureReference<TConfig, Line, "x1">;
  /** Access the start y-coordinate as a feature reference */
  readonly y1: GeometryFeatureReference<TConfig, Line, "y1">;
  /** Access the end x-coordinate as a feature reference */
  readonly x2: GeometryFeatureReference<TConfig, Line, "x2">;
  /** Access the end y-coordinate as a feature reference */
  readonly y2: GeometryFeatureReference<TConfig, Line, "y2">;
  /** Access the line length as a feature reference (computed on-demand) */
  readonly length: GeometryFeatureReference<TConfig, Line, "length">;
}

export interface CoordinateSystemExpression<TConfig> extends GeometryExpression<
  TConfig,
  "coordinate_system"
> {
  /** Access the origin x-coordinate as a feature reference */
  readonly x: GeometryFeatureReference<TConfig, CoordinateSystem, "x">;
  /** Access the origin y-coordinate as a feature reference */
  readonly y: GeometryFeatureReference<TConfig, CoordinateSystem, "y">;
  /** Access the arrow length as a feature reference */
  readonly arrowLength: GeometryFeatureReference<TConfig, CoordinateSystem, "arrowLength">;
  /** Access the rotation as a feature reference */
  readonly rotation: GeometryFeatureReference<TConfig, CoordinateSystem, "rotation">;
}
```

---

## Parameter Sources

### Overview

All numeric parameters in geometry expressions accept `ParameterValue<TConfig>`:

```typescript
type ParameterValue<TConfig> =
  | number // Literal: 10, 0.5, -3
  | keyof TConfig // Config: "circleRadius"
  | GeometryFeatureReference<TConfig, T, K>; // Feature: c1.r
```

### Usage Examples

```typescript
// Literal values (existing behavior, unchanged)
const c1 = builder.circle("c1", center, 10);
const p1 = builder.point("p1", 0, 0);

// Config parameter references
const c2 = builder.circle("c2", center2, "circleRadius" as const);
const p2 = builder.pointInCs("p2", cs, "p2x" as const, "p2y" as const);

// Geometry feature references
const c3 = builder.circle("c3", center3, c1.r); // Use c1's radius
const p3 = builder.pointInCs("p3", cs, c1.cx, "p3y" as const); // Mix feature + config

// Using builder helpers for clarity
const c4 = builder.circle("c4", center4, builder.param("circleRadius"));
const c5 = builder.circle("c5", center5, builder.geom(c1, "r"));

// All equivalent
const c6 = builder.circle("c6", center6, c1.r); // Dot notation
const c7 = builder.circle("c7", center7, c1.radius); // Full name
const c8 = builder.circle("c8", center8, builder.geom(c1, "r")); // Helper method
```

### Resolution at Compute Time

All parameter sources are resolved in the `compute()` function:

```typescript
// In expression's compile() method
compute: (inputs: Map<string, GeometryValue>, params: TConfig) => {
  // Resolve a parameter value
  const value = resolveParameter(inputs, params, this.paramValue, "paramName");
  // ... use value
};

// Shared helper (can be in a utility file)
function resolveParameter<TConfig>(
  inputs: Map<string, GeometryValue>,
  params: TConfig,
  value: ParameterValue<TConfig>,
  paramName: string,
): number {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const result = params[value as keyof TConfig];
    if (result === undefined) {
      throw new Error(`Missing config parameter: ${value}`);
    }
    if (typeof result !== "number") {
      throw new Error(`Config parameter ${value} is not a number`);
    }
    return result;
  } else if (isGeometryFeatureReference(value)) {
    return value.resolve(inputs);
  }
  throw new Error(`Invalid ${paramName} type`);
}
```

---

## Expression Implementations

### Implementation Pattern

All expressions follow the same pattern:

1. **Accept `ParameterValue<TConfig>`** for numeric parameters
2. **Store the value** in a private field
3. **Track dependencies** in constructor (config params in `parameters`, feature refs in `dependencies`)
4. **Add feature accessors** as getters returning `GeometryFeatureReference`
5. **Resolve at compute time** using a shared helper

### CircleExpression

```typescript
// File: app2/src/geometry/dsl/expressions/CircleExpression.ts

import type { Step, GeometryValue, Circle, Point } from "@/types/geometry";
import { circle, isPoint } from "@/types/geometry";
import type { GeometryRenderer } from "../renderers/types";
import type { GeometryExpression } from "./GeometryExpression";
import type { PointLikeExpression, CircleLikeExpression } from "./types";
import type { ParameterValue } from "../types";
import { GeometryFeatureReference, isGeometryFeatureReference } from "../GeometryFeatureReference";

export class CircleExpression<TConfig>
  implements GeometryExpression<TConfig, "circle">, CircleLikeExpression<TConfig>
{
  readonly id: string;
  readonly type = "circle" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly centerId: string;
  private readonly radius: ParameterValue<TConfig>;

  // === Feature Accessors ===

  get cx(): GeometryFeatureReference<TConfig, Circle, "cx"> {
    return new GeometryFeatureReference(this, "cx");
  }
  get cy(): GeometryFeatureReference<TConfig, Circle, "cy"> {
    return new GeometryFeatureReference(this, "cy");
  }
  get r(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return new GeometryFeatureReference(this, "r");
  }
  get radius(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return this.r;
  }

  // === Constructor ===

  /**
   * Create a circle expression.
   *
   * @param id - Unique identifier for this circle
   * @param center - Center point expression
   * @param radius - Radius: number, config key, or feature reference
   */
  constructor(id: string, center: PointLikeExpression<TConfig>, radius: ParameterValue<TConfig>) {
    this.id = id;
    this.centerId = center.id;
    this.radius = radius;
    this.dependencies = [center.id];
    this.parameters = [];

    // Track dependencies based on radius type
    if (isGeometryFeatureReference(radius)) {
      this.dependencies.push(radius.sourceId);
    } else if (typeof radius === "string") {
      this.parameters.push(radius as keyof TConfig);
    }
    // Numeric literals: no additional dependencies
  }

  // === Compilation ===

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>, params: TConfig) => {
        const center = inputs.get(this.centerId);
        if (!center) {
          throw new Error(`CircleExpression ${this.id}: missing center point`);
        }
        if (!isPoint(center)) {
          throw new Error(`CircleExpression ${this.id}: center is not a Point`);
        }

        const r = resolveParameter(inputs, params, this.radius, "radius");
        return new Map([[this.id, circle(center.x, center.y, r)]]);
      },
      draw: (svg, values, store, theme) => {
        renderer.drawCircle(svg, values, this.id, store, theme);
      },
    };
  }

  // === Helper ===

  /** Resolve radius from its source (literal, config, or feature reference) */
  private resolveParameter(
    inputs: Map<string, GeometryValue>,
    params: TConfig,
    value: ParameterValue<TConfig>,
    paramName: string,
  ): number {
    if (typeof value === "number") {
      return value;
    } else if (typeof value === "string") {
      const result = params[value as keyof TConfig];
      if (result === undefined) {
        throw new Error(`CircleExpression ${this.id}: missing config parameter ${value}`);
      }
      if (typeof result !== "number") {
        throw new Error(`CircleExpression ${this.id}: config parameter ${value} is not a number`);
      }
      return result;
    } else if (isGeometryFeatureReference(value)) {
      return value.resolve(inputs);
    }
    throw new Error(`CircleExpression ${this.id}: invalid ${paramName} type`);
  }
}

// Shared helper (can be moved to a utilities file)
function resolveParameter<TConfig>(
  inputs: Map<string, GeometryValue>,
  params: TConfig,
  value: ParameterValue<TConfig>,
  paramName: string,
): number {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const result = params[value as keyof TConfig];
    if (result === undefined) {
      throw new Error(`Missing config parameter: ${value}`);
    }
    if (typeof result !== "number") {
      throw new Error(`Config parameter ${value} is not a number`);
    }
    return result;
  } else if (isGeometryFeatureReference(value)) {
    return value.resolve(inputs);
  }
  throw new Error(`Invalid ${paramName} type`);
}
```

### PointInCoordinateSystemExpression

Similar pattern, accepting `ParameterValue<TConfig>` for `localX` and `localY`:

```typescript
// Key parts only
export class PointInCoordinateSystemExpression<TConfig>
  implements GeometryExpression<TConfig, "point">, PointLikeExpression<TConfig>
{
  // ...

  get x(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }
  get y(): GeometryFeatureReference<TConfig, Point, "y"> {
    return new GeometryFeatureReference(this, "y");
  }

  constructor(
    id: string,
    cs: CoordinateSystemExpression<TConfig>,
    localX: ParameterValue<TConfig>,
    localY: ParameterValue<TConfig>,
  ) {
    this.id = id;
    this.csId = cs.id;
    this.localX = localX;
    this.localY = localY;
    this.dependencies = [cs.id];
    this.parameters = [];

    if (isGeometryFeatureReference(localX)) {
      this.dependencies.push(localX.sourceId);
    } else if (typeof localX === "string") {
      this.parameters.push(localX as keyof TConfig);
    }

    if (isGeometryFeatureReference(localY)) {
      this.dependencies.push(localY.sourceId);
    } else if (typeof localY === "string") {
      this.parameters.push(localY as keyof TConfig);
    }
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>, params: TConfig) => {
        const cs = inputs.get(this.csId);
        if (!cs || !isCoordinateSystem(cs)) {
          throw new Error(`PointInCoordinateSystemExpression ${this.id}: missing or invalid CS`);
        }

        const x = resolveParameter(inputs, params, this.localX, "localX");
        const y = resolveParameter(inputs, params, this.localY, "localY");

        // Apply coordinate system transformation
        const globalX = cs.x + x;
        const globalY = cs.y + y;

        return new Map([[this.id, point(globalX, globalY)]]);
      },
      draw: renderer.drawPoint.bind(null, this.id),
    };
  }
}
```

### LineTowardsExpression

```typescript
export class LineTowardsExpression<TConfig>
  implements GeometryExpression<TConfig, "line">, LineLikeExpression<TConfig>
{
  // ...

  get x1(): GeometryFeatureReference<TConfig, Line, "x1"> {
    return new GeometryFeatureReference(this, "x1");
  }
  get y1(): GeometryFeatureReference<TConfig, Line, "y1"> {
    return new GeometryFeatureReference(this, "y1");
  }
  get x2(): GeometryFeatureReference<TConfig, Line, "x2"> {
    return new GeometryFeatureReference(this, "x2");
  }
  get y2(): GeometryFeatureReference<TConfig, Line, "y2"> {
    return new GeometryFeatureReference(this, "y2");
  }
  get length(): GeometryFeatureReference<TConfig, Line, "length"> {
    // Length is computed on-demand, not stored
    // This is a special case - the reference will compute length when resolved
    return new GeometryFeatureReference(this, "length" as any);
  }

  constructor(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    length: ParameterValue<TConfig>,
  ) {
    this.id = id;
    this.startId = start.id;
    this.endId = end.id;
    this.lengthParam = length;
    this.dependencies = [start.id, end.id];
    this.parameters = [];

    if (isGeometryFeatureReference(length)) {
      this.dependencies.push(length.sourceId);
    } else if (typeof length === "string") {
      this.parameters.push(length as keyof TConfig);
    }
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>, params: TConfig) => {
        const start = inputs.get(this.startId);
        const end = inputs.get(this.endId);

        if (!start || !isPoint(start)) {
          throw new Error(`LineTowardsExpression ${this.id}: missing start`);
        }
        if (!end || !isPoint(end)) {
          throw new Error(`LineTowardsExpression ${this.id}: missing end`);
        }

        const len = resolveParameter(inputs, params, this.lengthParam, "length");

        // Calculate extended line
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const scale = len / lineLength;

        const x2 = start.x + dx * scale;
        const y2 = start.y + dy * scale;

        return new Map([[this.id, line(start.x, start.y, x2, y2)]]);
      },
      draw: renderer.drawLine.bind(null, this.id),
    };
  }
}
```

### PointAtExpression

Similar pattern for ratio parameter.

---

## Builder Integration

### GeometryBuilder

````typescript
// File: app2/src/geometry/dsl/GeometryBuilder.ts

import type { Step } from "@/types/geometry";
import type { GeometryRenderer } from "./renderers/types";
import type { GeometryExpression } from "./expressions/GeometryExpression";
import type {
  PointLikeExpression,
  LineLikeExpression,
  CircleLikeExpression,
} from "./expressions/types";
import { GeometryFeatureReference } from "./GeometryFeatureReference";
import type { ParameterValue, NumericPropertyOf } from "./types";
import { DefaultGeometryRenderer } from "./renderers/DefaultRenderer";

export class GeometryBuilder<TConfig> {
  private expressions: Map<string, GeometryExpression<TConfig, any>>;
  private renderer: GeometryRenderer;

  constructor(renderer?: GeometryRenderer) {
    this.expressions = new Map();
    this.renderer = renderer ?? new DefaultGeometryRenderer();
  }

  // === Helper Methods for Parameter References ===

  /**
   * Create a type-safe reference to a config parameter.
   * Improves readability over string literals with `as const`.
   *
   * @example
   * ```typescript
   * builder.circle("c1", center, builder.param("radius"));
   * ```
   */
  param<K extends keyof TConfig>(key: K): K {
    return key;
  }

  /**
   * Create a reference to a geometry feature.
   * Alternative syntax to direct property access (e.g., c1.r).
   *
   * @example
   * ```typescript
   * builder.circle("c2", center2, builder.geom(c1, "r"));
   * ```
   */
  geom<T extends GeometryValue, K extends NumericPropertyOf<T>>(
    expr: GeometryExpression<TConfig, T["type"]>,
    key: K,
  ): GeometryFeatureReference<TConfig, T, K> {
    return new GeometryFeatureReference(expr, key);
  }

  // === Primitive Factory Methods ===

  point(id: string, x: number, y: number): PointExpression<TConfig> {
    const expr = new PointExpression(id, x, y);
    this.expressions.set(id, expr);
    return expr;
  }

  pointInCs(
    id: string,
    cs: CoordinateSystemExpression<TConfig>,
    localX: ParameterValue<TConfig>,
    localY: ParameterValue<TConfig>,
  ): PointInCoordinateSystemExpression<TConfig> {
    const expr = new PointInCoordinateSystemExpression(id, cs, localX, localY);
    this.expressions.set(id, expr);
    return expr;
  }

  circle(
    id: string,
    center: PointLikeExpression<TConfig>,
    radius: ParameterValue<TConfig>,
  ): CircleExpression<TConfig> {
    const expr = new CircleExpression(id, center, radius);
    this.expressions.set(id, expr);
    return expr;
  }

  coordinateSystem(
    id: string,
    x: number,
    y: number,
    arrowLength: number,
    rotation: number = 0,
  ): CoordinateSystemExpression<TConfig> {
    const expr = new CoordinateSystemExpression(id, x, y, arrowLength, rotation);
    this.expressions.set(id, expr);
    return expr;
  }

  line(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
  ): LineExpression<TConfig> {
    const expr = LineExpression.fromPoints(id, start, end);
    this.expressions.set(id, expr);
    return expr;
  }

  polygon(
    id: string,
    points: PointLikeExpression<TConfig>[],
    options?: PolygonStyleOptions,
  ): PolygonExpression<TConfig> {
    const expr = new PolygonExpression(id, points, options);
    this.expressions.set(id, expr);
    return expr;
  }

  // === Operation Factory Methods ===

  pointAt(
    id: string,
    line: LineLikeExpression<TConfig>,
    ratio: ParameterValue<TConfig>,
  ): PointAtExpression<TConfig> {
    const expr = new PointAtExpression(id, line, ratio);
    this.expressions.set(id, expr);
    return expr;
  }

  intersection(
    id: string,
    circle: CircleLikeExpression<TConfig>,
    line: LineLikeExpression<TConfig>,
    options: IntersectionOptions = {},
  ): IntersectionExpression<TConfig> {
    const expr = new IntersectionExpression(id, circle, line, options);
    this.expressions.set(id, expr);
    return expr;
  }

  circleIntersection(
    id: string,
    c1: CircleLikeExpression<TConfig>,
    c2: CircleLikeExpression<TConfig>,
    options: CircleIntersectionOptions = {},
  ): CircleIntersectionExpression<TConfig> {
    const expr = new CircleIntersectionExpression(id, c1, c2, options);
    this.expressions.set(id, expr);
    return expr;
  }

  lineTowards(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    length: ParameterValue<TConfig>,
  ): LineTowardsExpression<TConfig> {
    const expr = new LineTowardsExpression(id, start, end, length);
    this.expressions.set(id, expr);
    return expr;
  }

  // === Compilation ===

  getExpression(id: string): GeometryExpression<TConfig, any> | undefined {
    return this.expressions.get(id);
  }

  getAllExpressions(): Map<string, GeometryExpression<TConfig, any>> {
    return new Map(this.expressions);
  }

  getExecutionOrder(): string[] {
    // Existing topological sort implementation
    // ...
  }

  compile(): Step<TConfig>[] {
    const steps: Step<TConfig>[] = [];
    const executionOrder = this.getExecutionOrder();

    for (const id of executionOrder) {
      const expr = this.expressions.get(id);
      if (!expr) continue;
      steps.push(expr.compile(this.renderer));
    }

    return steps;
  }
}
````

---

## Dependency Tracking

### How It Works

Dependencies are tracked through two arrays on each expression:

| Array          | Purpose                            | Example                     |
| -------------- | ---------------------------------- | --------------------------- |
| `dependencies` | Geometry IDs this expression needs | `["center"`, `"c1"]`        |
| `parameters`   | Config keys this expression needs  | `["circleRadius"`, `"p1x"]` |

### Tracking in Constructors

```typescript
// For each ParameterValue parameter in constructor:
constructor(..., param: ParameterValue<TConfig>) {
  // ...

  if (isGeometryFeatureReference(param)) {
    // Feature reference: add source geometry to dependencies
    this.dependencies.push(param.sourceId);
  } else if (typeof param === "string") {
    // Config parameter: add to parameters array
    this.parameters.push(param as keyof TConfig);
  }
  // Numeric literals: nothing to track
}
```

### Transitive Dependencies

Transitive dependencies are handled automatically by the topological sort:

```typescript
// Example chain:
c1 = builder.circle("c1", center, 10); // deps: ["center"]
c2 = builder.circle("c2", center2, c1.r); // deps: ["center2", "c1"]
c3 = builder.circle("c3", center3, c2.r); // deps: ["center3", "c2"]

// Topological sort result: ["center", "c1", "center2", "c2", "center3", "c3"]
// c1 is computed before c2, which is computed before c3
```

### Circular Dependency Detection

The existing topological sort in `getExecutionOrder()` already detects circular dependencies:

```typescript
getExecutionOrder(): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  const visiting = new Set<string>();

  const visit = (id: string): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Circular dependency detected involving expression: ${id}`);
    }

    visiting.add(id);
    const expr = this.expressions.get(id);
    if (expr) {
      for (const dep of expr.dependencies) {
        visit(dep);
      }
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };

  for (const id of this.expressions.keys()) {
    visit(id);
  }

  return order;
}
```

---

## Example: Square Construction

### Complete Example with All Parameter Types

```typescript
// File: app2/src/geometry/squareDslSteps.ts

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import type { SquareConfig } from "./operations";
import type { Step } from "../types/geometry";

export function buildSquareDslSteps(_width: number, height: number): Step<SquareConfig>[] {
  const builder = new GeometryBuilder<SquareConfig>(new DefaultGeometryRenderer());

  // Step 1: Coordinate system with literal values
  const cs = builder.coordinateSystem("cs", 0, 0, height * 0.1, 0);

  // Step 2: Points using config parameters
  const p1 = builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);
  const p2 = builder.pointInCs("p2", cs, "p2x" as const, "p2y" as const);

  // Step 3: Main line between points
  const line_main = builder.line("line_main", p1, p2);

  // Step 4: Circle center at ratio along line (config parameter)
  const c1 = builder.pointAt("c1", line_main, "C1_POSITION_RATIO" as const);

  // Step 5: First circle with config radius
  const c1_c = builder.circle("c1_c", c1, "circleRadius" as const);

  // Step 6: Circle center at intersection (config parameter)
  const c2 = builder.intersection("c2", c1_c, line_main);

  // Step 7: Second circle - SAME RADIUS AS c1_c (feature reference!)
  const c2_c = builder.circle("c2_c", c2, c1_c.r);

  // Step 8: Intersection point of the two circles
  const pi = builder.circleIntersection("pi", c1_c, c2_c, { select: "north" });

  // Step 9: Intersection circle - SAME RADIUS AS c1_c (feature reference!)
  const ci = builder.circle("ci", pi, c1_c.r);

  // Step 10: Extended line (config parameter for length)
  const line_c2_pi = builder.lineTowards("line_c2_pi", c2, pi, "LINE_EXTENSION_LENGTH" as const);

  // Step 11: Extended line (config parameter for length)
  const line_c1_pi = builder.lineTowards("line_c1_pi", c1, pi, "LINE_EXTENSION_LENGTH" as const);

  // Step 12: Point P3 at intersection
  const p3 = builder.intersection("p3", ci, line_c2_pi, { excludeId: "c2" });

  // Step 13: Point P4 at intersection
  const p4 = builder.intersection("p4", ci, line_c1_pi, { excludeId: "c1" });

  // Step 14: Line from C2 to P4
  const line_c2_p4 = builder.line("line_c2_p4", c2, p4);

  // Step 15: Tangent point PL
  const pl = builder.intersection("pl", c2_c, line_c2_p4);

  // Step 16: Line from C1 to P3
  const line_c1_p3 = builder.line("line_c1_p3", c1, p3);

  // Step 17: Tangent point PR
  const pr = builder.intersection("pr", c1_c, line_c1_p3);

  // Step 18: Square polygon
  const squareStyle = { strokeWidth: GOLDEN_RATIO, strokeColor: (t) => t.COLOR_PRIMARY };
  builder.polygon("square", [pl, pr, c1, c2], squareStyle);

  return builder.compile();
}
```

### Benefits of This Approach

1. **Declarative** — Geometry structure is clear and self-documenting
2. **No Duplication** — `c1_c.r` is referenced directly, not duplicated
3. **Explicit Relationships** — `c2_c` explicitly depends on `c1_c`'s radius
4. **Flexible** — Mix of config parameters and feature references
5. **Type-Safe** — All references are checked at compile time
6. **Correct Dependencies** — Topological sort ensures correct execution order

### Alternative Syntax Options

The same construction can use different syntax styles:

```typescript
// Option 1: Direct property access (RECOMMENDED)
const c2_c = builder.circle("c2_c", c2, c1_c.r);
const c3_c = builder.circle("c3_c", c3, c1_c.radius); // Full name

// Option 2: builder.geom() helper
const c2_c = builder.circle("c2_c", c2, builder.geom(c1_c, "r"));

// Option 3: builder.param() for config
const p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"));

// All produce identical results
```

---

## Migration Strategy

### Overview

This is a **non-breaking** change. All existing code continues to work, and the new features are opt-in.

### Phase 1: Core Infrastructure

**Files to create:**

- [ ] `app2/src/geometry/dsl/GeometryFeatureReference.ts`
- [ ] `app2/src/geometry/dsl/types.ts` (with `ParameterValue`, `NumericPropertyOf`)

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All existing tests pass

### Phase 2: Type Definitions

**Files to update:**

- [ ] `app2/src/geometry/dsl/expressions/types.ts` (add feature accessors)

**Verification:**

- [ ] `pnpm type-check:app2` passes

### Phase 3: Expression Updates

**Files to update (in order):**

1. [ ] `CircleExpression.ts` - Add feature accessors, accept ParameterValue
2. [ ] `PointInCoordinateSystemExpression.ts` - Same
3. [ ] `LineTowardsExpression.ts` - Same
4. [ ] `PointAtExpression.ts` - Same
5. [ ] All other expressions - Accept ParameterValue where applicable

**After each file:**

- [ ] Existing tests still pass
- [ ] `pnpm type-check:app2` passes

### Phase 4: Builder Enhancement

**Files to update:**

- [ ] `GeometryBuilder.ts` - Add `param()` and `geom()` helpers

**Verification:**

- [ ] `pnpm type-check:app2` passes
- [ ] All tests pass

### Phase 5: New Tests

**Files to create:**

- [ ] `app2/test/GeometryFeatureReference.test.ts`
- [ ] `app2/test/parameter-resolution.test.ts`
- [ ] Extend existing expression tests

**Verification:**

- [ ] All new tests pass
- [ ] Code coverage >= 100% for new code

### Phase 6: Documentation & Examples

**Files to update:**

- [ ] `squareDslSteps.ts` - Add feature reference examples
- [ ] Add usage documentation

---

## Open Questions

1. **Naming: Abbreviations vs Full Names**
   - Should we use `c1.r` or `c1.radius` for circle radius?
   - **Proposed:** Support both, with `r` as primary and `radius` as alias
   - **Rationale:** Balance conciseness with readability

2. **Computed Properties: On-Demand vs Cached**
   - Properties like `line.length` can be computed or cached
   - **Proposed:** Compute on-demand (simpler, always current)
   - **Alternative:** Cache in compute() for performance
   - **Rationale:** Geometric calculations are fast, caching adds complexity

3. **Error Messages: Verbosity Level**
   - How detailed should error messages be?
   - **Proposed:** Include step ID, geometry ID, property name, expected type
   - **Example:** `[step_c2] CircleExpression: property 'r' on 'c1' is not a number (got undefined)`

4. **Config Validation: Dev Mode Only?**
   - Should we validate config parameters exist at construction time?
   - **Proposed:** No validation (current behavior), errors at compute time
   - **Alternative:** Dev-mode only validation via flag
   - **Rationale:** Zero runtime overhead in production

5. **Feature Reference: toString() Method**
   - Should feature references have a string representation?
   - **Proposed:** Yes, `c1.r.toString() => "geom:c1.r"`
   - **Use case:** Debugging and logging

6. **IDE Support: Template Literal Types?**
   - Can we improve IDE experience with advanced TypeScript features?
   - **Proposed:** Not in initial implementation
   - **Rationale:** Current approach already has good IDE support

---

## Decision Log

| Date | Decision                                           | Rationale                                 | Author       |
| ---- | -------------------------------------------------- | ----------------------------------------- | ------------ |
| TBD  | Use dot notation for feature access (e.g., `c1.r`) | Most natural, type-safe, good IDE support | Mistral Vibe |
| TBD  | Support both abbreviations and full names          | Balance conciseness and readability       | Mistral Vibe |
| TBD  | Compute derived properties on-demand               | Simpler, always current                   | Mistral Vibe |
| TBD  | Add `builder.param()` and `builder.geom()` helpers | Improve readability over string literals  | Mistral Vibe |
| TBD  | No config validation at construction time          | Zero runtime overhead                     | Mistral Vibe |
| TBD  | Use existing topological sort for dependencies     | Already handles correctly                 | Mistral Vibe |

---

## References

- **Related Code:** `app2/src/geometry/dsl/`
- **Type Definitions:** `app2/src/types/geometry.ts`
- **Existing Tests:** `app2/test/GeometryBuilder.test.ts`
- **Square Construction:** `app2/src/geometry/squareDslSteps.ts`

---

## Appendix

### Appendix A: Summary of Changes

| Aspect              | Before                          | After                                    |
| ------------------- | ------------------------------- | ---------------------------------------- |
| Numeric parameters  | `number` only                   | `ParameterValue<TConfig>`                |
| Config references   | String literals with `as const` | `builder.param("key")` or string literal |
| Feature references  | Not supported                   | `c1.r` or `builder.geom(c1, "r")`        |
| Dependency tracking | Manual for config               | Automatic for config + features          |
| Type safety         | Partial                         | Complete                                 |
| IDE support         | Limited                         | Full autocomplete                        |

### Appendix B: File Modification Summary

| File                                   | Change Type | Lines     |
| -------------------------------------- | ----------- | --------- |
| `GeometryFeatureReference.ts`          | NEW         | ~60       |
| `dsl/types.ts`                         | NEW         | ~30       |
| `GeometryBuilder.ts`                   | MODIFY      | ~20       |
| `GeometryExpression.ts`                | MODIFY      | ~5        |
| `expressions/types.ts`                 | MODIFY      | ~40       |
| `CircleExpression.ts`                  | MODIFY      | ~40       |
| `PointInCoordinateSystemExpression.ts` | MODIFY      | ~40       |
| `LineTowardsExpression.ts`             | MODIFY      | ~30       |
| `PointAtExpression.ts`                 | MODIFY      | ~30       |
| `GeometryFeatureReference.test.ts`     | NEW         | ~100      |
| `parameter-resolution.test.ts`         | NEW         | ~80       |
| **Total**                              |             | **~500+** |

### Appendix C: Glossary

| Term                    | Definition                                         |
| ----------------------- | -------------------------------------------------- |
| **ParameterValue**      | Union type for all numeric parameter sources       |
| **Feature Reference**   | Reference to a property of another geometry        |
| **Config Parameter**    | Reference to a value in the TConfig object         |
| **Resolution**          | Process of converting a ParameterValue to a number |
| **Dependency Tracking** | Recording which geometries/config a step needs     |

### Appendix D: Performance Budget

| Operation                    | Target      | Measurement       |
| ---------------------------- | ----------- | ----------------- |
| Feature reference creation   | < 1μs       | Construction time |
| Feature reference resolution | < 1μs       | Compute time      |
| Memory per reference         | < 100 bytes | Runtime           |
| Overhead per step            | < 5%        | Benchmark         |

---

## Revision History

| Date       | Author       | Change                                                    |
| ---------- | ------------ | --------------------------------------------------------- |
| 2025-01-XX | Mistral Vibe | Initial spec created (replaces SPEC-parameterized-dsl.md) |
