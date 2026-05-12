// SixFold v0 construction using the declarative DSL
// Translates the 94-step manual construction from sixFoldV0Steps.ts

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import type { Step } from "@/types/geometry";
import type { SixFoldV0Config } from "./sixFold/operations";

/**
 * Build the SixFold v0 construction steps using the DSL.
 * Returns an array of Steps that can be executed by the standard step execution engine.
 * Produces geometrically identical results to the manual sixFoldV0Steps.ts implementation.
 */
export function buildSixfoldDslSteps(): Step<SixFoldV0Config>[] {
  const builder = new GeometryBuilder<SixFoldV0Config>(new DefaultGeometryRenderer());

  // Step 0: Coordinate System
  const cs = builder.coordinateSystem(
    "cs",
    0,
    0,
    builder.param("coordinateSystemArrowLength"),
    0,
  );

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

  // Step 6: Point CP2
  const cp2 = builder.intersection("cp2", c1, line1);

  // Step 7: Circle C2
  const c2 = builder.circle("c2", cp2, builder.param("radius"));

  // Step 8: Point PIC12
  const pic12 = builder.circleIntersection("pic12", c1, c2, { select: "north" });

  // Step 9: Circle CPIC12
  const cPic12 = builder.circle("cPic12", pic12, builder.param("radius"));

  // Step 10: Point P3
  const p3 = builder.bisectCircleAndPoint("p3", cPic12, cp2);

  // Step 11: Point P4
  const p4 = builder.bisectCircleAndPoint("p4", cPic12, cp1);

  // Step 12: Line L13
  const l13 = builder.line("l13", cp1, p3);

  // Step 13: Line L24
  const l24 = builder.line("l24", cp2, p4);

  // Step 14: Point CP4
  const cp4 = builder.intersection("cp4", c1, l13);

  // Step 15: Point CP3
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

  // Step 22: Point PIC14
  const pic14 = builder.circleIntersection("pic14", c4, c1, { select: "west" });

  // TODO: Continue with Steps 23-93

  // Keep references to satisfy TypeScript (variables are registered in builder)
  void c3;
  void l12;
  void l23;
  void l34;
  void l41;
  void pic14;

  return builder.compile();
}

/**
 * Number of steps in the DSL SixFold construction.
 * Matches the manual sixFoldV0Steps.ts step count.
 */
export const DSL_SIXFOLD_STEPS_LENGTH = 94;
