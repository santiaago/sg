// SixFold v1 construction using the declarative DSL with cs2 coordinate system
// Translates the 94-step manual construction from sixFoldV0Steps.ts with cs2 as parent

import { GeometryBuilder } from "./dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "./dsl/renderers/DefaultRenderer";
import type { Step } from "@/types/geometry";
import type { SixFoldV0Config } from "./sixFold/operations";
import { GOLDEN_RATIO } from "./operations";
import type { LineStyleOptions } from "./dsl/expressions/LineExpression";

/**
 * Build the SixFold v1 construction steps using the DSL with cs2 coordinate system.
 * cs2 created at (p1x, p1y) from config. p1 at (0, 0) in cs2.
 * All subsequent geometries use cs2 as parent coordinate system.
 * Returns an array of Steps that can be executed by the standard step execution engine.
 */
export function buildSixfoldDslV1Steps(): Step<SixFoldV0Config>[] {
  const builder = new GeometryBuilder<SixFoldV0Config>(new DefaultGeometryRenderer());

  // Outline style - same as square polygon style in squareDslSteps.ts
  const outlineStyle: LineStyleOptions = {
    strokeWidth: GOLDEN_RATIO,
    strokeColor: (theme) => theme.COLOR_OUTLINE,
  };
  void outlineStyle; // Satisfy noUnusedLocals - will be used in later steps

  // TODO: Implement steps (Tasks 4-8)
  // Step 0: cs - root coordinate system
  // Step 1: cs2 - at (p1x, p1y) from config
  // Step 2: p1 - at (0, 0) in cs2
  // Steps 3-94: All geometries use cs2 as parent

  return builder.compile();
}

/**
 * Number of steps in the DSL SixFold v1 construction.
 * 95 total: 94 v0 steps + 1 cs2 step (steps 0-94)
 */
export const DSL_SIXFOLD_V1_STEPS_LENGTH = 95;
