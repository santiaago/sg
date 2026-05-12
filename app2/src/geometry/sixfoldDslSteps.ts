// SixFold v0 construction using the declarative DSL
// Translates the 94-step manual construction from sixFoldV0Steps.ts

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import type { Step } from "@/types/geometry";
import type { SixFoldV0Config } from "./sixFold/operations";
import { GOLDEN_RATIO } from "./operations";
import type { LineStyleOptions } from "./dsl/expressions/LineExpression";

/**
 * Build the SixFold v0 construction steps using the DSL.
 * Returns an array of Steps that can be executed by the standard step execution engine.
 * Produces geometrically identical results to the manual sixFoldV0Steps.ts implementation.
 */
export function buildSixfoldDslSteps(): Step<SixFoldV0Config>[] {
  const builder = new GeometryBuilder<SixFoldV0Config>(new DefaultGeometryRenderer());

  // Outline style - same as square polygon style in squareDslSteps.ts
  const outlineStyle: LineStyleOptions = {
    strokeWidth: GOLDEN_RATIO,
    strokeColor: (theme) => theme.COLOR_PRIMARY,
  };

  // Step 0: Coordinate System
  const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);

  // Step 1: Point P1
  const p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"));

  // Step 2: Point P2
  const p2 = builder.pointInCs("p2", cs, builder.param("p2x"), builder.param("p2y"));

  // Step 3: Line LINE1
  const line1 = builder.line("line1", p1, p2);

  // Step 4: Point CP1 on LINE1
  const cp1 = builder.pointAt("cp1", line1, builder.param("cp1OffsetRatio"));

  // Step 5: Circle C1
  const c1 = builder.circle("c1", cp1, builder.param("radius"));

  // Step 6: Point CP2 - left intersection of C1 with LINE1
  const cp2 = builder.intersection("cp2", c1, line1, { position: "left" });

  // Step 7: Circle C2
  const c2 = builder.circle("c2", cp2, builder.param("radius"));

  // Step 8: Point PIC12 - north intersection of C1 and C2
  const pic12 = builder.circleIntersection("pic12", c1, c2, { select: "north" });

  // Step 9: Circle CPIC12
  const cPic12 = builder.circle("cPic12", pic12, builder.param("radius"));

  // Step 10: Point P3 - bisect CPIC12 through CP2
  const p3 = builder.bisectCircleAndPoint("p3", cPic12, cp2);

  // Step 11: Point P4 - bisect CPIC12 through CP1
  const p4 = builder.bisectCircleAndPoint("p4", cPic12, cp1);

  // Step 12: Line L13
  const l13 = builder.line("l13", cp1, p3);

  // Step 13: Line L24
  const l24 = builder.line("l24", cp2, p4);

  // Step 14: Point CP4 - first intersection of C1 with L13
  const cp4 = builder.intersection("cp4", c1, l13);

  // Step 15: Point CP3 - first intersection of C2 with L24
  const cp3 = builder.intersection("cp3", c2, l24);

  // Step 16: Circle C4
  const c4 = builder.circle("c4", cp4, builder.param("radius"));

  // Step 17: Circle C3
  const c3 = builder.circle("c3", cp3, builder.param("radius"));

  // Step 18: Line L12
  const l12 = builder.line("l12", cp2, cp1);

  // Step 19: Line L23
  const l23 = builder.line("l23", cp2, cp3);

  // Step 20: Line L34
  const l34 = builder.line("l34", cp3, cp4);

  // Step 21: Line L41
  const l41 = builder.line("l41", cp4, cp1);

  // Step 22: Point PIC14 - west intersection of C4 and C1
  const pic14 = builder.circleIntersection("pic14", c4, c1, { select: "west" });

  // Step 23: Line LPIC12 from CP1 to PIC12
  const lpic12 = builder.line("lpic12", cp1, pic12);

  // Step 24: Line LPIC14 from CP1 to PIC14
  const lpic14 = builder.line("lpic14", cp1, pic14);

  // Step 25: Line LCP1CP3 from CP1 to CP3
  const lcp1cp3 = builder.line("lcp1cp3", cp1, cp3);

  // Step 26: Line LCP2CP4 from CP2 to CP4
  const lcp2cp4 = builder.line("lcp2cp4", cp2, cp4);

  // Step 27: Point PI2 - intersection of LCP1CP3 and LCP2CP4
  const pi2 = builder.lineIntersection("pi2", lcp1cp3, lcp2cp4);

  // Step 28-33: Create circles with radius = distance(pic14, pi2)
  // Step 28: Circle C1_D1
  const c1_d1 = builder.circleWithDistanceRadius("c1_d1", cp1, pic14, pi2);

  // Step 29: Circle C2_D1
  const c2_d1 = builder.circleWithDistanceRadius("c2_d1", cp2, pic14, pi2);

  // Step 30: Circle C3_D1
  const c3_d1 = builder.circleWithDistanceRadius("c3_d1", cp3, pic14, pi2);

  // Step 31: Circle C4_D1
  const c4_d1 = builder.circleWithDistanceRadius("c4_d1", cp4, pic14, pi2);

  // Step 32: Circle C14_D1
  const c14_d1 = builder.circleWithDistanceRadius("c14_d1", pic14, pic14, pi2);

  // Step 33: Circle C12_D1
  const c12_d1 = builder.circleWithDistanceRadius("c12_d1", pic12, pic14, pi2);

  // Step 34: Point PI3 - east intersection of C14_D1 and C2_D1
  const pi3 = builder.circleIntersection("pi3", c14_d1, c2_d1, { select: "east" });

  // Step 35: Point PI4 - east intersection of C12_D1 and C4_D1
  const pi4 = builder.circleIntersection("pi4", c12_d1, c4_d1, { select: "east" });

  // Step 36: Line LCP1PI3 from CP1 to PI3
  const lcp1pi3 = builder.line("lcp1pi3", cp1, pi3);

  // Step 37: Line LCP1PI4 from CP1 to PI4
  const lcp1pi4 = builder.line("lcp1pi4", cp1, pi4);

  // Step 38: Point PRX5 - first intersection of C14_D1 with LPIC14
  const prx5 = builder.intersection("prx5", c14_d1, lpic14);

  // Step 39: Point PRX6 - first intersection of C12_D1 with LPIC12
  const prx6 = builder.intersection("prx6", c12_d1, lpic12);

  // Step 40: Point C23W - bisect C14_D1 through PRX5
  const c23w = builder.bisectCircleAndPoint("c23w", c14_d1, prx5);

  // Step 41: Line L14P from PIC14 to C23W
  const l14p = builder.line("l14p", pic14, c23w);

  // Step 42: Point PC23 - intersection of L23 and L14P
  const pc23 = builder.lineIntersection("pc23", l23, l14p);

  // Step 43: Line from PC23 to CP2, then Point C23S - first intersection of C2_D1 with that line
  const line_pc23_cp2 = builder.line("line_pc23_cp2", pc23, cp2);
  const c23s = builder.intersection("c23s", c2_d1, line_pc23_cp2);

  // Step 44: Circle C23 - radius = distance(pc23, c23s)
  const c23 = builder.circleWithDistanceRadius("c23", pc23, pc23, c23s);

  // Step 45: Circle CPI12 - radius = distance(pic14, pi2)
  const cpic12 = builder.circleWithDistanceRadius("cpic12", pic12, pic14, pi2);

  // Step 46: Point C34N - bisect CPI12 through PRX6
  const c34n = builder.bisectCircleAndPoint("c34n", cpic12, prx6);

  // Step 47: Line LPIC12C34N from PIC12 to C34N
  const lpic12c34n = builder.line("lpic12c34n", pic12, c34n);

  // Step 48: Point PC34 - intersection of L34 and LPIC12C34N
  const pc34 = builder.lineIntersection("pc34", l34, lpic12c34n);

  // Step 49: Line from PC34 to CP4, then Point C34E - first intersection of C4_D1 with that line
  const line_pc34_cp4 = builder.line("line_pc34_cp4", pc34, cp4);
  const c34e = builder.intersection("c34e", c4_d1, line_pc34_cp4);

  // Step 50: Circle C34 - radius = distance(pc34, c34e)
  const c34 = builder.circleWithDistanceRadius("c34", pc34, pc34, c34e);

  // Step 51: Point PP - first intersection of C1_D1 with LPIC14
  const pp = builder.intersection("pp", c1_d1, lpic14);

  // Step 52: Line L1 from PI3 to PP
  const l1 = builder.line("l1", pi3, pp);

  // Step 53: Point PII1 - intersection of L1 and LCP1CP3
  const pii1 = builder.lineIntersection("pii1", l1, lcp1cp3);

  // Step 54: Point PII2 - intersection of L1 and LCP2CP4
  const pii2 = builder.lineIntersection("pii2", l1, lcp2cp4);

  // Step 55: Line LPII1PII2 from PII1 to PII2
  const lpii1pii2 = builder.line("lpii1pii2", pii1, pii2);

  // Step 56-57: Create circles with radius = distance(pii1, cp1)
  // Step 56: Circle C1_D3
  const c1_d3 = builder.circleWithDistanceRadius("c1_d3", cp1, pii1, cp1);

  // Step 57: Circle C3_D3
  const c3_d3 = builder.circleWithDistanceRadius("c3_d3", cp3, pii1, cp1);

  // Step 58: Line LCP2PIC14 from CP2 to PIC14
  const lcp2pic14 = builder.line("lcp2pic14", cp2, pic14);

  // Step 59: Line LCP4PIC12 from CP4 to PIC12
  const lcp4pic12 = builder.line("lcp4pic12", cp4, pic12);

  // Step 60: Line LPII1PI4 from PII1 to PI4
  const lpii1pi4 = builder.line("lpii1pi4", pii1, pi4);

  // Step 61: Point PIC4 - intersection of LPII1PI4 and LCP4PIC12
  const pic4 = builder.lineIntersection("pic4", lpii1pi4, lcp4pic12);

  // Step 62: Outline1 from PII1 to PIC4
  const outline1 = builder.line("outline1", pii1, pic4, outlineStyle);

  // Step 63: Point PIC2 - intersection of LPII1PII2 and LCP2PIC14
  const pic2 = builder.lineIntersection("pic2", lpii1pii2, lcp2pic14);

  // Step 64: Outline2 from PII1 to PIC2
  const outline2 = builder.line("outline2", pii1, pic2, outlineStyle);

  // Step 65: Point PIC1W - first intersection of C1_D3 with LCP1PI3
  const pic1w = builder.intersection("pic1w", c1_d3, lcp1pi3);

  // Step 66: Point PIC34 - first intersection of C34 with L34
  const pic34 = builder.intersection("pic34", c34, l34);

  // Step 67: Outline3 from PIC1W to PIC34
  const outline3 = builder.line("outline3", pic1w, pic34, outlineStyle);

  // Step 68: Point PIC1N - first intersection of C1_D3 with LCP1PI4
  const pic1n = builder.intersection("pic1n", c1_d3, lcp1pi4);

  // Step 69: Point PIC23 - second intersection of C23 with L23 (east)
  const pic23 = builder.intersection("pic23", c23, l23, { position: "right" });

  // Step 70: Outline4 from PIC1N to PIC23
  const outline4 = builder.line("outline4", pic1n, pic23, outlineStyle);

  // Step 71: Point PC1W - first intersection of C1_D1 with L12
  const pc1w = builder.intersection("pc1w", c1_d1, l12);

  // Step 72: Point PC23S - first intersection of C23 with L23
  const pc23s = builder.intersection("pc23s", c23, l23);

  // Step 73: Outline5 from PC1W to PC23S
  const outline5 = builder.line("outline5", pc1w, pc23s, outlineStyle);

  // Step 74: Point PC1N - first intersection of C1_D1 with L41
  const pc1n = builder.intersection("pc1n", c1_d1, l41);

  // Step 75: Point PC34E - second intersection of C34 with L34 (east)
  const pc34e = builder.intersection("pc34e", c34, l34, { position: "right" });

  // Step 76: Outline6 from PC1N to PC34E
  const outline6 = builder.line("outline6", pc1n, pc34e, outlineStyle);

  // Step 77: Outline7 from PC1N to PIC1N
  const outline7 = builder.line("outline7", pc1n, pic1n, outlineStyle);

  // Step 78: Outline8 from PC1W to PIC1W
  const outline8 = builder.line("outline8", pc1w, pic1w, outlineStyle);

  // Step 79: Point PC3SW - first intersection of C3_D3 with LCP1CP3
  const pc3sw = builder.intersection("pc3sw", c3_d3, lcp1cp3);

  // Step 80: Line LC23CP1 from C23 center (pc23) to CP1
  const lc23cp1 = builder.line("lc23cp1", pc23, cp1);

  // Step 81: Point PC23E - first intersection of C23 with LC23CP1
  const pc23e = builder.intersection("pc23e", c23, lc23cp1);

  // Step 82: Outline9 from PC3SW to PC23E
  const outline9 = builder.line("outline9", pc3sw, pc23e, outlineStyle);

  // Step 83: Line LC34CP1 from C34 center (pc34) to CP1
  const lc34cp1 = builder.line("lc34cp1", pc34, cp1);

  // Step 84: Point PC34S - first intersection of C34 with LC34CP1
  const pc34s = builder.intersection("pc34s", c34, lc34cp1);

  // Step 85: Outline10 from PC34S to PC3SW
  const outline10 = builder.line("outline10", pc34s, pc3sw, outlineStyle);

  // Step 86: Outline11 from PC34E to PC34S
  const outline11 = builder.line("outline11", pc34e, pc34s, outlineStyle);

  // Step 87: Outline12 from PC23S to PC23E
  const outline12 = builder.line("outline12", pc23s, pc23e, outlineStyle);

  // Step 88: Outline13 from CP4 to PIC4
  const outline13 = builder.line("outline13", cp4, pic4, outlineStyle);

  // Step 89: Outline14 from CP2 to PIC2
  const outline14 = builder.line("outline14", cp2, pic2, outlineStyle);

  // Step 90: Outline15 from CP2 to CP1
  const outline15 = builder.line("outline15", cp2, cp1, outlineStyle);

  // Step 91: Outline16 from CP2 to CP3
  const outline16 = builder.line("outline16", cp2, cp3, outlineStyle);

  // Step 92: Outline17 from CP3 to CP4
  const outline17 = builder.line("outline17", cp3, cp4, outlineStyle);

  // Step 93: Outline18 from CP4 to CP1
  const outline18 = builder.line("outline18", cp4, cp1, outlineStyle);

  // NOTE: The following geometries are created to match the manual sixFoldV0Steps.ts
  // but are not used as inputs to any other geometry construction in the DSL.
  // In the manual implementation, these geometries exist but are also not used as inputs.
  // They are kept to maintain step equivalence with the manual step definitions.
  // Keep references to satisfy TypeScript noUnusedLocals (variables are assigned but never read)
  void c3; // Circle C3 created at Step 17, not referenced as input to other geometries
  void c3_d1; // Circle C3_D1 created at Step 30, not referenced as input to other geometries
  // Outline lines (Steps 62-93) - part of final visual output, not used as construction inputs
  void outline1;
  void outline2;
  void outline3;
  void outline4;
  void outline5;
  void outline6;
  void outline7;
  void outline8;
  void outline9;
  void outline10;
  void outline11;
  void outline12;
  void outline13;
  void outline14;
  void outline15;
  void outline16;
  void outline17;
  void outline18;

  return builder.compile();
}

/**
 * Number of steps in the DSL SixFold construction.
 * Note: DSL has 96 steps (94 manual + 2 helper lines: line_pc23_cp2, line_pc34_cp4)
 * These helper lines are intermediate steps needed for circle intersections.
 */
export const DSL_SIXFOLD_STEPS_LENGTH = 96;
