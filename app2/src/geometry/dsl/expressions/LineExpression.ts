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
   * Internal constructor - use factory methods for type safety.
   */
  private constructor(
    id: string,
    args:
      | { type: "coordinates"; x1: number; y1: number; x2: number; y2: number }
      | { type: "points"; startId: string; endId: string },
  ) {
    this.id = id;
    this.parameters = [];

    if (args.type === "coordinates") {
      this.x1 = args.x1;
      this.y1 = args.y1;
      this.x2 = args.x2;
      this.y2 = args.y2;
      this.dependencies = [];
    } else {
      this.startId = args.startId;
      this.endId = args.endId;
      this.dependencies = [args.startId, args.endId];
    }
  }

  /**
   * Create a line expression from explicit coordinates.
   */
  static fromCoordinates<TConfig>(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): LineExpression<TConfig> {
    return new LineExpression(id, { type: "coordinates", x1, y1, x2, y2 });
  }

  /**
   * Create a line expression from two point expressions.
   */
  static fromPoints<TConfig>(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
  ): LineExpression<TConfig> {
    return new LineExpression(id, {
      type: "points",
      startId: start.id,
      endId: end.id,
    });
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
