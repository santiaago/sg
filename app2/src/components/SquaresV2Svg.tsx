import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { rect, clearGeometryFromSvg } from "../svgElements";
import { pick, buildStepMaps, setupSvg } from "../svg";
import { executeSteps } from "../geometry/stepExecution";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { darkTheme } from "../themes";
import { GeometryBuilder } from "../declarative";
import type { Step } from "../types/geometry";
import type { SquareConfig } from "../geometry/operations";

// Props for the SquaresV2Svg component.
export interface SquaresV2SvgProps {
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

// Constants matching the original square construction
const C1_POSITION_RATIO = 5 / 8;
const LINE_EXTENSION_MULTIPLIER = 2.2;

/**
 * Build the square construction steps using the declarative API
 * This replicates the 18-step construction from squareSteps.ts
 */
function buildSquareSteps(config: SquareConfig): Step<SquareConfig>[] {
  // Create a new builder for this construction
  const builder = new GeometryBuilder<SquareConfig>();

  // Step 0: Coordinate System
  // In the original, CS is at (0, 0) with arrowLength = height * ratio
  const CS = builder.coordinateSystem(
    "cs",
    0,
    0,
    (cfg) => cfg.height * 0.1,
  );

  // Step 1: Point P1
  const P1 = builder.point(
    "p1",
    (cfg) => cfg.border,
    (cfg) => cfg.height - cfg.border,
  );

  // Step 2: Point P2
  const P2 = builder.point(
    "p2",
    (cfg) => cfg.width - cfg.border,
    (cfg) => cfg.height - cfg.border,
  );

  // Step 3: Main line connecting P1 and P2
  const MAIN_LINE = builder.lineBetween("line_main", P1, P2);

  // Step 4: Circle center C1 at ratio along main line
  const C1 = builder.pointAt("c1", MAIN_LINE, C1_POSITION_RATIO);

  // Step 5: Circle C1_C centered at C1 with radius
  const C1_C = builder.circle("c1_c", C1, (cfg) => cfg.circleRadius);

  // Step 6: Circle center C2 at left intersection of C1_C with MAIN_LINE
  const C2 = builder.intersection("c2", C1_C, MAIN_LINE, "left");

  // Step 7: Circle C2_C centered at C2 with same radius
  const C2_C = builder.circle("c2_c", C2, (cfg) => cfg.circleRadius);

  // Step 8: Intersection point PI of C1_C and C2_C (north)
  const PI = builder.circleIntersection("pi", C1_C, C2_C, "north");

  // Step 9: Intersection circle CI centered at PI with same radius
  const CI = builder.circle("ci", PI, (cfg) => cfg.circleRadius);

  // Step 10: Line from C2 towards PI (extended)
  const LINE_C2_PI = builder.lineTowards(
    "line_c2_pi",
    C2,
    PI,
    (cfg) => LINE_EXTENSION_MULTIPLIER * cfg.circleRadius,
  );

  // Step 11: Point P3 as intersection of LINE_C2_PI with CI (excluding C2)
  // For this we need to use the intersection function
  const P3 = builder.intersection("p3", CI, LINE_C2_PI, "left", C2);

  // Step 12: Line from C1 towards PI (extended)
  const LINE_C1_PI = builder.lineTowards(
    "line_c1_pi",
    C1,
    PI,
    (cfg) => LINE_EXTENSION_MULTIPLIER * cfg.circleRadius,
  );

  // Step 13: Point P4 as intersection of LINE_C1_PI with CI (excluding C1)
  const P4 = builder.intersection("p4", CI, LINE_C1_PI, "left", C1);

  // Step 14: Line from C2 to P4
  const LINE_C2_P4 = builder.lineBetween("line_c2_p4", C2, P4);

  // Step 15: Point PL as intersection of C2_C with LINE_C2_P4
  const PL = builder.intersection("pl", C2_C, LINE_C2_P4, "left");

  // Step 16: Line from C1 to P3
  const LINE_C1_P3 = builder.lineBetween("line_c1_p3", C1, P3);

  // Step 17: Point PR as intersection of C1_C with LINE_C1_P3
  const PR = builder.intersection("pr", C1_C, LINE_C1_P3, "left");

  // Step 18: Final square from PL, PR, C1, C2
  const SQUARE = builder.polygon("square", [PL, PR, C1, C2]);

  // Return all steps in dependency order
  return builder.toSteps();
}

/**
 * Pre-built steps for the square construction (cached)
 * This is exported for reference and testing
 */
let cachedSteps: Step<SquareConfig>[] | null = null;
let cachedConfig: SquareConfig | null = null;

export function getSquaresV2Steps(config: SquareConfig): Step<SquareConfig>[] {
  // Cache steps for the same config to avoid rebuilding
  // Note: In production, steps don't depend on config values, only on config keys
  // so we could cache more aggressively, but for simplicity we rebuild each time
  return buildSquareSteps(config);
}

/**
 * SquaresV2Svg component - Renders the SVG canvas for SquaresV2 geometry.
 * Uses the declarative API to construct the square.
 */
export const SquaresV2Svg = forwardRef(function SquaresV2Svg(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    theme = darkTheme,
  }: SquaresV2SvgProps,
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
      console.warn("SquaresV2Svg: currentStep should not be negative, received:", currentStep);
    }
    if (svgConfig.width <= 0) {
      console.warn("SquaresV2Svg: svgConfig.width should be positive, received:", svgConfig.width);
    }
    if (svgConfig.height <= 0) {
      console.warn("SquaresV2Svg: svgConfig.height should be positive, received:", svgConfig.height);
    }
    if (!theme || typeof theme !== "object") {
      console.warn("SquaresV2Svg: theme should be a valid Theme object, received:", theme);
    }
  }, [currentStep, svgConfig.width, svgConfig.height, theme]);

  // Memoize the square configuration (derived from SVG dimensions)
  const squareConfig = useMemo(() => {
    // Import computeSquareConfig from the existing operations
    const { computeSquareConfig } = require("../geometry/operations");
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Memoize the steps for this configuration
  const SQUARES_V2_STEPS = useMemo(() => {
    return buildSquareSteps(squareConfig);
  }, [squareConfig]);

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
      const { stepDependencies, stepForOutput } = buildStepMaps(SQUARES_V2_STEPS, currentStep);

      // Execute steps up to currentStep
      const allValues = executeSteps(
        SQUARES_V2_STEPS,
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
      console.error("SquaresV2Svg construction failed at step", currentStep, ":", error);
    }
  }, [currentStep, restartTrigger, svgConfig, dotStrokeWidth, theme, shouldClear, SQUARES_V2_STEPS]);

  return <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="squares-v2-svg" />;
});

// Export the builder function for testing
export { buildSquareSteps };
