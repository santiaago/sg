import { useEffect, useRef, useMemo } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, buildStepMaps, setupSvg } from "../svg";
import { SQUARE_STEPS, executeSteps, GEOM, computeSquareConfig } from "../geometry/squareSteps";
import type { GeometryValue, Step } from "../types/geometry";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

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
    const prevStep = prevStepRef.current;

    // Clear geometry ONLY when going backwards or restarting
    if (currentStep < prevStep || restartTrigger !== 0) {
      clearGeometryFromSvg(svg);
    }

    // Clear store only when going backwards or restarting
    if (currentStep < prevStep || restartTrigger !== 0) {
      store.clear();
    }
    prevStepRef.current = currentStep;

    // If no steps to draw, exit
    if (currentStep <= 0) return;

    try {
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
    } catch (error) {
      console.error("Square construction failed at step", currentStep, ":", error);
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
