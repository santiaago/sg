# React Geometric Patterns

React version of the geometric pattern app with DSL (Declarative Geometry Framework) implementation.

## Run

```bash
npm install
npm run dev        # port 5174
npm run build
npm run preview
```

## Structure

- React with TypeScript
- DSL (Declarative Geometry Framework) for geometry constructions
- React Query for state management
- 12-column grid layout

## Components

- SquareDslSvg - Square construction using DSL
- SixFoldDslSvg - SixFold pattern using DSL
- SixFoldDslV1Svg - SixFold pattern v1 with cs2 coordinate system using DSL
- GeometryList - Lists all geometry elements with filters
- GeometryDetails - Shows details of selected geometry
- GeometryPlayer - Step navigation controls
- Navigation - Section navigation bar

## Note

This app uses the DSL (Declarative Geometry Framework) which is an improved version that requires significantly less code from developers while providing equivalent functionality compared to the previous imperative step-based approach.
