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
} from "./expressions/types";
import { PointExpression } from "./expressions/PointExpression";
import { LineExpression } from "./expressions/LineExpression";
import { CircleExpression } from "./expressions/CircleExpression";
import { CoordinateSystemExpression } from "./expressions/CoordinateSystemExpression";
import { PolygonExpression } from "./expressions/PolygonExpression";
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
   * Create a line expression from explicit coordinates.
   *
   * @param id - Unique identifier for this line
   * @param x1 - X coordinate of start point
   * @param y1 - Y coordinate of start point
   * @param x2 - X coordinate of end point
   * @param y2 - Y coordinate of end point
   * @returns The created LineExpression
   */
  line(id: string, x1: number, y1: number, x2: number, y2: number): LineExpression<TConfig>;

  /**
   * Create a line expression from two point expressions.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression (any expression that produces a point)
   * @param end - End point expression (any expression that produces a point)
   * @returns The created LineExpression
   */
  line(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
  ): LineExpression<TConfig>;

  line(
    id: string,
    arg1: number | PointLikeExpression<TConfig>,
    arg2: number | PointLikeExpression<TConfig>,
    arg3?: number,
    arg4?: number,
  ): LineExpression<TConfig> {
    if (this.isPointLikeExpression(arg1) && this.isPointLikeExpression(arg2)) {
      const expr = LineExpression.fromPoints(id, arg1, arg2);
      this.expressions.set(id, expr);
      return expr;
    } else {
      const expr = LineExpression.fromCoordinates(
        id,
        arg1 as number,
        arg2 as number,
        arg3 as number,
        arg4 as number,
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
   * @param radius - Radius of the circle
   * @returns The created CircleExpression
   */
  circle(
    id: string,
    center: PointLikeExpression<TConfig>,
    radius: number,
  ): CircleExpression<TConfig> {
    const expr = new CircleExpression(id, center, radius);
    this.expressions.set(id, expr);
    return expr;
  }

  /**
   * Create a coordinate system expression.
   *
   * @param id - Unique identifier for this coordinate system
   * @param x - X position of the origin
   * @param y - Y position of the origin
   * @param arrowLength - Length of the axis arrows
   * @param rotation - Optional rotation angle in radians (default: 0)
   * @returns The created CoordinateSystemExpression
   */
  coordinateSystem(
    id: string,
    x: number,
    y: number,
    arrowLength: number,
    rotation: number = 0,
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
   * @returns The created PolygonExpression
   */
  polygon(id: string, points: PointLikeExpression<TConfig>[]): PolygonExpression<TConfig> {
    const expr = new PolygonExpression(id, points);
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
   * @param ratio - Ratio along the line (0 = start, 1 = end, 0.5 = midpoint)
   * @returns The created PointAtExpression
   */
  pointAt(
    id: string,
    line: LineLikeExpression<TConfig>,
    ratio: number,
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
   * @param length - Length of the extended line
   * @returns The created LineTowardsExpression
   */
  lineTowards(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    length: number,
  ): LineTowardsExpression<TConfig> {
    const expr = new LineTowardsExpression(id, start, end, length);
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
