// Step definitions for the square geometric construction.
// Each step declares:
// - inputs: Geometry IDs this step depends on
// - outputs: Geometry IDs this step produces
// - compute: Pure function that calculates outputs from inputs
// - draw: Function that renders the step's geometries
// This enables lazy calculation, automatic dependency tracking,
// and separation of math and rendering

import type { Step, GeometryValue, StepConfig } from "../types/geometry";
import { point, line, polygon, isPoint, isCircle, isLine, isPolygon } from "../types/geometry";
import { inteceptCircleLineSeg as interceptCircleLineSeg } from "@sg/geometry";
import {
  computeSquareConfig,
  GEOM,
  computeCircleIntersection,
  GOLDEN_RATIO,
  C1_POSITION_RATIO,
  type SquareConfig,
} from "./operations";
import { dotWithTooltip, lineWithTooltip, circleWithTooltip, createTooltip } from "../svgElements";
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
// Inputs: line_main (C1 must lie on the main line)
// Outputs: c1
const STEP_C1: Step = {
  id: "step_c1",
  inputs: [GEOM.MAIN_LINE],
  outputs: [GEOM.C1],

  compute: (inputs, _config) => {
    const mainLine = inputs.get(GEOM.MAIN_LINE);
    if (!mainLine || !isLine(mainLine)) {
      throw new Error(`Missing or invalid input: ${GEOM.MAIN_LINE}`);
    }
    const lineLength = mainLine.x2 - mainLine.x1;
    const c1x = mainLine.x1 + lineLength * C1_POSITION_RATIO;
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.C1, point(c1x, mainLine.y1));
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
// Inputs: line_main, c1_c (C2 is the intersection of MAIN_LINE and C1_CIRCLE)
// Outputs: c2
const STEP_C2: Step = {
  id: "step_c2",
  inputs: [GEOM.MAIN_LINE, GEOM.C1_CIRCLE],
  outputs: [GEOM.C2],

  compute: (inputs, _config) => {
    const mainLine = inputs.get(GEOM.MAIN_LINE);
    const c1_c = inputs.get(GEOM.C1_CIRCLE);

    if (!mainLine || !isLine(mainLine)) {
      throw new Error(`Missing or invalid input: ${GEOM.MAIN_LINE}`);
    }
    if (!c1_c || !isCircle(c1_c)) {
      throw new Error(`Missing or invalid input: ${GEOM.C1_CIRCLE}`);
    }

    const result = new Map<string, GeometryValue>();
    // C2 is the left intersection point of C1_CIRCLE with MAIN_LINE
    result.set(GEOM.C2, point(c1_c.cx - c1_c.r, mainLine.y1));
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

// Step 6: Compute intersection point (pi) from the two circles, picking the north point
// Inputs: c1_c, c2_c
// Outputs: pi
const STEP_INTERSECTION_POINT: Step = {
  id: "step_intersection_point",
  inputs: [GEOM.C1_CIRCLE, GEOM.C2_CIRCLE],
  outputs: [GEOM.INTERSECTION_POINT],

  compute: (inputs) => {
    const c1_c = inputs.get(GEOM.C1_CIRCLE);
    const c2_c = inputs.get(GEOM.C2_CIRCLE);

    if (!c1_c || !isCircle(c1_c)) throw new Error(`Missing or invalid input: ${GEOM.C1_CIRCLE}`);
    if (!c2_c || !isCircle(c2_c)) throw new Error(`Missing or invalid input: ${GEOM.C2_CIRCLE}`);

    const { pi } = computeCircleIntersection(c1_c, c2_c);
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.INTERSECTION_POINT, pi);
    return result;
  },

  draw: (svg, values, store) => {
    const pi = values.get(GEOM.INTERSECTION_POINT);
    if (!pi || !isPoint(pi)) return;
    dotWithTooltip(svg, pi.x, pi.y, GEOM.INTERSECTION_POINT, 2.0, store);
  },
};

// Step 7: Draw intersection circle (ci) at the intersection point with same radius
// Inputs: pi, c1_c
// Outputs: ci
const STEP_INTERSECTION_CIRCLE: Step = {
  id: "step_intersection_circle",
  inputs: [GEOM.INTERSECTION_POINT, GEOM.C1_CIRCLE],
  outputs: [GEOM.INTERSECTION_CIRCLE],

  compute: (inputs) => {
    const pi = inputs.get(GEOM.INTERSECTION_POINT);
    const c1_c = inputs.get(GEOM.C1_CIRCLE);

    if (!pi || !isPoint(pi))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_POINT}`);
    if (!c1_c || !isCircle(c1_c)) throw new Error(`Missing or invalid input: ${GEOM.C1_CIRCLE}`);

    const result = new Map<string, GeometryValue>();
    // Circle at intersection point with same radius as C1_CIRCLE
    result.set(GEOM.INTERSECTION_CIRCLE, {
      type: "circle" as const,
      cx: pi.x,
      cy: pi.y,
      r: c1_c.r,
    });
    return result;
  },

  draw: (svg, values, store) => {
    const ci = values.get(GEOM.INTERSECTION_CIRCLE);
    if (!ci || !isCircle(ci)) return;
    circleWithTooltip(svg, ci.cx, ci.cy, ci.r, GEOM.INTERSECTION_CIRCLE, 0.5, store);
  },
};

// Step 7: Draw line from C2 with length = 1.1 * diameter of ci, towards pi
// The line length is 1.1 * 2 * circleRadius = 2.2 * circleRadius
// This line will be used to find P3 as the intersection with INTERSECTION_CIRCLE (other than C2)
// Inputs: c2, pi, ci
// Outputs: line_c2_pi
const STEP_LINE_C2_PI: Step = {
  id: "step_line_c2_pi",
  inputs: [GEOM.C2, GEOM.INTERSECTION_POINT, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.LINE_C2_PI],

  compute: (inputs) => {
    const c2 = inputs.get(GEOM.C2);
    const pi = inputs.get(GEOM.INTERSECTION_POINT);
    const ci = inputs.get(GEOM.INTERSECTION_CIRCLE);

    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!pi || !isPoint(pi))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_POINT}`);
    if (!ci || !isCircle(ci))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_CIRCLE}`);

    // Length = 1.1 * diameter = 1.1 * 2 * radius = 2.2 * radius
    const lineLength = 2.2 * ci.r;
    // Direction vector from C2 to pi
    const dx = pi.x - c2.x;
    const dy = pi.y - c2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Normalize and scale
    const scale = lineLength / dist;
    const ex = c2.x + scale * dx;
    const ey = c2.y + scale * dy;

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_C2_PI, line(c2.x, c2.y, ex, ey));
    return result;
  },

  draw: (svg, values, store) => {
    const line_c2_pi = values.get(GEOM.LINE_C2_PI);
    if (!line_c2_pi || !isLine(line_c2_pi)) return;
    // Keep default stroke, only length is 1.1 * diameter
    lineWithTooltip(
      svg,
      line_c2_pi.x1,
      line_c2_pi.y1,
      line_c2_pi.x2,
      line_c2_pi.y2,
      GEOM.LINE_C2_PI,
      0.5,
      store,
    );
  },
};

// Step 8: Compute P3 as intersection of line_c2_pi with INTERSECTION_CIRCLE
// P3 is the other intersection point (not C2)
// Inputs: line_c2_pi, ci, c2
// Outputs: p3
const STEP_P3: Step = {
  id: "step_p3",
  inputs: [GEOM.LINE_C2_PI, GEOM.INTERSECTION_CIRCLE, GEOM.C2],
  outputs: [GEOM.P3],

  compute: (inputs) => {
    const line_c2_pi = inputs.get(GEOM.LINE_C2_PI);
    const ci = inputs.get(GEOM.INTERSECTION_CIRCLE);
    const c2 = inputs.get(GEOM.C2);

    if (!line_c2_pi || !isLine(line_c2_pi)) {
      throw new Error(`Missing or invalid input: ${GEOM.LINE_C2_PI}`);
    }
    if (!ci || !isCircle(ci)) {
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_CIRCLE}`);
    }
    if (!c2 || !isPoint(c2)) {
      throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    }

    // Find intersections of line_c2_pi with INTERSECTION_CIRCLE
    const intersections = interceptCircleLineSeg(
      ci.cx,
      ci.cy,
      line_c2_pi.x1,
      line_c2_pi.y1,
      line_c2_pi.x2,
      line_c2_pi.y2,
      ci.r,
    );

    // intersections is array of [x, y] coordinate pairs from circle-line-segment intersection
    // There should be 2 points: C2 and P3
    // Find which one is not C2 (or approximately not C2)
    const result = new Map<string, GeometryValue>();
    const tolerance = 0.001;

    for (const [x, y] of intersections) {
      const dx = x - c2.x;
      const dy = y - c2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > tolerance) {
        result.set(GEOM.P3, point(x, y));
        break; // Found P3
      }
    }

    return result;
  },

  draw: (svg, values, store) => {
    const p3 = values.get(GEOM.P3);
    if (!p3 || !isPoint(p3)) return;
    dotWithTooltip(svg, p3.x, p3.y, GEOM.P3, 2.0, store);
  },
};

// Step 9: Draw line from C1 with length = 1.1 * diameter of ci, towards pi
// The line length is 1.1 * 2 * circleRadius = 2.2 * circleRadius
// This line will be used to find P4 as the intersection with INTERSECTION_CIRCLE (other than C1)
// Inputs: c1, pi, ci
// Outputs: line_c1_pi
const STEP_LINE_C1_PI: Step = {
  id: "step_line_c1_pi",
  inputs: [GEOM.C1, GEOM.INTERSECTION_POINT, GEOM.INTERSECTION_CIRCLE],
  outputs: [GEOM.LINE_C1_PI],

  compute: (inputs) => {
    const c1 = inputs.get(GEOM.C1);
    const pi = inputs.get(GEOM.INTERSECTION_POINT);
    const ci = inputs.get(GEOM.INTERSECTION_CIRCLE);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!pi || !isPoint(pi))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_POINT}`);
    if (!ci || !isCircle(ci))
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_CIRCLE}`);

    // Length = 1.1 * diameter = 1.1 * 2 * radius = 2.2 * radius
    const lineLength = 2.2 * ci.r;
    // Direction vector from C1 to pi
    const dx = pi.x - c1.x;
    const dy = pi.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Normalize and scale
    const scale = lineLength / dist;
    const ex = c1.x + scale * dx;
    const ey = c1.y + scale * dy;

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_C1_PI, line(c1.x, c1.y, ex, ey));
    return result;
  },

  draw: (svg, values, store) => {
    const line_c1_pi = values.get(GEOM.LINE_C1_PI);
    if (!line_c1_pi || !isLine(line_c1_pi)) return;
    // Keep default stroke, only length is 1.1 * diameter
    lineWithTooltip(
      svg,
      line_c1_pi.x1,
      line_c1_pi.y1,
      line_c1_pi.x2,
      line_c1_pi.y2,
      GEOM.LINE_C1_PI,
      0.5,
      store,
    );
  },
};

// Step 10: Compute P4 as intersection of line_c1_pi with INTERSECTION_CIRCLE
// P4 is the other intersection point (not C1)
// Inputs: line_c1_pi, ci, c1
// Outputs: p4
const STEP_P4: Step = {
  id: "step_p4",
  inputs: [GEOM.LINE_C1_PI, GEOM.INTERSECTION_CIRCLE, GEOM.C1],
  outputs: [GEOM.P4],

  compute: (inputs) => {
    const line_c1_pi = inputs.get(GEOM.LINE_C1_PI);
    const ci = inputs.get(GEOM.INTERSECTION_CIRCLE);
    const c1 = inputs.get(GEOM.C1);

    if (!line_c1_pi || !isLine(line_c1_pi)) {
      throw new Error(`Missing or invalid input: ${GEOM.LINE_C1_PI}`);
    }
    if (!ci || !isCircle(ci)) {
      throw new Error(`Missing or invalid input: ${GEOM.INTERSECTION_CIRCLE}`);
    }
    if (!c1 || !isPoint(c1)) {
      throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    }

    // Find intersections of line_c1_pi with INTERSECTION_CIRCLE
    const intersections = interceptCircleLineSeg(
      ci.cx,
      ci.cy,
      line_c1_pi.x1,
      line_c1_pi.y1,
      line_c1_pi.x2,
      line_c1_pi.y2,
      ci.r,
    );

    // intersections is array of [x, y] coordinate pairs from circle-line-segment intersection
    // There should be 2 points: C1 and P4
    // Find which one is not C1 (or approximately not C1)
    const result = new Map<string, GeometryValue>();
    const tolerance = 0.001;

    for (const [x, y] of intersections) {
      const dx = x - c1.x;
      const dy = y - c1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > tolerance) {
        result.set(GEOM.P4, point(x, y));
        break; // Found P4
      }
    }

    return result;
  },

  draw: (svg, values, store) => {
    const p4 = values.get(GEOM.P4);
    if (!p4 || !isPoint(p4)) return;
    dotWithTooltip(svg, p4.x, p4.y, GEOM.P4, 2.0, store);
  },
};

// Step 10: Draw line from C2 to P4
// Inputs: c2, p4
// Outputs: line_c2_p4
const STEP_LINE_C2_P4: Step = {
  id: "step_line_c2_p4",
  inputs: [GEOM.C2, GEOM.P4],
  outputs: [GEOM.LINE_C2_P4],

  compute: (inputs) => {
    const c2 = inputs.get(GEOM.C2);
    const p4 = inputs.get(GEOM.P4);

    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!p4 || !isPoint(p4)) throw new Error(`Missing or invalid input: ${GEOM.P4}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_C2_P4, line(c2.x, c2.y, p4.x, p4.y));
    return result;
  },

  draw: (svg, values, store) => {
    const line_c2_p4 = values.get(GEOM.LINE_C2_P4);
    if (!line_c2_p4 || !isLine(line_c2_p4)) return;
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

// Step 11: Compute and draw pl (tangent point from c2 to p4 line)
// Inputs: c2, p4, line_c2_p4
// Outputs: pl
const STEP_PL: Step = {
  id: "step_pl",
  inputs: [GEOM.C2, GEOM.P4, GEOM.LINE_C2_P4],
  outputs: [GEOM.PL],

  compute: (inputs, config) => {
    const c2 = inputs.get(GEOM.C2);
    const p4 = inputs.get(GEOM.P4);

    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!p4 || !isPoint(p4)) throw new Error(`Missing or invalid input: ${GEOM.P4}`);

    // Compute pl: intersection of circle at c2 with line from c2 to p4
    const lp_left = interceptCircleLineSeg(
      c2.x,
      c2.y, // Circle center (cx, cy)
      c2.x,
      c2.y, // Line segment start (l1x, l1y) - same as circle center
      p4.x,
      p4.y, // Line segment end (l2x, l2y)
      config.circleRadius, // Radius (r)
    );

    const result = new Map<string, GeometryValue>();
    if (lp_left?.[0]) {
      result.set(GEOM.PL, point(lp_left[0][0], lp_left[0][1]));
    }
    return result;
  },

  draw: (svg, values, store) => {
    const pl = values.get(GEOM.PL);
    if (!pl || !isPoint(pl)) return;
    dotWithTooltip(svg, pl.x, pl.y, GEOM.PL, 2.0, store);
  },
};

// Step 12: Draw line from C1 to P3
// Inputs: c1, p3
// Outputs: line_c1_p3
const STEP_LINE_C1_P3: Step = {
  id: "step_line_c1_p3",
  inputs: [GEOM.C1, GEOM.P3],
  outputs: [GEOM.LINE_C1_P3],

  compute: (inputs) => {
    const c1 = inputs.get(GEOM.C1);
    const p3 = inputs.get(GEOM.P3);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!p3 || !isPoint(p3)) throw new Error(`Missing or invalid input: ${GEOM.P3}`);

    const result = new Map<string, GeometryValue>();
    result.set(GEOM.LINE_C1_P3, line(c1.x, c1.y, p3.x, p3.y));
    return result;
  },

  draw: (svg, values, store) => {
    const line_c1_p3 = values.get(GEOM.LINE_C1_P3);
    if (!line_c1_p3 || !isLine(line_c1_p3)) return;
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
  },
};

// Step 13: Compute and draw pr (tangent point from c1 to p3 line)
// Inputs: c1, p3, line_c1_p3
// Outputs: pr
const STEP_PR: Step = {
  id: "step_pr",
  inputs: [GEOM.C1, GEOM.P3, GEOM.LINE_C1_P3],
  outputs: [GEOM.PR],

  compute: (inputs, config) => {
    const c1 = inputs.get(GEOM.C1);
    const p3 = inputs.get(GEOM.P3);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!p3 || !isPoint(p3)) throw new Error(`Missing or invalid input: ${GEOM.P3}`);

    // Compute pr: intersection of circle at c1 with line from c1 to p3
    const lp_right = interceptCircleLineSeg(
      c1.x,
      c1.y, // Circle center (cx, cy)
      c1.x,
      c1.y, // Line segment start (l1x, l1y) - same as circle center
      p3.x,
      p3.y, // Line segment end (l2x, l2y)
      config.circleRadius, // Radius (r)
    );

    const result = new Map<string, GeometryValue>();
    if (lp_right?.[0]) {
      result.set(GEOM.PR, point(lp_right[0][0], lp_right[0][1]));
    }
    return result;
  },

  draw: (svg, values, store) => {
    const pr = values.get(GEOM.PR);
    if (!pr || !isPoint(pr)) return;
    dotWithTooltip(svg, pr.x, pr.y, GEOM.PR, 2.0, store);
  },
};

// Step 12: Draw square polygon
// Inputs: c1, c2, pr, pl
// Outputs: square (polygon with 4 vertices)
const STEP_FINAL_SQUARE: Step = {
  id: "step_final_square",
  inputs: [GEOM.C1, GEOM.C2, GEOM.PR, GEOM.PL],
  outputs: [GEOM.SQUARE],

  compute: (inputs) => {
    const c1 = inputs.get(GEOM.C1);
    const c2 = inputs.get(GEOM.C2);
    const pr = inputs.get(GEOM.PR);
    const pl = inputs.get(GEOM.PL);

    if (!c1 || !isPoint(c1)) throw new Error(`Missing or invalid input: ${GEOM.C1}`);
    if (!c2 || !isPoint(c2)) throw new Error(`Missing or invalid input: ${GEOM.C2}`);
    if (!pr || !isPoint(pr)) throw new Error(`Missing or invalid input: ${GEOM.PR}`);
    if (!pl || !isPoint(pl)) throw new Error(`Missing or invalid input: ${GEOM.PL}`);

    // Create polygon with vertices in order: pl, pr, c1, c2
    const result = new Map<string, GeometryValue>();
    result.set(GEOM.SQUARE, polygon([pl, pr, c1, c2]));
    return result;
  },

  draw: (svg, values, store) => {
    const square = values.get(GEOM.SQUARE);

    if (!square || !isPolygon(square)) return;

    const svgPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = square.points.map((p) => `${p.x},${p.y}`).join(" ");
    svgPolygon.setAttribute("points", points);
    svgPolygon.setAttribute("stroke", "#506");
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
