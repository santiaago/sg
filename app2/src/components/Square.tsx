import { useEffect, useRef, useMemo } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect } from "../svgElements";
import { SQUARE_STEPS, executeSteps, GEOM, computeSquareConfig } from "../geometry/squareSteps";
import type { GeometryValue, Step } from "../types/geometry";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

// Helper to pick subset of object by keys
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

// Helper to build step dependency maps
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
  strokeBig?: number;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Key to trigger restart (e.g., when resetting the construction)
  restartKey?: number;

  // Current step index (1-based) to execute up to
  currentStep?: number;

  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

// Default stroke width for regular lines
const DEFAULT_STROKE = 0.5;

// Helper to set up SVG element with dimensions from config
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
  strokeBig = 2.0,
  svgConfig,
  restartKey = 0,
  currentStep = 0,
  theme = darkTheme,
}: SquareProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the square configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Execute steps when currentStep or restartKey changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear the SVG
    setupSvg(svg, svgConfig);

    // Draw the background rectangle using the theme color
    rect(svg, svgConfig.width, svgConfig.height, theme);

    // Clear the store to ensure right pane updates correctly when going to previous steps
    store.clear();

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
        config: {
          width: svgConfig.width,
          height: svgConfig.height,
          stroke: DEFAULT_STROKE,
          strokeBig,
        },
        store,
        theme,
      },
      config,
    );

    // Build dependency map and step maps for parameter values
    if (currentStep > 0) {
      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        const step = stepForOutput.get(id);
        const paramValues = step?.parameters ? pick(config, step.parameters) : {};
        const stepId = step?.id ?? "";

        store.update(id, {
          dependsOn: deps,
          stepId,
          parameterValues: paramValues,
        });
      }
    }
  }, [currentStep, restartKey, svgConfig, strokeBig, theme]);

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
