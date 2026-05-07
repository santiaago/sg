# Spec: Declarative Geometry Framework

## Objective

Create a higher-level declarative geometry framework that provides a fluid, chainable API for geometric constructions while maintaining the existing step-based architecture underneath. This framework will be used for future components only (no backward compatibility required).

**User**: React component developers building geometric visualizations
**Success**: Developers can write concise, readable geometry code like:

```typescript
cs = b.coordinateSystem(...)
p1 = b.point(...)
p2 = b.point(...)
ml = b.line(p1, p2)
c1 = b.pointAt(ml, C1_POSITION_RATIO)
c1_c = b.circle(c1, config.circleRadius)
c2 = b.intersection(c1_c, ml, { position: "left" })
```

while still benefiting from lazy evaluation, dependency tracking, and separation of compute/draw concerns.

## Tech Stack

- TypeScript (ESM)
- Existing step system: `app2/src/geometry/stepExecution.ts`, `app2/src/types/geometry.ts`
- Existing geometry types: `Point`, `Line`, `Circle`, `Polygon`, `CoordinateSystem`
- Existing utilities: `@sg/geometry` package

## Commands

```bash
# Type check
pnpm type-check:app2

# Lint
pnpm lint

# Format check
pnpm format

# Tests
pnpm test
```

## Project Structure

```
app2/src/geometry/
├── dsl/                            # NEW: Declarative DSL (Domain Specific Language)
│   ├── index.ts                   # Public API exports
│   ├── GeometryBuilder.ts         # GeometryBuilder class (expression factory)
│   ├── expressions/               # Expression types
│   │   ├── GeometryExpression.ts  # Base expression interface and types
│   │   ├── PointExpression.ts     # Point expression
│   │   ├── LineExpression.ts      # Line expression
│   │   ├── CircleExpression.ts    # Circle expression
│   │   ├── PolygonExpression.ts   # Polygon expression
│   │   ├── CoordinateSystemExpression.ts # Coordinate system expression
│   │   └── operations/            # Operation expressions
│   │       ├── PointAtExpression.ts
│   │       ├── IntersectionExpression.ts
│   │       ├── CircleIntersectionExpression.ts
│   │       └── LineExtensionExpression.ts
│   ├── renderers/                 # Renderer implementations (dependency injected)
│   │   ├── DefaultRenderer.ts      # Default SVG renderer
│   │   └── types.ts               # Renderer interface
│   └── stepCompiler.ts            # Compiles expressions to Step[]
├── types/geometry.ts              # Existing: Core geometry types (unchanged)
├── stepExecution.ts               # Existing: Step execution engine (unchanged)
├── stepBuilders.ts                # Existing: Step builder utilities (unchanged)
└── constructors.ts                # Existing: Geometry constructors (unchanged)
```

## Code Style

### Naming Conventions

- Directory: `dsl` (Domain Specific Language)
- Geometry expressions: `PascalCase` (e.g., `PointAtExpression`, `IntersectionExpression`)
- Geometry IDs: `UPPER_SNAKE_CASE` (e.g., `ML`, `C1`, `C1_C`)
- Builder methods: `noun` pattern (e.g., `point`, `line`, `circle`, `pointAt`, `intersection`)
- Compiled step IDs: `step_[id]` (e.g., `step_C1`, `step_C1_C`)

### Example Usage

```typescript
// Create builder
const b = new GeometryBuilder<SquareConfig>();

// Define geometry - each method returns an expression
cs = b.coordinateSystem("CS", 0, 0, config.height * COORDINATE_SYSTEM_ARROW_LENGTH_RATIO);
p1 = b.point("P1", config.p1x, config.p1y);
p2 = b.point("P2", config.p2x, config.p2y);
ml = b.line("ML", p1, p2);

c1 = b.pointAt("C1", ml, C1_POSITION_RATIO);
c1_c = b.circle("C1_C", c1, config.circleRadius);
c2 = b.intersection("C2", c1_c, ml, { position: "left" });

pi = b.circleIntersection("PI", c1_c, c2_c, { select: "north" });
ci = b.circle("CI", pi, config.circleRadius);

// Extended lines (separate method for line extension)
line_c2_pi = b.lineTowards("LINE_C2_PI", c2, pi, LINE_EXTENSION_MULTIPLIER * config.circleRadius);
line_c1_pi = b.lineTowards("LINE_C1_PI", c1, pi, LINE_EXTENSION_MULTIPLIER * config.circleRadius);

p3 = b.intersection("P3", ci, line_c2_pi, { exclude: c2 });
p4 = b.intersection("P4", ci, line_c1_pi, { exclude: c1 });

line_c2_p4 = b.line("LINE_C2_P4", c2, p4);
line_c1_p3 = b.line("LINE_C1_P3", c1, p3);

pl = b.intersection("PL", c2_c, line_c2_p4);
pr = b.intersection("PR", c1_c, line_c1_p3);

square = b.polygon("SQUARE", [pl, pr, c1, c2]);

// Compile to steps - just returns Step[], execution handled elsewhere
const steps = b.compile();

// Steps can be executed by existing execution engine
executeSteps(steps, currentStep, ctx, config);
```

Alternative with direct coordinates:

```typescript
const b = new GeometryBuilder<SquareConfig>();

p1 = b.point("P1", config.p1x, config.p1y);
p2 = b.point("P2", config.p2x, config.p2y);
ml = b.line("ML", p1, p2);

// Or with explicit coordinates
ml2 = b.line("ML2", config.lx1, config.ly1, config.lx2, config.ly2);
```

## Testing Strategy

**Framework**: Vitest (same as existing geometry tests)
**Location**: `app2/src/geometry/dsl/__tests__/`

| Test Level  | Concern                           | Coverage                                                           |
| ----------- | --------------------------------- | ------------------------------------------------------------------ |
| Unit        | Individual expression compilation | 100% of expression types                                           |
| Unit        | Step generation correctness       | All generated steps match manual definitions                       |
| Unit        | Dependency graph accuracy         | All dependencies correctly tracked                                 |
| Integration | End-to-end construction           | Square construction produces identical results to `squareSteps.ts` |
| Integration | Lazy evaluation                   | Steps compute only when needed                                     |

**Success Criteria**:

- All existing geometry tests pass
- New framework produces identical geometry to `squareSteps.ts` (within floating point tolerance)
- Dependency graph matches expected structure
- No memory leaks from cached computations

## Boundaries

### Always Do

- Maintain explicit `inputs`, `outputs`, `parameters` in every generated step
- Keep `compute()` and `draw()` separation in all generated steps
- Preserve lazy evaluation semantics
- Use existing geometry types from `app2/src/types/geometry.ts`
- Write tests for all expression types before implementation
- Use `GeometryError` for all error handling

### Ask First

- Adding new geometry types beyond Point/Line/Circle/Polygon/CoordinateSystem
- Changing the existing Step interface
- Modifying the existing step execution engine
- Adding external dependencies

### Never Do

- Modify existing step files (`squareSteps.ts`, `rotatedSquareSteps.ts`, etc.)
- Break existing type-check, lint, or test commands
- Commit without running `pnpm type-check:app2`
- Use `any` type or `@ts-nocheck`

## Architecture Design

### Core Concepts

```
┌─────────────────────────────────────────────────────────────┐
│                      DSL Framework                              │
├─────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Builder    │    │  Expressions │    │   Step[]        │  │
│  │  (Factory)  │───▶│  (Tracked)   │───▶│   (Generated)    │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│          ▲                                                │      │
│          │                                ┌───────────────────┼──┐  │
│          └────────────────────────────────┤     Renderer    │  │
│                                           │  (Injected)     │  │
│                                           └───────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Existing Step System                         │
│                    Step Execution Engine                          │
└─────────────────────────────────────────────────────────────┘
```

### Expression Types

Each expression:

1. Has a unique ID
2. Knows its geometry type
3. Tracks its dependencies (other expression IDs)
4. Knows how to compile itself into a `Step`
5. Can be referenced by other expressions

```typescript
// Expression base interface - NO any types
interface GeometryExpression<TConfig, TType extends GeometryValue["type"]> {
  readonly id: string;
  readonly type: TType;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];
  compile(renderer: GeometryRenderer): Step<TConfig>;
}

// Primitive expressions
class PointExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.dependencies = [];
    this.parameters = [];
    // Store coordinates
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: () => new Map([[this.id, point(this.x, this.y)]]),
      draw: (svg, values, store, theme) => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}

class LineExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  // Can be constructed from coordinates or from point expressions
  constructor(id: string, args: LineArgs);

  compile(renderer: GeometryRenderer): Step<TConfig> {
    /* ... */
  }
}

// Line argument types
type LineArgs =
  | { x1: number; y1: number; x2: number; y2: number }
  | { start: PointExpression<TConfig>; end: PointExpression<TConfig> };

class CircleExpression<TConfig> implements GeometryExpression<TConfig, "circle"> {
  readonly id: string;
  readonly type = "circle" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  constructor(id: string, center: PointExpression<TConfig>, radius: number) {
    this.id = id;
    this.dependencies = [center.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    /* ... */
  }
}

// Operation expressions
class PointAtExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  constructor(id: string, line: LineExpression<TConfig>, ratio: number) {
    this.id = id;
    this.dependencies = [line.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs, config) => {
        const lineVal = getGeometry(inputs, this.line.id, isLine, "Line", `step_${this.id}`);
        const x = lineVal.x1 + (lineVal.x2 - lineVal.x1) * this.ratio;
        const y = lineVal.y1 + (lineVal.y2 - lineVal.y1) * this.ratio;
        return new Map([[this.id, point(x, y)]]);
      },
      draw: (svg, values, store, theme) => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}

class IntersectionExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  constructor(
    id: string,
    circle: CircleExpression<TConfig>,
    line: LineExpression<TConfig>,
    options: IntersectionOptions,
  ) {
    this.id = id;
    this.dependencies = [circle.id, line.id];
    this.parameters = [];
    this.options = options;
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs, config) => {
        const circleVal = getGeometry(
          inputs,
          this.circle.id,
          isCircle,
          "Circle",
          `step_${this.id}`,
        );
        const lineVal = getGeometry(inputs, this.line.id, isLine, "Line", `step_${this.id}`);

        const result = pointFromCircleAndLine(circleVal, lineVal, {
          exclude: this.options.exclude,
          tolerance: this.options.tolerance ?? config.tolerance,
        });

        if (!result) {
          throw new GeometryError(`step_${this.id}`, this.id, "No intersection found");
        }

        return new Map([[this.id, result]]);
      },
      draw: (svg, values, store, theme) => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}

// Line extension expression (separate method as requested)
class LineExtensionExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];

  constructor(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
    length: number,
  ) {
    this.id = id;
    this.dependencies = [start.id, end.id];
    this.parameters = [];
    this.startId = start.id;
    this.endId = end.id;
    this.length = length;
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs, config) => {
        const startVal = getGeometry(inputs, this.startId, isPoint, "Point", `step_${this.id}`);
        const endVal = getGeometry(inputs, this.endId, isPoint, "Point", `step_${this.id}`);
        return new Map([[this.id, lineTowards(startVal, endVal, this.length)]]);
      },
      draw: (svg, values, store, theme) => {
        renderer.drawLine(svg, values, this.id, store, theme);
      },
    };
  }
}
```

### Renderer Interface (Dependency Injection)

```typescript
// Renderer interface - separates draw logic from expressions
interface GeometryRenderer {
  drawPoint: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawLine: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawCircle: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawPolygon: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawCoordinateSystem: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;
}

// Default renderer using existing draw functions
class DefaultGeometryRenderer implements GeometryRenderer {
  drawPoint(svg, values, geomId, store, theme) {
    const p = values.get(geomId);
    if (!p || !isPoint(p)) return;
    drawPoint(svg, values, geomId, POINT_RADIUS_MEDIUM, store, theme);
  }

  drawLine(svg, values, geomId, store, theme) {
    const l = values.get(geomId);
    if (!l || !isLine(l)) return;
    drawLine(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
  }

  drawCircle(svg, values, geomId, store, theme) {
    const c = values.get(geomId);
    if (!c || !isCircle(c)) return;
    drawCircle(svg, values, geomId, STROKE_WIDTH_THIN, store, theme);
  }

  drawPolygon(svg, values, geomId, store, theme) {
    const p = values.get(geomId);
    if (!p || !isPolygon(p)) return;
    drawPolygon(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
  }

  drawCoordinateSystem(svg, values, geomId, store, theme) {
    const cs = values.get(geomId);
    if (!cs || !isCoordinateSystem(cs)) return;
    drawCoordinateSystem(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
  }
}
```

### GeometryBuilder API

The `GeometryBuilder` is a factory for creating expressions and compiling them to steps:

```typescript
class GeometryBuilder<TConfig> {
  private expressions: Map<string, GeometryExpression<TConfig, any>>;
  private renderer: GeometryRenderer;

  constructor(renderer?: GeometryRenderer) {
    this.expressions = new Map();
    this.renderer = renderer ?? new DefaultGeometryRenderer();
  }

  // Set custom renderer (dependency injection)
  setRenderer(renderer: GeometryRenderer): this {
    this.renderer = renderer;
    return this;
  }

  // Primitive geometry - noun-based method names, return expression
  point(id: string, x: number, y: number): PointExpression<TConfig>;

  line(id: string, x1: number, y1: number, x2: number, y2: number): LineExpression<TConfig>;
  line(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
  ): LineExpression<TConfig>;

  circle(id: string, center: PointExpression<TConfig>, radius: number): CircleExpression<TConfig>;

  // Coordinate system
  coordinateSystem(
    id: string,
    x: number,
    y: number,
    arrowLength: number,
    rotation?: number,
  ): CoordinateSystemExpression<TConfig>;

  // Derived geometry (operations) - return expression
  pointAt(id: string, line: LineExpression<TConfig>, ratio: number): PointExpression<TConfig>;

  intersection(
    id: string,
    circle: CircleExpression<TConfig>,
    line: LineExpression<TConfig>,
    options?: IntersectionOptions,
  ): PointExpression<TConfig>;

  circleIntersection(
    id: string,
    c1: CircleExpression<TConfig>,
    c2: CircleExpression<TConfig>,
    options?: CircleIntersectionOptions,
  ): PointExpression<TConfig>;

  // Line extension (separate method as requested)
  lineTowards(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
    length: number,
  ): LineExpression<TConfig>;

  // Polygon with array of points
  polygon(id: string, points: PointExpression<TConfig>[]): PolygonExpression<TConfig>;

  // Compilation - returns Step[], does NOT execute
  compile(): Step<TConfig>[];

  // Dependency analysis
  getDependencies(id: string): string[];
  getDependencyGraph(): DependencyGraph;
  getStepMetadata(id: string): {
    inputs: string[];
    outputs: string[];
    parameters: (keyof TConfig)[];
  };
}
```

### Complete Example: Square Construction

```typescript
// Create builder with optional custom renderer
const b = new GeometryBuilder<SquareConfig>();

// Base coordinate system
cs = b.coordinateSystem("CS", 0, 0, config.height * COORDINATE_SYSTEM_ARROW_LENGTH_RATIO);

// Main line endpoints
p1 = b.point("P1", config.p1x, config.p1y);
p2 = b.point("P2", config.p2x, config.p2y);

// Main line from points
ml = b.line("ML", p1, p2);

// Circle centers on main line
c1 = b.pointAt("C1", ml, C1_POSITION_RATIO);
c2 = b.pointAt("C2", ml, C2_POSITION_RATIO);

// Circles
c1_c = b.circle("C1_C", c1, config.circleRadius);
c2_c = b.circle("C2_C", c2, config.circleRadius);

// Intersection point
pi = b.circleIntersection("PI", c1_c, c2_c, { select: "north" });
ci = b.circle("CI", pi, config.circleRadius);

// Extended lines (using lineTowards for extension)
line_c2_pi = b.lineTowards("LINE_C2_PI", c2, pi, LINE_EXTENSION_MULTIPLIER * config.circleRadius);
line_c1_pi = b.lineTowards("LINE_C1_PI", c1, pi, LINE_EXTENSION_MULTIPLIER * config.circleRadius);

// Points P3 and P4
p3 = b.intersection("P3", ci, line_c2_pi, { exclude: c2 });
p4 = b.intersection("P4", ci, line_c1_pi, { exclude: c1 });

// Connecting lines
line_c2_p4 = b.line("LINE_C2_P4", c2, p4);
line_c1_p3 = b.line("LINE_C1_P3", c1, p3);

// Tangent points
pl = b.intersection("PL", c2_c, line_c2_p4);
pr = b.intersection("PR", c1_c, line_c1_p3);

// Final square with array of points
square = b.polygon("SQUARE", [pl, pr, c1, c2]);

// Compile to steps - just returns Step[], no execution
const steps = b.compile();

// Steps are now ready for execution by existing engine
executeSteps(steps, currentStep, ctx, config);
```

## Types

### Core Types

```typescript
// Expression types - no any
interface GeometryExpression<TConfig, TType extends GeometryValue["type"]> {
  readonly id: string;
  readonly type: TType;
  readonly dependencies: readonly string[];
  readonly parameters: readonly (keyof TConfig)[];
  compile(renderer: GeometryRenderer): Step<TConfig>;
}

// Expression reference types for type safety
type PointRef<TConfig> = PointExpression<TConfig>;
type LineRef<TConfig> = LineExpression<TConfig>;
type CircleRef<TConfig> = CircleExpression<TConfig>;

// Configuration for expression options
export interface IntersectionOptions {
  exclude?: PointExpression<TConfig>;
  position?: "left" | "right" | "north" | "south";
  tolerance?: number;
}

export interface CircleIntersectionOptions {
  select?: "north" | "south";
}
```

### Builder Method Signatures

```typescript
class GeometryBuilder<TConfig> {
  // Points
  point(id: string, x: number, y: number): PointExpression<TConfig>;

  // Lines - multiple signatures
  line(id: string, x1: number, y1: number, x2: number, y2: number): LineExpression<TConfig>;
  line(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
  ): LineExpression<TConfig>;

  // Circles
  circle(id: string, center: PointExpression<TConfig>, radius: number): CircleExpression<TConfig>;

  // Coordinate system
  coordinateSystem(
    id: string,
    x: number,
    y: number,
    arrowLength: number,
    rotation?: number,
  ): CoordinateSystemExpression<TConfig>;

  // Operations
  pointAt(id: string, line: LineExpression<TConfig>, ratio: number): PointExpression<TConfig>;

  intersection(
    id: string,
    circle: CircleExpression<TConfig>,
    line: LineExpression<TConfig>,
    options?: IntersectionOptions,
  ): PointExpression<TConfig>;

  circleIntersection(
    id: string,
    c1: CircleExpression<TConfig>,
    c2: CircleExpression<TConfig>,
    options?: CircleIntersectionOptions,
  ): PointExpression<TConfig>;

  // Line extension (separate method)
  lineTowards(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
    length: number,
  ): LineExpression<TConfig>;

  // Polygons with array of points
  polygon(id: string, points: PointExpression<TConfig>[]): PolygonExpression<TConfig>;

  // Compilation
  compile(): Step<TConfig>[];
}
```

## Success Criteria

1. **API Fluency**: The preferred example style works:

   ```typescript
   cs = b.coordinateSystem(...)
   p1 = b.point(...)
   p2 = b.point(...)
   ml = b.line(p1, p2)
   c1 = b.pointAt(ml, C1_POSITION_RATIO)
   c1_c = b.circle(c1, config.circleRadius)
   c2 = b.intersection(c1_c, ml, { position: "left" })
   ```

2. **Step Generation**: Compiled steps have correct `inputs`, `outputs`, `parameters`, `compute()`, `draw()`

3. **Equivalence**: Replicating `squareSteps.ts` with the new API produces identical geometry (within floating point tolerance)

4. **Lazy Evaluation**: Generated steps compute only when `executeStep()` is called

5. **Type Safety**: Full TypeScript type inference - NO `any` types

6. **Separation of Concerns**: All `compute()` functions contain only math, all `draw()` functions use injected renderer

7. **Dependency Tracking**: Automatic dependency graph is 100% accurate, inputs/outputs/parameters gettable from graph

8. **Error Handling**: All errors use `GeometryError` with step ID and geometry ID

9. **Polygon with Array**: `polygon(id, [p1, p2, p3, p4])` supported

10. **Line Extension Separate**: `lineTowards()` as separate method for extended lines

## Implementation Priority

1. **Phase 1**: Core expression base interface and types (NO any)
2. **Phase 2**: GeometryBuilder factory with noun-based method names
3. **Phase 3**: Primitive expressions (Point, Line, Circle, CoordinateSystem)
4. **Phase 4**: Renderer interface and DefaultGeometryRenderer
5. **Phase 5**: Operation expressions (pointAt, intersection, circleIntersection, lineTowards)
6. **Phase 6**: Polygon expression
7. **Phase 7**: Compilation and topological sorting
8. **Phase 8**: Equivalence testing with squareSteps.ts
