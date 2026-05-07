# Declarative Geometry Framework

## Overview

The Declarative Geometry Framework provides a higher-level, fluid API for creating geometric constructions while maintaining full compatibility with the existing step-based architecture. It automatically generates `Step` objects from declarative code, enabling cleaner, more readable geometry definitions.

## Features

- **Fluid, chainable syntax**: Write geometry constructions in a natural, declarative style
- **Automatic step generation**: Steps are created automatically with proper dependencies
- **Lazy evaluation**: Maintains the existing lazy evaluation model
- **Separation of concerns**: Computation (compute) and rendering (draw) remain separate
- **Type safety**: Full TypeScript support with typed geometry operations
- **Backward compatible**: Works with the existing step execution system

## Installation

No installation required. The framework is built into the project and can be imported directly:

```typescript
import { GeometryBuilder } from "../declarative";
```

## Usage

### Basic Example

```typescript
import { GeometryBuilder } from "../declarative";

// Create a builder
const builder = new GeometryBuilder<MyConfig>();

// Define geometries declaratively
const P1 = builder.point("p1", 0, 0);
const P2 = builder.point("p2", 100, 100);
const LINE = builder.lineBetween("line", P1, P2);
const MID = builder.pointAt("mid", LINE, 0.5);
const CIRCLE = builder.circle("circle", MID, 50);

// Get the generated steps
const steps = builder.toSteps();
```

### Using Configuration Parameters

```typescript
interface MyConfig {
  width: number;
  height: number;
  circleRadius: number;
  border: number;
}

const builder = new GeometryBuilder<MyConfig>();

// Use config values in geometry definitions
const P1 = builder.point(
  "p1",
  (cfg) => cfg.border,
  (cfg) => cfg.height - cfg.border
);

const CIRCLE = builder.circle(
  "circle",
  P1,
  (cfg) => cfg.circleRadius
);

// The steps will automatically use the config when executed
const steps = builder.toSteps();
```

### Complete Square Construction

```typescript
import { GeometryBuilder } from "../declarative";
import type { SquareConfig } from "../geometry/operations";

function buildSquareSteps(config: SquareConfig) {
  const builder = new GeometryBuilder<SquareConfig>();
  
  // Coordinate system
  const CS = builder.coordinateSystem("cs", 0, 0, (cfg) => cfg.height * 0.1);
  
  // Base points
  const P1 = builder.point("p1", (cfg) => cfg.border, (cfg) => cfg.height - cfg.border);
  const P2 = builder.point("p2", (cfg) => cfg.width - cfg.border, (cfg) => cfg.height - cfg.border);
  
  // Main line
  const MAIN_LINE = builder.lineBetween("line_main", P1, P2);
  
  // Circle centers
  const C1 = builder.pointAt("c1", MAIN_LINE, 5/8);
  const C1_C = builder.circle("c1_c", C1, (cfg) => cfg.circleRadius);
  const C2 = builder.intersection("c2", C1_C, MAIN_LINE, "left");
  const C2_C = builder.circle("c2_c", C2, (cfg) => cfg.circleRadius);
  
  // Intersection point
  const PI = builder.circleIntersection("pi", C1_C, C2_C, "north");
  const CI = builder.circle("ci", PI, (cfg) => cfg.circleRadius);
  
  // Extended lines
  const LINE_C2_PI = builder.lineTowards("line_c2_pi", C2, PI, (cfg) => 2.2 * cfg.circleRadius);
  const LINE_C1_PI = builder.lineTowards("line_c1_pi", C1, PI, (cfg) => 2.2 * cfg.circleRadius);
  
  // Bisected points
  const P3 = builder.intersection("p3", CI, LINE_C2_PI, "left", C2);
  const P4 = builder.intersection("p4", CI, LINE_C1_PI, "left", C1);
  
  // Connecting lines
  const LINE_C2_P4 = builder.lineBetween("line_c2_p4", C2, P4);
  const LINE_C1_P3 = builder.lineBetween("line_c1_p3", C1, P3);
  
  // Tangent points
  const PL = builder.intersection("pl", C2_C, LINE_C2_P4, "left");
  const PR = builder.intersection("pr", C1_C, LINE_C1_P3, "left");
  
  // Final square
  const SQUARE = builder.polygon("square", [PL, PR, C1, C2]);
  
  return builder.toSteps();
}
```

## API Reference

### GeometryBuilder Class

The main class for creating declarative geometry constructions.

#### Methods

##### `point(id: string, x: number | ((config: TConfig) => number), y: number | ((config: TConfig) => number)): string`

Creates a point geometry. Returns the geometry ID.

##### `line(id: string, x1: number | ((config: TConfig) => number), y1: number | ((config: TConfig) => number), x2: number | ((config: TConfig) => number), y2: number | ((config: TConfig) => number)): string`

Creates a line geometry with absolute coordinates. Returns the geometry ID.

##### `lineBetween(id: string, p1Id: string, p2Id: string): string`

Creates a line between two point geometries. Returns the geometry ID.

##### `circle(id: string, centerId: string, radius: number | ((config: TConfig) => number)): string`

Creates a circle geometry. Returns the geometry ID.

##### `pointAt(id: string, lineId: string, ratio: number | ((config: TConfig) => number)): string`

Creates a point at a ratio along a line. Returns the geometry ID.

##### `intersection(id: string, circleId: string, lineId: string, direction: "left" | "right" | "north" | "south", excludeId?: string): string`

Finds the intersection of a circle and a line. Returns the geometry ID.

##### `circleIntersection(id: string, circle1Id: string, circle2Id: string, direction: "north" | "south" = "north"): string`

Finds the intersection of two circles. Returns the geometry ID.

##### `lineTowards(id: string, fromId: string, towardsId: string, length: number | ((config: TConfig) => number)): string`

Creates a line from a point towards another point with a specific length. Returns the geometry ID.

##### `polygon(id: string, pointIds: string[]): string`

Creates a polygon from an array of point IDs. Returns the geometry ID.

##### `coordinateSystem(id: string, x: number = 0, y: number = 0, arrowLength: number | ((config: TConfig) => number) = 100): string`

Creates a coordinate system. Returns the geometry ID.

##### `toSteps(): Step<TConfig>[]`

Converts all registered geometries to an ordered array of Step objects. Steps are ordered by dependency.

##### `clear(): void`

Clears all registered geometries.

##### `getStep(id: string): Step<TConfig> | undefined`

Gets a Step object by geometry ID.

##### `getType(id: string): GeometryValue["type"] | undefined`

Gets the type of a geometry by ID.

##### `size: number`

Gets the number of registered geometries.

### Singleton Builder

For convenience, a singleton builder instance is exported:

```typescript
import { builder } from "../declarative";

builder.point("p1", 0, 0);
builder.line("l1", 0, 0, 100, 100);
const steps = builder.toSteps();

// Clear for next construction
builder.clear();
```

## Design Principles

### Explicit Dependencies

Each step automatically declares its inputs, outputs, and parameters based on the geometry construction:

```typescript
const P1 = builder.point("p1", 0, 0);
const P2 = builder.point("p2", 100, 100);
const LINE = builder.lineBetween("line", P1, P2);
// The LINE step automatically has inputs: ["p1", "p2"]
// and outputs: ["line"]
```

### Separation of Concerns

Each step has separate `compute()` and `draw()` functions:
- `compute()`: Pure function that calculates geometry values
- `draw()`: Renders the geometry to SVG

### Lazy Evaluation

Steps compute only when needed during execution. The declarative API just defines the construction graph.

### Type Safety

All geometry operations are type-safe with TypeScript. Geometry IDs are returned as strings, but the builder maintains type information internally.

## Comparison with Imperative Approach

### Imperative (Original)

```typescript
const STEP_P1: Step<SquareConfig> = {
  id: "step_p1",
  inputs: [GEOM.COORDINATE_SYSTEM],
  outputs: [GEOM.P1],
  parameters: ["p1x", "p1y"],
  compute: computeSingle(GEOM.P1, (inputs, params) => {
    const cs = inputs.get(GEOM.COORDINATE_SYSTEM);
    const x = cs && isCoordinateSystem(cs) ? cs.x + params.p1x : params.p1x;
    const y = cs && isCoordinateSystem(cs) ? cs.y + params.p1y : params.p1y;
    return point(x, y);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P1, POINT_RADIUS_MEDIUM, store, theme);
  },
};
```

### Declarative (New)

```typescript
const P1 = builder.point("p1", (cfg) => cfg.p1x, (cfg) => cfg.p1y);
```

The declarative approach is much more concise and readable while maintaining all the same capabilities.

## Limitations

- Geometry IDs are simple strings (not typed objects)
- No compile-time verification of geometry existence
- Circular dependencies are only detected at runtime
- Less control over step IDs (auto-generated)

## Contributing

To add new geometry operations:

1. Add a new method to the `GeometryBuilder` class
2. Ensure it creates a proper Step object with inputs, outputs, parameters
3. Add tests in `GeometryBuilder.test.ts`
4. Update documentation

## License

This framework is part of the SG project and is licensed under the same terms.
