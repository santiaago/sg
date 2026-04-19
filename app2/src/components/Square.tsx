import { useEffect, useRef, useMemo } from "react";
import type { JSX } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore, GeometryValueStore } from "../react-store";
import { rect } from "../svgElements";
import { SQUARE_STEPS, executeSteps, GEOM, computeSquareConfig } from "../geometry/squareSteps";
import type { GeometryValue, Step } from "../types/geometry";

// Props for the Square component.
// Note: The steps and updateSteps props are deprecated but kept for backward compatibility.
// They are no longer used since steps are now defined statically in squareSteps.ts.
export interface SquareProps {
  // Optional store for managing SVG elements and tooltips
  store?: GeometryStore;

  // Stroke width for large elements (dots) - kept for backward compatibility
  strokeBig?: number;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Key to trigger restart (e.g., when resetting the construction)
  restartKey?: number;

  // Current step index (1-based) to execute up to
  currentStep?: number;

  // Optional callback to receive the dependency graph
  onDependencyGraphChange?: (graph: { nodes: any[]; edges: any[] }) => void;

  // Optional store for geometry values (for dependency tracking)
  geometryValueStore?: GeometryValueStore;

  // Deprecated: steps are now defined statically. Kept for backward compatibility.
  steps?: any[];

  // Called with the static steps array for backward compatibility.
  // Allows parent to determine total number of steps.
  updateSteps?: (steps: any[]) => void;
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
  // Deprecated props (kept for backward compatibility)
  steps: _steps,
  updateSteps,
}: SquareProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the square configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Ensure config is stable across renders
  const stableConfig = config;

  // Initialize steps for backward compatibility
  useEffect(() => {
    // If parent provided updateSteps callback, call it with our static steps
    // This allows the parent to know the total number of steps
    if (updateSteps) {
      // Create step objects that match the old format
      const stepsForParent = SQUARE_STEPS.map(() => ({
        draw: true,
        drawShapes: () => {}, // Placeholder - not used by parent
      }));
      updateSteps(stepsForParent);
    }
  }, []);

  // Execute steps when currentStep or restartKey changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear the SVG
    setupSvg(svg, svgConfig);

    // Draw the background rectangle
    rect(svg, svgConfig.width, svgConfig.height);

    // Clear both stores to ensure right pane updates correctly when going to previous steps
    geometryValueStore?.clear?.();
    store?.clear?.();

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
      },
      stableConfig,
    );

    // Build dependency map and update store items with dependsOn
    if (store && currentStep > 0) {
      const stepDependencies = new Map<string, string[]>();
      for (const step of SQUARE_STEPS.slice(0, currentStep)) {
        for (const outputId of step.outputs) {
          stepDependencies.set(outputId, step.inputs);
        }
      }

      for (const [id] of allValues) {
        const deps = stepDependencies.get(id) ?? [];
        store.update(id, { dependsOn: deps });
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
