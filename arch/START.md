# App2 Architecture Overview

This directory documents the main concepts and systems of app2. Each concept has its own markdown file for detailed reference.

## Core Concepts

### React Store / State Management

Central state management for SVG geometry elements. `useGeometryStore()` hook provides a store interface for adding, updating, and clearing geometry items. Each item contains: SVG element, metadata, type, dependencies, initial state, step ID, and parameter values. Separate `useGeometryValueStore()` tracks geometry values and dependency graph for advanced use cases.

### Geometry Types

Core geometry value types defined in `types/geometry.ts`: Point (x, y), Line (x1, y1, x2, y2), Circle (cx, cy, r), Polygon (points array), CoordinateSystem (x, y, arrowLength, rotation). Type guards and factory functions provided for each type.

### Step System

Declarative step-based geometry construction. Each `Step` has: unique ID, input geometry IDs, output geometry IDs, optional visual flag, parameter names, compute function (input values + config → output values), and draw function (renders to SVG). Enables lazy calculation, automatic dependency tracking, separation of computation and rendering.

### DSL (Domain-Specific Language)

Declarative geometry construction using a parameterized DSL. Located in `src/geometry/dsl/`. Includes: type definitions, geometry feature references (reference numeric properties of other geometries), parameter values (literals, config references, or geometry feature references). Supports building complex constructions from reusable expressions.

### Components

React components in `src/components/`: `GeometryPlayer` (step navigation controls), `GeometryList` (filterable list of geometries), `GeometryDetails` (step details display), `Navigation` (section navigation), `SixFoldV0Svg`, `SquareSvg`, `SquareDslSvg`, `SixFoldDslSvg`, `SixFoldDslV1Svg`, `RotatedSquareSvg` (SVG rendering components), `CopySvgButton`, `CopyUrlButton` (utility components).

### Hooks

Custom React hooks: `useSmartStepper` (navigates DSL steps, skips non-visual steps, maintains visual-to-actual index mapping), `useThemeAwareSteps` (provides theme-aware step execution).

### Theming

Theme system in `themes.ts` with `lightTheme` and `darkTheme`. Each theme defines colors: COLOR_PRIMARY, COLOR_SECONDARY, COLOR_OUTLINE, COLOR_TEXT, COLOR_BACKGROUND, COLOR_CANVAS, COLOR_DOT, tooltip colors, highlight colors. Theme can be toggled globally via Navigation component.

### Coordinate Systems

Support for rotated coordinate systems. CoordinateSystem type includes optional rotation property (radians). Used in `RotatedSquareSvg` component to test CS transformations. Coordinate systems are first-class geometry types that can be dependencies for other constructions.

### Constructors

High-level geometry constructor functions in `constructors.ts`. Pure functions that take inputs and return geometry values. Encapsulate common patterns: `circleFromPoint`, `pointFromCircles` (finds circle-circle intersection with cardinal direction selection), `pointFromCircleAndLine` (finds circle-line intersection with exclusion option), and more. Uses utilities from `@sg/geometry` package.

### Configuration

Two configuration systems: `svgConfig` (SVG rendering settings like containerClass, width, height, viewBox) in `config/svgConfig.ts`, and `geometryConfig` (construction parameters) in `config/geometryConfig.ts`. Both are TypeScript objects passed to components and steps.

### Step Execution

Execution utilities in `stepExecution.ts`: `executeStep` (runs single step: collects inputs, computes outputs, draws results), `executeSteps` (runs all steps up to given index). Handles error cases like missing input geometries. Stepper utilities in `geometry/utils/stepperUtils.ts` for visual vs actual step index mapping.

### DSL Expressions

Parameterized expressions in `src/geometry/dsl/expressions/`: GeometryExpression base type, PointInCoordinateSystemExpression, LineExpression, CircleWithDistanceRadiusExpression, MultiplyExpression, and other operation expressions. These enable building geometry values from declarative specifications with automatic dependency tracking.

## Usage Pattern

For new work on a specific system:

1. Find or create corresponding MD file in `arch/` directory
2. Document key interfaces, types, and relationships
3. Reference this file when working on that part of the system
4. Update the MD file as the system evolves

## File Organization

- `arch/START.md` - This overview document
- `arch/react-store.md` - React store and state management
- `arch/geometry-types.md` - Geometry value types
- `arch/step-system.md` - Step definition and execution
- `arch/dsl.md` - Domain-specific language
- `arch/components.md` - React components
- `arch/hooks.md` - Custom React hooks
- `arch/theming.md` - Theme system
- `arch/coordinate-systems.md` - Coordinate system handling
- `arch/constructors.md` - Geometry constructors
- `arch/configuration.md` - Configuration systems
- `arch/dsl-expressions.md` - DSL expression types
