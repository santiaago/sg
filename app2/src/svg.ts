/**
 * SVG utility functions.
 * Pure helper functions extracted from Square.tsx for reusability and testability.
 */

import type { SvgConfig } from "./config/svgConfig";
import type { Step } from "./types/geometry";

/**
 * Picks a subset of properties from an object by specified keys.
 * Creates a new object containing only the selected properties.
 *
 * @template T - The source object type
 * @template K - The keys to pick (must be keys of T)
 * @param obj - The source object
 * @param keys - Array of keys to pick from the object
 * @returns New object with only the specified keys
 *
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2, c: 3 };
 * pick(obj, ['a', 'c']); // => { a: 1, c: 3 }
 * ```
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

/**
 * Builds dependency maps for geometry steps.
 * Creates maps tracking which geometries depend on which inputs,
 * and which step produces each output geometry.
 *
 * @param steps - Array of all geometry steps
 * @param currentStep - The current step index (exclusive) to build maps up to
 * @returns Object containing:
 *   - stepDependencies: Map of output geometry ID to array of input geometry IDs
 *   - stepForOutput: Map of output geometry ID to the Step that produces it
 *
 * @example
 * ```typescript
 * const { stepDependencies, stepForOutput } = buildStepMaps(SQUARE_STEPS, 5);
 * // stepDependencies.get('c1') => ['main_line']
 * // stepForOutput.get('c1') => STEP_C1
 * ```
 */
export function buildStepMaps(
  steps: readonly Step[],
  currentStep: number,
): { stepDependencies: Map<string, string[]>; stepForOutput: Map<string, Step> } {
  const stepDependencies = new Map<string, string[]>();
  const stepForOutput = new Map<string, Step>();

  for (const step of steps.slice(0, currentStep)) {
    for (const outputId of step.outputs) {
      stepDependencies.set(outputId, step.inputs);
      stepForOutput.set(outputId, step);
    }
  }

  return { stepDependencies, stepForOutput };
}

/**
 * Clears and configures an SVG element with dimensions from config.
 * Removes all existing children and sets viewBox, width, and height attributes.
 *
 * @param svg - The SVG element to configure
 * @param config - SVG configuration containing dimensions and viewBox
 *
 * @example
 * ```typescript
 * const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
 * setupSvg(svg, { viewBox: "0 0 800 600", width: 800, height: 600 });
 * ```
 */
export function setupSvg(svg: SVGSVGElement, config: SvgConfig): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  svg.setAttribute("viewBox", config.viewBox);
  svg.setAttribute("width", config.width.toString());
  svg.setAttribute("height", config.height.toString());
}
