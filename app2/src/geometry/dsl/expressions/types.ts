// Type aliases for geometry expression categories
// These union types allow methods to accept any expression that produces a specific geometry type

import type { GeometryExpression } from "./GeometryExpression";

// Point-producing expressions
export type PointLikeExpression<TConfig> = GeometryExpression<TConfig, "point">;

// Line-producing expressions
export type LineLikeExpression<TConfig> = GeometryExpression<TConfig, "line">;

// Circle-producing expressions
export type CircleLikeExpression<TConfig> = GeometryExpression<TConfig, "circle">;
