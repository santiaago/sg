// Test to verify p1 vector translation pattern works correctly
// If this test fails, it indicates the issue is in the DSL expressions
// If this test passes, the issue is likely in the UI rendering layer

import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { executeSteps as executeStepsUtil } from "./dsl-test-utils";
import { getGeometryValue } from "./dsl-test-utils";
import type { Point } from "../src/types/geometry";

function approx(a: number, b: number, tolerance = 1e-9): boolean {
  return Math.abs(a - b) < tolerance;
}

interface TestConfig {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  coordinateSystemArrowLength: number;
}

describe("P1 Vector Translation Pattern - from sixfoldDslV1Steps.ts", () => {
  const config: TestConfig = {
    p1x: 100,
    p1y: 200,
    p2x: 30,
    p2y: 40,
    coordinateSystemArrowLength: 10,
  };

  it("pattern from sixfoldDslV1Steps.ts computes p1 correctly", () => {
    const builder = new GeometryBuilder<TestConfig>();

    // Exact pattern from user's file
    const cs = builder.coordinateSystem(
      "cs",
      0,
      0,
      builder.param("coordinateSystemArrowLength"),
      0,
    );
    const cs2 = builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0);

    const vec_cs2_to_cs = builder.vector("vec_cs2_to_cs", cs2, cs);
    const p1_x = builder.add("p1_x", builder.param("p1x"), vec_cs2_to_cs.dx);
    const p1_y = builder.add("p1_y", builder.param("p1y"), vec_cs2_to_cs.dy);
    builder.pointInCs("p1", cs2, p1_x.value, p1_y.value);

    const steps = builder.compile();
    const result = executeStepsUtil(steps, { config });

    const p1Result = getGeometryValue<Point>(result, "p1");
    const cs2Result = getGeometryValue<Point>(result, "cs2");

    expect(p1Result).toBeDefined();
    expect(cs2Result).toBeDefined();
    expect(approx(p1Result!.x, cs2Result!.x)).toBe(true);
    expect(approx(p1Result!.y, cs2Result!.y)).toBe(true);
    expect(approx(p1Result!.x, config.p1x)).toBe(true);
    expect(approx(p1Result!.y, config.p1y)).toBe(true);
  });
});
