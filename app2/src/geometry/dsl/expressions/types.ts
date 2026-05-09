// Type aliases for geometry expression categories
// These union types allow methods to accept any expression that produces a specific geometry type

import type { GeometryExpression } from "./GeometryExpression";

/**
 * Any expression that produces a Point geometry.
 * Used as a type constraint for methods that accept point-producing expressions
 * (PointExpression, PointAtExpression, IntersectionExpression, CircleIntersectionExpression, etc.)
 */
export type PointLikeExpression<TConfig> = GeometryExpression<TConfig, "point">;

/**
 * Any expression that produces a Line geometry.
 * Used as a type constraint for methods that accept line-producing expressions
 * (LineExpression, LineTowardsExpression, etc.)
 */
export type LineLikeExpression<TConfig> = GeometryExpression<TConfig, "line">;

/**
 * Any expression that produces a Circle geometry.
 * Used as a type constraint for methods that accept circle-producing expressions
 * (CircleExpression, etc.)
 */
export type CircleLikeExpression<TConfig> = GeometryExpression<TConfig, "circle">;
