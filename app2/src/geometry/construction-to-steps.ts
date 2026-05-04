/**
 * construction-to-steps.ts
 *
 * Adapter that converts Construction output to Step[] format.
 * Bridges the new Construction DSL to the existing step-based infrastructure.
 */

import type { Step, GeometryValue } from "../types/geometry";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { Construction } from "./construction";

/**
 * Convert a Construction to an array of Step objects.
 *
 * This enables the new Construction DSL to work with existing infrastructure
 * that expects Step[] format (e.g., Square component, GeometryList, etc.).
 *
 * @param construction - The Construction to convert
 * @returns Array of Step objects compatible with existing step system
 */
export function constructionToSteps(construction: Construction): Step[] {
  return construction.getAllSteps().map((internalStep) => {
    const stepId = `step_${internalStep.id}`;

    return {
      id: stepId,
      inputs: internalStep.dependencies,
      outputs: [internalStep.id],
      parameters: [], // Construction doesn't have parameterized steps yet

      compute: (_inputs: Map<string, GeometryValue>, _config: unknown) => {
        // NOTE: Construction uses EAGER evaluation
        // Values are pre-computed and stored in Construction._values Map
        // internalStep.compute() returns the already-computed value
        // The parameters are NOT used (values don't depend on step inputs)
        // This is intentional: Construction is a builder, not a lazy DAG

        const value = internalStep.compute();
        return new Map([[internalStep.id, value]]);
      },

      draw: (
        _svg: SVGSVGElement,
        _values: Map<string, GeometryValue>,
        _store: GeometryStore,
        _theme: Theme,
      ) => {
        // Drawing is handled by SvgRenderer, not here
        // This adapter bridges to Step[] for compatibility; use SvgRenderer.drawConstruction() instead
        throw new Error("Drawing not implemented: use SvgRenderer for Construction output");
      },
    };
  });
}
