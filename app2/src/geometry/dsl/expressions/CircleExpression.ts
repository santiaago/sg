// Circle expression for circle geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, Circle } from "@/types/geometry";
import { circle, isPoint } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import type { PointLikeExpression } from "./types";
import { GeometryFeatureReference } from "../GeometryFeatureReference";
import type { ParameterValue } from "../types";
import { isGeometryFeatureReference } from "../types";
import { createStepId, resolveParameter } from "../utils";

/**
 * Expression for a circle geometry.
 * Requires a center point (any point-like expression) and a radius.
 * Supports parameterized radius values (literal numbers, config parameters, or feature references).
 */
export class CircleExpression<TConfig> implements GeometryExpression<TConfig, "circle"> {
  readonly id: string;
  readonly type = "circle" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly centerId: string;
  private readonly radiusParam: ParameterValue<TConfig>;

  /**
   * Create a circle expression.
   *
   * @param id - Unique identifier for this circle
   * @param center - Center point expression (any expression that produces a point)
   * @param radius - Radius of the circle (number, config key, or feature reference)
   */
  constructor(id: string, center: PointLikeExpression<TConfig>, radius: ParameterValue<TConfig>) {
    this.id = id;
    this.centerId = center.id;
    this.radiusParam = radius;
    this.dependencies = [center.id];
    this.parameters = [];

    // Track dependencies based on radius type
    if (isGeometryFeatureReference(radius)) {
      this.dependencies.push(radius.sourceId);
    } else if (typeof radius === "string") {
      this.parameters.push(radius as keyof TConfig);
    }
    // Numeric literals: no additional dependencies
  }

  // ========================================
  // Feature Accessors
  // ========================================

  /**
   * Access the center x-coordinate as a feature reference.
   * Note: This creates a reference to the computed circle's cx property.
   */
  get cx(): GeometryFeatureReference<TConfig, Circle, "cx"> {
    return new GeometryFeatureReference(this, "cx");
  }

  /**
   * Access the center y-coordinate as a feature reference.
   * Note: This creates a reference to the computed circle's cy property.
   */
  get cy(): GeometryFeatureReference<TConfig, Circle, "cy"> {
    return new GeometryFeatureReference(this, "cy");
  }

  /**
   * Access the radius as a feature reference (abbreviation).
   * Note: This creates a reference to the computed circle's r property.
   */
  get r(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return new GeometryFeatureReference(this, "r");
  }

  /**
   * Access the radius as a feature reference (full name).
   * Alias for `r`.
   */
  get radius(): GeometryFeatureReference<TConfig, Circle, "r"> {
    return this.r;
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
        params: TConfig,
      ): Map<string, GeometryValue> => {
        const center = inputs.get(this.centerId);

        if (!center) {
          throw new Error(`CircleExpression ${this.id}: missing center point value`);
        }

        if (!isPoint(center)) {
          throw new Error(`CircleExpression ${this.id}: expected Point for center`);
        }

        const r = resolveParameter(inputs, params, this.radiusParam, "radius");
        return new Map([[this.id, circle(center.x, center.y, r)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawCircle(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
