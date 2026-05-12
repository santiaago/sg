// LineTowards expression for extended line operation
// Creates a line from a start point through an end point with a specific length

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Line } from "@/types/geometry";
import { isPoint, line } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointLikeExpression } from "../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import type { ParameterValue } from "../../types";
import { isGeometryFeatureReference } from "../../types";
import { resolveParameter } from "../../utils";
import type { LineWithLength } from "../types";
import type { LineStyleOptions } from "../LineExpression";

/**
 * Expression for an extended line from a start point through an end point.
 * Used for creating lines that extend beyond the end point by a specified length.
 * Supports parameterized length (literal numbers, config parameters, or feature references).
 */
export class LineTowardsExpression<TConfig> implements GeometryExpression<TConfig, "line"> {
  readonly id: string;
  readonly type = "line" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly startId: string;
  private readonly endId: string;
  private readonly lengthParam: ParameterValue<TConfig>;
  private readonly styleOptions?: LineStyleOptions;

  /**
   * Create a line-towards expression.
   *
   * @param id - Unique identifier for this line
   * @param start - Start point expression (origin of the line, any point-like expression)
   * @param end - End point expression (direction of the line, any point-like expression)
   * @param length - Length of the extended line (number, config key, or feature reference)
   * @param options - Optional style options (strokeWidth, strokeColor)
   */
  constructor(
    id: string,
    start: PointLikeExpression<TConfig>,
    end: PointLikeExpression<TConfig>,
    length: ParameterValue<TConfig>,
    options?: LineStyleOptions,
  ) {
    this.id = id;
    this.startId = start.id;
    this.endId = end.id;
    this.lengthParam = length;
    this.styleOptions = options;
    this.dependencies = [start.id, end.id];
    this.parameters = [];

    // Track dependencies based on length type
    if (isGeometryFeatureReference(length)) {
      this.dependencies.push(length.sourceId);
    } else if (typeof length === "string") {
      this.parameters.push(length as keyof TConfig);
    }
  }

  /**
   * Get the style options for this line.
   */
  getStyleOptions(): LineStyleOptions | undefined {
    return this.styleOptions;
  }

  // ========================================
  // Feature Accessors
  // ========================================

  /**
   * Access the start x-coordinate as a feature reference.
   */
  get x1(): GeometryFeatureReference<TConfig, Line, "x1"> {
    return new GeometryFeatureReference(this, "x1");
  }

  /**
   * Access the start y-coordinate as a feature reference.
   */
  get y1(): GeometryFeatureReference<TConfig, Line, "y1"> {
    return new GeometryFeatureReference(this, "y1");
  }

  /**
   * Access the end x-coordinate as a feature reference.
   */
  get x2(): GeometryFeatureReference<TConfig, Line, "x2"> {
    return new GeometryFeatureReference(this, "x2");
  }

  /**
   * Access the end y-coordinate as a feature reference.
   */
  get y2(): GeometryFeatureReference<TConfig, Line, "y2"> {
    return new GeometryFeatureReference(this, "y2");
  }

  /**
   * Access the line length as a feature reference.
   * Note: This returns a reference to the input length parameter, not the computed line length.
   */
  get length(): GeometryFeatureReference<TConfig, LineWithLength, "length"> {
    return new GeometryFeatureReference(this, "length" as any);
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    const styleOptions = this.styleOptions;

    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        params: TConfig,
      ): Map<string, GeometryValue> => {
        const startVal = getGeometry(inputs, this.startId, isPoint, "Point", `step_${this.id}`);
        const endVal = getGeometry(inputs, this.endId, isPoint, "Point", `step_${this.id}`);

        const len = resolveParameter(inputs, params, this.lengthParam, "length");

        // Calculate extended line manually (matching lineTowards logic)
        const dx = endVal.x - startVal.x;
        const dy = endVal.y - startVal.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const scale = len / lineLength;

        const x2 = startVal.x + dx * scale;
        const y2 = startVal.y + dy * scale;

        return new Map([[this.id, line(startVal.x, startVal.y, x2, y2)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawLine(svg, values, this.id, store, theme, styleOptions);
      },
    };
  }
}
