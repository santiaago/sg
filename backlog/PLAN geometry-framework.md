# Geometry Framework Plan

## Overview

This document describes the architecture for a **higher-level declarative geometry construction framework** that provides a fluid, chainable API for geometric constructions while preserving the existing step-based architecture.

The framework is a **facade/abstraction layer** on top of the existing step system. Steps still exist underneath and are created automatically from high-level code.

---

## Executive Summary

### Goal

Create a declarative geometry construction DSL that allows users to write algorithmic geometry in a fluid, readable syntax while maintaining the existing step-based architecture.

### Key Design Decisions

| Decision                   | Choice                                     | Rationale                                                    |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Abstraction vs Replacement | Abstraction layer on top of existing steps | Preserves existing architecture                              |
| Construction vs Rendering  | Completely separate concerns               | Pure geometry logic vs SVG drawing                           |
| New Component              | `SquaresV2.tsx`                            | Keeps existing `Square.tsx` untouched                        |
| Backward Compatibility     | Not required                               | Framework is only for future components                      |
| API Design                 | Option A: Construction-only API            | Single API surface, no dual API, no methods on refs          |
| Type System                | app2's `GeometryValue` types (canonical)   | No conversion needed, @sg/geometry utilities use coordinates |
| Reference Semantics        | Pure identifiers (no data)                 | Construction holds all state, refs are typed IDs             |
| Step Generation            | Automatic from Construction                | Reduces boilerplate                                          |
| @sg/geometry Usage         | Coordinate-based utilities only            | Don't use classes, use functions with raw numbers            |

---

## Architecture Layers

The framework consists of 6 layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    SquaresV2 Component                          │
│  (app2/src/components/SquaresV2.tsx)                         │
│  - Orchestrates Construction and SvgRenderer                 │
│  - Handles step navigation and user interaction               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Construction Class (Layer 3)                    │
│  (app2/src/geometry/construction.ts)                        │
│  - Pure geometry logic (NO SVG, NO rendering)                │
│  - Single API surface for ALL operations                      │
│  - Uses app2 GeometryValue types as canonical                 │
│  - Uses @sg/geometry utilities INTERNALLY (coordinates only) │
│  - Holds all geometry values in Map<string, GeometryValue>   │
│  - Returns typed Ref objects (PointRef, LineRef, CircleRef)  │
│  - Auto-generates steps internally                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SvgRenderer Class (Layer 5)                        │
│  (app2/src/geometry/renderers/svgRenderer.ts)               │
│  - Pure rendering logic                                       │
│  - Takes GeometryValue types from Construction                 │
│  - NO geometry construction logic                            │
│  - NO knowledge of Construction or Refs                       │
│  - Knows about SVG, styles, tooltips, GeometryStore          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              construction-to-steps Adapter (Layer 4)            │
│  (app2/src/geometry/construction-to-steps.ts)                │
│  - Bridges Construction to existing Step system               │
│  - Converts Construction output to Step[] format             │
│  - Enables compatibility with existing infrastructure         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Existing Infrastructure                         │
│  app2/src/types/geometry.ts      - GeometryValue types        │
│  app2/src/geometry/operations.ts - computeSquareConfig, etc.   │
│  app2/src/geometry/constructors.ts - Helper functions         │
│  app2/src/geometry/squareSteps.ts - Step definitions           │
│  packages/geometry/src/           - Utility functions          │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### Layer 1: Type System (Canonical)

**File**: `app2/src/types/geometry.ts` - Already exists and is perfect for our needs.

```typescript
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
  cx: number;
  cy: number;
  r: number;
}

export interface Polygon {
  type: "polygon";
  points: { x: number; y: number }[];
}

export type GeometryValue = Point | Line | Circle | Polygon;
```

**Factory functions** already exist: `point()`, `line()`, `circle()`, `polygon()`

**Type guards** already exist: `isPoint()`, `isLine()`, `isCircle()`, `isPolygon()`

---

### Layer 2: Typed References

**File**: `app2/src/geometry/construction.ts` (NEW)

```typescript
// Typed reference objects - each is JUST an ID with type info
// NO data storage - all data lives in Construction
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
export type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;

// Direction type for intersection selection
export type Direction = "north" | "south" | "left" | "right";

// Error handling
export class ConstructionError extends Error {
  constructor(
    readonly stepIndex: number,
    readonly stepId: string,
    readonly message: string,
    readonly cause?: Error,
  ) {}
}
```

---

### Layer 3: Construction Class (Core DSL)

**File**: `app2/src/geometry/construction.ts` (NEW)

The Construction class is the **single API surface** for all geometry operations. All operations are methods on Construction with typed parameters.

#### Public API

**Base Geometry Creators**:

- `point(x: number, y: number, name?: string): PointRef`
- `point(p: PointRef): PointRef` (copy)
- `line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef`
- `line(p1: PointRef, p2: PointRef, name?: string): LineRef`
- `circle(cx: number, cy: number, r: number, name?: string): CircleRef`
- `circle(center: PointRef, radius: number, name?: string): CircleRef`
- `polygon(points: PointRef[], name?: string): PolygonRef`

**Derived Geometry Operations**:

- `pointAt(line: LineRef, ratio: number, name?: string): PointRef`
- `pointOnLineAtDistance(line: LineRef, distance: number, from: PointRef, name?: string): PointRef`
- `midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef`
- `extendLine(line: LineRef, length: number, name?: string): LineRef`
- `lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef`
- `perpendicular(line: LineRef, at: PointRef, name?: string): LineRef`

**Intersection Operations**:

- `intersection(c1: CircleRef, c2: CircleRef, direction: Direction, name?: string): PointRef`
- `intersection(circle: CircleRef, line: LineRef, directionOrOptions: Direction | {exclude: PointRef}, name?: string): PointRef`
- `intersection(line: LineRef, circle: CircleRef, directionOrOptions: Direction | {exclude: PointRef}, name?: string): PointRef`
- `intersection(l1: LineRef, l2: LineRef, name?: string): PointRef`

**Step Management**:

- `goTo(index: number): void`
- `next(): void`
- `prev(): void`
- `reset(): void`
- `getSteps(): InternalStep[]`
- `get currentStepIndex(): number`

**Value Access**:

- `get<T extends GeometryValue>(ref: GeomRef): T`
- `getValues(): Map<string, GeometryValue>`

**Error Handling**:

- `validate(): boolean` - Checks all operations without throwing
- `getErrors(): ConstructionError[]` - Returns all collected errors

#### Internal Implementation

```typescript
export class Construction {
  private _values = new Map<string, GeometryValue>();
  private _steps: InternalStep[] = [];
  private _stepIndex = 0;
  private _errors: ConstructionError[] = [];
  private _pointsOnGeom = new Map<string, Set<string>>(); // For "other" intersection

  // ... all public methods ...

  private _autoName(prefix: string): string {
    return `${prefix}_${this._stepIndex + 1}`;
  }

  private _storeGeom(id: string, value: GeometryValue, dependencies: string[]): void {
    this._values.set(id, value);
    this._steps.push({
      id,
      type: value.type,
      dependencies,
      compute: () => value, // Eager computation
    });
  }

  private _trackPointOnGeom(pointId: string, geomId: string): void {
    // Track which points lie on which geometries for "other" intersection
  }
}

interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}
```

#### Using @sg/geometry Internally

The Construction class uses coordinate-based utility functions from `@sg/geometry`:

```typescript
// Circle-Circle intersection
const result = intersection(c1.cx, c1.cy, c1.r, c2.cx, c2.cy, c2.r);
// Returns [x1, y1, x2, y2] or null

// Circle-Line intersection
const result = inteceptCircleLineSeg(
  circle.cx,
  circle.cy,
  line.x1,
  line.y1,
  line.x2,
  line.y2,
  circle.r,
);
// Returns [[x1, y1], [x2, y2]] or null

// Line-Line intersection
const result = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);
// Returns [x, y] or null
```

**IMPORTANT**: Do NOT use the class-based API from `@sg/geometry` (e.g., `new Circle()`, `new Line()`). Use only the coordinate-based utility functions.

---

### Layer 4: Step Adapter

**File**: `app2/src/geometry/construction-to-steps.ts` (NEW)

Bridges the new Construction API to the existing Step system for compatibility.

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
      // Eager evaluation - values are pre-computed in Construction
      const value = internalStep.compute();
      return new Map([[internalStep.id, value]]);
    },
    draw: (svg, values, store, theme) => {
      // Drawing is handled by SvgRenderer, not here
    },
  }));
}
```

---

### Layer 5: SvgRenderer

**File**: `app2/src/geometry/renderers/svgRenderer.ts` (NEW)

Separate rendering layer that consumes Construction output.

```typescript
import type { Point, Line, Circle, Polygon, GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";

export class SvgRenderer {
  constructor(
    private svg: SVGSVGElement,
    private store?: GeometryStore,
  ) {}

  drawPoint(point: Point, options?: { stroke?: number; name?: string }): SVGElement;
  drawLine(line: Line, options?: { stroke?: number; name?: string }): SVGElement;
  drawCircle(circle: Circle, options?: { stroke?: number; name?: string }): SVGElement;
  drawPolygon(
    polygon: Polygon,
    options?: { stroke?: number; fill?: string; name?: string },
  ): SVGElement;

  drawConstruction(construction: Construction): void;
  drawConstructionUpTo(construction: Construction, stepIndex: number): void;
  clear(): void;
}
```

---

### Layer 6: SquaresV2 Component

**File**: `app2/src/components/SquaresV2.tsx` (NEW)

Proof-of-concept component using the new framework.

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

  const construction = useMemo(() => {
    const c = new Construction();

    // Step 1: Main line
    const ml = c.line(config.lx1, config.ly1, config.lx2, config.ly2, "main_line");

    // Step 2: C1 at ratio
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: Circle at C1
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2 at left intersection
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: Circle at C2
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - north intersection
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: Circle at PI
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines
    const line_c2_pi = c.lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c1_pi");

    // Step 10-11: P3 and P4
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: Tangent points
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square
    const square = c.polygon([c1, c2, pr, pl], "square");

    return c;
  }, [config]);

  useEffect(() => {
    construction.goTo(stepIndex);
  }, [stepIndex, construction]);

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
sg/
├── packages/
│   └── geometry/
│       └── src/
│           ├── intersection.ts    # coordinate-based utilities (UNCHANGED)
│           ├── lines.ts           # line utilities (UNCHANGED)
│           ├── circles.ts         # circle utilities (UNCHANGED)
│           └── index.ts           # exports (UNCHANGED)
│
└── app2/
    ├── src/
    │   ├── types/
    │   │   └── geometry.ts      # ✅ CANONICAL: GeometryValue types (EXISTING)
    │   │
    │   ├── geometry/
    │   │   ├── squareSteps.ts    # existing step definitions (UNCHANGED)
    │   │   ├── operations.ts     # computeSquareConfig, etc. (UNCHANGED)
    │   │   ├── constructors.ts   # helper functions (UNCHANGED)
    │   │   ├── construction.ts   # ✅ NEW: Construction class + Ref types
    │   │   ├── construction-to-steps.ts # NEW: adapter layer
    │   │   ├── renderers/
    │   │   │   └── svgRenderer.ts # ✅ NEW: rendering layer
    │   │   └── index.ts           # Update: export new classes
    │   │
    │   └── components/
    │       ├── Square.tsx        # existing component (UNCHANGED)
    │       └── SquaresV2.tsx      # ✅ NEW: proof-of-concept component
    │
    └── PLAN geometry-framework.md # This document
```

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         NO CIRCULAR DEPENDENCIES                   │
└─────────────────────────────────────────────────────────────────┘

app2/src/components/SquaresV2.tsx
        ↓ imports
app2/src/geometry/construction.ts (NEW)
        ├──→ app2/src/types/geometry.ts (EXISTING)
        │       └──→ app2/src/react-store.ts
        │       └──→ app2/src/themes.ts
        │       └──→ app2/src/geometry/operations.ts
        │               └──→ @sg/geometry (coordinate-based utilities)
        │
        └──→ @sg/geometry (coordinate-based utility functions)
                └──→ NOTHING from app2 ✅

app2/src/geometry/renderers/svgRenderer.ts (NEW)
        ↓ imports
app2/src/types/geometry.ts (EXISTING)

app2/src/geometry/construction-to-steps.ts (NEW)
        ↓ imports
app2/src/geometry/construction.ts (NEW)
        └──→ app2/src/types/geometry.ts (EXISTING)

All imports flow in one direction. No cycles possible.
```

---

## Implementation Phases

The implementation is divided into 6 phases. Each phase has its own detailed document:

### Phase 1: Core Construction DSL

**Document**: `backlog/geometry-framework-PHASE1.md`

Create the foundation:

- Define Ref types (PointRef, LineRef, CircleRef, PolygonRef, GeomRef)
- Define Direction type and ConstructionError class
- Implement Construction class with internal state
- Implement base geometry creators (point, line, circle, polygon)
- Implement derived geometry operations (pointAt, pointOnLineAtDistance, midpoint, extendLine, lineTowards, perpendicular)
- Implement intersection operations with direction and "other" support
- Implement step management (goTo, next, prev, reset, getSteps)
- Implement value access (get, getValues)
- Implement error handling (validate, getErrors)
- Add comprehensive unit tests

### Phase 2: Integration Layer

**Document**: `backlog/geometry-framework-PHASE2.md`

Bridge to existing infrastructure:

- Create construction-to-steps adapter
- Update geometry/index.ts exports
- Verify no circular dependencies
- Test conversion with square construction

### Phase 3: Rendering Layer

**Document**: `backlog/geometry-framework-PHASE3.md`

Create the rendering system:

- Implement SvgRenderer class
- Implement drawPoint, drawLine, drawCircle, drawPolygon
- Implement drawConstruction and drawConstructionUpTo
- Add GeometryStore integration
- Add tooltip support
- Add rendering tests

### Phase 4: Proof of Concept - SquaresV2 Component

**Document**: `backlog/geometry-framework-PHASE4.md`

Build the first component using the framework:

- Create SquaresV2.tsx with all 16 square steps
- Integrate Construction and SvgRenderer
- Add step navigation
- Add parameter controls
- Add responsive sizing
- Add error handling
- Test all steps render correctly

### Phase 5: Advanced Features

**Document**: `backlog/geometry-framework-PHASE5.md`

Add advanced capabilities:

- Undo/redo support
- Construction serialization/deserialization (JSON)
- Parameter slider integration
- Construction validation (pre-flight checks)
- Create additional test constructions (triangle, hexagon)

### Phase 6: Documentation & Cleanup

**Document**: `backlog/geometry-framework-PHASE6.md`

Finalize the implementation:

- Add JSDoc comments to all public methods
- Document Construction API
- Document Ref types
- Document SvgRenderer API
- Create examples/README
- Review and cleanup code
- Run full test suite
- Verify TypeScript compilation

---

## Quick Reference Card

### Construction API (Single Surface for All Operations)

```typescript
const c = new Construction();

// Base creators
const p1 = c.point(100, 200, "p1");
const l1 = c.line(p1, p2, "line1");
const c1 = c.circle(p1, 50, "circle1");
const poly = c.polygon([p1, p2, p3, p4], "square");

// Derived geometry
const mid = c.midpoint(p1, p2, "midpoint");
const onLine = c.pointAt(l1, 0.5, "center");
const extended = c.extendLine(l1, 100, "extended");
const towards = c.lineTowards(p1, p2, 200, "ray");
const perp = c.perpendicular(l1, p1, "perpendicular");

// Intersections
const pi = c.intersection(c1, c2, "north", "pi");
const p3 = c.intersection(l1, c1, { exclude: p1 }, "p3");
const x = c.intersection(l1, l2, "intersection");

// Access values
const circle = c.get<Circle>(c1);
const allValues = c.getValues();

// Navigation
c.goTo(5);
c.next();
c.prev();
c.reset();

// Error handling
const isValid = c.validate();
const errors = c.getErrors();
```

### Architecture Principles

1. **Separation of Concerns**: Construction does geometry, SvgRenderer does rendering
2. **Single API Surface**: All operations are methods on Construction
3. **Pure Identifiers**: Refs are just { id: string }, no data or methods
4. **Canonical Types**: Everyone uses app2's GeometryValue types
5. **No Conversion**: Extract coordinates from app2 types, pass to @sg/geometry functions
6. **Eager Computation**: Values computed when methods called (v1)
7. **No Circular Dependencies**: Construction imports both app2 types AND @sg/geometry safely

---

## See Also

- `backlog/geometry-framework-PHASE1.md` - Phase 1: Core Construction DSL
- `backlog/geometry-framework-PHASE2.md` - Phase 2: Integration Layer
- `backlog/geometry-framework-PHASE3.md` - Phase 3: Rendering Layer
- `backlog/geometry-framework-PHASE4.md` - Phase 4: Proof of Concept
- `backlog/geometry-framework-PHASE5.md` - Phase 5: Advanced Features
- `backlog/geometry-framework-PHASE6.md` - Phase 6: Documentation & Cleanup

- `app2/src/types/geometry.ts` - Canonical geometry types
- `app2/src/geometry/operations.ts` - Pure geometry operations
- `app2/src/geometry/constructors.ts` - High-level constructors
- `app2/src/geometry/squareSteps.ts` - Complete square construction (reference)
- `packages/geometry/src/` - Shared geometry utilities
