// Declarative geometry framework types
// This module defines the types used by the declarative API

import type { GeometryValue, Point, Line, Circle, Polygon, CoordinateSystem } from "../types/geometry";
import type { Step } from "../types/geometry";

/**
 * Unique identifier for a geometry element in the declarative construction
 */
export type GeometryId = string;

/**
 * A reference to a declarative geometry value.
 * This wraps the geometry ID and provides type safety.
 */
export interface GeometryRef<T extends GeometryValue> {
  readonly id: GeometryId;
  readonly type: T["type"];
}

/**
 * Type for a point reference
 */
export interface PointRef extends GeometryRef<Point> {
  readonly type: "point";
}

/**
 * Type for a line reference
 */
export interface LineRef extends GeometryRef<Line> {
  readonly type: "line";
}

/**
 * Type for a circle reference
 */
export interface CircleRef extends GeometryRef<Circle> {
  readonly type: "circle";
}

/**
 * Type for a polygon reference
 */
export interface PolygonRef extends GeometryRef<Polygon> {
  readonly type: "polygon";
}

/**
 * Type for a coordinate system reference
 */
export interface CoordinateSystemRef extends GeometryRef<CoordinateSystem> {
  readonly type: "coordinate_system";
}

/**
 * Union type for all geometry references
 */
export type AnyGeometryRef = PointRef | LineRef | CircleRef | PolygonRef | CoordinateSystemRef;

/**
 * Step definition for the declarative builder
 * Similar to the existing Step type but with a simpler compute signature
 */
export interface BuilderStep<TConfig> {
  id: string;
  inputs: string[];
  outputs: string[];
  parameters: (keyof TConfig)[];
  compute: (inputs: Map<string, GeometryValue>, config: TConfig) => Map<string, GeometryValue>;
  draw: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    store: any,
    theme: any,
  ) => void;
}

/**
 * Configuration for creating a builder step
 */
export interface StepConfig<TConfig> {
  id: string;
  inputs: string[];
  outputs: string[];
  parameters?: (keyof TConfig)[];
}

/**
 * Function that creates a geometry value from inputs and config
 */
export type ComputeFn<TConfig> = (
  inputs: Map<string, GeometryValue>,
  config: TConfig,
) => GeometryValue;

/**
 * Function that draws a geometry value
 */
export type DrawFn = (
  svg: SVGSVGElement,
  values: Map<string, GeometryValue>,
  geomId: string,
  store: any,
  theme: any,
) => void;
