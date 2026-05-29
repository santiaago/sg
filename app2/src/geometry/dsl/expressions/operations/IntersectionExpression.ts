// Intersection expression for circle-line intersection operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { isCircle, isLine, isPoint, point } from "@/types/geometry";
import { GeometryError } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { pointFromCircleAndLine, interceptCircleLineSegHelper } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { CircleLikeExpression, LineLikeExpression } from "../types";
import { createStepId } from "../../utils";

/** Options for circle-line intersection */
export interface IntersectionOptions {
  /** ID of a point to exclude from results (for finding the "other" intersection) */
  excludeId?: string;
  /** Position hint: "left", "right", "north", or "south" */
  position?: "left" | "right" | "north" | "south";
  /** Tolerance for intersection calculation */
  tolerance?: number;
}

/**
 * Expression for a circle-line intersection point.
 * Finds where a circle intersects with a line.
 */
export class IntersectionExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly circleId: string;
  private readonly lineId: string;
  private readonly options: IntersectionOptions;

  /**
   * Create an intersection expression.
   *
   * @param id - Unique identifier for this intersection point
   * @param circle - Circle expression (any circle-like expression)
   * @param line - Line expression (any line-like expression)
   * @param options - Intersection options (excludeId, position, tolerance)
   */
  constructor(
    id: string,
    circle: CircleLikeExpression<TConfig>,
    line: LineLikeExpression<TConfig>,
    options: IntersectionOptions = {},
  ) {
    this.id = id;
    this.circleId = circle.id;
    this.lineId = line.id;
    this.options = options;
    this.dependencies = [circle.id, line.id];

    // Add excludeId to dependencies if present
    if (options.excludeId) {
      this.dependencies.push(options.excludeId);
    }

    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    // Determine index based on position option
    // left = 0, right = 1 (matching interceptCircleLineDirHelper semantics)
    const positionIndex = this.options.position === "right" ? 1 : 0;
    const stepId = createStepId(renderer.namespace, this.id);

    return {
      id: stepId,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        config: TConfig,
      ): Map<string, GeometryValue> => {
        const circleVal = getGeometry(inputs, this.circleId, isCircle, "Circle", stepId);
        const lineVal = getGeometry(inputs, this.lineId, isLine, "Line", stepId);

        // If position is specified, use interceptCircleLineSegHelper with index
        if (this.options.position === "left" || this.options.position === "right") {
          const result = interceptCircleLineSegHelper(circleVal, lineVal, positionIndex);
          if (!result) {
            throw new GeometryError(
              stepId,
              this.id,
              "No intersection found between circle and line",
            );
          }
          return new Map([[this.id, result]]);
        }

        // Build exclude point if provided
        let excludePoint: Point | undefined;
        if (this.options.excludeId) {
          const excludeVal = getGeometry(inputs, this.options.excludeId, isPoint, "Point", stepId);
          excludePoint = point(excludeVal.x, excludeVal.y);
        }

        // Build options for pointFromCircleAndLine
        const computeOptions = {
          exclude: excludePoint,
          tolerance: this.options.tolerance ?? (config as any).tolerance ?? 0.001,
        };

        const result = pointFromCircleAndLine(circleVal, lineVal, computeOptions);

        if (!result) {
          throw new GeometryError(stepId, this.id, "No intersection found between circle and line");
        }

        return new Map([[this.id, result]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme, stepId);
      },
    };
  }
}
