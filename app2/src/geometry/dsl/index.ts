// Public API exports for geometry DSL
// Main entry point for the declarative geometry framework

// Main facade
export { GeometryBuilder } from "./GeometryBuilder";

// Parameter types
export type { ParameterValue, NumericPropertyOf } from "./types";
export { GeometryFeatureReference } from "./GeometryFeatureReference";
export { isGeometryFeatureReference } from "./types";

// Utilities
export { resolveParameter } from "./utils";

// Renderer
export type { GeometryRenderer } from "./renderers/types";
export { DefaultGeometryRenderer } from "./renderers/DefaultRenderer";

// Expression type aliases
export type {
  PointLikeExpression,
  LineLikeExpression,
  CircleLikeExpression,
} from "./expressions/types";

// Expressions - classes exported for use in DSL
// TypeScript automatically makes the type available when exporting the class
export {
  PointExpression,
  PointInCoordinateSystemExpression,
  LineExpression,
  CircleExpression,
  CoordinateSystemExpression,
  PolygonExpression,
  PointAtExpression,
  IntersectionExpression,
  CircleIntersectionExpression,
  LineTowardsExpression,
  BisectCircleAndPointExpression,
} from "./expressions";
export type { PolygonStyleOptions } from "./expressions";

export type { GeometryExpression } from "./expressions/GeometryExpression";

// Options types
export type { IntersectionOptions, CircleIntersectionOptions } from "./expressions";
