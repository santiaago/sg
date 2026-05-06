// SquaresV2 - Proof-of-concept component using the new Construction DSL.
// This demonstrates the higher-level declarative geometry construction framework.

import { useEffect, useMemo, useRef } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { Construction } from "../geometry/construction";
import { SvgRenderer } from "../geometry/renderers/svgRenderer";
import { computeSquareConfig, LINE_EXTENSION_MULTIPLIER, C1_POSITION_RATIO } from "../geometry/operations";

/**
 * Props for the SquaresV2 component.
 */
export interface SquaresV2Props {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;
  
  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;
  
  // Number of steps to execute (0 = none, 1 = first step, N = N steps)
  currentStep?: number;
  
  // Theme for SVG rendering (light or dark)
  theme?: Theme;
}

/**
 * SquaresV2 component - Renders square geometry using the new Construction DSL.
 * 
 * This is a proof-of-concept demonstrating:
 * - Declarative geometry construction using Construction class
 * - Separation of construction logic from rendering
 * - Step-by-step navigation
 * - Use of the new higher-level API
 */
export function SquaresV2({
  store,
  svgConfig,
  currentStep = 0,
  theme,
}: SquaresV2Props): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const rendererRef = useRef<SvgRenderer | null>(null);

  // Compute configuration from SVG dimensions
  const config = useMemo(() => computeSquareConfig(svgConfig.width, svgConfig.height), [
    svgConfig.width,
    svgConfig.height,
  ]);

  // Create construction using the new DSL (pure geometry, no rendering)
  const construction = useMemo(() => {
    const c = new Construction();

    // Step 1: Main line (base)
    const ml = c.line(config.p1x, config.p1y, config.p2x, config.p2y, "main_line");

    // Step 2: C1 at ratio along main line
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: Circle at C1 with given radius
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2 at left intersection of c1_circle with main_line
    // The main line passes through C1 at (c1.x, c1.y)
    // C2 is the left intersection point of the circle with the line
    // Since the line is horizontal and the circle is centered at C1 on the line,
    // the two intersection points are at C1.x +/- radius
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: Circle at C2 with same radius as c1_circle
    // Get the circle value to access its radius property
    const c1_circle = c.get<{ type: "circle"; cx: number; cy: number; r: number }>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - north intersection of both circles
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: Circle at PI with same radius
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines from C2 and C1 towards PI
    const line_c2_pi = c.lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c1_pi");

    // Step 10-11: P3 and P4 as intersections of extended lines with CI
    // P3 is the "other" intersection (not C2) of line_c2_pi with ci
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    // P4 is the "other" intersection (not C1) of line_c1_pi with ci
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: Tangent points
    // PL is the intersection of line_c2_p4 with c2_circle (other than P4)
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    // PR is the intersection of line_c1_p3 with c1_circle (other than P3)
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square
    const square = c.polygon([c1, c2, pr, pl], "square");

    return c;
  }, [config]);

  // Navigate to requested step
  useEffect(() => {
    if (construction) {
      // currentStep is 1-based (1 = first step), convert to 0-based for Construction
      construction.goTo(Math.max(0, currentStep - 1));
    }
  }, [currentStep, construction]);

  // Render the construction (separate concern)
  useEffect(() => {
    if (!svgRef.current) return;

    // Create or update renderer
    if (!rendererRef.current) {
      rendererRef.current = new SvgRenderer(svgRef.current, store);
    } else {
      rendererRef.current.setSvg(svgRef.current);
      rendererRef.current.setStore(store);
    }

    const renderer = rendererRef.current;
    
    // Clear previous drawing
    renderer.clear();

    // Draw construction up to current step
    // currentStep is 1-based, so we draw up to currentStep - 1 (0-based)
    if (currentStep > 0) {
      renderer.drawConstructionUpTo(construction, currentStep - 1);
    }
  }, [currentStep, store, construction]);

  // Handle theme changes
  useEffect(() => {
    // Theme is passed to children, no direct handling needed
  }, [theme]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}

export default SquaresV2;
