// Line expression for line geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, Line, Theme } from "@/types/geometry";
import { line, isPoint } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import type { PointLikeExpression } from "./types";
import { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { LineWithLength } from "./types";

/**
 * Style options for line geometry.
 * Allows customizing stroke width and color for special lines like outline geometries.
 */
export interface LineStyleOptions {
  /** Stroke width for the line. Defaults to theme stroke width. */
  strokeWidth?: number;
  /** Stroke color for the line. Defaults to theme.COLOR_PRIMARY. */
  strokeColor?: string | ((theme: Theme) => string);
}

/**
 * Expression for a line geometry.
 * Can be constructed from explicit coordinates or from two point expressions.
 */
export class LineExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  // For coordinate-based construction
  private readonly x1Val?: number;
  private readonly y1Val?: number;
  private readonly x2Val?: number;
  private readonly y2Val?: number;

  // For point-based construction, store the point expression IDs
  private readonly startId?: string;
  private readonly endId?: string;

  // Style options for custom rendering
  private readonly styleOptions?: LineStyleOptions;

  /**
   * Internal constructor - use factory methods for type safety.
   */
  private constructor(
    id: string,
    args:
      | { type: "coordinates"; x1: number; y1: number; x2: number; y2: number }
      | { type: "points"; startId: string; endId: string },
    options?: LineStyleOptions,
  ) {
    this.id = id;
    this.parameters = [];
    this.styleOptions = options;

    if (args.type === "coordinates") {
      this.x1Val = args.x1;
      this.y1Val = args.y1;
      this.x2Val = args.x2;
      this.y2Val = args.y2;
      this.dependencies = [];
    } else {
      this.startId = args.startId;
      this.endId = args.endId;
      this.dependencies = [args.startId, args.endId];
    }
  }

  /**
   * Get the style options for this line.
   */
  getStyleOptions(): LineStyleOptions | undefined {
    return this.styleOptions;
  }

  // ========================================
  // Feature Accessors
  // ========================================

  /**
   * Access the start x-coordinate as a feature reference.
   */
  get x1(): GeometryFeatureReference<TConfig, Line, "x1"> {
    return new GeometryFeatureReference(this, "x1");
  }

  /**
   * Access the start y-coordinate as a feature reference.
   */
  get y1(): GeometryFeatureReference<TConfig, Line, "y1"> {
    return new GeometryFeatureReference(this, "y1");
  }

  /**
   * Access the end x-coordinate as a feature reference.
   */
  get x2(): GeometryFeatureReference<TConfig, Line, "x2"> {
    return new GeometryFeatureReference(this, "x2");
  }

  /**
   * Access the end y-coordinate as a feature reference.
   */
  get y2(): GeometryFeatureReference<TConfig, Line, "y2"> {
    return new GeometryFeatureReference(this, "y2");
  }

  /**
   * Access the line length as a feature reference.
   * Note: This is a computed property, not stored in the Line type.
   */
  get length(): GeometryFeatureReference<TConfig, LineWithLength, "length"> {
    return new GeometryFeatureReference(this, "length" as any);
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
   */
  static fromCoordinates<TConfig>(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: LineStyleOptions,
  ): LineExpression<TConfig> {
    return new LineExpression(id, { type: "coordinates", x1, y1, x2, y2 }, options);
  }

  /**
   * Create a line expression from two point expressions.
   * Accepts any expression that produces a point.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression
   * @param end - End point expression
   * @param options - Optional style options (strokeWidth, strokeColor)
   */
  static fromPoints<TConfig>(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    options?: LineStyleOptions,
  ): LineExpression<TConfig> {
    return new LineExpression(
      id,
      {
        type: "points",
        startId: start.id,
        endId: end.id,
      },
      options,
    );
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    const styleOptions = this.styleOptions;

    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>): Map<string, GeometryValue> => {
        // If we have dependencies (line from points), get the actual coordinates
        if (this.dependencies.length > 0 && this.startId && this.endId) {
          const startPoint = inputs.get(this.startId);
          const endPoint = inputs.get(this.endId);

          if (!startPoint || !endPoint) {
            throw new Error(`LineExpression ${this.id}: missing dependency point values`);
          }

          if (!isPoint(startPoint) || !isPoint(endPoint)) {
            throw new Error(`LineExpression ${this.id}: expected Point dependencies`);
          }

          return new Map([[this.id, line(startPoint.x, startPoint.y, endPoint.x, endPoint.y)]]);
        }

        // No dependencies - use stored coordinates
        if (
          this.x1Val !== undefined &&
          this.y1Val !== undefined &&
          this.x2Val !== undefined &&
          this.y2Val !== undefined
        ) {
          return new Map([[this.id, line(this.x1Val, this.y1Val, this.x2Val, this.y2Val)]]);
        }

        throw new Error(`LineExpression ${this.id}: invalid construction`);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawLine(svg, values, this.id, store, theme, styleOptions);
      },
    };
  }
}
