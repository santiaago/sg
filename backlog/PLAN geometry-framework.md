# Plan: Higher-Level Geometry Construction Framework

## Goal

Create a **higher-level declarative language** for geometric constructions that allows users to write algorithmic geometry steps in a fluid, chainable syntax, while **preserving the existing step-based architecture underneath**.

The new language is a **facade/abstraction layer** on top of the existing step system - steps still exist and are created automatically from the high-level code.

---

## Clarifications from User Feedback

### ✅ Resolved Requirements

1. **Not a replacement**: The step definition system remains underneath; this is a higher-level abstraction layer
2. **New component only**: Create `SquaresV2` component using the new architecture; **do not modify existing code**
3. **Separation of concerns**: Geometry construction and rendering must be completely separate - no drawing logic in construction classes
4. **No backward compatibility**: This framework is only for future components; existing code stays untouched
5. **API design**: Use **Option A - Construction-only API** (single API surface, no dual API, no methods on references)

### 🎯 Design Principles

- **Construction**: Pure geometry logic, no SVG/rendering knowledge, **single API surface for all operations**
- **References**: Typed reference objects (PointRef, LineRef, CircleRef) are **pure identifiers**, Construction holds all data
- **Type safety**: All operations are methods on Construction with typed parameters
- **Rendering**: Separate layer that consumes construction output
- **Steps**: Still exist internally, auto-generated from high-level code
- **Isolation**: New `SquaresV2` component is completely independent of existing `Square` component
- **Single type system**: Use **app2's `GeometryValue` types** as canonical; @sg/geometry utilities used only internally with raw coordinates

---

## Type System Decision

### ✅ Resolution: Use app2 GeometryValue Types as Canonical

**Problem identified**: Original plan mixed two incompatible type systems:

- `@sg/geometry` classes: `class Circle { p: Point; r: number }` (nested center)
- app2 types: `interface Circle { type: "circle"; cx: number; cy: number; r: number }` (flat)

**Solution**:

- **Canonical types**: app2's `GeometryValue` types (Point, Line, Circle, Polygon interfaces)
- **Utilities**: Use `@sg/geometry` **coordinate-based functions** internally (they take raw numbers, not class instances)
- **No conversion needed**: Extract coordinates from app2 types and pass to @sg/geometry functions

**Why this works**:

```typescript
// app2 types map perfectly to @sg/geometry utility parameters:
// app2 Circle: { cx: number, cy: number, r: number }
// @sg/geometry intersection: (x0, y0, r0, x1, y1, r1)
// Just extract: circle.cx, circle.cy, circle.r

// app2 Line: { x1: number, y1: number, x2: number, y2: number }
// @sg/geometry interceptCircleLineSeg: (cx, cy, l1x, l1y, l2x, l2y, r)
// Just extract: line.x1, line.y1, line.x2, line.y2
```

---

## Current State Analysis

### Existing Architecture (Keeps Working Unchanged)

```
app2/src/types/geometry.ts       # GeometryValue types - UNCHANGED, CANONICAL
app2/src/geometry/squareSteps.ts # Step definitions - UNCHANGED
app2/src/geometry/operations.ts  # computeSquareConfig, etc. - UNCHANGED
app2/src/components/Square.tsx    # Current component - UNCHANGED
packages/geometry/src/           # Utility functions - USED INTERNALLY
```

### Strengths to Preserve

1. **Explicit dependencies**: Each step declares `inputs`, `outputs`, `parameters`
2. **Separation of concerns**: `compute()` for math, `draw()` for rendering
3. **Lazy evaluation**: Steps compute only when needed
4. **Type safety**: Geometry types well-defined

---

## New Architecture (Option A: Construction-Only API)

### Layer 1: Type System (Canonical)

**app2/src/types/geometry.ts** - Already perfect for our needs:

```typescript
// These are our canonical geometry types
export interface Point {
  type: "point";
  x: number;
  y: number;
}

export interface Line {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Circle {
  type: "circle";
  cx: number; // Direct access - no nested Point
  cy: number;
  r: number; // c1_c.get().r works!
}

export interface Polygon {
  type: "polygon";
  points: { x: number; y: number }[];
}

export type GeometryValue = Point | Line | Circle | Polygon | Rectangle;
```

### Layer 2: Typed References (Pure Identifiers)

**Location**: `app2/src/geometry/construction.ts`

```typescript
// Typed reference objects - each is JUST an ID with type info
// NO data storage - data lives in Construction

export interface PointRef {
  readonly id: string;
}

export interface LineRef {
  readonly id: string;
}

export interface CircleRef {
  readonly id: string;
}

export interface PolygonRef {
  readonly id: string;
}

// Union type for all geometry references
export type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;
```

### Layer 3: Construction Class (Single API Surface)

**Location**: `app2/src/geometry/construction.ts`

**All operations are methods on Construction** - solves all three issues:

- Issue A: Refs are pure identifiers (no data)
- Issue B: Single API (no dual API confusion)
- Issue C: No type-specific methods on refs (all on Construction with typed params)

```typescript
import type { Point, Line, Circle, Polygon, GeometryValue } from "../types/geometry";
import { point, line, circle, polygon } from "../types/geometry";

// Import only coordinate-based utility functions from @sg/geometry
// NOTE: Use the coordinate-based functions, NOT the classes (Point, Line, Circle)
import { intersection } from "@sg/geometry";
import { inteceptCircleLineSeg, lineIntersect } from "@sg/geometry";

export type Direction = "north" | "south" | "left" | "right" | "up" | "down";

export class Construction {
  private _values = new Map<string, GeometryValue>();
  private _steps: InternalStep[] = [];
  private _stepIndex = 0;

  // ===== Base Geometry Creators =====

  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);
    this._storeGeom(id, value, []);
    return { id };
  }

  line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef;
  line(p1: PointRef, p2: PointRef, name?: string): LineRef;
  line(...args: any[]): LineRef {
    const id = args[2]?.id ? `${args[0].id}_to_${args[1].id}` : args[4] || this._autoName("line");

    let value: Line;
    if (typeof args[0] === "number") {
      value = line(args[0], args[1], args[2], args[3]);
    } else {
      const p1 = this.get<Point>(args[0]);
      const p2 = this.get<Point>(args[1]);
      value = line(p1.x, p1.y, p2.x, p2.y);
    }

    const deps = typeof args[0] === "number" ? [] : [args[0].id, args[1].id];
    this._storeGeom(id, value, deps);
    return { id };
  }

  circle(center: PointRef, radius: number, name?: string): CircleRef;
  circle(cx: number, cy: number, r: number, name?: string): CircleRef;
  circle(...args: any[]): CircleRef {
    const id =
      typeof args[0] === "number" ? args[3] || this._autoName("circle") : `${args[0].id}_circle`;

    let value: Circle;
    if (typeof args[0] === "number") {
      value = circle(args[0], args[1], args[2]);
    } else {
      const center = this.get<Point>(args[0]);
      value = circle(center.x, center.y, args[1]);
    }

    const deps = typeof args[0] === "number" ? [] : [args[0].id];
    this._storeGeom(id, value, deps);
    return { id };
  }

  // ===== Derived Geometry (all operations on Construction) =====

  pointAt(line: LineRef, ratio: number, name?: string): PointRef {
    const l = this.get<Line>(line);
    const x = l.x1 + (l.x2 - l.x1) * ratio;
    const y = l.y1 + (l.y2 - l.y1) * ratio;
    return this.point(x, y, name);
  }

  pointOnLineAtDistance(line: LineRef, distance: number, from: PointRef, name?: string): PointRef {
    const l = this.get<Line>(line);
    const start = this.get<Point>(from);
    // Calculate point at distance along line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = distance / len;
    const x = l.x1 + dx * scale;
    const y = l.y1 + dy * scale;
    return this.point(x, y, name);
  }

  // Intersection - multiple overloads for type safety
  intersection(c1: CircleRef, c2: CircleRef, direction: Direction, name?: string): PointRef;
  intersection(circle: CircleRef, line: LineRef, direction: Direction, name?: string): PointRef;
  intersection(line: LineRef, circle: CircleRef, direction: Direction, name?: string): PointRef;
  intersection(l1: LineRef, l2: LineRef, name?: string): PointRef;
  intersection(
    a: CircleRef | LineRef,
    b: CircleRef | LineRef,
    directionOrName?: Direction | string,
    name?: string,
  ): PointRef {
    const id = name || this._autoName("intersection");
    const valA = this.get(a);
    const valB = this.get(b);

    let resultPoint: Point | null = null;

    if (valA.type === "circle" && valB.type === "circle") {
      // Use @sg/geometry circle-circle intersection
      // NOTE: Function is named `intersection` (not `circleCircleIntersection`)
      const result = intersection(valA.cx, valA.cy, valA.r, valB.cx, valB.cy, valB.r);
      if (!result) throw new Error(`Circles ${a.id} and ${b.id} do not intersect`);
      const [x1, y1, x2, y2] = result;
      const dir = directionOrName as Direction;
      // In SVG: y increases downward, so "north" = smaller y, "south" = larger y
      const useNorth = dir === "north" || (dir !== "south" && y1 < y2);
      resultPoint = point(
        useNorth ? (y1 < y2 ? x1 : x2) : y1 > y2 ? x1 : x2,
        useNorth ? (y1 < y2 ? y1 : y2) : y1 > y2 ? y1 : y2,
      );
    } else if (valA.type === "circle" && valB.type === "line") {
      const c = valA;
      const l = valB;
      const result = inteceptCircleLineSeg(c.cx, c.cy, l.x1, l.y1, l.x2, l.y2, c.r);
      if (!result || result.length === 0)
        throw new Error(`No intersection between ${a.id} and ${b.id}`);
      const dir = directionOrName as Direction;
      // Select based on direction
      const [x, y] = result[0];
      resultPoint = point(x, y);
    } else if (valA.type === "line" && valB.type === "circle") {
      return this.intersection(b as CircleRef, a as LineRef, directionOrName as Direction, name);
    } else if (valA.type === "line" && valB.type === "line") {
      // Line-line intersection
      const l1 = valA;
      const l2 = valB;
      // Use @sg/geometry lineIntersect
      const result = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);
      if (!result) throw new Error(`Lines ${a.id} and ${b.id} do not intersect`);
      resultPoint = point(result[0], result[1]);
    }

    this._storeGeom(id, resultPoint, [a.id, b.id]);
    return { id };
  }

  extendLine(line: LineRef, length: number, name?: string): LineRef {
    const l = this.get<Line>(line);
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = (len + length) / len;
    const x2 = l.x1 + dx * scale;
    const y2 = l.y1 + dy * scale;
    return this.line(l.x1, l.y1, x2, y2, name);
  }

  lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef {
    const f = this.get<Point>(from);
    const t = this.get<Point>(towards);
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = length / len;
    const x2 = f.x + dx * scale;
    const y2 = f.y + dy * scale;
    return this.line(f.x, f.y, x2, y2, name);
  }

  midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef {
    const pt1 = this.get<Point>(p1);
    const pt2 = this.get<Point>(p2);
    const x = (pt1.x + pt2.x) / 2;
    const y = (pt1.y + pt2.y) / 2;
    return this.point(x, y, name);
  }

  perpendicular(line: LineRef, at: PointRef, name?: string): LineRef {
    const l = this.get<Line>(line);
    const p = this.get<Point>(at);
    // Calculate perpendicular line through point
    // Vector of original line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    // Perpendicular vector (rotated 90 degrees)
    const px = -dy;
    const py = dx;
    // Normalize
    const len = Math.sqrt(px * px + py * py);
    const ux = px / len;
    const uy = py / len;
    // Create line through p in perpendicular direction
    // Use a reasonable length
    const length = Math.sqrt(dx * dx + dy * dy);
    const x2 = p.x + ux * length;
    const y2 = p.y + uy * length;
    return this.line(p.x, p.y, x2, y2, name);
  }

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

  // ===== Step Management =====

  get currentStepIndex(): number {
    return this._stepIndex;
  }

  next(): void {
    this._stepIndex = Math.min(this._stepIndex + 1, this._steps.length - 1);
  }

  prev(): void {
    this._stepIndex = Math.max(this._stepIndex - 1, 0);
  }

  goTo(index: number): void {
    this._stepIndex = Math.max(0, Math.min(index, this._steps.length - 1));
  }

  reset(): void {
    this._stepIndex = 0;
  }

  getSteps(): InternalStep[] {
    return this._steps.slice(0, this._stepIndex + 1);
  }

  // ===== Value Access =====

  get<T extends GeometryValue>(ref: GeomRef): T {
    const value = this._values.get((ref as any).id);
    if (!value) throw new Error(`Geometry not found: ${(ref as any).id}`);
    return value as T;
  }

  getValues(): Map<string, GeometryValue> {
    return new Map(this._values);
  }

  // ===== Private Helpers =====

  private _autoName(prefix: string): string {
    return `${prefix}_${this._stepIndex + 1}`;
  }

  private _storeGeom(id: string, value: GeometryValue, dependencies: string[]): void {
    this._values.set(id, value);
    this._steps.push({
      id,
      type: value.type,
      dependencies,
      compute: () => value,
    });
  }
}

// Internal step representation
interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}
```

### Layer 4: Step Adapter (Bridge to Existing System)

**Location**: `app2/src/geometry/construction-to-steps.ts`

```typescript
import type { Step, GeometryValue } from "../types/geometry";
import { Construction } from "./construction";

export function constructionToSteps(construction: Construction): Step[] {
  return construction.getSteps().map((internalStep) => ({
    id: `step_${internalStep.id}`,
    inputs: internalStep.dependencies,
    outputs: [internalStep.id],
    parameters: [],
    compute: (inputs, params) => {
      // NOTE: Construction uses EAGER evaluation - values are pre-computed
      // and stored in Construction._values Map. This means:
      // - internalStep.compute() returns the already-computed value
      // - The `inputs` parameter is NOT used (values don't depend on step inputs)
      // - This is intentional: Construction is a builder, not a lazy DAG
      // Both systems use the same app2 GeometryValue types - no conversion needed
      const value = internalStep.compute();
      return new Map([[internalStep.id, value]]);
    },
    draw: (svg, values, store) => {
      // Drawing is handled by SvgRenderer (layer 5), not here
    },
  }));
}
```

### Layer 5: Renderer (Separate from Construction)

**Location**: `app2/src/geometry/renderers/svgRenderer.ts`

```typescript
import type { Point, Line, Circle, Polygon, GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";

export class SvgRenderer {
  constructor(
    private svg: SVGSVGElement,
    private store?: GeometryStore,
  ) {}

  drawPoint(point: Point, options?: { stroke?: number; name?: string }): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", point.x.toString());
    el.setAttribute("cy", point.y.toString());
    el.setAttribute("r", (options?.stroke || 2).toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("fill", "none");
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    if (this.store) {
      this.store.add(options?.name || "point", el, "circle", []);
    }
    return el;
  }

  drawLine(line: Line, options?: { stroke?: number; name?: string }): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", line.x1.toString());
    el.setAttribute("y1", line.y1.toString());
    el.setAttribute("x2", line.x2.toString());
    el.setAttribute("y2", line.y2.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    if (this.store) {
      this.store.add(options?.name || "line", el, "line", []);
    }
    return el;
  }

  drawCircle(circle: Circle, options?: { stroke?: number; name?: string }): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", circle.cx.toString());
    el.setAttribute("cy", circle.cy.toString());
    el.setAttribute("r", circle.r.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    el.setAttribute("fill", "none");
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    if (this.store) {
      this.store.add(options?.name || "circle", el, "circle", []);
    }
    return el;
  }

  drawPolygon(
    polygon: Polygon,
    options?: { stroke?: number; fill?: string; name?: string },
  ): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const pointsStr = polygon.points.map((p) => `${p.x},${p.y}`).join(" ");
    el.setAttribute("points", pointsStr);
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    if (options?.fill) el.setAttribute("fill", options.fill);
    else el.setAttribute("fill", "none");
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    if (this.store) {
      this.store.add(options?.name || "polygon", el, "polygon", []);
    }
    return el;
  }

  drawConstruction(construction: Construction): void {
    for (const step of construction.getSteps()) {
      const value = construction.getValues().get(step.id);
      if (value) this.drawGeometry(value, { name: step.id });
    }
  }

  drawConstructionUpTo(construction: Construction, stepIndex: number): void {
    const steps = construction.getSteps().slice(0, stepIndex + 1);
    for (const step of steps) {
      const value = construction.getValues().get(step.id);
      if (value) this.drawGeometry(value, { name: step.id });
    }
  }

  clear(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }

  private drawGeometry(geom: GeometryValue, options: any): void {
    switch (geom.type) {
      case "point":
        this.drawPoint(geom, options);
        break;
      case "line":
        this.drawLine(geom, options);
        break;
      case "circle":
        this.drawCircle(geom, options);
        break;
      case "polygon":
        this.drawPolygon(geom, options);
        break;
    }
  }
}
```

### Layer 6: New Component (Uses All Layers)

**Location**: `app2/src/components/SquaresV2.tsx`

```typescript
import { useEffect, useMemo, useRef } from "react";
import { Construction } from "../geometry/construction";
import { SvgRenderer } from "../geometry/renderers/svgRenderer";
import { computeSquareConfig, LINE_EXTENSION_MULTIPLIER, C1_POSITION_RATIO } from "../geometry/operations";
import { useGeometryStore } from "../react-store";

export function SquaresV2({ stepIndex }: { stepIndex: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const store = useGeometryStore();
  const config = useMemo(() => computeSquareConfig(800, 600), []);

  // Create construction (pure geometry, single API, no rendering)
  const construction = useMemo(() => {
    const c = new Construction();

    // Step 1: Main line (base)
    const ml = c.line(config.lx1, config.ly1, config.lx2, config.ly2, "main_line");

    // Step 2: C1 at ratio along main line
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: Circle at C1 with given radius
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2 at left intersection of c1_circle with main_line
    // NOTE: "left" direction for circle-line means: the intersection point
    // that is to the left (smaller x) when looking from circle center along line
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: Circle at C2 with same radius as c1_circle
    // Access the Circle value from the CircleRef, then use .r property
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - north intersection of both circles
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: Circle at PI with same radius
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines from C2 and C1 towards PI
    const line_c2_pi = c.lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c1_pi");

    // Step 10-11: P3 and P4 as intersections of extended lines with CI
    const p3 = c.intersection(line_c2_pi, ci, "other", "p3");
    const p4 = c.intersection(line_c1_pi, ci, "other", "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: Tangent points
    const pl = c.intersection(line_c2_p4, c2_c, "other", "pl");
    const pr = c.intersection(line_c1_p3, c1_c, "other", "pr");

    // Step 16: Final square
    const square = c.polygon([c1, c2, pr, pl], "square");

    return c;
  }, [config]);

  // Navigate to requested step
  useEffect(() => {
    construction.goTo(stepIndex);
  }, [stepIndex, construction]);

  // Render (separate concern)
  useEffect(() => {
    if (!svgRef.current) return;
    const renderer = new SvgRenderer(svgRef.current, store);
    renderer.clear();
    renderer.drawConstructionUpTo(construction, stepIndex);
  }, [stepIndex, store, construction]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}
```

---

## File Structure

```
📁 sg/
├── packages/
│   └── geometry/
│       └── src/
│           ├── intersection.ts       # UNCHANGED: coordinate-based utilities
│           ├── lines.ts              # UNCHANGED: line utilities
│           ├── circles.ts            # UNCHANGED: circle utilities
│           └── index.ts              # UNCHANGED: exports utility functions
│                                   # We use: intersection, inteceptCircleLineSeg, lineIntersect
│
└── app2/
    ├── src/
    │   ├── types/
    │   │   └── geometry.ts         # ✅ CANONICAL: Point, Line, Circle, Polygon interfaces
    │   │
    │   ├── geometry/
    │   │   ├── squareSteps.ts       # UNCHANGED: existing step definitions
    │   │   ├── operations.ts        # UNCHANGED: computeSquareConfig, etc.
    │   │   ├── constructors.ts      # UNCHANGED: existing helpers (optional cleanup)
    │   │   ├── construction.ts      # ✅ NEW: Construction class + Ref types (Option A)
    │   │   ├── construction-to-steps.ts  # NEW: adapter layer
    │   │   ├── renderers/
    │   │   │   └── svgRenderer.ts   # ✅ NEW: rendering layer
    │   │   └── index.ts              # Update: export new classes
    │   │
    │   └── components/
    │       ├── Square.tsx           # UNCHANGED: existing component
    │       └── SquaresV2.tsx         # ✅ NEW: proof-of-concept component
    │
    └── PLAN geometry-framework.md    # This document
```

### Why This Structure Works

| File                                     | Depends On                | Outputs                  | Reason                                 |
| ---------------------------------------- | ------------------------- | ------------------------ | -------------------------------------- |
| `@sg/geometry`                           | nothing from app2         | Utility functions        | Pure coordinate-based math             |
| `app2/types/geometry.ts`                 | nothing                   | GeometryValue types      | Canonical type definitions             |
| `app2/geometry/construction.ts`          | @sg/geometry + app2/types | Construction + Ref types | Uses app2 types, @sg/geometry for math |
| `app2/geometry/renderers/svgRenderer.ts` | app2/types                | SVG elements             | Drawing only, uses app2 types          |
| `app2/components/SquaresV2.tsx`          | construction + renderer   | React component          | Orchestrates both                      |

**No circular dependencies** - No conversion needed - everyone uses app2 GeometryValue types.

---

## Key Design Decisions

| Decision                       | Choice                                     | Rationale                                                                             |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Replacement vs Abstraction** | Abstraction layer on top of existing steps | Preserves existing architecture, steps still exist underneath                         |
| **Construction vs Rendering**  | Completely separate                        | Pure geometry logic vs SVG drawing - single responsibility                            |
| **New component**              | SquaresV2.tsx                              | Keeps existing Square component untouched                                             |
| **Backward compatibility**     | Not needed                                 | Framework is only for future components                                               |
| **Type system**                | **app2 GeometryValue types (canonical)**   | Matches existing system, no conversion needed, @sg/geometry utilities use coordinates |
| **API design**                 | **Option A: Construction-only API**        | Single API surface, no dual API confusion, no methods on refs                         |
| **Reference semantics**        | Pure identifiers (no data)                 | Construction holds all state, refs are just typed IDs                                 |
| **Step generation**            | Automatic from Construction                | Reduces boilerplate, steps created internally                                         |
| **@sg/geometry usage**         | Coordinate-based utilities only            | Don't use classes, use functions with raw numbers                                     |

---

## How Construction Uses @sg/geometry Internally

```typescript
// Inside construction.ts - all utility calls use raw coordinates

// Circle-Circle intersection
// NOTE: @sg/geometry exports this as `intersection`, not `circleCircleIntersection`
function _intersectCircles(c1: Circle, c2: Circle, direction: Direction): Point | null {
  const result = intersection(
    c1.cx,
    c1.cy,
    c1.r, // Extract from app2 Circle
    c2.cx,
    c2.cy,
    c2.r,
  );
  if (!result) return null;
  const [x1, y1, x2, y2] = result;
  // In SVG: y increases downward, so "north" = smaller y
  if (direction === "north") {
    return point(y1 < y2 ? x1 : x2, y1 < y2 ? y1 : y2);
  } else {
    // "south" or any other direction -> larger y
    return point(y1 > y2 ? x1 : x2, y1 > y2 ? y1 : y2);
  }
}

// Circle-Line intersection
function _intersectCircleLine(circle: Circle, line: Line): Point | null {
  const result = inteceptCircleLineSeg(
    circle.cx,
    circle.cy, // From app2 Circle
    line.x1,
    line.y1, // From app2 Line
    line.x2,
    line.y2,
    circle.r,
  );
  if (!result || result.length === 0) return null;
  return point(result[0][0], result[0][1]);
}

// Line-Line intersection
function _intersectLines(l1: Line, l2: Line): Point | null {
  const result = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);
  if (!result) return null;
  return point(result[0], result[1]);
}
```

---

## Error Handling Strategy

**Recommended approach**:

- **Validation mode**: `construction.validate()` returns `boolean` - checks if all operations are valid without throwing
- **Error collection**: `construction.getErrors()` returns `ConstructionError[]` - list of all errors found
- **Throw on access**: When `construction.get<T>(ref)` is called, throw the first error with clear message
- **Error types**: Specific error classes for different failure modes

```typescript
export class ConstructionError {
  constructor(
    readonly stepIndex: number,
    readonly stepId: string,
    readonly message: string,
    readonly cause?: Error,
  ) {}

  toString(): string {
    return `Step ${this.stepIndex} (${this.stepId}): ${this.message}`;
  }
}

// In Construction class:
private _errors: ConstructionError[] = [];

validate(): boolean {
  // Try to compute all steps and collect errors
  this._errors = [];
  for (let i = 0; i < this._steps.length; i++) {
    try {
      this._steps[i].compute();
    } catch (e) {
      this._errors.push(new ConstructionError(
        i,
        this._steps[i].id,
        e.message,
        e
      ));
    }
  }
  return this._errors.length === 0;
}

getErrors(): ConstructionError[] {
  return [...this._errors];
}
```

---

## "Other" Intersection Handling

For finding "the other intersection point" (not the one we already know):

**Approach**: Track known points per geometry and exclude them when `"other"` is specified.

```typescript
// In Construction class, track which points lie on each geometry
private _pointsOnGeom = new Map<string, Set<string>>(); // geomId -> Set<pointId>

// When creating a point via intersection, track it
_private_addPointOnGeom(pointId: string, geomId: string): void {
  if (!this._pointsOnGeom.has(geomId)) {
    this._pointsOnGeom.set(geomId, new Set());
  }
  this._pointsOnGeom.get(geomId)!.add(pointId);
}

// In intersection method, handle "other"
if (directionOrName === "other") {
  // Get all intersection points
  const allPoints = this._computeAllIntersections(a, b);
  // Get known points already on both geometries
  const knownPoints = new Set<string>();
  if (this._pointsOnGeom.has(a.id)) {
    for (const pid of this._pointsOnGeom.get(a.id)!) {
      knownPoints.add(pid);
    }
  }
  if (this._pointsOnGeom.has(b.id)) {
    for (const pid of this._pointsOnGeom.get(b.id)!) {
      knownPoints.add(pid);
    }
  }
  // Find the point that's NOT in knownPoints
  for (const pt of allPoints) {
    if (!knownPoints.has(pt.id)) {
      return pt;
    }
  }
  throw new Error(`No "other" intersection found between ${a.id} and ${b.id}`);
}
```

---

# 🎯 Milestones & Checklist

## Phase 1: Core Construction DSL (Option A)

- [ ] Create `app2/src/geometry/construction.ts`
  - [ ] Define Ref types (PointRef, LineRef, CircleRef, PolygonRef, GeomRef)
  - [ ] Define `Direction` type
  - [ ] Define `ConstructionError` class
  - [ ] Implement `Construction` class
    - [ ] Internal state (\_values, \_steps, \_stepIndex, \_errors)
    - [ ] Basic geometry creators (point, line, circle)
      - [ ] point() with coordinate and PointRef overloads
      - [ ] line() with coordinate and LineRef overloads
      - [ ] circle() with coordinate and CircleRef overloads
    - [ ] Derived geometry operations
      - [ ] pointAt() - point at ratio on line
      - [ ] pointOnLineAtDistance() - point at distance from start
      - [ ] intersection() - circle-circle, circle-line, line-line with overloads
      - [ ] extendLine() - extend line by length
      - [ ] lineTowards() - line from point towards another point with length
      - [ ] midpoint() - midpoint between two points
      - [ ] perpendicular() - perpendicular line at point
      - [ ] polygon() - create polygon from points
    - [ ] Step management (goTo, next, prev, reset, getSteps)
    - [ ] Value access (get, getValues)
    - [ ] Error handling (validate, getErrors)
    - [ ] Private helpers (\_autoName, \_storeGeom, \_computeAllIntersections)

- [ ] Add unit tests for Construction class
  - [ ] Test point creation (both overloads)
  - [ ] Test line creation (coordinate and ref overloads)
  - [ ] Test circle creation (coordinate and ref overloads)
  - [ ] Test pointAt
  - [ ] Test pointOnLineAtDistance
  - [ ] Test intersection (circle-circle, circle-line, line-line)
  - [ ] Test extendLine
  - [ ] Test lineTowards
  - [ ] Test midpoint
  - [ ] Test perpendicular
  - [ ] Test polygon
  - [ ] Test step navigation
  - [ ] Test error handling

## Phase 2: Integration Layer

- [ ] Create `app2/src/geometry/construction-to-steps.ts`
  - [ ] Define InternalStep interface
  - [ ] Implement constructionToSteps() adapter
  - [ ] Ensure Step format compatibility
  - [ ] Test conversion with square construction

- [ ] Update `app2/src/geometry/index.ts`
  - [ ] Export Construction class
  - [ ] Export Ref types (PointRef, LineRef, CircleRef, PolygonRef, GeomRef)
  - [ ] Export Direction type
  - [ ] Export ConstructionError class
  - [ ] Export construction-to-steps adapter

- [ ] Verify no circular dependencies in import chain

## Phase 3: Rendering Layer

- [ ] Create `app2/src/geometry/renderers/svgRenderer.ts`
  - [ ] Implement SvgRenderer class
  - [ ] Implement drawPoint() using app2 Point
  - [ ] Implement drawLine() using app2 Line
  - [ ] Implement drawCircle() using app2 Circle
  - [ ] Implement drawPolygon() using app2 Polygon
  - [ ] Implement drawConstruction()
  - [ ] Implement drawConstructionUpTo()
  - [ ] Implement clear()
  - [ ] Add tooltip support
  - [ ] Add GeometryStore integration

- [ ] Add rendering tests (visual regression or snapshot tests)

## Phase 4: Proof of Concept - SquaresV2 Component

- [ ] Create `app2/src/components/SquaresV2.tsx`
  - [ ] Import Construction and SvgRenderer
  - [ ] Create construction with all 16 square steps
  - [ ] Integrate SvgRenderer
  - [ ] Add step navigation via goTo()
  - [ ] Add parameter controls (circleRadius, etc.)
  - [ ] Add responsive sizing
  - [ ] Handle errors gracefully

- [ ] Test SquaresV2 component
  - [ ] Verify all 16 steps render correctly
  - [ ] Verify step-by-step navigation works
  - [ ] Verify final square geometry is correct
  - [ ] Verify error handling

## Phase 5: Advanced Features

- [ ] Add undo/redo to Construction class
- [ ] Add construction serialization (to JSON)
- [ ] Add construction deserialization (from JSON)
- [ ] Add parameter slider integration
- [ ] Add construction validation (pre-flight checks)
- [ ] Create additional test constructions (triangle, hexagon, etc.)

## Phase 6: Documentation & Cleanup

- [ ] Document Construction API (all methods)
- [ ] Document Ref types
- [ ] Document SvgRenderer API
- [ ] Add JSDoc comments to all public methods
- [ ] Create examples/README
- [ ] Review and cleanup code

---

## Resolved Questions

✅ **1. Package location**:
**`app2/src/geometry/construction.ts`** (NOT `@sg/geometry`)
**Reason**: Avoids circular dependency. Construction depends on both `@sg/geometry` utilities AND `app2/src/types/geometry.ts` types.

✅ **2. Type system**:
**Use app2's `GeometryValue` types as canonical**

- Construction outputs app2 types directly
- @sg/geometry used only for coordinate-based utility functions internally
- No conversion needed - perfect match between app2 types and utility parameters

✅ **3. API design**:
**Option A: Construction-only API**

- All operations are methods on Construction
- Refs are pure typed identifiers (no data, no methods)
- Single, unambiguous API surface

✅ **4. Error handling**:
**Validate + getErrors + throw on compute** - User confirmed: "yes"

✅ **5. Geometry mutability**:
**Immutable (functional style)** - User confirmed: "YES"

✅ **6. Step naming**:
**Custom naming when provided, auto-generated when not** - User confirmed: "custom naming when provided, auto generated when not provided"

---

## Next Steps

✅ **All issues resolved** - Architecture finalized with Option A (Construction-only API).

Awaiting user confirmation on:

1. **Approval of this final architecture**
2. Any additional requirements or modifications

**Ready to begin Phase 1: Core Construction DSL implementation.**

---

## Quick Reference: The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SquaresV2 Component                        │
│  (app2/src/components/SquaresV2.tsx)                         │
│                                                             │
│   construction.line(...)    // Returns LineRef              │
│   construction.pointAt(...) // Returns PointRef             │
│   construction.circle(...)  // Returns CircleRef            │
│   construction.intersection(...) // Returns PointRef        │
│   // Single API - all on Construction                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Construction Class                           │
│  (app2/src/geometry/construction.ts)                        │
│                                                             │
│   - Pure geometry logic                                    │
│   - Uses app2 GeometryValue types                            │
│   - Uses @sg/geometry utilities INTERNALLY (coordinates)     │
│   - NO SVG, NO rendering                                   │
│   - Holds all geometry values in Map<string, GeometryValue> │
│   - Returns typed Ref objects (PointRef, LineRef, etc.)      │
│   - Single API surface for ALL operations                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SvgRenderer Class                           │
│  (app2/src/geometry/renderers/svgRenderer.ts)               │
│                                                             │
│   - Pure rendering logic                                    │
│   - Takes GeometryValue types (from app2/types/geometry.ts)  │
│   - NO geometry construction logic                         │
│   - NO knowledge of Construction or Refs                    │
│   - Knows about SVG, styles, tooltips                       │
└─────────────────────────────────────────────────────────────┘

Refs (PointRef, LineRef, CircleRef):
  - Pure identifiers: { id: string }
  - NO data storage
  - NO methods
  - Construction holds all data
```

---

# 📋 PREREQUISITES & FOUNDATIONAL WORK

## ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

These items **must be addressed** before beginning Phase 1. Failure to complete these will result in blocked implementation, circular dependencies, or architectural rework.

### 1. Type System Finalization

**Status**: ✅ Partially Complete | **Blocker**: No | **Owner**: Architecture

**Current State**:

- `app2/src/types/geometry.ts` has canonical `GeometryValue` types (Point, Line, Circle, Polygon, Rectangle)
- Factory functions exist: `point()`, `line()`, `circle()`, `polygon()`, `rectangle()`
- Type guards exist: `isPoint()`, `isLine()`, `isCircle()`, `isPolygon()`, `isRectangle()`

**Required Actions**:

- [ ] **Verify** all geometry operations in `@sg/geometry` can accept app2 types directly (coordinate extraction)
- [ ] **Add** any missing geometry types needed for advanced operations (e.g., Ray, Arc, Segment)
- [ ] **Document** the type system contract: "All geometry data flows as app2 GeometryValue types"

**Verification Checklist**:

```typescript
// Must work without conversion:
const c: Circle = { type: "circle", cx: 0, cy: 0, r: 5 };
// @sg/geometry utilities accept raw coordinates:
intersection(c.cx, c.cy, c.r, other.cx, other.cy, other.r); // ✅ OK
```

### 2. @sg/geometry Package Audit

**Status**: ⚠️ Needs Review | **Blocker**: Yes | **Owner**: Package Maintainer

**Current State**:

- Package exists at `packages/geometry/`
- **IMPORTANT**: Package exports BOTH:
  - **Classes**: `Point`, `Line`, `Circle`, `Geometry` (with nested object structures)
  - **Utility functions**: `intersection`, `inteceptCircleLineSeg`, `lineIntersect`, `bisect`, `intersect`, etc. (coordinate-based)
- Construction **MUST use only coordinate-based utility functions** - NOT the classes

**CRITICAL: Function Name Corrections**
The plan previously referenced non-existent function names:

- ❌ `circleCircleIntersection` - DOES NOT EXIST
- ✅ `intersection(x0, y0, r0, x1, y1, r1)` - CORRECT function name
- ✅ `inteceptCircleLineSeg(cx, cy, l1x, l1y, l2x, l2y, r)` - EXISTS
- ✅ `lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4)` - EXISTS
- ✅ `intersect(x1, y1, x2, y2, x3, y3, x4, y4)` - Alternative to lineIntersect

**Required Actions**:

- [ ] **Audit** all exported functions Construction will use:
  - `intersection` (circle-circle, coordinate-based)
  - `inteceptCircleLineSeg` (circle-line segment)
  - `lineIntersect` or `intersect` (line-line)
  - `bisect`? (check if used)
- [ ] **Verify** each returns expected format (arrays of numbers, or null)
- [ ] **Test** each with sample inputs to confirm behavior
- [ ] **Verify** @sg/geometry builds cleanly with current TypeScript
- [ ] **Ensure** package exports are stable (no breaking changes expected)
- [ ] **Document** which utilities are safe for Construction internal use

**Hostile Territory - DO NOT USE**:

```typescript
// These classes have incompatible structure with app2 types:
import { Circle, Line, Point } from "@sg/geometry"; // ❌ DO NOT IMPORT
// Circle = { p: Point, r: number } - nested Point object
// Line  = { p1: Point, p2: Point } - nested Point objects
// Use coordinate-based utilities instead:
import { intersection, inteceptCircleLineSeg, lineIntersect } from "@sg/geometry"; // ✅ OK
```

**Critical Dependencies**:

```
Construction.ts → @sg/geometry (intersection, inteceptCircleLineSeg, lineIntersect)
```

**Risk**: Using wrong function names or classes will cause type errors and runtime failures.

### 3. Dependency Chain Verification

**Status**: ✅ VERIFIED - No circular dependencies | **Blocker**: No | **Owner**: Architecture

**Required**: Zero circular dependencies in the import chain.

**Verified Import Flow**:

```
app2/src/components/SquaresV2.tsx
    ↓ imports
app2/src/geometry/construction.ts (NEW)
    ↓ imports from two places:
    ├── app2/src/types/geometry.ts (EXISTING)
    │   └── imports from: app2/react-store.ts, app2/themes.ts, app2/geometry/operations.ts
    │       └── app2/geometry/operations.ts imports from: @sg/geometry ✅
    │
    └── @sg/geometry (coordinate-based utility functions)
        └── imports: nothing from app2 ✅

NO CIRCULAR DEPENDENCY - Construction imports both app2 types AND @sg/geometry,
but @sg/geometry does NOT import from app2.
```

**Verification Performed**:

- [x] Confirmed `app2/types/geometry.ts` has NO imports from `@sg/geometry`
- [x] Confirmed `@sg/geometry/src/` has NO imports from app2 (grep verified)
- [x] Confirmed `app2/geometry/operations.ts` is the only file importing @sg/geometry in app2 types chain
- [x] Import chain is: Construction → [types + @sg/geometry] (no cycle)

**Status**: ✅ PASSED - Safe to proceed

### 4. Direction Type and "Other" Intersection Semantics

**Status**: ⚠️ Undefined | **Blocker**: Yes | **Owner**: Architecture

**Problem**: The plan uses ambiguous direction values that have unclear meanings.

**Current Direction Type in Plan**:

```typescript
type Direction = "north" | "south" | "left" | "right" | "up" | "down";
```

**Issues**:

- `"left"` / `"right"` for circle-line intersection: What does "left" mean? Left of the line? Left from the circle center?
- `"up"` / `"down"` for lines at arbitrary angles: Ambiguous
- `"north"` / `"south"` work for circle-circle (pick by y-coordinate in SVG)
- Construction uses `"left"` in SquaresV2: `c.intersection(c1_c, ml, "left", "c2")`
- Construction uses `"other"` in SquaresV2: `c.intersection(line_c2_pi, ci, "other", "p3")`

**"Other" Intersection Problem**:

- How do we know which point to exclude?
- Existing `constructors.ts` uses explicit `{ exclude: Point }` parameter
- Plan uses string `"other"` but mechanism is unspecified

**Required Actions**:

- [ ] **Define** precise semantics for each Direction value
- [ ] **Standardize** "other" intersection: Use options object `{ exclude: PointRef }` or string `"other"`?
- [ ] **Decide**: Should Direction be split into separate types?
  - `type CircleCircleDirection = "north" | "south"`
  - `type LineIntersectionSelector = "start" | "end" | { exclude: PointRef }`
- [ ] **Document** the behavior for each direction value with each geometry pair

**Proposed Direction Semantics**:
| Geometry Pair | Direction | Meaning |
|---------------|-----------|---------|
| Circle-Circle | `"north"` | Intersection with smaller y (SVG coords) |
| Circle-Circle | `"south"` | Intersection with larger y (SVG coords) |
| Circle-Line | `"left"` | Intersection with smaller x when looking from circle toward line start |
| Circle-Line | `"right"` | Intersection with larger x when looking from circle toward line start |
| Line-Line | N/A | Lines intersect at one point (unless parallel) |
| Any | `"other"` | The intersection point that is NOT the previously-created one |

**Proposed "Other" Mechanism**:

```typescript
// Option A: String "other" (simpler API)
c.intersection(circle, line, "other", "p3");

// Option B: Explicit exclude (more precise, matches constructors.ts)
c.intersection(circle, line, { exclude: knownPointRef }, "p3");

// Recommendation: Option B for clarity and type safety
```

**Without this clarification, intersection operations will have undefined behavior.**

### 5. Immutable vs Mutable Construction Clarification

**Status**: ⚠️ CONTRADICTION | **Blocker**: Yes | **Owner**: Architecture

**Problem**: There is a direct contradiction between user requirements and the proposed implementation.

**User Confirmed**:

> **"Immutable (functional style) - YES"**

**Current Construction Design** (in this plan):

```typescript
export class Construction {
  private _values = new Map<string, GeometryValue>();  // Mutable
  private _steps: InternalStep[] = [];                   // Mutable
  private _stepIndex = 0;                               // Mutable

  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);
    this._values.set(id, value);      // ❌ Mutates state
    this._steps.push({...});           // ❌ Mutates state
    return { id };
  }
}
```

**This is MUTABLE, not immutable.**

**Options to Resolve**:

**Option A: Make Construction Truly Immutable**

```typescript
class Construction {
  // No mutation - every method returns a NEW Construction
  point(x: number, y: number, name?: string): { construction: Construction; ref: PointRef } {
    const newConstruction = this.clone();
    // Add to newConstruction's state
    return { construction: newConstruction, ref: { id: "..." } };
  }
}
```

Pros: True immutability, easy undo/redo, functional style
Cons: More complex API, more allocations, chaining returns nested objects

**Option B: Keep Mutable Builder Pattern**

- Document as: "Construction is a mutable builder"
- Clarify with user: "Immutable" confirmation may have been about geometry values, not Construction

**Required Actions**:

- [ ] **CLARIFY with user**: Did they mean immutable geometry values, or immutable Construction?
- [ ] **Decide** on final approach before implementation
- [ ] **Update** all code examples to match decision

**Recommendation**: Given the user's confirmation of "YES" to immutability, this needs explicit clarification. The current code examples assume mutable Construction, but user explicitly confirmed immutability.

**Blocker**: Cannot implement Construction without resolving this contradiction.

### 6. Build & Test Infrastructure

**Status**: ⚠️ Needs Setup | **Blocker**: Yes | **Owner**: DevOps

**Required Actions**:

- [ ] **Verify** `pnpm build` works for both `app2` and `@sg/geometry`
- [ ] **Verify** `pnpm test` runs successfully
- [ ] **Verify** `pnpm type-check` passes for both packages
- [ ] **Set up** test infrastructure for new Construction class:
  - Unit test framework (vitest already in app2)
  - Geometry comparison utilities (approx. equality for floats)
  - Snapshot testing for SVG rendering?

**Test Files Needed**:

```
app2/src/geometry/
  ├── construction.test.ts    # Core Construction logic
  ├── renderers/
  │   └── svgRenderer.test.ts # Rendering logic
  └── construction-to-steps.test.ts # Adapter logic
```

**Blocker**: Without working build/test, cannot validate implementation.

---

## 🛠️ SHOULD COMPLETE BEFORE IMPLEMENTATION

These items would **significantly smooth** the implementation effort. While not strict blockers, addressing them first will prevent interruptions and rework.

### 7. GeometryStore Integration Clarification

**Status**: ⚠️ Ambiguity | **Impact**: Medium | **Owner**: Frontend

**Current State**:

- `app2/src/react-store.ts` defines `GeometryStore` interface
- `SvgRenderer` in the plan accepts optional `store` parameter
- Relationship between Construction's geometry and GeometryStore is unclear

**Questions to Resolve**:

- [ ] Should Construction output be automatically registered with GeometryStore?
- [ ] Should step navigation update the store?
- [ ] Should GeometryStore be the source of truth for current state, or Construction?

**Recommended Approach**:

- Construction holds **geometry data** (GeometryValue types)
- GeometryStore holds **SVG elements + metadata** (tooltip info, selection state)
- SvgRenderer bridges both: creates SVG elements from geometry, registers with store

**Risk**: Unclear ownership leads to stale data or duplicate state.

### 8. Square Construction Reference Implementation

**Status**: ✅ Available | **Impact**: High | **Owner**: Architecture

**Current State**:

- `app2/src/geometry/squareSteps.ts` - Complete step-based square construction
- `app2/src/geometry/constructors.ts` - Helper functions
- `app2/src/geometry/operations.ts` - Pure geometry operations

**Value**: These files are **excellent references** for:

- What geometry operations are needed
- How intersections work with "other" point selection
- Parameter handling (C1_POSITION_RATIO, LINE_EXTENSION_MULTIPLIER, etc.)
- Error handling patterns

**Action**:

- [ ] **Mine** squareSteps.ts for all required Construction operations
- [ ] **List** every unique operation used in square construction
- [ ] **Verify** each can be expressed in Construction API

**Operations Inventory from squareSteps.ts**:
| Step | Operation | Construction Equivalent |
|------|-----------|------------------------|
| 1 | Create line from coords | `construction.line(x1, y1, x2, y2)` |
| 2 | Point at ratio on line | `construction.pointAt(line, ratio)` |
| 3 | Circle from point + radius | `construction.circle(point, radius)` |
| 4 | Circle-line intersection (exclude known) | `construction.intersection(circle, line, { exclude: knownPoint })` |
| 5 | Circle from point | Already covered |
| 6 | Circle-circle intersection (directional) | `construction.intersection(c1, c2, "north")` |
| 7 | Circle from point | Already covered |
| 8-9 | Line towards point with length | `construction.lineTowards(from, towards, length)` |
| 10-11 | Circle-line intersection | Already covered |
| 12-13 | Line between points | `construction.line(p1, p2)` |
| 14-15 | Circle-line intersection (other) | `construction.intersection(line, circle, "other")` |
| 16 | Polygon from points | `construction.polygon([p1, p2, p3, p4])` |

### 9. Error Handling Pattern Standardization

**Status**: ⚠️ Partial | **Impact**: Medium | **Owner**: Architecture

**Current State**:

- `operations.ts` uses `getGeometry()` with runtime type validation
- Throws descriptive errors for missing/geometry type mismatches
- `constructors.ts` returns `null` for no-intersection cases

**Problem**: Inconsistent error handling between modules.

**Recommended Standard**:

```typescript
// For Construction class:
class ConstructionError extends Error {
  constructor(
    readonly stepIndex: number,
    readonly stepId: string,
    readonly message: string,
    readonly cause?: Error,
  ) {}
}

class NoIntersectionError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, g1: string, g2: string) {
    super(stepIndex, stepId, `No intersection between ${g1} and ${g2}`);
  }
}

class InvalidDirectionError extends ConstructionError {}
class MissingGeometryError extends ConstructionError {}
class TypeMismatchError extends ConstructionError {}
```

**Action**:

- [ ] Define complete error hierarchy **before** implementing Construction
- [ ] Decide: Throw on error vs. return null vs. collect errors for batch reporting
- [ ] User confirmed: "Validate + getErrors + throw on compute" - implement this pattern

### 10. Lazy Evaluation Design Finalization

**Status**: ⚠️ Conceptual | **Impact**: High | **Owner**: Architecture

**Current Plan**: Construction stores computed values immediately in `_values` Map.

**Problem**: This defeats lazy evaluation from existing step system.

**Should Decide**:

- **Option A** (Current plan): Eager computation, Construction is a builder
  - Simpler implementation
  - Values computed when methods called
  -
- **Option B** (Lazy): Construction builds DAG of thunks
  - Values computed on first access
  - Better for unused branches
  - More complex caching/invalidation

**Recommendation**: For v1, use **Option A (Eager)** for simplicity. Add lazy evaluation in v2 if needed.

**Rationale**:

- Square construction uses all steps (no unused branches)
- Step-by-step navigation relies on sequential computation anyway
- Eager computation is easier to debug and test

**Action**:

- [ ] Document decision: Eager computation for v1
- [ ] Note: Can add lazy evaluation later without breaking API

### 11. Naming Convention for Generated IDs

**Status**: ⚠️ Undefined | **Impact**: Low | **Owner**: Architecture

**Current Plan**: Auto-generated names like `point_1`, `line_2`, `circle_3`.

**Problem**: >100 steps = `line_47` is not debuggable.

**Options**:

- **Option A**: Sequential with prefix: `point_1`, `point_2`, ...
- **Option B**: Hierarchical: `c1_circle`, `c2_circle`, `line_c1_c2`
- **Option C**: Auto-generated but human-readable: Hash of operation + inputs

**Recommendation**:

- **Custom names when provided**: `construction.line(... , "main_line")`
- **Auto-generated when not**: Use operation type + step index: `line_1`, `circle_2`, etc.
- **Store** the operation that created each geometry for debugging

**Action**:

- [ ] Finalize naming strategy
- [ ] Document in API

---

## 🎯 WORK THAT WOULD MAKE IMPLEMENTATION EASIER

These items are **not required** but would **significantly reduce friction** during implementation.

### 12. TypeScript Strict Mode Configuration

**Status**: ✅ Likely configured | **Impact**: Medium | **Owner**: DevOps

**Action**:

- [ ] Verify `tsconfig.json` has strict type checking
- [ ] Ensure `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` are enabled
- [ ] This catches type errors early in Construction development

### 13. Geometry Test Utilities

**Status**: ❌ Missing | **Impact**: Medium | **Owner**: Testing

**Create**: `app2/src/geometry/test-utils.ts`

```typescript
// Approximate float equality for geometry comparisons
export function approxEqual(a: number, b: number, epsilon = 1e-10): boolean {
  return Math.abs(a - b) < epsilon;
}

// Compare two points with approximate equality
export function pointsEqual(p1: Point, p2: Point, epsilon = 1e-10): boolean {
  return approxEqual(p1.x, p2.x, epsilon) && approxEqual(p1.y, p2.y, epsilon);
}

// Compare two lines, circles, etc.
export function circlesEqual(c1: Circle, c2: Circle, epsilon = 1e-10): boolean {
  return (
    approxEqual(c1.cx, c2.cx, epsilon) &&
    approxEqual(c1.cy, c2.cy, epsilon) &&
    approxEqual(c1.r, c2.r, epsilon)
  );
}

// Assert geometry exists in Construction
export function assertGeomExists<construktion: Construction, id: string): void
```

**Value**: Reduction in boilerplate for geometry tests.

### 14. Documentation of @sg/geometry Utilities

**Status**: ❌ Minimal | **Impact**: Medium | **Owner**: Documentation

**Current State**: @sg/geometry has functions but minimal JSDoc.

**Action**:

- [ ] Add JSDoc to all @sg/geometry utility functions used by Construction
- [ ] Document edge cases and null return conditions
- [ ] Document coordinate system assumptions (SVG: y increases downward)

**Example**:

```typescript
/**
 * Finds intersection points of two circles.
 *
 * @param cx0 - Center x of first circle
 * @param cy0 - Center y of first circle
 * @param r0 - Radius of first circle
 * @param cx1 - Center x of second circle
 * @param cy1 - Center y of second circle
 * @param r1 - Radius of second circle
 * @returns [x1, y1, x2, y2] of intersection points, or null if no intersection
 * @note In SVG coords, y increases downward. "North" intersection has smaller y.
 */
```

### 15. Example-Based Development

**Status**: ❌ Not started | **Impact**: High | **Owner**: Architecture

**Strategy**: Implement Construction with SquaresV2 as the **primary test case**.

**Action**:

- [ ] Before writing Construction, manually trace through square construction
- [ ] Write pseudocode for each step using proposed Construction API
- [ ] Identify any gaps or awkward API patterns
- [ ] Refine API based on real usage patterns

**Example Trace**:

```typescript
// Manual trace of first 5 steps:
const c = new Construction();

// Step 1: main_line
const ml = c.line(config.lx1, config.ly1, config.lx2, config.ly2, "main_line");
// Internal: stores Line { id: "main_line", type: "line", ... }

// Step 2: c1 at ratio on main_line
const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");
// Internal: gets ml, computes point, stores Point { id: "c1", ... }

// Step 3: circle at c1
const c1_c = c.circle(c1, config.circleRadius, "c1_circle");
// Type check: c1 is PointRef, config.circleRadius is number ✅

// Step 4: c2 as intersection of c1_c and ml
const c2 = c.intersection(c1_c, ml, "left", "c2");
// Question: How does "left" work? Need to define direction logic.
// Question: How do we exclude the known intersection?
```

**Value**: Catches API design issues before implementation.

### 16. Milestone-Based Tracking

**Status**: ❌ Not set up | **Impact**: Medium | **Owner**: Project Management

**Action**:

- [ ] Create GitHub milestones for each phase
- [ ] Create issues for each checkbox in the implementation plan
- [ ] Set up project board for tracking

**Phases from Plan**:

1. Phase 1: Core Construction DSL
2. Phase 2: Integration Layer
3. Phase 3: Rendering Layer
4. Phase 4: Proof of Concept (SquaresV2)
5. Phase 5: Advanced Features
6. Phase 6: Documentation

---

## 📊 PREREQUISITE COMPLETION CHECKLIST

Use this checklist **before** starting Phase 1 implementation.

### Hard Blockers (Must Complete)

- [ ] Type system verified as canonical (app2 GeometryValue types)
- [ ] @sg/geometry package builds and tests pass
- [ ] No circular dependencies in import chain
- [ ] Build/test infrastructure working for both packages
- [ ] Error handling pattern decided and documented

### Soft Blockers (Should Complete)

- [ ] GeometryStore integration strategy documented
- [ ] Square construction operations inventory complete
- [ ] Complete error hierarchy defined
- [ ] Lazy evaluation decision documented (eager for v1)
- [ ] Naming convention for IDs finalized

### Nice-to-Have (Makes Life Easier)

- [ ] TypeScript strict mode verified
- [ ] Geometry test utilities created
- [ ] @sg/geometry utilities documented with JSDoc
- [ ] Example trace of square construction with proposed API
- [ ] Milestones and issues created in GitHub

---

## 🚨 RISK ASSESSMENT

| Risk                               | Probability | Impact | Mitigation                                   |
| ---------------------------------- | ----------- | ------ | -------------------------------------------- |
| Circular dependency introduced     | Medium      | High   | Verify import chain before starting          |
| @sg/geometry has bugs              | Low         | High   | Audit and test package first                 |
| API design needs major revision    | Medium      | High   | Trace through square example first           |
| Lazy evaluation misunderstanding   | Medium      | Medium | Document eager vs lazy decision              |
| Type system incompatibility        | Low         | High   | Already resolved: use app2 types             |
| Performance issues with >100 steps | Low         | Medium | Eager computation is simpler, optimize later |
| Error handling inconsistencies     | Medium      | Medium | Define error hierarchy first                 |

---

## 🎯 RECOMMENDED STARTING SEQUENCE

Once all prerequisites are met, implement in this order:

### Week 1: Foundation

1. **Day 1**: Create `construction.ts` with basic types (Ref types, ConstructionError)
2. **Day 1-2**: Implement Construction class with core creators (point, line, circle)
3. **Day 2-3**: Add base geometry operations (pointAt, midpoint, extendLine, lineTowards)
4. **Day 3**: Write unit tests for all implemented operations
5. **Day 4**: Implement intersection operations (circle-circle, circle-line, line-line)

### Week 2: Integration

6. **Day 5**: Create `svgRenderer.ts` with basic drawing
7. **Day 6**: Create `construction-to-steps.ts` adapter
8. **Day 7**: Create `SquaresV2.tsx` with first 5 steps
9. **Day 8**: Complete all 16 steps in SquaresV2
10. **Day 9**: Test and debug

### Week 3: Polish

11. **Day 10**: Add error handling (validate, getErrors)
12. **Day 11**: Add step navigation (next, prev, goTo, reset)
13. **Day 12**: Add GeometryStore integration
14. **Day 13**: Add "other" intersection handling
15. **Day 14**: Final testing and documentation

---

## 📝 DECISION LOG

Track key architectural decisions here for future reference.

| Date       | Decision                                  | Rationale                                       | Owner |
| ---------- | ----------------------------------------- | ----------------------------------------------- | ----- |
| 2024-XX-XX | Use app2 GeometryValue types as canonical | Avoids conversion, matches existing system      | @user |
| 2024-XX-XX | Construction-only API (Option A)          | Single API surface, no dual API confusion       | @user |
| 2024-XX-XX | Refs are pure identifiers                 | Separation of concerns, Construction holds data | @user |
| 2024-XX-XX | Eager computation for v1                  | Simplicity, step-by-step navigation             | @user |
| 2024-XX-XX | Validate + getErrors + throw pattern      | User preference                                 | @user |
| 2024-XX-XX | Construction in app2, not @sg/geometry    | Avoids circular dependency                      | @user |

---

## 📚 REFERENCES

### Existing Code to Study

- `app2/src/types/geometry.ts` - Canonical geometry types
- `app2/src/geometry/operations.ts` - Pure geometry operations
- `app2/src/geometry/constructors.ts` - High-level constructors
- `app2/src/geometry/squareSteps.ts` - Complete square construction (reference)
- `packages/geometry/src/intersection.ts` - Circle intersection utilities
- `packages/geometry/src/lines.ts` - Line intersection utilities

### Related Documents

- `app2/CRITIQUE.md` - Original critique that informed this plan
- Project `AGENTS.md` - Coding guidelines and conventions
