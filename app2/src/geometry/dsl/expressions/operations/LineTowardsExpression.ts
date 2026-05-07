// LineTowards expression for extended line operation
// Creates a line from a start point through an end point with a specific length

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { isPoint } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { lineTowards } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointExpression } from "../PointExpression";

/**
 * Expression for an extended line from a start point through an end point.
 * Used for creating lines that extend beyond the end point by a specified length.
 */
export class LineTowardsExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly startId: string;
  private readonly endId: string;
  private readonly length: number;

  /**
   * Create a line-towards expression.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression (origin of the line)
   * @param end - End point expression (direction of the line)
   * @param length - Length of the extended line
   */
  constructor(
    id: string,
    start: PointExpression<TConfig>,
    end: PointExpression<TConfig>,
    length: number,
  ) {
    this.id = id;
    this.startId = start.id;
    this.endId = end.id;
    this.length = length;
    this.dependencies = [start.id, end.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _config: TConfig,
      ): Map<string, GeometryValue> => {
        const startVal = getGeometry(inputs, this.startId, isPoint, "Point", `step_${this.id}`);
        const endVal = getGeometry(inputs, this.endId, isPoint, "Point", `step_${this.id}`);

        const result = lineTowards(startVal, endVal, this.length);

        return new Map([[this.id, result]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawLine(svg, values, this.id, store, theme);
      },
    };
  }
}
