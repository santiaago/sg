import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, buildStepMaps, setupSvg } from "../svg";
import {
  ROTATED_SQUARE_STEPS,
  executeSteps,
  computeSquareConfig,
} from "../geometry/rotatedSquareSteps";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

// Re-export ROTATED_SQUARE_STEPS for test accessibility
export { ROTATED_SQUARE_STEPS };

// Props for the RotatedSquareSvg component.
export interface RotatedSquareSvgProps {
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
 * RotatedSquareSvg component - Renders only the SVG canvas for Square geometry with rotated coordinate system.
 * The first coordinate system is rotated by Pi/16 radians (X axis goes down by Pi/16).
 * This is used to test that changing the coordinate system changes the geometry.
 * This is the SVG-only version without player controls.
 */
export const RotatedSquareSvg = forwardRef(function RotatedSquareSvg(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    theme = darkTheme,
  }: RotatedSquareSvgProps,
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
      console.warn("RotatedSquareSvg: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn(
        "RotatedSquareSvg: svgConfig.width should be positive, received:",
        svgConfig.width,
      );
    }
    if (svgConfig.height <= 0) {
      console.warn(
        "RotatedSquareSvg: svgConfig.height should be positive, received:",
        svgConfig.height,
      );
    }
    if (!theme || typeof theme !== "object") {
      console.warn("RotatedSquareSvg: theme should be a valid Theme object, received:", theme);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

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

  // Effect 2: Step execution - ONLY when step, restart, config, or theme changes
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
      // Call once at the beginning of the effect:
      const { stepDependencies, stepForOutput } = buildStepMaps(ROTATED_SQUARE_STEPS, currentStep);

      // Execute steps up to currentStep
      const allValues = executeSteps(
        ROTATED_SQUARE_STEPS,
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
        for (const [id, _] of allValues) {
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
      console.error("RotatedSquareSvg construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme, shouldClear]);

  return (
    <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="rotated-square-svg" />
  );
});
