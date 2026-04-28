/**
 * SixFoldV0 geometric construction - Step definitions
 * Replicates "1/4 Six fold pattern v3" from Svelte app.
 */

import type { GeometryValue, Point, Line, Circle } from "../types/geometry";
import { point, line, circle, isPoint, isLine, isCircle } from "../types/geometry";
import {
  bisect as bisectFn,
  circlesIntersectionPoint,
  directions,
  inteceptCircleLineSeg,
  lineIntersect,
} from "@sg/geometry";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { drawPoint, drawLine, drawCircle } from "../svgElements";
import { getGeometry } from "./operations";

// Constants
const CUT_LINE_BY = 8;

// Geometry ID constants
export const GEOM = {
  LINE1: "line1",
  P1: "p1",
  P2: "p2",
  C1: "c1",
  C2: "c2",
  C3: "c3",
  C4: "c4",
  CIRCLE_AT_INTERSECTION: "circleAtIntersection",
  P3: "p3",
  P4: "p4",
  CP1: "cp1",
  CP2: "cp2",
  CP3: "cp3",
  CP4: "cp4",
  L12: "l12",
  L23: "l23",
  L34: "l34",
  L41: "l41",
  PIC12: "pic12",
  PIC14: "pic14",
  LPIC12: "lpic12",
  LPIC14: "lpic14",
  L13: "l13",
  L24: "l24",
  PI2: "pi2",
  C1_D1: "c1_d1",
  C2_D1: "c2_d1",
  C3_D1: "c3_d1",
  C4_D1: "c4_d1",
  D1: "d1",
  C14_D1: "c14_d1",
  C12_D1: "c12_d1",
  PI3: "pi3",
  PI4: "pi4",
  LCP1PI3: "lcp1pi3",
  LCP1PI4: "lcp1pi4",
  PRX5: "prx5",
  PRX6: "prx6",
  C23W: "c23w",
  L14P: "l14p",
  PC23: "pc23",
  C23S: "c23s",
  C23: "c23",
  CPI12: "cpic12",
  C34N: "c34n",
  LPIC12C34N: "lpic12c34n",
  PC34: "pc34",
  C34: "c34",
  C34E: "c34e",
  PP: "pp",
  L1: "l1",
  PII1: "pii1",
  PII2: "pii2",
  LPII1PII2: "lpii1pii2",
  C1_D3: "c1_d3",
  C2_D3: "c2_d3",
  C3_D3: "c3_d3",
  C4_D3: "c4_d3",
  LCP2PIC14: "lcp2pic14",
  LCP4PIC12: "lcp4pic12",
  PIC4: "pic4",
  OUTLINE1: "outline1",
  PIC2: "pic2",
  OUTLINE2: "outline2",
  PIC1W: "pic1w",
  PIC34: "pic34",
  OUTLINE3: "outline3",
  PIC1N: "pic1n",
  PIC23: "pic23",
  OUTLINE4: "outline4",
  PC1W: "pc1w",
  PC23S: "pc23s",
  OUTLINE5: "outline5",
  PC1N: "pc1n",
  PC34E: "pc34e",
  OUTLINE6: "outline6",
  OUTLINE7: "outline7",
  OUTLINE8: "outline8",
  PC3SW: "pc3sw",
  PC23E: "pc23e",
  OUTLINE9: "outline9",
  PC34S: "pc34s",
  OUTLINE10: "outline10",
  OUTLINE11: "outline11",
  OUTLINE12: "outline12",
  OUTLINE13: "outline13",
  OUTLINE14: "outline14",
  OUTLINE15: "outline15",
  OUTLINE16: "outline16",
  OUTLINE17: "outline17",
  OUTLINE18: "outline18",
} as const;

export type GeometryId = (typeof GEOM)[keyof typeof GEOM];

/** Configuration for SixFoldV0 geometry construction */
export interface SixFoldV0Config {
  width: number;
  height: number;
  border: number;
  radius: number;
  lx1: number;
  ly1: number;
  lx2: number;
  ly2: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
}

/** Computes the SixFoldV0 geometry configuration
 * Matches v3 Svelte circlesFromLine logic exactly */
export function computeSixFoldV0Config(width: number, height: number): SixFoldV0Config {
  const border = height / 3;
  const lx1 = border;
  const ly1 = height - border;
  const lx2 = width - border;
  const ly2 = height - border;

  // Match v3's circlesFromLine computation
  const lineLength = lx2 - lx1;
  const radius = (lineLength * 2) / CUT_LINE_BY;
  const cx1 = lx1 + (lineLength * 5) / CUT_LINE_BY;
  const cy1 = ly1; // v3 uses line.p2.y which equals ly1
  const cx2 = cx1 - radius;
  const cy2 = cy1;

  // Ensure all values are valid numbers
  function safe(val: number): number {
    if (!isValidNumber(val)) return 0;
    return val;
  }

  return {
    width,
    height,
    border,
    radius,
    lx1: safe(lx1),
    ly1: safe(ly1),
    lx2: safe(lx2),
    ly2: safe(ly2),
    cx1: safe(cx1),
    cy1: safe(cy1),
    cx2: safe(cx2),
    cy2: safe(cy2),
  };
}

/** Context for step execution */
export interface StepExecutionContext {
  svg: SVGSVGElement;
  store: GeometryStore;
  theme: Theme;
}

// Local Step type for SixFoldV0 that uses SixFoldV0Config instead of SquareConfig
export interface SixFoldV0Step {
  id: string;
  inputs: string[];
  outputs: string[];
  parameters?: (keyof SixFoldV0Config)[];
  compute: (
    inputs: Map<string, GeometryValue>,
    config: SixFoldV0Config,
  ) => Map<string, GeometryValue>;
  draw: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    store: GeometryStore,
    theme: Theme,
  ) => void;
}

// Helper to get distance between two points
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (!isValidNumber(dx) || !isValidNumber(dy)) return 0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return isValidNumber(dist) ? dist : 0;
}

// Helper to check if a value is a valid number (not NaN or Infinity)
function isValidNumber(n: number): boolean {
  return typeof n === "number" && !Number.isNaN(n) && Number.isFinite(n);
}

// Helper to create a valid point or return null
function validPoint(x: number, y: number): Point | null {
  if (!isValidNumber(x) || !isValidNumber(y)) return null;
  // Also check for unreasonably large coordinates (likely calculation errors)
  // Canvas dimensions are 840x519, so values beyond 10000 are suspicious
  if (Math.abs(x) > 10000 || Math.abs(y) > 10000) return null;
  return point(x, y);
}

// Helper matching v3's bisectCircleAndPoint logic
function bisectCircleAndPoint(c: Circle, p: Point): Point {
  const cx0 = c.cx - c.r;
  const cy0 = c.cy;
  const angle = Math.atan2(cy0 - p.y, cx0 - p.x);
  const [x, y] = bisectFn(angle * 2, c.r, c.cx, c.cy);
  return point(x, y);
}

// Helper to compute circlesIntersectionPoint with our Circle types
function circlesIntersectionPointHelper(
  c1: Circle,
  c2: Circle,
  dir:
    | typeof directions.up
    | typeof directions.down
    | typeof directions.left
    | typeof directions.right,
): Point | null {
  // circlesIntersectionPoint expects Circle objects from @sg/geometry
  // We create compatible objects using type assertions
  const sgC1 = { p: { x: c1.cx, y: c1.cy }, r: c1.r } as any;
  const sgC2 = { p: { x: c2.cx, y: c2.cy }, r: c2.r } as any;
  const result = circlesIntersectionPoint(sgC1, sgC2, dir);
  if (!result) return null;
  // result is a Point from @sg/geometry which has x and y properties
  const x = (result as any).x;
  const y = (result as any).y;
  return validPoint(x, y);
}

// Helper to find intersection of circle with line segment
function interceptCircleLineSegHelper(circle: Circle, line: Line, index: number = 0): Point | null {
  const result = inteceptCircleLineSeg(
    circle.cx,
    circle.cy,
    line.x1,
    line.y1,
    line.x2,
    line.y2,
    circle.r,
  );
  if (!result || !result[index]) return null;
  const x = result[index][0];
  const y = result[index][1];
  return validPoint(x, y);
}

// Helper to find intersection of circle with INFINITE line (matching Svelte semantics)
// Uses direct mathematical computation for infinite line, not segment-based
// Returns intersection points ordered by parameter t along line from (x1,y1) to (x2,y2)
function interceptCircleLineHelper(circle: Circle, line: Line, index: number): Point | null {
  const cx = circle.cx;
  const cy = circle.cy;
  const r = circle.r;
  const x1 = line.x1,
    y1 = line.y1;
  const x2 = line.x2,
    y2 = line.y2;

  // Line coefficients: ax + by + c = 0
  // a = y2 - y1, b = x1 - x2, c = x2*y1 - x1*y2
  const a = y2 - y1;
  const b = x1 - x2;
  const c = x2 * y1 - x1 * y2;

  // Denominator for distance calculation
  const denom = a * a + b * b;
  if (denom === 0) return null; // line is degenerate (a point)

  // Distance from circle center to line
  const dist = Math.abs(a * cx + b * cy + c) / Math.sqrt(denom);

  if (dist > r) return null; // no intersection
  if (dist === r) {
    // tangent - one intersection point
    const sign = a * cx + b * cy + c < 0 ? 1 : -1;
    const dx = b * sign * (r / Math.sqrt(denom));
    const dy = -a * sign * (r / Math.sqrt(denom));
    const px = cx + dx;
    const py = cy + dy;
    return index === 0 ? point(px, py) : null;
  }

  // Two intersection points
  // Find point on line closest to circle center
  const h = Math.sqrt(r * r - dist * dist);
  const px0 = cx - (a * (a * cx + b * cy + c)) / denom;
  const py0 = cy - (b * (a * cx + b * cy + c)) / denom;

  // Unit direction vector of the line from (x1,y1) to (x2,y2)
  const lineLenSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (lineLenSq === 0) return null;
  const lineLen = Math.sqrt(lineLenSq);
  const ux = (x2 - x1) / lineLen;
  const uy = (y2 - y1) / lineLen;

  // Two intersection points on infinite line
  const rawPts = [point(px0 + ux * h, py0 + uy * h), point(px0 - ux * h, py0 - uy * h)];

  // Sort by parameter t along the line direction (x1,y1) -> (x2,y2)
  // t = dot product of (pt - p1) with direction vector
  rawPts.sort((ptA, ptB) => {
    const ta = (ptA.x - x1) * (x2 - x1) + (ptA.y - y1) * (y2 - y1);
    const tb = (ptB.x - x1) * (x2 - x1) + (ptB.y - y1) * (y2 - y1);
    return ta - tb;
  });

  if (index === 0) {
    return rawPts[0];
  } else if (index === 1) {
    return rawPts[1];
  }
  return null;
}

// Step 1: Main line and points
const STEP_1: SixFoldV0Step = {
  id: "step1",
  inputs: [],
  outputs: [GEOM.LINE1, GEOM.P1, GEOM.P2],
  parameters: [],
  compute: (_, config: any) => {
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LINE1, line(config.lx1, config.ly1, config.lx2, config.ly2));
    m.set(GEOM.P1, point(config.lx1, config.ly1));
    m.set(GEOM.P2, point(config.lx2, config.ly2));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LINE1, 0.5, store, theme);
    drawPoint(svg, values, GEOM.P1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.P2, 2.0, store, theme);
  },
};

// Step 2: Circle centers and initial circles
// Following SixFoldv3.svelte circlesFromLine logic:
// 1. Create c1 at (cx1, cy1) and c2 at (cx2, cy2) with radius
// 2. Find px, py = intersection of c1 and c2 (top point)
// 3. Create circle at (px,py) with same radius
// 4. p3 = bisect from circleAtIntersection through c2 center
// 5. p4 = bisect from circleAtIntersection through c1 center
// 6. l13 = line from c1 to p3, find intersection with c1 circle -> cp13, create c4
// 7. l24 = line from c2 to p4, find intersection with c2 circle -> cp24, create c3
const STEP_2: SixFoldV0Step = {
  id: "step2",
  inputs: [],
  outputs: [
    GEOM.CP1,
    GEOM.CP2,
    GEOM.C1,
    GEOM.C2,
    GEOM.P3,
    GEOM.P4,
    GEOM.CP3,
    GEOM.CP4,
    GEOM.C3,
    GEOM.C4,
    GEOM.CIRCLE_AT_INTERSECTION,
    GEOM.L13,
    GEOM.L24,
  ],
  parameters: [],
  compute: (_, cfg) => {
    const c = cfg as unknown as SixFoldV0Config;
    const m = new Map<string, GeometryValue>();

    // Create circle centers cp1 and cp2
    const cp1 = point(c.cx1, c.cy1);
    const cp2 = point(c.cx2, c.cy2);
    m.set(GEOM.CP1, cp1);
    m.set(GEOM.CP2, cp2);

    // Debug: store intermediate points

    // Create circles c1 and c2
    const circle1 = circle(c.cx1, c.cy1, c.radius);
    const circle2 = circle(c.cx2, c.cy2, c.radius);
    m.set(GEOM.C1, circle1);
    m.set(GEOM.C2, circle2);

    // Find px, py = intersection point of c1 and c2 circles (top point)
    const c1 = m.get(GEOM.C1) as Circle;
    const c2 = m.get(GEOM.C2) as Circle;
    const pxPy = circlesIntersectionPointHelper(c1, c2, directions.up);
    if (!pxPy) {
      // Fallback: use cp1 if no intersection found
      m.set(GEOM.CP3, cp1);
      m.set(GEOM.CP4, cp2);
      m.set(GEOM.C3, circle(c.cx1, c.cy1, c.radius));
      m.set(GEOM.C4, circle(c.cx2, c.cy2, c.radius));
      return m;
    }

    // p3 = bisect from circleAtIntersection through cp2
    // From Svelte: bisectCircleAndPoint(circleAtIntersection, c2.p)
    const circleAtIntersection = circle(pxPy.x, pxPy.y, c.radius);
    const p3 = bisectCircleAndPoint(circleAtIntersection, cp2);
    const p4 = bisectCircleAndPoint(circleAtIntersection, cp1);
    m.set(GEOM.P3, p3);
    m.set(GEOM.P4, p4);

    // l13 = line from cp1 to p3
    const l13Line = line(cp1.x, cp1.y, p3.x, p3.y);
    // c4 center = intersection of c1 circle with l13 line
    const c4IntersectionRaw = interceptCircleLineSegHelper(c1, l13Line, 0);
    const c4Intersection = c4IntersectionRaw;

    // l24 = line from cp2 to p4
    const l24Line = line(cp2.x, cp2.y, p4.x, p4.y);
    // c3 center = intersection of c2 circle with l24 line
    const c3IntersectionRaw = interceptCircleLineSegHelper(c2, l24Line, 0);
    const c3Intersection = c3IntersectionRaw;
    if (!c3Intersection || !c4Intersection) {
      throw new Error("STEP_2: Failed to find circle intersections for c3 or c4 centers");
    }

    // Create cp3, cp4, c3, c4
    m.set(GEOM.CP3, c3Intersection);
    m.set(GEOM.CP4, c4Intersection);
    const c3 = circle(c3Intersection.x, c3Intersection.y, c.radius);
    const c4 = circle(c4Intersection.x, c4Intersection.y, c.radius);
    m.set(GEOM.C3, c3);
    m.set(GEOM.C4, c4);

    // Debug: print coordinates

    // Debug: store intermediate geometries
    m.set(GEOM.CIRCLE_AT_INTERSECTION, circleAtIntersection);
    m.set(GEOM.L13, l13Line);
    m.set(GEOM.L24, l24Line);

    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP2, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP3, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP4, 2.0, store, theme);
    // Debug intermediate points
    drawPoint(svg, values, GEOM.P3, 1.5, store, theme);
    drawPoint(svg, values, GEOM.P4, 1.5, store, theme);
    drawCircle(svg, values, GEOM.C1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4, 0.5, store, theme);
    // Debug geometries
    drawCircle(svg, values, GEOM.CIRCLE_AT_INTERSECTION, 0.5, store, theme);
    drawLine(svg, values, GEOM.L13, 0.5, store, theme);
    drawLine(svg, values, GEOM.L24, 0.5, store, theme);
  },
};

// Step 3: Lines between circle centers
const STEP_3: SixFoldV0Step = {
  id: "step3",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.L12, GEOM.L23, GEOM.L34, GEOM.L41],
  parameters: [],
  compute: (inputs) => {
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
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L12, 0.5, store, theme);
    drawLine(svg, values, GEOM.L23, 0.5, store, theme);
    drawLine(svg, values, GEOM.L34, 0.5, store, theme);
    drawLine(svg, values, GEOM.L41, 0.5, store, theme);
  },
};

// Step 4: Intersection points pic12 and pic14
const STEP_4: SixFoldV0Step = {
  id: "step4",
  inputs: [GEOM.C1, GEOM.C2, GEOM.C3, GEOM.C4],
  outputs: [GEOM.PIC12, GEOM.PIC14],
  parameters: [],
  compute: (inputs) => {
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");
    const c4 = getGeometry(inputs, GEOM.C4, isCircle, "Circle");
    const pic12 = circlesIntersectionPointHelper(c1, c2, directions.up);
    const pic14 = circlesIntersectionPointHelper(c4, c1, directions.left);
    const m = new Map<string, GeometryValue>();
    if (pic12) m.set(GEOM.PIC12, pic12);
    if (pic14) m.set(GEOM.PIC14, pic14);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC12, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC14, 2.0, store, theme);
  },
};

// Step 5: Lines from cp1 to pic points
const STEP_5: SixFoldV0Step = {
  id: "step5",
  inputs: [GEOM.CP1, GEOM.PIC12, GEOM.PIC14],
  outputs: [GEOM.LPIC12, GEOM.LPIC14],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pic12 = inputs.get(GEOM.PIC12);
    const pic14 = inputs.get(GEOM.PIC14);
    const m = new Map<string, GeometryValue>();
    if (pic12 && isPoint(pic12)) m.set(GEOM.LPIC12, line(cp1.x, cp1.y, pic12.x, pic12.y));
    if (pic14 && isPoint(pic14)) m.set(GEOM.LPIC14, line(cp1.x, cp1.y, pic14.x, pic14.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPIC12, 0.5, store, theme);
    drawLine(svg, values, GEOM.LPIC14, 0.5, store, theme);
  },
};

// Step 6: Crossing lines l13, l24 and intersection pi2
const STEP_6: SixFoldV0Step = {
  id: "step6",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.L13, GEOM.L24, GEOM.PI2],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const l13 = line(cp1.x, cp1.y, cp3.x, cp3.y);
    const l24 = line(cp2.x, cp2.y, cp4.x, cp4.y);
    const pi2Result = lineIntersect(cp1.x, cp1.y, cp3.x, cp3.y, cp2.x, cp2.y, cp4.x, cp4.y);
    const pi2 = pi2Result && pi2Result.length >= 2 ? validPoint(pi2Result[0], pi2Result[1]) : null;
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.L13, l13);
    m.set(GEOM.L24, l24);
    if (pi2) m.set(GEOM.PI2, pi2);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L13, 0.5, store, theme);
    drawLine(svg, values, GEOM.L24, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PI2, 2.0, store, theme);
  },
};

// Step 7: pi2 point (from step 6 l13 and l24 intersection)
// In Svelte this is step 7, but in our config pi2 is already computed in step 6.
// Looking at Svelte: step 7 is just pi2 as a separate step.
// But we already have pi2 in step 6 outputs. Let me check...
// In Svelte: steps 1-6, then step 7 is pi2 = linesIntersection(l13, l24)
// Our step 6 already computes pi2, so step 7 in Svelte is redundant for us.
// Actually looking more carefully, in Svelte step 6 is [l13, l24], then step 7 is [pi2]
// So we need step 7 to be just pi2 as output
const STEP_7: SixFoldV0Step = {
  id: "step7",
  inputs: [GEOM.PI2],
  outputs: [GEOM.PI2],
  parameters: [],
  compute: (inputs) => {
    const m = new Map<string, GeometryValue>();
    const pi2 = inputs.get(GEOM.PI2);
    if (pi2) m.set(GEOM.PI2, pi2);
    return m;
  },
  draw: (svg, values, store, theme) => {
    // pi2 was already drawn in step 6, no need to draw again
  },
};

// Step 8: D1 circles (c1_d1, c2_d1, c3_d1, c4_d1) at cp1, cp2, cp3, cp4 with radius = d1 (distance pic14 to pi2)
const STEP_8: SixFoldV0Step = {
  id: "step8",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C1_D1, GEOM.C2_D1, GEOM.C3_D1, GEOM.C4_D1, GEOM.D1],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    // TODO: Refactor to separate scalar parameters from geometry Map (match Square.tsx pattern).
    // Move D1 to SixFoldV0Config, remove GEOM.D1 from Map. Steps needing d1 should get it from config.
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.D1, d1);
    m.set(GEOM.C1_D1, circle(cp1.x, cp1.y, d1));
    m.set(GEOM.C2_D1, circle(cp2.x, cp2.y, d1));
    m.set(GEOM.C3_D1, circle(cp3.x, cp3.y, d1));
    m.set(GEOM.C4_D1, circle(cp4.x, cp4.y, d1));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4_D1, 0.5, store, theme);
  },
};

// Step 9: Circles at pic14 and pic12 with radius d1
const STEP_9: SixFoldV0Step = {
  id: "step9",
  inputs: [GEOM.PIC12, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C14_D1, GEOM.C12_D1],
  parameters: [],
  compute: (inputs) => {
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
  },
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C14_D1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C12_D1, 0.5, store, theme);
  },
};

// Step 10: pi3 and pi4 intersection points
// pi3 = circlesIntersectionPoint(c14_d1, c2, directions.right)
// pi4 = circlesIntersectionPoint(c12_d1, c4, directions.right)
const STEP_10: SixFoldV0Step = {
  id: "step10",
  inputs: [GEOM.C14_D1, GEOM.C2_D1, GEOM.C12_D1, GEOM.C4_D1],
  outputs: [GEOM.PI3, GEOM.PI4],
  parameters: [],
  compute: (inputs) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");
    const pi3 = circlesIntersectionPointHelper(c14_d1, c2_d1, directions.right);
    const pi4 = circlesIntersectionPointHelper(c12_d1, c4_d1, directions.right);
    const m = new Map<string, GeometryValue>();
    if (pi3) m.set(GEOM.PI3, pi3);
    if (pi4) m.set(GEOM.PI4, pi4);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PI3, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PI4, 2.0, store, theme);
  },
};

// Step 11: Lines from cp1 to pi3 and pi4
const STEP_11: SixFoldV0Step = {
  id: "step11",
  inputs: [GEOM.CP1, GEOM.PI3, GEOM.PI4],
  outputs: [GEOM.LCP1PI3, GEOM.LCP1PI4],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    const pi4 = getGeometry(inputs, GEOM.PI4, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LCP1PI3, line(cp1.x, cp1.y, pi3.x, pi3.y));
    m.set(GEOM.LCP1PI4, line(cp1.x, cp1.y, pi4.x, pi4.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP1PI3, 0.5, store, theme);
    drawLine(svg, values, GEOM.LCP1PI4, 0.5, store, theme);
  },
};

// Step 12: prx5 and prx6 points
// prx5 = interceptCircleLineSeg(c14_d1 center, lpic14 line)
// prx6 = interceptCircleLineSeg(c12_d1 center, lpic12 line)
const STEP_12: SixFoldV0Step = {
  id: "step12",
  inputs: [GEOM.C14_D1, GEOM.LPIC14, GEOM.C12_D1, GEOM.LPIC12],
  outputs: [GEOM.PRX5, GEOM.PRX6],
  parameters: [],
  compute: (inputs) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const lpic12 = getGeometry(inputs, GEOM.LPIC12, isLine, "Line");
    const prx5 = interceptCircleLineSegHelper(c14_d1, lpic14, 0);
    const prx6 = interceptCircleLineSegHelper(c12_d1, lpic12, 0);
    const m = new Map<string, GeometryValue>();
    if (prx5) m.set(GEOM.PRX5, prx5);
    if (prx6) m.set(GEOM.PRX6, prx6);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PRX5, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PRX6, 2.0, store, theme);
  },
};

// Step 13: c23w, l14p, pc23, c23s, c23 circle
// From Svelte:
//   c23w = bisectCircleAndPoint(c14, pi5)  -> bisectFn on circle c14_d1 from point pi5
//   l14p = new Line(pic14, c23w)
//   pc23 = linesIntersection(l23, l14p)
//   line = new Line(pc23, cp2)
//   c23s = interceptCircleLine(c2, line, "c23s", 0)
//   d2 = pc23.distanceToPoint(c23s)
//   c23 = new Circle(pc23, d2)
const STEP_13: SixFoldV0Step = {
  id: "step13",
  inputs: [GEOM.C14_D1, GEOM.PRX5, GEOM.PIC14, GEOM.L23, GEOM.CP2, GEOM.C2_D1],
  outputs: [GEOM.C23W, GEOM.L14P, GEOM.PC23, GEOM.C23S, GEOM.C23],
  parameters: [],
  compute: (inputs) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const prx5 = getGeometry(inputs, GEOM.PRX5, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");

    // c23w = bisect from c14_d1 center through prx5 (matching v3 bisectCircleAndPoint)
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
    const pc23Pt =
      pc23Result && pc23Result.length >= 2 ? validPoint(pc23Result[0], pc23Result[1]) : null;
    if (!pc23Pt) throw new Error("STEP_13: pc23Pt is null");

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
    if (pc23Pt) m.set(GEOM.PC23, pc23Pt);
    if (c23s) m.set(GEOM.C23S, c23s);
    m.set(GEOM.C23, c23);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C23W, 2.0, store, theme);
    drawLine(svg, values, GEOM.L14P, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PC23, 2.0, store, theme);
    drawPoint(svg, values, GEOM.C23S, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C23, 0.5, store, theme);
  },
};

// Step 14: cpic12, c34n, lpic12c34n, pc34, c34e, c34 circle
// cpic12 = circle at pic12 with radius d1
// c34n = bisectCircleAndPoint(cpic12, pi6)
// lpic12c34n = line from pic12 to c34n
// pc34 = linesIntersection(l34, lpic12c34n)
// c34e = interceptCircleLine(c4, line(pc34, cp4), 0)
// c34 = circle at pc34 with radius = distance(pc34, c34e)
const STEP_14: SixFoldV0Step = {
  id: "step14",
  inputs: [GEOM.PIC12, GEOM.D1, GEOM.PRX6, GEOM.L34, GEOM.CP4, GEOM.C4_D1],
  outputs: [GEOM.CPI12, GEOM.C34N, GEOM.LPIC12C34N, GEOM.PC34, GEOM.C34E, GEOM.C34],
  parameters: [],
  compute: (inputs) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const d1Val = inputs.get(GEOM.D1) as number | undefined;
    const pi6 = getGeometry(inputs, GEOM.PRX6, isPoint, "Point");
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");

    if (typeof d1Val !== "number") throw new Error("STEP_14: d1 is missing or not a number");

    // cpic12 = circle at pic12 with radius d1
    const cpic12 = circle(pic12.x, pic12.y, d1Val);

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
    const pc34Pt =
      pc34Result && pc34Result.length >= 2 ? validPoint(pc34Result[0], pc34Result[1]) : null;
    if (!pc34Pt) throw new Error("STEP_14: pc34Pt is null");

    // line from pc34 to cp4
    const lineToCp4 = line(pc34Pt.x, pc34Pt.y, cp4.x, cp4.y);

    // Debug: print all geometries before c34e computation
    const dist_pc34_cp4 = distance(pc34Pt, cp4);

    // c34e = interceptCircleLine(c4_d1, line, 0) - first intersection point
    const c34e = interceptCircleLineSegHelper(c4_d1, lineToCp4, 0);
    if (!c34e) throw new Error("STEP_14: c34e is null");

    // d2 = distance from pc34 to c34e
    const d2 = distance(pc34Pt, c34e);

    // c34 = circle at pc34 with radius d2
    const c34 = circle(pc34Pt.x, pc34Pt.y, d2);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.CPI12, cpic12);
    m.set(GEOM.C34N, c34nPt);
    m.set(GEOM.LPIC12C34N, lpic12c34n);
    if (pc34Pt) m.set(GEOM.PC34, pc34Pt);
    m.set(GEOM.C34E, c34e);
    m.set(GEOM.C34, c34);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.CPI12, 0.5, store, theme);
    drawPoint(svg, values, GEOM.C34N, 2.0, store, theme);
    drawLine(svg, values, GEOM.LPIC12C34N, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PC34, 2.0, store, theme);
    drawPoint(svg, values, GEOM.C34E, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C34, 0.5, store, theme);
  },
};

// Step 15: pp, l1, pii1, pii2
// pp = interceptCircleLineSeg(c1, lpic14)
// l1 = line from pi3 to pp
// pii1 = intersection of line(pi3,pp) with l13
// pii2 = intersection of line(pi3,pp) with l24
const STEP_15: SixFoldV0Step = {
  id: "step15",
  inputs: [GEOM.C1_D1, GEOM.LPIC14, GEOM.PI3, GEOM.L13, GEOM.L24],
  outputs: [GEOM.PP, GEOM.L1, GEOM.PII1, GEOM.PII2],
  parameters: [],
  compute: (inputs) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    const l13 = getGeometry(inputs, GEOM.L13, isLine, "Line");
    const l24 = getGeometry(inputs, GEOM.L24, isLine, "Line");

    // pp = interceptCircleLine(c1_d1, lpic14, 0)
    // Using line segment to match Svelte
    const pp = interceptCircleLineSegHelper(c1_d1, lpic14, 0);
    if (!pp) throw new Error("STEP_15: pp is null");

    // l1 = line from pi3 to pp
    const l1 = line(pi3.x, pi3.y, pp.x, pp.y);

    // pii1 = intersection of line(pi3,pp) with l13
    let pii1: Point | null = null;
    const result1 = lineIntersect(pi3.x, pi3.y, pp.x, pp.y, l13.x1, l13.y1, l13.x2, l13.y2);
    if (result1 && result1.length >= 2) {
      pii1 = validPoint(result1[0], result1[1]);
    }

    // pii2 = intersection of line(pi3,pp) with l24
    let pii2: Point | null = null;
    const result2 = lineIntersect(pi3.x, pi3.y, pp.x, pp.y, l24.x1, l24.y1, l24.x2, l24.y2);
    if (result2 && result2.length >= 2) {
      pii2 = validPoint(result2[0], result2[1]);
    }
    if (!pii1) throw new Error("STEP_15: pii1 is null");
    if (!pii2) throw new Error("STEP_15: pii2 is null");

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PP, pp);
    m.set(GEOM.L1, l1);
    m.set(GEOM.PII1, pii1);
    m.set(GEOM.PII2, pii2);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PP, 2.0, store, theme);
    drawLine(svg, values, GEOM.L1, 0.5, store, theme);
    drawPoint(svg, values, GEOM.PII1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PII2, 2.0, store, theme);
  },
};

// Step 16: Line between pii1 and pii2
const STEP_16: SixFoldV0Step = {
  id: "step16",
  inputs: [GEOM.PII1, GEOM.PII2],
  outputs: [GEOM.LPII1PII2],
  parameters: [],
  compute: (inputs) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pii2 = getGeometry(inputs, GEOM.PII2, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LPII1PII2, line(pii1.x, pii1.y, pii2.x, pii2.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPII1PII2, 0.5, store, theme);
  },
};

// Step 17: D3 circles at all 4 centers with radius = distance from pii1 to cp1
const STEP_17: SixFoldV0Step = {
  id: "step17",
  inputs: [GEOM.CP1, GEOM.CP2, GEOM.CP3, GEOM.CP4, GEOM.PII1],
  outputs: [GEOM.C1_D3, GEOM.C2_D3, GEOM.C3_D3, GEOM.C4_D3],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    let d3 = distance(pii1, cp1);
    // Ensure minimum radius to avoid degenerate circles
    if (!isValidNumber(d3) || d3 <= 0) {
      d3 = cp1.x !== cp2.x ? distance(cp1, cp2) / 2 : 1;
    }
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.C1_D3, circle(cp1.x, cp1.y, d3));
    m.set(GEOM.C2_D3, circle(cp2.x, cp2.y, d3));
    m.set(GEOM.C3_D3, circle(cp3.x, cp3.y, d3));
    m.set(GEOM.C4_D3, circle(cp4.x, cp4.y, d3));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3_D3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4_D3, 0.5, store, theme);
  },
};

// Step 18: Lines from cp2 to pic14 and cp4 to pic12
const STEP_18: SixFoldV0Step = {
  id: "step18",
  inputs: [GEOM.CP2, GEOM.PIC14, GEOM.CP4, GEOM.PIC12],
  outputs: [GEOM.LCP2PIC14, GEOM.LCP4PIC12],
  parameters: [],
  compute: (inputs) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.LCP2PIC14, line(cp2.x, cp2.y, pic14.x, pic14.y));
    m.set(GEOM.LCP4PIC12, line(cp4.x, cp4.y, pic12.x, pic12.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP2PIC14, 0.5, store, theme);
    drawLine(svg, values, GEOM.LCP4PIC12, 0.5, store, theme);
  },
};

// Step 19: lpii1pi4, pic4, outline1
const STEP_19: SixFoldV0Step = {
  id: "step19",
  inputs: [GEOM.PII1, GEOM.PI4, GEOM.LCP4PIC12],
  outputs: [GEOM.PIC4, GEOM.OUTLINE1],
  parameters: [],
  compute: (inputs) => {
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
    const pic4 =
      pic4Result && pic4Result.length >= 2 ? validPoint(pic4Result[0], pic4Result[1]) : null;

    // outline1 = line from pii1 to pic4
    const outline1 = pic4 ? line(pii1.x, pii1.y, pic4.x, pic4.y) : null;

    const m = new Map<string, GeometryValue>();
    if (pic4) m.set(GEOM.PIC4, pic4);
    if (outline1) m.set(GEOM.OUTLINE1, outline1);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC4, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE1, 2.0, store, theme);
  },
};

// Step 20: pii1, pic2, outline2
const STEP_20: SixFoldV0Step = {
  id: "step20",
  inputs: [GEOM.PII1, GEOM.PII2, GEOM.LCP2PIC14],
  outputs: [GEOM.PIC2, GEOM.OUTLINE2],
  parameters: [],
  compute: (inputs) => {
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
    const pic2 =
      pic2Result && pic2Result.length >= 2 ? validPoint(pic2Result[0], pic2Result[1]) : null;

    // outline2 = line from pii1 to pic2
    const outline2 = pic2 ? line(pii1.x, pii1.y, pic2.x, pic2.y) : null;

    const m = new Map<string, GeometryValue>();
    if (pic2) m.set(GEOM.PIC2, pic2);
    if (outline2) m.set(GEOM.OUTLINE2, outline2);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC2, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE2, 2.0, store, theme);
  },
};

// Step 21: pic1w, pic34, outline3
const STEP_21: SixFoldV0Step = {
  id: "step21",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI3, GEOM.C34, GEOM.L34],
  outputs: [GEOM.PIC1W, GEOM.PIC34, GEOM.OUTLINE3],
  parameters: [],
  compute: (inputs) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi3 = getGeometry(inputs, GEOM.LCP1PI3, isLine, "Line");
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");

    // pic1w = interceptCircleLineSeg(c1_d3, lcp1pi3, 0)
    const pic1w = interceptCircleLineSegHelper(c1_d3, lcp1pi3, 0);
    if (!pic1w) throw new Error("STEP_21: pic1w is null");

    // pic34 = interceptCircleLineSeg(c34, l34, 0)
    const pic34 = interceptCircleLineSegHelper(c34, l34, 0);
    if (!pic34) throw new Error("STEP_21: pic34 is null");

    // outline3 = line from pic1w to pic34
    const outline3 = line(pic1w.x, pic1w.y, pic34.x, pic34.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC1W, pic1w);
    m.set(GEOM.PIC34, pic34);
    m.set(GEOM.OUTLINE3, outline3);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1W, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC34, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE3, 2.0, store, theme);
  },
};

// Step 22: pic1n, pic23, outline4
const STEP_22: SixFoldV0Step = {
  id: "step22",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI4, GEOM.C23, GEOM.L23],
  outputs: [GEOM.PIC1N, GEOM.PIC23, GEOM.OUTLINE4],
  parameters: [],
  compute: (inputs) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi4 = getGeometry(inputs, GEOM.LCP1PI4, isLine, "Line");
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");

    // pic1n = interceptCircleLine(c1_d3, lcp1pi4, 0)
    const pic1n = interceptCircleLineSegHelper(c1_d3, lcp1pi4, 0);

    // pic23 = interceptCircleLine(c23, l23, 1) - using index 1
    const pic23 = interceptCircleLineSegHelper(c23, l23, 1);

    if (!pic1n) throw new Error("STEP_22: pic1n is null");
    if (!pic23) throw new Error("STEP_22: pic23 is null");

    // outline4 = line from pic1n to pic23
    const outline4 = line(pic1n.x, pic1n.y, pic23.x, pic23.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PIC1N, pic1n);
    m.set(GEOM.PIC23, pic23);
    m.set(GEOM.OUTLINE4, outline4);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1N, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PIC23, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE4, 2.0, store, theme);
  },
};

// Step 23: pc1w, pc23s, outline5
const STEP_23: SixFoldV0Step = {
  id: "step23",
  inputs: [GEOM.C1_D1, GEOM.L12, GEOM.C23, GEOM.L23],
  outputs: [GEOM.PC1W, GEOM.PC23S, GEOM.OUTLINE5],
  parameters: [],
  compute: (inputs) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l12 = getGeometry(inputs, GEOM.L12, isLine, "Line");
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");

    // pc1w = interceptCircleLineSeg(c1_d1, l12, 0)
    const pc1w = interceptCircleLineSegHelper(c1_d1, l12, 0);
    if (!pc1w) throw new Error("STEP_23: pc1w is null");

    // pc23s = interceptCircleLineSeg(c23, l23, 0)
    const pc23s = interceptCircleLineSegHelper(c23, l23, 0);
    if (!pc23s) throw new Error("STEP_23: pc23s is null");

    // outline5 = line from pc1w to pc23s
    const outline5 = line(pc1w.x, pc1w.y, pc23s.x, pc23s.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC1W, pc1w);
    m.set(GEOM.PC23S, pc23s);
    m.set(GEOM.OUTLINE5, outline5);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1W, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC23S, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE5, 2.0, store, theme);
  },
};

// Step 24: pc1n, pc34e, outline6
const STEP_24: SixFoldV0Step = {
  id: "step24",
  inputs: [GEOM.C1_D1, GEOM.L41, GEOM.C34, GEOM.L34],
  outputs: [GEOM.PC1N, GEOM.PC34E, GEOM.OUTLINE6],
  parameters: [],
  compute: (inputs) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l41 = getGeometry(inputs, GEOM.L41, isLine, "Line");
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34Line = getGeometry(inputs, GEOM.L34, isLine, "Line");

    // pc1n = interceptCircleLineSeg(c1_d1, l41, 0)
    const pc1n = interceptCircleLineSegHelper(c1_d1, l41, 0);

    // pc34e = interceptCircleLineSeg(c34, l34, 1)
    const pc34e = interceptCircleLineSegHelper(c34, l34Line, 1);

    if (!pc1n) throw new Error("STEP_24: pc1n is null");
    if (!pc34e) throw new Error("STEP_24: pc34e is null");

    // outline6 = line from pc1n to pc34e
    const outline6 = line(pc1n.x, pc1n.y, pc34e.x, pc34e.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC1N, pc1n);
    m.set(GEOM.PC34E, pc34e);
    m.set(GEOM.OUTLINE6, outline6);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1N, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC34E, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE6, 2.0, store, theme);
  },
};

// Step 25: outline7
const STEP_25: SixFoldV0Step = {
  id: "step25",
  inputs: [GEOM.PC1N, GEOM.PIC1N],
  outputs: [GEOM.OUTLINE7],
  parameters: [],
  compute: (inputs) => {
    const pc1n = getGeometry(inputs, GEOM.PC1N, isPoint, "Point");
    const pic1n = getGeometry(inputs, GEOM.PIC1N, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE7, line(pc1n.x, pc1n.y, pic1n.x, pic1n.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE7, 2.0, store, theme);
  },
};

// Step 26: outline8
const STEP_26: SixFoldV0Step = {
  id: "step26",
  inputs: [GEOM.PC1W, GEOM.PIC1W],
  outputs: [GEOM.OUTLINE8],
  parameters: [],
  compute: (inputs) => {
    const pc1w = getGeometry(inputs, GEOM.PC1W, isPoint, "Point");
    const pic1w = getGeometry(inputs, GEOM.PIC1W, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE8, line(pc1w.x, pc1w.y, pic1w.x, pic1w.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE8, 2.0, store, theme);
  },
};

// Step 27: pc3sw, pc23e, outline9
const STEP_27: SixFoldV0Step = {
  id: "step27",
  inputs: [GEOM.C3_D3, GEOM.L13, GEOM.C23, GEOM.CP1],
  outputs: [GEOM.PC3SW, GEOM.PC23E, GEOM.OUTLINE9],
  parameters: [],
  compute: (inputs) => {
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

    // outline9 = line from pc3sw to pc23e
    const outline9 = pc3sw && pc23e ? line(pc3sw.x, pc3sw.y, pc23e.x, pc23e.y) : null;

    const m = new Map<string, GeometryValue>();
    if (pc3sw) m.set(GEOM.PC3SW, pc3sw);
    if (pc23e) m.set(GEOM.PC23E, pc23e);
    if (outline9) m.set(GEOM.OUTLINE9, outline9);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC3SW, 2.0, store, theme);
    drawPoint(svg, values, GEOM.PC23E, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE9, 2.0, store, theme);
  },
};

// Step 28: pc34s, outline10
const STEP_28: SixFoldV0Step = {
  id: "step28",
  inputs: [GEOM.C34, GEOM.CP1, GEOM.PC3SW],
  outputs: [GEOM.PC34S, GEOM.OUTLINE10],
  parameters: [],
  compute: (inputs) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");

    // lc34cp1 = line from c34 center to cp1
    const lc34cp1 = line(c34.cx, c34.cy, cp1.x, cp1.y);

    // pc34s = interceptCircleLineSeg(c34, lc34cp1, 0)
    const pc34s = interceptCircleLineSegHelper(c34, lc34cp1, 0);
    const pc3sw = getGeometry(inputs, GEOM.PC3SW, isPoint, "Point");
    if (!pc34s) throw new Error("STEP_28: pc34s is null");
    const outline10 = line(pc34s.x, pc34s.y, pc3sw.x, pc3sw.y);

    const m = new Map<string, GeometryValue>();
    m.set(GEOM.PC34S, pc34s);
    m.set(GEOM.OUTLINE10, outline10);
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC34S, 2.0, store, theme);
    drawLine(svg, values, GEOM.OUTLINE10, 2.0, store, theme);
  },
};

// Step 30: outline12 (symmetric to outline11, closer to cp2)
const STEP_30: SixFoldV0Step = {
  id: "step30",
  inputs: [GEOM.PC23S, GEOM.PC23E],
  outputs: [GEOM.OUTLINE12],
  parameters: [],
  compute: (inputs) => {
    const pc23s = getGeometry(inputs, GEOM.PC23S, isPoint, "Point");
    const pc23e = getGeometry(inputs, GEOM.PC23E, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE12, line(pc23s.x, pc23s.y, pc23e.x, pc23e.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE12, 2.0, store, theme);
  },
};

// Step 31: outline13 (cp4 to pic4)
const STEP_31: SixFoldV0Step = {
  id: "step31",
  inputs: [GEOM.CP4, GEOM.PIC4],
  outputs: [GEOM.OUTLINE13],
  parameters: [],
  compute: (inputs) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic4 = getGeometry(inputs, GEOM.PIC4, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    if (pic4) m.set(GEOM.OUTLINE13, line(cp4.x, cp4.y, pic4.x, pic4.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE13, 2.0, store, theme);
  },
};

// Step 32: outline14 (cp2 to pic2)
const STEP_32: SixFoldV0Step = {
  id: "step32",
  inputs: [GEOM.CP2, GEOM.PIC2],
  outputs: [GEOM.OUTLINE14],
  parameters: [],
  compute: (inputs) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic2 = getGeometry(inputs, GEOM.PIC2, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    if (pic2) m.set(GEOM.OUTLINE14, line(cp2.x, cp2.y, pic2.x, pic2.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE14, 2.0, store, theme);
  },
};

// Step 29: outline11
const STEP_29: SixFoldV0Step = {
  id: "step29",
  inputs: [GEOM.PC34E, GEOM.PC34S],
  outputs: [GEOM.OUTLINE11],
  parameters: [],
  compute: (inputs) => {
    const pc34e = getGeometry(inputs, GEOM.PC34E, isPoint, "Point");
    const pc34s = getGeometry(inputs, GEOM.PC34S, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE11, line(pc34e.x, pc34e.y, pc34s.x, pc34s.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE11, 2.0, store, theme);
  },
};

// Step 33: Outline15 - line from cp2 to cp1
const STEP_33: SixFoldV0Step = {
  id: "step33",
  inputs: [GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.OUTLINE15],
  parameters: [],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE15, line(cp2.x, cp2.y, cp1.x, cp1.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE15, 2.0, store, theme);
  },
};

// Step 34: Outline16 - line from cp2 to cp3
const STEP_34: SixFoldV0Step = {
  id: "step34",
  inputs: [GEOM.CP2, GEOM.CP3],
  outputs: [GEOM.OUTLINE16],
  parameters: [],
  compute: (inputs) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE16, line(cp2.x, cp2.y, cp3.x, cp3.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE16, 2.0, store, theme);
  },
};

// Step 35: Outline17 - line from cp3 to cp4
const STEP_35: SixFoldV0Step = {
  id: "step35",
  inputs: [GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.OUTLINE17],
  parameters: [],
  compute: (inputs) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE17, line(cp3.x, cp3.y, cp4.x, cp4.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE17, 2.0, store, theme);
  },
};

// Step 36: Outline18 - line from cp4 to cp1
const STEP_36: SixFoldV0Step = {
  id: "step36",
  inputs: [GEOM.CP4, GEOM.CP1],
  outputs: [GEOM.OUTLINE18],
  parameters: [],
  compute: (inputs) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const m = new Map<string, GeometryValue>();
    m.set(GEOM.OUTLINE18, line(cp4.x, cp4.y, cp1.x, cp1.y));
    return m;
  },
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE18, 2.0, store, theme);
  },
};

/** All steps in order */
export const SIX_FOLD_V0_STEPS: readonly SixFoldV0Step[] = [
  STEP_1,
  STEP_2,
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
  STEP_36,
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
