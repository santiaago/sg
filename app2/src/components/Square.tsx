import { useEffect, useRef, useMemo, useCallback, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, buildStepMaps, setupSvg } from "../svg";
import { SQUARE_STEPS, executeSteps, computeSquareConfig } from "../geometry/squareSteps";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";

// Re-export SQUARE_STEPS for test accessibility
export { SQUARE_STEPS };

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

  // Total number of steps
  totalSteps?: number;

  // Callback when step changes via slider
  onStepChange?: (step: number) => void;

  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

// Square component that performs geometric construction step-by-step.
// Key features:
// - Lazy calculation: geometries are computed only when their step becomes current
// - Dependency tracking: each step declares its input/output geometries
// - Separation of concerns: math (compute) vs rendering (draw)
export const Square = forwardRef(function Square(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    totalSteps,
    onStepChange,
    theme = darkTheme,
  }: SquareProps,
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
      console.warn("Square: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("Square: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn("Square: svgConfig.height should be positive, received:", svgConfig.height);
    }
    if (!theme || typeof theme !== "object") {
      console.warn("Square: theme should be a valid Theme object, received:", theme);
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
      console.error("Square construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme, shouldClear]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStep = parseInt(e.target.value, 10);
      if (!isNaN(newStep)) {
        onStepChange?.(newStep);
      }
    },
    [onStepChange],
  );

  const maxSteps = totalSteps ?? SQUARE_STEPS.length;
  const progressPercent = ((currentStep ?? 0) / maxSteps) * 100;

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <div className="flex flex-col items-center gap-2">
        <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="square-svg" />
        {onStepChange && totalSteps && (
          <div className="w-full max-w-md">
            <input
              type="range"
              min={1}
              max={maxSteps}
              step={1}
              value={currentStep ?? 0}
              onChange={handleSliderChange}
              aria-label="Step navigation"
              name="step-slider"
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, #4b5563 ${progressPercent}%, #4b5563 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>{maxSteps}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
