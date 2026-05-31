// Type definitions for the parameterized geometry DSL

import type { Point, Line, Circle, CoordinateSystem, Polygon } from "@/types/geometry";

/**
 * Maps geometry type strings to their corresponding GeometryValue types.
 */
export interface GeometryTypeMap {
  point: Point;
  line: Line;
  circle: Circle;
  coordinate_system: CoordinateSystem;
  polygon: Polygon;
}

/**
 * Represents a reference to a numeric property of a geometry.
 * This is the structural type used in ParameterValue.
 */
export interface GeometryFeatureReferenceLike {
  readonly type: "geometry_feature_reference";
  readonly sourceId: string;
  readonly property: PropertyKey;
}

/**
 * All possible sources for a numeric parameter value.
 * - number: Literal numeric value
 * - boolean: Literal boolean value (for flipX/flipY)
 * - keyof TConfig: Reference to a configuration parameter
 * - GeometryFeatureReferenceLike: Reference to another geometry's numeric or boolean property
 */
export type ParameterValue<TConfig> =
  | number
  | boolean
  | keyof TConfig
  | GeometryFeatureReferenceLike;

/**
 * Extract only the numeric property names from a GeometryValue type.
 * Used to ensure type safety when creating feature accessors.
 *
 * @example
 * type CircleNumericProps = NumericPropertyOf<Circle>; // "cx" | "cy" | "r"
 */
export type NumericPropertyOf<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * Type guard for GeometryFeatureReference-like objects.
 * Enables runtime type checking and type narrowing.
 *
 * @param value - The value to check
 * @returns true if the value is a geometry feature reference
 *
 * @example
 * if (isGeometryFeatureReference(value)) {
 *   // value is now typed as GeometryFeatureReferenceLike
 *   const sourceId = value.sourceId;
 * }
 */
export function isGeometryFeatureReference(value: unknown): value is GeometryFeatureReferenceLike {
  if (typeof value !== "object" || value === null) return false;
  return (value as { type: unknown }).type === "geometry_feature_reference";
}
