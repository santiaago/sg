import { useEffect, useRef, useMemo } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { SQUARE_STEPS, executeSteps, GEOM, computeSquareConfig } from "../geometry/squareSteps";
import type { GeometryValue, Step } from "../types/geometry";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

/**
 * Picks a subset of properties from an object by specified keys.
 * Creates a new object containing only the selected properties.
 * @param obj - The source object
 * @param keys - Array of keys to pick from the object
 * @returns New object with only the specified keys
 */
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
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
 * @param steps - Array of all geometry steps
 * @param currentStep - The current step index (exclusive) to build maps up to
 * @returns Object containing stepDependencies map (output ID -> input IDs)
 *          and stepForOutput map (output ID -> step)
 */
function buildStepMaps(steps: readonly Step[], currentStep: number) {
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

// Props for the Square component.
export interface SquareProps {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;

  // Stroke width for large elements (dots)
  dotStrokeWidth?: number;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Key to trigger restart (e.g., when resetting the construction)
  restartTrigger?: number;

  // Current step index (1-based) to execute up to
  currentStep?: number;

  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

/**
 * Clears and configures an SVG element with dimensions from config.
 * Removes all existing children and sets viewBox, width, and height attributes.
 * @param svg - The SVG element to configure
 * @param config - SVG configuration containing dimensions and viewBox
 */
function setupSvg(svg: SVGSVGElement, config: SvgConfig): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  svg.setAttribute("viewBox", config.viewBox);
  svg.setAttribute("width", config.width.toString());
  svg.setAttribute("height", config.height.toString());
}

// Square component that performs geometric construction step-by-step.
// Key features:
// - Lazy calculation: geometries are computed only when their step becomes current
// - Dependency tracking: each step declares its input/output geometries
// - Separation of concerns: math (compute) vs rendering (draw)
export function Square({
  store,
  dotStrokeWidth = 2.0,
  svgConfig,
  restartTrigger = 0,
  currentStep = 0,
  theme = darkTheme,
}: SquareProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevStepRef = useRef<number>(0);

  // Memoize the square configuration (derived from SVG dimensions)
  const squareConfig = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Effect 1: SVG container setup - ONLY when dimensions or theme change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // Clear everything and setup SVG container
    setupSvg(svg, svgConfig);

    // Draw the background rectangle using the theme color
    rect(svg, svgConfig.width, svgConfig.height, theme);
  }, [svgConfig.width, svgConfig.height, svgConfig.viewBox, theme]);

  // Effect 2: Step execution - ONLY when step, restart, or config changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear ONLY geometry elements, preserve background
    clearGeometryFromSvg(svg);

    // Clear store when going backwards, restarting, or on first step execution
    if (currentStep < prevStepRef.current || restartTrigger !== 0 || currentStep > 0) {
      store.clear();
    }
    prevStepRef.current = currentStep;

    // If no steps to draw, exit
    if (currentStep <= 0) return;

    // Call once at the beginning of the effect:
    const { stepDependencies, stepForOutput } = buildStepMaps(SQUARE_STEPS, currentStep);

    // Execute steps up to currentStep
    const allValues = executeSteps(
      SQUARE_STEPS,
      currentStep,
      {
        svg,
        store,
        theme,
      },
      squareConfig,
    );

    // Build dependency map and step maps for parameter values
    if (currentStep > 0) {
      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        const step = stepForOutput.get(id);
        const paramValues = step?.parameters ? pick(squareConfig, step.parameters) : {};
        const stepId = step?.id ?? "";

        store.update(id, {
          dependsOn: deps,
          stepId,
          parameterValues: paramValues,
        });
      }
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme]);

  return (
    <div className={svgConfig.containerClass} style={{ display: "flex", justifyContent: "center" }}>
      <svg
        ref={svgRef}
        className={svgConfig.svgClass}
        style={{ display: "block" }}
        data-testid="square-svg"
      />
    </div>
  );
}

// Exports for testing and external use

export { SQUARE_STEPS, GEOM };
export type { Step, GeometryValue };
