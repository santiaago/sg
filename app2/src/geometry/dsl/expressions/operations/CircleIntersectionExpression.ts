// CircleIntersection expression for circle-circle intersection operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { isCircle } from "@/types/geometry";
import { GeometryError } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { pointFromCircles } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { CircleLikeExpression } from "../types";

/** Options for circle-circle intersection */
export interface CircleIntersectionOptions {
  /** Which intersection point to select: "north" (lower y), "south" (higher y), "west" (lower x), or "east" (higher x) in SVG coordinates */
  select?: "north" | "south" | "west" | "east";
}

/**
 * Expression for a circle-circle intersection point.
 * Finds where two circles intersect.
 */
export class CircleIntersectionExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly c1Id: string;
  private readonly c2Id: string;
  private readonly options: CircleIntersectionOptions;

  /**
   * Create a circle-circle intersection expression.
   *
   * @param id - Unique identifier for this intersection point
   * @param c1 - First circle expression (any circle-like expression)
   * @param c2 - Second circle expression (any circle-like expression)
   * @param options - Intersection options (select north or south)
   */
  constructor(
    id: string,
    c1: CircleLikeExpression<TConfig>,
    c2: CircleLikeExpression<TConfig>,
    options: CircleIntersectionOptions = {},
  ) {
    this.id = id;
    this.c1Id = c1.id;
    this.c2Id = c2.id;
    this.options = options;
    this.dependencies = [c1.id, c2.id];
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
        const c1Val = getGeometry(inputs, this.c1Id, isCircle, "Circle", `step_${this.id}`);
        const c2Val = getGeometry(inputs, this.c2Id, isCircle, "Circle", `step_${this.id}`);

        const result = pointFromCircles(c1Val, c2Val, {
          select: this.options.select,
        });

        if (!result) {
          throw new GeometryError(
            `step_${this.id}`,
            this.id,
            "No intersection found between circles",
          );
        }

        return new Map([[this.id, result]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
