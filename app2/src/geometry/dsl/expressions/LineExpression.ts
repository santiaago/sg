// Line expression for line geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { line, isPoint } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import { PointExpression } from "./PointExpression";

/**
 * Expression for a line geometry.
 * Can be constructed from explicit coordinates or from two point expressions.
 */
export class LineExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  // For coordinate-based construction
  private readonly x1?: number;
  private readonly y1?: number;
  private readonly x2?: number;
  private readonly y2?: number;

  // For point-based construction, store the point expression IDs
  private readonly startId?: string;
  private readonly endId?: string;

  /**
   * Create a line expression from explicit coordinates.
   *
   * @param id - Unique identifier for this line
   * @param x1 - X coordinate of start point
   * @param y1 - Y coordinate of start point
   * @param x2 - X coordinate of end point
   * @param y2 - Y coordinate of end point
   */
  constructor(id: string, x1: number, y1: number, x2: number, y2: number);

  /**
   * Create a line expression from two point expressions.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression
   * @param end - End point expression
   */
  constructor(id: string, start: PointExpression<TConfig>, end: PointExpression<TConfig>);

  constructor(
    id: string,
    arg1: number | PointExpression<TConfig>,
    arg2: number | PointExpression<TConfig>,
    arg3?: number,
    arg4?: number,
  ) {
    this.id = id;
    this.parameters = [];

    // Handle point expression arguments
    if (arg1 instanceof PointExpression && arg2 instanceof PointExpression) {
      this.startId = arg1.id;
      this.endId = arg2.id;
      this.dependencies = [arg1.id, arg2.id];
    } else {
      // Handle coordinate arguments
      this.x1 = arg1 as number;
      this.y1 = arg2 as number;
      this.x2 = arg3 as number;
      this.y2 = arg4 as number;
      this.dependencies = [];
    }
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
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
          this.x1 !== undefined &&
          this.y1 !== undefined &&
          this.x2 !== undefined &&
          this.y2 !== undefined
        ) {
          return new Map([[this.id, line(this.x1, this.y1, this.x2, this.y2)]]);
        }

        throw new Error(`LineExpression ${this.id}: invalid construction`);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawLine(svg, values, this.id, store, theme);
      },
    };
  }
}
