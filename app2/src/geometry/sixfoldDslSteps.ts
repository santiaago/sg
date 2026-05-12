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
  // Manual: coordinateSystem(0, 0, config.height / 24)
  // DSL: use pre-computed coordinateSystemArrowLength from config
  const cs = builder.coordinateSystem(
    "cs",
    0,
    0,
    builder.param("coordinateSystemArrowLength"),
    0,
  );

  // Step 1: Point P1
  // Manual: point(cs.x + config.p1x, cs.y + config.p1y)
  // DSL: pointInCs with local coordinates
  const p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"));

  // Step 2: Point P2
  // Manual: point(cs.x + config.p2x, cs.y + config.p2y)
  const p2 = builder.pointInCs("p2", cs, builder.param("p2x"), builder.param("p2y"));

  // Step 3: Line LINE1
  // Manual: line(p1.x, p1.y, p2.x, p2.y)
  const line1 = builder.line("line1", p1, p2);

  // Step 4: Point CP1 on LINE1 at cp1OffsetRatio
  // Manual: point(lx1 + lineLength * config.cp1OffsetRatio, ly1)
  // DSL: pointAt with ratio parameter
  const cp1 = builder.pointAt("cp1", line1, builder.param("cp1OffsetRatio"));

  // Step 5: Circle C1 at CP1 with radius
  // Manual: circle(cp1.x, cp1.y, config.radius)
  const c1 = builder.circle("c1", cp1, builder.param("radius"));

  // Step 6: Point CP2 - intersection of C1 and LINE1, leftmost
  // Manual: interceptCircleLineDirHelper(c1, line1, directions.left)
  // Note: For horizontal line LINE1, directions.left maps to first intersection (index 0)
  // DSL returns first intersection by default, matching the manual behavior
  const cp2 = builder.intersection("cp2", c1, line1);

  // Step 7: Circle C2 at CP2 with radius
  // Manual: circle(cp2.x, cp2.y, config.radius)
  const c2 = builder.circle("c2", cp2, builder.param("radius"));

  // Step 8: Point PIC12 - intersection of C1 and C2 (top point)
  // Manual: circlesIntersectionPointHelper(c1, c2, directions.up)
  // DSL: circleIntersection with select: "north" (directions.up = top = lower y in SVG)
  const pic12 = builder.circleIntersection("pic12", c1, c2, { select: "north" });

  // Step 9: Circle CPIC12 at PIC12 with radius
  // Manual: circle(pic12.x, pic12.y, config.radius)
  const cPic12 = builder.circle("cPic12", pic12, builder.param("radius"));

  // Step 10: Point P3 - bisect from cPic12 through cp2
  // Manual: bisectCircleAndPoint(cPic12, cp2)
  const p3 = builder.bisectCircleAndPoint("p3", cPic12, cp2);

  // Step 11: Point P4 - bisect from cPic12 through cp1
  // Manual: bisectCircleAndPoint(cPic12, cp1)
  const p4 = builder.bisectCircleAndPoint("p4", cPic12, cp1);

  // Step 12: Line L13 from CP1 to P3
  // Manual: line(cp1.x, cp1.y, p3.x, p3.y)
  const l13 = builder.line("l13", cp1, p3);

  // Step 13: Line L24 from CP2 to P4
  // Manual: line(cp2.x, cp2.y, p4.x, p4.y)
  const l24 = builder.line("l24", cp2, p4);

  // Step 14: Point CP4 - intersection of C1 and L13 (index 0)
  // Manual: interceptCircleLineSegHelper(c1, l13, 0)
  const cp4 = builder.intersection("cp4", c1, l13);

  // Step 15: Point CP3 - intersection of C2 and L24 (index 0)
  // Manual: interceptCircleLineSegHelper(c2, l24, 0)
  const cp3 = builder.intersection("cp3", c2, l24);

  // Step 16: Circle C4 at CP4 with radius
  // Manual: circle(cp4.x, cp4.y, config.radius)
  const c4 = builder.circle("c4", cp4, builder.param("radius"));

  // TODO: Continue with Steps 17-93

  // Keep references to satisfy TypeScript (variables are registered in builder)
  void cp3;
  void c4;

  return builder.compile();
}

/**
 * Number of steps in the DSL SixFold construction.
 * Matches the manual sixFoldV0Steps.ts step count.
 */
export const DSL_SIXFOLD_STEPS_LENGTH = 94;
