// GeometryFeatureReference - Reference to a numeric property of a geometry expression

import type { GeometryValue } from "@/types/geometry";
import type { GeometryExpression } from "./expressions/GeometryExpression";
import type { GeometryFeatureReferenceLike } from "./types";

/**
 * Represents a reference to a numeric property of a geometry expression.
 *
 * Feature references are lightweight objects (2 string fields) that defer
 * value resolution to compute time. They enable explicit geometric relationships
 * between expressions while maintaining lazy evaluation.
 *
 * @typeparam TConfig - The configuration type for the construction
 * @typeparam T - The GeometryValue type (Point, Line, Circle, etc.)
 * @typeparam K - The specific property name (must be a numeric property of T)
 */
export class GeometryFeatureReference<
  TConfig,
  T extends GeometryValue,
  K extends keyof T,
> implements GeometryFeatureReferenceLike {
  /** Type discriminator for runtime checks */
  readonly type = "geometry_feature_reference" as const;

  /** ID of the source geometry expression */
  readonly sourceId: string;

  /** Property name to access on the source geometry */
  readonly property: K;

  /**
   * Create a feature reference.
   *
   * @param source - The source geometry expression
   * @param property - The numeric property name to reference
   */
  constructor(source: GeometryExpression<TConfig, T["type"]>, property: K) {
    this.sourceId = source.id;
    this.property = property;
  }

  /**
   * Resolve this reference to its numeric value.
   * Called at compute time with access to all previously computed geometries.
   *
   * @param inputs - Map of geometry IDs to their computed values
   * @returns The numeric value of the referenced property
   * @throws Error if source geometry is missing or property is not numeric
   */
  resolve(inputs: Map<string, GeometryValue>): number {
    const sourceValue = inputs.get(this.sourceId);
    if (!sourceValue) {
      throw new Error(`GeometryFeatureReference: source geometry '${this.sourceId}' not found`);
    }

    const value = (sourceValue as any)[this.property];
    if (typeof value !== "number") {
      throw new Error(
        `GeometryFeatureReference: property '${String(this.property)}' on ` +
          `'${this.sourceId}' is not a number (got ${typeof value})`,
      );
    }

    return value;
  }

  /**
   * String representation for debugging.
   *
   * @returns String in format "geom:{sourceId}.{property}"
   */
  toString(): string {
    return `geom:${this.sourceId}.${String(this.property)}`;
  }
}
