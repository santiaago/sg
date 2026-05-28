// Circle expression with radius computed as distance between two points

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { circle, isPoint } from "@/types/geometry";
import { distance } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointLikeExpression } from "../types";
import { createStepId } from "../../utils";

/**
 * Expression for a circle with radius computed as distance between two points.
 * This avoids creating a separate distance step, matching the manual implementation.
 */
export class CircleWithDistanceRadiusExpression<TConfig> implements GeometryExpression<
  TConfig,
  "circle"
> {
  readonly id: string;
  readonly type = "circle" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[] = [];

  private readonly centerId: string;
  private readonly p1Id: string;
  private readonly p2Id: string;

  /**
   * Create a circle expression with radius = distance between two points.
   *
   * @param id - Unique identifier for this circle
   * @param center - Center point expression
   * @param p1 - First point for distance calculation
   * @param p2 - Second point for distance calculation
   */
  constructor(
    id: string,
    center: PointLikeExpression<TConfig>,
    p1: PointLikeExpression<TConfig>,
    p2: PointLikeExpression<TConfig>,
  ) {
    this.id = id;
    this.centerId = center.id;
    this.p1Id = p1.id;
    this.p2Id = p2.id;
    this.dependencies = [center.id, p1.id, p2.id];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    const stepId = createStepId(this.id);
    return {
      id: stepId,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _config: TConfig,
      ): Map<string, GeometryValue> => {
        const centerVal = inputs.get(this.centerId);
        const p1Val = inputs.get(this.p1Id);
        const p2Val = inputs.get(this.p2Id);

        if (!centerVal || !isPoint(centerVal)) {
          throw new Error(
            `CircleWithDistanceRadiusExpression ${this.id}: missing or invalid center point`,
          );
        }
        if (!p1Val || !isPoint(p1Val)) {
          throw new Error(
            `CircleWithDistanceRadiusExpression ${this.id}: missing or invalid point 1`,
          );
        }
        if (!p2Val || !isPoint(p2Val)) {
          throw new Error(
            `CircleWithDistanceRadiusExpression ${this.id}: missing or invalid point 2`,
          );
        }

        const radius = distance(p1Val, p2Val);
        return new Map([[this.id, circle(centerVal.x, centerVal.y, radius)]]);
      },
      draw: (svg, values, store, theme): void => {
        // Default draw for circles
        renderer.drawCircle(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
