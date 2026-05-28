import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { setupSvg } from "../svg";
import { buildSquareDslSteps } from "../geometry/squareDslSteps";
import { DefaultGeometryRenderer } from "../geometry/dsl/renderers/DefaultRenderer";
import { executeSteps } from "../geometry/stepExecution";
import { computeSquareConfig, type SquareConfig } from "../geometry/operations";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { buildStepMaps, pick } from "../svg";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

// Props for the SquareDslSvg component.
export interface SquareDslSvgProps {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;

  // Stroke width for large elements (dots)
  dotStrokeWidth?: number;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Key to trigger restart (e.g., when resetting the construction)
  restartTrigger?: number;

  // Number of steps to execute (0 = none, 1 = first step, N = N steps)
  currentStep?: number;

  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

/**
 * SquareDslSvg component - Renders the SVG canvas for Square geometry using the new DSL implementation.
 * This is the SVG-only version without player controls.
 */
export const SquareDslSvg = forwardRef(function SquareDslSvg(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    theme = darkTheme,
  }: SquareDslSvgProps,
  ref: Ref<SVGSVGElement | null>,
): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Use hook to track step and theme changes for clearing logic
  const { shouldClear } = useThemeAwareSteps({
    currentStep,
    restartTrigger,
    theme,
  });

  // Forward the ref to the SVG element
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(svgRef.current);
    } else {
      ref.current = svgRef.current;
    }
  }, [ref]);

  // Input validation
  useEffect(() => {
    if (currentStep < 0) {
      console.warn("SquareDslSvg: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("SquareDslSvg: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn(
        "SquareDslSvg: svgConfig.height should be positive, received:",
        svgConfig.height,
      );
    }
    if (!theme || typeof theme !== "object") {
      console.warn("SquareDslSvg: theme should be a valid Theme object, received:", theme);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

  // Memoize the square configuration (derived from SVG dimensions)
  const squareConfig = useMemo<SquareConfig>(() => {
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

  // Effect 2: DSL construction and step execution - ONLY when step, restart, config, or theme changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear geometry and store when going backwards, restarting, or theme changes
    if (shouldClear) {
      clearGeometryFromSvg(svg);
      store.clear();
    }

    // If no steps to draw, exit
    if (currentStep <= 0) return;

    try {
      // Create renderer and build steps once
      const renderer = new DefaultGeometryRenderer("");
      const allSteps = buildSquareDslSteps(renderer);
      
      // Set current step ID for highlighting
      const currentStepId = currentStep > 0 && currentStep < allSteps.length
        ? allSteps[currentStep - 1]?.id
        : "";
      renderer.setCurrentStepId(currentStepId);

      // Build step maps for dependency tracking and parameter values
      const { stepDependencies, stepForOutput } = buildStepMaps(allSteps, currentStep);

      // Execute steps up to currentStep
      const allValues = executeSteps(allSteps, currentStep, { svg, store, theme }, squareConfig);

      // Build dependency map and step maps for parameter values
      if (currentStep > 0) {
        for (const [id, _] of allValues) {
          const deps = stepDependencies.get(id) ?? [];
          const step = stepForOutput.get(id);
          const paramValues = step?.parameters ? pick(squareConfig, step.parameters) : {};
          const stepId = step?.id ?? "";

          // Only update store for visual geometry
          if (step?.isVisual !== false) {
            store.update(id, {
              dependsOn: deps,
              stepId,
              parameterValues: paramValues,
            });
          }
        }
      }
    } catch (error) {
      console.error("SquareDslSvg construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme, shouldClear, squareConfig]);

  return (
    <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="square-dsl-svg" />
  );
});
