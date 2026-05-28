// Vector expression for computing vector (dx, dy) between two points or coordinate systems

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point, isPoint, isCoordinateSystem } from "@/types/geometry";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointLikeExpression, CoordinateSystemLikeExpression } from "../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import { createStepId } from "../../utils";

/**
 * Expression that computes the vector (dx, dy) between two geometry objects.
 * The result is stored as a point where x=dx and y=dy.
 * Use `.dx` and `.dy` to reference the vector components.
 */
export class VectorExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = false;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[] = [];

  private readonly fromId: string;
  private readonly toId: string;

  /**
   * Create a vector expression.
   *
   * @param id - Unique identifier for this vector
   * @param from - Source geometry expression (point or coordinate system)
   * @param to - Target geometry expression (point or coordinate system)
   */
  constructor(
    id: string,
    from: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
    to: PointLikeExpression<TConfig> | CoordinateSystemLikeExpression<TConfig>,
  ) {
    this.id = id;
    this.fromId = from.id;
    this.toId = to.id;
    this.dependencies = [from.id, to.id];
  }

  /**
   * Reference to the x-component (dx) of the vector.
   * Returns a GeometryFeatureReference that resolves to the computed dx value.
   */
  get dx(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  /**
   * Reference to the y-component (dy) of the vector.
   * Returns a GeometryFeatureReference that resolves to the computed dy value.
   */
  get dy(): GeometryFeatureReference<TConfig, Point, "y"> {
    return new GeometryFeatureReference(this, "y");
  }

  /**
   * Compile this expression into a Step.
   * Computes dx = to.x - from.x and dy = to.y - from.y.
   *
   * @param _renderer - The renderer to use for drawing (not used for vector computation)
   * @returns A Step that computes the vector when executed
   */
  compile(_renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: createStepId(this.id),
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _params: TConfig,
      ): Map<string, GeometryValue> => {
        const fromValue = inputs.get(this.fromId);
        const toValue = inputs.get(this.toId);

        if (!fromValue) {
          throw new Error(`VectorExpression ${this.id}: missing source geometry '${this.fromId}'`);
        }
        if (!toValue) {
          throw new Error(`VectorExpression ${this.id}: missing target geometry '${this.toId}'`);
        }

        // Extract coordinates - works for both Point and CoordinateSystem
        let fromX: number;
        let fromY: number;
        if (isPoint(fromValue)) {
          fromX = fromValue.x;
          fromY = fromValue.y;
        } else if (isCoordinateSystem(fromValue)) {
          fromX = fromValue.x;
          fromY = fromValue.y;
        } else {
          throw new Error(`VectorExpression ${this.id}: unsupported source geometry type`);
        }

        let toX: number;
        let toY: number;
        if (isPoint(toValue)) {
          toX = toValue.x;
          toY = toValue.y;
        } else if (isCoordinateSystem(toValue)) {
          toX = toValue.x;
          toY = toValue.y;
        } else {
          throw new Error(`VectorExpression ${this.id}: unsupported target geometry type`);
        }

        const dx = toX - fromX;
        const dy = toY - fromY;

        return new Map([[this.id, point(dx, dy)]]);
      },
      draw: (): void => {
        // Vector expressions don't produce visible geometry by default
      },
    };
  }
}
