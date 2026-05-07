// Public API exports for geometry DSL
// Main entry point for the declarative geometry framework

// Main facade
export { GeometryBuilder } from "./GeometryBuilder";

// Renderer
export type { GeometryRenderer } from "./renderers/types";
export { DefaultGeometryRenderer } from "./renderers/DefaultRenderer";

// Expressions
export type { GeometryExpression } from "./expressions/GeometryExpression";
export type {
  PointExpression,
  LineExpression,
  CircleExpression,
  CoordinateSystemExpression,
  PolygonExpression,
  PointAtExpression,
  IntersectionExpression,
  CircleIntersectionExpression,
  LineTowardsExpression,
} from "./expressions";

// Options types
export type { IntersectionOptions, CircleIntersectionOptions } from "./expressions";
