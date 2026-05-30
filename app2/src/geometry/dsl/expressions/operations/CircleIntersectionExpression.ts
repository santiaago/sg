// CircleIntersection expression for circle-circle intersection operation

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point, CoordinateSystem } from "@/types/geometry";
import { isCircle, point } from "@/types/geometry";
import { GeometryError } from "@/types/geometry";
import { getGeometry } from "@/geometry/operations";
import { rawIntersection } from "@sg/geometry";
import type { GeometryExpression } from "../GeometryExpression";
import type { CircleLikeExpression } from "../types";
import { createStepId, transformPointToLocalSpace, getCoordinateSystem } from "../../utils";

/** Options for circle-circle intersection */
export interface CircleIntersectionOptions {
  /** Which intersection point to select: "north" (lower y), "south" (higher y), "west" (lower x), or "east" (higher x) in SVG coordinates */
  select?: "north" | "south" | "west" | "east";
  /** ID of coordinate system to use for relative direction interpretation */
  relativeTo?: string;
}

/**
 * Expression for a circle-circle intersection point.
 * Finds where two circles intersect.
 */
export class CircleIntersectionExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly c1Id: string;
  private readonly c2Id: string;
  private readonly options: CircleIntersectionOptions;

  /**
   * Create a circle-circle intersection expression.
   *
   * @param id - Unique identifier for this intersection point
   * @param c1 - First circle expression (any circle-like expression)
   * @param c2 - Second circle expression (any circle-like expression)
   * @param options - Intersection options (select north or south)
   */
  constructor(
    id: string,
    c1: CircleLikeExpression<TConfig>,
    c2: CircleLikeExpression<TConfig>,
    options: CircleIntersectionOptions = {},
  ) {
    this.id = id;
    this.c1Id = c1.id;
    this.c2Id = c2.id;
    this.options = options;
    this.dependencies = [c1.id, c2.id];

    // Add relativeTo coordinate system to dependencies if present
    if (options.relativeTo) {
      this.dependencies.push(options.relativeTo);
    }

    this.parameters = [];
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
        _config: TConfig,
      ): Map<string, GeometryValue> => {
        const c1Val = getGeometry(inputs, this.c1Id, isCircle, "Circle", stepId);
        const c2Val = getGeometry(inputs, this.c2Id, isCircle, "Circle", stepId);

        // Get relative coordinate system if specified
        const relativeCs = this.options.relativeTo
          ? getCoordinateSystem(inputs, this.options.relativeTo, stepId)
          : null;

        // If relativeTo is specified, we need to get all intersections and select
        // based on the relative coordinate system
        if (relativeCs && this.options.select) {
          const result = rawIntersection(
            c1Val.cx,
            c1Val.cy,
            c1Val.r,
            c2Val.cx,
            c2Val.cy,
            c2Val.r,
          );

          if (!result || result.length !== 4) {
            throw new GeometryError(stepId, this.id, "No intersection found between circles");
          }

          const [x1, y1, x2, y2] = result;
          const points: Array<[number, number]> = [
            [x1, y1],
            [x2, y2],
          ];

          const selectedPoint = this.selectPointByRelativeDirection(
            points,
            relativeCs,
            this.options.select,
            stepId,
          );

          return new Map([[this.id, selectedPoint]]);
        } else {
          // Use the standard selection logic
          const result = pointFromCircles(c1Val, c2Val, {
            select: this.options.select,
          });

          if (!result) {
            throw new GeometryError(stepId, this.id, "No intersection found between circles");
          }

          return new Map([[this.id, result]]);
        }
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme, stepId);
      },
    };
  }

  /**
   * Select a point from an array of intersection points based on relative direction.
   * Transforms each point to the relative coordinate system's local space and
   * selects based on the specified direction (north, south, east, west).
   *
   * @param points - Array of [x, y] tuples in global coordinates
   * @param relativeCs - The coordinate system to use for relative positioning
   * @param direction - The direction to select (north, south, east, west)
   * @param stepId - Step ID for error messages
   * @returns The selected point in global coordinates
   */
  private selectPointByRelativeDirection(
    points: Array<[number, number]>,
    relativeCs: CoordinateSystem,
    direction: "north" | "south" | "west" | "east",
    stepId: string,
  ): Point {
    // Transform each point to local space
    const localPoints = points.map(([x, y]) => {
      const globalPoint: Point = { type: "point", x, y };
      return transformPointToLocalSpace(globalPoint, relativeCs);
    });

    // Select based on direction in local space
    let selectedLocal: Point;

    if (direction === "north") {
      // Pick north point (lower y-coordinate in local space)
      selectedLocal = localPoints.reduce((a, b) => (a.y < b.y ? a : b));
    } else if (direction === "south") {
      // Pick south point (higher y-coordinate)
      selectedLocal = localPoints.reduce((a, b) => (a.y > b.y ? a : b));
    } else if (direction === "west") {
      // Pick west point (lower x-coordinate)
      selectedLocal = localPoints.reduce((a, b) => (a.x < b.x ? a : b));
    } else {
      // Pick east point (higher x-coordinate)
      selectedLocal = localPoints.reduce((a, b) => (a.x > b.x ? a : b));
    }

    // Transform back to global coordinates
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
}
