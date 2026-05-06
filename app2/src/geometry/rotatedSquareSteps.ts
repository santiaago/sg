/**
 * Rotated Square geometric construction - Step definitions
 *
 * This module implements a square construction with a rotated coordinate system.
 * The first coordinate system is rotated by Pi/16 radians (X axis goes down by Pi/16).
 * This is used to test that changing the coordinate system changes the geometry.
 *
 * The steps are identical to squareSteps.ts except for the coordinate system rotation.
 */

import type { Step, GeometryValue, StepExecutionContext } from "../types/geometry";
import {
  point,
  line,
  isPoint,
  isCircle,
  isLine,
  isPolygon,
  isCoordinateSystem,
  coordinateSystem,
} from "../types/geometry";
import {
  computeSquareConfig,
  GEOM,
  GOLDEN_RATIO,
  LINE_EXTENSION_MULTIPLIER,
  getGeometry,
  computeSingle,
  type SquareConfig,
} from "./operations";
import {
  circleFromPoint,
  pointFromCircles,
  pointFromCircleAndLine,
  square as makeSquare,
  lineTowards,
} from "./constructors";
import {
  createTooltip,
  drawPoint,
  drawLine,
  drawCircle,
  drawCoordinateSystem,
} from "../svgElements";

export { computeSquareConfig, GEOM, getGeometry, computeSingle };
export type { SquareConfig };

// Rotation angle: Pi/16 radians (X axis goes down by Pi/16)
const COORDINATE_SYSTEM_ROTATION = Math.PI / 16;

/**
 * Step 0: Rotated Coordinate System
 * Creates the coordinate system with X and Y arrows at the origin, rotated by Pi/16.
 * This is the key difference from the standard square construction.
 */
const STEP_COORDINATE_SYSTEM: Step<SquareConfig> = {
  id: "step_coordinate_system",
  inputs: [],
  outputs: [GEOM.COORDINATE_SYSTEM],
  parameters: ["border", "height"],

  compute: computeSingle(GEOM.COORDINATE_SYSTEM, (_inputs, params) => {
    // Place coordinate system at SVG origin (0, 0) = top-left corner.
    // SVG coordinate system: X increases right (east), Y increases down (south).
    const arrowLength = params.height / 24;
    // Rotation: Pi/16 radians (X axis goes down by Pi/16)
    return coordinateSystem(0, 0, arrowLength, COORDINATE_SYSTEM_ROTATION);
  }),

  draw: (svg, values, store, theme) => {
    drawCoordinateSystem(
      svg,
      values,
      GEOM.COORDINATE_SYSTEM,
      0.5,
      store,
      theme,
      theme.COLOR_PRIMARY,
    );
  },
};

/**
 * Step 1: Point P1
 * First endpoint of the main line.
 * Transformed according to the rotated coordinate system.
 */
const STEP_P1: Step<SquareConfig> = {
  id: "step_p1",
  inputs: [GEOM.COORDINATE_SYSTEM],
  outputs: [GEOM.P1],
  parameters: ["p1x", "p1y"],

  compute: computeSingle(GEOM.P1, (inputs, params) => {
    const cs = inputs.get(GEOM.COORDINATE_SYSTEM);
    if (!cs || !isCoordinateSystem(cs)) {
      // Fallback to unrotated if CS is missing
      return point(params.p1x, params.p1y);
    }

    // Apply rotation transformation
    const rotation = cs.rotation ?? 0;
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);

    // Transform local coordinates (p1x, p1y) to global SVG coordinates
    // In a rotated CS: x' = cs.x + x * cos(rotation) - y * sin(rotation)
    //                   y' = cs.y + x * sin(rotation) + y * cos(rotation)
    const x = cs.x + params.p1x * cosRot - params.p1y * sinRot;
    const y = cs.y + params.p1x * sinRot + params.p1y * cosRot;

    return point(x, y);
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P1, 2.0, store, theme);
  },
};

/**
 * Step 2: Point P2
 * Second endpoint of the main line.
 * Transformed according to the rotated coordinate system.
 */
const STEP_P2: Step<SquareConfig> = {
  id: "step_p2",
  inputs: [GEOM.COORDINATE_SYSTEM],
  outputs: [GEOM.P2],
  parameters: ["p2x", "p2y"],

  compute: computeSingle(GEOM.P2, (inputs, params) => {
    const cs = inputs.get(GEOM.COORDINATE_SYSTEM);
    if (!cs || !isCoordinateSystem(cs)) {
      // Fallback to unrotated if CS is missing
      return point(params.p2x, params.p2y);
    }

    // Apply rotation transformation
    const rotation = cs.rotation ?? 0;
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);

    // Transform local coordinates (p2x, p2y) to global SVG coordinates
    const x = cs.x + params.p2x * cosRot - params.p2y * sinRot;
    const y = cs.y + params.p2x * sinRot + params.p2y * cosRot;

    return point(x, y);
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P2, 2.0, store, theme);
  },
};

/**
 * Step 3: Main line
 * Base line for the entire construction, connecting P1 and P2.
 */
const STEP_MAIN_LINE: Step<SquareConfig> = {
  id: "step_main_line",
  inputs: [GEOM.P1, GEOM.P2],
  outputs: [GEOM.MAIN_LINE],
  parameters: [],

  compute: computeSingle(GEOM.MAIN_LINE, (inputs, _params) => {
    const p1 = getGeometry(inputs, GEOM.P1, isPoint, "Point");
    const p2 = getGeometry(inputs, GEOM.P2, isPoint, "Point");
    return line(p1.x, p1.y, p2.x, p2.y);
  }),

  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.MAIN_LINE, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 4: Circle center C1
 * First circle center positioned at C1_POSITION_RATIO along the main line.
 * C1 must lie on the main line as it's the center of the first circle.
 */
const STEP_C1: Step<SquareConfig> = {
  id: "step_c1",
  inputs: [GEOM.MAIN_LINE],
  outputs: [GEOM.C1],
  parameters: ["C1_POSITION_RATIO"],

  compute: computeSingle(GEOM.C1, (inputs, params) => {
    const mainLine = getGeometry(inputs, GEOM.MAIN_LINE, isLine, "Line");
    const lineLength = mainLine.x2 - mainLine.x1;
    const c1x = mainLine.x1 + lineLength * params.C1_POSITION_RATIO;
    return point(c1x, mainLine.y1);
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C1, 2.0, store, theme);
  },
};

/**
 * Step 5: Circle outline C1_C
 * First circle centered at C1 with the configured radius.
 * This circle will intersect with the main line at C2.
 */
const STEP_C1_CIRCLE: Step<SquareConfig> = {
  id: "step_c1_circle",
  inputs: [GEOM.C1],
  outputs: [GEOM.C1_CIRCLE],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.C1_CIRCLE, (inputs, params) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    return circleFromPoint(c1, params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_CIRCLE, 0.5, store, theme);
  },
};

/**
 * Step 6: Circle center C2
 * Second circle center at the left intersection of C1_CIRCLE with MAIN_LINE.
 * C2 lies on the main line, left of C1, at a distance of circleRadius.
 */
const STEP_C2: Step<SquareConfig> = {
  id: "step_c2",
  inputs: [GEOM.MAIN_LINE, GEOM.C1_CIRCLE],
  outputs: [GEOM.C2],
  parameters: ["tolerance"],

  compute: computeSingle(GEOM.C2, (inputs, params) => {
    const mainLine = getGeometry(inputs, GEOM.MAIN_LINE, isLine, "Line");
    const c1_c = getGeometry(inputs, GEOM.C1_CIRCLE, isCircle, "Circle");
    // C2 is the left intersection point of C1_CIRCLE with MAIN_LINE
    const c2 = pointFromCircleAndLine(c1_c, mainLine, {
      tolerance: params.tolerance,
    });
    if (!c2) throw new Error("C1_CIRCLE and MAIN_LINE do not intersect");
    return c2;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C2, 2.0, store, theme);
  },
};

/**
 * Step 7: Draw circle outline C2_C
 * Second circle centered at C2 with the same radius as C1_C.
 * These two circles will intersect at point PI (north and south).
 */
const STEP_C2_CIRCLE: Step<SquareConfig> = {
  id: "step_c2_circle",
  inputs: [GEOM.C2],
  outputs: [GEOM.C2_CIRCLE],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.C2_CIRCLE, (inputs, params) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    return circleFromPoint(c2, params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C2_CIRCLE, 0.5, store, theme);
  },
};

/**
 * Step 8: Compute intersection point PI
 * Finds where the two circles (C1_C and C2_C) intersect.
 * Selects north (top) intersection point using selectMinY parameter.
 * This is the apex of the triangle formed by C1, C2, and PI.
 */
const STEP_INTERSECTION_POINT: Step<SquareConfig> = {
  id: "step_intersection_point",
  inputs: [GEOM.C1_CIRCLE, GEOM.C2_CIRCLE],
  outputs: [GEOM.INTERSECTION_POINT],
  parameters: ["selectMinY"],

  compute: computeSingle(GEOM.INTERSECTION_POINT, (inputs, params) => {
    const c1_c = getGeometry(inputs, GEOM.C1_CIRCLE, isCircle, "Circle");
    const c2_c = getGeometry(inputs, GEOM.C2_CIRCLE, isCircle, "Circle");
    const pi = pointFromCircles(c1_c, c2_c, {
      select: params.selectMinY ? "north" : "south",
    });
    if (!pi) throw new Error("Circles do not intersect");
    return pi;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.INTERSECTION_POINT, 2.0, store, theme);
  },
};

/**
 * Step 9: Draw intersection circle CI
 * Circle centered at PI with the same radius as C1_C and C2_C.
 * Used as reference for finding points P3 and P4 in subsequent steps.
 */
const STEP_INTERSECTION_CIRCLE: Step<SquareConfig> = {
  id: "step_intersection_circle",
  inputs: [GEOM.INTERSECTION_POINT],
  outputs: [GEOM.INTERSECTION_CIRCLE],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.INTERSECTION_CIRCLE, (inputs, params) => {
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    return circleFromPoint(pi, params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.INTERSECTION_CIRCLE, 0.5, store, theme);
  },
};

/**
 * Step 10: Draw line from C2 towards PI
 * Extended line from C2 through PI with length = 1.1 * diameter of CI (2.2 * radius).
 * Used to find P3 as the intersection with CI (other than C2).
 */
const STEP_LINE_C2_PI: Step<SquareConfig> = {
  id: "step_line_c2_pi",
  inputs: [GEOM.C2, GEOM.INTERSECTION_POINT],
  outputs: [GEOM.LINE_C2_PI],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.LINE_C2_PI, (inputs, params) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    return lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    // Keep default stroke, only length is 1.1 * diameter
    drawLine(svg, values, GEOM.LINE_C2_PI, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 11: Compute P3 as intersection of line_c2_pi with CI
 * P3 is the second intersection point of LINE_C2_PI with CI (excluding C2).
 * C2 is derived from the start of LINE_C2_PI.
 * Forms one corner of the square construction.
 */
const STEP_P3: Step<SquareConfig> = {
  id: "step_p3",
  inputs: [GEOM.LINE_C2_PI, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.P3],
  parameters: ["tolerance"],

  compute: computeSingle(GEOM.P3, (inputs, params) => {
    const line_c2_pi = getGeometry(inputs, GEOM.LINE_C2_PI, isLine, "Line");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    // Derive C2 from the start of LINE_C2_PI (C2 is at x1, y1)
    const c2 = point(line_c2_pi.x1, line_c2_pi.y1);
    const p3 = pointFromCircleAndLine(ci, line_c2_pi, {
      exclude: c2,
      tolerance: params.tolerance,
    });
    if (!p3) throw new Error("No valid intersection found for P3");
    return p3;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P3, 2.0, store, theme);
  },
};

/**
 * Step 12: Draw line from C1 towards PI
 * Extended line from C1 through PI with length = 1.1 * diameter of CI (2.2 * radius).
 * Used to find P4 as the intersection with CI (other than C1).
 */
const STEP_LINE_C1_PI: Step<SquareConfig> = {
  id: "step_line_c1_pi",
  inputs: [GEOM.C1, GEOM.INTERSECTION_POINT],
  outputs: [GEOM.LINE_C1_PI],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.LINE_C1_PI, (inputs, params) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    return lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * params.circleRadius);
  }),

  draw: (svg, values, store, theme) => {
    // Keep default stroke, only length is 1.1 * diameter
    drawLine(svg, values, GEOM.LINE_C1_PI, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 13: Compute P4 as intersection of line_c1_pi with CI
 * P4 is the second intersection point of LINE_C1_PI with CI (excluding C1).
 * C1 is derived from the start of LINE_C1_PI.
 * Forms the opposite corner of the square from P3.
 */
const STEP_P4: Step<SquareConfig> = {
  id: "step_p4",
  inputs: [GEOM.LINE_C1_PI, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.P4],
  parameters: ["tolerance"],

  compute: computeSingle(GEOM.P4, (inputs, params) => {
    const line_c1_pi = getGeometry(inputs, GEOM.LINE_C1_PI, isLine, "Line");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    // Derive C1 from the start of LINE_C1_PI (C1 is at x1, y1)
    const c1 = point(line_c1_pi.x1, line_c1_pi.y1);
    const p4 = pointFromCircleAndLine(ci, line_c1_pi, {
      exclude: c1,
      tolerance: params.tolerance,
    });
    if (!p4) throw new Error("No valid intersection found for P4");
    return p4;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P4, 2.0, store, theme);
  },
};

/**
 * Step 14: Draw line from C2 to P4
 * Connecting line between circle center C2 and point P4.
 * Used to find tangent point PL in the next step.
 */
const STEP_LINE_C2_P4: Step<SquareConfig> = {
  id: "step_line_c2_p4",
  inputs: [GEOM.C2, GEOM.P4],
  outputs: [GEOM.LINE_C2_P4],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C2_P4, (inputs) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const p4 = getGeometry(inputs, GEOM.P4, isPoint, "Point");
    return line(c2.x, c2.y, p4.x, p4.y);
  }),

  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LINE_C2_P4, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 15: Compute PL (tangent point from C2 to P4 line)
 * PL is the intersection of C2_CIRCLE with LINE_C2_P4.
 * Uses the existing C2_CIRCLE instead of creating a new one.
 * This represents the tangent point on the left side of the square.
 */
const STEP_PL: Step<SquareConfig> = {
  id: "step_pl",
  inputs: [GEOM.C2_CIRCLE, GEOM.LINE_C2_P4],
  outputs: [GEOM.PL],
  parameters: [],

  compute: computeSingle(GEOM.PL, (inputs) => {
    const c2_circle = getGeometry(inputs, GEOM.C2_CIRCLE, isCircle, "Circle");
    const line_c2_p4 = getGeometry(inputs, GEOM.LINE_C2_P4, isLine, "Line");
    // Use the existing C2_CIRCLE
    const pl = pointFromCircleAndLine(c2_circle, line_c2_p4);
    if (!pl) throw new Error("No valid intersection found for PL");
    return pl;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PL, 2.0, store, theme);
  },
};

/**
 * Step 16: Draw line from C1 to P3
 * Connecting line between circle center C1 and point P3.
 * Used to find tangent point PR in the next step.
 */
const STEP_LINE_C1_P3: Step<SquareConfig> = {
  id: "step_line_c1_p3",
  inputs: [GEOM.C1, GEOM.P3],
  outputs: [GEOM.LINE_C1_P3],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C1_P3, (inputs) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const p3 = getGeometry(inputs, GEOM.P3, isPoint, "Point");
    return line(c1.x, c1.y, p3.x, p3.y);
  }),

  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LINE_C1_P3, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 17: Compute PR (tangent point from C1 to P3 line)
 * PR is the intersection of C1_CIRCLE with LINE_C1_P3.
 * Uses the existing C1_CIRCLE instead of creating a new one.
 * This represents the tangent point on the right side of the square.
 */
const STEP_PR: Step<SquareConfig> = {
  id: "step_pr",
  inputs: [GEOM.C1_CIRCLE, GEOM.LINE_C1_P3],
  outputs: [GEOM.PR],
  parameters: [],

  compute: computeSingle(GEOM.PR, (inputs) => {
    const c1_circle = getGeometry(inputs, GEOM.C1_CIRCLE, isCircle, "Circle");
    const line_c1_p3 = getGeometry(inputs, GEOM.LINE_C1_P3, isLine, "Line");
    // Use the existing C1_CIRCLE
    const pr = pointFromCircleAndLine(c1_circle, line_c1_p3);
    if (!pr) throw new Error("No valid intersection found for PR");
    return pr;
  }),

  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PR, 2.0, store, theme);
  },
};

/**
 * Step 18: Draw final square polygon
 * Constructs the square polygon from the four corner points: PL, PR, C1, C2.
 * This is the final step that connects all computed points into the complete square geometry.
 */
const STEP_FINAL_SQUARE: Step<SquareConfig> = {
  id: "step_final_square",
  inputs: [GEOM.C1, GEOM.C2, GEOM.PR, GEOM.PL],
  outputs: [GEOM.SQUARE],
  parameters: [],

  compute: computeSingle(GEOM.SQUARE, (inputs) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const pr = getGeometry(inputs, GEOM.PR, isPoint, "Point");
    const pl = getGeometry(inputs, GEOM.PL, isPoint, "Point");
    return makeSquare(pl, pr, c1, c2);
  }),

  draw: (svg, values, store, theme) => {
    const square = values.get(GEOM.SQUARE);

    if (!square || !isPolygon(square)) return;

    const svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = square.points.map((p) => `${p.x},${p.y}`).join(" ");
    svgPolygon.setAttribute("points", points);
    // Stroke uses theme.COLOR_PRIMARY with GOLDEN_RATIO width
    svgPolygon.setAttribute("stroke", theme.COLOR_PRIMARY);
    svgPolygon.setAttribute("stroke-width", GOLDEN_RATIO.toString());
    svgPolygon.setAttribute("fill", "none");
    svgPolygon.setAttribute("pointer-events", "none");
    svgPolygon.setAttribute("data-tooltip", GEOM.SQUARE);
    svgPolygon.style.cursor = "pointer";
    svg.appendChild(svgPolygon);

    // Create tooltip element for the polygon
    const tooltipX = square.points[0].x + 15;
    const tooltipY = square.points[0].y;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, GEOM.SQUARE, 15, theme);
    // Store tooltip references on the element
    (svgPolygon as any).tooltip = tooltip;
    (svgPolygon as any).tooltipBg = tooltipBg;

    if (store) {
      store.add(GEOM.SQUARE, svgPolygon, "polygon", []);
    }
  },
};

/** All steps in the rotated square construction, in order */
export const ROTATED_SQUARE_STEPS: readonly Step<SquareConfig>[] = [
  STEP_COORDINATE_SYSTEM,
  STEP_P1,
  STEP_P2,
  STEP_MAIN_LINE,
  STEP_C1,
  STEP_C1_CIRCLE,
  STEP_C2,
  STEP_C2_CIRCLE,
  STEP_INTERSECTION_POINT,
  STEP_INTERSECTION_CIRCLE,
  STEP_LINE_C2_PI,
  STEP_P3,
  STEP_LINE_C1_PI,
  STEP_P4,
  STEP_LINE_C2_P4,
  STEP_PL,
  STEP_LINE_C1_P3,
  STEP_PR,
  STEP_FINAL_SQUARE,
];

// Step Execution Utility

/**
 * Executes a single step: computes outputs and draws them.
 * @param step - The step to execute
 * @param allValues - Map of ALL geometry values computed so far (including previous steps)
 * @param ctx - Execution context (SVG, config, store)
 * @param squareConfig - Square geometry configuration
 * @returns Updated map of geometry values (with new outputs added)
 */
export function executeStep(
  step: Step<SquareConfig>,
  allValues: Map<string, GeometryValue>,
  ctx: StepExecutionContext,
  squareConfig: SquareConfig,
): Map<string, GeometryValue> {
  // Collect input values for this step
  const inputValues = new Map<string, GeometryValue>();
  for (const inputId of step.inputs) {
    const value = allValues.get(inputId);
    if (!value) {
      throw new Error(`Step ${step.id}: missing input geometry ${inputId}`);
    }
    inputValues.set(inputId, value);
  }

  // Use squareConfig directly (it now contains all required parameters)
  const outputValues = step.compute(inputValues, squareConfig);

  // Add outputs to allValues
  const newAllValues = new Map(allValues);
  for (const [id, value] of outputValues) {
    newAllValues.set(id, value);
  }

  // Draw the step
  step.draw(ctx.svg, newAllValues, ctx.store, ctx.theme);

  return newAllValues;
}

/**
 * Executes all steps up to a given index.
 * @param steps - Array of steps to execute
 * @param upToIndex - Execute steps[0] through steps[upToIndex-1]
 * @param ctx - Execution context containing svg, store, and theme
 * @param squareConfig - Square geometry configuration
 * @returns Map of all computed geometry values
 */
export function executeSteps(
  steps: readonly Step<SquareConfig>[],
  upToIndex: number,
  ctx: StepExecutionContext,
  squareConfig: SquareConfig,
): Map<string, GeometryValue> {
  let allValues = new Map<string, GeometryValue>();

  for (let i = 0; i < Math.min(upToIndex, steps.length); i++) {
    allValues = executeStep(steps[i], allValues, ctx, squareConfig);
  }

  return allValues;
}
