/**
 * Number 2 geometric construction (Two Circles)
 * Shared base construction + two circles
 */

import { GeometryBuilder } from "../dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "../dsl/renderers/DefaultRenderer";
import type { GeometryRenderer } from "../dsl/renderers/types";
import type { Step } from "../../types/geometry";
import type { NumberConfig } from "./config";

/**
 * Build Number 2 (Two Circles) construction steps using the DSL.
 */
export function buildNumber2Steps(renderer?: GeometryRenderer): Step<NumberConfig>[] {
  const actualRenderer = renderer || new DefaultGeometryRenderer("");
  const builder = new GeometryBuilder<NumberConfig>(actualRenderer);

  // Step 0: Main coordinate system
  const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);

  // Step 1: Nested coordinate system at (p1x, p1y)
  const cs2 = builder.coordinateSystem(
    "cs2",
    builder.param("p1x"),
    builder.param("p1y"),
    builder.param("coordinateSystemArrowLength"),
    0,
  );

  // Step 2: Point p1 in cs2 at (0, 0)
  const p1 = builder.pointInCs("p1", cs2, 0, 0);

  // Step 3: Point p2 in cs2
  const p2x_rel = builder.subtract("p2x_rel", builder.param("p2x"), builder.param("p1x"));
  const p2y_rel = builder.subtract("p2y_rel", builder.param("p2y"), builder.param("p1y"));
  const p2 = builder.pointInCs("p2", cs2, p2x_rel.value, p2y_rel.value);

  // Step 4: Line from p1 to p2
  const line1 = builder.line("line1", p1, p2);

  // Step 5: Midpoint
  const midpoint = builder.pointAt("midpoint", line1, 0.5);

  // Step 6: Circle at p1
  const radius1 = builder.multiply("radius1", 0.1, builder.param("width"));
  builder.circle("circle1", p1, radius1.value);

  // Step 7: Circle at p2
  builder.circle("circle2", p2, radius1.value);

  // Satisfy noUnusedLocals
  void cs;
  void cs2;
  void p1;
  void p2;
  void line1;
  void midpoint;

  return builder.compile();
}

/** Number of steps in Number 2 construction */
export const NUMBER_2_STEPS_LENGTH = 8;
