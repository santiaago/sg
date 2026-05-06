# Spec: Geometry Construction Framework

## Objective
Create a higher-level declarative language for geometric constructions that allows users to write algorithmic geometry steps in a fluid, chainable syntax, while preserving the existing step-based architecture underneath. The new language is a facade/abstraction layer on top of the existing step system - steps still exist and are created automatically from the high-level code.

**User**: Engineers building geometric constructions in app2
**Success**: Users can write `construction.line(p1, p2, "main_line")` instead of manually defining steps with inputs, outputs, compute, and draw functions.

## Tech Stack
- TypeScript (ESM)
- React 18+
- app2's existing GeometryValue types (canonical)
- @sg/geometry package (coordinate-based utilities only)
- Vitest for testing

## Commands
```bash
# Build
pnpm build

# Type-check
pnpm type-check
pnpm type-check:app2
pnpm type-check:geometry

# Lint/format
pnpm check
pnpm format:fix

# Tests
pnpm test
pnpm test:coverage

# Dev
cd app2 && pnpm dev
```

## Project Structure
```
sg/
├── packages/
│   └── geometry/                          # UNCHANGED - utility functions only
│       └── src/
│           ├── intersection.ts            # coordinate-based: intersection()
│           ├── lines.ts                   # coordinate-based: lineIntersect()
│           └── index.ts
│
└── app2/
    ├── src/
    │   ├── types/
    │   │   └── geometry.ts                # ✅ CANONICAL - GeometryValue types
    │   │
    │   ├── geometry/
    │   │   ├── operations.ts               # UNCHANGED - pure geometry operations
    │   │   ├── squareSteps.ts              # UNCHANGED - step definitions
    │   │   ├── constructors.ts             # UNCHANGED - helper functions
    │   │   ├── construction.ts             # ✅ NEW - Construction class + Ref types
    │   │   ├── construction-to-steps.ts   # ✅ NEW - adapter to Step format
    │   │   ├── renderers/
    │   │   │   └── svgRenderer.ts          # ✅ NEW - rendering layer
    │   │   └── index.ts                    # UPDATE - export new classes
    │   │
    │   └── components/
    │       ├── SquareSvg.tsx              # UNCHANGED - existing component
    │       └── SquaresV2.tsx               # ✅ NEW - proof-of-concept component
    │
    └── backlog/
        ├── SPEC geometry-framework.md     # This document
        └── PLAN geometry-framework.md      # Detailed implementation plan
```

## Code Style

### Naming Conventions
- Types: `PascalCase` (PointRef, LineRef, ConstructionError)
- Functions: `camelCase` (pointAt, lineTowards, midpoint)
- Variables: `camelCase` (mainLine, c1Circle, pi)
- Constants: `UPPER_SNAKE_CASE` (C1_POSITION_RATIO, LINE_EXTENSION_MULTIPLIER)

### Formatting
- Use Oxlint/Oxfmt (existing project config)
- 2-space indentation
- No semicolons
- Prefer explicit return types on public methods

### Type Safety
- All operations use app2's GeometryValue types as canonical
- @sg/geometry utilities used internally with raw coordinates only
- No conversion between type systems - extract coordinates directly

### Example Code
```typescript
// construction.ts
export class Construction {
  private _values = new Map<string, GeometryValue>();
  private _steps: InternalStep[] = [];
  private _stepIndex = 0;

  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);
    this._storeGeom(id, value, []);
    return { id };
  }

  line(p1: PointRef, p2: PointRef, name?: string): LineRef {
    const id = name || `${p1.id}_to_${p2.id}`;
    const pt1 = this.get<Point>(p1);
    const pt2 = this.get<Point>(p2);
    const value: Line = line(pt1.x, pt1.y, pt2.x, pt2.y);
    this._storeGeom(id, value, [p1.id, p2.id]);
    return { id };
  }
}
```

## Testing Strategy

### Framework
- Vitest (already configured in app2)
- Testing approach: Unit tests for Construction class, integration tests for renderer

### Test Locations
```
app2/src/geometry/
├── construction.test.ts        # Core Construction logic
├── renderers/
│   └── svgRenderer.test.ts     # Rendering logic
└── construction-to-steps.test.ts # Adapter logic
```

### Coverage Expectations
- 100% coverage for Construction class public API
- 80%+ coverage for renderer and adapter
- All geometry operations tested with edge cases

### Test Levels
- **Unit**: Individual Construction methods (point, line, circle, intersection, etc.)
- **Integration**: Construction + SvgRenderer working together
- **E2E**: SquaresV2 component renders correctly (manual + Playwright)

## Boundaries

### Always Do
- Run `pnpm type-check` before commits
- Follow naming conventions exactly as specified
- Use app2 GeometryValue types as canonical
- Extract coordinates from GeometryValue types when calling @sg/geometry utilities
- Validate inputs in public methods
- Add JSDoc comments to all public methods
- Keep files under ~700 LOC (split when it improves clarity)

### Ask First
- Adding new dependencies to app2 or packages/geometry
- Changing CI workflow configuration
- Modifying existing files (SquareSvg.tsx, squareSteps.ts, etc.)
- Changing the GeometryValue type definitions

### Never Do
- Import @sg/geometry classes (Point, Line, Circle) - use coordinate-based functions only
- Commit secrets or API keys
- Edit vendor directories or lock files
- Remove failing tests without approval
- Create circular dependencies
- Use `@ts-nocheck` or inline lint suppressions without explanation

## Success Criteria

### Phase 1: Core Construction DSL
- [ ] Construction class implemented with all methods from PLAN
- [ ] All Ref types defined (PointRef, LineRef, CircleRef, PolygonRef, GeomRef)
- [ ] Direction type defined with proper semantics
- [ ] ConstructionError class implemented
- [ ] All geometry creators work (point, line, circle)
- [ ] All derived operations work (pointAt, pointOnLineAtDistance, intersection, extendLine, lineTowards, midpoint, perpendicular, polygon)
- [ ] Step management works (goTo, next, prev, reset, getSteps)
- [ ] Value access works (get, getValues)
- [ ] Error handling implemented (validate, getErrors)
- [ ] Unit tests pass for all Construction methods

### Phase 2: Integration Layer
- [ ] construction-to-steps.ts adapter implemented
- [ ] Adapts Construction steps to Step format
- [ ] Exports added to geometry/index.ts
- [ ] No circular dependencies verified

### Phase 3: Rendering Layer
- [ ] SvgRenderer class implemented
- [ ] drawPoint, drawLine, drawCircle, drawPolygon methods work
- [ ] drawConstruction and drawConstructionUpTo methods work
- [ ] clear() method works
- [ ] GeometryStore integration works
- [ ] Tooltip support implemented

### Phase 4: Proof of Concept
- [ ] SquaresV2.tsx component implemented
- [ ] Creates construction with all 16 square steps
- [ ] Integrates SvgRenderer
- [ ] Step navigation works via goTo()
- [ ] All 16 steps render correctly
- [ ] Final square geometry is correct
- [ ] Error handling is graceful

### Phase 5: Quality
- [ ] All type-checks pass
- [ ] All lint checks pass
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Code follows existing conventions

## Open Questions

None - all architectural decisions resolved in PLAN geometry-framework.md

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     SquaresV2 Component                        │
│  (app2/src/components/SquaresV2.tsx)                         │
│   construction.line(...)    // Returns LineRef              │
│   construction.intersection(...) // Returns PointRef        │
│   // Single API - all operations on Construction              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Construction Class                           │
│  (app2/src/geometry/construction.ts)                        │
│   - Pure geometry logic (no SVG, no rendering)               │
│   - Uses app2 GeometryValue types                              │
│   - Uses @sg/geometry utilities INTERNALLY (coordinates)      │
│   - Holds all geometry in Map<string, GeometryValue>           │
│   - Returns typed Ref objects (PointRef, LineRef, etc.)       │
│   - Eager computation (values computed when methods called)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SvgRenderer Class                           │
│  (app2/src/geometry/renderers/svgRenderer.ts)               │
│   - Pure rendering logic                                     │
│   - Takes GeometryValue types from Construction               │
│   - NO geometry construction logic                         │
│   - Knows about SVG, styles, tooltips                        │
└─────────────────────────────────────────────────────────────┘

Refs (PointRef, LineRef, CircleRef):
  - Pure identifiers: { readonly id: string }
  - NO data storage
  - NO methods
  - Construction holds all data
```

## Key Type Mappings

```typescript
// app2 GeometryValue types (CANONICAL)
interface Point { type: "point"; x: number; y: number; }
interface Line { type: "line"; x1: number; y1: number; x2: number; y2: number; }
interface Circle { type: "circle"; cx: number; cy: number; r: number; }

// Reference types (PURE IDENTIFIERS)
interface PointRef { readonly id: string; }
interface LineRef { readonly id: string; }
interface CircleRef { readonly id: string; }

// @sg/geometry utility functions (COORDINATE-BASED ONLY)
function intersection(x0, y0, r0, x1, y1, r1)  // Circle-circle
function inteceptCircleLineSeg(cx, cy, l1x, l1y, l2x, l2y, r)  // Circle-line
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4)  // Line-line
```

## Resolution for "Other" Intersection

Use explicit exclude parameter matching constructors.ts pattern:
```typescript
intersection(
  circle: CircleRef,
  line: LineRef,
  options: { exclude?: PointRef } | Direction,
  name?: string
): PointRef
```

When `options` is a Direction string: select by direction (north/south/left/right)
When `options` is `{ exclude: PointRef }`: return the other intersection point
