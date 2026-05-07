// PointAt expression for point-at-ratio-on-line operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { point, isLine } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import type { GeometryExpression } from "../GeometryExpression";
import type { LineLikeExpression } from "../types";

/**
 * Expression for a point at a ratio along a line.
 * Computes a point at a specific position between the line's endpoints.
 */
export class PointAtExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly lineId: string;
  private readonly ratio: number;

  /**
   * Create a point-at expression.
   *
   * @param id - Unique identifier for this point
   * @param line - Line expression to compute the point along (any line-like expression)
   * @param ratio - Ratio along the line (0 = start, 1 = end, 0.5 = midpoint)
   */
  constructor(id: string, line: LineLikeExpression<TConfig>, ratio: number) {
    this.id = id;
    this.lineId = line.id;
    this.ratio = ratio;
    this.dependencies = [line.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>): Map<string, GeometryValue> => {
        const lineVal = getGeometry(inputs, this.lineId, isLine, "Line", `step_${this.id}`);

        // Calculate point at ratio along the line
        const x = lineVal.x1 + (lineVal.x2 - lineVal.x1) * this.ratio;
        const y = lineVal.y1 + (lineVal.y2 - lineVal.y1) * this.ratio;

        return new Map([[this.id, point(x, y)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
