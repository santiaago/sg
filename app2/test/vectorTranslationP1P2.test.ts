// Test for p1/p2 vector translation pattern in sixfoldDslV1Steps.ts

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

describe("Vector Translation for p1/p2", () => {
  const config: TestConfig = { p1x: 100, p1y: 200, p2x: 30, p2y: 40, coordinateSystemArrowLength: 10 };

  it("p1 at (0,0) in cs2 using vector translation pattern", () => {
    const builder = new GeometryBuilder<TestConfig>();
    
    // Setup coordinate systems
    const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);
    const cs2 = builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0);
    
    // Vector translation pattern
    const vec_cs2_to_cs = builder.vector("vec_cs2_to_cs", cs2, cs);
    const p1_x = builder.add("p1_x", builder.param("p1x"), vec_cs2_to_cs.dx);
    const p1_y = builder.add("p1_y", builder.param("p1y"), vec_cs2_to_cs.dy);
    
    // Create p1 using .value
    const p1 = builder.pointInCs("p1", cs2, p1_x.value, p1_y.value);

    const steps = builder.compile();
    const result = executeStepsUtil(steps, { config });
    
    const p1Result = getGeometryValue<Point>(result, "p1");
    const cs2Result = getGeometryValue<Point>(result, "cs2");
    
    expect(p1Result).toBeDefined();
    expect(cs2Result).toBeDefined();
    
    // p1 in cs2 at (0,0) means absolute position = cs2 position
    expect(approx(p1Result!.x, cs2Result!.x)).toBe(true);
    expect(approx(p1Result!.y, cs2Result!.y)).toBe(true);
    expect(approx(p1Result!.x, config.p1x)).toBe(true);
    expect(approx(p1Result!.y, config.p1y)).toBe(true);
  });

  it("p2 using vector translation pattern", () => {
    const builder = new GeometryBuilder<TestConfig>();
    
    // Setup coordinate systems
    const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);
    const cs2 = builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0);
    
    // Vector translation pattern
    const vec_cs2_to_cs = builder.vector("vec_cs2_to_cs", cs2, cs);
    const p2_x = builder.add("p2_x", builder.param("p2x"), vec_cs2_to_cs.dx);
    const p2_y = builder.add("p2_y", builder.param("p2y"), vec_cs2_to_cs.dy);
    
    // Create p2 using .value
    const p2 = builder.pointInCs("p2", cs2, p2_x.value, p2_y.value);

    const steps = builder.compile();
    const result = executeStepsUtil(steps, { config });
    
    const p2Result = getGeometryValue<Point>(result, "p2");
    const cs2Result = getGeometryValue<Point>(result, "cs2");
    
    expect(p2Result).toBeDefined();
    expect(cs2Result).toBeDefined();
    
    // p2 local coords: (p2x + vec.dx, p2y + vec.dy) = (p2x - p1x, p2y - p1y)
    // p2 absolute: cs2 + local = (p1x + p2x - p1x, p1y + p2y - p1y) = (p2x, p2y)
    expect(approx(p2Result!.x, config.p2x)).toBe(true);
    expect(approx(p2Result!.y, config.p2y)).toBe(true);
  });

  it("combined p1 and p2 pattern", () => {
    const builder = new GeometryBuilder<TestConfig>();
    
    const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);
    const cs2 = builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0);
    
    const vec_cs2_to_cs = builder.vector("vec_cs2_to_cs", cs2, cs);
    
    const p1_x = builder.add("p1_x", builder.param("p1x"), vec_cs2_to_cs.dx);
    const p1_y = builder.add("p1_y", builder.param("p1y"), vec_cs2_to_cs.dy);
    const p1 = builder.pointInCs("p1", cs2, p1_x.value, p1_y.value);
    
    const p2_x = builder.add("p2_x", builder.param("p2x"), vec_cs2_to_cs.dx);
    const p2_y = builder.add("p2_y", builder.param("p2y"), vec_cs2_to_cs.dy);
    const p2 = builder.pointInCs("p2", cs2, p2_x.value, p2_y.value);

    const steps = builder.compile();
    const result = executeStepsUtil(steps, { config });
    
    const p1Result = getGeometryValue<Point>(result, "p1");
    const p2Result = getGeometryValue<Point>(result, "p2");
    
    expect(p1Result).toBeDefined();
    expect(p2Result).toBeDefined();
    
    expect(approx(p1Result!.x, config.p1x)).toBe(true);
    expect(approx(p1Result!.y, config.p1y)).toBe(true);
    expect(approx(p2Result!.x, config.p2x)).toBe(true);
    expect(approx(p2Result!.y, config.p2y)).toBe(true);
  });
});
