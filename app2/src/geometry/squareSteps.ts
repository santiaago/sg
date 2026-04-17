// Step definitions for the square geometric construction.
// Each step declares:
// - inputs: Geometry IDs this step depends on
// - outputs: Geometry IDs this step produces
// - compute: Pure function that calculates outputs from inputs
// - draw: Function that renders the step's geometries
// This enables lazy calculation, automatic dependency tracking,
// and separation of math and rendering

import type { Step, GeometryValue, StepConfig } from "../types/geometry";
import { point, line, isPoint, isCircle, isLine } from "../types/geometry";
import {
  computeSquareConfig,
  GEOM,
  computeCircleIntersection,
  computeBisectedPoints,
  computeTangentPoints,
  GOLDEN_RATIO,
  type SquareConfig,
} from "./operations";
import { dotWithTooltip, lineWithTooltip, circleWithTooltip } from "../svgElements";
import type { GeometryStore } from "../react-store";

export { computeSquareConfig, GEOM, GOLDEN_RATIO };
export type { SquareConfig };

// Step 1: Draw the main horizontal line
// Inputs: none (uses SVG config)
// Outputs: line_main
const STEP_MAIN_LINE: Step = {
  id: "step_main_line",
  inputs: [],
  outputs: [GEOM.MAIN_LINE],

  compute: (_inputs, config) => {
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.MAIN_LINE, line(config.lx1, config.ly1, config.lx2, config.ly2));
    return result;
  },

  draw: (svg, values, store) => {
    const mainLine = values.get(GEOM.MAIN_LINE);
    if (!mainLine || !isLine(mainLine)) return;
    lineWithTooltip(
      svg,
      mainLine.x1,
      mainLine.y1,
      mainLine.x2,
      mainLine.y2,
      GEOM.MAIN_LINE,
      0.5,
      store,
    );
  },
};

// Step 2: Draw circle center c1
// Inputs: none (uses SVG config)
// Outputs: c1
const STEP_C1: Step = {
  id: "step_c1",
  inputs: [],
  outputs: [GEOM.C1],

  compute: (_inputs, config) => {
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.C1, point(config.c1x, config.ly2));
    return result;
  },

  draw: (svg, values, store) => {
    const c1 = values.get(GEOM.C1);
    if (!c1 || !isPoint(c1)) return;
    dotWithTooltip(svg, c1.x, c1.y, GEOM.C1, 2.0, store);
  },
};

// Step 3: Draw circle outline c1_c
// Inputs: c1
// Outputs: c1_c
const STEP_C1_CIRCLE: Step = {
  id: "step_c1_circle",
  inputs: [GEOM.C1],
  outputs: [GEOM.C1_CIRCLE],

  compute: (inputs, config) => {
    const c1 = inputs.get(GEOM.C1);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.C1_CIRCLE, {
      type: "circle" as const,
      cx: c1.x,
      cy: c1.y,
      r: config.circleRadius,
    });
    return result;
  },

  draw: (svg, values, store) => {
    const c1_c = values.get(GEOM.C1_CIRCLE);
    if (!c1_c || !isCircle(c1_c)) return;
    circleWithTooltip(svg, c1_c.cx, c1_c.cy, c1_c.r, GEOM.C1_CIRCLE, 0.5, store);
  },
};

// Step 4: Draw circle center c2
// Inputs: none (uses SVG config)
// Outputs: c2
const STEP_C2: Step = {
  id: "step_c2",
  inputs: [],
  outputs: [GEOM.C2],

  compute: (_inputs, config) => {
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.C2, point(config.c2x, config.ly2));
    return result;
  },

  draw: (svg, values, store) => {
    const c2 = values.get(GEOM.C2);
    if (!c2 || !isPoint(c2)) return;
    dotWithTooltip(svg, c2.x, c2.y, GEOM.C2, 2.0, store);
  },
};

// Step 5: Draw circle outline c2_c
// Inputs: c2
// Outputs: c2_c
const STEP_C2_CIRCLE: Step = {
  id: "step_c2_circle",
  inputs: [GEOM.C2],
  outputs: [GEOM.C2_CIRCLE],

  compute: (inputs, config) => {
    const c2 = inputs.get(GEOM.C2);

    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.C2_CIRCLE, {
      type: "circle" as const,
      cx: c2.x,
      cy: c2.y,
      r: config.circleRadius,
    });
    return result;
  },

  draw: (svg, values, store) => {
    const c2_c = values.get(GEOM.C2_CIRCLE);
    if (!c2_c || !isCircle(c2_c)) return;
    circleWithTooltip(svg, c2_c.cx, c2_c.cy, c2_c.r, GEOM.C2_CIRCLE, 0.5, store);
  },
};

// Step 6: Compute and draw intersection point (pi) and circle (ci)
// Inputs: c1_c, c2_c
// Outputs: pi, ci
const STEP_INTERSECTION: Step = {
  id: "step_intersection",
  inputs: [GEOM.C1_CIRCLE, GEOM.C2_CIRCLE],
  outputs: [GEOM.INTERSECTION_POINT, GEOM.INTERSECTION_CIRCLE],

  compute: (inputs) => {
    const c1_c = inputs.get(GEOM.C1_CIRCLE);
    const c2_c = inputs.get(GEOM.C2_CIRCLE);

    if (!c1_c || !isCircle(c1_c)) throw new Error(`Missing or invalid input: ${GEOM.C1_CIRCLE}`);
    if (!c2_c || !isCircle(c2_c)) throw new Error(`Missing or invalid input: ${GEOM.C2_CIRCLE}`);

    const { pi, ci } = computeCircleIntersection(c1_c, c2_c);
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.INTERSECTION_POINT, pi);
    result.set(GEOM.INTERSECTION_CIRCLE, ci);
    return result;
  },

  draw: (svg, values, store) => {
    const pi = values.get(GEOM.INTERSECTION_POINT);
    const ci = values.get(GEOM.INTERSECTION_CIRCLE);
    if (!pi || !isPoint(pi)) return;
    if (!ci || !isCircle(ci)) return;
    dotWithTooltip(svg, pi.x, pi.y, GEOM.INTERSECTION_POINT, 2.0, store);
    circleWithTooltip(svg, ci.cx, ci.cy, ci.r, GEOM.INTERSECTION_CIRCLE, 0.5, store);
  },
};

// Step 7: Compute and draw bisected points (p3, p4) and connecting lines to c2, c1
// Inputs: pi, c1, c2
// Outputs: p3, p4, line_c2_p3, line_c1_p4
const STEP_BISECTED_POINTS: Step = {
  id: "step_bisected_points",
  inputs: [GEOM.INTERSECTION_POINT, GEOM.C1, GEOM.C2],
  outputs: [GEOM.P3, GEOM.P4, GEOM.LINE_C2_P3, GEOM.LINE_C1_P4],

  compute: (inputs, config) => {
    const pi = inputs.get(GEOM.INTERSECTION_POINT);
    const c1 = inputs.get(GEOM.C1);
    const c2 = inputs.get(GEOM.C2);

    if (!pi || !isPoint(pi))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_POINT}`);
    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);

    const { p3, p4 } = computeBisectedPoints(pi, c1, c2, config.circleRadius);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.P3, p3);
    result.set(GEOM.P4, p4);
    result.set(GEOM.LINE_C2_P3, line(c2.x, c2.y, p3.x, p3.y));
    result.set(GEOM.LINE_C1_P4, line(c1.x, c1.y, p4.x, p4.y));
    return result;
  },

  draw: (svg, values, store) => {
    const c2 = values.get(GEOM.C2);
    const c1 = values.get(GEOM.C1);
    const p3 = values.get(GEOM.P3);
    const p4 = values.get(GEOM.P4);
    const line_c2_p3 = values.get(GEOM.LINE_C2_P3);
    const line_c1_p4 = values.get(GEOM.LINE_C1_P4);

    if (!c2 || !isPoint(c2)) return;
    if (!c1 || !isPoint(c1)) return;
    if (!p3 || !isPoint(p3)) return;
    if (!p4 || !isPoint(p4)) return;
    if (!line_c2_p3 || !isLine(line_c2_p3)) return;
    if (!line_c1_p4 || !isLine(line_c1_p4)) return;

    lineWithTooltip(
      svg,
      line_c2_p3.x1,
      line_c2_p3.y1,
      line_c2_p3.x2,
      line_c2_p3.y2,
      GEOM.LINE_C2_P3,
      0.5,
      store,
    );
    dotWithTooltip(svg, p3.x, p3.y, GEOM.P3, 2.0, store);
    dotWithTooltip(svg, p4.x, p4.y, GEOM.P4, 2.0, store);
    lineWithTooltip(
      svg,
      line_c1_p4.x1,
      line_c1_p4.y1,
      line_c1_p4.x2,
      line_c1_p4.y2,
      GEOM.LINE_C1_P4,
      0.5,
      store,
    );
  },
};

// Step 8: Draw connecting lines between circle centers and bisected points
// Inputs: c1, c2, p3, p4
// Outputs: line_c1_p3, line_c2_p4
const STEP_CONNECTING_LINES: Step = {
  id: "step_connecting_lines",
  inputs: [GEOM.C1, GEOM.C2, GEOM.P3, GEOM.P4],
  outputs: [GEOM.LINE_C1_P3, GEOM.LINE_C2_P4],

  compute: (inputs) => {
    const c1 = inputs.get(GEOM.C1);
    const c2 = inputs.get(GEOM.C2);
    const p3 = inputs.get(GEOM.P3);
    const p4 = inputs.get(GEOM.P4);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!p3 || !isPoint(p3)) throw new Error(`Missing or invalid input: ${GEOM.P3}`);
    if (!p4 || !isPoint(p4)) throw new Error(`Missing or invalid input: ${GEOM.P4}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_C1_P3, line(c1.x, c1.y, p3.x, p3.y));
    result.set(GEOM.LINE_C2_P4, line(c2.x, c2.y, p4.x, p4.y));
    return result;
  },

  draw: (svg, values, store) => {
    const line_c1_p3 = values.get(GEOM.LINE_C1_P3);
    const line_c2_p4 = values.get(GEOM.LINE_C2_P4);
    if (!line_c1_p3 || !isLine(line_c1_p3)) return;
    if (!line_c2_p4 || !isLine(line_c2_p4)) return;
    lineWithTooltip(
      svg,
      line_c1_p3.x1,
      line_c1_p3.y1,
      line_c1_p3.x2,
      line_c1_p3.y2,
      GEOM.LINE_C1_P3,
      0.5,
      store,
    );
    lineWithTooltip(
      svg,
      line_c2_p4.x1,
      line_c2_p4.y1,
      line_c2_p4.x2,
      line_c2_p4.y2,
      GEOM.LINE_C2_P4,
      0.5,
      store,
    );
  },
};

// Step 9: Draw line between bisected points (p3, p4)
// Inputs: p3, p4
// Outputs: line_p3_p4
const STEP_LINE_P3_P4: Step = {
  id: "step_line_p3_p4",
  inputs: [GEOM.P3, GEOM.P4],
  outputs: [GEOM.LINE_P3_P4],

  compute: (inputs) => {
    const p3 = inputs.get(GEOM.P3);
    const p4 = inputs.get(GEOM.P4);

    if (!p3 || !isPoint(p3)) throw new Error(`Missing or invalid input: ${GEOM.P3}`);
    if (!p4 || !isPoint(p4)) throw new Error(`Missing or invalid input: ${GEOM.P4}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_P3_P4, line(p3.x, p3.y, p4.x, p4.y));
    return result;
  },

  draw: (svg, values, store) => {
    const line_p3_p4 = values.get(GEOM.LINE_P3_P4);
    if (!line_p3_p4 || !isLine(line_p3_p4)) return;
    lineWithTooltip(
      svg,
      line_p3_p4.x1,
      line_p3_p4.y1,
      line_p3_p4.x2,
      line_p3_p4.y2,
      GEOM.LINE_P3_P4,
      0.5,
      store,
    );
  },
};

// Step 10: Compute and draw tangent points (pl, pr)
// Inputs: c1, c2, p3, p4
// Outputs: pl, pr
const STEP_TANGENT_POINTS: Step = {
  id: "step_tangent_points",
  inputs: [GEOM.C1, GEOM.C2, GEOM.P3, GEOM.P4],
  outputs: [GEOM.PL, GEOM.PR],

  compute: (inputs, config) => {
    const c1 = inputs.get(GEOM.C1);
    const c2 = inputs.get(GEOM.C2);
    const p3 = inputs.get(GEOM.P3);
    const p4 = inputs.get(GEOM.P4);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!p3 || !isPoint(p3)) throw new Error(`Missing or invalid input: ${GEOM.P3}`);
    if (!p4 || !isPoint(p4)) throw new Error(`Missing or invalid input: ${GEOM.P4}`);

    const { pl, pr } = computeTangentPoints(c2, p4, c1, p3, config.circleRadius);

    const result = new Map<string, GeometryValue>();
    if (pl) result.set(GEOM.PL, pl);
    if (pr) result.set(GEOM.PR, pr);
    return result;
  },

  draw: (svg, values, store) => {
    const pl = values.get(GEOM.PL);
    const pr = values.get(GEOM.PR);
    if (!pl || !isPoint(pl)) return;
    if (!pr || !isPoint(pr)) return;
    dotWithTooltip(svg, pl.x, pl.y, GEOM.PL, 2.0, store);
    dotWithTooltip(svg, pr.x, pr.y, GEOM.PR, 2.0, store);
  },
};

// Step 11: Draw final square lines
// Inputs: pl, pr, c1, c2
// Outputs: ls1, ls2, ls3, ls4
const STEP_FINAL_SQUARE: Step = {
  id: "step_final_square",
  inputs: [GEOM.PL, GEOM.PR, GEOM.C1, GEOM.C2],
  outputs: [GEOM.LS1, GEOM.LS2, GEOM.LS3, GEOM.LS4],

  compute: (inputs) => {
    const pl = inputs.get(GEOM.PL);
    const pr = inputs.get(GEOM.PR);
    const c1 = inputs.get(GEOM.C1);
    const c2 = inputs.get(GEOM.C2);

    if (!pl || !isPoint(pl)) throw new Error(`Missing or invalid input: ${GEOM.PL}`);
    if (!pr || !isPoint(pr)) throw new Error(`Missing or invalid input: ${GEOM.PR}`);
    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LS1, line(pl.x, pl.y, pr.x, pr.y));
    result.set(GEOM.LS2, line(c2.x, c2.y, pl.x, pl.y));
    result.set(GEOM.LS3, line(c2.x, c2.y, c1.x, c1.y));
    result.set(GEOM.LS4, line(c1.x, c1.y, pr.x, pr.y));
    return result;
  },

  draw: (svg, values, store) => {
    const ls1 = values.get(GEOM.LS1);
    const ls2 = values.get(GEOM.LS2);
    const ls3 = values.get(GEOM.LS3);
    const ls4 = values.get(GEOM.LS4);

    if (!ls1 || !isLine(ls1)) return;
    if (!ls2 || !isLine(ls2)) return;
    if (!ls3 || !isLine(ls3)) return;
    if (!ls4 || !isLine(ls4)) return;

    const stroke = GOLDEN_RATIO;
    lineWithTooltip(svg, ls1.x1, ls1.y1, ls1.x2, ls1.y2, GEOM.LS1, stroke, store);
    lineWithTooltip(svg, ls2.x1, ls2.y1, ls2.x2, ls2.y2, GEOM.LS2, stroke, store);
    lineWithTooltip(svg, ls3.x1, ls3.y1, ls3.x2, ls3.y2, GEOM.LS3, stroke, store);
    lineWithTooltip(svg, ls4.x1, ls4.y1, ls4.x2, ls4.y2, GEOM.LS4, stroke, store);
  },
};

// All steps in the square construction, in order
export const SQUARE_STEPS: readonly Step[] = [
  STEP_MAIN_LINE,
  STEP_C1,
  STEP_C1_CIRCLE,
  STEP_C2,
  STEP_C2_CIRCLE,
  STEP_INTERSECTION,
  STEP_BISECTED_POINTS,
  STEP_CONNECTING_LINES,
  STEP_LINE_P3_P4,
  STEP_TANGENT_POINTS,
  STEP_FINAL_SQUARE,
];

// Step Execution Utility

export interface StepExecutionContext {
  svg: SVGSVGElement;
  config: { width: number; height: number; stroke: number; strokeBig: number };
  store?: GeometryStore;
}

// Executes a single step: computes outputs and draws them.
// step - The step to execute
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

  // Create config for compute function with all needed values
  const stepConfig: StepConfig = {
    width: ctx.config.width,
    height: ctx.config.height,
    stroke: ctx.config.stroke,
    strokeBig: ctx.config.strokeBig,
    circleRadius: squareConfig.circleRadius,
    c1x: squareConfig.c1x,
    c2x: squareConfig.c2x,
    ly1: squareConfig.ly1,
    ly2: squareConfig.ly2,
    lx1: squareConfig.lx1,
    lx2: squareConfig.lx2,
  };

  // Compute outputs
  const outputValues = step.compute(inputValues, stepConfig);

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
// steps - Array of steps to execute
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
