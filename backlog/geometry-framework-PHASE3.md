# Phase 3: Rendering Layer

## Overview

This phase creates the rendering layer that consumes Construction output and renders it to SVG. This provides a clean separation between geometry logic (Construction) and rendering logic (SvgRenderer).

**Status**: NOT STARTED  
**Priority**: HIGH  
**Estimated Duration**: 2-3 days  
**Prerequisites**: Phase 1 (Core Construction DSL) must be complete  

---

## Objectives

By the end of this phase, we will have:

1. ✅ SvgRenderer class with drawing methods for all geometry types
2. ✅ GeometryStore integration for tooltip and state management
3. ✅ Support for step-by-step rendering
4. ✅ Configurable styling (stroke width, colors, etc.)
5. ✅ Comprehensive rendering tests

---

## Architecture Decisions

### 1. Separate Renderer Class

**Decision**: Create a dedicated `SvgRenderer` class that is completely independent of Construction.

**Rationale**:
- Clean separation of concerns: Construction does geometry, SvgRenderer does rendering
- SvgRenderer doesn't need to know about Construction internals
- Can be used with other geometry sources (not just Construction)
- Easier to test independently
- Can be extended or replaced without changing Construction

### 2. SVG Namespace Usage

**Decision**: Use `document.createElementNS("http://www.w3.org/2000/svg", ...)` for all SVG elements.

**Rationale**:
- Required for creating SVG elements in the DOM
- Different namespace than HTML elements
- Ensures proper SVG element creation

### 3. GeometryStore Integration

**Decision**: Accept GeometryStore as optional parameter and use it for tooltip management.

**Rationale**:
- GeometryStore already exists in the codebase for managing SVG elements and tooltips
- Optional parameter allows SvgRenderer to be used without GeometryStore (for testing, etc.)
- Follows existing patterns in the codebase

### 4. Drawing Options Pattern

**Decision**: Use options objects for configurable styling.

**Rationale**:
- Flexible: can add new options without breaking API
- Follows common TypeScript/React patterns
- Allows per-element customization

---

## Files to Create

### 1. `app2/src/geometry/renderers/svgRenderer.ts` (NEW)

This is the main file for Phase 3.

```typescript
/**
 * svgRenderer.ts
 * 
 * Rendering layer for geometry constructions.
 * Consumes GeometryValue types and renders them to SVG.
 * 
 * Key principles:
 * - Pure rendering logic (NO geometry construction)
 * - Takes GeometryValue types from Construction or any source
 * - NO knowledge of Construction or Refs
 * - Knows about SVG, styles, tooltips, GeometryStore
 */

import type { Point, Line, Circle, Polygon, GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";

/**
 * Options for drawing a point.
 */
export interface DrawPointOptions {
  /** Stroke width (radius) for the point */
  stroke?: number;
  /** Optional name for the element (used for data-name attribute) */
  name?: string;
}

/**
 * Options for drawing a line.
 */
export interface DrawLineOptions {
  /** Stroke width for the line */
  stroke?: number;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing a circle.
 */
export interface DrawCircleOptions {
  /** Stroke width for the circle outline */
  stroke?: number;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing a polygon.
 */
export interface DrawPolygonOptions {
  /** Stroke width for the polygon outline */
  stroke?: number;
  /** Fill color for the polygon */
  fill?: string;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing geometry (union of all specific options).
 */
export type DrawGeometryOptions = 
  | DrawPointOptions
  | DrawLineOptions
  | DrawCircleOptions
  | DrawPolygonOptions;

/**
 * SvgRenderer class for rendering geometry to SVG.
 * 
 * Features:
 * - Draws Point, Line, Circle, Polygon geometries
 * - Optional GeometryStore integration for tooltip management
 * - Step-by-step rendering support
 * - Configurable styling
 */
export class SvgRenderer {
  private _svg: SVGSVGElement;
  private _store?: GeometryStore;

  /**
   * Create a new SvgRenderer.
   * @param svg - The SVG element to render into
   * @param store - Optional GeometryStore for managing elements and tooltips
   */
  constructor(svg: SVGSVGElement, store?: GeometryStore) {
    this._svg = svg;
    this._store = store;
  }

  // ===== Individual Geometry Drawing Methods =====

  /**
   * Draw a point as a small circle.
   * @param point - The point to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawPoint(point: Point, options?: DrawPointOptions): SVGElement {
    const radius = options?.stroke ?? 2;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    
    el.setAttribute("cx", point.x.toString());
    el.setAttribute("cy", point.y.toString());
    el.setAttribute("r", radius.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("fill", "none");
    
    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }
    
    this._svg.appendChild(el);
    
    if (this._store && options?.name) {
      this._store.add(options.name, el, "circle", []);
    }
    
    return el;
  }

  /**
   * Draw a line segment.
   * @param line - The line to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawLine(line: Line, options?: DrawLineOptions): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    el.setAttribute("x1", line.x1.toString());
    el.setAttribute("y1", line.y1.toString());
    el.setAttribute("x2", line.x2.toString());
    el.setAttribute("y2", line.y2.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());
    
    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }
    
    this._svg.appendChild(el);
    
    if (this._store && options?.name) {
      this._store.add(options.name, el, "line", []);
    }
    
    return el;
  }

  /**
   * Draw a circle outline.
   * @param circle - The circle to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawCircle(circle: Circle, options?: DrawCircleOptions): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    
    el.setAttribute("cx", circle.cx.toString());
    el.setAttribute("cy", circle.cy.toString());
    el.setAttribute("r", circle.r.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());
    el.setAttribute("fill", "none");
    
    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }
    
    this._svg.appendChild(el);
    
    if (this._store && options?.name) {
      this._store.add(options.name, el, "circle", []);
    }
    
    return el;
  }

  /**
   * Draw a polygon.
   * @param polygon - The polygon to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawPolygon(
    polygon: Polygon,
    options?: DrawPolygonOptions,
  ): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const fill = options?.fill ?? "none";
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    
    const pointsStr = polygon.points
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
    el.setAttribute("points", pointsStr);
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());
    el.setAttribute("fill", fill);
    
    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }
    
    this._svg.appendChild(el);
    
    if (this._store && options?.name) {
      this._store.add(options.name, el, "polygon", []);
    }
    
    return el;
  }

  // ===== Construction Drawing Methods =====

  /**
   * Draw all geometries from a Construction.
   * @param construction - The Construction to render
   */
  drawConstruction(construction: { getValues: () => Map<string, GeometryValue> }): void {
    const values = construction.getValues();
    for (const [id, geom] of values) {
      this.drawGeometry(geom, { name: id });
    }
  }

  /**
   * Draw geometries from a Construction up to a specific step index.
   * @param construction - The Construction to render
   * @param stepIndex - The step index to render up to (0-based)
   */
  drawConstructionUpTo(
    construction: { getSteps: () => any[]; getValues: () => Map<string, GeometryValue> },
    stepIndex: number,
  ): void {
    const values = construction.getValues();
    const steps = construction.getSteps().slice(0, stepIndex + 1);
    
    for (const step of steps) {
      const geom = values.get(step.id);
      if (geom) {
        this.drawGeometry(geom, { name: step.id });
      }
    }
  }

  /**
   * Clear all elements from the SVG.
   */
  clear(): void {
    while (this._svg.firstChild) {
      this._svg.removeChild(this._svg.firstChild);
    }
  }

  // ===== Private Helpers =====

  /**
   * Draw a geometry value based on its type.
   */
  private drawGeometry(geom: GeometryValue, options: DrawGeometryOptions): void {
    switch (geom.type) {
      case "point":
        this.drawPoint(geom, options as DrawPointOptions);
        break;
      case "line":
        this.drawLine(geom, options as DrawLineOptions);
        break;
      case "circle":
        this.drawCircle(geom, options as DrawCircleOptions);
        break;
      case "polygon":
        this.drawPolygon(geom, options as DrawPolygonOptions);
        break;
      default:
        console.warn(`SvgRenderer: unknown geometry type: ${(geom as any).type}`);
    }
  }
}
```

---

## Implementation Checklist

### Step 1: Create SvgRenderer Class

- [ ] Create `app2/src/geometry/renderers/svgRenderer.ts`
- [ ] Add header comment with file purpose
- [ ] Import required types
- [ ] Define options interfaces
- [ ] Implement SvgRenderer class
- [ ] Implement drawPoint()
- [ ] Implement drawLine()
- [ ] Implement drawCircle()
- [ ] Implement drawPolygon()
- [ ] Implement drawConstruction()
- [ ] Implement drawConstructionUpTo()
- [ ] Implement clear()
- [ ] Implement private drawGeometry()

### Step 2: Type Exports

- [ ] Export all public types and classes

```typescript
// At the end of svgRenderer.ts
export { SvgRenderer };
export type { DrawPointOptions, DrawLineOptions, DrawCircleOptions, DrawPolygonOptions, DrawGeometryOptions };
```

### Step 3: Update Renderers Index

- [ ] Create `app2/src/geometry/renderers/index.ts`

```typescript
// app2/src/geometry/renderers/index.ts
export * from "./svgRenderer";
```

### Step 4: Update Geometry Index

- [ ] Update `app2/src/geometry/index.ts` to export renderers

```typescript
// app2/src/geometry/index.ts

// Existing exports
export * from "./operations";
export * from "./squareSteps";
export * from "./constructors";

// New exports for Construction DSL
export * from "./construction";
export * from "./construction-to-steps";
export * from "./renderers";
```

### Step 5: Create Rendering Tests

- [ ] Create `app2/src/geometry/renderers/svgRenderer.test.ts`
- [ ] Test drawPoint()
- [ ] Test drawLine()
- [ ] Test drawCircle()
- [ ] Test drawPolygon()
- [ ] Test drawConstruction()
- [ ] Test drawConstructionUpTo()
- [ ] Test clear()
- [ ] Test GeometryStore integration

```typescript
// app2/src/geometry/renderers/svgRenderer.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { SvgRenderer } from "./svgRenderer";
import { point, line, circle, polygon } from "../../types/geometry";
import { GeometryStore } from "../../react-store";

// Helper to create SVG element for testing
function createSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "600");
  return svg;
}

// Helper to create mock GeometryStore
function createMockStore(): any {
  return {
    add: vi.fn(),
    clear: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  };
}

describe("SvgRenderer", () => {
  let svg: SVGSVGElement;
  let renderer: SvgRenderer;

  beforeEach(() => {
    svg = createSvg();
    renderer = new SvgRenderer(svg);
  });

  describe("drawPoint", () => {
    it("should draw a point", () => {
      const p = point(100, 200);
      const el = renderer.drawPoint(p, { name: "test_point" });
      
      expect(el.tagName).toBe("circle");
      expect(el.getAttribute("cx")).toBe("100");
      expect(el.getAttribute("cy")).toBe("200");
      expect(el.getAttribute("r")).toBe("2"); // default stroke
      expect(el.getAttribute("data-name")).toBe("test_point");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom stroke", () => {
      const p = point(100, 200);
      const el = renderer.drawPoint(p, { stroke: 5 });
      expect(el.getAttribute("r")).toBe("5");
    });
  });

  describe("drawLine", () => {
    it("should draw a line", () => {
      const l = line(100, 200, 300, 400);
      const el = renderer.drawLine(l, { name: "test_line" });
      
      expect(el.tagName).toBe("line");
      expect(el.getAttribute("x1")).toBe("100");
      expect(el.getAttribute("y1")).toBe("200");
      expect(el.getAttribute("x2")).toBe("300");
      expect(el.getAttribute("y2")).toBe("400");
      expect(el.getAttribute("data-name")).toBe("test_line");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom stroke width", () => {
      const l = line(0, 0, 10, 10);
      const el = renderer.drawLine(l, { stroke: 2 });
      expect(el.getAttribute("stroke-width")).toBe("2");
    });
  });

  describe("drawCircle", () => {
    it("should draw a circle", () => {
      const c = circle(100, 200, 50);
      const el = renderer.drawCircle(c, { name: "test_circle" });
      
      expect(el.tagName).toBe("circle");
      expect(el.getAttribute("cx")).toBe("100");
      expect(el.getAttribute("cy")).toBe("200");
      expect(el.getAttribute("r")).toBe("50");
      expect(el.getAttribute("data-name")).toBe("test_circle");
      expect(svg.contains(el)).toBe(true);
    });
  });

  describe("drawPolygon", () => {
    it("should draw a polygon", () => {
      const p = polygon([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const el = renderer.drawPolygon(p, { name: "test_polygon" });
      
      expect(el.tagName).toBe("polygon");
      expect(el.getAttribute("points")).toBe("0,0 100,0 100,100 0,100");
      expect(el.getAttribute("data-name")).toBe("test_polygon");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom fill", () => {
      const p = polygon([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
      const el = renderer.drawPolygon(p, { fill: "red" });
      expect(el.getAttribute("fill")).toBe("red");
    });
  });

  describe("clear", () => {
    it("should remove all children", () => {
      renderer.drawPoint(point(0, 0), { name: "p1" });
      renderer.drawPoint(point(10, 10), { name: "p2" });
      expect(svg.children).toHaveLength(2);
      
      renderer.clear();
      expect(svg.children).toHaveLength(0);
    });
  });

  describe("GeometryStore integration", () => {
    it("should register elements with store", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);
      
      rendererWithStore.drawPoint(point(0, 0), { name: "p1" });
      
      expect(mockStore.add).toHaveBeenCalledWith(
        "p1",
        expect.any(SVGElement),
        "circle",
        []
      );
    });
  });
});
```

---

## Success Criteria

Phase 3 is complete when:

- [ ] `app2/src/geometry/renderers/svgRenderer.ts` exists and compiles
- [ ] `app2/src/geometry/renderers/index.ts` exists
- [ ] SvgRenderer class implements all methods in this document
- [ ] `app2/src/geometry/index.ts` exports renderers
- [ ] `app2/src/geometry/renderers/svgRenderer.test.ts` exists with tests
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] No circular dependencies exist
- [ ] Code follows project conventions (Oxlint/Oxfmt pass)

---

## Next Phase

Once Phase 3 is complete, proceed to **Phase 4: Proof of Concept - SquaresV2 Component** (`backlog/geometry-framework-PHASE4.md`)

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE2.md` - Previous phase (Integration Layer)
- `backlog/geometry-framework-PHASE4.md` - Next phase (Proof of Concept)
- `app2/src/types/geometry.ts` - GeometryValue types
- `app2/src/react-store.ts` - GeometryStore definition
- `app2/src/components/Square.tsx` - Reference component (existing)
