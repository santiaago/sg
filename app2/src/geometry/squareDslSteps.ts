/**
 * Square geometric construction using the DSL (Declarative Geometry Framework).
 * This provides a higher-level, more expressive way to define the square construction
 * compared to the manual step-based approach in squareSteps.ts.
 */

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import { computeSquareConfig, GOLDEN_RATIO } from "./operations";
import type { SquareConfig } from "./operations";
import type { PolygonStyleOptions } from "./dsl/expressions/PolygonExpression";
import type { Step } from "../types/geometry";

/**
 * Build the square construction steps using the DSL.
 * Returns an array of Steps that can be executed by the standard step execution engine.
 *
 * @param width - SVG width
 * @param height - SVG height
 * @returns Array of Steps for the square construction
 */
export function buildSquareDslSteps(width: number, height: number): Step<SquareConfig>[] {
  const config = computeSquareConfig(width, height);
  const builder = new GeometryBuilder<SquareConfig>(new DefaultGeometryRenderer());

  // Step 1: Coordinate system
  const cs = builder.coordinateSystem("cs", 0, 0, height * 0.1, 0);

  // Step 2: Points P1 and P2 (defined in the coordinate system)
  const p1 = builder.pointInCs("p1", cs, config.p1x, config.p1y);
  const p2 = builder.pointInCs("p2", cs, config.p2x, config.p2y);

  // Step 3: Main line
  const line_main = builder.line("line_main", p1, p2);

  // Step 4: Circle center C1 (positioned at ratio along main line)
  const c1 = builder.pointAt("c1", line_main, config.C1_POSITION_RATIO);

  // Step 5: First circle
  const c1_c = builder.circle("c1_c", c1, config.circleRadius);

  // Step 6: Circle center C2 (intersection of C1_C and line_main)
  const c2 = builder.intersection("c2", c1_c, line_main);

  // Step 7: Second circle
  const c2_c = builder.circle("c2_c", c2, config.circleRadius);

  // Step 8: Intersection point PI of C1_C and C2_C
  const pi = builder.circleIntersection("pi", c1_c, c2_c, { select: "north" });

  // Step 9: Intersection circle CI at PI
  const ci = builder.circle("ci", pi, config.circleRadius);

  // Step 10: Line from C2 towards PI (extended)
  const line_c2_pi = builder.lineTowards("line_c2_pi", c2, pi, 2.2 * config.circleRadius);

  // Step 11: Point P3 - intersection of line_c2_pi with CI, excluding C2
  const p3 = builder.intersection("p3", ci, line_c2_pi, { excludeId: "c2" });

  // Step 12: Line from C1 towards PI (extended)
  const line_c1_pi = builder.lineTowards("line_c1_pi", c1, pi, 2.2 * config.circleRadius);

  // Step 13: Point P4 - intersection of line_c1_pi with CI, excluding C1
  const p4 = builder.intersection("p4", ci, line_c1_pi, { excludeId: "c1" });

  // Step 14: Line from C2 to P4
  const line_c2_p4 = builder.line("line_c2_p4", c2, p4);

  // Step 15: Point PL - tangent point (intersection of C2_C with line_c2_p4)
  const pl = builder.intersection("pl", c2_c, line_c2_p4);

  // Step 16: Line from C1 to P3
  const line_c1_p3 = builder.line("line_c1_p3", c1, p3);

  // Step 17: Point PR - tangent point (intersection of C1_C with line_c1_p3)
  const pr = builder.intersection("pr", c1_c, line_c1_p3);

  // Step 18: Final square with custom stroke width (GOLDEN_RATIO)
  const squareStyle: PolygonStyleOptions = {
    strokeWidth: GOLDEN_RATIO,
    strokeColor: (theme) => theme.COLOR_PRIMARY,
  };
  builder.polygon("square", [pl, pr, c1, c2], squareStyle);

  // Compile to Steps
  return builder.compile();
}

/**
 * Number of steps in the DSL square construction.
 */
export const DSL_SQUARE_STEPS_LENGTH = 19;
