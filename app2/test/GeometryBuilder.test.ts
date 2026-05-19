// Unit tests for GeometryBuilder class
// Tests: Expression tracking, dependency graph, compilation, renderer injection

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers";
import { TestGeometryRenderer, createTestContext, executeSteps } from "./dsl-test-utils";
import type { GeometryValue } from "@/types/geometry";

// Test configuration type
interface TestConfig {
  tolerance: number;
  customParam?: string;
}

const defaultConfig: TestConfig = {
  tolerance: 0.001,
};

describe("GeometryBuilder", () => {
  let builder: GeometryBuilder<TestConfig>;
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>();
    ctx = createTestContext();
  });

  // ========================================================================
  // Construction and Initialization
  // ========================================================================

  describe("Construction and Initialization", () => {
    it("creates empty builder with default renderer", () => {
      expect(builder).toBeDefined();
      const _p1 = builder.point("P1", 10, 20);
      const step = _p1.compile(ctx.renderer);
      expect(typeof step.draw).toBe("function");
    });

    it("accepts custom renderer via constructor", () => {
      const customRenderer = new TestGeometryRenderer();
      const builderWithRenderer = new GeometryBuilder<TestConfig>(customRenderer);

      const _p1 = builderWithRenderer.point("P1", 10, 20);
      const step = _p1.compile(customRenderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(customRenderer.drawnPoints).toContain("P1");
    });
  });

  // ========================================================================
  // Renderer Injection
  // ========================================================================

  describe("Renderer Injection", () => {
    it("setRenderer updates the renderer", () => {
      const customRenderer = new TestGeometryRenderer();
      builder.setRenderer(customRenderer);

      const _p1 = builder.point("P1", 10, 20);
      const step = _p1.compile(customRenderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(customRenderer.drawnPoints).toContain("P1");
    });

    it("setRenderer returns this for chaining", () => {
      const customRenderer = new TestGeometryRenderer();
      const result = builder.setRenderer(customRenderer);
      expect(result).toBe(builder);
    });

    it("uses DefaultGeometryRenderer by default", () => {
      const _p1 = builder.point("P1", 10, 20);
      const step = _p1.compile(new DefaultGeometryRenderer());

      // Need to provide the computed value for draw to work
      const values = new Map<string, GeometryValue>([["P1", { type: "point", x: 10, y: 20 }]]);

      expect(() => {
        step.draw(ctx.svg, values, ctx.store, ctx.theme);
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Expression Tracking
  // ========================================================================

  describe("Expression Tracking", () => {
    it("tracks primitive point expression", () => {
      const p1 = builder.point("P1", 10, 20);
      const expr = builder.getExpression("P1");
      expect(expr).toBe(p1);
    });

    it("tracks primitive line expression", () => {
      const l1 = builder.line("L1", 0, 0, 100, 100);
      const expr = builder.getExpression("L1");
      expect(expr).toBe(l1);
    });

    it("tracks primitive circle expression", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);
      const expr = builder.getExpression("C1");
      expect(expr).toBe(c1);
    });

    it("tracks operation pointAt expression", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);
      const expr = builder.getExpression("PA");
      expect(expr).toBe(pa);
    });

    it("tracks operation intersection expression", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1);
      const expr = builder.getExpression("IX");
      expect(expr).toBe(ix);
    });

    it("returns undefined for unknown expression ID", () => {
      const expr = builder.getExpression("NONEXISTENT");
      expect(expr).toBeUndefined();
    });

    it("tracks multiple expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const c1 = builder.circle("C1", p1, 50);

      expect(builder.getExpression("P1")).toBe(p1);
      expect(builder.getExpression("P2")).toBe(p2);
      expect(builder.getExpression("L1")).toBe(l1);
      expect(builder.getExpression("C1")).toBe(c1);
    });
  });

  // ========================================================================
  // Dependency Graph Methods
  // ========================================================================

  describe("Dependency Graph Methods", () => {
    it("getDependencies returns correct dependencies for point", () => {
      builder.point("P1", 10, 20);
      const deps = builder.getDependencies("P1");
      expect(deps).toEqual([]);
    });

    it("getDependencies returns correct dependencies for line from coordinates", () => {
      builder.line("L1", 0, 0, 100, 100);
      const deps = builder.getDependencies("L1");
      expect(deps).toEqual([]);
    });

    it("getDependencies returns correct dependencies for line from points", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);
      const deps = builder.getDependencies("L1");
      expect(deps).toEqual(["P1", "P2"]);
    });

    it("getDependencies returns correct dependencies for circle", () => {
      const p1 = builder.point("P1", 50, 50);
      builder.circle("C1", p1, 25);
      const deps = builder.getDependencies("C1");
      expect(deps).toEqual(["P1"]);
    });

    it("getDependencies returns correct dependencies for pointAt", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      builder.pointAt("PA", l1, 0.5);
      const deps = builder.getDependencies("PA");
      expect(deps).toEqual(["L1"]);
    });

    it("getDependencies returns correct dependencies for intersection", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      builder.intersection("IX", c1, l1);
      const deps = builder.getDependencies("IX");
      expect(deps).toContain("C1");
      expect(deps).toContain("L1");
    });

    it("getDependencies returns correct dependencies for circleIntersection", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      builder.circleIntersection("CIX", c1, c2);
      const deps = builder.getDependencies("CIX");
      expect(deps).toEqual(["C1", "C2"]);
    });

    it("getDependencies returns correct dependencies for lineTowards", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 50, 50);
      builder.lineTowards("LT", p1, p2, 200);
      const deps = builder.getDependencies("LT");
      expect(deps).toEqual(["P1", "P2"]);
    });

    it("getDependencyGraph returns full graph", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);
      builder.circle("C1", p1, 50);
      builder.pointAt("PA", builder.getExpression("L1")!, 0.5);

      const graph = builder.getDependencyGraph();
      expect(graph.P1).toEqual([]);
      expect(graph.P2).toEqual([]);
      expect(graph.L1).toEqual(["P1", "P2"]);
      expect(graph.C1).toEqual(["P1"]);
      expect(graph.PA).toEqual(["L1"]);
    });

    it("getStepMetadata returns correct metadata", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);

      const meta = builder.getStepMetadata("L1");
      expect(meta.inputs).toEqual(["P1", "P2"]);
      expect(meta.outputs).toEqual(["L1"]);
    });

    it("getFullMetadata returns metadata for all expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);

      const fullMeta = builder.getFullMetadata();
      expect(fullMeta.P1).toBeDefined();
      expect(fullMeta.P2).toBeDefined();
      expect(fullMeta.L1).toBeDefined();
    });
  });

  // ========================================================================
  // Topological Sort / Execution Order
  // ========================================================================

  describe("Execution Order (Topological Sort)", () => {
    it("returns correct order for independent expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);

      const order = builder.getExecutionOrder();
      expect(order).toContain("P1");
      expect(order).toContain("P2");
      expect(order).toContain("L1");

      // P1 and P2 should come before L1
      const idxP1 = order.indexOf("P1");
      const idxP2 = order.indexOf("P2");
      const idxL1 = order.indexOf("L1");
      expect(idxP1).toBeLessThan(idxL1);
      expect(idxP2).toBeLessThan(idxL1);
    });

    it("returns correct order for chain of dependencies", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      builder.pointAt("PA", l1, 0.5);

      const order = builder.getExecutionOrder();

      const idxP1 = order.indexOf("P1");
      const idxP2 = order.indexOf("P2");
      const idxL1 = order.indexOf("L1");
      const idxPA = order.indexOf("PA");

      // P1, P2 before L1 before PA
      expect(idxP1).toBeLessThan(idxL1);
      expect(idxP2).toBeLessThan(idxL1);
      expect(idxL1).toBeLessThan(idxPA);
    });

    it("returns correct order for diamond dependency pattern", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      builder.circleIntersection("CIX", c1, c2);

      const order = builder.getExecutionOrder();

      const idxP1 = order.indexOf("P1");
      const idxP2 = order.indexOf("P2");
      const idxC1 = order.indexOf("C1");
      const idxC2 = order.indexOf("C2");
      const idxCIX = order.indexOf("CIX");

      // P1 before C1, P2 before C2, both C1 and C2 before CIX
      expect(idxP1).toBeLessThan(idxC1);
      expect(idxP2).toBeLessThan(idxC2);
      expect(idxC1).toBeLessThan(idxCIX);
      expect(idxC2).toBeLessThan(idxCIX);
    });

    it("handles empty builder", () => {
      const order = builder.getExecutionOrder();
      expect(order).toEqual([]);
    });

    it("returns correct order for polygon with point dependencies", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      builder.polygon("POLY", [p1, p2, p3, p4]);

      const order = builder.getExecutionOrder();

      // All points should come before polygon
      const idxPoly = order.indexOf("POLY");
      expect(order.indexOf("P1")).toBeLessThan(idxPoly);
      expect(order.indexOf("P2")).toBeLessThan(idxPoly);
      expect(order.indexOf("P3")).toBeLessThan(idxPoly);
      expect(order.indexOf("P4")).toBeLessThan(idxPoly);
    });
  });

  // ========================================================================
  // Compilation
  // ========================================================================

  describe("Compilation", () => {
    it("compile returns empty array for empty builder", () => {
      const steps = builder.compile();
      expect(steps).toEqual([]);
    });

    it("compile returns Step array in correct order", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      builder.line("L1", p1, p2);

      const steps = builder.compile();
      expect(steps).toHaveLength(3);

      // Steps should be in dependency order
      const stepIds = steps.map((s) => s.id);
      expect(stepIds).toContain("step_P1");
      expect(stepIds).toContain("step_P2");
      expect(stepIds).toContain("step_L1");

      // P1 and P2 should come before L1
      const idxStepP1 = stepIds.indexOf("step_P1");
      const idxStepP2 = stepIds.indexOf("step_P2");
      const idxStepL1 = stepIds.indexOf("step_L1");
      expect(idxStepP1).toBeLessThan(idxStepL1);
      expect(idxStepP2).toBeLessThan(idxStepL1);
    });

    it("compile produces Steps with correct inputs and outputs", () => {
      const p1 = builder.point("P1", 10, 20);
      const p2 = builder.point("P2", 30, 40);
      builder.line("L1", p1, p2);

      const steps = builder.compile();

      const stepP1 = steps.find((s) => s.id === "step_P1");
      const stepP2 = steps.find((s) => s.id === "step_P2");
      const stepL1 = steps.find((s) => s.id === "step_L1");

      expect(stepP1).toBeDefined();
      expect(stepP2).toBeDefined();
      expect(stepL1).toBeDefined();

      expect(Array.from(stepP1!.inputs)).toEqual([]);
      expect(Array.from(stepP1!.outputs)).toEqual(["P1"]);

      expect(Array.from(stepL1!.inputs)).toEqual(["P1", "P2"]);
      expect(Array.from(stepL1!.outputs)).toEqual(["L1"]);
    });

    it("compile with custom renderer uses that renderer", () => {
      const customRenderer = new TestGeometryRenderer();
      builder.setRenderer(customRenderer);

      builder.point("P1", 10, 20);
      const steps = builder.compile();

      // Execute the step with the custom renderer's draw
      steps[0].draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(customRenderer.drawnPoints).toContain("P1");
    });

    it("compiled steps can be executed", () => {
      builder.point("P1", 10, 20);
      builder.point("P2", 30, 40);
      builder.line("L1", builder.getExpression("P1")!, builder.getExpression("P2")!);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.values.get("P1")).toBeDefined();
      expect(result.values.get("P2")).toBeDefined();
      expect(result.values.get("L1")).toBeDefined();
      expect(result.stepsExecuted).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it("compile handles complex construction", () => {
      builder.point("P1", 0, 0);
      builder.point("P2", 100, 0);
      builder.line("ML", builder.getExpression("P1")!, builder.getExpression("P2")!);
      builder.circle("C1_C", builder.getExpression("P1")!, 30);
      builder.circle("C2_C", builder.getExpression("P2")!, 30);
      builder.circleIntersection(
        "PI",
        builder.getExpression("C1_C")!,
        builder.getExpression("C2_C")!,
      );

      const steps = builder.compile();
      expect(steps.length).toBeGreaterThan(0);

      // Verify all expressions are compiled
      const stepIds = steps.map((s) => s.id);
      expect(stepIds).toContain("step_P1");
      expect(stepIds).toContain("step_P2");
      expect(stepIds).toContain("step_ML");
      expect(stepIds).toContain("step_C1_C");
      expect(stepIds).toContain("step_C2_C");
      expect(stepIds).toContain("step_PI");
    });
  });

  // ========================================================================
  // Parameter Helper Methods
  // ========================================================================

  describe("Parameter Helper Methods", () => {
    it("param() returns the key unchanged", () => {
      const key = builder.param("tolerance");
      expect(key).toBe("tolerance");
      expect(typeof key).toBe("string");
    });

    it("geom() creates a GeometryFeatureReference", () => {
      const p1 = builder.point("P1", 10, 20);
      const ref = builder.geom(p1, "x");

      expect(ref.sourceId).toBe("P1");
      expect(ref.property).toBe("x");
      expect(ref.type).toBe("geometry_feature_reference");
    });

    it("geom() works with circle radius", () => {
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("C1", center, 10);
      const ref = builder.geom(circle, "r");

      expect(ref.sourceId).toBe("C1");
      expect(ref.property).toBe("r");
    });

    it("geom() works with different geometry types", () => {
      const cs = builder.coordinateSystem("CS1", 0, 0, 10, 0);
      const xRef = builder.geom(cs, "x");
      const arrowRef = builder.geom(cs, "arrowLength");

      expect(xRef.sourceId).toBe("CS1");
      expect(arrowRef.sourceId).toBe("CS1");
    });
  });

  // ========================================================================
  // Parameterized Expressions
  // ========================================================================

  describe("Parameterized Expressions", () => {
    it("CircleExpression accepts config parameter for radius", () => {
      const center = builder.point("center", 0, 0);
      builder.circle("C1", center, "tolerance" as const);

      const expr = builder.getExpression("C1")!;
      expect(expr.parameters).toContain("tolerance");
    });

    it("CircleExpression accepts feature reference for radius", () => {
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("C1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("C2", center2, c1.r);

      const expr = builder.getExpression("C2")!;
      expect(expr.dependencies).toContain("center2");
      expect(expr.dependencies).toContain("C1");
    });

    it("PointInCoordinateSystemExpression accepts config parameters", () => {
      const cs = builder.coordinateSystem("CS1", 0, 0, 10, 0);
      builder.pointInCs("P1", cs, "tolerance" as const, 5);

      const expr = builder.getExpression("P1")!;
      expect(expr.parameters).toContain("tolerance");
    });

    it("PointInCoordinateSystemExpression accepts feature references", () => {
      const cs = builder.coordinateSystem("CS1", 0, 0, 10, 0);
      const p1 = builder.pointInCs("P1", cs, 5, 5);
      builder.pointInCs("P2", cs, p1.x, 10);

      const expr = builder.getExpression("P2")!;
      expect(expr.dependencies).toContain("CS1");
      expect(expr.dependencies).toContain("P1");
    });

    it("LineTowardsExpression accepts config parameter for length", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);
      builder.lineTowards("L1", start, end, "tolerance" as const);

      const expr = builder.getExpression("L1")!;
      expect(expr.parameters).toContain("tolerance");
    });

    it("LineTowardsExpression accepts feature reference for length", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);
      const c1 = builder.circle("C1", start, 10);
      builder.lineTowards("L1", start, end, c1.r);

      const expr = builder.getExpression("L1")!;
      expect(expr.dependencies).toContain("C1");
    });

    it("PointAtExpression accepts config parameter for ratio", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const line = builder.line("L1", start, end);
      builder.pointAt("P1", line, 0.5);

      const expr = builder.getExpression("P1")!;
      // 0.5 is a literal number, so no parameters
      expect(expr.parameters).toEqual([]);
    });

    it("PointAtExpression accepts feature reference for ratio", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const line = builder.line("L1", start, end);
      const c1 = builder.circle("C1", start, 0.5);
      builder.pointAt("P1", line, c1.r);

      const expr = builder.getExpression("P1")!;
      expect(expr.dependencies).toContain("C1");
    });
  });

  // ========================================================================
  // Execution with Parameters
  // ========================================================================

  describe("Execution with Parameters", () => {
    it("executes circle with config parameter", () => {
      builder.point("center", 0, 0);
      builder.circle("C1", builder.getExpression("center")!, "tolerance" as const);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: { tolerance: 25 } });

      expect(result.errors).toHaveLength(0);
      const circleValue = result.values.get("C1") as any;
      expect(circleValue).toBeDefined();
      expect(circleValue.r).toBe(25);
    });

    it("executes circle with feature reference", () => {
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("C1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("C2", center2, c1.r);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      const c1Value = result.values.get("C1") as any;
      const c2Value = result.values.get("C2") as any;
      expect(c1Value.r).toBe(10);
      expect(c2Value.r).toBe(10); // Same as C1
    });

    it("executes pointInCs with mixed parameter types", () => {
      const cs = builder.coordinateSystem("CS1", 0, 0, 10, 0);
      builder.pointInCs("P1", cs, "tolerance" as const, 5);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: { tolerance: 3 } });

      expect(result.errors).toHaveLength(0);
      const pointValue = result.values.get("P1") as any;
      expect(pointValue).toBeDefined();
      expect(pointValue.x).toBe(3);
      expect(pointValue.y).toBe(5);
    });

    it("executes lineTowards with feature reference length", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 0);
      const c1 = builder.circle("C1", start, 10);
      builder.lineTowards("L1", start, end, c1.r);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      const lineValue = result.values.get("L1") as any;
      expect(lineValue).toBeDefined();
      // Verify length is approximately 10
      const dx = lineValue.x2 - lineValue.x1;
      const dy = lineValue.y2 - lineValue.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      expect(length).toBeCloseTo(10, 0.001);
    });

    it("executes pointAt with config parameter ratio", () => {
      builder.point("start", 0, 0);
      builder.point("end", 100, 100);
      builder.line("L1", builder.getExpression("start")!, builder.getExpression("end")!);
      builder.pointAt("P1", builder.getExpression("L1")!, "tolerance" as const);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: { tolerance: 0.5 } });

      expect(result.errors).toHaveLength(0);
      const pointValue = result.values.get("P1") as any;
      expect(pointValue).toBeDefined();
      expect(pointValue.x).toBeCloseTo(50, 0.001);
      expect(pointValue.y).toBeCloseTo(50, 0.001);
    });
  });

  // ========================================================================
  // Backward Compatibility
  // ========================================================================

  describe("Backward Compatibility", () => {
    it("still works with literal numbers (no parameters)", () => {
      builder.point("P1", 10, 20);
      builder.point("P2", 30, 40);
      builder.circle("C1", builder.getExpression("P1")!, 15);
      builder.line("L1", builder.getExpression("P1")!, builder.getExpression("P2")!);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.values.get("P1")).toBeDefined();
      expect(result.values.get("P2")).toBeDefined();
      expect(result.values.get("C1")).toBeDefined();
      expect(result.values.get("L1")).toBeDefined();
    });

    it("all existing expression types still work", () => {
      builder.point("P1", 0, 0);
      builder.point("P2", 100, 0);
      builder.line("L1", builder.getExpression("P1")!, builder.getExpression("P2")!);
      builder.circle("C1", builder.getExpression("P1")!, 30);
      builder.circle("C2", builder.getExpression("P2")!, 30);
      builder.intersection("I1", builder.getExpression("C1")!, builder.getExpression("L1")!);

      const steps = builder.compile();
      expect(steps.length).toBeGreaterThan(0);

      const result = executeSteps(steps, { config: defaultConfig });
      expect(result.errors).toHaveLength(0);
    });
  });
});
