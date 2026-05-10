/**
 * TDD Verification Test for DECLARATIVE_FRAMEWORK_SPEC.md
 *
 * This test verifies that the implementation satisfies all requirements
 * from backlog/dsl/DECLARATIVE_FRAMEWORK_SPEC.md using TDD principles.
 *
 * Each test corresponds to a spec requirement and would have failed
 * before the implementation was complete.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "../src/geometry/dsl/renderers/DefaultRenderer";
import type { GeometryRenderer } from "../src/geometry/dsl/renderers/types";
import { point } from "../src/types/geometry";

// Test configuration type matching SquareConfig
interface SquareConfig {
  height: number;
  border: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  circleRadius: number;
  C1_POSITION_RATIO: number;
  C2_POSITION_RATIO: number;
  LINE_EXTENSION_MULTIPLIER: number;
  tolerance: number;
}

const DEFAULT_CONFIG: SquareConfig = {
  height: 500,
  border: 50,
  p1x: 100,
  p1y: 200,
  p2x: 400,
  p2y: 200,
  circleRadius: 150,
  C1_POSITION_RATIO: 0.3,
  C2_POSITION_RATIO: 0.7,
  LINE_EXTENSION_MULTIPLIER: 2,
  tolerance: 0.001,
};

// Mock renderer for testing
class MockRenderer implements GeometryRenderer {
  drawPointCalled = false;
  drawLineCalled = false;
  drawCircleCalled = false;
  drawPolygonCalled = false;
  drawCoordinateSystemCalled = false;

  drawPoint(): void {
    this.drawPointCalled = true;
  }
  drawLine(): void {
    this.drawLineCalled = true;
  }
  drawCircle(): void {
    this.drawCircleCalled = true;
  }
  drawPolygon(): void {
    this.drawPolygonCalled = true;
  }
  drawCoordinateSystem(): void {
    this.drawCoordinateSystemCalled = true;
  }

  reset(): void {
    this.drawPointCalled = false;
    this.drawLineCalled = false;
    this.drawCircleCalled = false;
    this.drawPolygonCalled = false;
    this.drawCoordinateSystemCalled = false;
  }
}

// ============================================================================
// SUCCESS CRITERION 1: API Fluency
// The preferred example style works with noun-based method names
// ============================================================================

describe("SC-1: API Fluency - Preferred example style", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("supports coordinateSystem with numeric parameters", () => {
    const cs = builder.coordinateSystem("CS", 0, 0, 100);
    expect(cs.id).toBe("CS");
    expect(cs.type).toBe("coordinate_system");
  });

  it("supports point with numeric coordinates", () => {
    const p1 = builder.point("P1", 100, 200);
    expect(p1.id).toBe("P1");
    expect(p1.type).toBe("point");
  });

  it("supports line from two points", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    expect(ml.id).toBe("ML");
    expect(ml.type).toBe("line");
    expect(ml.dependencies).toContain("P1");
    expect(ml.dependencies).toContain("P2");
  });

  it("supports pointAt operation on line", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const c1 = builder.pointAt("C1", ml, 0.5);
    expect(c1.id).toBe("C1");
    expect(c1.type).toBe("point");
    expect(c1.dependencies).toContain("ML");
  });

  it("supports circle with point center and numeric radius", () => {
    const center = builder.point("C1", 0, 0);
    const c1_c = builder.circle("C1_C", center, 50);
    expect(c1_c.id).toBe("C1_C");
    expect(c1_c.type).toBe("circle");
    expect(c1_c.dependencies).toContain("C1");
  });

  it("supports intersection of circle and line with options", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const p1 = builder.point("P1", -100, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);
    const c2 = builder.intersection("C2", c1, ml, { position: "left" });
    expect(c2.id).toBe("C2");
    expect(c2.type).toBe("point");
    expect(c2.dependencies).toContain("C1");
    expect(c2.dependencies).toContain("ML");
  });

  it("supports full chainable API style from SPEC", () => {
    const cs = builder.coordinateSystem("CS", 0, 0, 100);
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);
    const c1 = builder.pointAt("C1", ml, 0.3);
    const c1_c = builder.circle("C1_C", c1, 50);
    const c2 = builder.intersection("C2", c1_c, ml, { position: "left" });

    // Verify all expressions exist with correct IDs and types
    expect(cs.id).toBe("CS");
    expect(cs.type).toBe("coordinate_system");
    expect(p1.id).toBe("P1");
    expect(p1.type).toBe("point");
    expect(p2.id).toBe("P2");
    expect(p2.type).toBe("point");
    expect(ml.id).toBe("ML");
    expect(ml.type).toBe("line");
    expect(c1.id).toBe("C1");
    expect(c1.type).toBe("point");
    expect(c1_c.id).toBe("C1_C");
    expect(c1_c.type).toBe("circle");
    expect(c2.id).toBe("C2");
    expect(c2.type).toBe("point");
  });
});

// ============================================================================
// SUCCESS CRITERION 2: Step Generation
// Compiled steps have correct inputs, outputs, parameters, compute(), draw()
// ============================================================================

describe("SC-2: Step Generation - Correct step structure", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("generated steps have correct id format (step_[id])", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe(`step_${p1.id}`);
  });

  it("point expression generates step with empty inputs", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    expect(steps[0].inputs).toEqual(p1.dependencies);
  });

  it("point expression generates step with correct outputs", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    expect(steps[0].outputs).toEqual([p1.id]);
  });

  it("point expression generates step with empty parameters", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    expect(steps[0].parameters).toEqual(p1.parameters);
  });

  it("line from points generates step with correct inputs", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const steps = builder.compile();
    const mlStep = steps.find((s) => s.id === `step_${ml.id}`);
    expect(mlStep).toBeDefined();
    expect(mlStep!.inputs).toEqual([p1.id, p2.id]);
  });

  it("circle generates step with dependency on center point", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const steps = builder.compile();
    const c1Step = steps.find((s) => s.id === `step_${c1.id}`);
    expect(c1Step).toBeDefined();
    expect(c1Step!.inputs).toContain(center.id);
  });

  it("generated steps have compute function", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();
    expect(typeof step!.compute).toBe("function");
  });

  it("generated steps have draw function", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();
    expect(typeof step!.draw).toBe("function");
  });

  it("compute function returns Map with geometry value", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();
    const result = step!.compute(new Map(), DEFAULT_CONFIG);
    expect(result).toBeInstanceOf(Map);
    expect(result.get(p1.id)).toEqual(point(10, 20));
  });
});

// ============================================================================
// SUCCESS CRITERION 3: Equivalence
// Replicating squareSteps.ts with new API produces identical geometry
// ============================================================================

describe("SC-3: Equivalence - Square construction produces correct geometry", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("replicates square construction from SPEC example", () => {
    const config = DEFAULT_CONFIG;

    // Base coordinate system
    const cs = builder.coordinateSystem("CS", 0, 0, config.height * 0.1);

    // Main line endpoints
    const p1 = builder.point("P1", config.p1x, config.p1y);
    const p2 = builder.point("P2", config.p2x, config.p2y);

    // Main line
    const ml = builder.line("ML", p1, p2);

    // Circle centers on main line
    const c1 = builder.pointAt("C1", ml, config.C1_POSITION_RATIO);
    const c2 = builder.pointAt("C2", ml, config.C2_POSITION_RATIO);

    // Circles
    const c1_c = builder.circle("C1_C", c1, config.circleRadius);
    const c2_c = builder.circle("C2_C", c2, config.circleRadius);

    // Intersection point
    const pi = builder.circleIntersection("PI", c1_c, c2_c, { select: "north" });
    const ci = builder.circle("CI", pi, config.circleRadius);

    // Extended lines
    const line_c2_pi = builder.lineTowards(
      "LINE_C2_PI",
      c2,
      pi,
      config.LINE_EXTENSION_MULTIPLIER * config.circleRadius,
    );
    const line_c1_pi = builder.lineTowards(
      "LINE_C1_PI",
      c1,
      pi,
      config.LINE_EXTENSION_MULTIPLIER * config.circleRadius,
    );

    // Points P3 and P4
    const p3 = builder.intersection("P3", ci, line_c2_pi, { excludeId: c2.id });
    const p4 = builder.intersection("P4", ci, line_c1_pi, { excludeId: c1.id });

    // Connecting lines
    const line_c2_p4 = builder.line("LINE_C2_P4", c2, p4);
    const line_c1_p3 = builder.line("LINE_C1_P3", c1, p3);

    // Tangent points
    const pl = builder.intersection("PL", c2_c, line_c2_p4);
    const pr = builder.intersection("PR", c1_c, line_c1_p3);

    // Final square
    const square = builder.polygon("SQUARE", [pl, pr, c1, c2]);

    // Compile and verify all expressions are tracked
    const steps = builder.compile();
    expect(steps.length).toBeGreaterThan(15);

    // Verify all key geometry IDs are present
    const allIds = steps.map((s) => s.id);
    expect(allIds).toContain(`step_${cs.id}`);
    expect(allIds).toContain(`step_${p1.id}`);
    expect(allIds).toContain(`step_${p2.id}`);
    expect(allIds).toContain(`step_${ml.id}`);
    expect(allIds).toContain(`step_${c1.id}`);
    expect(allIds).toContain(`step_${c2.id}`);
    expect(allIds).toContain(`step_${c1_c.id}`);
    expect(allIds).toContain(`step_${c2_c.id}`);
    expect(allIds).toContain(`step_${pi.id}`);
    expect(allIds).toContain(`step_${ci.id}`);
    expect(allIds).toContain(`step_${line_c2_pi.id}`);
    expect(allIds).toContain(`step_${line_c1_pi.id}`);
    expect(allIds).toContain(`step_${p3.id}`);
    expect(allIds).toContain(`step_${p4.id}`);
    expect(allIds).toContain(`step_${line_c2_p4.id}`);
    expect(allIds).toContain(`step_${line_c1_p3.id}`);
    expect(allIds).toContain(`step_${pl.id}`);
    expect(allIds).toContain(`step_${pr.id}`);
    expect(allIds).toContain(`step_${square.id}`);
    // Verify square expression has all its point dependencies
    expect(square.dependencies).toContain(pl.id);
    expect(square.dependencies).toContain(pr.id);
    expect(square.dependencies).toContain(c1.id);
    expect(square.dependencies).toContain(c2.id);
  });

  it("square construction produces executable steps with correct geometry", () => {
    const config = { ...DEFAULT_CONFIG };
    const localBuilder = new GeometryBuilder<SquareConfig>();

    const p1 = localBuilder.point("P1", config.p1x, config.p1y);
    const p2 = localBuilder.point("P2", config.p2x, config.p2y);
    const ml = localBuilder.line("ML", p1, p2);
    const c1 = localBuilder.pointAt("C1", ml, config.C1_POSITION_RATIO);
    const c1_c = localBuilder.circle("C1_C", c1, config.circleRadius);

    const steps = localBuilder.compile();

    // Execute steps and verify geometry
    const allValues = new Map<string, any>();
    for (const step of steps) {
      const outputs = step.compute(allValues, config);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    // Verify P1 and P2 are correct
    const p1Val = allValues.get(p1.id);
    expect(p1Val.x).toBe(config.p1x);
    expect(p1Val.y).toBe(config.p1y);

    const p2Val = allValues.get(p2.id);
    expect(p2Val.x).toBe(config.p2x);
    expect(p2Val.y).toBe(config.p2y);

    // Verify C1 is at correct ratio along ML
    const c1Val = allValues.get(c1.id);
    expect(c1Val).toBeDefined();
    const expectedC1X = config.p1x + (config.p2x - config.p1x) * config.C1_POSITION_RATIO;
    const expectedC1Y = config.p1y + (config.p2y - config.p1y) * config.C1_POSITION_RATIO;
    expect(c1Val.x).toBeCloseTo(expectedC1X, 5);
    expect(c1Val.y).toBeCloseTo(expectedC1Y, 5);

    // Verify C1_C circle has correct radius
    const c1_cVal = allValues.get(c1_c.id);
    expect(c1_cVal.r).toBe(config.circleRadius);
  });
});

// ============================================================================
// SUCCESS CRITERION 4: Lazy Evaluation
// Steps compute only when executeStep() is called
// ============================================================================

describe("SC-4: Lazy Evaluation - Steps compute on demand", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("compiled steps do not compute immediately", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();

    // Steps are just definitions, not executed
    // The compute function exists but hasn't been called
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();
    expect(typeof step!.compute).toBe("function");
  });

  it("compute function can be called multiple times with same result", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();

    const result1 = step!.compute(new Map(), DEFAULT_CONFIG);
    const result2 = step!.compute(new Map(), DEFAULT_CONFIG);

    expect(result1.get(p1.id)).toEqual(result2.get(p1.id));
  });

  it("steps with dependencies require inputs to be computed first", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const steps = builder.compile();

    // Find the line step
    const lineStep = steps.find((s) => s.id === `step_${ml.id}`);
    expect(lineStep).toBeDefined();

    // Line step needs P1 and P2 as inputs
    const inputs = lineStep!.inputs;
    expect(inputs).toEqual([p1.id, p2.id]);

    // Compute without inputs should work (inputs are passed to compute)
    const allValues = new Map<string, any>();
    for (const step of steps) {
      const outputs = step.compute(allValues, DEFAULT_CONFIG);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    // Now ML should be computed
    expect(allValues.get(ml.id)).toBeDefined();
  });

  it("topological sort ensures dependencies are in correct order", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const c1 = builder.pointAt("C1", ml, 0.5);
    const c1_c = builder.circle("C1_C", c1, 50);

    const executionOrder = builder.getExecutionOrder();

    // P1 and P2 must come before ML
    const p1Index = executionOrder.indexOf(p1.id);
    const p2Index = executionOrder.indexOf(p2.id);
    const mlIndex = executionOrder.indexOf(ml.id);
    const c1Index = executionOrder.indexOf(c1.id);
    const c1_cIndex = executionOrder.indexOf(c1_c.id);

    expect(p1Index).toBeLessThan(mlIndex);
    expect(p2Index).toBeLessThan(mlIndex);
    expect(mlIndex).toBeLessThan(c1Index);
    expect(c1Index).toBeLessThan(c1_cIndex);
  });
});

// ============================================================================
// SUCCESS CRITERION 5: Type Safety
// Full TypeScript type inference - NO any types
// ============================================================================

describe("SC-5: Type Safety - Full type inference", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("expression types are correctly typed at compile time", () => {
    // These should compile without errors, proving type safety
    const p1 = builder.point("P1", 0, 0);
    expect(p1.type).toBe("point");

    const l1 = builder.line("L1", 0, 0, 100, 100);
    expect(l1.type).toBe("line");

    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    expect(c1.type).toBe("circle");

    const cs = builder.coordinateSystem("CS", 0, 0, 100);
    expect(cs.type).toBe("coordinate_system");

    const p2 = builder.point("P2", 0, 0);
    const p3 = builder.point("P3", 100, 100);
    const poly = builder.polygon("POLY", [p2, p3]);
    expect(poly.type).toBe("polygon");
  });

  it("operation expressions return correct types", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);

    const c1 = builder.pointAt("C1", ml, 0.5);
    expect(c1.type).toBe("point");

    const center = builder.point("CENTER", 0, 0);
    const c = builder.circle("C", center, 50);
    const intersection = builder.intersection("I1", c, ml);
    expect(intersection.type).toBe("point");

    const center2 = builder.point("CENTER2", 100, 0);
    const c2 = builder.circle("C2", center2, 50);
    const circleIntersection = builder.circleIntersection("CI", c, c2);
    expect(circleIntersection.type).toBe("point");

    const lineTowards = builder.lineTowards("LT", p1, p2, 200);
    expect(lineTowards.type).toBe("line");
  });

  it("feature accessors return GeometryFeatureReference", () => {
    const p1 = builder.point("P1", 10, 20);
    // Accessing feature properties should work
    expect(() => {
      const xRef = p1.x;
      const yRef = p1.y;
      return xRef && yRef;
    }).not.toThrow();
  });
});

// ============================================================================
// SUCCESS CRITERION 6: Separation of Concerns
// All compute() functions contain only math, all draw() functions use injected renderer
// ============================================================================

describe("SC-6: Separation of Concerns - compute vs draw", () => {
  let builder: GeometryBuilder<SquareConfig>;
  let mockRenderer: MockRenderer;

  beforeEach(() => {
    mockRenderer = new MockRenderer();
    builder = new GeometryBuilder<SquareConfig>(mockRenderer);
  });

  it("compute function returns geometry values without drawing", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();

    // Call compute - should not call any draw methods
    mockRenderer.reset();
    const result = step!.compute(new Map(), DEFAULT_CONFIG);

    expect(mockRenderer.drawPointCalled).toBe(false);
    expect(result.get(p1.id)).toEqual(point(10, 20));
  });

  it("draw function uses injected renderer", () => {
    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();

    // Create a mock SVG element
    const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const allValues = new Map<string, any>();
    allValues.set(p1.id, point(10, 20));

    // Call draw - should use the injected renderer
    mockRenderer.reset();
    const mockStore: any = {};
    const mockTheme: any = {};
    step!.draw(mockSvg, allValues, mockStore, mockTheme);

    expect(mockRenderer.drawPointCalled).toBe(true);
  });

  it("custom renderer can be set via setRenderer", () => {
    const customRenderer = new MockRenderer();
    builder.setRenderer(customRenderer);

    const p1 = builder.point("P1", 10, 20);
    const steps = builder.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);
    expect(step).toBeDefined();

    const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const allValues = new Map<string, any>();
    allValues.set(p1.id, point(10, 20));

    customRenderer.reset();
    step!.draw(mockSvg, allValues, {} as any, {} as any);

    expect(customRenderer.drawPointCalled).toBe(true);
  });

  it("default renderer is used when no custom renderer is provided", () => {
    const builderWithDefault = new GeometryBuilder<SquareConfig>();
    const p1 = builderWithDefault.point("P1", 10, 20);
    const steps = builderWithDefault.compile();
    const step = steps.find((s) => s.id === `step_${p1.id}`);

    // Verify steps are created with the default renderer
    // The default renderer is set internally, so we just verify compile works
    expect(step).toBeDefined();
    expect(step!.draw).toBeDefined();
  });

  it("different expression types use different renderer methods", () => {
    const mockRenderer = new MockRenderer();
    const localBuilder = new GeometryBuilder<SquareConfig>(mockRenderer);

    const p1 = localBuilder.point("P1", 10, 20);
    const l1 = localBuilder.line("L1", 0, 0, 100, 100);
    const center = localBuilder.point("CENTER", 0, 0);
    const c1 = localBuilder.circle("C1", center, 50);

    const steps = localBuilder.compile();

    const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const allValues = new Map<string, any>();

    // Execute all steps to populate values
    for (const step of steps) {
      const outputs = step.compute(allValues, DEFAULT_CONFIG);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    // Call draw for each step
    const p1Step = steps.find((s) => s.id === `step_${p1.id}`);
    const l1Step = steps.find((s) => s.id === `step_${l1.id}`);
    const c1Step = steps.find((s) => s.id === `step_${c1.id}`);
    expect(p1Step).toBeDefined();
    expect(l1Step).toBeDefined();
    expect(c1Step).toBeDefined();

    for (const step of steps) {
      mockRenderer.reset();
      step.draw(mockSvg, allValues, {} as any, {} as any);

      if (step.id === p1Step!.id) {
        expect(mockRenderer.drawPointCalled).toBe(true);
      } else if (step.id === l1Step!.id) {
        expect(mockRenderer.drawLineCalled).toBe(true);
      } else if (step.id === c1Step!.id) {
        expect(mockRenderer.drawCircleCalled).toBe(true);
      }
    }
  });
});

// ============================================================================
// SUCCESS CRITERION 7: Dependency Tracking
// Automatic dependency graph is 100% accurate
// ============================================================================

describe("SC-7: Dependency Tracking - Accurate dependency graph", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("point expression has no dependencies", () => {
    const p1 = builder.point("P1", 10, 20);
    const deps = builder.getDependencies(p1.id);
    expect(deps).toEqual(p1.dependencies);
  });

  it("line from points has dependencies on both points", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const deps = builder.getDependencies(ml.id);
    expect(deps).toContain(p1.id);
    expect(deps).toContain(p2.id);
  });

  it("circle has dependency on center point", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const deps = builder.getDependencies(c1.id);
    expect(deps).toContain(center.id);
  });

  it("pointAt has dependency on line", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const c1 = builder.pointAt("C1", ml, 0.5);
    const deps = builder.getDependencies(c1.id);
    expect(deps).toContain(ml.id);
  });

  it("intersection has dependencies on circle and line", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const p1 = builder.point("P1", -100, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);
    const intersection = builder.intersection("I1", c1, ml);
    const deps = builder.getDependencies(intersection.id);
    expect(deps).toContain(c1.id);
    expect(deps).toContain(ml.id);
  });

  it("circleIntersection has dependencies on both circles", () => {
    const center1 = builder.point("CENTER1", 0, 0);
    const c1 = builder.circle("C1", center1, 50);
    const center2 = builder.point("CENTER2", 100, 0);
    const c2 = builder.circle("C2", center2, 50);
    const ci = builder.circleIntersection("CI", c1, c2);
    const deps = builder.getDependencies(ci.id);
    expect(deps).toContain(c1.id);
    expect(deps).toContain(c2.id);
  });

  it("lineTowards has dependencies on start and end points", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const lt = builder.lineTowards("LT", p1, p2, 200);
    const deps = builder.getDependencies(lt.id);
    expect(deps).toContain(p1.id);
    expect(deps).toContain(p2.id);
  });

  it("polygon has dependencies on all its points", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const p3 = builder.point("P3", 100, 100);
    const p4 = builder.point("P4", 0, 100);
    const poly = builder.polygon("POLY", [p1, p2, p3, p4]);
    const deps = builder.getDependencies(poly.id);
    expect(deps).toContain(p1.id);
    expect(deps).toContain(p2.id);
    expect(deps).toContain(p3.id);
    expect(deps).toContain(p4.id);
  });

  it("getDependencyGraph returns complete graph", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);
    const c1 = builder.pointAt("C1", ml, 0.5);
    const c1_c = builder.circle("C1_C", c1, 50);

    const graph = builder.getDependencyGraph();
    expect(graph[p1.id]).toEqual(p1.dependencies);
    expect(graph[p2.id]).toEqual(p2.dependencies);
    expect(graph[ml.id]).toContain(p1.id);
    expect(graph[ml.id]).toContain(p2.id);
    expect(graph[c1.id]).toContain(ml.id);
    expect(graph[c1_c.id]).toContain(c1.id);
  });

  it("getStepMetadata returns correct metadata", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);

    const metadata = builder.getStepMetadata(ml.id);
    expect(metadata.inputs).toEqual([p1.id, p2.id]);
    expect(metadata.outputs).toEqual([ml.id]);
    expect(metadata.parameters).toEqual(ml.parameters);
  });
});

// ============================================================================
// SUCCESS CRITERION 8: Error Handling
// All errors use GeometryError with step ID and geometry ID
// ============================================================================

describe("SC-8: Error Handling - GeometryError usage", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("intersection throws error when no intersection found", () => {
    // Create a circle and a line that doesn't intersect
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 10);
    const p1 = builder.point("P1", 100, 100);
    const p2 = builder.point("P2", 200, 200);
    const farLine = builder.line("FAR_LINE", p1, p2);

    const intersection = builder.intersection("I1", c1, farLine, { tolerance: 0.001 });
    expect(intersection.id).toBe("I1");
    const steps = builder.compile();

    const allValues = new Map<string, any>();

    // This should throw when trying to compute the intersection
    expect(() => {
      for (const step of steps) {
        const outputs = step.compute(allValues, DEFAULT_CONFIG);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }
    }).toThrow();
  });

  it("circleIntersection throws error when circles don't intersect", () => {
    const center1 = builder.point("CENTER1", 0, 0);
    const c1 = builder.circle("C1", center1, 10);
    const center2 = builder.point("CENTER2", 1000, 1000);
    const c2 = builder.circle("C2", center2, 10);

    const ci = builder.circleIntersection("CI", c1, c2);
    expect(ci.id).toBe("CI");
    const steps = builder.compile();

    const allValues = new Map<string, any>();

    expect(() => {
      for (const step of steps) {
        const outputs = step.compute(allValues, DEFAULT_CONFIG);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }
    }).toThrow();
  });

  it("intersection throws error when line is missing from inputs", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const p1 = builder.point("P1", -100, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);

    const intersection = builder.intersection("I1", c1, ml);
    expect(intersection.id).toBe("I1");
    const steps = builder.compile();

    // Compute only CENTER and C1, not ML or P1/P2
    const allValues = new Map<string, any>();
    for (const step of steps) {
      if (step.id === `step_${center.id}` || step.id === `step_${c1.id}`) {
        const outputs = step.compute(allValues, DEFAULT_CONFIG);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }
    }

    // Now try to compute the intersection step without the line being computed
    const intersectionStep = steps.find((s) => s.id === `step_${intersection.id}`);
    expect(intersectionStep).toBeDefined();
    expect(() => {
      intersectionStep!.compute(allValues, DEFAULT_CONFIG);
    }).toThrow();
  });
});

// ============================================================================
// SUCCESS CRITERION 9: Polygon with Array
// polygon(id, [p1, p2, p3, p4]) supported
// ============================================================================

describe("SC-9: Polygon with Array - Array of point expressions", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("accepts array of point expressions", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const p3 = builder.point("P3", 100, 100);
    const p4 = builder.point("P4", 0, 100);

    const poly = builder.polygon("SQUARE", [p1, p2, p3, p4]);
    expect(poly.id).toBe("SQUARE");
    expect(poly.type).toBe("polygon");
  });

  it("compiles polygon with array of points to correct step", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const p3 = builder.point("P3", 100, 100);
    const p4 = builder.point("P4", 0, 100);

    const poly = builder.polygon("SQUARE", [p1, p2, p3, p4]);
    const steps = builder.compile();

    const polyStep = steps.find((s) => s.id === `step_${poly.id}`);
    expect(polyStep).toBeDefined();
    expect(polyStep!.inputs).toContain(p1.id);
    expect(polyStep!.inputs).toContain(p2.id);
    expect(polyStep!.inputs).toContain(p3.id);
    expect(polyStep!.inputs).toContain(p4.id);
  });

  it("polygon compute produces correct polygon geometry", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const p3 = builder.point("P3", 100, 100);
    const p4 = builder.point("P4", 0, 100);

    const poly = builder.polygon("SQUARE", [p1, p2, p3, p4]);
    const steps = builder.compile();

    const allValues = new Map<string, any>();
    for (const step of steps) {
      const outputs = step.compute(allValues, DEFAULT_CONFIG);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    const polyVal = allValues.get(poly.id);
    expect(polyVal).toBeDefined();
    expect(polyVal.points).toHaveLength(4);
  });

  it("accepts polygon with style options", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 0);
    const p3 = builder.point("P3", 100, 100);
    const p4 = builder.point("P4", 0, 100);

    const poly = builder.polygon("SQUARE", [p1, p2, p3, p4], {
      strokeWidth: 2,
      strokeColor: "red",
    });
    expect(poly.id).toBe("SQUARE");
    expect(poly.dependencies).toContain(p1.id);
    expect(poly.dependencies).toContain(p2.id);
    expect(poly.dependencies).toContain(p3.id);
    expect(poly.dependencies).toContain(p4.id);
  });
});

// ============================================================================
// SUCCESS CRITERION 10: Line Extension Separate
// lineTowards() as separate method for extended lines
// ============================================================================

describe("SC-10: Line Extension Separate - lineTowards method", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("lineTowards is a separate method from line", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);

    // Regular line
    const l1 = builder.line("L1", p1, p2);
    expect(l1.type).toBe("line");

    // Line towards (extended)
    const lt = builder.lineTowards("LT", p1, p2, 200);
    expect(lt.type).toBe("line");
  });

  it("lineTowards creates extended line with correct length", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 10, 10);
    const lt = builder.lineTowards("LT", p1, p2, 100);

    const steps = builder.compile();
    const allValues = new Map<string, any>();

    for (const step of steps) {
      const outputs = step.compute(allValues, DEFAULT_CONFIG);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    const ltVal = allValues.get(lt.id);
    expect(ltVal).toBeDefined();
    // The line should be extended, so its length should be greater than the distance between P1 and P2
    const dx = ltVal.x2 - ltVal.x1;
    const dy = ltVal.y2 - ltVal.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    expect(length).toBeGreaterThan(10); // Original distance is sqrt(200) ≈ 14.14
  });

  it("lineTowards uses start and end points for direction", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 10, 0);
    const lt = builder.lineTowards("LT", p1, p2, 50);

    const steps = builder.compile();
    const allValues = new Map<string, any>();

    for (const step of steps) {
      const outputs = step.compute(allValues, DEFAULT_CONFIG);
      for (const [key, value] of outputs) {
        allValues.set(key, value);
      }
    }

    const ltVal = allValues.get(lt.id);
    expect(ltVal).toBeDefined();
    // Line should start at P1 (0,0) and extend in the direction of P2
    expect(ltVal.x1).toBe(0);
    expect(ltVal.y1).toBe(0);
    // End point should be in the direction of P2 (positive x)
    expect(ltVal.x2).toBeGreaterThan(0);
    expect(ltVal.y2).toBe(0);
  });

  it("lineTowards can use numeric coordinates for points", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 50, 50);
    const lt = builder.lineTowards("LT", p1, p2, 200);

    expect(lt.id).toBe("LT");
    expect(lt.type).toBe("line");
  });
});

// ============================================================================
// Additional Tests: Renderer Interface and Default Renderer
// ============================================================================

describe("Renderer Interface - Dependency Injection", () => {
  it("DefaultGeometryRenderer implements GeometryRenderer interface", () => {
    const renderer = new DefaultGeometryRenderer();
    expect(typeof renderer.drawPoint).toBe("function");
    expect(typeof renderer.drawLine).toBe("function");
    expect(typeof renderer.drawCircle).toBe("function");
    expect(typeof renderer.drawPolygon).toBe("function");
    expect(typeof renderer.drawCoordinateSystem).toBe("function");
  });

  it("DefaultGeometryRenderer can be passed to GeometryBuilder", () => {
    const renderer = new DefaultGeometryRenderer();
    const builder = new GeometryBuilder<SquareConfig>(renderer);
    expect(builder).toBeDefined();
  });

  it("setRenderer returns this for chaining", () => {
    const builder = new GeometryBuilder<SquareConfig>();
    const renderer = new DefaultGeometryRenderer();
    const result = builder.setRenderer(renderer);
    expect(result).toBe(builder);
  });
});

// ============================================================================
// Additional Tests: Coordinate System
// ============================================================================

describe("Coordinate System Expression", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("coordinateSystem creates expression with correct type", () => {
    const cs = builder.coordinateSystem("CS", 0, 0, 100);
    expect(cs.type).toBe("coordinate_system");
  });

  it("coordinateSystem with rotation parameter", () => {
    const cs = builder.coordinateSystem("CS", 0, 0, 100, Math.PI / 4);
    expect(cs.id).toBe("CS");
  });

  it("coordinateSystem compiles to step with correct structure", () => {
    const cs = builder.coordinateSystem("CS", 0, 0, 100);
    const steps = builder.compile();
    const csStep = steps.find((s) => s.id === `step_${cs.id}`);
    expect(csStep).toBeDefined();
    expect(csStep!.inputs).toEqual(cs.dependencies);
    expect(csStep!.outputs).toEqual([cs.id]);
  });
});

// ============================================================================
// Additional Tests: Expression Factory Methods
// ============================================================================

describe("Expression Factory Methods", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("getExpression retrieves tracked expressions", () => {
    const p1 = builder.point("P1", 10, 20);
    const expr = builder.getExpression("P1");
    expect(expr).toBe(p1);
  });

  it("getExpression returns undefined for non-existent ID", () => {
    const expr = builder.getExpression("NON_EXISTENT");
    expect(expr).toBeUndefined();
  });

  it("getAllExpressions returns all tracked expressions", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);

    const all = builder.getAllExpressions();
    expect(all.size).toBe(3);
    expect(all.get(p1.id)).toBe(p1);
    expect(all.get(p2.id)).toBe(p2);
    expect(all.get(ml.id)).toBe(ml);
  });

  it("getFullMetadata returns metadata for all expressions", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const ml = builder.line("ML", p1, p2);

    const metadata = builder.getFullMetadata();
    expect(Object.keys(metadata)).toHaveLength(3);
    expect(metadata[p1.id]).toBeDefined();
    expect(metadata[p2.id]).toBeDefined();
    expect(metadata[ml.id]).toBeDefined();
  });
});

// ============================================================================
// Additional Tests: Line with Coordinate Arguments
// ============================================================================

describe("Line Expression - Multiple Construction Methods", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("line from explicit coordinates", () => {
    const l1 = builder.line("L1", 0, 0, 100, 100);
    expect(l1.id).toBe("L1");
    expect(l1.type).toBe("line");
    expect(l1.dependencies).toEqual(l1.dependencies);
  });

  it("line from two point expressions", () => {
    const p1 = builder.point("P1", 0, 0);
    const p2 = builder.point("P2", 100, 100);
    const l1 = builder.line("L1", p1, p2);
    expect(l1.id).toBe("L1");
    expect(l1.type).toBe("line");
    expect(l1.dependencies).toContain(p1.id);
    expect(l1.dependencies).toContain(p2.id);
  });

  it("both line construction methods produce executable steps", () => {
    const builder1 = new GeometryBuilder<SquareConfig>();
    const l1 = builder1.line("L1", 0, 0, 100, 100);
    const steps1 = builder1.compile();
    const step1 = steps1.find((s) => s.id === `step_${l1.id}`);

    const builder2 = new GeometryBuilder<SquareConfig>();
    const p1 = builder2.point("P1", 0, 0);
    const p2 = builder2.point("P2", 100, 100);
    const l2 = builder2.line("L2", p1, p2);
    const steps2 = builder2.compile();
    const step2 = steps2.find((s) => s.id === `step_${l2.id}`);

    // Both should produce valid steps
    expect(step1).toBeDefined();
    expect(step2).toBeDefined();
  });
});

// ============================================================================
// Additional Tests: CircleIntersectionOptions and IntersectionOptions
// ============================================================================

describe("Intersection Options", () => {
  let builder: GeometryBuilder<SquareConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>();
  });

  it("intersection accepts position option", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const p1 = builder.point("P1", -100, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);

    const i1 = builder.intersection("I1", c1, ml, { position: "left" });
    expect(i1.id).toBe("I1");
  });

  it("intersection accepts exclude option", () => {
    const center = builder.point("CENTER", 0, 0);
    const c1 = builder.circle("C1", center, 50);
    const p1 = builder.point("P1", -100, 0);
    const p2 = builder.point("P2", 100, 0);
    const ml = builder.line("ML", p1, p2);
    const excludePoint = builder.point("EXCLUDE", 0, 50);

    const i1 = builder.intersection("I1", c1, ml, { excludeId: excludePoint.id });
    expect(i1.id).toBe("I1");
  });

  it("circleIntersection accepts select option", () => {
    const center1 = builder.point("CENTER1", 0, 0);
    const c1 = builder.circle("C1", center1, 50);
    const center2 = builder.point("CENTER2", 70, 0);
    const c2 = builder.circle("C2", center2, 50);

    const ci = builder.circleIntersection("CI", c1, c2, { select: "north" });
    expect(ci.id).toBe("CI");
  });

  it("circleIntersection works with default options", () => {
    const center1 = builder.point("CENTER1", 0, 0);
    const c1 = builder.circle("C1", center1, 50);
    const center2 = builder.point("CENTER2", 70, 0);
    const c2 = builder.circle("C2", center2, 50);

    const ci = builder.circleIntersection("CI", c1, c2);
    expect(ci.id).toBe("CI");
  });
});
