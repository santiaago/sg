/**
 * Number 4 geometric construction (Four Circles)
 * Shared base construction + four circles
 */

import { GeometryBuilder } from "../dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "../dsl/renderers/DefaultRenderer";
import type { GeometryRenderer } from "../dsl/renderers/types";
import type { Step } from "../../types/geometry";
import type { NumberConfig } from "./config";

/**
 * Build Number 4 (Four Circles) construction steps using the DSL.
 */
export function buildNumber4Steps(renderer?: GeometryRenderer): Step<NumberConfig>[] {
  const actualRenderer = renderer || new DefaultGeometryRenderer("");
  const builder = new GeometryBuilder<NumberConfig>(actualRenderer);

  // Shared base construction
  // Step 0: Main coordinate system
  const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);

  // Step 1: Nested coordinate system
  const cs2 = builder.coordinateSystem(
    "cs2",
    builder.param("p1x"),
    builder.param("p1y"),
    builder.param("coordinateSystemArrowLength"),
    0,
  );

  // Step 2: Point p1
  const p1 = builder.pointInCs("p1", cs2, 0, 0);

  // Step 3: Point p2
  const p2 = builder.pointInCs(
    "p2",
    cs2,
    builder.subtract("dx", builder.param("p2x"), builder.param("p1x")).value,
    builder.subtract("dy", builder.param("p2y"), builder.param("p1y")).value,
  );

  // Step 4: Line
  const line1 = builder.line("line1", p1, p2);

  // Step 5: Midpoint
  const midpoint = builder.pointAt("midpoint", line1, 0.5);

  // Step 6-9: Four circles
  const radius = builder.multiply("radius", 0.08, builder.param("width"));
  builder.circle("circle1", p1, radius.value);
  builder.circle("circle2", p2, radius.value);
  builder.circle("circle3", midpoint, radius.value);

  // Fourth circle at a point above midpoint
  const offset_y = builder.multiply("offset_y", 0.3, builder.param("height")).value;
  const p3y_rel = builder.add("p3y_rel", midpoint.y, offset_y).value;
  const p3 = builder.pointInCs("p3", cs2, 0, p3y_rel);
  builder.circle("circle4", p3, radius.value);

  // Satisfy noUnusedLocals
  void cs;
  void cs2;
  void p1;
  void p2;
  void line1;
  void midpoint;

  return builder.compile();
}

/** Number of steps in Number 4 construction */
export const NUMBER_4_STEPS_LENGTH = 10;
