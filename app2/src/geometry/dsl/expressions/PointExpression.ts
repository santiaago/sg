// Point expression for primitive point geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import { GeometryFeatureReference } from "../GeometryFeatureReference";
import { createStepId } from "../utils";

/**
 * Expression for a primitive point geometry.
 * Points are the most basic geometry type with x and y coordinates.
 */
export class PointExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly xCoord: number;
  private readonly yCoord: number;

  /**
   * Create a point expression with explicit coordinates.
   *
   * @param id - Unique identifier for this point
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.dependencies = [];
    this.parameters = [];
    this.xCoord = x;
    this.yCoord = y;
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
      compute: (): Map<string, GeometryValue> => {
        return new Map([[this.id, point(this.xCoord, this.yCoord)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
