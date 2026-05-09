// Coordinate system expression for coordinate system geometry

import type { GeometryRenderer } from "../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { coordinateSystem } from "@/types/geometry";
import type { GeometryExpression } from "./GeometryExpression";

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

  private readonly x: number;
  private readonly y: number;
  private readonly arrowLength: number;
  private readonly rotation: number;

  /**
   * Create a coordinate system expression.
   *
   * @param id - Unique identifier for this coordinate system
   * @param x - X position of the origin
   * @param y - Y position of the origin
   * @param arrowLength - Length of the axis arrows
   * @param rotation - Optional rotation angle in radians (default: 0)
   */
  constructor(id: string, x: number, y: number, arrowLength: number, rotation: number = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.arrowLength = arrowLength;
    this.rotation = rotation;
    this.dependencies = [];
    this.parameters = [];
  }

  compile(renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (): Map<string, GeometryValue> => {
        return new Map([
          [this.id, coordinateSystem(this.x, this.y, this.arrowLength, this.rotation)],
        ]);
      },
      draw: (svg, values, store, theme): void => {
        renderer.drawCoordinateSystem(svg, values, this.id, store, theme);
      },
    };
  }
}
