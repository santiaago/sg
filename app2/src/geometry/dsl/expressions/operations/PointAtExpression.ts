// PointAt expression for point-at-ratio-on-line operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point, isLine } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import type { GeometryExpression } from "../GeometryExpression";
import type { LineLikeExpression } from "../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import type { ParameterValue } from "../../types";
import { isGeometryFeatureReference } from "../../types";
import { resolveParameter } from "../../utils";

/**
 * Expression for a point at a ratio along a line.
 * Computes a point at a specific position between the line's endpoints.
 * Supports parameterized ratio (literal numbers, config parameters, or feature references).
 */
export class PointAtExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly lineId: string;
  private readonly ratioParam: ParameterValue<TConfig>;

  /**
   * Create a point-at expression.
   *
   * @param id - Unique identifier for this point
   * @param line - Line expression to compute the point along (any line-like expression)
   * @param ratio - Ratio along the line (0 = start, 1 = end, 0.5 = midpoint) - number, config key, or feature reference
   */
  constructor(id: string, line: LineLikeExpression<TConfig>, ratio: ParameterValue<TConfig>) {
    this.id = id;
    this.lineId = line.id;
    this.ratioParam = ratio;
    this.dependencies = [line.id];
    this.parameters = [];

    // Track dependencies based on ratio type
    if (isGeometryFeatureReference(ratio)) {
      this.dependencies.push(ratio.sourceId);
    } else if (typeof ratio === "string") {
      this.parameters.push(ratio as keyof TConfig);
    }
  }

  // ========================================
  // Feature Accessors
  // ========================================

  /**
   * Access the x-coordinate as a feature reference.
   * Note: This creates a reference to the computed point's x property.
   */
  get x(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  /**
   * Access the y-coordinate as a feature reference.
   * Note: This creates a reference to the computed point's y property.
   */
  get y(): GeometryFeatureReference<TConfig, Point, "y"> {
    return new GeometryFeatureReference(this, "y");
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        params: TConfig,
      ): Map<string, GeometryValue> => {
        const lineVal = getGeometry(inputs, this.lineId, isLine, "Line", `step_${this.id}`);

        const ratio = resolveParameter(inputs, params, this.ratioParam, "ratio");

        // Calculate point at ratio along the line
        const x = lineVal.x1 + (lineVal.x2 - lineVal.x1) * ratio;
        const y = lineVal.y1 + (lineVal.y2 - lineVal.y1) * ratio;

        return new Map([[this.id, point(x, y)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
