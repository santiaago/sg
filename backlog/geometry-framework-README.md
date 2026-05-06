# Geometry Framework

A higher-level declarative language for geometric constructions that provides a fluid, chainable API while preserving the existing step-based architecture.

## Features

- **Declarative API**: Write geometry code in a clean, readable syntax
- **Type-Safe**: Full TypeScript support with typed references
- **Single API Surface**: All operations are methods on the Construction class
- **Separation of Concerns**: Geometry logic and rendering are completely separate
- **Step-by-Step**: Built-in support for step-by-step construction and navigation
- **Extensible**: Easy to add new geometry types and operations
- **Undo/Redo**: Full history support for undo and redo operations
- **Serialization**: Save and load constructions as JSON
- **Validation**: Comprehensive validation with error reporting

## Architecture

The framework consists of several layers:

1. **Type System**: Canonical GeometryValue types (Point, Line, Circle, Polygon)
2. **Reference Types**: Typed identifiers for geometry objects (PointRef, LineRef, CircleRef, PolygonRef)
3. **Construction Class**: Core DSL for creating geometry
4. **Step Adapter**: Bridges Construction to existing Step system via `constructionToSteps()`
5. **SvgRenderer**: Renders GeometryValue types to SVG
6. **Components**: React components that use the framework (e.g., SquaresV2)

See `backlog/PLAN geometry-framework.md` for detailed architecture.

## Installation

The framework is part of the sg monorepo. No additional installation is required.

## Quick Start

```typescript
import { Construction } from "./geometry/construction";
import { SvgRenderer } from "./geometry/renderers/svgRenderer";

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

- [API Documentation](geometry-framework-API.md) - Complete API reference
- [Examples](geometry-framework-EXAMPLES.md) - Practical usage examples
- [Architecture Plan](PLAN geometry-framework.md) - Detailed architecture overview

## Implementation Phases

The framework is implemented in 6 phases:

1. **Phase 1**: Core Construction DSL
   - Reference types (PointRef, LineRef, CircleRef, PolygonRef)
   - Base geometry creators (point, line, circle, polygon)
   - Derived geometry operations (midpoint, extendLine, etc.)
   - Intersection operations with direction/exclude options

2. **Phase 2**: Integration Layer
   - Step management (goTo, next, prev, reset)
   - Value access (get, getValues, getCurrentValues)
   - Error handling (validate, getErrors, clearErrors)

3. **Phase 3**: Rendering Layer
   - SvgRenderer class
   - Individual geometry drawing methods
   - Construction drawing methods

4. **Phase 4**: Proof of Concept (SquaresV2)
   - Full square construction using compass and straightedge
   - React component integration
   - Step-by-step rendering

5. **Phase 5**: Advanced Features
   - Undo/Redo support
   - Parameter storage
   - Serialization (toJSON/fromJSON)
   - Full validation (validateFull)

6. **Phase 6**: Documentation & Cleanup
   - Comprehensive JSDoc comments
   - API documentation
   - Examples documentation
   - README

See the individual phase documents for details:

- [Phase 1](geometry-framework-PHASE1.md)
- [Phase 2](geometry-framework-PHASE2.md)
- [Phase 3](geometry-framework-PHASE3.md)
- [Phase 4](geometry-framework-PHASE4.md)
- [Phase 5](geometry-framework-PHASE5.md)
- [Phase 6](geometry-framework-PHASE6.md)

## Project Structure

```
app2/
├── src/
│   ├── geometry/
│   │   ├── construction.ts            # Core Construction DSL
│   │   ├── construction-to-steps.ts  # Step adapter
│   │   ├── constructors.ts             # Legacy constructor helpers
│   │   ├── operations.ts               # Geometry operations helpers
│   │   ├── renderers/
│   │   │   └── svgRenderer.ts          # SVG rendering layer
│   │   ├── sixFold/
│   │   │   └── operations.ts           # Six-fold symmetry operations
│   │   ├── test-constructions/
│   │   │   ├── hexagon.ts              # Hexagon construction example
│   │   │   ├── triangle.ts             # Triangle construction example
│   │   │   └── index.ts
│   │   ├── index.ts
│   │   ├── squareSteps.ts
│   │   └── sixFoldV0Steps.ts
│   ├── components/
│   │   └── SquaresV2.tsx               # Proof-of-concept component
│   ├── types/
│   │   └── geometry.ts                 # GeometryValue types
│   └── react-store.ts                  # GeometryStore for tooltips
└── tests/
    └── geometry/                       # Test files
```

## Key Design Decisions

### Eager vs Lazy Evaluation

The Construction class uses **eager evaluation** - values are computed immediately when methods are called, not lazily when accessed. This simplifies the implementation and matches the mental model of a "builder" pattern.

### Separation of Concerns

- **Construction**: Pure geometry logic, no SVG/rendering knowledge
- **SvgRenderer**: Pure rendering logic, no geometry construction knowledge
- **GeometryStore**: Manages SVG elements and tooltips, independent of both

### Reference Types

All geometry objects are referenced by pure identifiers (Ref types) that contain only an `id` string. The actual geometry data is stored in the Construction instance. This allows:
- Lightweight references that can be passed around
- Centralized data management
- Easy serialization

### Coordinate System

All coordinates use the **SVG coordinate system** where:
- (0, 0) is the top-left corner
- x increases to the right
- y increases downward

This affects direction semantics:
- "north" = smaller y value
- "south" = larger y value
- "left" = smaller x value
- "right" = larger x value

## Contributing

1. Follow the project coding conventions (see AGENTS.md)
2. Add tests for all new functionality
3. Update documentation as needed
4. Run verification checks before committing:
   - `pnpm check` - Lint and format checks
   - `pnpm type-check` - TypeScript checks
   - `pnpm test` - Run all tests
   - `pnpm build` - Build the project

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
