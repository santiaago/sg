// Shared utility functions for the parameterized geometry DSL

import type { GeometryValue } from "@/types/geometry";
import type { ParameterValue } from "./types";
import { isGeometryFeatureReference } from "./types";

/**
 * Resolve a parameter value to a number.
 * Handles all three parameter sources: literal numbers, config parameters, and feature references.
 *
 * @param inputs - Map of geometry IDs to their computed values
 * @param params - The configuration object
 * @param value - The parameter value to resolve
 * @param paramName - Name of the parameter (for error messages)
 * @returns The resolved numeric value
 * @throws Error if the value cannot be resolved or is not a number
 *
 * @example
 * ```typescript
 * const radius = resolveParameter(inputs, params, circle.radiusParam, "radius");
 * ```
 */
export function resolveParameter<TConfig>(
  inputs: Map<string, GeometryValue>,
  params: TConfig,
  value: ParameterValue<TConfig>,
  paramName: string,
): number {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const result = params[value as keyof TConfig];
    if (result === undefined) {
      throw new Error(`Missing config parameter: ${value}`);
    }
    if (typeof result !== "number") {
      throw new Error(`Config parameter ${value} is not a number (got ${typeof result})`);
    }
    return result;
  } else if (isGeometryFeatureReference(value)) {
    // Value is a GeometryFeatureReferenceLike (structural type from ParameterValue)
    // It must have sourceId and property. We use the structural resolution.
    const sourceValue = inputs.get(value.sourceId);
    if (!sourceValue) {
      throw new Error(`GeometryFeatureReference: source geometry '${value.sourceId}' not found`);
    }
    const propValue = (sourceValue as any)[value.property];
    if (typeof propValue !== "number") {
      throw new Error(
        `GeometryFeatureReference: property '${String(value.property)}' on ` +
          `'${value.sourceId}' is not a number (got ${typeof propValue})`,
      );
    }
    return propValue;
  }
  throw new Error(
    `Invalid ${paramName} type: expected number, string, or GeometryFeatureReference`,
  );
}
