// LineIntersection expression for line-line intersection operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { isLine, point } from "@/types/geometry";
import { lineIntersect } from "@sg/geometry";
import { GeometryError } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import type { GeometryExpression } from "../GeometryExpression";
import type { LineLikeExpression } from "../types";
import { createStepId } from "../../utils";

/** Options for line-line intersection */
export interface LineIntersectionOptions {}

/**
 * Expression for a line-line intersection point.
 * Finds where two lines intersect.
 */
export class LineIntersectionExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly line1Id: string;
  private readonly line2Id: string;

  /**
   * Create a line intersection expression.
   *
   * @param id - Unique identifier for this intersection point
   * @param line1 - First line expression (any line-like expression)
   * @param line2 - Second line expression (any line-like expression)
   */
  constructor(id: string, line1: LineLikeExpression<TConfig>, line2: LineLikeExpression<TConfig>) {
    this.id = id;
    this.line1Id = line1.id;
    this.line2Id = line2.id;
    this.dependencies = [line1.id, line2.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    const stepId = createStepId(renderer.namespace, this.id);
    return {
      id: stepId,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _config: TConfig,
      ): Map<string, GeometryValue> => {
        const line1Val = getGeometry(inputs, this.line1Id, isLine, "Line", stepId);
        const line2Val = getGeometry(inputs, this.line2Id, isLine, "Line", stepId);

        const result = lineIntersect(
          line1Val.x1,
          line1Val.y1,
          line1Val.x2,
          line1Val.y2,
          line2Val.x1,
          line2Val.y1,
          line2Val.x2,
          line2Val.y2,
        );

        if (!result) {
          throw new GeometryError(stepId, this.id, "No intersection found between lines");
        }

        return new Map([[this.id, point(result[0], result[1])]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
