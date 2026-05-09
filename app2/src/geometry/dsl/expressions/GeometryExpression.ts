// Base interface for all geometry expressions in the DSL
// Each expression represents a geometry value and knows how to compile itself to a Step

import type { Step, GeometryValue } from "@/types/geometry";
import type { GeometryRenderer } from "../renderers/types";

/**
 * Base interface for all geometry expressions.
 *
 * An expression:
 * - Has a unique ID for the geometry it produces
 * - Knows its geometry type (point, line, circle, etc.)
 * - Tracks its dependencies (input geometry IDs it needs)
 * - Tracks its configuration parameters (non-geometry values it needs)
 * - Can compile itself into a Step for execution
 *
 * @typeparam TConfig - The configuration type for the construction
 * @typeparam TType - The specific geometry type (e.g., "point", "line", "circle")
 */
export interface GeometryExpression<TConfig, TType extends GeometryValue["type"]> {
  /** Unique identifier for this geometry expression and its output */
  readonly id: string;

  /** The type of geometry this expression produces */
  readonly type: TType;

  /** IDs of other geometry expressions this one depends on */
  readonly dependencies: string[];

  /** Names of configuration properties (from TConfig) this expression needs */
  readonly parameters: (keyof TConfig)[];

  /**
   * Compile this expression into a Step that can be executed.
   *
   * @param renderer - The renderer to use for drawing
   * @returns A Step that produces this geometry when executed
   */
  compile(renderer: GeometryRenderer): Step<TConfig>;
}
