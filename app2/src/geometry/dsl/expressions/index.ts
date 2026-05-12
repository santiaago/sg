// Expression exports for geometry DSL

export type { GeometryExpression } from "./GeometryExpression";
export type { PointLikeExpression, LineLikeExpression, CircleLikeExpression } from "./types";
export { PointExpression } from "./PointExpression";
export { PointInCoordinateSystemExpression } from "./PointInCoordinateSystemExpression";
export { LineExpression } from "./LineExpression";
export { CircleExpression } from "./CircleExpression";
export { CoordinateSystemExpression } from "./CoordinateSystemExpression";
export { PolygonExpression, type PolygonStyleOptions } from "./PolygonExpression";

// Operation expressions
export type { IntersectionOptions, CircleIntersectionOptions } from "./operations";
export {
  PointAtExpression,
  IntersectionExpression,
  CircleIntersectionExpression,
  LineTowardsExpression,
  BisectCircleAndPointExpression,
} from "./operations";
