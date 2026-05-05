# Geometry Framework Examples

## Basic Usage

```typescript
import { Construction } from "app2/src/geometry/construction";
import { SvgRenderer } from "app2/src/geometry/renderers/svgRenderer";

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

See `app2/src/components/SquaresV2.tsx` for the full square construction example using compass and straightedge techniques.

## Triangle Construction

```typescript
import { Construction } from "app2/src/geometry/construction";

// Create a simple triangle
const c = new Construction();

// Create three points
const p1 = c.point(100, 100, "p1");
const p2 = c.point(300, 100, "p2");
const p3 = c.point(200, 300, "p3");

// Create lines between points
const line1 = c.line(p1, p2, "base");
const line2 = c.line(p2, p3, "right_side");
const line3 = c.line(p3, p1, "left_side");

// Create the triangle polygon
c.polygon([p1, p2, p3], "triangle");
```

## Hexagon Construction

```typescript
import { Construction } from "app2/src/geometry/construction";

// Create a regular hexagon
const c = new Construction();

const center = c.point(400, 300, "center");
const radius = 200;

// Create 6 points around the center
const points: any[] = [];
for (let i = 0; i < 6; i++) {
  const angle = (i * Math.PI * 2) / 6;
  const x = center.x + Math.cos(angle) * radius;
  const y = center.y + Math.sin(angle) * radius;
  points.push(c.point(x, y, `p${i}`));
}

// Create the hexagon polygon
c.polygon(points, "hexagon");
```

## Using with React

```typescript
import { useMemo, useEffect, useRef } from "react";
import { Construction } from "app2/src/geometry/construction";
import { SvgRenderer } from "app2/src/geometry/renderers/svgRenderer";

function MyGeometryComponent({ step }: { step: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const construction = useMemo(() => {
    const c = new Construction();
    // Build your construction...
    const p1 = c.point(100, 100, "p1");
    const p2 = c.point(300, 300, "p2");
    c.line(p1, p2, "my_line");
    return c;
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const renderer = new SvgRenderer(svgRef.current);
    renderer.clear();
    renderer.drawConstructionUpTo(construction, step);
  }, [step, construction]);

  return <svg ref={svgRef} width="800" height="600" />;
}
```

## Working with Intersections

```typescript
import { Construction } from "app2/src/geometry/construction";

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
import { Construction } from "app2/src/geometry/construction";

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
import { Construction, NoIntersectionError } from "app2/src/geometry/construction";

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

// Full validation with warnings
const result = c.validateFull();
if (!result.valid) {
  console.error("Validation errors:", result.errors);
  console.warn("Validation warnings:", result.warnings);
}
```

## Serialization

```typescript
import { Construction } from "app2/src/geometry/construction";

// Create a construction
const construction = new Construction();
const p1 = construction.point(100, 200, "p1");
const p2 = construction.point(300, 400, "p2");
construction.line(p1, p2, "my_line");

// Save construction
const json = construction.toJSON();
localStorage.setItem("my-construction", JSON.stringify(json));

// Load construction
const savedJson = localStorage.getItem("my-construction");
if (savedJson) {
  const parsedJson = JSON.parse(savedJson);
  const loadedConstruction = Construction.fromJSON(parsedJson);
}
```

## Parameters

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();

// Set parameters
c.setParameter("radius", 100);
c.setParameter("extension", 2.2);

// Use parameter by name in geometry operations
// Note: Parameters are stored by name but used as values in operations
const circle = c.circle(0, 0, 100, "my_circle");
const line = c.lineTowards(p1, p2, 2.2 * 100, "extended_line");

// Get parameter value
const radius = c.getParameter("radius");

// Get all parameters
const allParams = c.getParameters();

// Clear parameters
c.clearParameters();
```

## Step-by-Step Navigation

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();
// Build construction with multiple steps...

// Navigate through steps
c.goTo(5); // Go to step 5
c.next();  // Go to next step
c.prev();  // Go to previous step
c.reset(); // Go to first step

// Get current step index
const currentIndex = c.currentStepIndex;

// Get steps
const currentSteps = c.getSteps(); // Steps up to current index
const allSteps = c.getAllSteps();   // All steps
```

## Undo/Redo Support

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();

// Create some geometry
const p1 = c.point(100, 100, "p1");
const p2 = c.point(200, 200, "p2");

// Undo last operation
c.undo();

// Redo undone operation
c.redo();

// Check undo/redo state
const { canUndo, canRedo } = c.getHistoryState();

// Clear history
c.clearHistory();
```

## Using with GeometryStore (Tooltips)

```typescript
import { Construction } from "app2/src/geometry/construction";
import { SvgRenderer } from "app2/src/geometry/renderers/svgRenderer";
import { GeometryStore } from "app2/src/react-store";

// Create a store for managing elements and tooltips
const store = new GeometryStore();

// Create construction
const c = new Construction();
const p1 = c.point(100, 100, "p1");
const p2 = c.point(300, 300, "p2");
c.line(p1, p2, "my_line");

// Create renderer with store
const svg = document.getElementById("my-svg") as SVGSVGElement;
const renderer = new SvgRenderer(svg, store);

// Draw with names for tooltips
renderer.drawConstruction(c);

// The store now has all elements registered with their names
// Tooltips can be shown when hovering over elements with data-name attributes
```

## Converting Construction to Steps

```typescript
import { Construction } from "app2/src/geometry/construction";
import { constructionToSteps } from "app2/src/geometry/construction-to-steps";

const c = new Construction();
// Build construction...

// Convert to Step[] format for compatibility with existing infrastructure
const steps = constructionToSteps(c);

// Note: Drawing is handled by SvgRenderer, not by Step.draw()
// The adapter is for compatibility with components that expect Step[] format
```

## Derived Geometry: Perpendicular Bisector

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();

// Create a line segment
const p1 = c.point(100, 100, "p1");
const p2 = c.point(300, 300, "p2");
const segment = c.line(p1, p2, "segment");

// Find midpoint
const mid = c.midpoint(p1, p2, "midpoint");

// Create perpendicular at midpoint
const perp = c.perpendicular(segment, mid, "perpendicular");

// The perpendicular bisector is now available as 'perp'
```

## Derived Geometry: Extending Lines

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();

// Create a line
const p1 = c.point(100, 100, "p1");
const p2 = c.point(200, 200, "p2");
const line = c.line(p1, p2, "original_line");

// Extend the line by 100 units from its end
const extended = c.extendLine(line, 100, "extended_line");

// Or create a line towards a point with specific length
const towardsPoint = c.point(300, 100, "towards");
const lineTowards = c.lineTowards(p2, towardsPoint, 150, "line_towards");
```

## Complex Construction: Square with Diagonals

```typescript
import { Construction } from "app2/src/geometry/construction";

const c = new Construction();

// Create square corners
const p1 = c.point(100, 100, "bottom_left");
const p2 = c.point(300, 100, "bottom_right");
const p3 = c.point(300, 300, "top_right");
const p4 = c.point(100, 300, "top_left");

// Create square polygon
c.polygon([p1, p2, p3, p4], "square");

// Create diagonals
const diag1 = c.line(p1, p3, "diagonal_1");
const diag2 = c.line(p2, p4, "diagonal_2");

// Find center (intersection of diagonals)
const center = c.intersection(diag1, diag2, undefined, "center");

// Create circle at center
c.circle(center, 50, "center_circle");
```
