// GeometryBuilder - main facade for the declarative geometry DSL
// Factory for creating geometry expressions and compiling them to Steps

import type { Step } from "@/types/geometry";
import type { GeometryRenderer } from "./renderers/types";
import { DefaultGeometryRenderer } from "./renderers/DefaultRenderer";
import type { GeometryExpression } from "./expressions/GeometryExpression";
import type {
  PointLikeExpression,
  LineLikeExpression,
  CircleLikeExpression,
  CoordinateSystemLikeExpression,
} from "./expressions/types";
import { GeometryFeatureReference } from "./GeometryFeatureReference";
import type { ParameterValue, NumericPropertyOf, GeometryTypeMap } from "./types";
import { PointExpression } from "./expressions/PointExpression";
import { PointInCoordinateSystemExpression } from "./expressions/PointInCoordinateSystemExpression";
import { LineExpression, type LineStyleOptions } from "./expressions/LineExpression";
import { CircleExpression } from "./expressions/CircleExpression";
import { CoordinateSystemExpression } from "./expressions/CoordinateSystemExpression";
import { PolygonExpression, type PolygonStyleOptions } from "./expressions/PolygonExpression";
import { PointAtExpression } from "./expressions/operations/PointAtExpression";
import {
  IntersectionExpression,
  type IntersectionOptions,
} from "./expressions/operations/IntersectionExpression";
import {
  CircleIntersectionExpression,
  type CircleIntersectionOptions,
} from "./expressions/operations/CircleIntersectionExpression";
import { LineTowardsExpression } from "./expressions/operations/LineTowardsExpression";
import { BisectCircleAndPointExpression } from "./expressions/operations/BisectCircleAndPointExpression";
import { LineIntersectionExpression } from "./expressions/operations/LineIntersectionExpression";
import { DistanceExpression } from "./expressions/operations/DistanceExpression";
import { CircleWithDistanceRadiusExpression } from "./expressions/operations/CircleWithDistanceRadiusExpression";
import { VectorExpression } from "./expressions/operations/VectorExpression";
import { AddExpression } from "./expressions/operations/AddExpression";
import { SubtractExpression } from "./expressions/operations/SubtractExpression";
import { MultiplyExpression } from "./expressions/operations/MultiplyExpression";
import { DivideExpression } from "./expressions/operations/DivideExpression";

/**
 * GeometryBuilder is the main facade for the declarative geometry DSL.
 * It provides factory methods for creating geometry expressions and
 * compiles them into Steps for execution by the existing step engine.
 */
export class GeometryBuilder<TConfig> {
  private expressions: Map<string, GeometryExpression<TConfig, any>>;
  private renderer: GeometryRenderer;

  /**
   * Create a new GeometryBuilder.
   *
   * @param renderer - Optional custom renderer for drawing geometry
   */
  constructor(renderer?: GeometryRenderer) {
    this.expressions = new Map();
    this.renderer = renderer ?? new DefaultGeometryRenderer();
  }

  /**
   * Set a custom renderer for drawing geometry.
   * Enables dependency injection for custom rendering logic.
   *
   * @param renderer - The renderer to use for drawing
   * @returns this for chaining
   */
  setRenderer(renderer: GeometryRenderer): this {
    this.renderer = renderer;
    return this;
  }

  /**
   * Get an expression by its ID.
   *
   * @param id - The expression ID
   * @returns The expression, or undefined if not found
   */
  getExpression(id: string): GeometryExpression<TConfig, any> | undefined {
    return this.expressions.get(id);
  }

  /**
   * Get all tracked expressions.
   *
   * @returns Map of expression IDs to expressions
   */
  getAllExpressions(): Map<string, GeometryExpression<TConfig, any>> {
    return new Map(this.expressions);
  }

  // ========================================
  // Parameter Helper Methods
  // ========================================

  /**
   * Create a type-safe reference to a config parameter.
   * Improves readability over string literals with `as const`.
   *
   * @param key - The configuration key to reference
   * @returns The key with type safety
   *
   * @example
   * ```typescript
   * builder.circle("c1", center, builder.param("circleRadius"));
   * ```
   */
  param<K extends keyof TConfig>(key: K): K {
    return key;
  }

  /**
   * Create a reference to a geometry feature.
   * Alternative syntax to direct property access (e.g., `c1.r`).
   *
   * @param expr - The geometry expression to reference
   * @param key - The numeric property name to reference
   * @returns A GeometryFeatureReference that can be used as a parameter value
   *
   * @example
   * ```typescript
   * builder.circle("c2", center2, builder.geom(c1, "r"));
   * ```
   */
  geom<TType extends keyof GeometryTypeMap, K extends NumericPropertyOf<GeometryTypeMap[TType]>>(
    expr: GeometryExpression<TConfig, TType>,
    key: K,
  ): GeometryFeatureReference<TConfig, GeometryTypeMap[TType], K> {
    return new GeometryFeatureReference(expr, key);
  }

  // ========================================
  // Primitive Geometry Factory Methods
  // ========================================

  /**
   * Create a point expression from coordinates.
   *
   * @param id - Unique identifier for this point
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns The created PointExpression
   */
  point(id: string, x: number, y: number): PointExpression<TConfig> {
    const expr = new PointExpression(id, x, y);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a point expression defined in a coordinate system.
   * The point's local coordinates are transformed by the coordinate system's
   * position and rotation to produce global SVG coordinates.
   *
   * @param id - Unique identifier for this point
   * @param cs - Coordinate system expression that defines the transformation
   * @param localX - Local X coordinate (before transformation) - number, config key, or feature reference
   * @param localY - Local Y coordinate (before transformation) - number, config key, or feature reference
   * @returns The created PointInCoordinateSystemExpression
   */
  pointInCs(
    id: string,
    cs: CoordinateSystemExpression<TConfig>,
    localX: ParameterValue<TConfig>,
    localY: ParameterValue<TConfig>,
  ): PointInCoordinateSystemExpression<TConfig> {
    const expr = new PointInCoordinateSystemExpression(id, cs, localX, localY);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a line expression from explicit coordinates.
   *
   * @param id - Unique identifier for this line
   * @param x1 - X coordinate of start point
   * @param y1 - Y coordinate of start point
   * @param x2 - X coordinate of end point
   * @param y2 - Y coordinate of end point
   * @param options - Optional style options (strokeWidth, strokeColor)
   * @returns The created LineExpression
   */
  line(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: LineStyleOptions,
  ): LineExpression<TConfig>;

  /**
   * Create a line expression from two point expressions.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression (any expression that produces a point)
   * @param end - End point expression (any expression that produces a point)
   * @param options - Optional style options (strokeWidth, strokeColor)
   * @returns The created LineExpression
   */
  line(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    options?: LineStyleOptions,
  ): LineExpression<TConfig>;

  line(
    id: string,
    arg1: number | PointLikeExpression<TConfig>,
    arg2: number | PointLikeExpression<TConfig>,
    arg3?: number | LineStyleOptions,
    arg4?: number | LineStyleOptions,
    arg5?: LineStyleOptions,
  ): LineExpression<TConfig> {
    // Check if we have point expressions
    if (this.isPointLikeExpression(arg1) && this.isPointLikeExpression(arg2)) {
      const expr = LineExpression.fromPoints(id, arg1, arg2, arg3 as LineStyleOptions);
      this.expressions.set(id, expr);
      return expr;
    } else {
      // Coordinate-based line
      const expr = LineExpression.fromCoordinates(
        id,
        arg1 as number,
        arg2 as number,
        arg3 as number,
        arg4 as number,
        arg5,
      );
      this.expressions.set(id, expr);
      return expr;
    }
  }

  /**
   * Type guard to check if a value is a PointLikeExpression.
   */
  private isPointLikeExpression(value: unknown): value is PointLikeExpression<TConfig> {
    return (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      "type" in value &&
      (value as { type: string }).type === "point"
    );
  }

  /**
   * Create a circle expression.
   *
   * @param id - Unique identifier for this circle
   * @param center - Center point expression (any expression that produces a point)
   * @param radius - Radius of the circle (number, config parameter, or feature reference)
   * @returns The created CircleExpression
   */
  circle(
    id: string,
    center: PointLikeExpression<TConfig>,
    radius: ParameterValue<TConfig>,
  ): CircleExpression<TConfig> {
    const expr = new CircleExpression(id, center, radius);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a coordinate system expression.
   *
   * @param id - Unique identifier for this coordinate system
   * @param x - X position of the origin (number, config key, or feature reference)
   * @param y - Y position of the origin (number, config key, or feature reference)
   * @param arrowLength - Length of the axis arrows (number, config key, or feature reference)
   * @param rotation - Optional rotation angle in radians (number, config key, or feature reference) (default: 0)
   * @returns The created CoordinateSystemExpression
   */
  coordinateSystem(
    id: string,
    x: ParameterValue<TConfig> = 0,
    y: ParameterValue<TConfig> = 0,
    arrowLength: ParameterValue<TConfig> = 0,
    rotation: ParameterValue<TConfig> = 0,
  ): CoordinateSystemExpression<TConfig> {
    const expr = new CoordinateSystemExpression(id, x, y, arrowLength, rotation);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a polygon expression from an array of point expressions.
   *
   * @param id - Unique identifier for this polygon
   * @param points - Array of point-like expressions defining the polygon vertices
   * @param options - Optional style options (strokeWidth, strokeColor)
   * @returns The created PolygonExpression
   */
  polygon(
    id: string,
    points: PointLikeExpression<TConfig>[],
    options?: PolygonStyleOptions,
  ): PolygonExpression<TConfig> {
    const expr = new PolygonExpression(id, points, options);
    this.expressions.set(id, expr);
    return expr;
  }

  // ========================================
  // Operation Expression Factory Methods
  // ========================================

  /**
   * Create a point-at expression.
   * Computes a point at a specific ratio along a line.
   *
   * @param id - Unique identifier for this point
   * @param line - Line expression to compute the point along (any line-like expression)
   * @param ratio - Ratio along the line (0 = start, 1 = end, 0.5 = midpoint) - number, config key, or feature reference
   * @returns The created PointAtExpression
   */
  pointAt(
    id: string,
    line: LineLikeExpression<TConfig>,
    ratio: ParameterValue<TConfig>,
  ): PointAtExpression<TConfig> {
    const expr = new PointAtExpression(id, line, ratio);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create an intersection expression.
   * Finds where a circle intersects with a line.
   *
   * @param id - Unique identifier for this intersection point
   * @param circle - Circle expression (any circle-like expression)
   * @param line - Line expression (any line-like expression)
   * @param options - Intersection options (excludeId, position, tolerance)
   * @returns The created IntersectionExpression
   */
  intersection(
    id: string,
    circle: CircleLikeExpression<TConfig>,
    line: LineLikeExpression<TConfig>,
    options: IntersectionOptions = {},
  ): IntersectionExpression<TConfig> {
    const expr = new IntersectionExpression(id, circle, line, options);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a circle-circle intersection expression.
   * Finds where two circles intersect.
   *
   * @param id - Unique identifier for this intersection point
   * @param c1 - First circle expression (any circle-like expression)
   * @param c2 - Second circle expression (any circle-like expression)
   * @param options - Intersection options (select north or south)
   * @returns The created CircleIntersectionExpression
   */
  circleIntersection(
    id: string,
    c1: CircleLikeExpression<TConfig>,
    c2: CircleLikeExpression<TConfig>,
    options: CircleIntersectionOptions = {},
  ): CircleIntersectionExpression<TConfig> {
    const expr = new CircleIntersectionExpression(id, c1, c2, options);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a line-towards expression.
   * Creates an extended line from a start point through an end point with a specific length.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression (origin of the line, any point-like expression)
   * @param end - End point expression (direction of the line, any point-like expression)
   * @param length - Length of the extended line (number, config key, or feature reference)
   * @param options - Optional style options (strokeWidth, strokeColor)
   * @returns The created LineTowardsExpression
   */
  lineTowards(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    length: ParameterValue<TConfig>,
    options?: LineStyleOptions,
  ): LineTowardsExpression<TConfig> {
    const expr = new LineTowardsExpression(id, start, end, length, options);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a bisect-circle-and-point expression.
   * Computes a point on a circle's circumference by bisecting through a given point.
   * This matches the behavior of the `bisectCircleAndPoint` helper from constructors.ts.
   *
   * @param id - Unique identifier for this bisected point
   * @param circle - Circle expression (any circle-like expression)
   * @param point - Point expression to bisect through (any point-like expression)
   * @returns The created BisectCircleAndPointExpression
   */
  bisectCircleAndPoint(
    id: string,
    circle: CircleLikeExpression<TConfig>,
    point: PointLikeExpression<TConfig>,
  ): BisectCircleAndPointExpression<TConfig> {
    const expr = new BisectCircleAndPointExpression(id, circle, point);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a line-line intersection expression.
   * Finds where two lines intersect.
   *
   * @param id - Unique identifier for this intersection point
   * @param line1 - First line expression (any line-like expression)
   * @param line2 - Second line expression (any line-like expression)
   * @returns The created LineIntersectionExpression
   */
  lineIntersection(
    id: string,
    line1: LineLikeExpression<TConfig>,
    line2: LineLikeExpression<TConfig>,
  ): LineIntersectionExpression<TConfig> {
    const expr = new LineIntersectionExpression(id, line1, line2);
    this.expressions.set(id, expr);
    return expr;
  }
  /**
   * Create a distance expression that computes the distance between two points.
   * The computed distance can be referenced as a radius or other numeric parameter.
   *
   * @param id - Unique identifier for this distance computation
   * @param p1 - First point expression
   * @param p2 - Second point expression
   * @returns The created DistanceExpression with a .d property to reference the distance value
   */
  distance(
    id: string,
    p1: PointLikeExpression<TConfig>,
    p2: PointLikeExpression<TConfig>,
  ): DistanceExpression<TConfig> {
    const expr = new DistanceExpression(id, p1, p2);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a circle with radius equal to the distance between two points.
   * This avoids creating a separate distance step, matching manual implementation.
   *
   * @param id - Unique identifier for the circle
   * @param center - Center point expression
   * @param p1 - First point for distance calculation
   * @param p2 - Second point for distance calculation
   * @returns The created CircleWithDistanceRadiusExpression
   */
  circleWithDistanceRadius(
    id: string,
    center: PointLikeExpression<TConfig>,
    p1: PointLikeExpression<TConfig>,
    p2: PointLikeExpression<TConfig>,
  ): CircleWithDistanceRadiusExpression<TConfig> {
    const expr = new CircleWithDistanceRadiusExpression(id, center, p1, p2);
    this.expressions.set(id, expr);
    return expr;
  }

  // ========================================
  // Vector and Arithmetic Expression Factory Methods
  // ========================================

  /**
   * Create a vector expression that computes the vector (dx, dy) between two points or coordinate systems.
   * The result can be referenced via .dx and .dy properties.
   *
   * @param id - Unique identifier for this vector
   * @param from - Source geometry expression (point or coordinate system)
   * @param to - Target geometry expression (point or coordinate system)
   * @returns The created VectorExpression with .dx and .dy properties
   */
  vector(
    id: string,
    from: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
    to: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
  ): VectorExpression<TConfig> {
    const expr = new VectorExpression(id, from, to);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create an add expression that computes the sum of two numeric values.
   * The result can be referenced via .value property.
   *
   * @param id - Unique identifier for this addition
   * @param a - First operand (number, config key, or feature reference)
   * @param b - Second operand (number, config key, or feature reference)
   * @returns The created AddExpression with .value property
   */
  add(id: string, a: ParameterValue<TConfig>, b: ParameterValue<TConfig>): AddExpression<TConfig> {
    const expr = new AddExpression(id, a, b);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a subtract expression that computes the difference of two numeric values.
   * The result can be referenced via .value property.
   *
   * @param id - Unique identifier for this subtraction
   * @param a - First operand (minuend) - number, config key, or feature reference
   * @param b - Second operand (subtrahend) - number, config key, or feature reference
   * @returns The created SubtractExpression with .value property
   */
  subtract(
    id: string,
    a: ParameterValue<TConfig>,
    b: ParameterValue<TConfig>,
  ): SubtractExpression<TConfig> {
    const expr = new SubtractExpression(id, a, b);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a multiply expression that computes the product of two numeric values.
   * The result can be referenced via .value property.
   *
   * @param id - Unique identifier for this multiplication
   * @param a - First operand (number, config key, or feature reference)
   * @param b - Second operand (number, config key, or feature reference)
   * @returns The created MultiplyExpression with .value property
   */
  multiply(
    id: string,
    a: ParameterValue<TConfig>,
    b: ParameterValue<TConfig>,
  ): MultiplyExpression<TConfig> {
    const expr = new MultiplyExpression(id, a, b);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a divide expression that computes the quotient of two numeric values.
   * The result can be referenced via .value property.
   * Returns NaN if dividing by zero (matches JavaScript behavior).
   *
   * @param id - Unique identifier for this division
   * @param a - First operand (dividend) - number, config key, or feature reference
   * @param b - Second operand (divisor) - number, config key, or feature reference
   * @returns The created DivideExpression with .value property
   */
  divide(
    id: string,
    a: ParameterValue<TConfig>,
    b: ParameterValue<TConfig>,
  ): DivideExpression<TConfig> {
    const expr = new DivideExpression(id, a, b);
    this.expressions.set(id, expr);
    return expr;
  }

  // ========================================
  // Dependency Graph Methods
  // ========================================

  /**
   * Get the dependencies for a specific expression.
   *
   * @param id - The expression ID
   * @returns Array of dependency IDs
   */
  getDependencies(id: string): string[] {
    const expr = this.expressions.get(id);
    if (!expr) {
      return [];
    }
    return [...expr.dependencies];
  }

  /**
   * Get the full dependency graph as a map of IDs to their dependencies.
   *
   * @returns Record mapping expression IDs to their dependency arrays
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const [id, expr] of this.expressions) {
      graph[id] = [...expr.dependencies];
    }
    return graph;
  }

  /**
   * Get metadata for a specific expression.
   *
   * @param id - The expression ID
   * @returns Metadata including inputs, outputs, and parameters
   */
  getStepMetadata(id: string): {
    inputs: string[];
    outputs: string[];
    parameters: (keyof TConfig)[];
  } {
    const expr = this.expressions.get(id);
    if (!expr) {
      return { inputs: [], outputs: [], parameters: [] };
    }
    return {
      inputs: [...expr.dependencies],
      outputs: [expr.id],
      parameters: [...expr.parameters],
    };
  }

  /**
   * Get metadata for all expressions.
   *
   * @returns Record mapping expression IDs to their metadata
   */
  getFullMetadata(): Record<
    string,
    { inputs: string[]; outputs: string[]; parameters: (keyof TConfig)[] }
  > {
    const result: Record<
      string,
      { inputs: string[]; outputs: string[]; parameters: (keyof TConfig)[] }
    > = {};
    for (const [id, expr] of this.expressions) {
      result[id] = {
        inputs: [...expr.dependencies],
        outputs: [expr.id],
        parameters: [...expr.parameters],
      };
    }
    return result;
  }

  // ========================================
  // Compilation Methods
  // ========================================

  /**
   * Get the execution order of expressions based on dependencies.
   * Uses topological sort to ensure dependencies are executed first.
   *
   * @returns Array of expression IDs in execution order
   * @throws Error if circular dependencies are detected
   */
  getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    const visiting = new Set<string>();

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving expression: ${id}`);
      }

      visiting.add(id);

      const expr = this.expressions.get(id);
      if (expr) {
        for (const dep of expr.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    for (const id of this.expressions.keys()) {
      visit(id);
    }

    return order;
  }

  /**
   * Compile all tracked expressions into Steps.
   * The steps are ordered by dependency using topological sort.
   *
   * @returns Array of Steps ready for execution
   */
  compile(): Step<TConfig>[] {
    const steps: Step<TConfig>[] = [];
    const executionOrder = this.getExecutionOrder();

    for (const id of executionOrder) {
      const expr = this.expressions.get(id);
      if (!expr) continue;

      const step = expr.compile(this.renderer);
      steps.push(step);
    }

    return steps;
  }
}
