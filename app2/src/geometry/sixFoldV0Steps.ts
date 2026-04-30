/**
 * SixFoldV0 geometric construction - Step definitions
 * Replicates "1/4 Six fold pattern v3" from Svelte app.
 */

import type { GeometryValue } from "../types/geometry";
import { point, line, circle, isPoint, isLine, isCircle } from "../types/geometry";
import { directions, lineIntersect } from "@sg/geometry";
import type { StepExecutionContext } from "../types/geometry";
import { drawPoint, drawLine, drawCircle } from "../svgElements";
import { getGeometry, GEOM, computeSingle } from "./sixFold/operations";
import type { SixFoldV0Config, SixFoldV0Step } from "./sixFold/operations";
import {
  distance,
  isValidNumber,
  validPoint,
  bisectCircleAndPoint,
  circlesIntersectionPointHelper,
  interceptCircleLineSegHelper,
  interceptCircleLineDirHelper,
} from "../geometry/constructors";

/**
 * Step 1A: Main line
 * Creates the base horizontal line.
 * Uses SVG config coordinates (lx1, ly1, lx2, ly2) as parameters.
 */
const STEP_1A: SixFoldV0Step = {
  id: "step1a",
  inputs: [],
  outputs: [GEOM.LINE1],
  parameters: ["lx1", "ly1", "lx2", "ly2"],
  compute: computeSingle(GEOM.LINE1, (_inputs, config) => {
    return line(config.lx1, config.ly1, config.lx2, config.ly2);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LINE1, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 1B: Point P1
 * Creates the first endpoint point of LINE1.
 */
const STEP_1B: SixFoldV0Step = {
  id: "step1b",
  inputs: [],
  outputs: [GEOM.P1],
  parameters: ["lx1", "ly1"],
  compute: computeSingle(GEOM.P1, (_inputs, config) => {
    return point(config.lx1, config.ly1);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P1, 2.0, store, theme);
  },
};

/**
 * Step 1C: Point P2
 * Creates the second endpoint point of LINE1.
 */
const STEP_1C: SixFoldV0Step = {
  id: "step1c",
  inputs: [],
  outputs: [GEOM.P2],
  parameters: ["lx2", "ly2"],
  compute: computeSingle(GEOM.P2, (_inputs, config) => {
    return point(config.lx2, config.ly2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P2, 2.0, store, theme);
  },
};

/**
 * Step 2A1: Create CP1
 * Creates the first circle center (cp1) on LINE1.
 */
const STEP_2A1: SixFoldV0Step = {
  id: "step2a1",
  inputs: [GEOM.LINE1],
  outputs: [GEOM.CP1],
  parameters: ["cp1OffsetRatio"],
  compute: computeSingle(GEOM.CP1, (inputs, config) => {
    // Get line from step 1
    const line1 = getGeometry(inputs, GEOM.LINE1, isLine, "Line");

    // Use line coordinates
    const lx1 = line1.x1;
    const ly1 = line1.y1;
    const lx2 = line1.x2;

    // Calculate cp1 position using ratio
    const lineLength = lx2 - lx1;
    const cx1 = lx1 + lineLength * config.cp1OffsetRatio;
    const cy1 = ly1;

    // Create circle center cp1
    return point(cx1, cy1);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP1, 2.0, store, theme);
  },
};

/**
 * Step 2A2: Create C1
 * Creates the first circle (c1) centered at CP1.
 */
const STEP_2A2: SixFoldV0Step = {
  id: "step2a2",
  inputs: [GEOM.CP1],
  outputs: [GEOM.C1],
  parameters: ["radius"],
  compute: computeSingle(GEOM.C1, (inputs, config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    return circle(cp1.x, cp1.y, config.radius);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1, 0.5, store, theme);
  },
};

/**
 * Step 2B: Create CP2 as intersection of C1 and LINE1
 * Finds CP2 where C1 intersects LINE1 (leftmost point).
 */
const STEP_2B: SixFoldV0Step = {
  id: "step2b",
  inputs: [GEOM.C1, GEOM.LINE1],
  outputs: [GEOM.CP2],
  parameters: [],
  compute: computeSingle(GEOM.CP2, (inputs, _config) => {
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const line1 = getGeometry(inputs, GEOM.LINE1, isLine, "Line");

    // Find leftmost intersection of C1 with LINE1
    const cp2 = interceptCircleLineDirHelper(c1, line1, directions.left);
    if (!cp2) {
      throw new Error("STEP_2B: C1 and LINE1 do not intersect");
    }
    return cp2;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP2, 2.0, store, theme);
  },
};

/**
 * Step 2C: Create C2 at CP2
 * Creates the second circle (c2) centered at CP2 with same radius.
 */
const STEP_2C: SixFoldV0Step = {
  id: "step2c",
  inputs: [GEOM.CP2],
  outputs: [GEOM.C2],
  parameters: ["radius"],
  compute: computeSingle(GEOM.C2, (inputs, config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    return circle(cp2.x, cp2.y, config.radius);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C2, 0.5, store, theme);
  },
};

/**
 * Step 2D1: Intersection point PIC12
 * Finds the intersection point of c1 and c2 (top point).
 */
const STEP_2D1: SixFoldV0Step = {
  id: "step2d1",
  inputs: [GEOM.C1, GEOM.C2],
  outputs: [GEOM.PIC12],
  parameters: [],
  compute: computeSingle(GEOM.PIC12, (inputs, _config) => {
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");

    // Find px, py = intersection point of c1 and c2 circles (top point)
    const pxPy = circlesIntersectionPointHelper(c1, c2, directions.up);
    if (!pxPy) {
      throw new Error(
        "STEP_2D1: circlesIntersectionPointHelper(c1, c2, up) returned null - circles do not intersect",
      );
    }
    return pxPy;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC12, 2.0, store, theme);
  },
};

/**
 * Step 2D2: Circle at PIC12
 * Creates circle at PIC12 with the configured radius.
 */
const STEP_2D2: SixFoldV0Step = {
  id: "step2d2",
  inputs: [GEOM.PIC12],
  outputs: [GEOM.CPIC12],
  parameters: ["radius"],
  compute: computeSingle(GEOM.CPIC12, (inputs, config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    // Create circle at PIC12 with same radius
    return circle(pic12.x, pic12.y, config.radius);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.CPIC12, 0.5, store, theme);
  },
};

/**
 * Step 2E1: Bisected point P3
 * Computes p3 by bisecting from cPic12 through cp2.
 */
const STEP_2E1: SixFoldV0Step = {
  id: "step2e1",
  inputs: [GEOM.CPIC12, GEOM.CP2],
  outputs: [GEOM.P3],
  parameters: [],
  compute: computeSingle(GEOM.P3, (inputs, _config) => {
    const cPic12 = getGeometry(inputs, GEOM.CPIC12, isCircle, "Circle");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    // p3 = bisect from cPic12 through cp2
    return bisectCircleAndPoint(cPic12, cp2);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P3, 2.0, store, theme);
  },
};

/**
 * Step 2E2: Bisected point P4
 * Computes p4 by bisecting from cPic12 through cp1.
 */
const STEP_2E2: SixFoldV0Step = {
  id: "step2e2",
  inputs: [GEOM.CPIC12, GEOM.CP1],
  outputs: [GEOM.P4],
  parameters: [],
  compute: computeSingle(GEOM.P4, (inputs, _config) => {
    const cPic12 = getGeometry(inputs, GEOM.CPIC12, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    // p4 = bisect from cPic12 through cp1
    return bisectCircleAndPoint(cPic12, cp1);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.P4, 2.0, store, theme);
  },
};

/**
 * Step 2F: Create line L13
 * Creates temporary connecting line from CP1 to P3.
 * Note: This is different from the crossing line LCP1CP3 in STEP_6 (CP1→CP3).
 */
const STEP_2F: SixFoldV0Step = {
  id: "step2f",
  inputs: [GEOM.CP1, GEOM.P3],
  outputs: [GEOM.L13],
  parameters: [],
  compute: computeSingle(GEOM.L13, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const p3 = getGeometry(inputs, GEOM.P3, isPoint, "Point");
    // L13 = line from CP1 to P3
    return line(cp1.x, cp1.y, p3.x, p3.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L13, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 2G: Create line L24
 * Creates temporary connecting line from CP2 to P4.
 * Note: This is different from the crossing line LCP2CP4 in STEP_6 (CP2→CP4).
 */
const STEP_2G: SixFoldV0Step = {
  id: "step2g",
  inputs: [GEOM.CP2, GEOM.P4],
  outputs: [GEOM.L24],
  parameters: [],
  compute: computeSingle(GEOM.L24, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const p4 = getGeometry(inputs, GEOM.P4, isPoint, "Point");
    // L24 = line from CP2 to P4
    return line(cp2.x, cp2.y, p4.x, p4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L24, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 2H: Find CP4
 * Finds CP4 as intersection of C1 with L13.
 */
const STEP_2H: SixFoldV0Step = {
  id: "step2h",
  inputs: [GEOM.C1, GEOM.L13],
  outputs: [GEOM.CP4],
  parameters: [],
  compute: computeSingle(GEOM.CP4, (inputs, _config) => {
    const circle1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const l13 = getGeometry(inputs, GEOM.L13, isLine, "Line");
    // cp4 = intersection of circle1 with l13 line
    const cp4Pt = interceptCircleLineSegHelper(circle1, l13, 0);
    if (!cp4Pt) {
      throw new Error("STEP_2H: Failed to find circle intersection for cp4 center");
    }
    return cp4Pt;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP4, 2.0, store, theme);
  },
};

/**
 * Step 2I: Find CP3
 * Finds CP3 as intersection of C2 with L24.
 */
const STEP_2I: SixFoldV0Step = {
  id: "step2i",
  inputs: [GEOM.C2, GEOM.L24],
  outputs: [GEOM.CP3],
  parameters: [],
  compute: computeSingle(GEOM.CP3, (inputs, _config) => {
    const circle2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");
    const l24 = getGeometry(inputs, GEOM.L24, isLine, "Line");
    // cp3 = intersection of circle2 with l24 line
    const cp3Pt = interceptCircleLineSegHelper(circle2, l24, 0);
    if (!cp3Pt) {
      throw new Error("STEP_2I: Failed to find circle intersection for cp3 center");
    }
    return cp3Pt;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP3, 2.0, store, theme);
  },
};

/**
 * Step 2J: Create circle C4
 * Creates circle at CP4 with the configured radius.
 */
const STEP_2J: SixFoldV0Step = {
  id: "step2j",
  inputs: [GEOM.CP4],
  outputs: [GEOM.C4],
  parameters: ["radius"],
  compute: computeSingle(GEOM.C4, (inputs, config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    return circle(cp4.x, cp4.y, config.radius);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C4, 0.5, store, theme);
  },
};

/**
 * Step 2K: Create circle C3
 * Creates circle at CP3 with the configured radius.
 */
const STEP_2K: SixFoldV0Step = {
  id: "step2k",
  inputs: [GEOM.CP3],
  outputs: [GEOM.C3],
  parameters: ["radius"],
  compute: computeSingle(GEOM.C3, (inputs, config) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    return circle(cp3.x, cp3.y, config.radius);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C3, 0.5, store, theme);
  },
};

/**
 * Step 3A: Line L12
 * Draws connecting line between cp2 and cp1.
 */
const STEP_3A: SixFoldV0Step = {
  id: "step3a",
  inputs: [GEOM.CP1, GEOM.CP2],
  outputs: [GEOM.L12],
  parameters: [],
  compute: computeSingle(GEOM.L12, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    return line(cp2.x, cp2.y, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L12, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 3B: Line L23
 * Draws connecting line between cp2 and cp3.
 */
const STEP_3B: SixFoldV0Step = {
  id: "step3b",
  inputs: [GEOM.CP2, GEOM.CP3],
  outputs: [GEOM.L23],
  parameters: [],
  compute: computeSingle(GEOM.L23, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    return line(cp2.x, cp2.y, cp3.x, cp3.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L23, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 3C: Line L34
 * Draws connecting line between cp3 and cp4.
 */
const STEP_3C: SixFoldV0Step = {
  id: "step3c",
  inputs: [GEOM.CP3, GEOM.CP4],
  outputs: [GEOM.L34],
  parameters: [],
  compute: computeSingle(GEOM.L34, (inputs, _config) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    return line(cp3.x, cp3.y, cp4.x, cp4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L34, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 3D: Line L41
 * Draws connecting line between cp4 and cp1, completing the quadrilateral.
 */
const STEP_3D: SixFoldV0Step = {
  id: "step3d",
  inputs: [GEOM.CP4, GEOM.CP1],
  outputs: [GEOM.L41],
  parameters: [],
  compute: computeSingle(GEOM.L41, (inputs, _config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    return line(cp4.x, cp4.y, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L41, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 4A: Intersection point PIC12
 * Finds intersection point of circles c1 and c2 (direction: up).
 */
const STEP_4A: SixFoldV0Step = {
  id: "step4a",
  inputs: [GEOM.C1, GEOM.C2],
  outputs: [GEOM.PIC12],
  parameters: [],
  compute: computeSingle(GEOM.PIC12, (inputs, _config) => {
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const c2 = getGeometry(inputs, GEOM.C2, isCircle, "Circle");
    const pic12 = circlesIntersectionPointHelper(c1, c2, directions.up);
    if (!pic12) throw new Error("STEP_4A: pic12 is null - circles do not intersect");
    return pic12;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC12, 2.0, store, theme);
  },
};

/**
 * Step 4B: Intersection point PIC14
 * Finds intersection point of circles c4 and c1 (direction: left).
 */
const STEP_4B: SixFoldV0Step = {
  id: "step4b",
  inputs: [GEOM.C4, GEOM.C1],
  outputs: [GEOM.PIC14],
  parameters: [],
  compute: computeSingle(GEOM.PIC14, (inputs, _config) => {
    const c4 = getGeometry(inputs, GEOM.C4, isCircle, "Circle");
    const c1 = getGeometry(inputs, GEOM.C1, isCircle, "Circle");
    const pic14 = circlesIntersectionPointHelper(c4, c1, directions.left);
    if (!pic14) throw new Error("STEP_4B: pic14 is null - circles do not intersect");
    return pic14;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC14, 2.0, store, theme);
  },
};

/**
 * Step 5A: Line LPIC12
 * Draws line from circle center cp1 to intersection point pic12.
 */
const STEP_5A: SixFoldV0Step = {
  id: "step5a",
  inputs: [GEOM.CP1, GEOM.PIC12],
  outputs: [GEOM.LPIC12],
  parameters: [],
  compute: computeSingle(GEOM.LPIC12, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    return line(cp1.x, cp1.y, pic12.x, pic12.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPIC12, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 5B: Line LPIC14
 * Draws line from circle center cp1 to intersection point pic14.
 */
const STEP_5B: SixFoldV0Step = {
  id: "step5b",
  inputs: [GEOM.CP1, GEOM.PIC14],
  outputs: [GEOM.LPIC14],
  parameters: [],
  compute: computeSingle(GEOM.LPIC14, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    return line(cp1.x, cp1.y, pic14.x, pic14.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPIC14, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 6A: Line LCP1CP3
 * Draws diagonal line connecting opposite circle centers cp1 and cp3.
 */
const STEP_6A: SixFoldV0Step = {
  id: "step6a",
  inputs: [GEOM.CP1, GEOM.CP3],
  outputs: [GEOM.LCP1CP3],
  parameters: [],
  compute: computeSingle(GEOM.LCP1CP3, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    return line(cp1.x, cp1.y, cp3.x, cp3.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP1CP3, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 6B: Line LCP2CP4
 * Draws diagonal line connecting opposite circle centers cp2 and cp4.
 */
const STEP_6B: SixFoldV0Step = {
  id: "step6b",
  inputs: [GEOM.CP2, GEOM.CP4],
  outputs: [GEOM.LCP2CP4],
  parameters: [],
  compute: computeSingle(GEOM.LCP2CP4, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    return line(cp2.x, cp2.y, cp4.x, cp4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP2CP4, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 6C: Intersection point PI2
 * Computes pi2 as the intersection point of lines lcp1cp3 and lcp2cp4.
 */
const STEP_6C: SixFoldV0Step = {
  id: "step6c",
  inputs: [GEOM.LCP1CP3, GEOM.LCP2CP4],
  outputs: [GEOM.PI2],
  parameters: [],
  compute: computeSingle(GEOM.PI2, (inputs, _config) => {
    const lcp1cp3 = getGeometry(inputs, GEOM.LCP1CP3, isLine, "Line");
    const lcp2cp4 = getGeometry(inputs, GEOM.LCP2CP4, isLine, "Line");
    const pi2Result = lineIntersect(
      lcp1cp3.x1,
      lcp1cp3.y1,
      lcp1cp3.x2,
      lcp1cp3.y2,
      lcp2cp4.x1,
      lcp2cp4.y1,
      lcp2cp4.x2,
      lcp2cp4.y2,
    );
    if (!pi2Result) {
      throw new Error("STEP_6C: lineIntersect returned null - lines lcp1cp3 and lcp2cp4 do not intersect");
    }
    const pi2 = validPoint(pi2Result[0], pi2Result[1]);
    if (!pi2) {
      throw new Error("STEP_6C: validPoint returned null - intersection coordinates are invalid");
    }
    return pi2;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PI2, 2.0, store, theme);
  },
};

/**
 * Step 7A: Circle C1_D1
 * Creates circle centered at cp1 with radius d1 (distance from pic14 to pi2).
 */
const STEP_7A: SixFoldV0Step = {
  id: "step7a",
  inputs: [GEOM.CP1, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C1_D1],
  parameters: [],
  compute: computeSingle(GEOM.C1_D1, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(cp1.x, cp1.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D1, 0.5, store, theme);
  },
};

/**
 * Step 7B: Circle C2_D1
 * Creates circle centered at cp2 with radius d1 (distance from pic14 to pi2).
 */
const STEP_7B: SixFoldV0Step = {
  id: "step7b",
  inputs: [GEOM.CP2, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C2_D1],
  parameters: [],
  compute: computeSingle(GEOM.C2_D1, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(cp2.x, cp2.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C2_D1, 0.5, store, theme);
  },
};

/**
 * Step 7C: Circle C3_D1
 * Creates circle centered at cp3 with radius d1 (distance from pic14 to pi2).
 */
const STEP_7C: SixFoldV0Step = {
  id: "step7c",
  inputs: [GEOM.CP3, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C3_D1],
  parameters: [],
  compute: computeSingle(GEOM.C3_D1, (inputs, _config) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(cp3.x, cp3.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C3_D1, 0.5, store, theme);
  },
};

/**
 * Step 7D: Circle C4_D1
 * Creates circle centered at cp4 with radius d1 (distance from pic14 to pi2).
 */
const STEP_7D: SixFoldV0Step = {
  id: "step7d",
  inputs: [GEOM.CP4, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C4_D1],
  parameters: [],
  compute: computeSingle(GEOM.C4_D1, (inputs, _config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(cp4.x, cp4.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C4_D1, 0.5, store, theme);
  },
};

/**
 * Step 8: Circles at pic14 and pic12 with radius d1
 * Creates circles centered at pic12 and pic14 with radius d1 (distance from pic14 to pi2).
 */
/**
 * Step 8A: Circle C14_D1
 * Creates circle centered at pic14 with radius d1 (distance from pic14 to pi2).
 */
const STEP_8A: SixFoldV0Step = {
  id: "step8a",
  inputs: [GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C14_D1],
  parameters: [],
  compute: computeSingle(GEOM.C14_D1, (inputs, _config) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(pic14.x, pic14.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C14_D1, 0.5, store, theme);
  },
};

/**
 * Step 8B: Circle C12_D1
 * Creates circle centered at pic12 with radius d1 (distance from pic14 to pi2).
 */
const STEP_8B: SixFoldV0Step = {
  id: "step8b",
  inputs: [GEOM.PIC12, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C12_D1],
  parameters: [],
  compute: computeSingle(GEOM.C12_D1, (inputs, _config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    const d1 = distance(pic14, pi2);
    return circle(pic12.x, pic12.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C12_D1, 0.5, store, theme);
  },
};

/**
 * Step 9: pi3 and pi4 intersection points
 * pi3 = circlesIntersectionPoint(c14_d1, c2_d1, directions.right)
 * pi4 = circlesIntersectionPoint(c12_d1, c4_d1, directions.right)
 */
/**
 * Step 9A: Intersection point PI3
 * pi3 = circlesIntersectionPoint(c14_d1, c2_d1, directions.right)
 */
const STEP_9A: SixFoldV0Step = {
  id: "step9a",
  inputs: [GEOM.C14_D1, GEOM.C2_D1],
  outputs: [GEOM.PI3],
  parameters: [],
  compute: computeSingle(GEOM.PI3, (inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");
    const pi3 = circlesIntersectionPointHelper(c14_d1, c2_d1, directions.right);
    if (!pi3) throw new Error("STEP_9A: pi3 is null - circles do not intersect");
    return pi3;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PI3, 2.0, store, theme);
  },
};

/**
 * Step 9B: Intersection point PI4
 * pi4 = circlesIntersectionPoint(c12_d1, c4_d1, directions.right)
 */
const STEP_9B: SixFoldV0Step = {
  id: "step9b",
  inputs: [GEOM.C12_D1, GEOM.C4_D1],
  outputs: [GEOM.PI4],
  parameters: [],
  compute: computeSingle(GEOM.PI4, (inputs, _config) => {
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");
    const pi4 = circlesIntersectionPointHelper(c12_d1, c4_d1, directions.right);
    if (!pi4) throw new Error("STEP_9B: pi4 is null - circles do not intersect");
    return pi4;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PI4, 2.0, store, theme);
  },
};

/**
 * Step 10: Lines from cp1 to pi3 and pi4
 * Draws lines from circle center cp1 to intersection points pi3 and pi4.
 */
/**
 * Step 10A: Line LCP1PI3
 * Draws line from circle center cp1 to intersection point pi3.
 */
const STEP_10A: SixFoldV0Step = {
  id: "step10a",
  inputs: [GEOM.CP1, GEOM.PI3],
  outputs: [GEOM.LCP1PI3],
  parameters: [],
  compute: computeSingle(GEOM.LCP1PI3, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    return line(cp1.x, cp1.y, pi3.x, pi3.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP1PI3, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 10B: Line LCP1PI4
 * Draws line from circle center cp1 to intersection point pi4.
 */
const STEP_10B: SixFoldV0Step = {
  id: "step10b",
  inputs: [GEOM.CP1, GEOM.PI4],
  outputs: [GEOM.LCP1PI4],
  parameters: [],
  compute: computeSingle(GEOM.LCP1PI4, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pi4 = getGeometry(inputs, GEOM.PI4, isPoint, "Point");
    return line(cp1.x, cp1.y, pi4.x, pi4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP1PI4, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 11: prx5 and prx6 points
 * prx5 = interceptCircleLineSeg(c14_d1 center, lpic14 line)
 * prx6 = interceptCircleLineSeg(c12_d1 center, lpic12 line)
 */
/**
 * Step 11A: Point PRX5
 * prx5 = interceptCircleLineSeg(c14_d1, lpic14, 0)
 */
const STEP_11A: SixFoldV0Step = {
  id: "step11a",
  inputs: [GEOM.C14_D1, GEOM.LPIC14],
  outputs: [GEOM.PRX5],
  parameters: [],
  compute: computeSingle(GEOM.PRX5, (inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    const prx5 = interceptCircleLineSegHelper(c14_d1, lpic14, 0);
    if (!prx5) throw new Error("STEP_11A: prx5 is null - circle-line intersection not found");
    return prx5;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PRX5, 2.0, store, theme);
  },
};

/**
 * Step 11B: Point PRX6
 * prx6 = interceptCircleLineSeg(c12_d1, lpic12, 0)
 */
const STEP_11B: SixFoldV0Step = {
  id: "step11b",
  inputs: [GEOM.C12_D1, GEOM.LPIC12],
  outputs: [GEOM.PRX6],
  parameters: [],
  compute: computeSingle(GEOM.PRX6, (inputs, _config) => {
    const c12_d1 = getGeometry(inputs, GEOM.C12_D1, isCircle, "Circle");
    const lpic12 = getGeometry(inputs, GEOM.LPIC12, isLine, "Line");
    const prx6 = interceptCircleLineSegHelper(c12_d1, lpic12, 0);
    if (!prx6) throw new Error("STEP_11B: prx6 is null - circle-line intersection not found");
    return prx6;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PRX6, 2.0, store, theme);
  },
};

/**
 * Step 12A: c23w point
 * c23w = bisectCircleAndPoint(c14_d1, prx5)
 */
const STEP_12A: SixFoldV0Step = {
  id: "step12a",
  inputs: [GEOM.C14_D1, GEOM.PRX5],
  outputs: [GEOM.C23W],
  parameters: [],
  compute: computeSingle(GEOM.C23W, (inputs, _config) => {
    const c14_d1 = getGeometry(inputs, GEOM.C14_D1, isCircle, "Circle");
    const prx5 = getGeometry(inputs, GEOM.PRX5, isPoint, "Point");
    // c23w = bisect from c14_d1 center through prx5
    return bisectCircleAndPoint(c14_d1, prx5);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C23W, 2.0, store, theme);
  },
};

/**
 * Step 12B: l14p line
 * l14p = line from pic14 to c23w
 */
const STEP_12B: SixFoldV0Step = {
  id: "step12b",
  inputs: [GEOM.PIC14, GEOM.C23W],
  outputs: [GEOM.L14P],
  parameters: [],
  compute: computeSingle(GEOM.L14P, (inputs, _config) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const c23w = getGeometry(inputs, GEOM.C23W, isPoint, "Point");
    // l14p = line from pic14 to c23w
    return line(pic14.x, pic14.y, c23w.x, c23w.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L14P, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 12C: pc23 point
 * pc23 = linesIntersection(l23, l14p)
 */
const STEP_12C: SixFoldV0Step = {
  id: "step12c",
  inputs: [GEOM.L23, GEOM.L14P],
  outputs: [GEOM.PC23],
  parameters: [],
  compute: computeSingle(GEOM.PC23, (inputs, _config) => {
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");
    const l14p = getGeometry(inputs, GEOM.L14P, isLine, "Line");
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
      throw new Error("STEP_12C: lineIntersect returned null - lines l23 and l14p do not intersect");
    }
    const pc23Pt = validPoint(pc23Result[0], pc23Result[1]);
    if (!pc23Pt) {
      throw new Error("STEP_12C: validPoint returned null - pc23Pt coordinates are invalid");
    }
    return pc23Pt;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC23, 2.0, store, theme);
  },
};

/**
 * Step 12D: c23s point
 * line = line from pc23 to cp2
 * c23s = interceptCircleLine(c2_d1, line, 0)
 */
const STEP_12D: SixFoldV0Step = {
  id: "step12d",
  inputs: [GEOM.C2_D1, GEOM.PC23, GEOM.CP2],
  outputs: [GEOM.C23S],
  parameters: [],
  compute: computeSingle(GEOM.C23S, (inputs, _config) => {
    const c2_d1 = getGeometry(inputs, GEOM.C2_D1, isCircle, "Circle");
    const pc23 = getGeometry(inputs, GEOM.PC23, isPoint, "Point");
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");

    // line from pc23 to cp2
    const lineToCp2 = line(pc23.x, pc23.y, cp2.x, cp2.y);

    // c23s = interceptCircleLine(c2_d1, line, 0) - first intersection point
    const c23s = interceptCircleLineSegHelper(c2_d1, lineToCp2, 0);
    if (!c23s) throw new Error("STEP_12D: c23s is null");
    return c23s;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C23S, 2.0, store, theme);
  },
};

/**
 * Step 12E: c23 circle
 * d2 = distance from pc23 to c23s
 * c23 = new Circle(pc23, d2)
 */
const STEP_12E: SixFoldV0Step = {
  id: "step12e",
  inputs: [GEOM.PC23, GEOM.C23S],
  outputs: [GEOM.C23],
  parameters: [],
  compute: computeSingle(GEOM.C23, (inputs, _config) => {
    const pc23 = getGeometry(inputs, GEOM.PC23, isPoint, "Point");
    const c23s = getGeometry(inputs, GEOM.C23S, isPoint, "Point");

    // d2 = distance from pc23 to c23s
    const d2 = distance(pc23, c23s);

    // c23 = circle at pc23 with radius d2
    return circle(pc23.x, pc23.y, d2);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C23, 0.5, store, theme);
  },
};

/**
 * Step 13A: cpic12 circle
 * cpic12 = circle at pic12 with radius d1 (distance from pic14 to pi2)
 */
const STEP_13A: SixFoldV0Step = {
  id: "step13a",
  inputs: [GEOM.PIC12, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.CPI12],
  parameters: [],
  compute: computeSingle(GEOM.CPI12, (inputs, _config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    // d1 = distance from pic14 to pi2
    const d1 = distance(pic14, pi2);
    // cpic12 = circle at pic12 with radius d1
    return circle(pic12.x, pic12.y, d1);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.CPI12, 0.5, store, theme);
  },
};

/**
 * Step 13B: c34n point
 * c34n = bisectCircleAndPoint(cpic12, prx6)
 */
const STEP_13B: SixFoldV0Step = {
  id: "step13b",
  inputs: [GEOM.CPI12, GEOM.PRX6],
  outputs: [GEOM.C34N],
  parameters: [],
  compute: computeSingle(GEOM.C34N, (inputs, _config) => {
    const cpic12 = getGeometry(inputs, GEOM.CPI12, isCircle, "Circle");
    const pi6 = getGeometry(inputs, GEOM.PRX6, isPoint, "Point");
    // c34n = bisectCircleAndPoint(cpic12, pi6)
    return bisectCircleAndPoint(cpic12, pi6);
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C34N, 2.0, store, theme);
  },
};

/**
 * Step 13C: lpic12c34n line
 * lpic12c34n = line from pic12 to c34n
 */
const STEP_13C: SixFoldV0Step = {
  id: "step13c",
  inputs: [GEOM.PIC12, GEOM.C34N],
  outputs: [GEOM.LPIC12C34N],
  parameters: [],
  compute: computeSingle(GEOM.LPIC12C34N, (inputs, _config) => {
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    const c34n = getGeometry(inputs, GEOM.C34N, isPoint, "Point");
    // lpic12c34n = line from pic12 to c34n
    return line(pic12.x, pic12.y, c34n.x, c34n.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPIC12C34N, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 13D: pc34 point
 * pc34 = linesIntersection(l34, lpic12c34n)
 */
const STEP_13D: SixFoldV0Step = {
  id: "step13d",
  inputs: [GEOM.L34, GEOM.LPIC12C34N],
  outputs: [GEOM.PC34],
  parameters: [],
  compute: computeSingle(GEOM.PC34, (inputs, _config) => {
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");
    const lpic12c34n = getGeometry(inputs, GEOM.LPIC12C34N, isLine, "Line");
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
      throw new Error(
        "STEP_13D: lineIntersect returned null - lines l34 and lpic12c34n do not intersect",
      );
    }
    const pc34Pt = validPoint(pc34Result[0], pc34Result[1]);
    if (!pc34Pt) {
      throw new Error("STEP_13D: validPoint returned null - pc34Pt coordinates are invalid");
    }
    return pc34Pt;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC34, 2.0, store, theme);
  },
};

/**
 * Step 13E: c34e point
 * line = line from pc34 to cp4
 * c34e = interceptCircleLine(c4_d1, line, 0)
 */
const STEP_13E: SixFoldV0Step = {
  id: "step13e",
  inputs: [GEOM.C4_D1, GEOM.PC34, GEOM.CP4],
  outputs: [GEOM.C34E],
  parameters: [],
  compute: computeSingle(GEOM.C34E, (inputs, _config) => {
    const c4_d1 = getGeometry(inputs, GEOM.C4_D1, isCircle, "Circle");
    const pc34 = getGeometry(inputs, GEOM.PC34, isPoint, "Point");
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");

    // line from pc34 to cp4
    const lineToCp4 = line(pc34.x, pc34.y, cp4.x, cp4.y);

    // c34e = interceptCircleLine(c4_d1, line, 0) - first intersection point
    const c34e = interceptCircleLineSegHelper(c4_d1, lineToCp4, 0);
    if (!c34e) throw new Error("STEP_13E: c34e is null");
    return c34e;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C34E, 2.0, store, theme);
  },
};

/**
 * Step 13F: c34 circle
 * d2 = distance from pc34 to c34e
 * c34 = circle at pc34 with radius d2
 */
const STEP_13F: SixFoldV0Step = {
  id: "step13f",
  inputs: [GEOM.PC34, GEOM.C34E],
  outputs: [GEOM.C34],
  parameters: [],
  compute: computeSingle(GEOM.C34, (inputs, _config) => {
    const pc34 = getGeometry(inputs, GEOM.PC34, isPoint, "Point");
    const c34e = getGeometry(inputs, GEOM.C34E, isPoint, "Point");

    // d2 = distance from pc34 to c34e
    const d2 = distance(pc34, c34e);

    // c34 = circle at pc34 with radius d2
    return circle(pc34.x, pc34.y, d2);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C34, 0.5, store, theme);
  },
};

/**
 * Step 14A: pp point
 * pp = interceptCircleLineSeg(c1_d1, lpic14, 0)
 */
const STEP_14A: SixFoldV0Step = {
  id: "step14a",
  inputs: [GEOM.C1_D1, GEOM.LPIC14],
  outputs: [GEOM.PP],
  parameters: [],
  compute: computeSingle(GEOM.PP, (inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const lpic14 = getGeometry(inputs, GEOM.LPIC14, isLine, "Line");
    // pp = interceptCircleLine(c1_d1, lpic14, 0)
    const pp = interceptCircleLineSegHelper(c1_d1, lpic14, 0);
    if (!pp) throw new Error("STEP_14A: pp is null");
    return pp;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PP, 2.0, store, theme);
  },
};

/**
 * Step 14B: l1 line
 * l1 = line from pi3 to pp
 */
const STEP_14B: SixFoldV0Step = {
  id: "step14b",
  inputs: [GEOM.PI3, GEOM.PP],
  outputs: [GEOM.L1],
  parameters: [],
  compute: computeSingle(GEOM.L1, (inputs, _config) => {
    const pi3 = getGeometry(inputs, GEOM.PI3, isPoint, "Point");
    const pp = getGeometry(inputs, GEOM.PP, isPoint, "Point");
    // l1 = line from pi3 to pp
    return line(pi3.x, pi3.y, pp.x, pp.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.L1, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 14C: pii1 point
 * pii1 = intersection of l1 with lcp1cp3
 */
const STEP_14C: SixFoldV0Step = {
  id: "step14c",
  inputs: [GEOM.L1, GEOM.LCP1CP3],
  outputs: [GEOM.PII1],
  parameters: [],
  compute: computeSingle(GEOM.PII1, (inputs, _config) => {
    const l1 = getGeometry(inputs, GEOM.L1, isLine, "Line");
    const lcp1cp3 = getGeometry(inputs, GEOM.LCP1CP3, isLine, "Line");
    // pii1 = intersection of l1 with lcp1cp3
    const result1 = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, lcp1cp3.x1, lcp1cp3.y1, lcp1cp3.x2, lcp1cp3.y2);
    if (!result1) {
      throw new Error(
        "STEP_14C: lineIntersect returned null - l1 and lcp1cp3 do not intersect",
      );
    }
    const pii1 = validPoint(result1[0], result1[1]);
    if (!pii1) {
      throw new Error("STEP_14C: validPoint returned null - pii1 coordinates are invalid");
    }
    return pii1;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PII1, 2.0, store, theme);
  },
};

/**
 * Step 14D: pii2 point
 * pii2 = intersection of l1 with lcp2cp4
 */
const STEP_14D: SixFoldV0Step = {
  id: "step14d",
  inputs: [GEOM.L1, GEOM.LCP2CP4],
  outputs: [GEOM.PII2],
  parameters: [],
  compute: computeSingle(GEOM.PII2, (inputs, _config) => {
    const l1 = getGeometry(inputs, GEOM.L1, isLine, "Line");
    const lcp2cp4 = getGeometry(inputs, GEOM.LCP2CP4, isLine, "Line");
    // pii2 = intersection of l1 with lcp2cp4
    const result2 = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, lcp2cp4.x1, lcp2cp4.y1, lcp2cp4.x2, lcp2cp4.y2);
    if (!result2) {
      throw new Error(
        "STEP_14D: lineIntersect returned null - l1 and lcp2cp4 do not intersect",
      );
    }
    const pii2 = validPoint(result2[0], result2[1]);
    if (!pii2) {
      throw new Error("STEP_14D: validPoint returned null - pii2 coordinates are invalid");
    }
    return pii2;
  }),
  draw: (svg, values, store, theme) => {
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
    drawLine(svg, values, GEOM.LPII1PII2, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 16: D3 circles at all 4 centers with radius = distance from pii1 to cp1
 * Creates circles at cp1, cp2, cp3, cp4 with radius d3 (distance from pii1 to cp1).
 */
/**
 * Step 16A: Circle C1_D3
 * Creates circle centered at cp1 with radius d3 (distance from pii1 to cp1).
 */
const STEP_16A: SixFoldV0Step = {
  id: "step16a",
  inputs: [GEOM.CP1, GEOM.PII1],
  outputs: [GEOM.C1_D3],
  parameters: [],
  compute: computeSingle(GEOM.C1_D3, (inputs, _config) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const d3 = distance(pii1, cp1);
    if (!isValidNumber(d3) || d3 <= 0) {
      throw new Error("STEP_16A: Invalid d3 value - points pii1 and cp1 are coincident or invalid");
    }
    return circle(cp1.x, cp1.y, d3);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C1_D3, 0.5, store, theme);
  },
};

/**
 * Step 16B: Circle C3_D3
 * Creates circle centered at cp3 with radius d3 (distance from pii1 to cp1).
 */
const STEP_16B: SixFoldV0Step = {
  id: "step16b",
  inputs: [GEOM.CP3, GEOM.PII1, GEOM.CP1],
  outputs: [GEOM.C3_D3],
  parameters: [],
  compute: computeSingle(GEOM.C3_D3, (inputs, _config) => {
    const cp3 = getGeometry(inputs, GEOM.CP3, isPoint, "Point");
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const d3 = distance(pii1, cp1);
    if (!isValidNumber(d3) || d3 <= 0) {
      throw new Error("STEP_16B: Invalid d3 value - points pii1 and cp1 are coincident or invalid");
    }
    return circle(cp3.x, cp3.y, d3);
  }),
  draw: (svg, values, store, theme) => {
    drawCircle(svg, values, GEOM.C3_D3, 0.5, store, theme);
  },
};

/**
 * Step 17: Lines from cp2 to pic14 and cp4 to pic12
 * Draws lines connecting circle centers to intersection points.
 */
/**
 * Step 17A: Line LCP2PIC14
 * Draws line from cp2 to pic14.
 */
const STEP_17A: SixFoldV0Step = {
  id: "step17a",
  inputs: [GEOM.CP2, GEOM.PIC14],
  outputs: [GEOM.LCP2PIC14],
  parameters: [],
  compute: computeSingle(GEOM.LCP2PIC14, (inputs, _config) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint, "Point");
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    return line(cp2.x, cp2.y, pic14.x, pic14.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP2PIC14, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 17B: Line LCP4PIC12
 * Draws line from cp4 to pic12.
 */
const STEP_17B: SixFoldV0Step = {
  id: "step17b",
  inputs: [GEOM.CP4, GEOM.PIC12],
  outputs: [GEOM.LCP4PIC12],
  parameters: [],
  compute: computeSingle(GEOM.LCP4PIC12, (inputs, _config) => {
    const cp4 = getGeometry(inputs, GEOM.CP4, isPoint, "Point");
    const pic12 = getGeometry(inputs, GEOM.PIC12, isPoint, "Point");
    return line(cp4.x, cp4.y, pic12.x, pic12.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LCP4PIC12, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 18: lpii1pi4, pic4, outline1
 * lpii1pi4 = line from pii1 to pi4
 * pic4 = intersection of lpii1pi4 and lcp4pic12
 * outline1 = line from pii1 to pic4
 */
/**
 * Step 18A: Line LPII1PI4
 * lpii1pi4 = line from pii1 to pi4
 */
const STEP_18A: SixFoldV0Step = {
  id: "step18a",
  inputs: [GEOM.PII1, GEOM.PI4],
  outputs: [GEOM.LPII1PI4],
  parameters: [],
  compute: computeSingle(GEOM.LPII1PI4, (inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pi4 = getGeometry(inputs, GEOM.PI4, isPoint, "Point");
    // lpii1pi4 = line from pii1 to pi4
    return line(pii1.x, pii1.y, pi4.x, pi4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LPII1PI4, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 18B: Point PIC4
 * pic4 = intersection of lpii1pi4 and lcp4pic12
 */
const STEP_18B: SixFoldV0Step = {
  id: "step18b",
  inputs: [GEOM.LPII1PI4, GEOM.LCP4PIC12],
  outputs: [GEOM.PIC4],
  parameters: [],
  compute: computeSingle(GEOM.PIC4, (inputs, _config) => {
    const lpii1pi4 = getGeometry(inputs, GEOM.LPII1PI4, isLine, "Line");
    const lcp4pic12 = getGeometry(inputs, GEOM.LCP4PIC12, isLine, "Line");
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
      throw new Error(
        "STEP_18B: lineIntersect returned null - lines lpii1pi4 and lcp4pic12 do not intersect",
      );
    }
    const pic4 = validPoint(pic4Result[0], pic4Result[1]);
    if (!pic4) {
      throw new Error("STEP_18B: validPoint returned null - pic4 coordinates are invalid");
    }
    return pic4;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC4, 2.0, store, theme);
  },
};

/**
 * Step 18C: Outline1
 * outline1 = line from pii1 to pic4
 */
const STEP_18C: SixFoldV0Step = {
  id: "step18c",
  inputs: [GEOM.PII1, GEOM.PIC4],
  outputs: [GEOM.OUTLINE1],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE1, (inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pic4 = getGeometry(inputs, GEOM.PIC4, isPoint, "Point");
    // outline1 = line from pii1 to pic4
    return line(pii1.x, pii1.y, pic4.x, pic4.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE1, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 19: pii1, pic2, outline2
 * lpii1pii2 = line from pii1 to pii2
 * pic2 = intersection of lpii1pii2 and lcp2pic14
 * outline2 = line from pii1 to pic2
 */
/**
 * Step 19A: Point PIC2
 * pic2 = intersection of lpii1pii2 and lcp2pic14
 */
const STEP_19A: SixFoldV0Step = {
  id: "step19a",
  inputs: [GEOM.LPII1PII2, GEOM.LCP2PIC14],
  outputs: [GEOM.PIC2],
  parameters: [],
  compute: computeSingle(GEOM.PIC2, (inputs, _config) => {
    const lpii1pii2 = getGeometry(inputs, GEOM.LPII1PII2, isLine, "Line");
    const lcp2pic14 = getGeometry(inputs, GEOM.LCP2PIC14, isLine, "Line");
    // pic2 = intersection of lpii1pii2 and lcp2pic14
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
      throw new Error(
        "STEP_19A: lineIntersect returned null - lines lpii1pii2 and lcp2pic14 do not intersect",
      );
    }
    const pic2 = validPoint(pic2Result[0], pic2Result[1]);
    if (!pic2) {
      throw new Error("STEP_19A: validPoint returned null - pic2 coordinates are invalid");
    }
    return pic2;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC2, 2.0, store, theme);
  },
};

/**
 * Step 19B: Outline2
 * outline2 = line from pii1 to pic2
 */
const STEP_19B: SixFoldV0Step = {
  id: "step19b",
  inputs: [GEOM.PII1, GEOM.PIC2],
  outputs: [GEOM.OUTLINE2],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE2, (inputs, _config) => {
    const pii1 = getGeometry(inputs, GEOM.PII1, isPoint, "Point");
    const pic2 = getGeometry(inputs, GEOM.PIC2, isPoint, "Point");
    // outline2 = line from pii1 to pic2
    return line(pii1.x, pii1.y, pic2.x, pic2.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE2, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 20: pic1w, pic34, outline3
 * lpii2pic4 = line from pii2 to pic4
 * pic1w = intersection of lpii2pic4 and l14p
 * pic34 = intersection of lpii2pic4 and lpic12c34n
 * outline3 = line from pic1w to pic34
 */
/**
 * Step 20A: Point PIC1W
 * pic1w = interceptCircleLineSeg(c1_d3, lcp1pi3, 0)
 */
const STEP_20A: SixFoldV0Step = {
  id: "step20a",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI3],
  outputs: [GEOM.PIC1W],
  parameters: [],
  compute: computeSingle(GEOM.PIC1W, (inputs, _config) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi3 = getGeometry(inputs, GEOM.LCP1PI3, isLine, "Line");
    const pic1w = interceptCircleLineSegHelper(c1_d3, lcp1pi3, 0);
    if (!pic1w) throw new Error("STEP_20A: pic1w is null");
    return pic1w;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1W, 2.0, store, theme);
  },
};

/**
 * Step 20B: Point PIC34
 * pic34 = interceptCircleLineSeg(c34, l34, 0)
 */
const STEP_20B: SixFoldV0Step = {
  id: "step20b",
  inputs: [GEOM.C34, GEOM.L34],
  outputs: [GEOM.PIC34],
  parameters: [],
  compute: computeSingle(GEOM.PIC34, (inputs, _config) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34 = getGeometry(inputs, GEOM.L34, isLine, "Line");
    const pic34 = interceptCircleLineSegHelper(c34, l34, 0);
    if (!pic34) throw new Error("STEP_20B: pic34 is null");
    return pic34;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC34, 2.0, store, theme);
  },
};

/**
 * Step 20C: Outline3
 * outline3 = line from pic1w to pic34
 */
const STEP_20C: SixFoldV0Step = {
  id: "step20c",
  inputs: [GEOM.PIC1W, GEOM.PIC34],
  outputs: [GEOM.OUTLINE3],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE3, (inputs, _config) => {
    const pic1w = getGeometry(inputs, GEOM.PIC1W, isPoint, "Point");
    const pic34 = getGeometry(inputs, GEOM.PIC34, isPoint, "Point");
    return line(pic1w.x, pic1w.y, pic34.x, pic34.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE3, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 21: pic1n, pic23, outline4
 * pic1n = interceptCircleLine(c1_d3, lcp1pi4, 0)
 * pic23 = interceptCircleLine(c23, l23, 0)
 * outline4 = line from pic1n to pic23
 */
/**
 * Step 21A: Point PIC1N
 * pic1n = interceptCircleLine(c1_d3, lcp1pi4, 0)
 */
const STEP_21A: SixFoldV0Step = {
  id: "step21a",
  inputs: [GEOM.C1_D3, GEOM.LCP1PI4],
  outputs: [GEOM.PIC1N],
  parameters: [],
  compute: computeSingle(GEOM.PIC1N, (inputs, _config) => {
    const c1_d3 = getGeometry(inputs, GEOM.C1_D3, isCircle, "Circle");
    const lcp1pi4 = getGeometry(inputs, GEOM.LCP1PI4, isLine, "Line");
    const pic1n = interceptCircleLineSegHelper(c1_d3, lcp1pi4, 0);
    if (!pic1n) throw new Error("STEP_21A: pic1n is null");
    return pic1n;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC1N, 2.0, store, theme);
  },
};

/**
 * Step 21B: Point PIC23
 * pic23 = interceptCircleLine(c23, l23, 1) - using index 1
 */
const STEP_21B: SixFoldV0Step = {
  id: "step21b",
  inputs: [GEOM.C23, GEOM.L23],
  outputs: [GEOM.PIC23],
  parameters: [],
  compute: computeSingle(GEOM.PIC23, (inputs, _config) => {
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");
    const pic23 = interceptCircleLineSegHelper(c23, l23, 1);
    if (!pic23) throw new Error("STEP_21B: pic23 is null");
    return pic23;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PIC23, 2.0, store, theme);
  },
};

/**
 * Step 21C: Outline4
 * outline4 = line from pic1n to pic23
 */
const STEP_21C: SixFoldV0Step = {
  id: "step21c",
  inputs: [GEOM.PIC1N, GEOM.PIC23],
  outputs: [GEOM.OUTLINE4],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE4, (inputs, _config) => {
    const pic1n = getGeometry(inputs, GEOM.PIC1N, isPoint, "Point");
    const pic23 = getGeometry(inputs, GEOM.PIC23, isPoint, "Point");
    return line(pic1n.x, pic1n.y, pic23.x, pic23.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE4, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 22: pc1w, pc23s, outline5
 * pc1w = interceptCircleLineSeg(c1_d1, l12, 0)
 * pc23s = interceptCircleLineSeg(c23, l23, 0)
 * outline5 = line from pc1w to pc23s
 */
/**
 * Step 22A: Point PC1W
 * pc1w = interceptCircleLineSeg(c1_d1, l12, 0)
 */
const STEP_22A: SixFoldV0Step = {
  id: "step22a",
  inputs: [GEOM.C1_D1, GEOM.L12],
  outputs: [GEOM.PC1W],
  parameters: [],
  compute: computeSingle(GEOM.PC1W, (inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l12 = getGeometry(inputs, GEOM.L12, isLine, "Line");
    const pc1w = interceptCircleLineSegHelper(c1_d1, l12, 0);
    if (!pc1w) throw new Error("STEP_22A: pc1w is null");
    return pc1w;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1W, 2.0, store, theme);
  },
};

/**
 * Step 22B: Point PC23S
 * pc23s = interceptCircleLineSeg(c23, l23, 0)
 */
const STEP_22B: SixFoldV0Step = {
  id: "step22b",
  inputs: [GEOM.C23, GEOM.L23],
  outputs: [GEOM.PC23S],
  parameters: [],
  compute: computeSingle(GEOM.PC23S, (inputs, _config) => {
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const l23 = getGeometry(inputs, GEOM.L23, isLine, "Line");
    const pc23s = interceptCircleLineSegHelper(c23, l23, 0);
    if (!pc23s) throw new Error("STEP_22B: pc23s is null");
    return pc23s;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC23S, 2.0, store, theme);
  },
};

/**
 * Step 22C: Outline5
 * outline5 = line from pc1w to pc23s
 */
const STEP_22C: SixFoldV0Step = {
  id: "step22c",
  inputs: [GEOM.PC1W, GEOM.PC23S],
  outputs: [GEOM.OUTLINE5],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE5, (inputs, _config) => {
    const pc1w = getGeometry(inputs, GEOM.PC1W, isPoint, "Point");
    const pc23s = getGeometry(inputs, GEOM.PC23S, isPoint, "Point");
    return line(pc1w.x, pc1w.y, pc23s.x, pc23s.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE5, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 23: pc1n, pc34e, outline6
 * pc1n = interceptCircleLineSeg(c1_d1, l41, 0)
 * pc34e = interceptCircleLineSeg(c34, l34, 1)
 * outline6 = line from pc1n to pc34e
 */
/**
 * Step 23A: Point PC1N
 * pc1n = interceptCircleLineSeg(c1_d1, l41, 0)
 */
const STEP_23A: SixFoldV0Step = {
  id: "step23a",
  inputs: [GEOM.C1_D1, GEOM.L41],
  outputs: [GEOM.PC1N],
  parameters: [],
  compute: computeSingle(GEOM.PC1N, (inputs, _config) => {
    const c1_d1 = getGeometry(inputs, GEOM.C1_D1, isCircle, "Circle");
    const l41 = getGeometry(inputs, GEOM.L41, isLine, "Line");
    const pc1n = interceptCircleLineSegHelper(c1_d1, l41, 0);
    if (!pc1n) throw new Error("STEP_23A: pc1n is null");
    return pc1n;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC1N, 2.0, store, theme);
  },
};

/**
 * Step 23B: Point PC34E
 * pc34e = interceptCircleLineSeg(c34, l34, 1)
 */
const STEP_23B: SixFoldV0Step = {
  id: "step23b",
  inputs: [GEOM.C34, GEOM.L34],
  outputs: [GEOM.PC34E],
  parameters: [],
  compute: computeSingle(GEOM.PC34E, (inputs, _config) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const l34Line = getGeometry(inputs, GEOM.L34, isLine, "Line");
    const pc34e = interceptCircleLineSegHelper(c34, l34Line, 1);
    if (!pc34e) throw new Error("STEP_23B: pc34e is null");
    return pc34e;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC34E, 2.0, store, theme);
  },
};

/**
 * Step 23C: Outline6
 * outline6 = line from pc1n to pc34e
 */
const STEP_23C: SixFoldV0Step = {
  id: "step23c",
  inputs: [GEOM.PC1N, GEOM.PC34E],
  outputs: [GEOM.OUTLINE6],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE6, (inputs, _config) => {
    const pc1n = getGeometry(inputs, GEOM.PC1N, isPoint, "Point");
    const pc34e = getGeometry(inputs, GEOM.PC34E, isPoint, "Point");
    return line(pc1n.x, pc1n.y, pc34e.x, pc34e.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE6, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE7, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE8, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 26: pc3sw, pc23e, outline9
 * pc3sw = interceptCircleLineSeg(c3_d3, l13, 0)
 * lc23cp1 = line from c23 center to cp1
 * pc23e = interceptCircleLineSeg(c23, lc23cp1, 0)
 * outline9 = line from pc3sw to pc23e
 */
/**
 * Step 26A: Point PC3SW
 * pc3sw = interceptCircleLineSeg(c3_d3, lcp1cp3, 0)
 */
const STEP_26A: SixFoldV0Step = {
  id: "step26a",
  inputs: [GEOM.C3_D3, GEOM.LCP1CP3],
  outputs: [GEOM.PC3SW],
  parameters: [],
  compute: computeSingle(GEOM.PC3SW, (inputs, _config) => {
    const c3_d3 = getGeometry(inputs, GEOM.C3_D3, isCircle, "Circle");
    const lcp1cp3 = getGeometry(inputs, GEOM.LCP1CP3, isLine, "Line");
    const pc3sw = interceptCircleLineSegHelper(c3_d3, lcp1cp3, 0);
    if (!pc3sw) throw new Error("STEP_26A: pc3sw is null - circle-line intersection not found");
    return pc3sw;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC3SW, 2.0, store, theme);
  },
};

/**
 * Step 26B: Line LC23CP1
 * lc23cp1 = line from c23 center to cp1
 */
const STEP_26B: SixFoldV0Step = {
  id: "step26b",
  inputs: [GEOM.C23, GEOM.CP1],
  outputs: [GEOM.LC23CP1],
  parameters: [],
  compute: computeSingle(GEOM.LC23CP1, (inputs, _config) => {
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    return line(c23.cx, c23.cy, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LC23CP1, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 26C: Point PC23E and Outline9
 * pc23e = interceptCircleLineSeg(c23, lc23cp1, 0)
 * outline9 = line from pc3sw to pc23e
 */
const STEP_26C: SixFoldV0Step = {
  id: "step26c",
  inputs: [GEOM.C23, GEOM.LC23CP1, GEOM.PC3SW],
  outputs: [GEOM.PC23E],
  parameters: [],
  compute: computeSingle(GEOM.PC23E, (inputs, _config) => {
    const c23 = getGeometry(inputs, GEOM.C23, isCircle, "Circle");
    const lc23cp1 = getGeometry(inputs, GEOM.LC23CP1, isLine, "Line");
    const pc23e = interceptCircleLineSegHelper(c23, lc23cp1, 0);
    if (!pc23e) throw new Error("STEP_26C: pc23e is null - circle-line intersection not found");
    return pc23e;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC23E, 2.0, store, theme);
  },
};

/**
 * Step 26D: Outline9
 * outline9 = line from pc3sw to pc23e
 */
const STEP_26D: SixFoldV0Step = {
  id: "step26d",
  inputs: [GEOM.PC3SW, GEOM.PC23E],
  outputs: [GEOM.OUTLINE9],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE9, (inputs, _config) => {
    const pc3sw = getGeometry(inputs, GEOM.PC3SW, isPoint, "Point");
    const pc23e = getGeometry(inputs, GEOM.PC23E, isPoint, "Point");
    return line(pc3sw.x, pc3sw.y, pc23e.x, pc23e.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE9, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/**
 * Step 27: pc34s, outline10
 * lc34cp1 = line from c34 center to cp1
 * pc34s = interceptCircleLineSeg(c34, lc34cp1, 0)
 * outline10 = line from pc34s to pc3sw
 */
/**
 * Step 27A: Line LC34CP1
 * lc34cp1 = line from c34 center to cp1
 */
const STEP_27A: SixFoldV0Step = {
  id: "step27a",
  inputs: [GEOM.C34, GEOM.CP1],
  outputs: [GEOM.LC34CP1],
  parameters: [],
  compute: computeSingle(GEOM.LC34CP1, (inputs, _config) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    return line(c34.cx, c34.cy, cp1.x, cp1.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.LC34CP1, 0.5, store, theme, theme.COLOR_PRIMARY);
  },
};

/**
 * Step 27B: Point PC34S
 * pc34s = interceptCircleLineSeg(c34, lc34cp1, 0)
 */
const STEP_27B: SixFoldV0Step = {
  id: "step27b",
  inputs: [GEOM.C34, GEOM.LC34CP1],
  outputs: [GEOM.PC34S],
  parameters: [],
  compute: computeSingle(GEOM.PC34S, (inputs, _config) => {
    const c34 = getGeometry(inputs, GEOM.C34, isCircle, "Circle");
    const lc34cp1 = getGeometry(inputs, GEOM.LC34CP1, isLine, "Line");
    const pc34s = interceptCircleLineSegHelper(c34, lc34cp1, 0);
    if (!pc34s) throw new Error("STEP_27B: pc34s is null");
    return pc34s;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.PC34S, 2.0, store, theme);
  },
};

/**
 * Step 27C: Outline10
 * outline10 = line from pc34s to pc3sw
 */
const STEP_27C: SixFoldV0Step = {
  id: "step27c",
  inputs: [GEOM.PC34S, GEOM.PC3SW],
  outputs: [GEOM.OUTLINE10],
  parameters: [],
  compute: computeSingle(GEOM.OUTLINE10, (inputs, _config) => {
    const pc34s = getGeometry(inputs, GEOM.PC34S, isPoint, "Point");
    const pc3sw = getGeometry(inputs, GEOM.PC3SW, isPoint, "Point");
    return line(pc34s.x, pc34s.y, pc3sw.x, pc3sw.y);
  }),
  draw: (svg, values, store, theme) => {
    drawLine(svg, values, GEOM.OUTLINE10, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE11, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE12, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE13, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE14, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE15, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE16, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE17, 2.0, store, theme, theme.COLOR_OUTLINE);
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
    drawLine(svg, values, GEOM.OUTLINE18, 2.0, store, theme, theme.COLOR_OUTLINE);
  },
};

/** All steps in order */
export const SIX_FOLD_V0_STEPS: readonly SixFoldV0Step[] = [
  STEP_1A,
  STEP_1B,
  STEP_1C,
  STEP_2A1,
  STEP_2A2,
  STEP_2B,
  STEP_2C,
  STEP_2D1,
  STEP_2D2,
  STEP_2E1,
  STEP_2E2,
  STEP_2F,
  STEP_2G,
  STEP_2H,
  STEP_2I,
  STEP_2J,
  STEP_2K,
  STEP_3A,
  STEP_3B,
  STEP_3C,
  STEP_3D,
  STEP_4A,
  STEP_4B,
  STEP_5A,
  STEP_5B,
  STEP_6A,
  STEP_6B,
  STEP_6C,
  STEP_7A,
  STEP_7B,
  STEP_7C,
  STEP_7D,
  STEP_8A,
  STEP_8B,
  STEP_9A,
  STEP_9B,
  STEP_10A,
  STEP_10B,
  STEP_11A,
  STEP_11B,
  STEP_12A,
  STEP_12B,
  STEP_12C,
  STEP_12D,
  STEP_12E,
  STEP_13A,
  STEP_13B,
  STEP_13C,
  STEP_13D,
  STEP_13E,
  STEP_13F,
  STEP_14A,
  STEP_14B,
  STEP_14C,
  STEP_14D,
  STEP_15,
  STEP_16A,
  STEP_16B,
  STEP_17A,
  STEP_17B,
  STEP_18A,
  STEP_18B,
  STEP_18C,
  STEP_19A,
  STEP_19B,
  STEP_20A,
  STEP_20B,
  STEP_20C,
  STEP_21A,
  STEP_21B,
  STEP_21C,
  STEP_22A,
  STEP_22B,
  STEP_22C,
  STEP_23A,
  STEP_23B,
  STEP_23C,
  STEP_24,
  STEP_25,
  STEP_26A,
  STEP_26B,
  STEP_26C,
  STEP_26D,
  STEP_27A,
  STEP_27B,
  STEP_27C,
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
