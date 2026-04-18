// Step definitions for the square geometric construction.
// Each step declares:
// - inputs: Geometry IDs this step depends on
// - outputs: Geometry IDs this step produces
// - compute: Pure function that calculates outputs from inputs
// - draw: Function that renders the step's geometries
// This enables lazy calculation, automatic dependency tracking,
// and separation of math and rendering

import type { Step, GeometryValue, SquareParameters } from "../types/geometry";
import { point, line, isPoint, isCircle, isLine, isPolygon } from "../types/geometry";
import {
  computeSquareConfig,
  GEOM,
  GOLDEN_RATIO,
  C1_POSITION_RATIO,
  LINE_EXTENSION_MULTIPLIER,
  DEFAULT_TOLERANCE,
  getGeometry,
  computeSingle,
  computeMultiple,
  type SquareConfig,
} from "./operations";
import {
  circleFromPoint,
  pointFromCircles,
  pointFromCircleAndLine,
  square as makeSquare,
  lineTowards,
  circleWithRadiusFrom,
} from "./constructors";
import { createTooltip, drawPoint, drawLine, drawCircle, COLOR_PRIMARY } from "../svgElements";
import type { GeometryStore } from "../react-store";

export {
  computeSquareConfig,
  GEOM,
  GOLDEN_RATIO,
  LINE_EXTENSION_MULTIPLIER,
  DEFAULT_TOLERANCE,
  getGeometry,
  computeSingle,
  computeMultiple,
};
export type { SquareConfig };

// Step 1: Draw the main horizontal line
// Inputs: none (uses SVG config)
// Outputs: line_main
const STEP_MAIN_LINE: Step = {
  id: "step_main_line",
  inputs: [],
  outputs: [GEOM.MAIN_LINE],
  parameters: ["lx1", "ly1", "lx2", "ly2"],

  compute: computeSingle(GEOM.MAIN_LINE, (_inputs, params) => {
    return line(params.lx1, params.ly1, params.lx2, params.ly2);
  }),

  draw: (svg, values, store) => {
    drawLine(svg, values, GEOM.MAIN_LINE, 0.5, store);
  },
};

// Step 2: Draw circle center c1
// Inputs: line_main (C1 must lie on the main line)
// Outputs: c1
const STEP_C1: Step = {
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

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.C1, 2.0, store);
  },
};

// Step 3: Draw circle outline c1_c
// Inputs: c1
// Outputs: c1_c
const STEP_C1_CIRCLE: Step = {
  id: "step_c1_circle",
  inputs: [GEOM.C1],
  outputs: [GEOM.C1_CIRCLE],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.C1_CIRCLE, (inputs, params) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    return circleFromPoint(c1, params.circleRadius);
  }),

  draw: (svg, values, store) => {
    drawCircle(svg, values, GEOM.C1_CIRCLE, 0.5, store);
  },
};

// Step 4: Draw circle center c2
// Inputs: line_main, c1_c (C2 is the intersection of MAIN_LINE and C1_CIRCLE)
// Outputs: c2
const STEP_C2: Step = {
  id: "step_c2",
  inputs: [GEOM.MAIN_LINE, GEOM.C1_CIRCLE],
  outputs: [GEOM.C2],
  parameters: [],

  compute: computeSingle(GEOM.C2, (inputs) => {
    const mainLine = getGeometry(inputs, GEOM.MAIN_LINE, isLine, "Line");
    const c1_c = getGeometry(inputs, GEOM.C1_CIRCLE, isCircle, "Circle");
    // C2 is the left intersection point of C1_CIRCLE with MAIN_LINE
    return point(c1_c.cx - c1_c.r, mainLine.y1);
  }),

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.C2, 2.0, store);
  },
};

// Step 5: Draw circle outline c2_c
// Inputs: c2
// Outputs: c2_c
const STEP_C2_CIRCLE: Step = {
  id: "step_c2_circle",
  inputs: [GEOM.C2],
  outputs: [GEOM.C2_CIRCLE],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.C2_CIRCLE, (inputs, params) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    return circleFromPoint(c2, params.circleRadius);
  }),

  draw: (svg, values, store) => {
    drawCircle(svg, values, GEOM.C2_CIRCLE, 0.5, store);
  },
};

// Step 6: Compute intersection point (pi) from the two circles, picking the north point
// Inputs: c1_c, c2_c
// Outputs: pi
const STEP_INTERSECTION_POINT: Step = {
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

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.INTERSECTION_POINT, 2.0, store);
  },
};

// Step 7: Draw intersection circle (ci) at the intersection point with same radius
// Inputs: pi, c1_c
// Outputs: ci
const STEP_INTERSECTION_CIRCLE: Step = {
  id: "step_intersection_circle",
  inputs: [GEOM.INTERSECTION_POINT, GEOM.C1_CIRCLE],
  outputs: [GEOM.INTERSECTION_CIRCLE],
  parameters: [],

  compute: computeSingle(GEOM.INTERSECTION_CIRCLE, (inputs) => {
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    const c1_c = getGeometry(inputs, GEOM.C1_CIRCLE, isCircle, "Circle");
    return circleWithRadiusFrom(pi, c1_c);
  }),

  draw: (svg, values, store) => {
    drawCircle(svg, values, GEOM.INTERSECTION_CIRCLE, 0.5, store);
  },
};

// Step 8: Draw line from C2 with length = 1.1 * diameter of ci, towards pi
// The line length is 1.1 * 2 * circleRadius = 2.2 * circleRadius
// This line will be used to find P3 as the intersection with INTERSECTION_CIRCLE (other than C2)
// Inputs: c2, pi, ci
// Outputs: line_c2_pi
const STEP_LINE_C2_PI: Step = {
  id: "step_line_c2_pi",
  inputs: [GEOM.C2, GEOM.INTERSECTION_POINT, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.LINE_C2_PI],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C2_PI, (inputs) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    return lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * ci.r);
  }),

  draw: (svg, values, store) => {
    // Keep default stroke, only length is 1.1 * diameter
    drawLine(svg, values, GEOM.LINE_C2_PI, 0.5, store);
  },
};

// Step 9: Compute P3 as intersection of line_c2_pi with INTERSECTION_CIRCLE
// P3 is the other intersection point (not C2)
// Inputs: line_c2_pi, ci, c2
// Outputs: p3
const STEP_P3: Step = {
  id: "step_p3",
  inputs: [GEOM.LINE_C2_PI, GEOM.INTERSECTION_CIRCLE, GEOM.C2],
  outputs: [GEOM.P3],
  parameters: ["tolerance"],

  compute: computeSingle(GEOM.P3, (inputs, params) => {
    const line_c2_pi = getGeometry(inputs, GEOM.LINE_C2_PI, isLine, "Line");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const p3 = pointFromCircleAndLine(ci, line_c2_pi, {
      exclude: c2,
      tolerance: params.tolerance,
    });
    if (!p3) throw new Error("No valid intersection found for P3");
    return p3;
  }),

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.P3, 2.0, store);
  },
};

// Step 10: Draw line from C1 with length = 1.1 * diameter of ci, towards pi
// The line length is 1.1 * 2 * circleRadius = 2.2 * circleRadius
// This line will be used to find P4 as the intersection with INTERSECTION_CIRCLE (other than C1)
// Inputs: c1, pi, ci
// Outputs: line_c1_pi
const STEP_LINE_C1_PI: Step = {
  id: "step_line_c1_pi",
  inputs: [GEOM.C1, GEOM.INTERSECTION_POINT, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.LINE_C1_PI],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C1_PI, (inputs) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const pi = getGeometry(inputs, GEOM.INTERSECTION_POINT, isPoint, "Point");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    return lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * ci.r);
  }),

  draw: (svg, values, store) => {
    // Keep default stroke, only length is 1.1 * diameter
    drawLine(svg, values, GEOM.LINE_C1_PI, 0.5, store);
  },
};

// Step 11: Compute P4 as intersection of line_c1_pi with INTERSECTION_CIRCLE
// P4 is the other intersection point (not C1)
// Inputs: line_c1_pi, ci, c1
// Outputs: p4
const STEP_P4: Step = {
  id: "step_p4",
  inputs: [GEOM.LINE_C1_PI, GEOM.INTERSECTION_CIRCLE, GEOM.C1],
  outputs: [GEOM.P4],
  parameters: ["tolerance"],

  compute: computeSingle(GEOM.P4, (inputs, params) => {
    const line_c1_pi = getGeometry(inputs, GEOM.LINE_C1_PI, isLine, "Line");
    const ci = getGeometry(inputs, GEOM.INTERSECTION_CIRCLE, isCircle, "Circle");
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const p4 = pointFromCircleAndLine(ci, line_c1_pi, {
      exclude: c1,
      tolerance: params.tolerance,
    });
    if (!p4) throw new Error("No valid intersection found for P4");
    return p4;
  }),

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.P4, 2.0, store);
  },
};

// Step 12: Draw line from C2 to P4
// Inputs: c2, p4
// Outputs: line_c2_p4
const STEP_LINE_C2_P4: Step = {
  id: "step_line_c2_p4",
  inputs: [GEOM.C2, GEOM.P4],
  outputs: [GEOM.LINE_C2_P4],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C2_P4, (inputs) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const p4 = getGeometry(inputs, GEOM.P4, isPoint, "Point");
    return line(c2.x, c2.y, p4.x, p4.y);
  }),

  draw: (svg, values, store) => {
    drawLine(svg, values, GEOM.LINE_C2_P4, 0.5, store);
  },
};

// Step 13: Compute and draw pl (tangent point from c2 to p4 line)
// Inputs: c2, p4, line_c2_p4
// Outputs: pl
const STEP_PL: Step = {
  id: "step_pl",
  inputs: [GEOM.C2, GEOM.P4, GEOM.LINE_C2_P4],
  outputs: [GEOM.PL],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.PL, (inputs, params) => {
    const c2 = getGeometry(inputs, GEOM.C2, isPoint, "Point");
    const line_c2_p4 = getGeometry(inputs, GEOM.LINE_C2_P4, isLine, "Line");
    // Circle at c2 with given radius
    const circle_c2 = circleFromPoint(c2, params.circleRadius);
    const pl = pointFromCircleAndLine(circle_c2, line_c2_p4);
    if (!pl) throw new Error("No valid intersection found for PL");
    return pl;
  }),

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.PL, 2.0, store);
  },
};

// Step 14: Draw line from C1 to P3
// Inputs: c1, p3
// Outputs: line_c1_p3
const STEP_LINE_C1_P3: Step = {
  id: "step_line_c1_p3",
  inputs: [GEOM.C1, GEOM.P3],
  outputs: [GEOM.LINE_C1_P3],
  parameters: [],

  compute: computeSingle(GEOM.LINE_C1_P3, (inputs) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const p3 = getGeometry(inputs, GEOM.P3, isPoint, "Point");
    return line(c1.x, c1.y, p3.x, p3.y);
  }),

  draw: (svg, values, store) => {
    drawLine(svg, values, GEOM.LINE_C1_P3, 0.5, store);
  },
};

// Step 15: Compute and draw pr (tangent point from c1 to p3 line)
// Inputs: c1, p3, line_c1_p3
// Outputs: pr
const STEP_PR: Step = {
  id: "step_pr",
  inputs: [GEOM.C1, GEOM.P3, GEOM.LINE_C1_P3],
  outputs: [GEOM.PR],
  parameters: ["circleRadius"],

  compute: computeSingle(GEOM.PR, (inputs, params) => {
    const c1 = getGeometry(inputs, GEOM.C1, isPoint, "Point");
    const line_c1_p3 = getGeometry(inputs, GEOM.LINE_C1_P3, isLine, "Line");
    // Circle at c1 with given radius
    const circle_c1 = circleFromPoint(c1, params.circleRadius);
    const pr = pointFromCircleAndLine(circle_c1, line_c1_p3);
    if (!pr) throw new Error("No valid intersection found for PR");
    return pr;
  }),

  draw: (svg, values, store) => {
    drawPoint(svg, values, GEOM.PR, 2.0, store);
  },
};

// Step 16: Draw square polygon
// Inputs: c1, c2, pr, pl
// Outputs: square (polygon with 4 vertices)
const STEP_FINAL_SQUARE: Step = {
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

  draw: (svg, values, store) => {
    const square = values.get(GEOM.SQUARE);

    if (!square || !isPolygon(square)) return;

    const svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = square.points.map((p) => `${p.x},${p.y}`).join(" ");
    svgPolygon.setAttribute("points", points);
    svgPolygon.setAttribute("stroke", COLOR_PRIMARY);
    svgPolygon.setAttribute("stroke-width", GOLDEN_RATIO.toString());
    svgPolygon.setAttribute("fill", "none");
    svgPolygon.setAttribute("data-tooltip", GEOM.SQUARE);
    svgPolygon.style.cursor = "pointer";
    svg.appendChild(svgPolygon);

    // Create tooltip element for the polygon
    const tooltipX = square.points[0].x + 15;
    const tooltipY = square.points[0].y;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, GEOM.SQUARE, 15);
    // Store tooltip references on the element
    (svgPolygon as any).tooltip = tooltip;
    (svgPolygon as any).tooltipBg = tooltipBg;

    if (store) {
      store.add(GEOM.SQUARE, svgPolygon, "polygon");
    }
  },
};

// All steps in the square construction, in order
export const SQUARE_STEPS: readonly Step[] = [
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

export interface StepExecutionContext {
  svg: SVGSVGElement;
  config: { width: number; height: number; stroke: number; strokeBig: number };
  store?: GeometryStore;
}

// Executes a single step: computes outputs and draws them.
// Step - The step to execute
// allValues - Map of ALL geometry values computed so far (including previous steps)
// ctx - Execution context (SVG, config, store)
// squareConfig - Square geometry configuration
// returns Updated map of geometry values (with new outputs added)
export function executeStep(
  step: Step,
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

  // Build SquareParameters object from config and constants
  const params: SquareParameters = {
    lx1: squareConfig.lx1,
    ly1: squareConfig.ly1,
    lx2: squareConfig.lx2,
    ly2: squareConfig.ly2,
    circleRadius: squareConfig.circleRadius,
    C1_POSITION_RATIO,
    tolerance: DEFAULT_TOLERANCE,
    selectMinY: true,
  };

  // Compute outputs
  const outputValues = step.compute(inputValues, params);

  // Add outputs to allValues
  const newAllValues = new Map(allValues);
  for (const [id, value] of outputValues) {
    newAllValues.set(id, value);
  }

  // Draw the step
  step.draw(ctx.svg, newAllValues, ctx.store);

  return newAllValues;
}

// Executes all steps up to a given index.
// Steps - Array of steps to execute
// upToIndex - Execute steps[0] through steps[upToIndex-1]
// ctx - Execution context
// squareConfig - Square geometry configuration
// returns Map of all computed geometry values
export function executeSteps(
  steps: readonly Step[],
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
