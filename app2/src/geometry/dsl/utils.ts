// Shared utility functions for the parameterized geometry DSL

import type { GeometryValue, Point, CoordinateSystem } from "@/types/geometry";
import type { ParameterValue } from "./types";
import { isGeometryFeatureReference, isCoordinateSystem } from "./types";
import { getGeometry } from "../operations";

/**
 * Create a step ID from a geometry expression ID.
 * All steps follow the naming convention: step_<expressionId>
 *
 * @param id - The geometry expression ID
 * @returns The corresponding step ID
 */
export function createStepId(id: string): string {
  return `step_${id}`;
}

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
  }

  if (typeof value === "string") {
    const result = params[value as keyof TConfig];
    if (result === undefined) {
      throw new Error(`Missing config parameter: ${value}`);
    }
    if (typeof result !== "number") {
      throw new Error(`Config parameter ${value} is not a number (got ${typeof result})`);
    }
    return result;
  }

  if (isGeometryFeatureReference(value)) {
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

/**
 * Transform a global point to a coordinate system's local space.
 * This is the inverse of the transformation applied in PointInCoordinateSystemExpression.
 * Used for interpreting direction-based selections relative to a specific coordinate system.
 *
 * @param globalPoint - The point in global SVG coordinates
 * @param cs - The coordinate system to transform into
 * @returns The point in the coordinate system's local space
 */
export function transformPointToLocalSpace(
  globalPoint: Point,
  cs: CoordinateSystem,
): Point {
  const rotation = cs.rotation ?? 0;
  const flipX = cs.flipX ?? false;
  const flipY = cs.flipY ?? false;
  const cosRot = Math.cos(rotation);
  const sinRot = Math.sin(rotation);

  const xSign = flipX ? -1 : 1;
  const ySign = flipY ? -1 : 1;

  // Inverse transformation:
  // We need to reverse the transformation applied in PointInCoordinateSystemExpression:
  // globalX = cs.x + (localX * xSign) * cosRot - localY * sinRot
  // globalY = cs.y + (localX * xSign) * sinRot + (localY * cosRot) * ySign
  //
  // Solving for localX and localY:
  // Let dx = globalX - cs.x, dy = globalY - cs.y
  // dx = (localX * xSign) * cosRot - localY * sinRot
  // dy = (localX * xSign) * sinRot + (localY * cosRot) * ySign
  //
  // This is a linear system: [cosRot*(xSign)   -sinRot] [localX] = [dx]
  //                           [sinRot*(xSign)   cosRot*(ySign)] [localY]   [dy]
  //
  // The determinant is: cosRot*(xSign)*cosRot*(ySign) - (-sinRot)*sinRot*(xSign)
  //                  = xSign * ySign * cosRot^2 + xSign * sinRot^2
  //                  = xSign * (ySign * cosRot^2 + sinRot^2)
  //
  // Using Cramer's rule or matrix inversion:
  // The inverse matrix is:
  // [ cosRot*(xSign)    sinRot        ]
  // [ -sinRot/(ySign)   cosRot/(xSign*ySign) ]
  // divided by determinant
  //
  // Actually, let's use a simpler approach. The transformation matrix is:
  // M = [xSign*cosRot   -sinRot]
  //     [xSign*sinRot    ySign*cosRot]
  //
  // det(M) = xSign*cosRot * ySign*cosRot - (-sinRot)*xSign*sinRot
  //        = xSign*ySign*cosRot^2 + xSign*sinRot^2
  //        = xSign * (ySign*cosRot^2 + sinRot^2)
  //
  // For flipX=false, flipY=false: det = 1*(1*cosRot^2 + sinRot^2) = cosRot^2 + sinRot^2 = 1
  // For flipX=true, flipY=false: det = -1*(1*cosRot^2 + sinRot^2) = -1
  // For flipX=false, flipY=true: det = 1*(-1*cosRot^2 + sinRot^2) = sinRot^2 - cosRot^2
  // For flipX=true, flipY=true: det = -1*(-1*cosRot^2 + sinRot^2) = cosRot^2 - sinRot^2
  //
  // The inverse matrix is:
  // M^-1 = (1/det) * [ySign*cosRot    sinRot]
  //                   [-xSign*sinRot   xSign*cosRot]
  //
  // Wait, let me recalculate. For matrix [a b; c d], inverse is (1/det) * [d -b; -c a]
  // So for M = [a b; c d] where:
  // a = xSign*cosRot, b = -sinRot
  // c = xSign*sinRot, d = ySign*cosRot
  //
  // M^-1 = (1/det) * [d  -b; -c  a]
  //              = (1/det) * [ySign*cosRot   sinRot]
  //                           [-xSign*sinRot   xSign*cosRot]
  
  const dx = globalPoint.x - cs.x;
  const dy = globalPoint.y - cs.y;

  // Calculate determinant
  const det = xSign * ySign * cosRot * cosRot + xSign * sinRot * sinRot;
  
  // Apply inverse transformation
  const localX = (ySign * cosRot * dx + sinRot * dy) / det;
  const localY = (-xSign * sinRot * dx + xSign * cosRot * dy) / det;

  return { type: "point", x: localX, y: localY };
}

/**
 * Get a coordinate system from inputs and validate it.
 * Helper function for use in step compute functions.
 *
 * @param inputs - Map of geometry IDs to their computed values
 * @param csId - The coordinate system ID to retrieve
 * @param stepId - The step ID (for error messages)
 * @returns The coordinate system
 * @throws GeometryError if not found or not a coordinate system
 */
export function getCoordinateSystem(
  inputs: Map<string, GeometryValue>,
  csId: string,
  stepId: string,
): CoordinateSystem {
  return getGeometry(inputs, csId, isCoordinateSystem, "CoordinateSystem", stepId);
}
