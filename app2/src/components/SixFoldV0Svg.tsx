import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, setupSvg, buildStepMaps } from "../svg";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";
import type { SixFoldV0Step } from "../geometry/sixFold/operations";
import { SIX_FOLD_V0_STEPS, executeSteps } from "../geometry/sixFoldV0Steps";
import { computeSixFoldV0Config } from "../geometry/sixFold/operations";

// Props for the SixFoldV0Svg component.
export interface SixFoldV0SvgProps {
  store: GeometryStore;
  dotStrokeWidth?: number;
  svgConfig: SvgConfig;
  restartTrigger?: number;
  // Number of steps to execute (0 = none, 1 = first step, N = N steps)
  currentStep?: number;
  theme?: Theme;
}

/**
 * SixFoldV0Svg component - Renders only the SVG canvas for SixFoldV0 geometry.
 * This is the SVG-only version without player controls.
 */
export const SixFoldV0Svg = forwardRef(function SixFoldV0Svg(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    theme = darkTheme,
  }: SixFoldV0SvgProps,
  ref: Ref<SVGSVGElement | null>,
): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Forward the ref to the SVG element
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(svgRef.current);
    } else {
      ref.current = svgRef.current;
    }
  }, [ref]);

  // Use hook to track step and theme changes for clearing logic
  const { shouldClear } = useThemeAwareSteps({
    currentStep,
    restartTrigger,
    theme,
  });

  // Memoize the configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSixFoldV0Config(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Effect 1: Input validation
  useEffect(() => {
    if (currentStep < 0) {
      console.warn("SixFoldV0Svg: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("SixFoldV0Svg: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn("SixFoldV0Svg: svgConfig.height should be positive, received:", svgConfig.height);
    }
    if (!theme || typeof theme !== "object") {
      console.warn("SixFoldV0Svg: theme should be a valid Theme object, received:", theme);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

  // Effect 2: SVG container setup - ONLY when dimensions or theme change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // Clear everything and setup SVG container
    setupSvg(svg, svgConfig);

    // Draw the background rectangle using the theme color
    rect(svg, svgConfig.width, svgConfig.height, theme);
  }, [svgConfig.width, svgConfig.height, svgConfig.viewBox, theme]);

  // Effect 3: Step execution - ONLY when step, restart, config, or theme changes
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
      // Execute steps up to currentStep
      const allValues = executeSteps(SIX_FOLD_V0_STEPS, currentStep, { svg, store, theme }, config);

      // Build dependency map and step maps for GeometryList display
      if (currentStep > 0) {
        const { stepDependencies, stepForOutput } = buildStepMaps(SIX_FOLD_V0_STEPS, currentStep);

        for (const id of allValues.keys()) {
          const deps = stepDependencies.get(id) ?? [];
          const step = stepForOutput.get(id) as SixFoldV0Step | undefined;
          const paramValues = step?.parameters ? pick(config, step.parameters) : {};
          const stepId = step?.id ?? "";

          store.update(id, {
            dependsOn: deps,
            stepId,
            parameterValues: paramValues,
          });
        }
      }
    } catch (error) {
      console.error("SixFoldV0Svg construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, theme, config, dotStrokeWidth, shouldClear]);

  return (
    <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="sixfoldv0-svg" />
  );
});
