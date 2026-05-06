// Adapter to convert Construction steps to the existing Step format.
// This allows the new Construction DSL to integrate with the existing step system.

import type { Step, GeometryValue, Theme } from "../types/geometry";
import type { GeometryStore } from "../react-store";
import { Construction } from "./construction";

/**
 * Internal step representation from Construction.
 * This is what Construction._steps contains.
 */
export interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}

/**
 * No-op draw function for adapter steps.
 * Drawing is handled by SvgRenderer, not here.
 */
function noOpDraw(
  _svg: SVGSVGElement,
  _values: Map<string, GeometryValue>,
  _store: GeometryStore,
  _theme: Theme,
): void {
  // Drawing is handled by SvgRenderer, not here
  // This is intentionally a no-op
}

/**
 * Convert a Construction to an array of Steps.
 * This adapter bridges the new Construction DSL with the existing step system.
 * 
 * @param construction - The Construction instance to convert
 * @returns Array of Step objects compatible with the existing step execution system
 */
export function constructionToSteps(construction: Construction): Step[] {
  return construction.getAllSteps().map((internalStep) => ({
    id: `step_${internalStep.id}`,
    inputs: internalStep.dependencies,
    outputs: [internalStep.id],
    parameters: [], // Construction uses eager evaluation, no parameters needed
    compute: (_inputs: Map<string, GeometryValue>, _params: unknown) => {
      // NOTE: Construction uses EAGER evaluation - values are pre-computed
      // and stored in Construction._values Map. This means:
      // - internalStep.compute() returns the already-computed value
      // - The `inputs` parameter is NOT used (values don't depend on step inputs)
      // - This is intentional: Construction is a builder, not a lazy DAG
      // Both systems use the same app2 GeometryValue types - no conversion needed
      const value = internalStep.compute();
      return new Map([[internalStep.id, value]]);
    },
    draw: noOpDraw,
  }));
}

/**
 * Convert a Construction to Steps, but only up to a certain step index.
 * 
 * @param construction - The Construction instance to convert
 * @param stepIndex - The maximum step index to include (0-based)
 * @returns Array of Step objects up to the specified index
 */
export function constructionToStepsUpTo(
  construction: Construction,
  stepIndex: number,
): Step[] {
  const allSteps = construction.getAllSteps();
  const steps = allSteps.slice(0, stepIndex + 1);
  return steps.map((internalStep) => ({
    id: `step_${internalStep.id}`,
    inputs: internalStep.dependencies,
    outputs: [internalStep.id],
    parameters: [],
    compute: (_inputs: Map<string, GeometryValue>, _params: unknown) => {
      const value = internalStep.compute();
      return new Map([[internalStep.id, value]]);
    },
    draw: noOpDraw,
  }));
}

/**
 * Get the current step from a Construction.
 * 
 * @param construction - The Construction instance
 * @returns The current Step or undefined if no steps exist
 */
export function getCurrentStep(construction: Construction): Step | undefined {
  const internalSteps = construction.getSteps();
  if (internalSteps.length === 0) return undefined;

  const currentInternalStep = internalSteps[internalSteps.length - 1];
  return {
    id: `step_${currentInternalStep.id}`,
    inputs: currentInternalStep.dependencies,
    outputs: [currentInternalStep.id],
    parameters: [],
    compute: (_inputs: Map<string, GeometryValue>, _params: unknown) => {
      const value = currentInternalStep.compute();
      return new Map([[currentInternalStep.id, value]]);
    },
    draw: noOpDraw,
  };
}
