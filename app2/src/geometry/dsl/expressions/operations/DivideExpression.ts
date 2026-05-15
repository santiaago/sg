// Divide expression for computing the quotient of two numeric values

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue, Point } from "@/types/geometry";
import { point } from "@/types/geometry";
import type { GeometryExpression } from "../GeometryExpression";
import type { ParameterValue } from "../../types";
import { GeometryFeatureReference } from "../../GeometryFeatureReference";
import { isGeometryFeatureReference } from "../../types";
import { resolveParameter } from "../../utils";

/**
 * Expression that computes the quotient of two numeric values (a / b).
 * The result is stored as a point where x = quotient and y = 0.
 * Use `.value` to reference the computed quotient.
 * Returns NaN if dividing by zero (matches JavaScript behavior).
 */
export class DivideExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[];

  private readonly aValue: ParameterValue<TConfig>;
  private readonly bValue: ParameterValue<TConfig>;

  /**
   * Create a divide expression.
   *
   * @param id - Unique identifier for this division
   * @param a - First operand (dividend) - number, config key, or feature reference
   * @param b - Second operand (divisor) - number, config key, or feature reference
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
   * Reference to the computed quotient value.
   * Returns a GeometryFeatureReference that resolves to a / b.
   */
  get value(): GeometryFeatureReference<TConfig, Point, "x"> {
    return new GeometryFeatureReference(this, "x");
  }

  /**
   * Compile this expression into a Step.
   * Computes result = a / b.
   * Returns NaN if b is 0 (matches JavaScript behavior).
   *
   * @param _renderer - The renderer to use for drawing (not used for arithmetic)
   * @returns A Step that computes the quotient when executed
   */
  compile(_renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: `step_${this.id}`,
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        params: TConfig,
      ): Map<string, GeometryValue> => {
        const a = resolveParameter(inputs, params, this.aValue, "a");
        const b = resolveParameter(inputs, params, this.bValue, "b");
        const result = a / b; // NaN if b is 0
        return new Map([[this.id, point(result, 0)]]);
      },
      draw: (): void => {
        // Arithmetic expressions don't produce visible geometry by default
      },
    };
  }
}
