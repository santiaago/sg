// BisectCircleAndPoint expression for bisect-circle-through-point operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { isCircle, isPoint } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { bisectCircleAndPoint } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { CircleLikeExpression, PointLikeExpression } from "../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";

/**
 * Expression for a point computed by bisecting a circle through a given point.
 * This matches the behavior of `bisectCircleAndPoint` from constructors.ts,
 * which computes a point on the circle's circumference by bisecting through the given point.
 */
export class BisectCircleAndPointExpression<TConfig> implements GeometryExpression<
  TConfig,
  "point"
> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly circleId: string;
  private readonly pointId: string;

  /**
   * Create a bisect-circle-and-point expression.
   *
   * @param id - Unique identifier for this bisected point
   * @param circle - Circle expression (any circle-like expression)
   * @param point - Point expression to bisect through (any point-like expression)
   */
  constructor(
    id: string,
    circle: CircleLikeExpression<TConfig>,
    point: PointLikeExpression<TConfig>,
  ) {
    this.id = id;
    this.circleId = circle.id;
    this.pointId = point.id;
    this.dependencies = [circle.id, point.id];
    this.parameters = [];
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
        _params: TConfig,
      ): Map<string, GeometryValue> => {
        const circleVal = getGeometry(inputs, this.circleId, isCircle, "Circle", `step_${this.id}`);
        const pointVal = getGeometry(inputs, this.pointId, isPoint, "Point", `step_${this.id}`);

        // Use the local bisectCircleAndPoint which already uses our Circle/Point types
        // Circle: { type: "circle", cx: number, cy: number, r: number }
        // Point: { type: "point", x: number, y: number }
        const result = bisectCircleAndPoint(circleVal, pointVal);

        return new Map([[this.id, result]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
