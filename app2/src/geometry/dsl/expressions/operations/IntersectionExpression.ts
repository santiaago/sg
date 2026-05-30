// Intersection expression for circle-line intersection operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point, CoordinateSystem } from "@/types/geometry";
import { isCircle, isLine, isPoint, point } from "@/types/geometry";
import { GeometryError } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { interceptCircleLineSegHelper } from "@/geometry/constructors";
import { inteceptCircleLineSeg } from "@sg/geometry";
import type { GeometryExpression } from "../GeometryExpression";
import type { CircleLikeExpression, LineLikeExpression } from "../types";
import { createStepId, transformPointToLocalSpace, getCoordinateSystem } from "../../utils";

/** Options for circle-line intersection */
export interface IntersectionOptions {
  /** ID of a point to exclude from results (for finding the "other" intersection) */
  excludeId?: string;
  /** Position hint: "left", "right", "north", or "south" */
  position?: "left" | "right" | "north" | "south";
  /** Tolerance for intersection calculation */
  tolerance?: number;
  /** ID of coordinate system to use for relative direction interpretation */
  relativeTo?: string;
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

    // Add relativeTo coordinate system to dependencies if present
    if (options.relativeTo) {
      this.dependencies.push(options.relativeTo);
    }

    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    // Determine index based on position option
    // left = 0, right = 1 (matching interceptCircleLineDirHelper semantics)
    const positionIndex = this.options.position === "right" ? 1 : 0;
    const stepId = createStepId(this.id);

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

        // Get relative coordinate system if specified
        const relativeCs = this.options.relativeTo
          ? getCoordinateSystem(inputs, this.options.relativeTo, stepId)
          : null;

        // If position is specified, use interceptCircleLineSegHelper with index
        if (this.options.position === "left" || this.options.position === "right") {
          // When relativeTo is specified, we need to get all intersections and select
          // based on the relative coordinate system
          if (relativeCs) {
            const allPoints = inteceptCircleLineSeg(
              circleVal.cx,
              circleVal.cy,
              lineVal.x1,
              lineVal.y1,
              lineVal.x2,
              lineVal.y2,
              circleVal.r,
            );

            if (!allPoints || allPoints.length === 0) {
              throw new GeometryError(
                stepId,
                this.id,
                "No intersection found between circle and line",
              );
            }

            // Transform each point to local space and select based on position
            const desiredIndex = this.options.position === "right" ? 1 : 0;
            const selectedPoint = this.selectPointByRelativePosition(
              allPoints,
              relativeCs,
              desiredIndex,
              stepId,
            );
            return new Map([[this.id, selectedPoint]]);
          } else {
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

  /**
   * Select a point from an array of intersection points based on relative position.
   * Transforms each point to the relative coordinate system's local space and
   * selects based on the x-coordinate (left/right).
   *
   * @param points - Array of [x, y] tuples in global coordinates
   * @param relativeCs - The coordinate system to use for relative positioning
   * @param desiredIndex - 0 for left, 1 for right
   * @param stepId - Step ID for error messages
   * @returns The selected point in global coordinates
   */
  private selectPointByRelativePosition(
    points: Array<[number, number]>,
    relativeCs: CoordinateSystem,
    desiredIndex: number,
    stepId: string,
  ): Point {
    // Transform each point to local space
    const localPoints = points.map(([x, y]) => {
      const globalPoint: Point = { type: "point", x, y };
      return transformPointToLocalSpace(globalPoint, relativeCs);
    });

    // Sort by x-coordinate (left to right in local space)
    localPoints.sort((a, b) => a.x - b.x);

    // Select the desired point
    if (desiredIndex >= 0 && desiredIndex < localPoints.length) {
      const selectedLocal = localPoints[desiredIndex];
      // Transform back to global coordinates
      // We need to apply the coordinate system transformation
      const rotation = relativeCs.rotation ?? 0;
      const flipX = relativeCs.flipX ?? false;
      const flipY = relativeCs.flipY ?? false;
      const cosRot = Math.cos(rotation);
      const sinRot = Math.sin(rotation);
      const xSign = flipX ? -1 : 1;
      const ySign = flipY ? -1 : 1;

      const globalX = relativeCs.x + (selectedLocal.x * xSign) * cosRot - selectedLocal.y * sinRot;
      const globalY = relativeCs.y + (selectedLocal.x * xSign) * sinRot + (selectedLocal.y * cosRot) * ySign;

      return point(globalX, globalY);
    }

    throw new GeometryError(
      stepId,
      this.id,
      `No intersection point at index ${desiredIndex} (got ${localPoints.length} points)`,
    );
  }
}
