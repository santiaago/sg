# Plan: Declarative Geometry Framework Implementation

## Overview
This plan describes the technical implementation approach for building the declarative geometry framework as specified in SPEC-declarative-geometry.md.

## Major Components and Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Declarative API Layer                        │
├─────────────────────────────────────────────────────────────┤
│  app2/src/declarative/                                          │
│  ├─ geometry.ts      # Primitive constructors (point, line, etc.)│
│  ├─ operations.ts    # Derived operations (pointAt, intersection)│
│  ├─ dsl.ts           # DSL utilities (builder, etc.)          │
│  └─ stepGenerator.ts # Converts declarative to Step[]          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Existing Step System                        │
├─────────────────────────────────────────────────────────────┤
│  app2/src/geometry/                                           │
│  ├─ stepExecution.ts  # executeStep, executeSteps             │
│  ├─ stepBuilders.ts   # createPointStep, createLineStep, etc. │
│  └─ squareSteps.ts     # Reference: 18-step square construction │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Types & Utilities                           │
├─────────────────────────────────────────────────────────────┤
│  app2/src/types/geometry.ts  # Point, Line, Circle, Polygon    │
│  app2/src/svgElements.ts     # drawPoint, drawLine, etc.       │
└─────────────────────────────────────────────────────────────┘
```

### Component Dependencies

| Component | Depends On | Used By |
|-----------|------------|---------|
| `geometry.ts` | types/geometry.ts | operations.ts, dsl.ts |
| `operations.ts` | geometry.ts, constructors.ts | dsl.ts, SquaresV2 |
| `dsl.ts` | geometry.ts, operations.ts | SquaresV2 |
| `stepGenerator.ts` | types/geometry.ts, geometry.ts | dsl.ts, SquaresV2 |
| `SquaresV2.tsx` | declarative/* | (standalone component) |

## Implementation Order

### Phase A: Core Framework (Sequential)
1. **geometry.ts** - Base geometry value types and factories
2. **stepGenerator.ts** - Step generation logic
3. **operations.ts** - Derived geometry operations
4. **dsl.ts** - DSL utilities and builder pattern

### Phase B: Proof-of-Concept (Sequential, depends on Phase A)
5. **SquaresV2.tsx** - Component using declarative API
6. **squaresV2Steps.ts** - Optional: generated steps for reference

### Phase C: Validation (Can run in parallel after Phase A)
7. **Unit tests** for each module
8. **Integration test** comparing SquaresV2 output with SquareSvg

## Detailed Implementation Plan

### 1. geometry.ts - Base Geometry Value System

**Purpose**: Define the declarative geometry value types that wrap underlying geometry and track their construction metadata.

**Key Types**:
```typescript
// A declarative geometry value that wraps a GeometryValue and tracks its construction
interface DeclarativeGeometry<T extends GeometryValue> {
  readonly id: string;           // Unique identifier (e.g., "c1", "ml")
  readonly value: T;            // The actual geometry value
  readonly inputs: string[];    // IDs of input geometries
  readonly parameters: string[]; // Parameter names used
  readonly operation: string;   // Operation type (e.g., "pointAt", "intersection")
}

// Factory functions for creating declarative geometry
type GeometryFactory<T extends GeometryValue> = (
  id: string,
  inputs: string[],
  parameters: string[],
  operation: string,
  value: T
) => DeclarativeGeometry<T>;
```

**Files Touched**: `app2/src/declarative/geometry.ts`

**Risks**: 
- Need to ensure proxies work correctly with TypeScript type system
- Mitigation: Use TypeScript's Declaration Merging or intersection types

### 2. stepGenerator.ts - Step Generation

**Purpose**: Convert declarative geometry definitions into Step objects.

**Key Function**:
```typescript
function toStep<TConfig>(
  declGeom: DeclarativeGeometry<GeometryValue>,
  config: TConfig
): Step<TConfig>;

function toSteps<TConfig>(
  declGeoms: DeclarativeGeometry<GeometryValue>[],
  config: TConfig
): Step<TConfig>[];
```

**Algorithm**:
1. Topological sort of declarative geometries by dependencies
2. For each geometry in order:
   - Create Step object with inputs/outputs/parameters from metadata
   - Create compute function that retrieves inputs and computes output
   - Create draw function using existing draw utilities

**Files Touched**: `app2/src/declarative/stepGenerator.ts`

**Risks**:
- Circular dependencies in declarative definitions
- Mitigation: Detect cycles during topological sort and throw error

### 3. operations.ts - Derived Operations

**Purpose**: High-level geometry operations that match the example API.

**Key Functions**:
```typescript
// Create a point at a ratio along a line
function pointAt(
  line: DeclarativeGeometry<Line>,
  ratio: number
): DeclarativeGeometry<Point>;

// Create a line between two points
function line(
  x1: number, y1: number, x2: number, y2: number
): DeclarativeGeometry<Line>;
function line(
  p1: DeclarativeGeometry<Point>,
  p2: DeclarativeGeometry<Point>
): DeclarativeGeometry<Line>;

// Create a circle at a point with radius
function circle(
  center: DeclarativeGeometry<Point>,
  radius: number
): DeclarativeGeometry<Circle>;

// Find intersection of circle and line
function intersection(
  circle: DeclarativeGeometry<Circle>,
  line: DeclarativeGeometry<Line>,
  direction: "left" | "right" | "north" | "south"
): DeclarativeGeometry<Point>;

// Overloaded functions to support both declarative and raw values
```

**Files Touched**: `app2/src/declarative/operations.ts`

**Risks**:
- TypeScript overload resolution complexity
- Mitigation: Use function overloading with careful parameter types

### 4. dsl.ts - DSL Utilities

**Purpose**: Provide a clean, chainable API for declarative geometry construction.

**Key Classes/Functions**:
```typescript
class GeometryBuilder {
  private geometries: Map<string, DeclarativeGeometry<GeometryValue>>;
  
  // Register a declarative geometry
  set<T extends GeometryValue>(
    id: string,
    declGeom: DeclarativeGeometry<T>
  ): void;
  
  // Get a declarative geometry by ID
  get<T extends GeometryValue>(id: string): DeclarativeGeometry<T>;
  
  // Convert all registered geometries to Steps
  toSteps<TConfig>(config: TConfig): Step<TConfig>[];
  
  // Clear all geometries
  clear(): void;
}

// Singleton builder for global use
const builder = new GeometryBuilder();
```

**Files Touched**: `app2/src/declarative/dsl.ts`

### 5. SquaresV2.tsx - Proof-of-Concept Component

**Purpose**: Demonstrate the declarative API by replicating the square construction.

**Implementation**:
```typescript
// Using the declarative API
import { point, line, circle, pointAt, intersection } from "../declarative";
import { builder } from "../declarative";

// Define the square construction declaratively
function buildSquareSteps(config: SquareConfig) {
  const ML = line(config.p1x, config.p1y, config.p2x, config.p2y);
  const C1 = pointAt(ML, config.C1_POSITION_RATIO);
  const C1_C = circle(C1, config.circleRadius);
  const C2 = intersection(C1_C, ML, "left");
  // ... continue with all 18 steps
  
  return builder.toSteps(config);
}
```

**Files Touched**: 
- `app2/src/components/SquaresV2.tsx` (new component)
- `app2/src/geometry/squaresV2Steps.ts` (optional, auto-generated)

**Risks**:
- May not match existing squareSteps.ts exactly
- Mitigation: Add integration test comparing outputs

## Parallelizable Work

The following can be developed in parallel after the core framework (geometry.ts + stepGenerator.ts) is complete:

1. **Unit tests for geometry.ts** - Can be written alongside implementation
2. **Unit tests for operations.ts** - Can be written after geometry.ts is stable
3. **SquaresV2.tsx** - Can be developed after operations.ts is complete

## Verification Checkpoints

### Checkpoint 1: Core Framework
- **When**: After geometry.ts, stepGenerator.ts, operations.ts, dsl.ts complete
- **Verification**: 
  - TypeScript compiles without errors
  - Basic unit tests pass
  - Can create a simple declarative construction and convert to steps

### Checkpoint 2: Proof-of-Concept
- **When**: After SquaresV2.tsx complete
- **Verification**:
  - Component renders without errors
  - Produces geometry matching original SquareSvg
  - Integration test passes

### Checkpoint 3: Final Validation
- **When**: All code complete
- **Verification**:
  - All unit tests pass
  - Type check passes
  - Lint passes
  - Manual visual verification

## Risk Mitigation Strategies

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Proxy type issues | Medium | High | Use TypeScript intersection types, test thoroughly |
| Circular dependencies | Low | Medium | Topological sort with cycle detection |
| Performance issues | Low | Medium | Profile and optimize if needed |
| API usability issues | Medium | High | Iterate on API design with quick feedback loops |

## Alternative Approaches Considered

### Alternative 1: Macro/Template-based Step Generation
Instead of proxies, use TypeScript macros or template literals to generate steps.
- **Rejected**: Too complex, requires build-time transformation

### Alternative 2: Explicit Step Definition with Declarative Syntax
Keep explicit Step objects but provide factory functions for common patterns.
- **Rejected**: Doesn't provide the fluid, chainable syntax requested

### Alternative 3: Functional Reactive Programming
Use signals/observables to track dependencies.
- **Rejected**: Overkill for this use case, adds complexity

## Resource Estimates
- **Core framework**: ~500 lines of code
- **Operations**: ~300 lines of code
- **SquaresV2**: ~200 lines of code
- **Tests**: ~400 lines of code
- **Total**: ~1400 lines of new code

---

**Status**: Awaiting human review
**Next**: TASKS document
