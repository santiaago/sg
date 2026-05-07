// Unit tests for operation geometry expressions
// Tests: PointAt, Intersection, CircleIntersection, LineTowards expressions

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import {
  createTestContext,
  executeSteps,
  verifyStepStructure,
  getGeometryValue,
} from "./dsl-test-utils";
import { point } from "@/types/geometry";
import type { Line } from "@/types/geometry";

// Test configuration type
interface TestConfig {
  tolerance: number;
}

const defaultConfig: TestConfig = {
  tolerance: 0.001,
};

describe("Operation Expressions", () => {
  let builder: GeometryBuilder<TestConfig>;
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>();
    ctx = createTestContext();
  });

  // ========================================================================
  // PointAtExpression Tests
  // ========================================================================

  describe("PointAtExpression", () => {
    it("creates pointAt expression with correct ID and type", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);

      expect(pa.id).toBe("PA");
      expect(pa.type).toBe("point");
    });

    it("has dependency on line expression", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);

      expect(pa.dependencies).toEqual(["L1"]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);
      const step = pa.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_PA",
        inputs: ["L1"],
        outputs: ["PA"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces correct Point at midpoint", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);

      const steps = [p1, p2, l1, pa].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const paValue = getGeometryValue(result, "PA");
      expect(paValue).toBeDefined();
      expect(paValue).toEqual(point(50, 50));
    });

    it("compute produces correct Point at ratio 0.25", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.25);

      const steps = [p1, p2, l1, pa].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const paValue = getGeometryValue(result, "PA");
      expect(paValue).toBeDefined();
      expect(paValue).toEqual(point(25, 25));
    });

    it("compute produces correct Point at ratio 0", () => {
      const p1 = builder.point("P1", 10, 20);
      const p2 = builder.point("P2", 100, 200);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0);

      const steps = [p1, p2, l1, pa].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const paValue = getGeometryValue(result, "PA");
      expect(paValue).toBeDefined();
      expect(paValue).toEqual(point(10, 20));
    });

    it("compute produces correct Point at ratio 1", () => {
      const p1 = builder.point("P1", 10, 20);
      const p2 = builder.point("P2", 100, 200);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 1);

      const steps = [p1, p2, l1, pa].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const paValue = getGeometryValue(result, "PA");
      expect(paValue).toBeDefined();
      expect(paValue).toEqual(point(100, 200));
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1", p1, p2);
      const pa = builder.pointAt("PA", l1, 0.5);
      const step = pa.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnPoints).toContain("PA");
    });
  });

  // ========================================================================
  // IntersectionExpression Tests (circle-line intersection)
  // ========================================================================

  describe("IntersectionExpression", () => {
    it("creates intersection expression with correct ID and type", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1);

      expect(ix.id).toBe("IX");
      expect(ix.type).toBe("point");
    });

    it("has dependencies on circle and line expressions", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1);

      expect(ix.dependencies).toContain("C1");
      expect(ix.dependencies).toContain("L1");
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1);
      const step = ix.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_IX",
        inputs: ["C1", "L1"],
        outputs: ["IX"],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compile includes exclude point in dependencies when provided", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1, { excludeId: "P1" });

      expect(ix.dependencies).toContain("P1");
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 50, 50);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 0, 0);
      const p3 = builder.point("P3", 100, 100);
      const l1 = builder.line("L1", p2, p3);
      const ix = builder.intersection("IX", c1, l1);
      const step = ix.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnPoints).toContain("IX");
    });
  });

  // ========================================================================
  // CircleIntersectionExpression Tests (circle-circle intersection)
  // ========================================================================

  describe("CircleIntersectionExpression", () => {
    it("creates circleIntersection expression with correct ID and type", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      const cix = builder.circleIntersection("CIX", c1, c2);

      expect(cix.id).toBe("CIX");
      expect(cix.type).toBe("point");
    });

    it("has dependencies on both circle expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      const cix = builder.circleIntersection("CIX", c1, c2);

      expect(cix.dependencies).toEqual(["C1", "C2"]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      const cix = builder.circleIntersection("CIX", c1, c2);
      const step = cix.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_CIX",
        inputs: ["C1", "C2"],
        outputs: ["CIX"],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 0, 0);
      const c1 = builder.circle("C1", p1, 50);
      const p2 = builder.point("P2", 70, 0);
      const c2 = builder.circle("C2", p2, 30);
      const cix = builder.circleIntersection("CIX", c1, c2);
      const step = cix.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnPoints).toContain("CIX");
    });
  });

  // ========================================================================
  // LineTowardsExpression Tests
  // ========================================================================

  describe("LineTowardsExpression", () => {
    it("creates lineTowards expression with correct ID and type", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 50, 50);
      const lt = builder.lineTowards("LT", p1, p2, 200);

      expect(lt.id).toBe("LT");
      expect(lt.type).toBe("line");
    });

    it("has dependencies on start and end point expressions", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 50, 50);
      const lt = builder.lineTowards("LT", p1, p2, 200);

      expect(lt.dependencies).toEqual(["P1", "P2"]);
    });

    it("compiles to Step with correct structure", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 50, 50);
      const lt = builder.lineTowards("LT", p1, p2, 200);
      const step = lt.compile(ctx.renderer);

      verifyStepStructure(step, {
        id: "step_LT",
        inputs: ["P1", "P2"],
        outputs: ["LT"],
        parameters: [],
        hasCompute: true,
        hasDraw: true,
      });
    });

    it("compute produces Line with correct extended length", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 10, 10);
      const lt = builder.lineTowards("LT", p1, p2, 100);

      const steps = [p1, p2, lt].map((expr) => expr.compile(ctx.renderer));
      const result = executeSteps(steps, { config: defaultConfig });

      const ltValue = getGeometryValue<Line>(result, "LT");
      expect(ltValue).toBeDefined();

      // Direction vector from p1 to p2 is (10, 10), normalized and scaled by length 100
      // Unit vector: (10, 10) / sqrt(200) = (10, 10) / (10*sqrt(2)) = (1/sqrt(2), 1/sqrt(2))
      // Scaled by 100: (100/sqrt(2), 100/sqrt(2)) ≈ (70.71, 70.71)
      // End point: (0, 0) + (70.71, 70.71) = (70.71, 70.71)
      const expectedX2 = 100 * Math.cos(Math.PI / 4);
      const expectedY2 = 100 * Math.sin(Math.PI / 4);
      expect(ltValue!.x2).toBeCloseTo(expectedX2, 2);
      expect(ltValue!.y2).toBeCloseTo(expectedY2, 2);
    });

    it("draw uses injected renderer", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 50, 50);
      const lt = builder.lineTowards("LT", p1, p2, 200);
      const step = lt.compile(ctx.renderer);
      step.draw(ctx.svg, new Map(), ctx.store, ctx.theme);

      expect(ctx.renderer.drawnLines).toContain("LT");
    });
  });
});
