import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, setupSvg, buildStepMaps } from "../svg";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";
import type { SixFoldV0Step } from "../geometry/sixFold/operations";
import { SIX_FOLD_V0_STEPS, executeSteps } from "../geometry/sixFoldV0Steps";
import { computeSixFoldV0Config } from "../geometry/sixFold/operations";

// Props for the SixFoldV0 component.
export interface SixFoldV0Props {
  store: GeometryStore;
  dotStrokeWidth?: number;
  svgConfig: SvgConfig;
  restartTrigger?: number;
  currentStep?: number;
  theme?: Theme;
}

/**
 * SixFoldV0 component - Replicates "1/4 Six fold pattern v3" from Svelte app.
 * Follows the exact same pattern as Square.tsx:
 * - Separate steps file with compute/draw functions
 * - useMemo for config
 * - useEffect for SVG setup
 * - useEffect for step execution with store integration
 */
export const SixFoldV0 = forwardRef<SVGSVGElement, SixFoldV0Props>(
  (
    { store, dotStrokeWidth = 2.0, svgConfig, restartTrigger = 0, currentStep = 0, theme = darkTheme },
    ref,
  ) => {
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

  const prevStepRef = useRef<number>(0);

  // Memoize the configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSixFoldV0Config(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Effect 1: Input validation
  useEffect(() => {
    if (currentStep < 0) {
      console.warn("SixFoldV0: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("SixFoldV0: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn("SixFoldV0: svgConfig.height should be positive, received:", svgConfig.height);
    }
    if (!theme || typeof theme !== "object") {
      console.warn("SixFoldV0: theme should be a valid Theme object, received:", theme);
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

  // Effect 3: Step execution - ONLY when step, restart, or config changes
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
      console.error("SixFoldV0 construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, theme, config, dotStrokeWidth]);

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="sixfoldv0-svg" />
    </div>
  );
});
