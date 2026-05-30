// Point expression for points defined in a coordinate system
// Applies coordinate system transformation (position + rotation) to local coordinates

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point, isCoordinateSystem } from "@/types/geometry";
import { getGeometry } from "../../operations";
import type { GeometryExpression } from "./GeometryExpression";
import type { CoordinateSystemExpression } from "./CoordinateSystemExpression";
import { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { ParameterValue } from "../types";
import { isGeometryFeatureReference } from "../types";
import { createStepId, resolveParameter } from "../utils";

/**
 * Expression for a point defined in a coordinate system.
 * The point's local coordinates are transformed by the coordinate system's
 * position and rotation to produce global SVG coordinates.
 *
 * This is used for constructions like rotatedSquareSteps.ts where points
 * are defined relative to a potentially rotated coordinate system.
 * Supports parameterized local coordinates (literal numbers, config parameters, or feature references).
 */
export class PointInCoordinateSystemExpression<TConfig> implements GeometryExpression<
  TConfig,
  "point"
> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly csId: string;
  private readonly localX: ParameterValue<TConfig>;
  private readonly localY: ParameterValue<TConfig>;

  /**
   * Create a point expression defined in a coordinate system.
   *
   * @param id - Unique identifier for this point
   * @param csExpr - Coordinate system expression that defines the transformation
   * @param localX - Local X coordinate (before transformation) - number, config key, or feature reference
   * @param localY - Local Y coordinate (before transformation) - number, config key, or feature reference
   */
  constructor(
    id: string,
    csExpr: CoordinateSystemExpression<TConfig>,
    localX: ParameterValue<TConfig>,
    localY: ParameterValue<TConfig>,
  ) {
    this.id = id;
    this.csId = csExpr.id;
    this.localX = localX;
    this.localY = localY;
    this.dependencies = [csExpr.id];
    this.parameters = [];

    // Track dependencies for localX
    if (isGeometryFeatureReference(localX)) {
      this.dependencies.push(localX.sourceId);
    } else if (typeof localX === "string") {
      this.parameters.push(localX as keyof TConfig);
    }

    // Track dependencies for localY
    if (isGeometryFeatureReference(localY)) {
      this.dependencies.push(localY.sourceId);
    } else if (typeof localY === "string") {
      this.parameters.push(localY as keyof TConfig);
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
    const stepId = createStepId(this.id);
    return {
      id: stepId,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs, params): Map<string, GeometryValue> => {
        const cs = getGeometry(inputs, this.csId, isCoordinateSystem, "CoordinateSystem", stepId);

        // Resolve parameterized coordinates
        const x = resolveParameter(inputs, params, this.localX, "localX");
        const y = resolveParameter(inputs, params, this.localY, "localY");

        // Apply coordinate system transformation with flip support
        // Formula from PRD Decision 2:
        // x_global = cs.x + (x_l * (flipX ? -1 : 1) * cos(θ)) - (y_l * sin(θ))
        // y_global = cs.y + (x_l * (flipX ? -1 : 1) * sin(θ)) + (y_l * cos(θ)) * (flipY ? -1 : 1)
        const rotation = cs.rotation ?? 0;
        const flipX = cs.flipX ?? false;
        const flipY = cs.flipY ?? false;
        const cosRot = Math.cos(rotation);
        const sinRot = Math.sin(rotation);

        const xSign = flipX ? -1 : 1;
        const ySign = flipY ? -1 : 1;

        const globalX = cs.x + (x * xSign) * cosRot - y * sinRot;
        const globalY = cs.y + (x * xSign) * sinRot + (y * cosRot) * ySign;

        return new Map([[this.id, point(globalX, globalY)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
