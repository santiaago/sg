# Spec: Declarative Geometry Framework

## Objective
Create a higher-level declarative language/facade for geometric constructions that provides a fluid, chainable syntax while maintaining the existing step-based architecture underneath. The framework should automatically create steps from high-level declarative code. Proof-of-concept: SquaresV2 component that replicates the existing 18-step square construction using the new API.

**User**: Geometry component authors who want to write cleaner, more readable geometry code.

**Success looks like**: 
- Developers can write `c1 = pointAt(ml, C1_POSITION_RATIO)` instead of manually defining step objects
- The underlying step system remains unchanged (backward compatible not required per spec)
- All existing principles preserved: explicit dependencies, compute/draw separation, lazy evaluation, type safety

## Tech Stack
- TypeScript
- Existing geometry types from `app2/src/types/geometry.ts`
- Existing step execution from `app2/src/geometry/stepExecution.ts`
- No new external dependencies

## Commands
```bash
# Type check
npx tsc --noEmit -p app2/tsconfig.json

# Lint
npm run lint

# Build app2
npm run build:app2

# Test
npm test
```

## Project Structure
```
app2/
├── src/
│   ├── declarative/           # NEW: Declarative framework
│   │   ├── geometry.ts        # Declarative geometry primitives (pointAt, line, circle, intersection, etc.)
│   │   ├── dsl.ts             # Domain-specific language functions
│   │   ├── stepGenerator.ts   # Converts declarative code to Step[] array
│   │   └── index.ts           # Public API exports
│   │
│   ├── components/
│   │   └── SquaresV2.tsx      # NEW: Proof-of-concept component using declarative API
│   │
│   └── geometry/
│       └── squaresV2Steps.ts  # NEW: Generated steps from declarative code (optional, for reference)
│
└── docs/
    └── SPEC-declarative-geometry.md  # This document
```

## Code Style

### Naming Conventions
- Geometry constructor functions: `camelCase` (e.g., `pointAt`, `circle`, `intersection`)
- Geometry values: `snake_case` uppercase (e.g., `ML`, `C1`, `C1_C`)
- Type names: `PascalCase` (e.g., `DeclarativeGeometry`, `GeometryBuilder`)
- Internal helper functions: `_camelCase` prefix with underscore

### Example of Good Output
```typescript
// Declarative construction of square
import { pointAt, line, circle, intersection } from "../declarative/geometry";

const builder = new GeometryBuilder();

// Define constructions declaratively
const ML = line(config.lx1, config.ly1, config.lx2, config.ly2);
const C1 = pointAt(ML, C1_POSITION_RATIO);
const C1_C = circle(C1, config.circleRadius);
const C2 = intersection(C1_C, ML, "left");

// Builder automatically tracks dependencies and generates steps
const steps = builder.toSteps(config);
```

### Type Safety
All geometry operations return typed values:
- `point(x, y)` → `Point`
- `line(x1, y1, x2, y2)` → `Line`
- `circle(center, radius)` → `Circle`
- `intersection(circle, line, direction)` → `Point`

## Testing Strategy
- **Framework**: Jest (existing)
- **Test locations**: `app2/src/declarative/*.test.ts`
- **Coverage**: 100% for new declarative module
- **Test levels**:
  - Unit tests for each geometry constructor
  - Unit tests for step generation
  - Integration test: verify SquaresV2 produces same results as original SquareSvg
  - Visual regression: manual verification

## Boundaries
- **Always do**:
  - Preserve explicit dependencies (inputs/outputs/parameters)
  - Maintain compute/draw separation
  - Keep lazy evaluation
  - Type-safe geometry operations
  - No modification to existing code (per requirement #3)

- **Ask first**:
  - Adding new external dependencies
  - Changing the existing step execution system
  - Modifying type definitions in `types/geometry.ts`

- **Never do**:
  - Modify existing SquareSvg, squareSteps.ts, or any existing components
  - Break type safety
  - Introduce eager evaluation
  - Mix computation and rendering logic
  - Commit without running type check

## Success Criteria
1. ✅ Declarative API allows writing: `c1 = pointAt(ml, C1_POSITION_RATIO)`
2. ✅ Declarative code automatically generates Step objects with inputs/outputs/parameters
3. ✅ SquaresV2 component replicates the 18-step square construction
4. ✅ SquaresV2 produces identical geometry to original SquareSvg
5. ✅ Complete separation: computation logic ≠ rendering logic
6. ✅ All steps are lazy-evaluated
7. ✅ Full type safety with TypeScript
8. ✅ No changes to existing code

## Architecture Decisions

### Decision 1: Builder Pattern vs Pure Functions
**Chosen**: Pure functions with implicit builder
- Geometry constructors return wrapped values that track their construction
- No explicit builder instance needed for simple cases
- Builder class available for complex multi-step constructions

### Decision 2: Step Generation Strategy
**Chosen**: Eager step generation at definition time
- Each declarative call creates a Step object internally
- Steps are collected and can be retrieved via `getSteps()`
- Alternative (rejected): Lazy step generation would complicate the API

### Decision 3: Geometry Value Wrapping
**Chosen**: Proxy-based wrapping
- Declarative functions return Proxy objects that:
  - Behave like the underlying geometry value (Point, Line, Circle, etc.)
  - Track their construction (inputs, operation, parameters)
  - Can be unwrapped to get the actual geometry value
- This allows: `const C1 = pointAt(ML, 0.5); C1.x` (accesses underlying point's x)

### Decision 4: Parameter Handling
**Chosen**: Parameters are passed via config object at step generation time
- Declarative code defines geometry relationships
- Config values (like `circleRadius`) are injected when converting to steps
- This matches the existing step system's approach

## Open Questions
1. Should declarative geometry values be immutable? (Assumption: Yes)
2. How should we handle errors in declarative constructions? (Assumption: Throw at step generation time)
3. Should we support conditional constructions? (Assumption: Not in v1, can add later)

---

**Status**: Awaiting human review
**Next**: PLAN document
