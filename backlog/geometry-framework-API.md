# Geometry Framework API Documentation

## Overview

The Geometry Framework provides a higher-level declarative language for geometric constructions. It offers a fluid, chainable API while preserving the existing step-based architecture.

## Table of Contents

1. [Types](#types)
2. [Construction Class](#construction-class)
3. [SvgRenderer Class](#svgrenderer-class)
4. [Utility Functions](#utility-functions)
5. [Error Classes](#error-classes)

---

## Types

### Reference Types

Reference types are pure identifiers with no data storage. All data is stored in the Construction instance.

#### PointRef

```typescript
interface PointRef {
  readonly id: string;
}
```

Reference to a Point geometry.

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
- "north"/"south": For circle-circle intersections (pick by y-coordinate). In SVG coordinate system, y increases downward, so "north" = smaller y.
- "left"/"right": For circle-line intersections (pick by x-coordinate). "left" = smaller x, "right" = larger x.

#### IntersectionOptions

```typescript
type IntersectionOptions = Direction | { exclude: PointRef };
```

Options for intersection operations. Can specify a direction OR exclude a known point.

#### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

Result of construction validation.

#### ValidationError

```typescript
interface ValidationError {
  type: string;
  stepId?: string;
  geometryId?: string;
  message: string;
  severity: "error";
}
```

Validation error with severity level.

#### ValidationWarning

```typescript
interface ValidationWarning {
  type: string;
  stepId?: string;
  geometryId?: string;
  message: string;
  severity: "warning";
}
```

Validation warning with severity level.

#### ConstructionState

```typescript
interface ConstructionState {
  values: Map<string, GeometryValue>;
  steps: InternalStep[];
  stepIndex: number;
  errors: ConstructionError[];
  pointsOnGeom: Map<string, Set<string>>;
  parameters: Map<string, number>;
  nameCounter: number;
}
```

State snapshot for undo/redo history.

#### SerializedConstruction

```typescript
interface SerializedConstruction {
  version: number;
  values: Array<{ id: string; type: GeometryValue["type"]; data: unknown }>;
  steps: Array<{ id: string; type: GeometryValue["type"]; dependencies: string[] }>;
  stepIndex: number;
  parameters: Record<string, number>;
}
```

Serialized representation of a Construction for JSON storage.

---

## Construction Class

The main class for creating geometric constructions. All operations are methods on Construction.

### Constructor

```typescript
new Construction();
```

Creates a new, empty Construction.

### Base Geometry Creators

#### point(x: number, y: number, name?: string): PointRef

Creates a point at specific coordinates.

**Parameters:**
- `x` - The x-coordinate of the point
- `y` - The y-coordinate of the point
- `name` - Optional name/ID for the point. If not provided, an auto-generated name will be used

**Returns:** A PointRef that can be used to reference this point in subsequent operations

**Example:**
```typescript
const c = new Construction();
const p1 = c.point(100, 200, "my_point");
const p2 = c.point(0, 0); // auto-named
```

#### point(p: PointRef, name?: string): PointRef

Creates a point by copying an existing point reference.

**Parameters:**
- `p` - Point reference to copy
- `name` - Optional name for the new point

**Returns:** A PointRef referencing the copied point

#### line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef

Creates a line from coordinates.

**Parameters:**
- `x1` - Start x coordinate
- `y1` - Start y coordinate
- `x2` - End x coordinate
- `y2` - End y coordinate
- `name` - Optional name for the line

**Returns:** A LineRef referencing the created line

#### line(p1: PointRef, p2: PointRef, name?: string): LineRef

Creates a line from two point references.

**Parameters:**
- `p1` - First point reference
- `p2` - Second point reference
- `name` - Optional name for the line

**Returns:** A LineRef referencing the created line

#### circle(cx: number, cy: number, r: number, name?: string): CircleRef

Creates a circle from center coordinates and radius.

**Parameters:**
- `cx` - Center x coordinate
- `cy` - Center y coordinate
- `r` - Radius
- `name` - Optional name for the circle

**Returns:** A CircleRef referencing the created circle

#### circle(center: PointRef, radius: number, name?: string): CircleRef

Creates a circle from center point and radius.

**Parameters:**
- `center` - Center point reference
- `radius` - Radius
- `name` - Optional name for the circle

**Returns:** A CircleRef referencing the created circle

#### polygon(points: PointRef[], name?: string): PolygonRef

Creates a polygon from an array of point references.

**Parameters:**
- `points` - Array of point references (order matters for rendering)
- `name` - Optional name for the polygon

**Returns:** A PolygonRef referencing the created polygon

### Derived Geometry Operations

#### pointAt(line: LineRef, ratio: number, name?: string): PointRef

Creates a point at a specific ratio along a line.

**Parameters:**
- `line` - The line reference
- `ratio` - Ratio from start to end (0 = start, 1 = end, 0.5 = middle)
- `name` - Optional name for the point

**Returns:** A PointRef referencing the created point

#### pointOnLineAtDistance(line: LineRef, distance: number, from: PointRef, name?: string): PointRef

Creates a point at a specific distance from a starting point along a line.

**Parameters:**
- `line` - The line reference
- `distance` - Distance from the starting point
- `from` - The starting point reference (used for dependency tracking)
- `name` - Optional name for the point

**Returns:** A PointRef referencing the created point

#### midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef

Creates the midpoint between two points.

**Parameters:**
- `p1` - First point reference
- `p2` - Second point reference
- `name` - Optional name for the midpoint

**Returns:** A PointRef referencing the midpoint

#### extendLine(line: LineRef, length: number, name?: string): LineRef

Extends a line by a specific length from its end point.

**Parameters:**
- `line` - The line reference
- `length` - Length to extend from the end point
- `name` - Optional name for the extended line

**Returns:** A LineRef referencing the extended line

#### lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef

Creates a line from a starting point towards another point with a specific length.

**Parameters:**
- `from` - Starting point reference
- `towards` - Point reference indicating direction
- `length` - Length of the line
- `name` - Optional name for the line

**Returns:** A LineRef referencing the created line

#### perpendicular(line: LineRef, at: PointRef, name?: string): LineRef

Creates a line perpendicular to another line at a specific point.

**Parameters:**
- `line` - The line reference
- `at` - The point reference where the perpendicular should be created
- `name` - Optional name for the perpendicular line

**Returns:** A LineRef referencing the perpendicular line

### Intersection Operations

#### intersection(a: CircleRef | LineRef, b: CircleRef | LineRef, directionOrOptions?: IntersectionOptions, name?: string): PointRef

Finds intersection point between two geometries.

**Parameters:**
- `a` - First geometry (CircleRef or LineRef)
- `b` - Second geometry (CircleRef or LineRef)
- `directionOrOptions` - Optional: Direction or exclude option for selecting intersection
- `name` - Optional name for the intersection point

**Returns:** A PointRef referencing the intersection point

**Throws:** NoIntersectionError if geometries don't intersect

**Supported combinations:**
- Circle-Circle: Use direction ("north"/"south") to select which intersection
- Circle-Line: Use direction ("left"/"right") or {exclude} to select which intersection
- Line-Circle: Same as Circle-Line (order doesn't matter)
- Line-Line: Returns the single intersection point (directionOrOptions is optional)

### Step Management

#### currentStepIndex: number

Get the current step index (0-based, read-only).

#### goTo(index: number): void

Navigate to a specific step index.

**Parameters:**
- `index` - The step index to navigate to (0-based)

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

**Parameters:**
- `ref` - The geometry reference

**Returns:** The geometry value

**Throws:** GeometryNotFoundError if the geometry doesn't exist

#### getValues(): Map<string, GeometryValue>

Get all geometry values.

**Returns:** A Map of all geometry IDs to their values

#### getCurrentValues(): Map<string, GeometryValue>

Get geometry values up to the current step.

**Returns:** A Map of geometry IDs to their values for steps up to currentStepIndex

### Error Handling

#### validate(): boolean

Validate all steps in the construction. Attempts to compute all values and collects any errors.

**Returns:** true if all steps are valid, false otherwise

#### getErrors(): ConstructionError[]

Get all errors collected during validation.

**Returns:** Array of ConstructionError objects

#### clearErrors(): void

Clear all collected errors.

#### validateFull(): ValidationResult

Perform full validation of the construction. Checks for missing dependencies, zero-length lines, and zero-radius circles.

**Returns:** ValidationResult with errors and warnings

### History (Undo/Redo)

#### undo(): void

Undo the last operation.

#### redo(): void

Redo the last undone operation.

#### clearHistory(): void

Clear all history.

#### getHistoryState(): { canUndo: boolean; canRedo: boolean }

Get the current undo/redo state.

**Returns:** Object with canUndo and canRedo boolean properties

### Parameters

#### setParameter(name: string, value: number): void

Set a parameter value.

**Parameters:**
- `name` - Parameter name
- `value` - Parameter value

#### getParameter(name: string): number | undefined

Get a parameter value.

**Parameters:**
- `name` - Parameter name

**Returns:** The parameter value or undefined if not set

#### getParameters(): Map<string, number>

Get all parameters.

**Returns:** A Map of all parameter names to their values

#### clearParameters(): void

Clear all parameters.

### Serialization

#### toJSON(): string

Export construction as JSON string.

**Returns:** JSON string representation of the construction

#### static fromJSON(json: string): Construction

Load construction from JSON string.

**Parameters:**
- `json` - JSON string representation of a construction

**Returns:** A new Construction instance loaded from the JSON

---

## SvgRenderer Class

Rendering layer for geometry constructions. Consumes GeometryValue types and renders them to SVG.

### Constructor

```typescript
new SvgRenderer(svg: SVGSVGElement, store?: GeometryStore)
```

Creates a new SvgRenderer.

**Parameters:**
- `svg` - The SVG element to render into
- `store` - Optional GeometryStore for managing elements and tooltips

### Drawing Methods

#### drawPoint(point: Point, options?: DrawPointOptions): SVGElement

Draw a point as a small circle.

**Parameters:**
- `point` - The Point geometry to draw
- `options` - Optional drawing options

**Returns:** The created SVG circle element

#### drawLine(line: Line, options?: DrawLineOptions): SVGElement

Draw a line segment.

**Parameters:**
- `line` - The Line geometry to draw
- `options` - Optional drawing options

**Returns:** The created SVG line element

#### drawCircle(circle: Circle, options?: DrawCircleOptions): SVGElement

Draw a circle outline.

**Parameters:**
- `circle` - The Circle geometry to draw
- `options` - Optional drawing options

**Returns:** The created SVG circle element

#### drawPolygon(polygon: Polygon, options?: DrawPolygonOptions): SVGElement

Draw a polygon.

**Parameters:**
- `polygon` - The Polygon geometry to draw
- `options` - Optional drawing options

**Returns:** The created SVG polygon element

### Construction Drawing Methods

#### drawConstruction(construction: { getValues: () => Map<string, GeometryValue> }): void

Draw all geometries from a Construction.

**Parameters:**
- `construction` - The Construction to render (must have getValues() method)

#### drawConstructionUpTo(construction: { getSteps: () => Array<{ id: string }>; getValues: () => Map<string, GeometryValue> }, stepIndex: number): void

Draw geometries from a Construction up to a specific step index.

**Parameters:**
- `construction` - The Construction to render (must have getSteps() and getValues() methods)
- `stepIndex` - The step index to render up to (0-based)

#### clear(): void

Clear all elements from the SVG.

---

## Utility Functions

### constructionToSteps(construction: Construction): Step[]

Convert a Construction to an array of Step objects for compatibility with existing infrastructure.

**Parameters:**
- `construction` - The Construction to convert

**Returns:** Array of Step objects compatible with existing step system

**Note:** This adapter bridges the new Construction DSL to the existing Step[] format. Drawing is handled by SvgRenderer, not by the Step.draw() method.

---

## Error Classes

### ConstructionError

Base error class for Construction operations. Contains contextual information about where the error occurred.

**Properties:**
- `stepIndex` - The step index where the error occurred
- `stepId` - The step ID where the error occurred
- `message` - The error message
- `cause` - The underlying error, if any

### NoIntersectionError extends ConstructionError

Thrown when two geometries do not intersect.

**Properties:**
- Inherits all properties from ConstructionError
- Includes information about which geometries failed to intersect

### GeometryNotFoundError extends ConstructionError

Thrown when a geometry reference is not found.

**Properties:**
- Inherits all properties from ConstructionError
- Includes the geometry ID that was not found

### TypeMismatchError extends ConstructionError

Thrown when a geometry type mismatch occurs.

**Properties:**
- Inherits all properties from ConstructionError
- Includes expected and actual type information

---

## Drawing Options

### DrawPointOptions

```typescript
interface DrawPointOptions {
  stroke?: number; // Radius of the point (default: 2)
  name?: string; // Name for data-name attribute
}
```

### DrawLineOptions

```typescript
interface DrawLineOptions {
  stroke?: number; // Stroke width (default: 0.5)
  name?: string; // Name for data-name attribute
}
```

### DrawCircleOptions

```typescript
interface DrawCircleOptions {
  stroke?: number; // Stroke width (default: 0.5)
  name?: string; // Name for data-name attribute
}
```

### DrawPolygonOptions

```typescript
interface DrawPolygonOptions {
  stroke?: number; // Stroke width (default: 0.5)
  fill?: string; // Fill color (default: "none")
  name?: string; // Name for data-name attribute
}
```
