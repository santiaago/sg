/**
 * SixFoldV0 geometric construction - Step definitions
 * Replicates "1/4 Six fold pattern v3" from Svelte app.
 */

import type { GeometryValue } from "../types/geometry";
import { point, line, circle, isPoint, isLine, isCircle } from "../types/geometry";
import { directions, lineIntersect } from "@sg/geometry";
import type { StepExecutionContext } from "../types/geometry";
import { drawPoint, drawLine, drawCircle } from "../svgElements";
import { getGeometry, GEOM, computeSingle, computeMultiple } from "./sixFold/operations";
import type { SixFoldV0Config, SixFoldV0Step } from "./sixFold/operations";
import {
  distance,
  isValidNumber,
  validPoint,
  bisectCircleAndPoint,
  circlesIntersectionPointHelper,
  interceptCircleLineSegHelper,
} from "../geometry/constructors";

/**
 * Step 1: Main line and points
 * Creates the base horizontal line and its endpoint points.
 * Uses SVG config coordinates (lx1, ly1, lx2, ly2) as parameters.
 */
const STEP_1: SixFoldV0Step = {
  id: "step1",
  inputs: [],
  outputs: [GEOM.LINE1, GEOM.P1, GEOM.P2],
  parameters: ["lx1", "ly1", "lx2", "ly2"],
  compute: computeMultiple((_inputs, config) => {
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LINE1, line(config.lx1, config.ly1, config.lx2, config.ly2));
    m.set(GEOM.P1, point(config.lx1, config.ly1));
    m.set(GEOM.P2, point(config.lx2, config.ly2));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LINE1, 0.5, store, theme);
    drawPoint(svg, values, GEOM.P1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.P2, 2.0, store, theme);
  },
};

/**
 * Step 2a: Primary circle centers and circles
 * Creates the first two circle centers (cp1, cp2) and circles (c1, c2).
 * Uses LINE1 from step1 to get the line coordinates.
 */
const STEP_2A: SixFoldV0Step = {
  id: "step2a",
  inputs: [GEOM.LINE1],
  outputs: [GEOM.CP1, GEOM.CP2, GEOM.C1, GEOM.C2],
  parameters: ["radius"],
  compute: computeMultiple((inputs, config) => {
    const m = new Map<string, GeometryValue>();

    // Get line from step 1
    const line1 = getGeometry(inputs, GEOM.LINE1, isLine, "Line");

    // Use line coordinates
    const lx1 = line1.x1;
    const ly1 = line1.y1;
    const lx2 = line1.x2;

    // Calculate derived values
    const lineLength = lx2 - lx1;
    const radius = config.radius;
    const cx1 = lx1 + lineLength * config.cp1OffsetRatio;
    const cy1 = ly1;
    const cx2 = cx1 - radius;
    const cy2 = cy1;

    // Create circle centers cp1 and cp2
    const cp1 = point(cx1, cy1);
    const cp2 = point(cx2, cy2);
    m.set(GEOM.CP1, cp1);
    m.set(GEOM.CP2, cp2);

    // Create circles c1 and c2
    const circle1 = circle(cx1, cy1, radius);
    const circle2 = circle(cx2, cy2, radius);
    m.set(GEOM.C1, circle1);
    m.set(GEOM.C2, circle2);

    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP2, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2, 0.5, store, theme);
  },
};

/**
 * Step 2b: Intersection point and circle at intersection
 * Finds the intersection point of c1 and c2 (top point) and creates a circle there.
 */
const STEP_2B: SixFoldV0Step = {
  id: "step2b",
  inputs: [GEOM.C1, GEOM.C2],
  outputs: [GEOM.PIC12_INTERNAL, GEOM.CIRCLE_AT_INTERSECTION],
  parameters: ["radius"],
  compute: computeMultiple((inputs, config) => {
    const m = new Map<string, GeometryValue>();

    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");

    // Find px, py = intersection point of c1 and c2 circles (top point)
    const pxPy = circlesIntersectionPointHelper(c1, c2, directions.up);
    if (!pxPy) {
      throw new Error("STEP_2B: circlesIntersectionPointHelper(c1, c2, up) returned null - circles do not intersect");
    }
    m.set(GEOM.PIC12_INTERNAL, pxPy);

    // Create circle at intersection with same radius
    const circleAtIntersection = circle(pxPy.x, pxPy.y, config.radius);
    m.set(GEOM.CIRCLE_AT_INTERSECTION, circleAtIntersection);

    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC12_INTERNAL, 2.0, store, theme);
    drawCircle(svg, values, GEOM.CIRCLE_AT_INTERSECTION, 0.5, store, theme);
  },
};

/**
 * Step 2c: Bisected points
 * Computes p3 and p4 by bisecting from circleAtIntersection through cp2 and cp1.
 */
const STEP_2C: SixFoldV0Step = {
  id: "step2c",
  inputs: [GEOM.PIC12_INTERNAL, GEOM.CIRCLE_AT_INTERSECTION, GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.P3_INTERNAL, GEOM.P4_INTERNAL],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const m = new Map<string, GeometryValue>();

    const circleAtIntersection = getGeometry(inputs, GEOM.CIRCLE_AT_INTERSECTION, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");

    // p3 = bisect from circleAtIntersection through cp2
    const p3 = bisectCircleAndPoint(circleAtIntersection, cp2);
    const p4 = bisectCircleAndPoint(circleAtIntersection, cp1);

    m.set(GEOM.P3_INTERNAL, p3);
    m.set(GEOM.P4_INTERNAL, p4);

    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P3_INTERNAL, 2.0, store, theme);
    drawPoint(svg, values, GEOM.P4_INTERNAL, 2.0, store, theme);
  },
};

/**
 * Step 2d: Secondary circles
 * Creates cp3, cp4, c3, c4 from the bisected points.
 * l13 = line from cp1 to p3, find intersection with c1 circle -> cp4, create c4
 * l24 = line from cp2 to p4, find intersection with c2 circle -> cp3, create c3
 */
const STEP_2D: SixFoldV0Step = {
  id: "step2d",
  inputs: [GEOM.C1, GEOM.C2, GEOM.P3_INTERNAL, GEOM.P4_INTERNAL, GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.CP3, GEOM.CP4, GEOM.C3, GEOM.C4],
  parameters: ["radius"],
  compute: computeMultiple((inputs, config) => {
    const m = new Map<string, GeometryValue>();

    const circle1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const circle2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const p3 = getGeometry(inputs, GEOM.P3_INTERNAL, isPoint, "Point");
    const p4 = getGeometry(inputs, GEOM.P4_INTERNAL, isPoint, "Point");

    // l13 = line from cp1 to p3
    const l13Line = line(cp1.x, cp1.y, p3.x, p3.y);
    // c4 center = intersection of circle1 with l13 line
    const cp4Pt = interceptCircleLineSegHelper(circle1, l13Line, 0);

    // l24 = line from cp2 to p4
    const l24Line = line(cp2.x, cp2.y, p4.x, p4.y);
    // c3 center = intersection of circle2 with l24 line
    const cp3Pt = interceptCircleLineSegHelper(circle2, l24Line, 0);
    if (!cp3Pt || !cp4Pt) {
      throw new Error("STEP_2D: Failed to find circle intersections for c3 or c4 centers");
    }

    // Create cp3, cp4, c3, c4
    m.set(GEOM.CP3, cp3Pt);
    m.set(GEOM.CP4, cp4Pt);
    const c3 = circle(cp3Pt.x, cp3Pt.y, config.radius);
    const c4 = circle(cp4Pt.x, cp4Pt.y, config.radius);
    m.set(GEOM.C3, c3);
    m.set(GEOM.C4, c4);

    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP3, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP4, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4, 0.5, store, theme);
  },
};

/**
 * Step 3: Lines between circle centers
 * Draws connecting lines between all four circle center points (cp1, cp2, cp3, cp4).
 * Forms the quadrilateral connecting the centers.
 */
const STEP_3: SixFoldV0Step = {
  id: "step3",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.L12, GEOM.L23, GEOM.L34, GEOM.L41],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.L12, line(cp2.x, cp2.y, cp1.x, cp1.y));
    m.set(GEOM.L23, line(cp2.x, cp2.y, cp3.x, cp3.y));
    m.set(GEOM.L34, line(cp3.x, cp3.y, cp4.x, cp4.y));
    m.set(GEOM.L41, line(cp4.x, cp4.y, cp1.x, cp1.y));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L12, 0.5, store, theme);
    drawLine(svg, values, GEOM.L23, 0.5, store, theme);
    drawLine(svg, values, GEOM.L34, 0.5, store, theme);
    drawLine(svg, values, GEOM.L41, 0.5, store, theme);
  },
};

/**
 * Step 4: Intersection points pic12 and pic14
 * Finds intersection points between circle pairs.
 * pic12 = intersection of circles c1 and c2 (direction: up)
 * pic14 = intersection of circles c4 and c1 (direction: left)
 */
const STEP_4: SixFoldV0Step = {
  id: "step4",
  inputs: [GEOM.C1, GEOM.C2, GEOM.C3, GEOM.C4],
  outputs: [GEOM.PIC12, GEOM.PIC14],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");
    const c4 = getGeometry(inputs, GEOM.C4, isCircle, "Circle");
    const pic12 = circlesIntersectionPointHelper(c1, c2, directions.up);
    const pic14 = circlesIntersectionPointHelper(c4, c1, directions.left);
    if (!pic12) throw new Error("STEP_4: pic12 is null - circles do not intersect");
    if (!pic14) throw new Error("STEP_4: pic14 is null - circles do not intersect");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC12, pic12);
    m.set(GEOM.PIC14, pic14);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC12, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC14, 2.0, store, theme);
  },
};

/**
 * Step 5: Lines from cp1 to pic points
 * Draws lines from circle center cp1 to intersection points pic12 and pic14.
 */
const STEP_5: SixFoldV0Step = {
  id: "step5",
  inputs: [GEOM.CP1, GEOM.PIC12, GEOM.PIC14],
  outputs: [GEOM.LPIC12, GEOM.LPIC14],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LPIC12, line(cp1.x, cp1.y, pic12.x, pic12.y));
    m.set(GEOM.LPIC14, line(cp1.x, cp1.y, pic14.x, pic14.y));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPIC12, 0.5, store, theme);
    drawLine(svg, values, GEOM.LPIC14, 0.5, store, theme);
  },
};

/**
 * Step 6: Crossing lines l13, l24 and intersection pi2
 * Draws diagonal lines connecting opposite circle centers (cp1-cp3 and cp2-cp4).
 * Computes pi2 as the intersection point of lines l13 and l24.
 */
const STEP_6: SixFoldV0Step = {
  id: "step6",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.L13, GEOM.L24, GEOM.PI2],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const l13 = line(cp1.x, cp1.y, cp3.x, cp3.y);
    const l24 = line(cp2.x, cp2.y, cp4.x, cp4.y);
    const pi2Result = lineIntersect(cp1.x, cp1.y, cp3.x, cp3.y, cp2.x, cp2.y, cp4.x, cp4.y);
    if (!pi2Result) {
      throw new Error("STEP_6: lineIntersect returned null - lines l13 and l24 do not intersect");
    }
    const pi2 = validPoint(pi2Result[0], pi2Result[1]);
    if (!pi2) {
      throw new Error("STEP_6: validPoint returned null - intersection coordinates are invalid");
    }
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.L13, l13);
    m.set(GEOM.L24, l24);
    m.set(GEOM.PI2, pi2);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L13, 0.5, store, theme);
    drawLine(svg, values, GEOM.L24, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PI2, 2.0, store, theme);
  },
};



/**
 * Step 7: D1 circles (c1_d1, c2_d1, c3_d1, c4_d1)
 * Creates circles centered at cp1, cp2, cp3, cp4 with radius d1 (distance from pic14 to pi2).
 */
const STEP_7: SixFoldV0Step = {
  id: "step7",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C1_D1, GEOM.C2_D1, GEOM.C3_D1, GEOM.C4_D1],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.C1_D1, circle(cp1.x, cp1.y, d1));
    m.set(GEOM.C2_D1, circle(cp2.x, cp2.y, d1));
    m.set(GEOM.C3_D1, circle(cp3.x, cp3.y, d1));
    m.set(GEOM.C4_D1, circle(cp4.x, cp4.y, d1));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4_D1, 0.5, store, theme);
  },
};

/**
 * Step 8: Circles at pic14 and pic12 with radius d1
 * Creates circles centered at pic12 and pic14 with radius d1 (distance from pic14 to pi2).
 */
const STEP_8: SixFoldV0Step = {
  id: "step8",
  inputs: [GEOM.PIC12, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C14_D1, GEOM.C12_D1],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    const c14_d1 = circle(pic14.x, pic14.y, d1);
    const c12_d1 = circle(pic12.x, pic12.y, d1);
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.C14_D1, c14_d1);
    m.set(GEOM.C12_D1, c12_d1);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C14_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C12_D1, 0.5, store, theme);
  },
};

/**
 * Step 9: pi3 and pi4 intersection points
 * pi3 = circlesIntersectionPoint(c14_d1, c2_d1, directions.right)
 * pi4 = circlesIntersectionPoint(c12_d1, c4_d1, directions.right)
 */
const STEP_9: SixFoldV0Step = {
  id: "step9",
  inputs: [GEOM.C14_D1, GEOM.C2_D1, GEOM.C12_D1, GEOM.C4_D1],
  outputs: [GEOM.PI3, GEOM.PI4],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");
    const pi3 = circlesIntersectionPointHelper(c14_d1, c2_d1, directions.right);
    const pi4 = circlesIntersectionPointHelper(c12_d1, c4_d1, directions.right);
    if (!pi3) throw new Error("STEP_10: pi3 is null - circles do not intersect");
    if (!pi4) throw new Error("STEP_10: pi4 is null - circles do not intersect");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PI3, pi3);
    m.set(GEOM.PI4, pi4);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PI3, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PI4, 2.0, store, theme);
  },
};

/**
 * Step 10: Lines from cp1 to pi3 and pi4
 * Draws lines from circle center cp1 to intersection points pi3 and pi4.
 */
const STEP_10: SixFoldV0Step = {
  id: "step10",
  inputs: [GEOM.CP1, GEOM.PI3, GEOM.PI4],
  outputs: [GEOM.LCP1PI3, GEOM.LCP1PI4],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    const pi4 = getGeometry(inputs, GEOM.PI4, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LCP1PI3, line(cp1.x, cp1.y, pi3.x, pi3.y));
    m.set(GEOM.LCP1PI4, line(cp1.x, cp1.y, pi4.x, pi4.y));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP1PI3, 0.5, store, theme);
    drawLine(svg, values, GEOM.LCP1PI4, 0.5, store, theme);
  },
};

/**
 * Step 11: prx5 and prx6 points
 * prx5 = interceptCircleLineSeg(c14_d1 center, lpic14 line)
 * prx6 = interceptCircleLineSeg(c12_d1 center, lpic12 line)
 */
const STEP_11: SixFoldV0Step = {
  id: "step11",
  inputs: [GEOM.C14_D1, GEOM.LPIC14, GEOM.C12_D1, GEOM.LPIC12],
  outputs: [GEOM.PRX5, GEOM.PRX6],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const lpic12 = getGeometry(inputs, GEOM.LPIC12, isLine, "Line");
    const prx5 = interceptCircleLineSegHelper(c14_d1, lpic14, 0);
    const prx6 = interceptCircleLineSegHelper(c12_d1, lpic12, 0);
    if (!prx5) throw new Error("STEP_12: prx5 is null - circle-line intersection not found");
    if (!prx6) throw new Error("STEP_12: prx6 is null - circle-line intersection not found");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PRX5, prx5);
    m.set(GEOM.PRX6, prx6);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PRX5, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PRX6, 2.0, store, theme);
  },
};

/**
 * Step 12: c23w, l14p, pc23, c23s, c23 circle
 * From Svelte:
 *   c23w = bisectCircleAndPoint(c14_d1, prx5)
 *   l14p = line from pic14 to c23w
 *   pc23 = linesIntersection(l23, l14p)
 *   line = line from pc23 to cp2
 *   c23s = interceptCircleLine(c2_d1, line, 0)
 *   d2 = distance from pc23 to c23s
 *   c23 = new Circle(pc23, d2)
 */
const STEP_12: SixFoldV0Step = {
  id: "step12",
  inputs: [GEOM.C14_D1, GEOM.PRX5, GEOM.PIC14, GEOM.L23, GEOM.CP2, GEOM.C2_D1],
  outputs: [GEOM.C23W, GEOM.L14P, GEOM.PC23, GEOM.C23S, GEOM.C23],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const prx5 = getGeometry(inputs, GEOM.PRX5, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");

    // c23w = bisect from c14_d1 center through prx5
    const c23wPt = bisectCircleAndPoint(c14_d1, prx5);

    // l14p = line from pic14 to c23w
    const l14p = line(pic14.x, pic14.y, c23wPt.x, c23wPt.y);

    // pc23 = intersection of l23 and l14p
    const pc23Result = lineIntersect(
      l23.x1,
      l23.y1,
      l23.x2,
      l23.y2,
      l14p.x1,
      l14p.y1,
      l14p.x2,
      l14p.y2,
    );
    if (!pc23Result) {
      throw new Error("STEP_13: lineIntersect returned null - lines l23 and l14p do not intersect");
    }
    const pc23Pt = validPoint(pc23Result[0], pc23Result[1]);
    if (!pc23Pt) {
      throw new Error("STEP_13: validPoint returned null - pc23Pt coordinates are invalid");
    }

    // line from pc23 to cp2
    const lineToCp2 = line(pc23Pt.x, pc23Pt.y, cp2.x, cp2.y);

    // c23s = interceptCircleLine(c2_d1, line, 0) - first intersection point
    const c23s = interceptCircleLineSegHelper(c2_d1, lineToCp2, 0);
    if (!c23s) throw new Error("STEP_13: c23s is null");

    // d2 = distance from pc23 to c23s
    const d2 = distance(pc23Pt, c23s);

    // c23 = circle at pc23 with radius d2
    const c23 = circle(pc23Pt.x, pc23Pt.y, d2);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.C23W, c23wPt);
    m.set(GEOM.L14P, l14p);
    m.set(GEOM.PC23, pc23Pt);
    m.set(GEOM.C23S, c23s);
    m.set(GEOM.C23, c23);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C23W, 2.0, store, theme);
    drawLine(svg, values, GEOM.L14P, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PC23, 2.0, store, theme);
    drawPoint(svg, values, GEOM.C23S, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C23, 0.5, store, theme);
  },
};

/**
 * Step 13: cpic12, c34n, lpic12c34n, pc34, c34e, c34 circle
 * cpic12 = circle at pic12 with radius d1 (distance from pic14 to pi2)
 * c34n = bisectCircleAndPoint(cpic12, prx6)
 * lpic12c34n = line from pic12 to c34n
 * pc34 = linesIntersection(l34, lpic12c34n)
 * c34e = interceptCircleLine(c4_d1, line(pc34, cp4), 0)
 * c34 = circle at pc34 with radius = distance(pc34, c34e)
 */
const STEP_13: SixFoldV0Step = {
  id: "step13",
  inputs: [GEOM.PIC12, GEOM.PIC14, GEOM.PI2, GEOM.PRX6, GEOM.L34, GEOM.CP4, GEOM.C4_D1],
  outputs: [GEOM.CPI12, GEOM.C34N, GEOM.LPIC12C34N, GEOM.PC34, GEOM.C34E, GEOM.C34],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const pi6 = getGeometry(inputs, GEOM.PRX6, isPoint, "Point");
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");

    // d1 = distance from pic14 to pi2
    const d1 = distance(pic14, pi2);

    // cpic12 = circle at pic12 with radius d1
    const cpic12 = circle(pic12.x, pic12.y, d1);

    // c34n = bisectCircleAndPoint(cpic12, pi6)
    const c34nPt = bisectCircleAndPoint(cpic12, pi6);

    // lpic12c34n = line from pic12 to c34n
    const lpic12c34n = line(pic12.x, pic12.y, c34nPt.x, c34nPt.y);

    // pc34 = intersection of l34 and lpic12c34n
    const pc34Result = lineIntersect(
      l34.x1,
      l34.y1,
      l34.x2,
      l34.y2,
      lpic12c34n.x1,
      lpic12c34n.y1,
      lpic12c34n.x2,
      lpic12c34n.y2,
    );
    if (!pc34Result) {
      throw new Error("STEP_13: lineIntersect returned null - lines l34 and lpic12c34n do not intersect");
    }
    const pc34Pt = validPoint(pc34Result[0], pc34Result[1]);
    if (!pc34Pt) {
      throw new Error("STEP_13: validPoint returned null - pc34Pt coordinates are invalid");
    }

    // line from pc34 to cp4
    const lineToCp4 = line(pc34Pt.x, pc34Pt.y, cp4.x, cp4.y);

    // c34e = interceptCircleLine(c4_d1, line, 0) - first intersection point
    const c34e = interceptCircleLineSegHelper(c4_d1, lineToCp4, 0);
    if (!c34e) throw new Error("STEP_13: c34e is null");

    // d2 = distance from pc34 to c34e
    const d2 = distance(pc34Pt, c34e);

    // c34 = circle at pc34 with radius d2
    const c34 = circle(pc34Pt.x, pc34Pt.y, d2);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.CPI12, cpic12);
    m.set(GEOM.C34N, c34nPt);
    m.set(GEOM.LPIC12C34N, lpic12c34n);
    m.set(GEOM.PC34, pc34Pt);
    m.set(GEOM.C34E, c34e);
    m.set(GEOM.C34, c34);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.CPI12, 0.5, store, theme);
    drawPoint(svg, values, GEOM.C34N, 2.0, store, theme);
    drawLine(svg, values, GEOM.LPIC12C34N, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PC34, 2.0, store, theme);
    drawPoint(svg, values, GEOM.C34E, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C34, 0.5, store, theme);
  },
};

/**
 * Step 14: pp, l1, pii1, pii2
 * pp = interceptCircleLineSeg(c1_d1, lpic14)
 * l1 = line from pi3 to pp
 * pii1 = intersection of line(pi3,pp) with l13
 * pii2 = intersection of line(pi3,pp) with l24
 */
const STEP_14: SixFoldV0Step = {
  id: "step14",
  inputs: [GEOM.C1_D1, GEOM.LPIC14, GEOM.PI3, GEOM.L13, GEOM.L24],
  outputs: [GEOM.PP, GEOM.L1, GEOM.PII1, GEOM.PII2],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    const l13 = getGeometry(inputs, GEOM.L13, isLine, "Line");
    const l24 = getGeometry(inputs, GEOM.L24, isLine, "Line");

    // pp = interceptCircleLine(c1_d1, lpic14, 0)
    const pp = interceptCircleLineSegHelper(c1_d1, lpic14, 0);
    if (!pp) throw new Error("STEP_14: pp is null");

    // l1 = line from pi3 to pp
    const l1 = line(pi3.x, pi3.y, pp.x, pp.y);

    // pii1 = intersection of line(pi3,pp) with l13
    const result1 = lineIntersect(pi3.x, pi3.y, pp.x, pp.y, l13.x1, l13.y1, l13.x2, l13.y2);
    if (!result1) {
      throw new Error("STEP_14: lineIntersect returned null - line(pi3,pp) and l13 do not intersect");
    }
    const pii1 = validPoint(result1[0], result1[1]);
    if (!pii1) {
      throw new Error("STEP_14: validPoint returned null - pii1 coordinates are invalid");
    }

    // pii2 = intersection of line(pi3,pp) with l24
    const result2 = lineIntersect(pi3.x, pi3.y, pp.x, pp.y, l24.x1, l24.y1, l24.x2, l24.y2);
    if (!result2) {
      throw new Error("STEP_14: lineIntersect returned null - line(pi3,pp) and l24 do not intersect");
    }
    const pii2 = validPoint(result2[0], result2[1]);
    if (!pii2) {
      throw new Error("STEP_14: validPoint returned null - pii2 coordinates are invalid");
    }

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PP, pp);
    m.set(GEOM.L1, l1);
    m.set(GEOM.PII1, pii1);
    m.set(GEOM.PII2, pii2);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PP, 2.0, store, theme);
    drawLine(svg, values, GEOM.L1, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PII1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PII2, 2.0, store, theme);
  },
};

/**
 * Step 15: Line between pii1 and pii2
 * Draws a connecting line between the two intersection points pii1 and pii2.
 */
const STEP_15: SixFoldV0Step = {
  id: "step15",
  inputs: [GEOM.PII1, GEOM.PII2],
  outputs: [GEOM.LPII1PII2],
  parameters: [],
  compute: computeSingle(GEOM.LPII1PII2, (inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pii2 = getGeometry(inputs, GEOM.PII2, isPoint, "Point");
    return line(pii1.x, pii1.y, pii2.x, pii2.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPII1PII2, 0.5, store, theme);
  },
};

/**
 * Step 16: D3 circles at all 4 centers with radius = distance from pii1 to cp1
 * Creates circles at cp1, cp2, cp3, cp4 with radius d3 (distance from pii1 to cp1).
 */
const STEP_16: SixFoldV0Step = {
  id: "step16",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4, GEOM.PII1],
  outputs: [GEOM.C1_D3, GEOM.C2_D3, GEOM.C3_D3, GEOM.C4_D3],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const d3 = distance(pii1, cp1);
    if (!isValidNumber(d3) || d3 <= 0) {
      throw new Error("STEP_16: Invalid d3 value - points pii1 and cp1 are coincident or invalid");
    }
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.C1_D3, circle(cp1.x, cp1.y, d3));
    m.set(GEOM.C2_D3, circle(cp2.x, cp2.y, d3));
    m.set(GEOM.C3_D3, circle(cp3.x, cp3.y, d3));
    m.set(GEOM.C4_D3, circle(cp4.x, cp4.y, d3));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4_D3, 0.5, store, theme);
  },
};

/**
 * Step 17: Lines from cp2 to pic14 and cp4 to pic12
 * Draws lines connecting circle centers to intersection points.
 */
const STEP_17: SixFoldV0Step = {
  id: "step17",
  inputs: [GEOM.CP2, GEOM.PIC14, GEOM.CP4, GEOM.PIC12],
  outputs: [GEOM.LCP2PIC14, GEOM.LCP4PIC12],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LCP2PIC14, line(cp2.x, cp2.y, pic14.x, pic14.y));
    m.set(GEOM.LCP4PIC12, line(cp4.x, cp4.y, pic12.x, pic12.y));
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP2PIC14, 0.5, store, theme);
    drawLine(svg, values, GEOM.LCP4PIC12, 0.5, store, theme);
  },
};

/**
 * Step 18: lpii1pi4, pic4, outline1
 * lpii1pi4 = line from pii1 to pi4
 * pic4 = intersection of lpii1pi4 and lcp4pic12
 * outline1 = line from pii1 to pic4
 */
const STEP_18: SixFoldV0Step = {
  id: "step18",
  inputs: [GEOM.PII1, GEOM.PI4, GEOM.LCP4PIC12],
  outputs: [GEOM.PIC4, GEOM.OUTLINE1],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pi4 = getGeometry(inputs, GEOM.PI4, isPoint, "Point");
    const lcp4pic12 = getGeometry(inputs, GEOM.LCP4PIC12, isLine, "Line");

    // lpii1pi4 = line from pii1 to pi4
    const lpii1pi4 = line(pii1.x, pii1.y, pi4.x, pi4.y);

    // pic4 = intersection of lpii1pi4 and lcp4pic12
    const pic4Result = lineIntersect(
      lpii1pi4.x1,
      lpii1pi4.y1,
      lpii1pi4.x2,
      lpii1pi4.y2,
      lcp4pic12.x1,
      lcp4pic12.y1,
      lcp4pic12.x2,
      lcp4pic12.y2,
    );
    if (!pic4Result) {
      throw new Error("STEP_18: lineIntersect returned null - lines lpii1pi4 and lcp4pic12 do not intersect");
    }
    const pic4 = validPoint(pic4Result[0], pic4Result[1]);
    if (!pic4) {
      throw new Error("STEP_18: validPoint returned null - pic4 coordinates are invalid");
    }

    // outline1 = line from pii1 to pic4
    const outline1 = line(pii1.x, pii1.y, pic4.x, pic4.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC4, pic4);
    m.set(GEOM.OUTLINE1, outline1);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC4, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE1, 2.0, store, theme);
  },
};

/**
 * Step 19: pii1, pic2, outline2
 * lpii1pii2 = line from pii1 to pii2
 * pic2 = intersection of lpii1pii2 and lcp2pic14
 * outline2 = line from pii1 to pic2
 */
const STEP_19: SixFoldV0Step = {
  id: "step19",
  inputs: [GEOM.PII1, GEOM.PII2, GEOM.LCP2PIC14],
  outputs: [GEOM.PIC2, GEOM.OUTLINE2],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pii2 = getGeometry(inputs, GEOM.PII2, isPoint, "Point");
    const lcp2pic14 = getGeometry(inputs, GEOM.LCP2PIC14, isLine, "Line");

    // lpii1pii2 already exists from step 16
    // pic2 = intersection of lpii1pii2 and lcp2pic14
    const lpii1pii2 = line(pii1.x, pii1.y, pii2.x, pii2.y);
    const pic2Result = lineIntersect(
      lpii1pii2.x1,
      lpii1pii2.y1,
      lpii1pii2.x2,
      lpii1pii2.y2,
      lcp2pic14.x1,
      lcp2pic14.y1,
      lcp2pic14.x2,
      lcp2pic14.y2,
    );
    if (!pic2Result) {
      throw new Error("STEP_19: lineIntersect returned null - lines lpii1pii2 and lcp2pic14 do not intersect");
    }
    const pic2 = validPoint(pic2Result[0], pic2Result[1]);
    if (!pic2) {
      throw new Error("STEP_19: validPoint returned null - pic2 coordinates are invalid");
    }

    // outline2 = line from pii1 to pic2
    const outline2 = line(pii1.x, pii1.y, pic2.x, pic2.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC2, pic2);
    m.set(GEOM.OUTLINE2, outline2);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC2, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE2, 2.0, store, theme);
  },
};

/**
 * Step 20: pic1w, pic34, outline3
 * lpii2pic4 = line from pii2 to pic4
 * pic1w = intersection of lpii2pic4 and l14p
 * pic34 = intersection of lpii2pic4 and lpic12c34n
 * outline3 = line from pic1w to pic34
 */
const STEP_20: SixFoldV0Step = {
  id: "step20",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI3, GEOM.C34, GEOM.L34],
  outputs: [GEOM.PIC1W, GEOM.PIC34, GEOM.OUTLINE3],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi3 = getGeometry(inputs, GEOM.LCP1PI3, isLine, "Line");
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");

    // pic1w = interceptCircleLineSeg(c1_d3, lcp1pi3, 0)
    const pic1w = interceptCircleLineSegHelper(c1_d3, lcp1pi3, 0);
    if (!pic1w) throw new Error("STEP_20: pic1w is null");

    // pic34 = interceptCircleLineSeg(c34, l34, 0)
    const pic34 = interceptCircleLineSegHelper(c34, l34, 0);
    if (!pic34) throw new Error("STEP_20: pic34 is null");

    // outline3 = line from pic1w to pic34
    const outline3 = line(pic1w.x, pic1w.y, pic34.x, pic34.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC1W, pic1w);
    m.set(GEOM.PIC34, pic34);
    m.set(GEOM.OUTLINE3, outline3);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1W, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC34, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE3, 2.0, store, theme);
  },
};

/**
 * Step 21: pic1n, pic23, outline4
 * pic1n = interceptCircleLine(c1_d3, lcp1pi4, 0)
 * pic23 = interceptCircleLine(c23, l23, 0)
 * outline4 = line from pic1n to pic23
 */
const STEP_21: SixFoldV0Step = {
  id: "step21",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI4, GEOM.C23, GEOM.L23],
  outputs: [GEOM.PIC1N, GEOM.PIC23, GEOM.OUTLINE4],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi4 = getGeometry(inputs, GEOM.LCP1PI4, isLine, "Line");
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");

    // pic1n = interceptCircleLine(c1_d3, lcp1pi4, 0)
    const pic1n = interceptCircleLineSegHelper(c1_d3, lcp1pi4, 0);

    // pic23 = interceptCircleLine(c23, l23, 1) - using index 1
    const pic23 = interceptCircleLineSegHelper(c23, l23, 1);

    if (!pic1n) throw new Error("STEP_21: pic1n is null");
    if (!pic23) throw new Error("STEP_21: pic23 is null");

    // outline4 = line from pic1n to pic23
    const outline4 = line(pic1n.x, pic1n.y, pic23.x, pic23.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC1N, pic1n);
    m.set(GEOM.PIC23, pic23);
    m.set(GEOM.OUTLINE4, outline4);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1N, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC23, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE4, 2.0, store, theme);
  },
};

/**
 * Step 22: pc1w, pc23s, outline5
 * pc1w = interceptCircleLineSeg(c1_d1, l12, 0)
 * pc23s = interceptCircleLineSeg(c23, l23, 0)
 * outline5 = line from pc1w to pc23s
 */
const STEP_22: SixFoldV0Step = {
  id: "step22",
  inputs: [GEOM.C1_D1, GEOM.L12, GEOM.C23, GEOM.L23],
  outputs: [GEOM.PC1W, GEOM.PC23S, GEOM.OUTLINE5],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l12 = getGeometry(inputs, GEOM.L12, isLine, "Line");
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");

    // pc1w = interceptCircleLineSeg(c1_d1, l12, 0)
    const pc1w = interceptCircleLineSegHelper(c1_d1, l12, 0);
    if (!pc1w) throw new Error("STEP_22: pc1w is null");

    // pc23s = interceptCircleLineSeg(c23, l23, 0)
    const pc23s = interceptCircleLineSegHelper(c23, l23, 0);
    if (!pc23s) throw new Error("STEP_22: pc23s is null");

    // outline5 = line from pc1w to pc23s
    const outline5 = line(pc1w.x, pc1w.y, pc23s.x, pc23s.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC1W, pc1w);
    m.set(GEOM.PC23S, pc23s);
    m.set(GEOM.OUTLINE5, outline5);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1W, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC23S, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE5, 2.0, store, theme);
  },
};

/**
 * Step 23: pc1n, pc34e, outline6
 * pc1n = interceptCircleLineSeg(c1_d1, l41, 0)
 * pc34e = interceptCircleLineSeg(c34, l34, 1)
 * outline6 = line from pc1n to pc34e
 */
const STEP_23: SixFoldV0Step = {
  id: "step23",
  inputs: [GEOM.C1_D1, GEOM.L41, GEOM.C34, GEOM.L34],
  outputs: [GEOM.PC1N, GEOM.PC34E, GEOM.OUTLINE6],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l41 = getGeometry(inputs, GEOM.L41, isLine, "Line");
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34Line = getGeometry(inputs, GEOM.L34, isLine, "Line");

    // pc1n = interceptCircleLineSeg(c1_d1, l41, 0)
    const pc1n = interceptCircleLineSegHelper(c1_d1, l41, 0);

    // pc34e = interceptCircleLineSeg(c34, l34, 1)
    const pc34e = interceptCircleLineSegHelper(c34, l34Line, 1);

    if (!pc1n) throw new Error("STEP_23: pc1n is null");
    if (!pc34e) throw new Error("STEP_23: pc34e is null");

    // outline6 = line from pc1n to pc34e
    const outline6 = line(pc1n.x, pc1n.y, pc34e.x, pc34e.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC1N, pc1n);
    m.set(GEOM.PC34E, pc34e);
    m.set(GEOM.OUTLINE6, outline6);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1N, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC34E, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE6, 2.0, store, theme);
  },
};

/**
 * Step 24: outline7
 * Draws outline line from pc1n to pic1n.
 */
const STEP_24: SixFoldV0Step = {
  id: "step24",
  inputs: [GEOM.PC1N, GEOM.PIC1N],
  outputs: [GEOM.OUTLINE7],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE7, (inputs, _config) => {
    const pc1n = getGeometry(inputs, GEOM.PC1N, isPoint, "Point");
    const pic1n = getGeometry(inputs, GEOM.PIC1N, isPoint, "Point");
    return line(pc1n.x, pc1n.y, pic1n.x, pic1n.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE7, 2.0, store, theme);
  },
};

/**
 * Step 25: outline8
 * Draws outline line from pc1w to pic1w.
 */
const STEP_25: SixFoldV0Step = {
  id: "step25",
  inputs: [GEOM.PC1W, GEOM.PIC1W],
  outputs: [GEOM.OUTLINE8],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE8, (inputs, _config) => {
    const pc1w = getGeometry(inputs, GEOM.PC1W, isPoint, "Point");
    const pic1w = getGeometry(inputs, GEOM.PIC1W, isPoint, "Point");
    return line(pc1w.x, pc1w.y, pic1w.x, pic1w.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE8, 2.0, store, theme);
  },
};

/**
 * Step 26: pc3sw, pc23e, outline9
 * pc3sw = interceptCircleLineSeg(c3_d3, l13, 0)
 * lc23cp1 = line from c23 center to cp1
 * pc23e = interceptCircleLineSeg(c23, lc23cp1, 0)
 * outline9 = line from pc3sw to pc23e
 */
const STEP_26: SixFoldV0Step = {
  id: "step26",
  inputs: [GEOM.C3_D3, GEOM.L13, GEOM.C23, GEOM.CP1],
  outputs: [GEOM.PC3SW, GEOM.PC23E, GEOM.OUTLINE9],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c3_d3 = getGeometry(inputs, GEOM.C3_D3, isCircle, "Circle");
    const l13 = getGeometry(inputs, GEOM.L13, isLine, "Line");
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");

    // pc3sw = interceptCircleLineSeg(c3_d3, l13, 0)
    const pc3sw = interceptCircleLineSegHelper(c3_d3, l13, 0);

    // lc23cp1 = line from c23 center to cp1
    const lc23cp1 = line(c23.cx, c23.cy, cp1.x, cp1.y);

    // pc23e = interceptCircleLineSeg(c23, lc23cp1, 0)
    const pc23e = interceptCircleLineSegHelper(c23, lc23cp1, 0);
    if (!pc3sw) throw new Error("STEP_26: pc3sw is null - circle-line intersection not found");
    if (!pc23e) throw new Error("STEP_26: pc23e is null - circle-line intersection not found");

    // outline9 = line from pc3sw to pc23e
    const outline9 = line(pc3sw.x, pc3sw.y, pc23e.x, pc23e.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC3SW, pc3sw);
    m.set(GEOM.PC23E, pc23e);
    m.set(GEOM.OUTLINE9, outline9);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC3SW, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC23E, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE9, 2.0, store, theme);
  },
};

/**
 * Step 27: pc34s, outline10
 * lc34cp1 = line from c34 center to cp1
 * pc34s = interceptCircleLineSeg(c34, lc34cp1, 0)
 * outline10 = line from pc34s to pc3sw
 */
const STEP_27: SixFoldV0Step = {
  id: "step27",
  inputs: [GEOM.C34, GEOM.CP1, GEOM.PC3SW],
  outputs: [GEOM.PC34S, GEOM.OUTLINE10],
  parameters: [],
  compute: computeMultiple((inputs, _config) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");

    // lc34cp1 = line from c34 center to cp1
    const lc34cp1 = line(c34.cx, c34.cy, cp1.x, cp1.y);

    // pc34s = interceptCircleLineSeg(c34, lc34cp1, 0)
    const pc34s = interceptCircleLineSegHelper(c34, lc34cp1, 0);
    const pc3sw = getGeometry(inputs, GEOM.PC3SW, isPoint, "Point");
    if (!pc34s) throw new Error("STEP_27: pc34s is null");
    const outline10 = line(pc34s.x, pc34s.y, pc3sw.x, pc3sw.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC34S, pc34s);
    m.set(GEOM.OUTLINE10, outline10);
    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC34S, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE10, 2.0, store, theme);
  },
};

/**
 * Step 28: outline11
 * Draws outline line from pc34e to pc34s.
 */
const STEP_28: SixFoldV0Step = {
  id: "step28",
  inputs: [GEOM.PC34E, GEOM.PC34S],
  outputs: [GEOM.OUTLINE11],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE11, (inputs, _config) => {
    const pc34e = getGeometry(inputs, GEOM.PC34E, isPoint, "Point");
    const pc34s = getGeometry(inputs, GEOM.PC34S, isPoint, "Point");
    return line(pc34e.x, pc34e.y, pc34s.x, pc34s.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE11, 2.0, store, theme);
  },
};

/**
 * Step 29: outline12 (symmetric to outline11, closer to cp2)
 * Draws outline line from pc23s to pc23e.
 */
const STEP_29: SixFoldV0Step = {
  id: "step29",
  inputs: [GEOM.PC23S, GEOM.PC23E],
  outputs: [GEOM.OUTLINE12],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE12, (inputs, _config) => {
    const pc23s = getGeometry(inputs, GEOM.PC23S, isPoint, "Point");
    const pc23e = getGeometry(inputs, GEOM.PC23E, isPoint, "Point");
    return line(pc23s.x, pc23s.y, pc23e.x, pc23e.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE12, 2.0, store, theme);
  },
};

/**
 * Step 30: outline13 (cp4 to pic4)
 * Draws outline line from circle center cp4 to point pic4.
 */
const STEP_30: SixFoldV0Step = {
  id: "step30",
  inputs: [GEOM.CP4, GEOM.PIC4],
  outputs: [GEOM.OUTLINE13],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE13, (inputs, _config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic4 = getGeometry(inputs, GEOM.PIC4, isPoint, "Point");
    return line(cp4.x, cp4.y, pic4.x, pic4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE13, 2.0, store, theme);
  },
};

/**
 * Step 31: outline14 (cp2 to pic2)
 * Draws outline line from circle center cp2 to point pic2.
 */
const STEP_31: SixFoldV0Step = {
  id: "step31",
  inputs: [GEOM.CP2, GEOM.PIC2],
  outputs: [GEOM.OUTLINE14],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE14, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic2 = getGeometry(inputs, GEOM.PIC2, isPoint, "Point");
    return line(cp2.x, cp2.y, pic2.x, pic2.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE14, 2.0, store, theme);
  },
};

/**
 * Step 32: Outline15 - line from cp2 to cp1
 * Draws outline line connecting circle centers cp2 to cp1.
 */
const STEP_32: SixFoldV0Step = {
  id: "step32",
  inputs: [GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.OUTLINE15],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE15, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    return line(cp2.x, cp2.y, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE15, 2.0, store, theme);
  },
};

/**
 * Step 33: Outline16 - line from cp2 to cp3
 * Draws outline line connecting circle centers cp2 to cp3.
 */
const STEP_33: SixFoldV0Step = {
  id: "step33",
  inputs: [GEOM.CP2, GEOM.CP3],
  outputs: [GEOM.OUTLINE16],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE16, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    return line(cp2.x, cp2.y, cp3.x, cp3.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE16, 2.0, store, theme);
  },
};

/**
 * Step 34: Outline17 - line from cp3 to cp4
 * Draws outline line connecting circle centers cp3 to cp4.
 */
const STEP_34: SixFoldV0Step = {
  id: "step34",
  inputs: [GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.OUTLINE17],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE17, (inputs, _config) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    return line(cp3.x, cp3.y, cp4.x, cp4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE17, 2.0, store, theme);
  },
};

/**
 * Step 35: Outline18 - line from cp4 to cp1
 * Draws outline line connecting circle centers cp4 to cp1, completing the quadrilateral.
 */
const STEP_35: SixFoldV0Step = {
  id: "step35",
  inputs: [GEOM.CP4, GEOM.CP1],
  outputs: [GEOM.OUTLINE18],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE18, (inputs, _config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    return line(cp4.x, cp4.y, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE18, 2.0, store, theme);
  },
};

/** All steps in order */
export const SIX_FOLD_V0_STEPS: readonly SixFoldV0Step[] = [
  STEP_1,
  STEP_2A,
  STEP_2B,
  STEP_2C,
  STEP_2D,
  STEP_3,
  STEP_4,
  STEP_5,
  STEP_6,
  STEP_7,
  STEP_8,
  STEP_9,
  STEP_10,
  STEP_11,
  STEP_12,
  STEP_13,
  STEP_14,
  STEP_15,
  STEP_16,
  STEP_17,
  STEP_18,
  STEP_19,
  STEP_20,
  STEP_21,
  STEP_22,
  STEP_23,
  STEP_24,
  STEP_25,
  STEP_26,
  STEP_27,
  STEP_28,
  STEP_29,
  STEP_30,
  STEP_31,
  STEP_32,
  STEP_33,
  STEP_34,
  STEP_35,
];

/** Execute a single step */
export function executeStep(
  step: SixFoldV0Step,
  allValues: Map<string, GeometryValue>,
  ctx: StepExecutionContext,
  config: SixFoldV0Config,
): Map<string, GeometryValue> {
  const inputValues = new Map<string, GeometryValue>();
  for (const id of step.inputs) {
    const v = allValues.get(id);
    if (!v) throw new Error(`Missing input: ${id}`);
    inputValues.set(id, v);
  }
  const outputs = step.compute(inputValues, config);
  const result = new Map(allValues);
  for (const [id, val] of outputs) result.set(id, val);
  step.draw(ctx.svg, result, ctx.store, ctx.theme);
  return result;
}

/** Execute all steps up to a given index */
export function executeSteps(
  steps: readonly SixFoldV0Step[],
  upToIndex: number,
  ctx: StepExecutionContext,
  config: SixFoldV0Config,
): Map<string, GeometryValue> {
  let allValues = new Map<string, GeometryValue>();
  for (let i = 0; i < Math.min(upToIndex, steps.length); i++) {
    allValues = executeStep(steps[i], allValues, ctx, config);
  }
  return allValues;
}
