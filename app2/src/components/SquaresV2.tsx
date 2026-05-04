/**
 * SquaresV2.tsx
 *
 * Proof-of-concept component using the new Construction DSL and SvgRenderer.
 * Demonstrates the higher-level declarative geometry construction framework.
 *
 * This component:
 * - Creates geometry using Construction DSL
 * - Renders using SvgRenderer
 * - Supports step-by-step navigation
 * - Is completely independent of the existing Square component
 */

import { useEffect, useMemo, useRef } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { Construction } from "../geometry/construction";
import { SvgRenderer } from "../geometry/renderers/svgRenderer";
import {
  computeSquareConfig,
  LINE_EXTENSION_MULTIPLIER,
  C1_POSITION_RATIO,
} from "../geometry/operations";
import type { Circle } from "../types/geometry";

/**
 * Props for the SquaresV2 component.
 */
export interface SquaresV2Props {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Current step index (0-based)
  currentStep: number;

  // Theme for styling
  theme?: Theme;
}

/**
 * SquaresV2 component - Proof of concept for the new geometry framework.
 *
 * Creates a square using compass and straightedge techniques, rendering
 * step-by-step as the user navigates through the construction.
 */
export function SquaresV2({
  store,
  svgConfig,
  currentStep,
  theme,
}: SquaresV2Props): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the square configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Create the construction (pure geometry, no rendering)
  const construction = useMemo(() => {
    const c = new Construction();

    // Step 1: Main line (base line for the entire construction)
    const ml = c.line(
      config.p1x,
      config.p1y,
      config.p2x,
      config.p2y,
      "main_line",
    );

    // Step 2: C1 - First circle center at C1_POSITION_RATIO along main line
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: C1_C - First circle centered at C1 with configured radius
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2 - Second circle center at left intersection of C1_C with main line
    // The left intersection is the one with smaller x-coordinate
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: C2_C - Second circle centered at C2 with same radius as C1_C
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - Intersection point of both circles (north = smaller y in SVG)
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: CI - Circle centered at PI with same radius
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines from C2 and C1 towards PI
    // Length = LINE_EXTENSION_MULTIPLIER * radius (1.1 * diameter = 2.2 * radius)
    const line_c2_pi = c.lineTowards(
      c2,
      pi,
      LINE_EXTENSION_MULTIPLIER * c1_circle.r,
      "line_c2_pi",
    );
    const line_c1_pi = c.lineTowards(
      c1,
      pi,
      LINE_EXTENSION_MULTIPLIER * c1_circle.r,
      "line_c1_pi",
    );

    // Step 10-11: P3 and P4 - Intersections of extended lines with CI
    // Use { exclude } to get the "other" intersection point (not the circle center)
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: PL and PR - Tangent points
    // These are the intersections of the connecting lines with the original circles
    // excluding the points we already know (p4 for c2_c, p3 for c1_c)
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square polygon
    // Connect the four corner points: C1, C2, PR, PL
    // Note: Order matters for polygon rendering
    const square = c.polygon([c1, c2, pr, pl], "square");

    return c;
  }, [config]);

  // Navigate to requested step
  useEffect(() => {
    construction.goTo(currentStep);
  }, [currentStep, construction]);

  // Render the construction up to the current step
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const renderer = new SvgRenderer(svg, store);

    // Clear previous rendering
    renderer.clear();

    // Draw all geometries up to the current step
    renderer.drawConstructionUpTo(construction, currentStep);
  }, [currentStep, store, construction, theme]);

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <svg
        ref={svgRef}
        className={`${svgConfig.svgClass} block`}
        data-testid="squaresv2-svg"
      />
    </div>
  );
}
