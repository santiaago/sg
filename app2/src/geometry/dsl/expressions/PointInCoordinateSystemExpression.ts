// Point expression for points defined in a coordinate system
// Applies coordinate system transformation (position + rotation) to local coordinates

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { point, isCoordinateSystem } from "@/types/geometry";
import { getGeometry } from "../../operations";
import type { GeometryExpression } from "./GeometryExpression";
import type { CoordinateSystemExpression } from "./CoordinateSystemExpression";

/**
 * Expression for a point defined in a coordinate system.
 * The point's local coordinates are transformed by the coordinate system's
 * position and rotation to produce global SVG coordinates.
 *
 * This is used for constructions like rotatedSquareSteps.ts where points
 * are defined relative to a potentially rotated coordinate system.
 */
export class PointInCoordinateSystemExpression<TConfig> implements GeometryExpression<
  TConfig,
  "point"
> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly csExpr: CoordinateSystemExpression<TConfig>;
  private readonly localX: number;
  private readonly localY: number;

  /**
   * Create a point expression defined in a coordinate system.
   *
   * @param id - Unique identifier for this point
   * @param csExpr - Coordinate system expression that defines the transformation
   * @param localX - Local X coordinate (before transformation)
   * @param localY - Local Y coordinate (before transformation)
   */
  constructor(
    id: string,
    csExpr: CoordinateSystemExpression<TConfig>,
    localX: number,
    localY: number,
  ) {
    this.id = id;
    this.csExpr = csExpr;
    this.localX = localX;
    this.localY = localY;
    this.dependencies = [csExpr.id];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs): Map<string, GeometryValue> => {
        const cs = getGeometry(
          inputs,
          this.csExpr.id,
          isCoordinateSystem,
          "CoordinateSystem",
          `step_${this.id}`,
        );

        // Apply coordinate system transformation
        // In a rotated CS:
        //   x' = cs.x + localX * cos(rotation) - localY * sin(rotation)
        //   y' = cs.y + localX * sin(rotation) + localY * cos(rotation)
        const rotation = cs.rotation ?? 0;
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);

        const x = cs.x + this.localX * cosRot - this.localY * sinRot;
        const y = cs.y + this.localX * sinRot + this.localY * cosRot;

        return new Map([[this.id, point(x, y)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
