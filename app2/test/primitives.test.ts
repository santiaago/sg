// Unit tests for primitive geometry expressions
// Tests: Point, Line, Circle, CoordinateSystem, Polygon expressions

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { createTestContext, executeSteps, verifyStepStructure } from "./dsl-test-utils";
import { point, line, circle, coordinateSystem } from "@/types/geometry";

// Test configuration type
interface TestConfig {
  tolerance: number;
}

const defaultConfig: TestConfig = {
  tolerance: 0.001,
};

describe("Primitive Expressions", () => {
  let builder: GeometryBuilder<TestConfig>;
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>();
    ctx = createTestContext();
  });

  // ========================================================================
  // PointExpression Tests
  // ========================================================================

  describe("PointExpression", () => {
    it("creates point expression with correct ID and type", () => {
      const p1 = builder.point("P1", 10, 20);
      expect(p1.id).toBe("P1");
      expect(p1.type).toBe("point");
    });

    it("has empty dependencies", () => {
      const p1 = builder.point("P1", 10, 20);
      expect(p1.dependencies).toEqual([]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 10, 20);
      const step = p1.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_P1",
        inputs: [],
        outputs: ["P1"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces correct Point value", () => {
      const p1 = builder.point("P1", 10, 20);
      const step = p1.compile(ctx.renderer);
      const result = step.compute(new Map(), defaultConfig);

      const p1Value = result.get("P1");
      expect(p1Value).toBeDefined();
      expect(p1Value).toEqual(point(10, 20));
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 10, 20);
      const step = p1.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnPoints).toContain("P1");
    });

    it("can be tracked by GeometryBuilder", () => {
      const p1 = builder.point("P1", 10, 20);
      const expr = builder.getExpression("P1");
      expect(expr).toBe(p1);
    });
  });

  // ========================================================================
  // LineExpression Tests
  // ========================================================================

  describe("LineExpression", () => {
    describe("from coordinates", () => {
      it("creates line expression with correct ID and type", () => {
        const l1 = builder.line("L1", 0, 0, 100, 100);
        expect(l1.id).toBe("L1");
        expect(l1.type).toBe("line");
      });

      it("has empty dependencies", () => {
        const l1 = builder.line("L1", 0, 0, 100, 100);
        expect(l1.dependencies).toEqual([]);
      });

      it("compiles to Step with correct structure", () => {
        const l1 = builder.line("L1", 0, 0, 100, 100);
        const step = l1.compile(ctx.renderer);

        verifyStepStructure(step, {
          id: "step_L1",
          inputs: [],
          outputs: ["L1"],
          parameters: [],
          hasCompute: true,
          hasDraw: true,
        });
      });

      it("compute produces correct Line value", () => {
        const l1 = builder.line("L1", 10, 20, 30, 40);
        const step = l1.compile(ctx.renderer);
        const result = step.compute(new Map(), defaultConfig);

        const l1Value = result.get("L1");
        expect(l1Value).toBeDefined();
        expect(l1Value).toEqual(line(10, 20, 30, 40));
      });
    });

    describe("from point expressions", () => {
      it("creates line from two point expressions", () => {
        const p1 = builder.point("P1", 0, 0);
        const p2 = builder.point("P2", 100, 100);
        const l1 = builder.line("L1", p1, p2);

        expect(l1.id).toBe("L1");
        expect(l1.type).toBe("line");
      });

      it("has dependencies on point expressions", () => {
        const p1 = builder.point("P1", 0, 0);
        const p2 = builder.point("P2", 100, 100);
        const l1 = builder.line("L1", p1, p2);

        expect(l1.dependencies).toEqual(["P1", "P2"]);
      });

      it("compiles to Step with correct inputs", () => {
        const p1 = builder.point("P1", 0, 0);
        const p2 = builder.point("P2", 100, 100);
        const l1 = builder.line("L1", p1, p2);
        const step = l1.compile(ctx.renderer);

        verifyStepStructure(step, {
          id: "step_L1",
          inputs: ["P1", "P2"],
          outputs: ["L1"],
        });
      });

      it("draw uses injected renderer", () => {
        const p1 = builder.point("P1", 0, 0);
        const p2 = builder.point("P2", 100, 100);
        const l1 = builder.line("L1", p1, p2);
        const step = l1.compile(ctx.renderer);
        step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

        expect(ctx.renderer.drawnLines).toContain("L1");
      });
    });
  });

  // ========================================================================
  // CircleExpression Tests
  // ========================================================================

  describe("CircleExpression", () => {
    it("creates circle expression with correct ID and type", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);
      expect(c1.id).toBe("C1");
      expect(c1.type).toBe("circle");
    });

    it("has dependency on center point", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);
      expect(c1.dependencies).toEqual(["P1"]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);
      const step = c1.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_C1",
        inputs: ["P1"],
        outputs: ["C1"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces correct Circle value", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);

      // First compile and execute the point
      const p1Step = p1.compile(ctx.renderer);
      let values = p1Step.compute(new Map(), defaultConfig);

      // Then compile and execute the circle
      const c1Step = c1.compile(ctx.renderer);
      values = c1Step.compute(values, defaultConfig);

      const c1Value = values.get("C1");
      expect(c1Value).toBeDefined();
      expect(c1Value).toEqual(circle(50, 50, 25));
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 25);
      const step = c1.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnCircles).toContain("C1");
    });
  });

  // ========================================================================
  // CoordinateSystemExpression Tests
  // ========================================================================

  describe("CoordinateSystemExpression", () => {
    it("creates coordinate system expression with correct ID and type", () => {
      const cs = builder.coordinateSystem("CS", 0, 0, 100);
      expect(cs.id).toBe("CS");
      expect(cs.type).toBe("coordinate_system");
    });

    it("has empty dependencies", () => {
      const cs = builder.coordinateSystem("CS", 0, 0, 100);
      expect(cs.dependencies).toEqual([]);
    });

    it("compiles to Step with correct structure", () => {
      const cs = builder.coordinateSystem("CS", 0, 0, 100);
      const step = cs.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_CS",
        inputs: [],
        outputs: ["CS"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces correct CoordinateSystem value", () => {
      const cs = builder.coordinateSystem("CS", 10, 20, 50, 45);
      const step = cs.compile(ctx.renderer);
      const result = step.compute(new Map(), defaultConfig);

      const csValue = result.get("CS");
      expect(csValue).toBeDefined();
      expect(csValue).toEqual(coordinateSystem(10, 20, 50, 45));
    });

    it("draw uses injected renderer", () => {
      const cs = builder.coordinateSystem("CS", 0, 0, 100);
      const step = cs.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnCoordinateSystems).toContain("CS");
    });
  });

  // ========================================================================
  // PolygonExpression Tests
  // ========================================================================

  describe("PolygonExpression", () => {
    it("creates polygon expression with correct ID and type", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      const poly = builder.polygon("POLY", [p1, p2, p3, p4]);

      expect(poly.id).toBe("POLY");
      expect(poly.type).toBe("polygon");
    });

    it("has dependencies on all point expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      const poly = builder.polygon("POLY", [p1, p2, p3, p4]);

      expect(poly.dependencies).toEqual(["P1", "P2", "P3", "P4"]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      const poly = builder.polygon("POLY", [p1, p2, p3, p4]);
      const step = poly.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_POLY",
        inputs: ["P1", "P2", "P3", "P4"],
        outputs: ["POLY"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces correct Polygon value", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      const poly = builder.polygon("POLY", [p1, p2, p3, p4]);

      // Execute all points first
      const steps = [p1, p2, p3, p4, poly].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const polyValue = result.values.get("POLY");
      expect(polyValue).toBeDefined();
      expect(polyValue?.type).toBe("polygon");
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 0);
      const p3 = builder.point("P3", 100, 100);
      const p4 = builder.point("P4", 0, 100);
      const poly = builder.polygon("POLY", [p1, p2, p3, p4]);
      const step = poly.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnPolygons).toContain("POLY");
    });

    it("accepts empty array of points", () => {
      const poly = builder.polygon("EMPTY_POLY", []);
      expect(poly.id).toBe("EMPTY_POLY");
      expect(poly.dependencies).toEqual([]);
    });
  });
});
