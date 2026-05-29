// Polygon expression for polygon geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue, Theme } from "@/types/geometry";
import { polygon, isPoint } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";
import type { PointLikeExpression } from "./types";
import { createStepId } from "../utils";

/**
 * Style options for polygon geometry.
 * Allows customizing stroke width and color for special polygons like the final square.
 */
export interface PolygonStyleOptions {
  /** Stroke width for the polygon outline. Defaults to theme stroke width. */
  strokeWidth?: number;
  /** Stroke color for the polygon outline. Defaults to theme.COLOR_PRIMARY. */
  strokeColor?: string | ((theme: Theme) => string);
}

/**
 * Expression for a polygon geometry.
 * Constructed from an array of point expressions.
 */
export class PolygonExpression<TConfig> implements GeometryExpression<TConfig, "polygon"> {
  readonly id: string;
  readonly type = "polygon" as const;
  readonly isVisual = true;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly pointIds: readonly string[];
  private readonly styleOptions?: PolygonStyleOptions;

  /**
   * Create a polygon expression from an array of point expressions.
   * Accepts any expressions that produce points.
   *
   * @param id - Unique identifier for this polygon
   * @param points - Array of point-like expressions defining the polygon vertices
   * @param options - Optional style options (strokeWidth, strokeColor)
   */
  constructor(id: string, points: PointLikeExpression<TConfig>[], options?: PolygonStyleOptions) {
    this.id = id;
    this.pointIds = points.map((p) => p.id);
    this.dependencies = [...this.pointIds];
    this.parameters = [];
    this.styleOptions = options;
  }

  /**
   * Get the style options for this polygon.
   */
  getStyleOptions(): PolygonStyleOptions | undefined {
    return this.styleOptions;
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    const styleOptions = this.styleOptions;
    const stepId = createStepId(renderer.namespace, this.id);

    return {
      id: stepId,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (inputs: Map<string, GeometryValue>): Map<string, GeometryValue> => {
        const polygonPoints: { x: number; y: number }[] = [];

        for (const pointId of this.pointIds) {
          const pt = inputs.get(pointId);

          if (!pt) {
            throw new Error(`PolygonExpression ${this.id}: missing point value for ${pointId}`);
          }

          if (!isPoint(pt)) {
            throw new Error(`PolygonExpression ${this.id}: expected Point for ${pointId}`);
          }

          polygonPoints.push({ x: pt.x, y: pt.y });
        }

        return new Map([[this.id, polygon(polygonPoints)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPolygon(svg, values, this.id, store, theme, styleOptions, stepId);
      },
    };
  }
}
