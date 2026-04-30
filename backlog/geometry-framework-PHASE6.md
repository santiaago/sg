# Phase 6: Documentation & Cleanup

## Overview

This final phase focuses on documentation, cleanup, and ensuring the entire framework is production-ready. This includes comprehensive JSDoc comments, API documentation, examples, and code review.

**Status**: NOT STARTED  
**Priority**: MEDIUM  
**Estimated Duration**: 2-3 days  
**Prerequisites**: Phase 1-5 must be complete  

---

## Objectives

By the end of this phase, we will have:

1. ✅ Comprehensive JSDoc comments for all public APIs
2. ✅ API documentation for Construction class
3. ✅ API documentation for Ref types
4. ✅ API documentation for SvgRenderer class
5. ✅ Examples and README documentation
6. ✅ Full code review and cleanup
7. ✅ All tests passing
8. ✅ TypeScript compilation successful
9. ✅ Lint and format checks passing

---

## Documentation Tasks

### Task 1: Add JSDoc Comments

Add comprehensive JSDoc comments to all public methods and types.

**Files to update**:
- `app2/src/geometry/construction.ts`
- `app2/src/geometry/construction-to-steps.ts`
- `app2/src/geometry/renderers/svgRenderer.ts`
- `app2/src/components/SquaresV2.tsx`

**Example JSDoc Format**:

```typescript
/**
 * Creates a point at specific coordinates.
 * 
 * @param x - The x-coordinate of the point
 * @param y - The y-coordinate of the point
 * @param name - Optional name/ID for the point. If not provided, an auto-generated
 *               name will be used (format: "point_N" where N is the step number)
 * @returns A PointRef that can be used to reference this point in subsequent operations
 * 
 * @example
 * ```typescript
 * const c = new Construction();
 * const p1 = c.point(100, 200, "my_point");
 * const p2 = c.point(0, 0); // auto-named as "point_2"
 * ```
 */
point(x: number, y: number, name?: string): PointRef { ... }
```

**Checklist**:
- [ ] JSDoc for all Construction methods
- [ ] JSDoc for all Ref type interfaces
- [ ] JSDoc for all error classes
- [ ] JSDoc for all SvgRenderer methods
- [ ] JSDoc for SquaresV2 component and props
- [ ] Examples in JSDoc where helpful

---

### Task 2: Create API Documentation

Create a comprehensive API documentation file.

**File**: `backlog/geometry-framework-API.md`

```markdown
# Geometry Framework API Documentation

## Overview

The Geometry Framework provides a higher-level declarative language for geometric constructions.

## Table of Contents

1. [Types](#types)
2. [Construction Class](#construction-class)
3. [SvgRenderer Class](#svgrenderer-class)
4. [Utility Functions](#utility-functions)
5. [Error Classes](#error-classes)

---

## Types

### Reference Types

#### PointRef

```typescript
interface PointRef {
  readonly id: string;
}
```

Reference to a Point geometry. This is a pure identifier with no data storage.

#### LineRef

```typescript
interface LineRef {
  readonly id: string;
}
```

Reference to a Line geometry.

#### CircleRef

```typescript
interface CircleRef {
  readonly id: string;
}
```

Reference to a Circle geometry.

#### PolygonRef

```typescript
interface PolygonRef {
  readonly id: string;
}
```

Reference to a Polygon geometry.

#### GeomRef

```typescript
type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;
```

Union type for all geometry references.

### Other Types

#### Direction

```typescript
type Direction = "north" | "south" | "left" | "right";
```

Direction for selecting intersection points.

#### IntersectionOptions

```typescript
type IntersectionOptions = Direction | { exclude: PointRef };
```

Options for intersection operations. Can specify a direction OR exclude a known point.

---

## Construction Class

The main class for creating geometric constructions. All operations are methods on Construction.

### Constructor

```typescript
new Construction()
```

Creates a new, empty Construction.

### Base Geometry Creators

#### point(x: number, y: number, name?: string): PointRef

Creates a point at specific coordinates.

#### point(p: PointRef, name?: string): PointRef

Creates a point by copying an existing point.

#### line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef

Creates a line from coordinates.

#### line(p1: PointRef, p2: PointRef, name?: string): LineRef

Creates a line from two point references.

#### circle(cx: number, cy: number, r: number, name?: string): CircleRef

Creates a circle from coordinates and radius.

#### circle(center: PointRef, radius: number, name?: string): CircleRef

Creates a circle from center point and radius.

#### polygon(points: PointRef[], name?: string): PolygonRef

Creates a polygon from an array of point references.

### Derived Geometry Operations

#### pointAt(line: LineRef, ratio: number, name?: string): PointRef

Creates a point at a specific ratio along a line (0 = start, 1 = end).

#### pointOnLineAtDistance(line: LineRef, distance: number, from: PointRef, name?: string): PointRef

Creates a point at a specific distance from a starting point along a line.

#### midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef

Creates the midpoint between two points.

#### extendLine(line: LineRef, length: number, name?: string): LineRef

Extends a line by a specific length from its end point.

#### lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef

Creates a line from a starting point towards another point with a specific length.

#### perpendicular(line: LineRef, at: PointRef, name?: string): LineRef

Creates a line perpendicular to another line at a specific point.

### Intersection Operations

#### intersection(a: CircleRef | LineRef, b: CircleRef | LineRef, directionOrOptions: IntersectionOptions, name?: string): PointRef

Finds intersection point between two geometries.

Supports:
- Circle-Circle: Use direction ("north"/"south") to select which intersection
- Circle-Line: Use direction ("left"/"right") or exclude option
- Line-Circle: Same as Circle-Line (order doesn't matter)
- Line-Line: Returns the single intersection point

### Step Management

#### currentStepIndex: number

Get the current step index (0-based, read-only).

#### goTo(index: number): void

Navigate to a specific step index.

#### next(): void

Move to the next step.

#### prev(): void

Move to the previous step.

#### reset(): void

Reset to the first step (index 0).

#### getSteps(): InternalStep[]

Get all steps up to and including the current step.

#### getAllSteps(): InternalStep[]

Get all steps (not just current ones).

### Value Access

#### get<T extends GeometryValue>(ref: GeomRef): T

Get the geometry value for a reference.

#### getValues(): Map<string, GeometryValue>

Get all geometry values.

#### getCurrentValues(): Map<string, GeometryValue>

Get geometry values up to the current step.

### Error Handling

#### validate(): boolean

Validate all steps in the construction. Returns true if valid, false otherwise.

#### getErrors(): ConstructionError[]

Get all errors collected during validation.

#### clearErrors(): void

Clear all collected errors.

### History (Phase 5)

#### undo(): void

Undo the last operation.

#### redo(): void

Redo the last undone operation.

#### clearHistory(): void

Clear all history.

#### getHistoryState(): { canUndo: boolean; canRedo: boolean }

Get the current undo/redo state.

### Parameters (Phase 5)

#### setParameter(name: string, value: number): void

Set a parameter value.

#### getParameter(name: string): number

Get a parameter value.

#### getParameters(): Map<string, number>

Get all parameters.

### Serialization (Phase 5)

#### toJSON(): string

Export construction as JSON string.

#### static fromJSON(json: string): Construction

Load construction from JSON string.

---

## SvgRenderer Class

Rendering layer for geometry constructions.

### Constructor

```typescript
new SvgRenderer(svg: SVGSVGElement, store?: GeometryStore)
```

Creates a new SvgRenderer.

- `svg`: The SVG element to render into
- `store`: Optional GeometryStore for managing elements and tooltips

### Drawing Methods

#### drawPoint(point: Point, options?: DrawPointOptions): SVGElement

Draw a point as a small circle.

#### drawLine(line: Line, options?: DrawLineOptions): SVGElement

Draw a line segment.

#### drawCircle(circle: Circle, options?: DrawCircleOptions): SVGElement

Draw a circle outline.

#### drawPolygon(polygon: Polygon, options?: DrawPolygonOptions): SVGElement

Draw a polygon.

### Construction Drawing

#### drawConstruction(construction: Construction): void

Draw all geometries from a Construction.

#### drawConstructionUpTo(construction: Construction, stepIndex: number): void

Draw geometries from a Construction up to a specific step index.

#### clear(): void

Clear all elements from the SVG.

---

## Utility Functions

### constructionToSteps(construction: Construction): Step[]

Convert a Construction to an array of Step objects for compatibility with existing infrastructure.

---

## Error Classes

### ConstructionError

Base error class for Construction operations.

Properties:
- `stepIndex`: number - The step index where the error occurred
- `stepId`: string - The step ID where the error occurred
- `message`: string - The error message
- `cause?: Error` - The underlying error, if any

### NoIntersectionError extends ConstructionError

Thrown when two geometries do not intersect.

### GeometryNotFoundError extends ConstructionError

Thrown when a geometry reference is not found.

### TypeMismatchError extends ConstructionError

Thrown when a geometry type mismatch occurs.

---

## Drawing Options

### DrawPointOptions

```typescript
interface DrawPointOptions {
  stroke?: number;  // Radius of the point (default: 2)
  name?: string;    // Name for data-name attribute
}
```

### DrawLineOptions

```typescript
interface DrawLineOptions {
  stroke?: number;  // Stroke width (default: 0.5)
  name?: string;    // Name for data-name attribute
}
```

### DrawCircleOptions

```typescript
interface DrawCircleOptions {
  stroke?: number;  // Stroke width (default: 0.5)
  name?: string;    // Name for data-name attribute
}
```

### DrawPolygonOptions

```typescript
interface DrawPolygonOptions {
  stroke?: number;  // Stroke width (default: 0.5)
  fill?: string;    // Fill color (default: "none")
  name?: string;    // Name for data-name attribute
}
```
```

---

### Task 3: Create Examples Documentation

**File**: `backlog/geometry-framework-EXAMPLES.md`

```markdown
# Geometry Framework Examples

## Basic Usage

```typescript
import { Construction } from "./geometry/construction";
import { SvgRenderer } from "./geometry/renderers/svgRenderer";

// Create a construction
const c = new Construction();

// Create some geometry
const p1 = c.point(100, 200, "p1");
const p2 = c.point(300, 400, "p2");
const line = c.line(p1, p2, "my_line");
const mid = c.midpoint(p1, p2, "midpoint");

// Render to SVG
const svg = document.getElementById("my-svg") as SVGSVGElement;
const renderer = new SvgRenderer(svg);
renderer.drawConstruction(c);
```

## Square Construction

See `app2/src/components/SquaresV2.tsx` for the full square construction example.

## Triangle Construction

```typescript
import { Construction } from "./geometry/construction";
import { createTriangleConstruction } from "./geometry/test-constructions/triangle";

const c = new Construction();
createTriangleConstruction(c, 800, 600);
```

## Hexagon Construction

```typescript
import { Construction } from "./geometry/construction";
import { createHexagonConstruction } from "./geometry/test-constructions/hexagon";

const c = new Construction();
createHexagonConstruction(c, 400, 300, 200);
```

## Using with React

```typescript
import { useMemo, useEffect, useRef } from "react";
import { Construction } from "./geometry/construction";
import { SvgRenderer } from "./geometry/renderers/svgRenderer";

function MyGeometryComponent({ step }: { step: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const construction = useMemo(() => {
    const c = new Construction();
    // Build your construction...
    return c;
  }, []);
  
  useEffect(() => {
    if (!svgRef.current) return;
    const renderer = new SvgRenderer(svgRef.current);
    renderer.clear();
    renderer.drawConstructionUpTo(construction, step);
  }, [step, construction]);
  
  return <svg ref={svgRef} />;
}
```

## Working with Intersections

```typescript
const c = new Construction();

// Create two circles
const c1 = c.circle(0, 0, 100, "circle1");
const c2 = c.circle(150, 0, 100, "circle2");

// Find intersection points
const piNorth = c.intersection(c1, c2, "north", "pi_north");
const piSouth = c.intersection(c1, c2, "south", "pi_south");

// Create a line between intersection points
const line = c.line(piNorth, piSouth, "vertical_line");
```

## Using Exclude for "Other" Intersection

```typescript
const c = new Construction();

// Create a circle and a line
const circle = c.circle(0, 0, 100, "circle");
const line = c.line(-200, 0, 200, 0, "horizontal_line");

// Find first intersection
const p1 = c.intersection(circle, line, "left", "p1");

// Find the OTHER intersection (not p1)
const p2 = c.intersection(circle, line, { exclude: p1 }, "p2");
```

## Error Handling

```typescript
const c = new Construction();

// Try to create a line with non-intersecting circles
const c1 = c.circle(0, 0, 50, "c1");
const c2 = c.circle(1000, 1000, 50, "c2");

try {
  const pi = c.intersection(c1, c2, "north", "pi");
} catch (error) {
  if (error instanceof NoIntersectionError) {
    console.error(`Circles don't intersect: ${error.message}`);
  }
}

// Or validate all at once
const isValid = c.validate();
if (!isValid) {
  const errors = c.getErrors();
  for (const error of errors) {
    console.error(error.toString());
  }
}
```

## Serialization

```typescript
// Save construction
const json = construction.toJSON();
localStorage.setItem("my-construction", json);

// Load construction
const savedJson = localStorage.getItem("my-construction");
if (savedJson) {
  const construction = Construction.fromJSON(savedJson);
}
```

## Parameters

```typescript
const c = new Construction();

// Set parameters
c.setParameter("radius", 100);
c.setParameter("extension", 2.2);

// Use parameter by name in geometry operations
const circle = c.circle(0, 0, "radius", "my_circle");
const line = c.lineTowards(p1, p2, "extension" * 100, "extended_line");

// Get parameter value
const radius = c.getParameter("radius");
```
```

---

### Task 4: Create README

**File**: `backlog/geometry-framework-README.md`

```markdown
# Geometry Framework

A higher-level declarative language for geometric constructions that provides a fluid, chainable API while preserving the existing step-based architecture.

## Features

- **Declarative API**: Write geometry code in a clean, readable syntax
- **Type-Safe**: Full TypeScript support with typed references
- **Single API Surface**: All operations are methods on the Construction class
- **Separation of Concerns**: Geometry logic and rendering are completely separate
- **Step-by-Step**: Built-in support for step-by-step construction and navigation
- **Extensible**: Easy to add new geometry types and operations

## Architecture

The framework consists of several layers:

1. **Type System**: Canonical GeometryValue types (Point, Line, Circle, Polygon)
2. **Reference Types**: Typed identifiers for geometry objects
3. **Construction Class**: Core DSL for creating geometry
4. **Step Adapter**: Bridges Construction to existing Step system
5. **SvgRenderer**: Renders GeometryValue types to SVG
6. **Components**: React components that use the framework

See `backlog/PLAN geometry-framework.md` for detailed architecture.

## Installation

The framework is part of the sg monorepo. No additional installation is required.

## Quick Start

```typescript
import { Construction } from "app2/src/geometry/construction";
import { SvgRenderer } from "app2/src/geometry/renderers/svgRenderer";

// Create construction
const c = new Construction();

// Create geometry
const p1 = c.point(100, 200, "p1");
const p2 = c.point(300, 400, "p2");
const line = c.line(p1, p2, "my_line");
const mid = c.midpoint(p1, p2, "midpoint");

// Render
const svg = document.getElementById("my-svg") as SVGSVGElement;
const renderer = new SvgRenderer(svg);
renderer.drawConstruction(c);
```

## Documentation

- [API Documentation](geometry-framework-API.md)
- [Examples](geometry-framework-EXAMPLES.md)
- [Architecture Plan](PLAN geometry-framework.md)

## Implementation Phases

The framework is implemented in 6 phases:

1. **Phase 1**: Core Construction DSL
2. **Phase 2**: Integration Layer
3. **Phase 3**: Rendering Layer
4. **Phase 4**: Proof of Concept (SquaresV2)
5. **Phase 5**: Advanced Features
6. **Phase 6**: Documentation & Cleanup

See the individual phase documents for details:
- [Phase 1](geometry-framework-PHASE1.md)
- [Phase 2](geometry-framework-PHASE2.md)
- [Phase 3](geometry-framework-PHASE3.md)
- [Phase 4](geometry-framework-PHASE4.md)
- [Phase 5](geometry-framework-PHASE5.md)
- [Phase 6](geometry-framework-PHASE6.md)

## Contributing

1. Follow the project coding conventions (see AGENTS.md)
2. Add tests for all new functionality
3. Update documentation as needed
4. Run `pnpm check` before committing

## Testing

Run all tests:

```bash
pnpm test
```

Run TypeScript checks:

```bash
pnpm type-check
```

Run lint and format checks:

```bash
pnpm check
```

## License

This is part of the sg monorepo and follows its licensing.

## Credits

- Architecture and design: User
- Implementation: Mistral Vibe
```

---

## Cleanup Tasks

### Task 5: Code Review and Cleanup

Review all code created in previous phases and make improvements:

**Checklist**:

- [ ] Review `app2/src/geometry/construction.ts`
  - [ ] Ensure all methods have JSDoc
  - [ ] Check for code duplication
  - [ ] Verify error handling is consistent
  - [ ] Check type safety
  - [ ] Verify naming conventions

- [ ] Review `app2/src/geometry/construction-to-steps.ts`
  - [ ] Ensure JSDoc is complete
  - [ ] Verify Step format compatibility
  - [ ] Check error handling

- [ ] Review `app2/src/geometry/renderers/svgRenderer.ts`
  - [ ] Ensure all methods have JSDoc
  - [ ] Verify SVG attribute naming
  - [ ] Check GeometryStore integration
  - [ ] Verify styling options

- [ ] Review `app2/src/components/SquaresV2.tsx`
  - [ ] Ensure JSDoc is complete
  - [ ] Verify React hooks usage
  - [ ] Check error handling
  - [ ] Verify step navigation

- [ ] Review all test files
  - [ ] Ensure comprehensive coverage
  - [ ] Check for flaky tests
  - [ ] Verify test organization
  - [ ] Ensure tests follow best practices

### Task 6: Run Full Verification

Run all verification checks:

```bash
# Install dependencies (if needed)
pnpm install

# Run lint and format checks
pnpm check

# Run TypeScript checks
pnpm type-check

# Run all tests
pnpm test

# Run build
pnpm build
```

Expected: All commands succeed with exit code 0

### Task 7: Fix Any Issues

Fix any issues found during verification:

- [ ] Lint errors
- [ ] Format issues
- [ ] Type errors
- [ ] Test failures
- [ ] Build errors

### Task 8: Final Review

Perform a final review of the entire implementation:

- [ ] Verify no circular dependencies
- [ ] Check import chains
- [ ] Verify all files are in correct locations
- [ ] Ensure all exports are correct
- [ ] Verify documentation is complete
- [ ] Check that all tests pass

---

## Success Criteria

Phase 6 is complete when:

- [ ] All JSDoc comments added
- [ ] API documentation created
- [ ] Examples documentation created
- [ ] README created
- [ ] Code review and cleanup complete
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] Lint and format checks pass (`pnpm check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No circular dependencies
- [ ] All code follows project conventions

---

## Completion

Once Phase 6 is complete, the Geometry Framework is production-ready! 🎉

The framework provides:
- A clean, declarative API for geometric constructions
- Full type safety with TypeScript
- Separation of geometry logic and rendering
- Step-by-step construction and navigation
- Comprehensive documentation and examples

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE5.md` - Previous phase (Advanced Features)
- All phase documents for implementation details
- All source files for the actual implementation
