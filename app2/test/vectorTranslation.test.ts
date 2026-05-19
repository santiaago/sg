// Tests for vector translation support in the declarative geometry DSL

import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { executeSteps as executeStepsUtil } from "./dsl-test-utils";
import { getGeometryValue } from "./dsl-test-utils";
import type { Point } from "../src/types/geometry";

// Simple approximate equality check
function approx(a: number, b: number, tolerance = 1e-9): boolean {
  return Math.abs(a - b) < tolerance;
}

interface TestConfig {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

describe("Vector Translation", () => {
  const config: TestConfig = { p1x: 10, p1y: 20, p2x: 30, p2y: 40 };

  describe("VectorExpression", () => {
    it("computes dx and dy between coordinate systems", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      builder.vector("vec", cs, cs2);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const vecResult = getGeometryValue<Point>(result, "vec");

      expect(vecResult).toBeDefined();
      expect(approx(vecResult!.x, 100)).toBe(true); // cs2.x - cs.x = 100 - 0
      expect(approx(vecResult!.y, 200)).toBe(true); // cs2.y - cs.y = 200 - 0
    });

    it("computes dx and dy between points", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const p1 = builder.point("p1", 10, 20);
      const p2 = builder.point("p2", 40, 60);
      builder.vector("vec", p1, p2);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const vecResult = getGeometryValue<Point>(result, "vec");

      expect(vecResult).toBeDefined();
      expect(approx(vecResult!.x, 30)).toBe(true); // 40 - 10
      expect(approx(vecResult!.y, 40)).toBe(true); // 60 - 20
    });
  });

  describe("AddExpression", () => {
    it("adds two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.add("sum", 10, 20);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const sumResult = getGeometryValue<Point>(result, "sum");

      expect(sumResult).toBeDefined();
      expect(approx(sumResult!.x, 30)).toBe(true);
    });

    it("adds config param and vector component", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      const vec = builder.vector("vec", cs, cs2);
      builder.add("sumX", builder.param("p1x"), vec.dx);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const sumResult = getGeometryValue<Point>(result, "sumX");

      expect(sumResult).toBeDefined();
      expect(approx(sumResult!.x, 110)).toBe(true); // 10 + 100
    });
  });

  describe("SubtractExpression", () => {
    it("subtracts two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.subtract("diff", 20, 10);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const diffResult = getGeometryValue<Point>(result, "diff");

      expect(diffResult).toBeDefined();
      expect(approx(diffResult!.x, 10)).toBe(true);
    });
  });

  describe("MultiplyExpression", () => {
    it("multiplies two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.multiply("product", 10, 3);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const productResult = getGeometryValue<Point>(result, "product");

      expect(productResult).toBeDefined();
      expect(approx(productResult!.x, 30)).toBe(true);
    });
  });

  describe("DivideExpression", () => {
    it("divides two numbers", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.divide("quotient", 30, 10);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const quotientResult = getGeometryValue<Point>(result, "quotient");

      expect(quotientResult).toBeDefined();
      expect(approx(quotientResult!.x, 3)).toBe(true);
    });

    it("returns Infinity when dividing by zero", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.divide("quotient_zero", 10, 0);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const quotientResult = getGeometryValue<Point>(result, "quotient_zero");

      expect(quotientResult).toBeDefined();
      expect(quotientResult!.x).toBe(Infinity);
    });
  });

  describe("Point Translation Pattern", () => {
    it("translates coordinates using vector components", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("cs2", 100, 200, 0, 0);
      const vec = builder.vector("vec_cs_cs2", cs, cs2);

      // Test the translation pattern: config param + vector component
      builder.add("sumX", builder.param("p1x"), vec.dx);
      builder.add("sumY", builder.param("p1y"), vec.dy);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });

      const sumXResult = getGeometryValue<Point>(result, "sumX");
      const sumYResult = getGeometryValue<Point>(result, "sumY");

      expect(sumXResult).toBeDefined();
      expect(sumYResult).toBeDefined();
      expect(approx(sumXResult!.x, 110)).toBe(true); // 10 + 100
      expect(approx(sumYResult!.x, 220)).toBe(true); // 20 + 200
    });
  });

  describe("Chained Operations", () => {
    it("chains arithmetic operations", () => {
      const builder = new GeometryBuilder<TestConfig>();
      // (10 + 20) * 2 = 60
      const sum = builder.add("sum", 10, 20);
      builder.multiply("product", sum.value, 2);

      const steps = builder.compile();
      const result = executeStepsUtil(steps, { config });
      const productResult = getGeometryValue<Point>(result, "product");

      expect(productResult).toBeDefined();
      expect(approx(productResult!.x, 60)).toBe(true);
    });
  });
});
