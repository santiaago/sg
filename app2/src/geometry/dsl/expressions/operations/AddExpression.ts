// Add expression for computing the sum of two numeric values

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point } from "@/types/geometry";
import type { GeometryExpression } from "../GeometryExpression";
import type { ParameterValue } from "../../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import { isGeometryFeatureReference } from "../../types";
import { createStepId, resolveParameter } from "../../utils";

/**
 * Expression that computes the sum of two numeric values (a + b).
 * The result is stored as a point where x = sum and y = 0.
 * Use `.value` to reference the computed sum.
 */
export class AddExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = false;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly aValue: ParameterValue<TConfig>;
  private readonly bValue: ParameterValue<TConfig>;

  /**
   * Create an add expression.
   *
   * @param id - Unique identifier for this addition
   * @param a - First operand (number, config key, or feature reference)
   * @param b - Second operand (number, config key, or feature reference)
   */
  constructor(id: string, a: ParameterValue<TConfig>, b: ParameterValue<TConfig>) {
    this.id = id;
    this.aValue = a;
    this.bValue = b;

    // Extract dependencies and parameters
    this.dependencies = [];
    this.parameters = [];

    if (isGeometryFeatureReference(a)) {
      this.dependencies.push(a.sourceId);
    } else if (typeof a === "string") {
      this.parameters.push(a as keyof TConfig);
    }

    if (isGeometryFeatureReference(b)) {
      this.dependencies.push(b.sourceId);
    } else if (typeof b === "string") {
      this.parameters.push(b as keyof TConfig);
    }
  }

  /**
   * Reference to the computed sum value.
   * Returns a GeometryFeatureReference that resolves to a + b.
   */
  get value(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  /**
   * Compile this expression into a Step.
   * Computes result = a + b.
   *
   * @param _renderer - The renderer to use for drawing (not used for arithmetic)
   * @returns A Step that computes the sum when executed
   */
  compile(_renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: createStepId(this.id),
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        params: TConfig,
      ): Map<string, GeometryValue> => {
        const a = resolveParameter(inputs, params, this.aValue, "a");
        const b = resolveParameter(inputs, params, this.bValue, "b");
        const result = a + b;
        return new Map([[this.id, point(result, 0)]]);
      },
      draw: (): void => {
        // Arithmetic expressions don't produce visible geometry by default
      },
    };
  }
}
