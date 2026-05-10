// Coordinate system expression for coordinate system geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, CoordinateSystem } from "@/types/geometry";
import { coordinateSystem } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { ParameterValue } from "../types";
import { isGeometryFeatureReference } from "../types";
import { resolveParameter } from "../utils";

/**
 * Expression for a coordinate system geometry.
 * Represents the X and Y axes with arrows at the origin.
 */
export class CoordinateSystemExpression<TConfig> implements GeometryExpression<
  TConfig,
  "coordinate_system"
> {
  readonly id: string;
  readonly type = "coordinate_system" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly xCoord: ParameterValue<TConfig>;
  private readonly yCoord: ParameterValue<TConfig>;
  private readonly arrowLengthVal: ParameterValue<TConfig>;
  private readonly rotationVal: ParameterValue<TConfig>;

  /**
   * Create a coordinate system expression.
   *
   * @param id - Unique identifier for this coordinate system
   * @param x - X position of the origin (number, config key, or feature reference)
   * @param y - Y position of the origin (number, config key, or feature reference)
   * @param arrowLength - Length of the axis arrows (number, config key, or feature reference)
   * @param rotation - Rotation angle in radians (number, config key, or feature reference) (default: 0)
   */
  constructor(
    id: string,
    x: ParameterValue<TConfig> = 0,
    y: ParameterValue<TConfig> = 0,
    arrowLength: ParameterValue<TConfig> = 0,
    rotation: ParameterValue<TConfig> = 0,
  ) {
    this.id = id;
    this.xCoord = x;
    this.yCoord = y;
    this.arrowLengthVal = arrowLength;
    this.rotationVal = rotation;
    this.dependencies = [];
    this.parameters = [];

    // Track dependencies for each parameter
    [x, y, arrowLength, rotation].forEach((val) => {
      if (isGeometryFeatureReference(val)) {
        this.dependencies.push(val.sourceId);
      } else if (typeof val === "string") {
        this.parameters.push(val as keyof TConfig);
      }
    });
  }

  // ========================================
  // Feature Accessors
  // ========================================

  /**
   * Access the origin x-coordinate as a feature reference.
   */
  get x(): GeometryFeatureReference<TConfig, CoordinateSystem, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  /**
   * Access the origin y-coordinate as a feature reference.
   */
  get y(): GeometryFeatureReference<TConfig, CoordinateSystem, "y"> {
    return new GeometryFeatureReference(this, "y");
  }

  /**
   * Access the arrow length as a feature reference.
   */
  get arrowLength(): GeometryFeatureReference<TConfig, CoordinateSystem, "arrowLength"> {
    return new GeometryFeatureReference(this, "arrowLength");
  }

  /**
   * Access the rotation as a feature reference.
   */
  get rotation(): GeometryFeatureReference<TConfig, CoordinateSystem, "rotation"> {
    return new GeometryFeatureReference(this, "rotation");
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>, params: TConfig): Map<string, GeometryValue> => {
        const x = resolveParameter(inputs, params, this.xCoord, "x");
        const y = resolveParameter(inputs, params, this.yCoord, "y");
        const arrowLength = resolveParameter(inputs, params, this.arrowLengthVal, "arrowLength");
        const rotation = resolveParameter(inputs, params, this.rotationVal, "rotation");
        return new Map([
          [
            this.id,
            coordinateSystem(x, y, arrowLength, rotation),
          ],
        ]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawCoordinateSystem(svg, values, this.id, store, theme);
      },
    };
  }
}
