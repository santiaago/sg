// Type definitions for geometry expression categories with feature accessors
// These interfaces extend GeometryExpression and add getters for numeric properties

import type { GeometryExpression } from "./GeometryExpression";
import type { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { Point, Line, Circle, CoordinateSystem } from "@/types/geometry";

/**
 * Line geometry with computed length property.
 * This extends the base Line type to include computed properties that can be
 * referenced via feature accessors.
 */
export type LineWithLength = Line & {
  /** Computed length of the line (not stored in the base Line type) */
  length: number;
};

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

/**
 * Any expression that produces a CoordinateSystem geometry.
 */
export type CoordinateSystemLikeExpression<TConfig> = GeometryExpression<
  TConfig,
  "coordinate_system"
>;

// ========================================
// Feature Accessor Interfaces
// These interfaces are implemented by expression classes to provide
// feature reference getters for their numeric properties.
// ========================================

/**
 * Extended PointLikeExpression with feature accessors for x and y coordinates.
 */
export interface PointWithAccessors<TConfig> extends GeometryExpression<TConfig, "point"> {
  /** Access the x-coordinate as a feature reference */
  readonly x: GeometryFeatureReference<TConfig, Point, "x">;
  /** Access the y-coordinate as a feature reference */
  readonly y: GeometryFeatureReference<TConfig, Point, "y">;
}

/**
 * Extended CircleLikeExpression with feature accessors for center and radius.
 */
export interface CircleWithAccessors<TConfig> extends GeometryExpression<TConfig, "circle"> {
  /** Access the center x-coordinate as a feature reference */
  readonly cx: GeometryFeatureReference<TConfig, Circle, "cx">;
  /** Access the center y-coordinate as a feature reference */
  readonly cy: GeometryFeatureReference<TConfig, Circle, "cy">;
  /** Access the radius as a feature reference (abbreviation) */
  readonly r: GeometryFeatureReference<TConfig, Circle, "r">;
  /** Access the radius as a feature reference (full name) */
  readonly radius: GeometryFeatureReference<TConfig, Circle, "r">;
}

/**
 * Extended LineLikeExpression with feature accessors for coordinates and length.
 */
export interface LineWithAccessors<TConfig> extends GeometryExpression<TConfig, "line"> {
  /** Access the start x-coordinate as a feature reference */
  readonly x1: GeometryFeatureReference<TConfig, Line, "x1">;
  /** Access the start y-coordinate as a feature reference */
  readonly y1: GeometryFeatureReference<TConfig, Line, "y1">;
  /** Access the end x-coordinate as a feature reference */
  readonly x2: GeometryFeatureReference<TConfig, Line, "x2">;
  /** Access the end y-coordinate as a feature reference */
  readonly y2: GeometryFeatureReference<TConfig, Line, "y2">;
  /** Access the line length as a feature reference (computed on-demand) */
  readonly length: GeometryFeatureReference<TConfig, LineWithLength, "length">;
}

/**
 * Extended CoordinateSystemExpression with feature accessors for all numeric properties.
 */
export interface CoordinateSystemWithAccessors<TConfig> extends GeometryExpression<
  TConfig,
  "coordinate_system"
> {
  /** Access the origin x-coordinate as a feature reference */
  readonly x: GeometryFeatureReference<TConfig, CoordinateSystem, "x">;
  /** Access the origin y-coordinate as a feature reference */
  readonly y: GeometryFeatureReference<TConfig, CoordinateSystem, "y">;
  /** Access the arrow length as a feature reference */
  readonly arrowLength: GeometryFeatureReference<TConfig, CoordinateSystem, "arrowLength">;
  /** Access the rotation as a feature reference */
  readonly rotation: GeometryFeatureReference<TConfig, CoordinateSystem, "rotation">;
  /** Access the flipX property as a feature reference */
  readonly flipX: GeometryFeatureReference<TConfig, CoordinateSystem, "flipX">;
  /** Access the flipY property as a feature reference */
  readonly flipY: GeometryFeatureReference<TConfig, CoordinateSystem, "flipY">;
}
