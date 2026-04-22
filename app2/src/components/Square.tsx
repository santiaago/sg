import { useEffect, useRef, useMemo } from "react";
import type { JSX } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore, GeometryValueStore } from "../react-store";
import { rect } from "../svgElements";
import {
  SQUARE_STEPS,
  executeSteps,
  GEOM,
  computeSquareConfig,
  darkTheme,
} from "../geometry/squareSteps";
import type { GeometryValue, Step, DependencyGraph } from "../types/geometry";
import type { Theme } from "../geometry/squareSteps";

// Helper to pick subset of object by keys
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<Pick<T, K>> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
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

  // Optional callback to receive the dependency graph
  onDependencyGraphChange?: (graph: DependencyGraph) => void;

  // Optional store for geometry values (for dependency tracking)
  geometryValueStore?: GeometryValueStore;

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
  onDependencyGraphChange,
  geometryValueStore,
  theme = darkTheme,
}: SquareProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the square configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Ensure config is stable across renders
  const stableConfig = config;

  // Execute steps when currentStep or restartKey changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear the SVG
    setupSvg(svg, svgConfig);

    // Draw the background rectangle using the theme color
    rect(svg, svgConfig.width, svgConfig.height, theme);

    // Clear both stores to ensure right pane updates correctly when going to previous steps
    geometryValueStore?.clear?.();
    store.clear();

    // If no steps to draw, exit
    if (currentStep <= 0) return;

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
      stableConfig,
    );

    // Build dependency map and step maps for parameter values
    if (currentStep > 0) {
      const stepDependencies = new Map<string, string[]>();
      const stepForOutput = new Map<string, Step>();

      for (const step of SQUARE_STEPS.slice(0, currentStep)) {
        for (const outputId of step.outputs) {
          stepDependencies.set(outputId, step.inputs);
          stepForOutput.set(outputId, step);
        }
      }

      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        const step = stepForOutput.get(id);
        const paramValues = step?.parameters ? pick(stableConfig, step.parameters) : {};
        const stepId = step?.id ?? "";

        store.update(id, {
          dependsOn: deps,
          stepId,
          parameterValues: paramValues,
        });
      }
    }

    // Track dependencies in the geometry value store
    if (geometryValueStore && allValues.size > 0) {
      // For each computed value, record it with its dependencies
      // We need to track which step produced which outputs
      // and what the step's inputs were
      const stepDependencies = new Map<string, string[]>();

      for (const step of SQUARE_STEPS.slice(0, currentStep)) {
        for (const outputId of step.outputs) {
          stepDependencies.set(outputId, step.inputs);
        }
      }

      for (const [id, value] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        geometryValueStore.addGeometry(id, value, value.type, deps);
      }

      // Notify parent about dependency graph changes
      if (onDependencyGraphChange) {
        onDependencyGraphChange(geometryValueStore.getDependencyGraph());
      }
    }
  }, [currentStep, restartKey, svgConfig, strokeBig]);

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
