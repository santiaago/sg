// Circle expression for circle geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { circle, isPoint } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import { PointExpression } from "./PointExpression";

/**
 * Expression for a circle geometry.
 * Requires a center point (as PointExpression) and a radius.
 */
export class CircleExpression<TConfig> implements GeometryExpression<TConfig, "circle"> {
  readonly id: string;
  readonly type = "circle" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly centerId: string;
  private readonly radius: number;

  /**
   * Create a circle expression.
   *
   * @param id - Unique identifier for this circle
   * @param center - Center point expression
   * @param radius - Radius of the circle
   */
  constructor(id: string, center: PointExpression<TConfig>, radius: number) {
    this.id = id;
    this.centerId = center.id;
    this.radius = radius;
    this.dependencies = [center.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>): Map<string, GeometryValue> => {
        const center = inputs.get(this.centerId);

        if (!center) {
          throw new Error(`CircleExpression ${this.id}: missing center point value`);
        }

        if (!isPoint(center)) {
          throw new Error(`CircleExpression ${this.id}: expected Point for center`);
        }

        return new Map([[this.id, circle(center.x, center.y, this.radius)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawCircle(svg, values, this.id, store, theme);
      },
    };
  }
}
