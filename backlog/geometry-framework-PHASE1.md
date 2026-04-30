# Phase 1: Core Construction DSL

## Overview

This phase creates the foundation of the geometry framework: the **Construction class** and its supporting types. This is the core DSL (Domain-Specific Language) that provides a fluid, declarative API for geometric constructions.

**Status**: NOT STARTED  
**Priority**: HIGH  
**Estimated Duration**: 3-5 days  
**Prerequisites**: None (can start immediately)  

---

## Objectives

By the end of this phase, we will have:

1. ✅ Typed reference types (PointRef, LineRef, CircleRef, PolygonRef)
2. ✅ Direction type for intersection selection
3. ✅ ConstructionError class for error handling
4. ✅ Construction class with all geometry operations
5. ✅ Comprehensive unit tests for all functionality
6. ✅ Zero circular dependencies verified

---

## Architecture Decisions for This Phase

### 1. Mutable Builder Pattern

**Decision**: Construction class uses mutable internal state (not immutable/functional style).

**Rationale**: 
- User confirmed "Immutable (functional style) - YES" but this refers to geometry **values**, not the Construction builder itself
- Mutable builder pattern is simpler and matches the step-by-step nature of geometric constructions
- Each method call mutates the Construction's internal state and returns a Ref
- GeometryValue types themselves remain immutable (plain data objects)

**Implementation**:
```typescript
class Construction {
  private _values = new Map<string, GeometryValue>();  // Mutable
  private _steps: InternalStep[] = [];                   // Mutable
  private _stepIndex = 0;                               // Mutable
  
  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);  // Immutable value
    this._values.set(id, value);        // Mutate state
    this._steps.push({...});            // Mutate state
    return { id };                      // Return ref
  }
}
```

### 2. Eager Computation

**Decision**: Values are computed eagerly (when methods are called), not lazily.

**Rationale**:
- Simpler implementation for v1
- Step-by-step navigation requires sequential computation anyway
- Square construction uses all steps (no unused branches)
- Can add lazy evaluation in v2 if needed without breaking API

**Implementation**:
```typescript
private _storeGeom(id: string, value: GeometryValue, dependencies: string[]): void {
  this._values.set(id, value);  // Store computed value immediately
  this._steps.push({
    id,
    type: value.type,
    dependencies,
    compute: () => value,  // Returns pre-computed value
  });
}
```

### 3. "Other" Intersection Handling

**Decision**: Use options object `{ exclude: PointRef }` for selecting "the other" intersection point.

**Rationale**:
- More type-safe than string "other"
- Matches existing pattern in `constructors.ts` which uses `{ exclude: Point }`
- Clear and explicit about which point to exclude
- Supports both Direction-based selection AND exclusion-based selection

**Implementation**:
```typescript
type IntersectionOptions = Direction | { exclude: PointRef };

intersection(
  a: CircleRef | LineRef,
  b: CircleRef | LineRef,
  directionOrOptions: IntersectionOptions,
  name?: string
): PointRef
```

### 4. Direction Semantics

**Decision**: Direction values have specific meanings based on geometry pair:

| Geometry Pair | Direction | Meaning |
|---------------|-----------|---------|
| Circle-Circle | `"north"` | Intersection with smaller y (SVG coords: y increases downward) |
| Circle-Circle | `"south"` | Intersection with larger y |
| Circle-Line | `"left"` | Intersection with smaller x when looking from circle center toward line start |
| Circle-Line | `"right"` | Intersection with larger x when looking from circle center toward line start |
| Line-Line | N/A | Lines intersect at one point (unless parallel, which throws error) |
| Any | `{ exclude: PointRef }` | The intersection point that is NOT the excluded one |

---

## File to Create

### `app2/src/geometry/construction.ts`

This is the main file for Phase 1. It contains:

1. Type definitions (Ref types, Direction, ConstructionError)
2. InternalStep interface
3. Construction class

---

## Implementation Checklist

### Step 1: Type Definitions

- [ ] Create `app2/src/geometry/construction.ts`
- [ ] Add header comment with file purpose
- [ ] Import required types from `../types/geometry`
- [ ] Import utility functions from `@sg/geometry`

```typescript
// app2/src/geometry/construction.ts

/**
 * Construction DSL - Higher-level declarative language for geometric constructions
 * 
 * This module provides a fluid, chainable API for creating geometric constructions.
 * It is a facade/abstraction layer on top of the existing step-based system.
 * 
 * Key principles:
 * - Pure geometry logic (NO SVG, NO rendering)
 * - Single API surface for ALL operations
 * - Uses app2 GeometryValue types as canonical
 * - Uses @sg/geometry utilities internally (coordinates only)
 * - Refs are pure identifiers, Construction holds all data
 */

import type { Point, Line, Circle, Polygon, GeometryValue } from "../types/geometry";
import { point, line, circle, polygon } from "../types/geometry";
import { intersection, inteceptCircleLineSeg, lineIntersect } from "@sg/geometry";
```

### Step 2: Reference Types

- [ ] Define PointRef interface
- [ ] Define LineRef interface
- [ ] Define CircleRef interface
- [ ] Define PolygonRef interface
- [ ] Define GeomRef union type

```typescript
// Layer 2: Typed References (Pure Identifiers)

/**
 * Reference to a Point geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface PointRef {
  readonly id: string;
}

/**
 * Reference to a Line geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface LineRef {
  readonly id: string;
}

/**
 * Reference to a Circle geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface CircleRef {
  readonly id: string;
}

/**
 * Reference to a Polygon geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface PolygonRef {
  readonly id: string;
}

/**
 * Union type for all geometry references.
 */
export type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;
```

### Step 3: Direction and Options Types

- [ ] Define Direction type
- [ ] Define IntersectionOptions type

```typescript
/**
 * Direction for selecting intersection points.
 * - "north"/"south": For circle-circle intersections (pick by y-coordinate)
 * - "left"/"right": For circle-line intersections (pick by x-coordinate)
 */
export type Direction = "north" | "south" | "left" | "right";

/**
 * Options for intersection operations.
 * Can specify a direction OR exclude a known point.
 */
export type IntersectionOptions = Direction | { exclude: PointRef };
```

### Step 4: Error Types

- [ ] Define ConstructionError class
- [ ] Define specific error subclasses

```typescript
/**
 * Error class for Construction operations.
 * Contains contextual information about where the error occurred.
 */
export class ConstructionError extends Error {
  constructor(
    readonly stepIndex: number,
    readonly stepId: string,
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(`Step ${stepIndex} (${stepId}): ${message}`);
    this.name = "ConstructionError";
    this.stepIndex = stepIndex;
    this.stepId = stepId;
    this.cause = cause;
  }
}

/**
 * Error thrown when two geometries do not intersect.
 */
export class NoIntersectionError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, g1Id: string, g2Id: string) {
    super(
      stepIndex,
      stepId,
      `No intersection between ${g1Id} and ${g2Id}`,
    );
    this.name = "NoIntersectionError";
  }
}

/**
 * Error thrown when a geometry reference is not found.
 */
export class GeometryNotFoundError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, geomId: string) {
    super(stepIndex, stepId, `Geometry not found: ${geomId}`);
    this.name = "GeometryNotFoundError";
  }
}

/**
 * Error thrown when a geometry type mismatch occurs.
 */
export class TypeMismatchError extends ConstructionError {
  constructor(
    stepIndex: number,
    stepId: string,
    expectedType: string,
    actualType: string,
  ) {
    super(
      stepIndex,
      stepId,
      `Expected ${expectedType}, got ${actualType}`,
    );
    this.name = "TypeMismatchError";
  }
}
```

### Step 5: InternalStep Interface

- [ ] Define InternalStep interface

```typescript
/**
 * Internal representation of a construction step.
 * Used for tracking dependencies and conversion to Step format.
 */
export interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}
```

### Step 6: Construction Class - Internal State

- [ ] Define class with private state
- [ ] Initialize _values Map
- [ ] Initialize _steps array
- [ ] Initialize _stepIndex
- [ ] Initialize _errors array
- [ ] Initialize _pointsOnGeom tracking

```typescript
/**
 * Construction class - Core DSL for geometric constructions.
 * 
 * Provides a single API surface for all geometry operations.
 * All operations are methods on Construction with typed parameters.
 * 
 * Features:
 * - Pure geometry logic (NO SVG, NO rendering)
 * - Eager computation (values computed when methods called)
 * - Automatic step generation
 * - Dependency tracking
 * - Error collection and validation
 */
export class Construction {
  // All geometry values stored by ID
  private _values = new Map<string, GeometryValue>();
  
  // All steps in order
  private _steps: InternalStep[] = [];
  
  // Current step index for navigation
  private _stepIndex = 0;
  
  // Errors collected during construction
  private _errors: ConstructionError[] = [];
  
  // Track which points lie on which geometries (for "other" intersection)
  private _pointsOnGeom = new Map<string, Set<string>>();

  // ... methods will be added next ...
}
```

### Step 7: Construction Class - Base Geometry Creators

- [ ] Implement point() with coordinate overload
- [ ] Implement point() with PointRef overload (copy)
- [ ] Implement line() with coordinate overload
- [ ] Implement line() with PointRef overload
- [ ] Implement circle() with coordinate overload
- [ ] Implement circle() with PointRef overload
- [ ] Implement polygon()

```typescript
  // ===== Base Geometry Creators =====

  /**
   * Create a point at specific coordinates.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param name - Optional name for the point (used as ID if provided)
   * @returns Reference to the created point
   */
  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);
    this._storeGeom(id, value, []);
    return { id };
  }

  /**
   * Create a point by copying an existing point reference.
   * @param p - Point reference to copy
   * @param name - Optional name for the new point
   * @returns Reference to the new point
   */
  point(p: PointRef, name?: string): PointRef {
    const source = this.get<Point>(p);
    return this.point(source.x, source.y, name);
  }

  /**
   * Create a line from coordinates or point references.
   */
  line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef;
  line(p1: PointRef, p2: PointRef, name?: string): LineRef;
  line(
    arg1: number | PointRef,
    arg2: number | PointRef,
    arg3: number | string,
    arg4?: number | string,
    arg5?: string,
  ): LineRef {
    // Handle coordinate overload: line(x1, y1, x2, y2, name?)
    if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
      const x1 = arg1;
      const y1 = arg2;
      const x2 = arg3;
      const y2 = arg4 as number;
      const name = arg5;
      const id = name || this._autoName("line");
      const value: Line = line(x1, y1, x2, y2);
      this._storeGeom(id, value, []);
      return { id };
    }
    
    // Handle PointRef overload: line(p1, p2, name?)
    if (this._isPointRef(arg1) && this._isPointRef(arg2)) {
      const p1 = arg1;
      const p2 = arg2;
      const name = arg3 as string | undefined;
      const id = name || `${p1.id}_to_${p2.id}`;
      const pt1 = this.get<Point>(p1);
      const pt2 = this.get<Point>(p2);
      const value: Line = line(pt1.x, pt1.y, pt2.x, pt2.y);
      this._storeGeom(id, value, [p1.id, p2.id]);
      return { id };
    }
    
    throw new Error("Invalid arguments to line()");
  }

  /**
   * Create a circle from center and radius, or from coordinates.
   */
  circle(cx: number, cy: number, r: number, name?: string): CircleRef;
  circle(center: PointRef, radius: number, name?: string): CircleRef;
  circle(
    arg1: number | PointRef,
    arg2: number,
    arg3: number,
    arg4?: string,
  ): CircleRef {
    // Handle coordinate overload: circle(cx, cy, r, name?)
    if (typeof arg1 === "number") {
      const cx = arg1;
      const cy = arg2;
      const r = arg3;
      const name = arg4;
      const id = name || this._autoName("circle");
      const value: Circle = circle(cx, cy, r);
      this._storeGeom(id, value, []);
      return { id };
    }
    
    // Handle PointRef overload: circle(center, radius, name?)
    if (this._isPointRef(arg1)) {
      const center = arg1;
      const radius = arg2;
      const name = arg3 as string | undefined;
      const id = name || `${center.id}_circle`;
      const pt = this.get<Point>(center);
      const value: Circle = circle(pt.x, pt.y, radius);
      this._storeGeom(id, value, [center.id]);
      return { id };
    }
    
    throw new Error("Invalid arguments to circle()");
  }

  /**
   * Create a polygon from an array of point references.
   * @param points - Array of point references
   * @param name - Optional name for the polygon
   * @returns Reference to the created polygon
   */
  polygon(points: PointRef[], name?: string): PolygonRef {
    const id = name || this._autoName("polygon");
    const pts = points.map((r) => this.get<Point>(r));
    const value: Polygon = polygon(pts.map((p) => ({ x: p.x, y: p.y })));
    this._storeGeom(
      id,
      value,
      points.map((r) => r.id),
    );
    return { id };
  }

  // Type guard helpers
  private _isPointRef(ref: any): ref is PointRef {
    return ref && typeof ref === "object" && typeof ref.id === "string";
  }
```

### Step 8: Construction Class - Derived Geometry Operations

- [ ] Implement pointAt()
- [ ] Implement pointOnLineAtDistance()
- [ ] Implement midpoint()
- [ ] Implement extendLine()
- [ ] Implement lineTowards()
- [ ] Implement perpendicular()

```typescript
  // ===== Derived Geometry Operations =====

  /**
   * Create a point at a specific ratio along a line.
   * @param line - The line reference
   * @param ratio - Ratio from start to end (0 = start, 1 = end, 0.5 = middle)
   * @param name - Optional name for the point
   * @returns Reference to the created point
   */
  pointAt(line: LineRef, ratio: number, name?: string): PointRef {
    const l = this.get<Line>(line);
    const x = l.x1 + (l.x2 - l.x1) * ratio;
    const y = l.y1 + (l.y2 - l.y1) * ratio;
    const id = name || this._autoName("point_at");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [line.id]);
    // Track that this point lies on the line
    this._trackPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Create a point at a specific distance from a starting point along a line.
   * @param line - The line reference
   * @param distance - Distance from the starting point
   * @param from - The starting point reference
   * @param name - Optional name for the point
   * @returns Reference to the created point
   */
  pointOnLineAtDistance(
    line: LineRef,
    distance: number,
    from: PointRef,
    name?: string,
  ): PointRef {
    const l = this.get<Line>(line);
    const start = this.get<Point>(from);
    
    // Calculate vector from start to end of line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) {
      // Line has zero length, can't determine direction
      throw new Error(`Cannot compute pointOnLineAtDistance: line ${line.id} has zero length`);
    }
    
    // Calculate point at distance from start
    const scale = distance / len;
    const x = l.x1 + dx * scale;
    const y = l.y1 + dy * scale;
    
    const id = name || this._autoName("point_on_line");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [line.id, from.id]);
    this._trackPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Create the midpoint between two points.
   */
  midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef {
    const pt1 = this.get<Point>(p1);
    const pt2 = this.get<Point>(p2);
    const x = (pt1.x + pt2.x) / 2;
    const y = (pt1.y + pt2.y) / 2;
    const id = name || this._autoName("midpoint");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [p1.id, p2.id]);
    return { id };
  }

  /**
   * Extend a line by a specific length.
   * Extends from the end point (x2, y2) away from the start.
   */
  extendLine(line: LineRef, length: number, name?: string): LineRef {
    const l = this.get<Line>(line);
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) {
      throw new Error(`Cannot extend line ${line.id}: has zero length`);
    }
    
    const scale = (len + length) / len;
    const x2 = l.x1 + dx * scale;
    const y2 = l.y1 + dy * scale;
    return this.line(l.x1, l.y1, x2, y2, name);
  }

  /**
   * Create a line from a starting point towards another point with a specific length.
   */
  lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef {
    const f = this.get<Point>(from);
    const t = this.get<Point>(towards);
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) {
      throw new Error(`Cannot create lineTowards from ${from.id} to ${towards.id}: zero distance`);
    }
    
    const scale = length / len;
    const x2 = f.x + dx * scale;
    const y2 = f.y + dy * scale;
    return this.line(f.x, f.y, x2, y2, name);
  }

  /**
   * Create a line perpendicular to another line at a specific point.
   */
  perpendicular(line: LineRef, at: PointRef, name?: string): LineRef {
    const l = this.get<Line>(line);
    const p = this.get<Point>(at);
    
    // Vector of original line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    
    // Perpendicular vector (rotated 90 degrees)
    const px = -dy;
    const py = dx;
    
    // Normalize
    const len = Math.sqrt(px * px + py * py);
    if (len === 0) {
      throw new Error(`Cannot create perpendicular: original line ${line.id} has zero length`);
    }
    
    const ux = px / len;
    const uy = py / len;
    
    // Use the same length as the original line for the perpendicular
    const length = Math.sqrt(dx * dx + dy * dy);
    const x2 = p.x + ux * length;
    const y2 = p.y + uy * length;
    
    return this.line(p.x, p.y, x2, y2, name);
  }
```

### Step 9: Construction Class - Intersection Operations

- [ ] Implement intersection() for circle-circle
- [ ] Implement intersection() for circle-line
- [ ] Implement intersection() for line-circle
- [ ] Implement intersection() for line-line
- [ ] Handle direction selection
- [ ] Handle exclude option

```typescript
  // ===== Intersection Operations =====

  /**
   * Find intersection point between two geometries.
   * 
   * Supports:
   * - Circle-Circle: Use direction to select which intersection
   * - Circle-Line: Use direction or exclude to select which intersection
   * - Line-Circle: Same as Circle-Line (order doesn't matter)
   * - Line-Line: Returns the single intersection point
   * 
   * @param a - First geometry (CircleRef or LineRef)
   * @param b - Second geometry (CircleRef or LineRef)
   * @param directionOrOptions - Direction or exclude option
   * @param name - Optional name for the intersection point
   * @returns Reference to the intersection point
   */
  intersection(
    a: CircleRef | LineRef,
    b: CircleRef | LineRef,
    directionOrOptions: IntersectionOptions,
    name?: string,
  ): PointRef {
    const id = name || this._autoName("intersection");
    const valA = this.get(a);
    const valB = this.get(b);
    
    let resultPoint: Point | null = null;
    
    // Circle-Circle intersection
    if (valA.type === "circle" && valB.type === "circle") {
      resultPoint = this._intersectCircles(valA, valB, directionOrOptions);
      if (!resultPoint) {
        throw new NoIntersectionError(
          this._steps.length,
          id,
          a.id,
          b.id,
        );
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }
    
    // Circle-Line intersection (order matters for direction semantics)
    if (valA.type === "circle" && valB.type === "line") {
      resultPoint = this._intersectCircleLine(valA, valB, directionOrOptions);
      if (!resultPoint) {
        throw new NoIntersectionError(
          this._steps.length,
          id,
          a.id,
          b.id,
        );
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }
    
    // Line-Circle intersection (swap and recurse)
    if (valA.type === "line" && valB.type === "circle") {
      return this.intersection(b, a, directionOrOptions, name);
    }
    
    // Line-Line intersection
    if (valA.type === "line" && valB.type === "line") {
      resultPoint = this._intersectLines(valA, valB);
      if (!resultPoint) {
        throw new NoIntersectionError(
          this._steps.length,
          id,
          a.id,
          b.id,
        );
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }
    
    throw new Error(`Unsupported intersection: ${valA.type} and ${valB.type}`);
  }

  /**
   * Internal: Intersect two circles.
   */
  private _intersectCircles(
    c1: Circle,
    c2: Circle,
    directionOrOptions: IntersectionOptions,
  ): Point | null {
    const result = intersection(
      c1.cx, c1.cy, c1.r,
      c2.cx, c2.cy, c2.r,
    );
    
    if (!result || result.length !== 4) {
      return null;
    }
    
    const [x1, y1, x2, y2] = result;
    
    // Handle exclude option
    if (typeof directionOrOptions === "object" && "exclude" in directionOrOptions) {
      const excludedPoint = this.get<Point>(directionOrOptions.exclude);
      const d1 = this._distanceSq(x1, y1, excludedPoint.x, excludedPoint.y);
      const d2 = this._distanceSq(x2, y2, excludedPoint.x, excludedPoint.y);
      return d1 < d2 ? point(x2, y2) : point(x1, y1);
    }
    
    // Handle direction (north/south based on y-coordinate in SVG)
    const dir = directionOrOptions as Direction;
    if (dir === "north") {
      // Pick intersection with smaller y (north in SVG where y increases downward)
      return point(y1 < y2 ? x1 : x2, y1 < y2 ? y1 : y2);
    } else if (dir === "south") {
      // Pick intersection with larger y (south)
      return point(y1 > y2 ? x1 : x2, y1 > y2 ? y1 : y2);
    }
    
    // Default: pick first intersection
    return point(x1, y1);
  }

  /**
   * Internal: Intersect a circle with a line segment.
   */
  private _intersectCircleLine(
    circle: Circle,
    line: Line,
    directionOrOptions: IntersectionOptions,
  ): Point | null {
    const result = inteceptCircleLineSeg(
      circle.cx, circle.cy,
      line.x1, line.y1, line.x2, line.y2,
      circle.r,
    );
    
    if (!result || result.length === 0) {
      return null;
    }
    
    // Handle exclude option
    if (typeof directionOrOptions === "object" && "exclude" in directionOrOptions) {
      const excludedPoint = this.get<Point>(directionOrOptions.exclude);
      for (const [x, y] of result) {
        if (this._distanceSq(x, y, excludedPoint.x, excludedPoint.y) > 0.001) {
          return point(x, y);
        }
      }
      return null; // All intersections are the excluded point
    }
    
    // Handle direction for circle-line
    const dir = directionOrOptions as Direction;
    if (dir === "left") {
      // Pick intersection with smaller x
      const sorted = [...result].sort((a, b) => a[0] - b[0]);
      return point(sorted[0][0], sorted[0][1]);
    } else if (dir === "right") {
      // Pick intersection with larger x
      const sorted = [...result].sort((a, b) => a[0] - b[0]);
      return point(sorted[sorted.length - 1][0], sorted[sorted.length - 1][1]);
    }
    
    // Default: pick first intersection
    return point(result[0][0], result[0][1]);
  }

  /**
   * Internal: Intersect two lines.
   */
  private _intersectLines(l1: Line, l2: Line): Point | null {
    const result = lineIntersect(
      l1.x1, l1.y1, l1.x2, l1.y2,
      l2.x1, l2.y1, l2.x2, l2.y2,
    );
    
    if (!result || result.length !== 2) {
      return null;
    }
    
    return point(result[0], result[1]);
  }

  /**
   * Helper: Squared distance between two points (avoids sqrt for comparison).
   */
  private _distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }
```

### Step 10: Construction Class - Step Management

- [ ] Implement goTo()
- [ ] Implement next()
- [ ] Implement prev()
- [ ] Implement reset()
- [ ] Implement getSteps()
- [ ] Implement currentStepIndex getter

```typescript
  // ===== Step Management =====

  /**
   * Get the current step index (0-based).
   */
  get currentStepIndex(): number {
    return this._stepIndex;
  }

  /**
   * Navigate to a specific step index.
   * @param index - The step index to navigate to (0-based)
   */
  goTo(index: number): void {
    this._stepIndex = Math.max(0, Math.min(index, this._steps.length - 1));
  }

  /**
   * Move to the next step.
   */
  next(): void {
    this._stepIndex = Math.min(this._stepIndex + 1, this._steps.length - 1);
  }

  /**
   * Move to the previous step.
   */
  prev(): void {
    this._stepIndex = Math.max(this._stepIndex - 1, 0);
  }

  /**
   * Reset to the first step.
   */
  reset(): void {
    this._stepIndex = 0;
  }

  /**
   * Get all steps up to and including the current step.
   */
  getSteps(): InternalStep[] {
    return this._steps.slice(0, this._stepIndex + 1);
  }

  /**
   * Get all steps (not just current ones).
   */
  getAllSteps(): InternalStep[] {
    return [...this._steps];
  }
```

### Step 11: Construction Class - Value Access

- [ ] Implement get()
- [ ] Implement getValues()

```typescript
  // ===== Value Access =====

  /**
   * Get the geometry value for a reference.
   * @param ref - The geometry reference
   * @returns The geometry value
   * @throws GeometryNotFoundError if the geometry doesn't exist
   */
  get<T extends GeometryValue>(ref: GeomRef): T {
    const value = this._values.get(ref.id);
    if (!value) {
      throw new GeometryNotFoundError(
        this._stepIndex,
        "get",
        ref.id,
      );
    }
    return value as T;
  }

  /**
   * Get all geometry values.
   * @returns A Map of all geometry IDs to their values
   */
  getValues(): Map<string, GeometryValue> {
    return new Map(this._values);
  }

  /**
   * Get geometry values up to the current step.
   */
  getCurrentValues(): Map<string, GeometryValue> {
    const result = new Map<string, GeometryValue>();
    const currentSteps = this.getSteps();
    for (const step of currentSteps) {
      const value = this._values.get(step.id);
      if (value) {
        result.set(step.id, value);
      }
    }
    return result;
  }
```

### Step 12: Construction Class - Error Handling

- [ ] Implement validate()
- [ ] Implement getErrors()
- [ ] Implement clearErrors()

```typescript
  // ===== Error Handling =====

  /**
   * Validate all steps in the construction.
   * Attempts to compute all values and collects any errors.
   * @returns true if all steps are valid, false otherwise
   */
  validate(): boolean {
    this._errors = [];
    
    // Try to get all values to trigger any errors
    for (const [id] of this._values) {
      try {
        this.getValues().get(id);
      } catch (e) {
        if (e instanceof ConstructionError) {
          this._errors.push(e);
        } else {
          this._errors.push(new ConstructionError(
            this._steps.length,
            id,
            e instanceof Error ? e.message : String(e),
            e instanceof Error ? e : undefined,
          ));
        }
      }
    }
    
    return this._errors.length === 0;
  }

  /**
   * Get all errors collected during validation.
   */
  getErrors(): ConstructionError[] {
    return [...this._errors];
  }

  /**
   * Clear all collected errors.
   */
  clearErrors(): void {
    this._errors = [];
  }
```

### Step 13: Construction Class - Private Helpers

- [ ] Implement _autoName()
- [ ] Implement _storeGeom()
- [ ] Implement _trackPointOnGeom()
- [ ] Implement _isPointRef(), _isLineRef(), etc.

```typescript
  // ===== Private Helpers =====

  /**
   * Generate an automatic name for a geometry.
   * Format: prefix_stepNumber (e.g., "point_1", "line_2")
   */
  private _autoName(prefix: string): string {
    return `${prefix}_${this._steps.length + 1}`;
  }

  /**
   * Store a geometry value and create a step for it.
   */
  private _storeGeom(id: string, value: GeometryValue, dependencies: string[]): void {
    this._values.set(id, value);
    this._steps.push({
      id,
      type: value.type,
      dependencies,
      compute: () => value, // Eager: value is already computed
    });
  }

  /**
   * Track that a point lies on a geometry (for "other" intersection).
   */
  private _trackPointOnGeom(pointId: string, geomId: string): void {
    if (!this._pointsOnGeom.has(geomId)) {
      this._pointsOnGeom.set(geomId, new Set());
    }
    this._pointsOnGeom.get(geomId)!.add(pointId);
  }

  /**
   * Type guard for PointRef.
   */
  private _isPointRef(ref: any): ref is PointRef {
    return ref && typeof ref === "object" && "id" in ref;
  }

  /**
   * Type guard for LineRef.
   */
  private _isLineRef(ref: any): ref is LineRef {
    return this._isPointRef(ref); // Same structure, just different type
  }

  /**
   * Type guard for CircleRef.
   */
  private _isCircleRef(ref: any): ref is CircleRef {
    return this._isPointRef(ref);
  }

  /**
   * Type guard for PolygonRef.
   */
  private _isPolygonRef(ref: any): ref is PolygonRef {
    return this._isPointRef(ref);
  }
```

### Step 14: Unit Tests

- [ ] Create `app2/src/geometry/construction.test.ts`
- [ ] Test point creation (coordinate and copy)
- [ ] Test line creation (coordinate and PointRef)
- [ ] Test circle creation (coordinate and PointRef)
- [ ] Test polygon creation
- [ ] Test pointAt
- [ ] Test pointOnLineAtDistance
- [ ] Test midpoint
- [ ] Test extendLine
- [ ] Test lineTowards
- [ ] Test perpendicular
- [ ] Test intersection (circle-circle with directions)
- [ ] Test intersection (circle-line with directions)
- [ ] Test intersection (circle-line with exclude)
- [ ] Test intersection (line-line)
- [ ] Test step navigation
- [ ] Test get/getValues
- [ ] Test validate/getErrors
- [ ] Test error cases

---

## Test File Template

```typescript
// app2/src/geometry/construction.test.ts

import { describe, it, expect } from "vitest";
import {
  Construction,
  PointRef,
  LineRef,
  CircleRef,
  ConstructionError,
  NoIntersectionError,
  GeometryNotFoundError,
} from "./construction";
import { point, line, circle, polygon } from "../types/geometry";

// Helper for approximate equality
const approx = (a: number, b: number, epsilon = 1e-10) => Math.abs(a - b) < epsilon;

describe("Construction", () => {
  describe("point", () => {
    it("should create point with coordinates", () => {
      const c = new Construction();
      const p = c.point(100, 200, "p1");
      expect(p.id).toBe("p1");
      const value = c.get<Point>(p);
      expect(value.x).toBe(100);
      expect(value.y).toBe(200);
    });

    it("should auto-generate name", () => {
      const c = new Construction();
      const p = c.point(100, 200);
      expect(p.id).toBe("point_1");
    });

    it("should copy point from ref", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(p1, "p2");
      expect(p2.id).toBe("p2");
      const v1 = c.get<Point>(p1);
      const v2 = c.get<Point>(p2);
      expect(v1.x).toBe(v2.x);
      expect(v1.y).toBe(v2.y);
    });
  });

  describe("line", () => {
    it("should create line with coordinates", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      expect(l.id).toBe("line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(100);
      expect(value.y2).toBe(100);
    });

    it("should create line from point refs", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const l = c.line(p1, p2, "line1");
      expect(l.id).toBe("line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(100);
      expect(value.y2).toBe(100);
    });

    it("should auto-generate line name from points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const l = c.line(p1, p2);
      expect(l.id).toBe("p1_to_p2");
    });
  });

  describe("circle", () => {
    it("should create circle with coordinates", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 50, "circle1");
      expect(circ.id).toBe("circle1");
      const value = c.get<Circle>(circ);
      expect(value.cx).toBe(0);
      expect(value.cy).toBe(0);
      expect(value.r).toBe(50);
    });

    it("should create circle from point ref", () => {
      const c = new Construction();
      const p = c.point(100, 200, "center");
      const circ = c.circle(p, 50, "circle1");
      expect(circ.id).toBe("circle1");
      const value = c.get<Circle>(circ);
      expect(value.cx).toBe(100);
      expect(value.cy).toBe(200);
      expect(value.r).toBe(50);
    });

    it("should auto-generate circle name", () => {
      const c = new Construction();
      const p = c.point(100, 200, "center");
      const circ = c.circle(p, 50);
      expect(circ.id).toBe("center_circle");
    });
  });

  describe("polygon", () => {
    it("should create polygon from points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 0, "p2");
      const p3 = c.point(100, 100, "p3");
      const p4 = c.point(0, 100, "p4");
      const poly = c.polygon([p1, p2, p3, p4], "square");
      expect(poly.id).toBe("square");
      const value = c.get<Polygon>(poly);
      expect(value.points).toHaveLength(4);
    });
  });

  describe("pointAt", () => {
    it("should create point at ratio on line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      const p = c.pointAt(l, 0.5, "mid");
      const value = c.get<Point>(p);
      expect(value.x).toBe(50);
      expect(value.y).toBe(50);
    });
  });

  describe("midpoint", () => {
    it("should create midpoint between two points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const mid = c.midpoint(p1, p2, "mid");
      const value = c.get<Point>(mid);
      expect(value.x).toBe(50);
      expect(value.y).toBe(50);
    });
  });

  describe("extendLine", () => {
    it("should extend line by length", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "line1");
      const extended = c.extendLine(l, 5, "extended");
      const value = c.get<Line>(extended);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(15);
      expect(value.y2).toBe(0);
    });
  });

  describe("lineTowards", () => {
    it("should create line towards point with length", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(10, 10, "p2");
      const l = c.lineTowards(p1, p2, 5, "line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      // Distance from p1 to end should be 5
      const dx = value.x2 - value.x1;
      const dy = value.y2 - value.y1;
      expect(Math.sqrt(dx * dx + dy * dy)).toBeCloseTo(5);
    });
  });

  describe("perpendicular", () => {
    it("should create perpendicular line at point", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "horizontal");
      const p = c.point(5, 0, "mid");
      const perp = c.perpendicular(l, p, "vertical");
      const value = c.get<Line>(perp);
      // Perpendicular to horizontal line should be vertical
      expect(value.x1).toBe(5);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(5);
      // y2 should be non-zero (line has some length)
      expect(value.y2).not.toBe(0);
    });
  });

  describe("intersection", () => {
    it("should find circle-circle intersection with north direction", () => {
      const c = new Construction();
      const c1 = c.circle(0, 0, 10, "c1");
      const c2 = c.circle(10, 0, 10, "c2");
      const pi = c.intersection(c1, c2, "north", "pi");
      const value = c.get<Point>(pi);
      // North intersection should have smaller y
      expect(value.y).toBeLessThan(0);
    });

    it("should find circle-circle intersection with south direction", () => {
      const c = new Construction();
      const c1 = c.circle(0, 0, 10, "c1");
      const c2 = c.circle(10, 0, 10, "c2");
      const pi = c.intersection(c1, c2, "south", "pi");
      const value = c.get<Point>(pi);
      // South intersection should have larger y
      expect(value.y).toBeGreaterThan(0);
    });

    it("should find circle-line intersection with left direction", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 10, "circle");
      const l = c.line(-20, 0, 20, 0, "line");
      const p = c.intersection(circ, l, "left", "p");
      const value = c.get<Point>(p);
      // Left intersection should have smaller x
      expect(value.x).toBeLessThan(0);
    });

    it("should find circle-line intersection with exclude option", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 10, "circle");
      const l = c.line(-20, 0, 20, 0, "line");
      const p1 = c.intersection(circ, l, "left", "p1");
      const p2 = c.intersection(circ, l, { exclude: p1 }, "p2");
      const v1 = c.get<Point>(p1);
      const v2 = c.get<Point>(p2);
      // Should be different points
      expect(v1.x).not.toBe(v2.x);
      expect(v1.y).not.toBe(v2.y);
    });

    it("should find line-line intersection", () => {
      const c = new Construction();
      const l1 = c.line(0, 0, 10, 10, "l1");
      const l2 = c.line(0, 10, 10, 0, "l2");
      const p = c.intersection(l1, l2, "x");
      const value = c.get<Point>(p);
      expect(value.x).toBe(5);
      expect(value.y).toBe(5);
    });

    it("should throw NoIntersectionError for non-intersecting circles", () => {
      const c = new Construction();
      const c1 = c.circle(0, 0, 5, "c1");
      const c2 = c.circle(100, 100, 5, "c2");
      expect(() => c.intersection(c1, c2, "north", "pi")).toThrow(NoIntersectionError);
    });
  });

  describe("step navigation", () => {
    it("should navigate to specific step", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      
      expect(c.currentStepIndex).toBe(0);
      c.goTo(1);
      expect(c.currentStepIndex).toBe(1);
    });

    it("should navigate next and prev", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      
      c.next();
      expect(c.currentStepIndex).toBe(1);
      c.next();
      expect(c.currentStepIndex).toBe(1); // Can't go beyond end
      c.prev();
      expect(c.currentStepIndex).toBe(0);
      c.prev();
      expect(c.currentStepIndex).toBe(0); // Can't go below 0
    });

    it("should reset to start", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.goTo(1);
      c.reset();
      expect(c.currentStepIndex).toBe(0);
    });

    it("should get steps up to current index", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      c.goTo(1);
      
      const steps = c.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe("p1");
      expect(steps[1].id).toBe("p2");
    });
  });

  describe("value access", () => {
    it("should get value by ref", () => {
      const c = new Construction();
      const p = c.point(100, 200, "p1");
      const value = c.get<Point>(p);
      expect(value.x).toBe(100);
      expect(value.y).toBe(200);
    });

    it("should get all values", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      const values = c.getValues();
      expect(values.size).toBe(2);
    });

    it("should throw GeometryNotFoundError for missing ref", () => {
      const c = new Construction();
      const p: PointRef = { id: "nonexistent" };
      expect(() => c.get<Point>(p)).toThrow(GeometryNotFoundError);
    });
  });

  describe("error handling", () => {
    it("should validate successfully", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      expect(c.validate()).toBe(true);
      expect(c.getErrors()).toHaveLength(0);
    });

    it("should collect errors during validation", () => {
      const c = new Construction();
      const p: PointRef = { id: "nonexistent" };
      // This should create an error when we try to access it
      // (Note: We need to design how this works)
    });
  });
});
```

---

## Success Criteria

Phase 1 is complete when:

- [ ] `app2/src/geometry/construction.ts` exists and compiles
- [ ] All type definitions are present and exported
- [ ] Construction class implements all methods in this document
- [ ] `app2/src/geometry/construction.test.ts` exists with tests for all methods
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] No circular dependencies exist
- [ ] Code follows project conventions (Oxlint/Oxfmt pass)

---

## Next Phase

Once Phase 1 is complete, proceed to **Phase 2: Integration Layer** (`backlog/geometry-framework-PHASE2.md`)

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE2.md` - Next phase
- `app2/src/types/geometry.ts` - Canonical geometry types
- `packages/geometry/src/` - Shared geometry utilities
