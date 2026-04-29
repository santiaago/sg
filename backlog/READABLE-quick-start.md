# Quick Start Guide for New Geometric Components - UPDATED

> **TL;DR**: Use the **Square.tsx pattern** (now proven to scale with SixFoldV0). This guide extracts the essential patterns for creating new geometric construction components (Triangle, Pentagon, Hexagon, etc.).

> **Last Updated**: April 2025 - Now includes lessons from SixFoldV0 (36-step construction) and graph.md analysis.

---

## 🎯 The Square Pattern - PROVEN AT SCALE

The Square component uses a **step-based architecture** that has been **validated to scale from 16 steps (Square) to 36 steps (SixFoldV0)**. This pattern separates:

1. **Configuration** - Dimensions and parameters (computed from SVG size)
2. **Steps** - Individual geometric operations (declare inputs, outputs, compute, draw)
3. **Execution** - Running steps in order with dependency tracking
4. **Rendering** - Drawing to SVG with tooltips

Each step declares:

- `id` - Unique identifier
- `inputs` - What geometries it needs (dependencies)
- `outputs` - What geometries it produces
- `parameters` - What config values it uses
- `compute` - Pure function to calculate outputs
- `draw` - Function to render outputs

**✅ PROVEN**: This pattern works for both simple (Square: 16 steps) and complex (SixFoldV0: 36 steps) constructions.

---

## 📋 Updated Component Template

Based on the proven Square/SixFoldV0 pattern:

```typescript
// components/[Shape]/[Shape].tsx
import { useEffect, useRef, useMemo } from "react";
import type { SvgConfig } from "../../config/svgConfig";
import { useGeometryStore } from "../../react-store";
import { rect, clearGeometryFromSvg } from "../../utils/svgElements";
import { buildStepMaps, setupSvg } from "../../utils/svg";
import { pick } from "../../utils/svg";
import { [SHAPE]_STEPS, executeSteps, compute[Shape]Config, GEOM } from "../../geometry/[shape]/[shape]Steps";
import type { GeometryValue, Step, Theme } from "../../types/geometry";
import { darkTheme } from "../../themes";

/**
 * [Shape] geometric construction component.
 * Performs step-by-step construction of a [shape] using compass and straightedge techniques.
 */
export interface [Shape]Props {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;

  // Stroke width for large elements (dots)
  dotStrokeWidth?: number;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Key to trigger restart (e.g., when resetting the construction)
  restartTrigger?: number;

  // Current step index (1-based) to execute up to
  currentStep?: number;

  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

export function [Shape]({
  store,
  dotStrokeWidth = 2.0,
  svgConfig,
  restartTrigger = 0,
  currentStep = 0,
  theme = darkTheme,
}: [Shape]Props): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStepRef = useRef<number>(0);

  // === Input Validation ===
  // Validate all props on every change
  useEffect(() => {
    if (currentStep < 0) {
      console.warn("[Shape]: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("[Shape]: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn("[Shape]: svgConfig.height should be positive, received:", svgConfig.height);
    }
    if (!theme || typeof theme !== "object") {
      console.warn("[Shape]: theme should be a valid Theme object, received:", theme);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

  // === Configuration ===
  // Memoize configuration derived from SVG dimensions
  // This prevents unnecessary recalculations
  const config = useMemo(() => {
    return compute[Shape]Config(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // === SVG Container Setup ===
  // ONLY when dimensions or theme change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // Clear everything and setup SVG container
    setupSvg(svg, svgConfig);

    // Draw the background rectangle using the theme color
    rect(svg, svgConfig.width, svgConfig.height, theme);
  }, [svgConfig.width, svgConfig.height, svgConfig.viewBox, theme]);

  // === Step Execution ===
  // ONLY when step, restart, or config changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const prevStep = prevStepRef.current;

    // Clear geometry ONLY when going backwards or restarting
    const shouldClear = currentStep < prevStep || restartTrigger !== 0;

    if (shouldClear) {
      clearGeometryFromSvg(svg);
      store.clear();
    }

    prevStepRef.current = currentStep;

    // If no steps to draw, exit
    if (currentStep <= 0) return;

    try {
      // Build dependency maps for GeometryList display
      const { stepDependencies, stepForOutput } = buildStepMaps([SHAPE]_STEPS, currentStep);

      // Execute steps up to currentStep
      const allValues = executeSteps(
        [SHAPE]_STEPS,
        currentStep,
        { svg, store, theme },
        config,
      );

      // Store metadata for dependency tracking
      // This enables GeometryList to show the dependency graph
      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        const step = stepForOutput.get(id);
        const paramValues = step?.parameters ? pick(config, step.parameters) : {};
        const stepId = step?.id ?? "";

        store.update(id, {
          dependsOn: deps,
          stepId,
          parameterValues: paramValues,
        });
      }
    } catch (error) {
      console.error("[Shape] construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme, config]);

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="[shape]-svg" />
    </div>
  );
}

// Re-export for convenience
export { [SHAPE]_STEPS, GEOM };
export type { Step, GeometryValue };
```

---

## 📋 Updated Step Definitions Template

```typescript
// geometry/[shape]/[shape]Steps.ts
import type { Step, GeometryValue, Point, Line, Circle, Polygon } from "../../types/geometry";
import { point, line, circle, polygon, isPoint, isLine, isCircle, isPolygon } from "../../types/geometry";
import type { Theme } from "../../themes";
import { getGeometry, computeSingle, computeMultiple } from "../operations";
import {
  circleFromPoint,
  pointFromCircles,
  pointFromCircleAndLine,
  lineTowards
} from "../constructors";
import { drawPoint, drawLine, drawCircle, createTooltip } from "../../utils/svgElements";
import type { GeometryStore } from "../../react-store";

// ========================================
// 1. Geometry ID Constants
// ========================================
// Use DESCRIPTIVE names for all geometry IDs
// BAD: C1, C2, PI, P3, P4, PL, PR
// GOOD: CIRCLE_CENTER_LEFT, INTERSECTION_POINT, TANGENT_LEFT
export const GEOM = {
  // Base elements
  BASE_LINE: "base_line",

  // Circle centers
  CIRCLE_CENTER_LEFT: "circle_center_left",
  CIRCLE_CENTER_RIGHT: "circle_center_right",

  // Circle outlines
  CIRCLE_LEFT: "circle_left",
  CIRCLE_RIGHT: "circle_right",

  // Computed points
  INTERSECTION_POINT: "intersection_point",
  TOP_LEFT_POINT: "top_left_point",
  TOP_RIGHT_POINT: "top_right_point",
  TANGENT_LEFT: "tangent_left",
  TANGENT_RIGHT: "tangent_right",

  // Lines
  LINE_LEFT_TO_INTERSECTION: "line_left_to_intersection",
  LINE_RIGHT_TO_INTERSECTION: "line_right_to_intersection",

  // Final result
  [SHAPE]: "[shape]",
} as const;

// ========================================
// 2. Configuration
// ========================================
/ **
 * Configuration for [shape] geometry construction.
 * All values derived from SVG dimensions.
 */
export interface [Shape]Config {
  width: number;
  height: number;
  border: number;
  lineLength: number;
  circleRadius: number;
  // Step-specific parameters
  [PARAM_NAME]: number;
}

/**
 * Computes the configuration from SVG dimensions.
 * This is called once when the component mounts or SVG size changes.
 */
export function compute[Shape]Config(width: number, height: number): [Shape]Config {
  const BORDER = height / 3;  // Example: 1/3 of height as border
  const LINE_LENGTH = width - 2 * BORDER;
  const CIRCLE_RADIUS = LINE_LENGTH / 4;

  return {
    width,
    height,
    border: BORDER,
    lineLength: LINE_LENGTH,
    circleRadius: CIRCLE_RADIUS,
    // Add shape-specific parameters
    [PARAM_NAME]: VALUE,
  };
}

// ========================================
// 3. Step Definitions
// ========================================
// Each step follows the same pattern:
// - id: unique identifier (use descriptive names like "draw_base_line")
// - inputs: array of geometry IDs this step needs
// - outputs: array of geometry IDs this step produces
// - parameters: array of config keys this step uses
// - compute: pure function that calculates outputs from inputs
// - draw: function that renders the outputs

/**
 * Step 1: Draw the base line
 * This is the foundation for the entire construction.
 */
const STEP_BASE_LINE: Step = {
  id: "draw_base_line",
  inputs: [],  // No dependencies - this is a starting point
  outputs: [GEOM.BASE_LINE],
  parameters: ["width", "height", "border"],  // Uses config values

  compute: computeSingle(GEOM.BASE_LINE, (_inputs, params) => {
    // Calculate line coordinates from config
    const x1 = params.border;
    const y1 = params.height - params.border;
    const x2 = params.width - params.border;
    const y2 = params.height - params.border;
    return line(x1, y1, x2, y2);
  }),

  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.BASE_LINE, 0.5, store, theme);
  },
};

/**
 * Step 2: Place circle center point
 * Positioned at a ratio along the base line.
 */
const STEP_CIRCLE_CENTER_LEFT: Step = {
  id: "place_circle_center_left",
  inputs: [GEOM.BASE_LINE],  // Depends on base line
  outputs: [GEOM.CIRCLE_CENTER_LEFT],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.CIRCLE_CENTER_LEFT, (inputs, params) => {
    const baseLine = getGeometry(inputs, GEOM.BASE_LINE, isLine, "Line");
    const lineLength = baseLine.x2 - baseLine.x1;
    // Position at 1/4 of the line length
    const x = baseLine.x1 + lineLength * 0.25;
    return point(x, baseLine.y1);
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CIRCLE_CENTER_LEFT, 2.0, store, theme);
  },
};

/**
 * Step 3: Draw circle at center point
 * Creates a circle geometry (not just an SVG circle element).
 */
const STEP_CIRCLE_LEFT: Step = {
  id: "draw_circle_left",
  inputs: [GEOM.CIRCLE_CENTER_LEFT],
  outputs: [GEOM.CIRCLE_LEFT],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.CIRCLE_LEFT, (inputs, params) => {
    const center = getGeometry(inputs, GEOM.CIRCLE_CENTER_LEFT, isPoint, "Point");
    return circle(center.x, center.y, params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.CIRCLE_LEFT, 0.5, store, theme);
  },
};

/**
 * Step N: Final shape
 * Combines all computed points into the final geometry.
 */
const STEP_FINAL_[SHAPE]: Step = {
  id: "draw_final_[shape]",
  inputs: [GEOM.TOP_LEFT_POINT, GEOM.TOP_RIGHT_POINT, GEOM.CIRCLE_CENTER_LEFT, GEOM.CIRCLE_CENTER_RIGHT],
  outputs: [GEOM.[SHAPE]],
  parameters: [],

  compute: computeSingle(GEOM.[SHAPE], (inputs) => {
    const p1 = getGeometry(inputs, GEOM.TOP_LEFT_POINT, isPoint, "Point");
    const p2 = getGeometry(inputs, GEOM.TOP_RIGHT_POINT, isPoint, "Point");
    const p3 = getGeometry(inputs, GEOM.CIRCLE_CENTER_LEFT, isPoint, "Point");
    const p4 = getGeometry(inputs, GEOM.CIRCLE_CENTER_RIGHT, isPoint, "Point");

    // Create polygon from points (order matters for shape)
    return polygon([p1, p2, p4, p3]);
  }),

  draw: (svg, values, store, theme) => {
    const shape = values.get(GEOM.[SHAPE]);
    if (!shape || !isPolygon(shape)) return;

    // Create SVG polygon element
    const svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = shape.points.map((p) => `${p.x},${p.y}`).join(" ");
    svgPolygon.setAttribute("points", points);
    svgPolygon.setAttribute("stroke", theme.COLOR_PRIMARY);
    svgPolygon.setAttribute("stroke-width", "0.5");
    svgPolygon.setAttribute("fill", "none");
    svgPolygon.setAttribute("pointer-events", "none");
    svgPolygon.setAttribute("data-tooltip", GEOM.[SHAPE]);
    svgPolygon.style.cursor = "pointer";
    svg.appendChild(svgPolygon);

    // Add to store for GeometryList
    if (store) {
      store.add(GEOM.[SHAPE], svgPolygon, "polygon", []);
    }
  },
};

// ========================================
// 4. Step Array and Execution Utilities
// ========================================
// All steps in order - execution stops at currentStep

export const [SHAPE]_STEPS: readonly Step[] = [
  STEP_BASE_LINE,
  STEP_CIRCLE_CENTER_LEFT,
  STEP_CIRCLE_LEFT,
  // ... all other steps in order
  STEP_FINAL_[SHAPE],
];

// Re-export options utilities for component usage
export { executeSteps, computeSingle, computeMultiple, getGeometry };
```

---

## ✅ Step Design Best Practices (From graph.md Analysis)

The `graph.md` file analyzed sixFoldV0Steps (36 steps) vs squareSteps (16 steps) and identified key differences. Follow these **PROVEN** best practices:

### ❌ AVOID: Unused Geometries

**Problem**: sixFoldV0Steps had 23 geometries that were produced but never consumed as inputs.

**Rule**: Every output (except terminal outputs) should be consumed as input to a later step.

**BAD**:

```typescript
const STEP_1: Step = {
  id: "step1",
  inputs: [],
  outputs: [GEOM.LINE1, GEOM.P1, GEOM.P2], // P1 and P2 are never used as inputs
  compute: ...,
  draw: ...,
};
```

**GOOD**:

```typescript
const STEP_1: Step = {
  id: "step1",
  inputs: [],
  outputs: [GEOM.BASE_LINE], // Only output what's needed
  compute: ...,
  draw: ...,
};
```

### ❌ AVOID: Redundant Re-computation

**Problem**: L13 and L24 were computed in both step2 and step6.

**Rule**: Each geometry should be computed exactly once.

**BAD**:

```typescript
// Step 2
const STEP_2: Step = {
  id: "step2",
  outputs: [GEOM.L13, GEOM.L24], // Computed here
  ...
};

// Step 6
const STEP_6: Step = {
  id: "step6",
  outputs: [GEOM.L13, GEOM.L24], // Recomputed here!
  ...
};
```

**GOOD**:

```typescript
// Step 2: Use as intermediate values only (not outputs)
const STEP_2: Step = {
  id: "step2",
  outputs: [GEOM.CP1, GEOM.CP2], // Only expose what's needed
  compute: (inputs, config) => {
    const l13Line = line(...); // Internal computation
    const l24Line = line(...); // Internal computation
    // ... use l13Line, l24Line to compute outputs
  },
  ...
};

// Step 6: Compute here where they're needed as outputs
const STEP_6: Step = {
  id: "step6",
  inputs: [GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.L13, GEOM.L24], // Computed once
  ...
};
```

### ❌ AVOID: Pass-through Steps

**Problem**: Step 7 in sixFoldV0Steps was a pass-through that just returned its input unchanged.

**Rule**: Every step should add computational value.

**BAD**:

```typescript
const STEP_7: Step = {
  id: "step7",
  inputs: [GEOM.PI2],
  outputs: [GEOM.PI2], // Same as input! No value added
  compute: (inputs) => {
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    return new Map([[GEOM.PI2, pi2]]; // Just returns input
  },
  draw: () => {}, // Empty!
};
```

**GOOD**: Just delete this step entirely.

### ✅ DO: Keep Step Outputs Minimal

**Rule**: Only expose what's needed by later steps.

**GOOD**:

```typescript
const STEP_X: Step = {
  id: "step_x",
  inputs: [GEOM.A, GEOM.B],
  outputs: [GEOM.C], // Only C is needed by later steps
  compute: (inputs, config) => {
    const a = getGeometry(inputs, GEOM.A, ...);
    const b = getGeometry(inputs, GEOM.B, ...);
    const c = computeSomething(a, b);
    const intermediate = computeIntermediate(c); // Not exposed
    return new Map([[GEOM.C, c]]);
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C, 2.0, store, theme);
    // intermediate can still be drawn if needed, but it's not in outputs
  },
};
```

---

## ✅ Checklist for New Components

### Before You Start

- [ ] Read `Square.tsx` and `geometry/squareSteps.ts`
- [ ] Read `SixFold.tsx` (was SixFoldV0.tsx) and `geometry/sixFoldV0Steps.ts` **NEW: Prove it scales**
- [ ] Read `graph.md` for lessons learned about step design
- [ ] Understand the step pattern completely
- [ ] Plan your construction algorithm on paper first

### Creating the Component

- [ ] Create component folder: `components/[Shape]/`
- [ ] Create step definitions: `geometry/[shape]/[shape]Steps.ts`
- [ ] Create component: `components/[Shape]/[Shape].tsx`
- [ ] Create index: `components/[Shape]/index.ts` (optional)

### Step Definition Checklist

- [ ] Each step has a **unique, descriptive `id`** (e.g., "draw_base_line", "place_circle_center")
- [ ] Each step declares **all `inputs`** (dependencies) - nothing missing
- [ ] Each step declares **all `outputs`** (what it produces)
- [ ] Each step declares **`parameters`** from config if needed
- [ ] **`compute` function is pure** (no side effects, same input → same output)
- [ ] **`compute` function uses `getGeometry()`** for type-safe access
- [ ] Each step **adds computational value** (no pass-through steps)
- [ ] Each step has a **header comment** explaining its purpose
- [ ] **Every output is consumed** by a later step (except terminal outputs)
- [ ] **No redundant computation** - same geometry not computed twice
- [ ] **P1, P2, C1, etc. replaced with descriptive names** (from graph.md lesson)

### Component Checklist

- [ ] Uses `useGeometryStore()` hook (unified store)
- [ ] Memoizes configuration with `useMemo`
- [ ] Has **separate effects** for SVG setup and step execution
- [ ] Handles clearing when going backwards or restarting
- [ ] Includes try/catch for error handling
- [ ] Validates props in a useEffect
- [ ] Has **component-level JSDoc**
- [ ] Exports step constants for testing

---

## 🔥 Common Patterns

### Pattern 1: Creating a Point Midway Between Two Points

```typescript
// Direct calculation
const midPoint = point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

// As a step
const STEP_MIDPOINT: Step = {
  id: "compute_midpoint",
  inputs: [GEOM.POINT_A, GEOM.POINT_B],
  outputs: [GEOM.MIDPOINT],
  parameters: [],
  compute: computeSingle(GEOM.MIDPOINT, (inputs) => {
    const a = getGeometry(inputs, GEOM.POINT_A, isPoint, "Point");
    const b = getGeometry(inputs, GEOM.POINT_B, isPoint, "Point");
    return point((a.x + b.x) / 2, (a.y + b.y) / 2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.MIDPOINT, 2.0, store, theme);
  },
};
```

### Pattern 2: Creating a Line of Specific Length at an Angle

```typescript
// Using lineTowards from constructors.ts
const STEP_EXTENDED_LINE: Step = {
  id: "draw_extended_line",
  inputs: [GEOM.START_POINT, GEOM.DIRECTION_POINT],
  outputs: [GEOM.EXTENDED_LINE],
  parameters: ["radius"],
  compute: computeSingle(GEOM.EXTENDED_LINE, (inputs, params) => {
    const start = getGeometry(inputs, GEOM.START_POINT, isPoint, "Point");
    const towards = getGeometry(inputs, GEOM.DIRECTION_POINT, isPoint, "Point");
    return lineTowards(start, towards, params.radius * 2.2);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.EXTENDED_LINE, 0.5, store, theme);
  },
};
```

### Pattern 3: Finding Intersection of Two Circles

```typescript
const STEP_CIRCLE_INTERSECTION: Step = {
  id: "find_circle_intersection",
  inputs: [GEOM.CIRCLE_LEFT, GEOM.CIRCLE_RIGHT],
  outputs: [GEOM.INTERSECTION_POINT],
  parameters: ["tolerance"],
  compute: computeSingle(GEOM.INTERSECTION_POINT, (inputs, params) => {
    const c1 = getGeometry(inputs, GEOM.CIRCLE_LEFT, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.CIRCLE_RIGHT, isCircle, "Circle");
    const pi = pointFromCircles(c1, c2, { select: "north" });
    if (!pi) throw new Error("Circles do not intersect");
    return pi;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.INTERSECTION_POINT, 2.0, store, theme);
  },
};
```

### Pattern 4: Finding Intersection of Circle and Line (Excluding Known Point)

```typescript
const STEP_CIRCLE_LINE_INTERSECTION: Step = {
  id: "find_circle_line_intersection",
  inputs: [GEOM.CIRCLE, GEOM.LINE],
  outputs: [GEOM.NEW_POINT],
  parameters: ["tolerance"],
  compute: computeSingle(GEOM.NEW_POINT, (inputs, params) => {
    const circle = getGeometry(inputs, GEOM.CIRCLE, isCircle, "Circle");
    const line = getGeometry(inputs, GEOM.LINE, isLine, "Line");
    // The known point is the start of the line (line.x1, line.y1)
    const knownPoint = point(line.x1, line.y1);
    const newPoint = pointFromCircleAndLine(circle, line, {
      exclude: knownPoint,
      tolerance: params.tolerance,
    });
    if (!newPoint) throw new Error("No valid intersection found");
    return newPoint;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.NEW_POINT, 2.0, store, theme);
  },
};
```

### Pattern 5: Drawing with Tooltip

```typescript
// Simple: Use draw helpers
drawPoint(svg, values, GEOM.MY_POINT, radius, store, theme);
drawLine(svg, values, GEOM.MY_LINE, strokeWidth, store, theme);
drawCircle(svg, values, GEOM.MY_CIRCLE, strokeWidth, store, theme);

// Custom: For complex drawing with tooltips
const STEP_CUSTOM_DRAW: Step = {
  id: "custom_draw",
  inputs: [GEOM.A, GEOM.B],
  outputs: [GEOM.CUSTOM],
  parameters: [],
  compute: computeSingle(GEOM.CUSTOM, (inputs) => {
    // ... compute logic
  }),
  draw: (svg, values, store, theme) => {
    const a = values.get(GEOM.A);
    const b = values.get(GEOM.B);
    if (!a || !b) return;

    // Create SVG element
    const element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    element.setAttribute("x1", a.x.toString());
    element.setAttribute("y1", a.y.toString());
    element.setAttribute("x2", b.x.toString());
    element.setAttribute("y2", b.y.toString());
    element.setAttribute("stroke", theme.COLOR_PRIMARY);
    element.setAttribute("stroke-width", "0.5");

    // Add tooltip
    const tooltipX = (a.x + b.x) / 2;
    const tooltipY = (a.y + b.y) / 2;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, GEOM.CUSTOM, 15, theme);
    setTooltip(element, tooltip, tooltipBg); // Using WeakMap approach

    svg.appendChild(element);

    // Add to store
    if (store) {
      store.add(GEOM.CUSTOM, element, "line", [GEOM.A, GEOM.B]);
    }
  },
};
```

### Pattern 6: Accessing Previous Step Results

```typescript
// In compute function:
const inputValue = getGeometry(inputs, GEOM.INPUT_ID, isLine, "Line");
// This provides type-safe access with descriptive errors

// In step definition:
const STEP_Y: Step = {
  id: "step_y",
  inputs: [GEOM.X], // Declare dependency
  outputs: [GEOM.Y],
  compute: computeSingle(GEOM.Y, (inputs) => {
    const x = getGeometry(inputs, GEOM.X, isPoint, "Point");
    // Use x to compute y
    return point(x.x + 10, x.y + 10);
  }),
  draw: ...,
};
```

---

## 🎯 Step-by-Step Workshop: Creating a Triangle Component

Let's walk through creating a simple Triangle component step-by-step.

### Step 1: Plan the Construction

On paper, sketch:

```
1. Draw base line
2. Place vertex A at left end
3. Place vertex B at right end
4. Find midpoint of AB
5. Draw perpendicular line at midpoint
6. Place vertex C on perpendicular line at height h
7. Draw triangle ABC
```

### Step 2: Create Configuration

`geometry/triangle/operations.ts`:

```typescript
import type { GeometryValue } from "../../types/geometry";

export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export interface TriangleConfig {
  width: number;
  height: number;
  border: number;
  baseLength: number;
  triangleHeight: number;
}

export function computeTriangleConfig(width: number, height: number): TriangleConfig {
  const border = height / 4;
  const baseLength = width - 2 * border;
  const triangleHeight = baseLength * (Math.sqrt(3) / 2); // Equilateral triangle

  return {
    width,
    height,
    border,
    baseLength,
    triangleHeight,
  };
}

// Geometry IDs
export const GEOM = {
  BASE_LINE: "base_line",
  VERTEX_A: "vertex_a",
  VERTEX_B: "vertex_b",
  VERTEX_C: "vertex_c",
  MIDPOINT_AB: "midpoint_ab",
  PERPENDICULARLine: "perpendicular_line",
  TRIANGLE: "triangle",
} as const;

export { getGeometry, computeSingle, computeMultiple };
export type { GeometryStore, Theme };
```

### Step 3: Create Steps

`geometry/triangle/triangleSteps.ts`:

```typescript
import type { Step, GeometryValue } from "../../types/geometry";
import { point, line, polygon, isPoint, isLine } from "../../types/geometry";
import { getGeometry, computeSingle, GEOM, computeTriangleConfig } from "./operations";
import { drawPoint, drawLine } from "../../utils/svgElements";
import { lineTowards } from "../constructors";

export { computeTriangleConfig, GEOM };
export type { TriangleConfig };

// Step 1: Base line
const STEP_BASE_LINE: Step = {
  id: "draw_base_line",
  inputs: [],
  outputs: [GEOM.BASE_LINE],
  parameters: ["border", "width", "height"],
  compute: computeSingle(GEOM.BASE_LINE, (_, params) => {
    const y = params.height - params.border;
    return line(params.border, y, params.width - params.border, y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.BASE_LINE, 0.5, store, theme);
  },
};

// Step 2: Vertex A (left)
const STEP_VERTEX_A: Step = {
  id: "place_vertex_a",
  inputs: [GEOM.BASE_LINE],
  outputs: [GEOM.VERTEX_A],
  parameters: ["border", "height"],
  compute: computeSingle(GEOM.VERTEX_A, (inputs, params) => {
    const baseLine = getGeometry(inputs, GEOM.BASE_LINE, isLine, "Line");
    return point(baseLine.x1, baseLine.y1);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.VERTEX_A, 2.0, store, theme);
  },
};

// Step 3: Vertex B (right)
const STEP_VERTEX_B: Step = {
  id: "place_vertex_b",
  inputs: [GEOM.BASE_LINE],
  outputs: [GEOM.VERTEX_B],
  parameters: [],
  compute: computeSingle(GEOM.VERTEX_B, (inputs) => {
    const baseLine = getGeometry(inputs, GEOM.BASE_LINE, isLine, "Line");
    return point(baseLine.x2, baseLine.y2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.VERTEX_B, 2.0, store, theme);
  },
};

// Step 4: Midpoint of AB
const STEP_MIDPOINT_AB: Step = {
  id: "compute_midpoint_ab",
  inputs: [GEOM.VERTEX_A, GEOM.VERTEX_B],
  outputs: [GEOM.MIDPOINT_AB],
  parameters: [],
  compute: computeSingle(GEOM.MIDPOINT_AB, (inputs) => {
    const a = getGeometry(inputs, GEOM.VERTEX_A, isPoint, "Point");
    const b = getGeometry(inputs, GEOM.VERTEX_B, isPoint, "Point");
    return point((a.x + b.x) / 2, (a.y + b.y) / 2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.MIDPOINT_AB, 2.0, store, theme);
  },
};

// Step 5: Perpendicular line at midpoint
const STEP_PERPENDICULAR: Step = {
  id: "draw_perpendicular",
  inputs: [GEOM.MIDPOINT_AB, GEOM.VERTEX_A, GEOM.VERTEX_B],
  outputs: [GEOM.PERPENDICULARLine],
  parameters: ["triangleHeight"],
  compute: computeSingle(GEOM.PERPENDICULARLine, (inputs, params) => {
    const midpoint = getGeometry(inputs, GEOM.MIDPOINT_AB, isPoint, "Point");
    const a = getGeometry(inputs, GEOM.VERTEX_A, isPoint, "Point");
    // Create vertical line (perpendicular to horizontal base)
    return line(midpoint.x, midpoint.y, midpoint.x, midpoint.y - params.triangleHeight);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.PERPENDICULARLine, 0.5, store, theme);
  },
};

// Step 6: Vertex C (top)
const STEP_VERTEX_C: Step = {
  id: "place_vertex_c",
  inputs: [GEOM.PERPENDICULARLine],
  outputs: [GEOM.VERTEX_C],
  parameters: ["triangleHeight"],
  compute: computeSingle(GEOM.VERTEX_C, (inputs, params) => {
    const perpLine = getGeometry(inputs, GEOM.PERPENDICULARLine, isLine, "Line");
    // C is at the top of the perpendicular line
    return point(perpLine.x2, perpLine.y2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.VERTEX_C, 2.0, store, theme);
  },
};

// Step 7: Final triangle
const STEP_FINAL_TRIANGLE: Step = {
  id: "draw_final_triangle",
  inputs: [GEOM.VERTEX_A, GEOM.VERTEX_B, GEOM.VERTEX_C],
  outputs: [GEOM.TRIANGLE],
  parameters: [],
  compute: computeSingle(GEOM.TRIANGLE, (inputs) => {
    const a = getGeometry(inputs, GEOM.VERTEX_A, isPoint, "Point");
    const b = getGeometry(inputs, GEOM.VERTEX_B, isPoint, "Point");
    const c = getGeometry(inputs, GEOM.VERTEX_C, isPoint, "Point");
    return polygon([a, b, c]);
  }),
  draw: (svg, values, store, theme) => {
    const triangle = values.get(GEOM.TRIANGLE);
    if (!triangle || !isPolygon(triangle)) return;

    const svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = triangle.points.map((p) => `${p.x},${p.y}`).join(" ");
    svgPolygon.setAttribute("points", points);
    svgPolygon.setAttribute("stroke", theme.COLOR_PRIMARY);
    svgPolygon.setAttribute("stroke-width", "1");
    svgPolygon.setAttribute("fill", "none");
    svgPolygon.setAttribute("pointer-events", "none");
    svgPolygon.setAttribute("data-tooltip", GEOM.TRIANGLE);
    svgPolygon.style.cursor = "pointer";
    svg.appendChild(svgPolygon);

    if (store) {
      store.add(GEOM.TRIANGLE, svgPolygon, "polygon", []);
    }
  },
};

export const TRIANGLE_STEPS: readonly Step[] = [
  STEP_BASE_LINE,
  STEP_VERTEX_A,
  STEP_VERTEX_B,
  STEP_MIDPOINT_AB,
  STEP_PERPENDICULAR,
  STEP_VERTEX_C,
  STEP_FINAL_TRIANGLE,
];

// Step execution utilities
export function executeStep(
  step: Step,
  allValues: Map<string, GeometryValue>,
  ctx: { svg: SVGSVGElement; store: GeometryStore; theme: Theme },
  config: TriangleConfig,
): Map<string, GeometryValue> {
  const inputValues = new Map<string, GeometryValue>();
  for (const inputId of step.inputs) {
    const value = allValues.get(inputId);
    if (!value) {
      throw new Error(`Step ${step.id}: missing input geometry ${inputId}`);
    }
    inputValues.set(inputId, value);
  }

  const outputValues = step.compute(inputValues, config);

  const newAllValues = new Map(allValues);
  for (const [id, value] of outputValues) {
    newAllValues.set(id, value);
  }

  step.draw(ctx.svg, newAllValues, ctx.store, ctx.theme);

  return newAllValues;
}

export function executeSteps(
  steps: readonly Step[],
  upToIndex: number,
  ctx: { svg: SVGSVGElement; store: GeometryStore; theme: Theme },
  config: TriangleConfig,
): Map<string, GeometryValue> {
  let allValues = new Map<string, GeometryValue>();

  for (let i = 0; i < Math.min(upToIndex, steps.length); i++) {
    allValues = executeStep(steps[i], allValues, ctx, config);
  }

  return allValues;
}
```

### Step 4: Create Component

`components/Triangle/Triangle.tsx`:

```typescript
import { useEffect, useRef, useMemo } from "react";
import type { SvgConfig } from "../../config/svgConfig";
import { useGeometryStore } from "../../react-store";
import { rect, clearGeometryFromSvg } from "../../utils/svgElements";
import { buildStepMaps, setupSvg, pick } from "../../utils/svg";
import {
  TRIANGLE_STEPS,
  executeSteps,
  computeTriangleConfig,
  GEOM
} from "../../geometry/triangle/triangleSteps";
import type { GeometryValue, Step, Theme } from "../../types/geometry";
import { darkTheme } from "../../themes";

/**
 * Triangle geometric construction component.
 * Performs step-by-step construction of an equilateral triangle.
 */
export interface TriangleProps {
  store: GeometryStore;
  dotStrokeWidth?: number;
  svgConfig: SvgConfig;
  restartTrigger?: number;
  currentStep?: number;
  theme?: Theme;
}

export function Triangle({
  store,
  dotStrokeWidth = 2.0,
  svgConfig,
  restartTrigger = 0,
  currentStep = 0,
  theme = darkTheme,
}: TriangleProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStepRef = useRef<number>(0);

  // Configuration
  const config = useMemo(() => {
    return computeTriangleConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // SVG setup
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    setupSvg(svg, svgConfig);
    rect(svg, svgConfig.width, svgConfig.height, theme);
  }, [svgConfig.width, svgConfig.height, svgConfig.viewBox, theme]);

  // Input validation
  useEffect(() => {
    if (currentStep < 0) {
      console.warn("Triangle: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("Triangle: svgConfig.width should be positive, received:", svgConfig.width);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

  // Step execution
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const prevStep = prevStepRef.current;
    const shouldClear = currentStep < prevStep || restartTrigger !== 0;

    if (shouldClear) {
      clearGeometryFromSvg(svg);
      store.clear();
    }
    prevStepRef.current = currentStep;

    if (currentStep <= 0) return;

    try {
      const { stepDependencies, stepForOutput } = buildStepMaps(TRIANGLE_STEPS, currentStep);
      const allValues = executeSteps(
        TRIANGLE_STEPS,
        currentStep,
        { svg, store, theme },
        config,
      );

      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        const step = stepForOutput.get(id);
        const paramValues = step?.parameters ? pick(config, step.parameters) : {};
        const stepId = step?.id ?? "";
        store.update(id, { dependsOn: deps, stepId, parameterValues });
      }
    } catch (error) {
      console.error("Triangle construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, theme, config, dotStrokeWidth]);

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="triangle-svg" />
    </div>
  );
}

export { TRIANGLE_STEPS, GEOM };
export type { Step, GeometryValue };
```

### Step 5: Create Index (Optional)

`components/Triangle/index.ts`:

```typescript
export { Triangle, TRIANGLE_STEPS, GEOM } from "./Triangle";
export type { TriangleProps, Step, GeometryValue } from "./Triangle";
```

### Step 6: Use in App

Now you can use the Triangle component just like Square:

```typescript
import { Triangle } from "./components/Triangle";
import { useGeometryStore } from "./react-store";
import { standardSvgConfig } from "./config/svgConfig";

function App() {
  const store = useGeometryStore();
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div>
      <Triangle
        store={store}
        svgConfig={standardSvgConfig}
        currentStep={currentStep}
      />
      <button onClick={() => setCurrentStep(s => Math.min(s + 1, 7))}>
        Next Step
      </button>
      <button onClick={() => setCurrentStep(s => Math.max(s - 1, 0))}>
        Previous Step
      </button>
      <button onClick={() => setCurrentStep(0)}>Reset</button>
    </div>
  );
}
```

---

## 📚 Resources

### Main Files (Study These First)

- **Square Component**: `app2/src/components/Square.tsx` - Gold standard (142 lines)
- **Square Steps**: `app2/src/geometry/squareSteps.ts` - 16-step construction
- **SixFold Component**: `app2/src/components/SixFold.tsx` (was SixFoldV0.tsx) - Scales to 36 steps
- **SixFold Steps**: `app2/src/geometry/sixFoldV0Steps.ts` - 36-step construction

### Utilities

- **SVG Utilities**: `app2/src/svg.ts` - pick(), buildStepMaps(), setupSvg()
- **Drawing Primitives**: `app2/src/svgElements.ts` - rect(), dot(), line(), circle(), drawPoint(), drawLine(), etc.
- **Geometry Constructors**: `app2/src/geometry/constructors.ts` - circleFromPoint(), pointFromCircles(), etc.
- **Geometry Operations**: `app2/src/geometry/operations.ts` - getGeometry(), computeSingle(), GEOM constants

### Types

- **Geometry Types**: `app2/src/types/geometry.ts` - Point, Line, Circle, Polygon, Step interfaces

### Store

- **Geometry Store**: `app2/src/react-store.ts` - useGeometryStore() hook (UPDATE: should be consolidated)

### Configuration

- **SVG Config**: `app2/src/config/svgConfig.ts` - standardSvgConfig

### Themes

- **Themes**: `app2/src/themes.ts` - darkTheme, lightTheme

### Analysis Documents (Read These!)

- **Dependency Analysis**: `app2/src/geometry/graph.md` - Lessons learned from comparing Square vs SixFoldV0
- **Architecture Plan**: `app2/PLAN geometry-framework.md` - Future higher-level DSL (read CRITIQUE first)
- **Critique**: `app2/CRITIQUE.md` - 18 issues with the proposed framework

### Other READABLE Files

- **Full Report**: `app2/src/components/READABLE.md` - Comprehensive analysis
- **Action Items**: `app2/src/components/READABLE-action-items.md` - Specific, actionable improvements

---

## 🎯 Naming Conventions

### Geometry IDs (CRITICAL - From graph.md lessons)

Use **descriptive names** that reveal what the geometry represents:

| ❌ Bad  | ✅ Good               | Why                                   |
| ------- | --------------------- | ------------------------------------- |
| `c1`    | `CIRCLE_CENTER_LEFT`  | Describes what it is and its position |
| `p1`    | `VERTEX_BOTTOM_LEFT`  | Describes position in the shape       |
| `l1`    | `BASE_LINE`           | Describes purpose                     |
| `pi`    | `INTERSECTION_POINT`  | Self-documenting                      |
| `ci`    | `INTERSECTION_CIRCLE` | Self-documenting                      |
| `p3`    | `TOP_LEFT_POINT`      | Clear purpose                         |
| `pl`    | `TANGENT_LEFT`        | Clear purpose                         |
| `step1` | `draw_base_line`      | Describes action                      |

**Rule of thumb**: If you can't tell what a geometry is from its name alone, the name isn't descriptive enough.

**Corollary**: If you find yourself adding comments to explain what `GEOM.C1` is, the name should be improved.

### Step IDs

Use **verb-noun** format:

| ❌ Bad         | ✅ Good                    |
| -------------- | -------------------------- |
| `step1`        | `draw_base_line`           |
| `c1`           | `place_circle_center_1`    |
| `p3`           | `compute_top_left_vertex`  |
| `intersection` | `find_circle_intersection` |

**Prefix with verb**: draw*, place*, compute*, find*, create\*, etc.

### Variable Names in Compute Functions

Use **descriptive names** that match the geometric concepts:

```typescript
// ❌ BAD:
const a = inputs.get(GEOM.MAIN_LINE);
const b = getGeometry(a, ...);
const c = b.x2 - b.x1;

// ✅ GOOD:
const mainLine = getGeometry(inputs, GEOM.MAIN_LINE, isLine, "Line");
const lineLength = mainLine.x2 - mainLine.x1;
const centerX = mainLine.x1 + lineLength / 2;
```

---

## 🐛 Debugging Tips

### Tip 1: Check Step Dependencies

If a geometry is missing, verify:

1. All required inputs are declared in the step's `inputs` array
2. All input steps come **before** this step in the `STEPS` array
3. The input geometries are being produced by their respective steps

**Debug**: Add logging to see what's available:

```typescript
compute: computeSingle(GEOM.OUTPUT, (inputs, params) => {
  console.log("Step X inputs:", Array.from(inputs.keys()));
  console.log("Step X params:", params);
  // ...
}),
```

### Tip 2: Verify Step Order

If drawing looks wrong:

1. Verify steps are in the correct order
2. Check that clearing logic works (going backwards clears correctly)
3. Check that restart logic works (restartTrigger clears correctly)
4. Verify each step's `outputs` are actually being drawn

**Debug**: Check if all expected geometries are in the store:

```typescript
useEffect(() => {
  console.log("Store items:", Array.from(store.items.keys()));
}, [store.items]);
```

### Tip 3: Check Types

If you get type errors:

1. Verify you're using the correct type guard (`isPoint`, `isLine`, `isCircle`, etc.)
2. Verify the geometry actually has that type
3. Verify you're not mixing up GeometryValue types with SVG element types

**Debug**: Add type checking:

```typescript
const value = values.get(GEOM.MY_GEOM);
console.log("Type of MY_GEOM:", value?.type); // Should be "point", "line", "circle", etc.
```

### Tip 4: Use getGeometry for Type Safety

Always use `getGeometry()` instead of direct Map access:

```typescript
// ✅ GOOD - Type-safe with error checking
const myLine = getGeometry(inputs, GEOM.MY_LINE, isLine, "Line");

// ❌ BAD - No type checking, can return undefined
const myLine = inputs.get(GEOM.MY_LINE);
```

---

## 📊 Comparison: Traditional vs Step Pattern

### Traditional Approach (SixFold.tsx - ❌ ANTI-PATTERN)

```typescript
useEffect(() => {
  // 883+ lines of inline code
  // Drawing functions defined inline
  // No separation of concerns
  // Hard to test
  // Hard to reuse
  // Hard to maintain

  const dot = (x, y) => { ... }
  const line = (x1, y1, x2, y2) => { ... }
  const circle = (cx, cy, r) => { ... }

  // Monolithic construction
  const mainLine = line(...);
  const c1 = dot(...);
  const c2 = dot(...);
  // ... 50 more operations
}, [dependencies]);
```

### Step Pattern Approach (Square.tsx, SixFold.tsx - ✅ GOLD STANDARD)

```typescript
// In [shape]Steps.ts:
const STEPS = [
  { id: "step1", inputs: [], outputs: ["line"], compute: ..., draw: ... },
  { id: "step2", inputs: ["line"], outputs: ["c1"], compute: ..., draw: ... },
  { id: "step3", inputs: ["line", "c1"], outputs: ["c2"], compute: ..., draw: ... },
  // Each step is independent and testable
];

// In [Shape].tsx:
useEffect(() => {
  // Clean, simple execution
  const allValues = executeSteps(STEPS, currentStep, ctx, config);
}, [dependencies]);
```

### Benefits of Step Pattern

| Aspect              | Traditional | Step Pattern      |
| ------------------- | ----------- | ----------------- |
| **Lines of code**   | 800+        | 140               |
| **Reusability**     | Low         | High              |
| **Testability**     | Hard        | Easy              |
| **Maintainability** | Hard        | Easy              |
| **Debugging**       | Hard        | Easy              |
| **Collaboration**   | Hard        | Easy              |
| **Error isolation** | Hard        | Easy              |
| **Performance**     | OK          | Better (lazy)     |
| **Proven at scale** | ❌ No       | ✅ Yes (36 steps) |

**Conclusion**: The step pattern is **the correct approach** for all geometric construction components.

---

## 🚀 Final Advice

1. **Follow the Square/SixFold pattern exactly** - It's been proven to work
2. **Keep steps small and focused** - Each step should do one thing
3. **Use descriptive names** - If a name needs a comment to explain it, the name isn't good enough
4. **Every output should have a consumer** - Follow the squareSteps philosophy
5. **No pass-through steps** - Every step should add value
6. **No redundant computation** - Compute each geometry exactly once
7. **Use getGeometry() everywhere** - Don't use Map.get() directly
8. **Add JSDoc to everything** - Follow svg.ts as the gold standard
9. **Test as you go** - Add tests for each new component
10. **Read graph.md** - Learn from the mistakes in SixFoldV0's first iteration

---

_Quick Start Guide: New Geometric Components - UPDATED April 2025_
