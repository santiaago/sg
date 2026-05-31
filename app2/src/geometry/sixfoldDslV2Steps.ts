// SixFold v2 construction using the declarative DSL with cs2 coordinate system and flipX
// This is a mirrored variant of v1, demonstrating coordinate system flip capability

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import type { GeometryRenderer } from "./dsl/renderers/types";
import type { Step } from "@/types/geometry";
import type { SixFoldV2Config } from "./sixFold/operations";
import { GOLDEN_RATIO } from "./operations";
import type { LineStyleOptions } from "./dsl/expressions/LineExpression";

/**
 * Build the SixFold v2 construction steps using the DSL with cs2 coordinate system and flipX.
 * cs2 is positioned at v1's p2 location with flipX=true, effectively swapping p1 and p2 positions.
 * All direction-based selections use cs2's local coordinate space.
 * Returns an array of Steps that can be executed by the standard step execution engine.
 *
 * @param renderer - Optional custom renderer for drawing geometry
 */
export function buildSixfoldDslV2Steps(renderer?: GeometryRenderer): Step<SixFoldV2Config>[] {
  const actualRenderer = renderer || new DefaultGeometryRenderer("");
  const builder = new GeometryBuilder<SixFoldV2Config>(actualRenderer);

  // Outline style - same as square polygon style in squareDslSteps.ts
  const outlineStyle: LineStyleOptions = {
    strokeWidth: GOLDEN_RATIO,
    strokeColor: (theme) => theme.COLOR_OUTLINE,
  };

  // Step 0: Coordinate System - unchanged from v0
  const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);

  // Step 1: Coordinate System cs2 - at (p2x, p2y) from config with flipX=true
  // This is the key difference from v1: cs2 is at p2's position and has flipX=true
  const cs2 = builder.coordinateSystem(
    "cs2",
    builder.param("p2x"),
    builder.param("p2y"),
    builder.param("coordinateSystemArrowLength"),
    0,
    true, // flipX = true
    false, // flipY = false
  );

  // vec_cs2_to_cs captures the offset from cs to cs2
  const vec_cs2_to_cs = builder.vector("vec_cs2_cs", cs2, cs);

  // Step 2: Point P1 in cs2 at (0, 0) - absolute position = (p2x, p2y) = v1's p2 position
  const p1x = builder.add("p1x", builder.param("p1x"), vec_cs2_to_cs.dx);
  const p1y = builder.add("p1y", builder.param("p1y"), vec_cs2_to_cs.dy);
  const p1 = builder.pointInCs("p1", cs2, p1x.value, p1y.value);

  // Step 3: Point P2 in cs2 at (p2x - p1x, p1y - p2y) - absolute position = (p1x, p1y) = v1's p1 position
  // In cs2's flipped space, this swaps the positions
  const p2_local_x = builder.subtract("p2_local_x", builder.param("p2x"), builder.param("p1x"));
  const p2_local_y = builder.subtract("p2_local_y", builder.param("p1y"), builder.param("p2y"));
  const p2 = builder.pointInCs("p2", cs2, p2_local_x.value, p2_local_y.value);

  // Step 4: Line LINE1
  const line1 = builder.line("line1", p1, p2);

  // Step 5: Point CP1 on LINE1
  const cp1 = builder.pointAt("cp1", line1, builder.param("cp1OffsetRatio"));

  // Step 6: Circle C1
  const c1 = builder.circle("c1", cp1, builder.param("radius"));

  // Step 7: Point CP2 - left intersection of C1 with LINE1, relative to cs2
  const cp2 = builder.intersection("cp2", c1, line1, { position: "left", relativeTo: "cs2" });

  // Step 8: Circle C2
  const c2 = builder.circle("c2", cp2, builder.param("radius"));

  // Step 9: Point PIC12 - north intersection of C1 and C2, relative to cs2
  const pic12 = builder.circleIntersection("pic12", c1, c2, { select: "north", relativeTo: "cs2" });

  // Step 10: Circle CPIC12
  const cPic12 = builder.circle("cPic12", pic12, builder.param("radius"));

  // Step 11: Point P3 - bisect CPIC12 through CP2
  const p3 = builder.bisectCircleAndPoint("p3", cPic12, cp2);

  // Step 12: Point P4 - bisect CPIC12 through CP1
  const p4 = builder.bisectCircleAndPoint("p4", cPic12, cp1);

  // Step 13: Line L13
  const l13 = builder.line("l13", cp1, p3);

  // Step 14: Line L24
  const l24 = builder.line("l24", cp2, p4);

  // Step 15: Point CP4 - first intersection of C1 with L13
  const cp4 = builder.intersection("cp4", c1, l13);

  // Step 16: Point CP3 - first intersection of C2 with L24
  const cp3 = builder.intersection("cp3", c2, l24);

  // Step 17: Circle C4
  const c4 = builder.circle("c4", cp4, builder.param("radius"));

  // Step 18: Circle C3
  const _c3 = builder.circle("c3", cp3, builder.param("radius"));

  // Step 19: Line L12
  const l12 = builder.line("l12", cp2, cp1);

  // Step 20: Line L23
  const l23 = builder.line("l23", cp2, cp3);

  // Step 21: Line L34
  const l34 = builder.line("l34", cp3, cp4);

  // Step 22: Line L41
  const l41 = builder.line("l41", cp4, cp1);

  // Step 23: Point PIC14 - west intersection of C4 and C1, relative to cs2
  const pic14 = builder.circleIntersection("pic14", c4, c1, { select: "west", relativeTo: "cs2" });

  // Step 24: Line LPIC12 from CP1 to PIC12
  const lpic12 = builder.line("lpic12", cp1, pic12);

  // Step 25: Line LPIC14 from CP1 to PIC14
  const lpic14 = builder.line("lpic14", cp1, pic14);

  // Step 26: Line LCP1CP3 from CP1 to CP3
  const lcp1cp3 = builder.line("lcp1cp3", cp1, cp3);

  // Step 27: Line LCP2CP4 from CP2 to CP4
  const lcp2cp4 = builder.line("lcp2cp4", cp2, cp4);

  // Step 28: Point PI2 - intersection of LCP1CP3 and LCP2CP4
  const pi2 = builder.lineIntersection("pi2", lcp1cp3, lcp2cp4);

  // Step 29-34: Create circles with radius = distance(pic14, pi2)
  // Step 29: Circle C1_D1
  const c1_d1 = builder.circleWithDistanceRadius("c1_d1", cp1, pic14, pi2);

  // Step 30: Circle C2_D1
  const c2_d1 = builder.circleWithDistanceRadius("c2_d1", cp2, pic14, pi2);

  // Step 31: Circle C3_D1
  const _c3_d1 = builder.circleWithDistanceRadius("c3_d1", cp3, pic14, pi2);

  // Step 32: Circle C4_D1
  const c4_d1 = builder.circleWithDistanceRadius("c4_d1", cp4, pic14, pi2);

  // Step 33: Circle C14_D1
  const c14_d1 = builder.circleWithDistanceRadius("c14_d1", pic14, pic14, pi2);

  // Step 34: Circle C12_D1
  const c12_d1 = builder.circleWithDistanceRadius("c12_d1", pic12, pic14, pi2);

  // Step 35: Point PI3 - east intersection of C14_D1 and C2_D1, relative to cs2
  const pi3 = builder.circleIntersection("pi3", c14_d1, c2_d1, {
    select: "east",
    relativeTo: "cs2",
  });

  // Step 36: Point PI4 - east intersection of C12_D1 and C4_D1, relative to cs2
  const pi4 = builder.circleIntersection("pi4", c12_d1, c4_d1, {
    select: "east",
    relativeTo: "cs2",
  });

  // Step 37: Line LCP1PI3 from CP1 to PI3
  const lcp1pi3 = builder.line("lcp1pi3", cp1, pi3);

  // Step 38: Line LCP1PI4 from CP1 to PI4
  const lcp1pi4 = builder.line("lcp1pi4", cp1, pi4);

  // Step 39: Point PRX5 - first intersection of C14_D1 with LPIC14
  const prx5 = builder.intersection("prx5", c14_d1, lpic14);

  // Step 40: Point PRX6 - first intersection of C12_D1 with LPIC12
  const prx6 = builder.intersection("prx6", c12_d1, lpic12);

  // Step 41: Point C23W - bisect C14_D1 through PRX5
  const c23w = builder.bisectCircleAndPoint("c23w", c14_d1, prx5);

  // Step 42: Line L14P from PIC14 to C23W
  const l14p = builder.line("l14p", pic14, c23w);

  // Step 43: Point PC23 - intersection of L23 and L14P
  const pc23 = builder.lineIntersection("pc23", l23, l14p);

  // Step 44: Line from PC23 to CP2, then Point C23S - first intersection of C2_D1 with that line
  const line_pc23_cp2 = builder.line("line_pc23_cp2", pc23, cp2);
  const c23s = builder.intersection("c23s", c2_d1, line_pc23_cp2);

  // Step 45: Circle C23 - radius = distance(pc23, c23s)
  const c23 = builder.circleWithDistanceRadius("c23", pc23, pc23, c23s);

  // Step 46: Circle CPI12 - radius = distance(pic14, pi2)
  const cpic12 = builder.circleWithDistanceRadius("cpic12", pic12, pic14, pi2);

  // Step 47: Point C34N - bisect CPI12 through PRX6
  const c34n = builder.bisectCircleAndPoint("c34n", cpic12, prx6);

  // Step 48: Line LPIC12C34N from PIC12 to C34N
  const lpic12c34n = builder.line("lpic12c34n", pic12, c34n);

  // Step 49: Point PC34 - intersection of L34 and LPIC12C34N
  const pc34 = builder.lineIntersection("pc34", l34, lpic12c34n);

  // Step 50: Line from PC34 to CP4, then Point C34E - first intersection of C4_D1 with that line
  const line_pc34_cp4 = builder.line("line_pc34_cp4", pc34, cp4);
  const c34e = builder.intersection("c34e", c4_d1, line_pc34_cp4);

  // Step 51: Circle C34 - radius = distance(pc34, c34e)
  const c34 = builder.circleWithDistanceRadius("c34", pc34, pc34, c34e);

  // Step 52: Point PP - first intersection of C1_D1 with LPIC14
  const pp = builder.intersection("pp", c1_d1, lpic14);

  // Step 53: Line L1 from PI3 to PP
  const l1 = builder.line("l1", pi3, pp);

  // Step 54: Point PII1 - intersection of L1 and LCP1CP3
  const pii1 = builder.lineIntersection("pii1", l1, lcp1cp3);

  // Step 55: Point PII2 - intersection of L1 and LCP2CP4
  const pii2 = builder.lineIntersection("pii2", l1, lcp2cp4);

  // Step 56: Line LPII1PII2 from PII1 to PII2
  const lpii1pii2 = builder.line("lpii1pii2", pii1, pii2);

  // Step 57-58: Create circles with radius = distance(pii1, cp1)
  // Step 57: Circle C1_D3
  const c1_d3 = builder.circleWithDistanceRadius("c1_d3", cp1, pii1, cp1);

  // Step 58: Circle C3_D3
  const c3_d3 = builder.circleWithDistanceRadius("c3_d3", cp3, pii1, cp1);

  // Step 59: Line LCP2PIC14 from CP2 to PIC14
  const lcp2pic14 = builder.line("lcp2pic14", cp2, pic14);

  // Step 60: Line LCP4PIC12 from CP4 to PIC12
  const lcp4pic12 = builder.line("lcp4pic12", cp4, pic12);

  // Step 61: Line LPII1PI4 from PII1 to PI4
  const lpii1pi4 = builder.line("lpii1pi4", pii1, pi4);

  // Step 62: Point PIC4 - intersection of LPII1PI4 and LCP4PIC12
  const pic4 = builder.lineIntersection("pic4", lpii1pi4, lcp4pic12);

  // Step 63: Outline1 from PII1 to PIC4
  const _outline1 = builder.line("outline1", pii1, pic4, outlineStyle);

  // Step 64: Point PIC2 - intersection of LPII1PII2 and LCP2PIC14
  const pic2 = builder.lineIntersection("pic2", lpii1pii2, lcp2pic14);

  // Step 65: Outline2 from PII1 to PIC2
  const _outline2 = builder.line("outline2", pii1, pic2, outlineStyle);

  // Step 66: Point PIC1W - first intersection of C1_D3 with LCP1PI3
  const pic1w = builder.intersection("pic1w", c1_d3, lcp1pi3);

  // Step 67: Point PIC34 - first intersection of C34 with L34
  const pic34 = builder.intersection("pic34", c34, l34);

  // Step 68: Outline3 from PIC1W to PIC34
  const _outline3 = builder.line("outline3", pic1w, pic34, outlineStyle);

  // Step 69: Point PIC1N - first intersection of C1_D3 with LCP1PI4
  const pic1n = builder.intersection("pic1n", c1_d3, lcp1pi4);

  // Step 70: Point PIC23 - second intersection of C23 with L23 (east), relative to cs2
  const pic23 = builder.intersection("pic23", c23, l23, { position: "right", relativeTo: "cs2" });

  // Step 71: Outline4 from PIC1N to PIC23
  const _outline4 = builder.line("outline4", pic1n, pic23, outlineStyle);

  // Step 72: Point PC1W - first intersection of C1_D1 with L12
  const pc1w = builder.intersection("pc1w", c1_d1, l12);

  // Step 73: Point PC23S - first intersection of C23 with L23
  const pc23s = builder.intersection("pc23s", c23, l23);

  // Step 74: Outline5 from PC1W to PC23S
  const _outline5 = builder.line("outline5", pc1w, pc23s, outlineStyle);

  // Step 75: Point PC1N - first intersection of C1_D1 with L41
  const pc1n = builder.intersection("pc1n", c1_d1, l41);

  // Step 76: Point PC34E - second intersection of C34 with L34 (east), relative to cs2
  const pc34e = builder.intersection("pc34e", c34, l34, { position: "right", relativeTo: "cs2" });

  // Step 77: Outline6 from PC1N to PC34E
  const _outline6 = builder.line("outline6", pc1n, pc34e, outlineStyle);

  // Step 78: Outline7 from PC1N to PIC1N
  const _outline7 = builder.line("outline7", pc1n, pic1n, outlineStyle);

  // Step 79: Outline8 from PC1W to PIC1W
  const _outline8 = builder.line("outline8", pc1w, pic1w, outlineStyle);

  // Step 80: Point PC3SW - first intersection of C3_D3 with LCP1CP3
  const pc3sw = builder.intersection("pc3sw", c3_d3, lcp1cp3);

  // Step 81: Line LC23CP1 from C23 center (pc23) to CP1
  const lc23cp1 = builder.line("lc23cp1", pc23, cp1);

  // Step 82: Point PC23E - first intersection of C23 with LC23CP1
  const pc23e = builder.intersection("pc23e", c23, lc23cp1);

  // Step 83: Outline9 from PC3SW to PC23E
  const _outline9 = builder.line("outline9", pc3sw, pc23e, outlineStyle);

  // Step 84: Line LC34CP1 from C34 center (pc34) to CP1
  const lc34cp1 = builder.line("lc34cp1", pc34, cp1);

  // Step 85: Point PC34S - first intersection of C34 with LC34CP1
  const pc34s = builder.intersection("pc34s", c34, lc34cp1);

  // Step 86: Outline10 from PC34S to PC3SW
  const _outline10 = builder.line("outline10", pc34s, pc3sw, outlineStyle);

  // Step 87: Outline11 from PC34E to PC34S
  const _outline11 = builder.line("outline11", pc34e, pc34s, outlineStyle);

  // Step 88: Outline12 from PC23S to PC23E
  const _outline12 = builder.line("outline12", pc23s, pc23e, outlineStyle);

  // Step 89: Outline13 from CP4 to PIC4
  const _outline13 = builder.line("outline13", cp4, pic4, outlineStyle);

  // Step 90: Outline14 from CP2 to PIC2
  const _outline14 = builder.line("outline14", cp2, pic2, outlineStyle);

  // Step 91: Outline15 from CP2 to CP1
  const _outline15 = builder.line("outline15", cp2, cp1, outlineStyle);

  // Step 92: Outline16 from CP2 to CP3
  const _outline16 = builder.line("outline16", cp2, cp3, outlineStyle);

  // Step 93: Outline17 from CP3 to CP4
  const _outline17 = builder.line("outline17", cp3, cp4, outlineStyle);

  // Step 94: Outline18 from CP4 to CP1
  const _outline18 = builder.line("outline18", cp4, cp1, outlineStyle);

  // NOTE: The following geometries are created to match the manual sixFoldV0Steps.ts
  // but are not used as inputs to any other geometry construction in the DSL.
  // Prefixed with _ to indicate intentional non-use per TypeScript convention.
  // _c3: Circle C3 created at Step 18, not referenced as input to other geometries
  // _c3_d1: Circle C3_D1 created at Step 31, not referenced as input to other geometries
  // _outline1-18: Outline lines (Steps 63-94) - part of final visual output, not used as construction inputs

  // Satisfy TypeScript noUnusedLocals: these variables are assigned (registering steps)
  // but never referenced as inputs to other geometry constructions.
  void _c3;
  void _c3_d1;
  void _outline1;
  void _outline2;
  void _outline3;
  void _outline4;
  void _outline5;
  void _outline6;
  void _outline7;
  void _outline8;
  void _outline9;
  void _outline10;
  void _outline11;
  void _outline12;
  void _outline13;
  void _outline14;
  void _outline15;
  void _outline16;
  void _outline17;
  void _outline18;

  return builder.compile();
}

/**
 * Number of steps in the DSL SixFold v2 construction.
 * 102 total: includes coordinate systems, points, lines, circles, and outline geometries
 */
export const DSL_SIXFOLD_V2_STEPS_LENGTH = 102;
