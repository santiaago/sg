// Point expression for primitive point geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { point } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";

/**
 * Expression for a primitive point geometry.
 * Points are the most basic geometry type with x and y coordinates.
 */
export class PointExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly x: number;
  private readonly y: number;

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
    this.x = x;
    this.y = y;
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (): Map<string, GeometryValue> => {
        return new Map([[this.id, point(this.x, this.y)]]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawPoint(svg, values, this.id, store, theme);
      },
    };
  }
}
