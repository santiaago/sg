// Unit tests for coordinate system flip transformations
// Tests verify that flipX and flipY properties work correctly

import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { coordinateSystem, point } from "@/types/geometry";

// Test configuration type
interface TestConfig {
  tolerance: number;
}

describe("CoordinateSystem flip transformations", () => {
  describe("CoordinateSystemExpression with flip properties", () => {
    it("creates coordinate system with default flipX=false, flipY=false", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);

      const steps = builder.compile();
      expect(steps.length).toBeGreaterThan(0);

      // Execute the step to get the coordinate system
      const result = steps[0].compute(new Map(), {} as TestConfig);
      const csValue = result.get("cs");

      expect(csValue).toBeDefined();
      if (csValue && csValue.type === "coordinate_system") {
        expect(csValue.flipX).toBe(false);
        expect(csValue.flipY).toBe(false);
      }
    });

    it("creates coordinate system with flipX=true", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0, true, false);

      const steps = builder.compile();
      const result = steps[0].compute(new Map(), {} as TestConfig);
      const csValue = result.get("cs");

      expect(csValue).toBeDefined();
      if (csValue && csValue.type === "coordinate_system") {
        expect(csValue.flipX).toBe(true);
        expect(csValue.flipY).toBe(false);
      }
    });

    it("creates coordinate system with flipY=true", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0, false, true);

      const steps = builder.compile();
      const result = steps[0].compute(new Map(), {} as TestConfig);
      const csValue = result.get("cs");

      expect(csValue).toBeDefined();
      if (csValue && csValue.type === "coordinate_system") {
        expect(csValue.flipX).toBe(false);
        expect(csValue.flipY).toBe(true);
      }
    });

    it("creates coordinate system with both flipX=true and flipY=true", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0, true, true);

      const steps = builder.compile();
      const result = steps[0].compute(new Map(), {} as TestConfig);
      const csValue = result.get("cs");

      expect(csValue).toBeDefined();
      if (csValue && csValue.type === "coordinate_system") {
        expect(csValue.flipX).toBe(true);
        expect(csValue.flipY).toBe(true);
      }
    });
  });

  describe("PointInCoordinateSystemExpression with flipX", () => {
    it("transforms point correctly with flipX=true, rotation=0", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, true, false);
      const p = builder.pointInCs("p", cs, 10, 20);

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute coordinate system step first
      for (const step of steps) {
        const result = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const pValue = allValues.get("p");
      expect(pValue).toBeDefined();
      expect(pValue.type).toBe("point");

      // With flipX=true, rotation=0:
      // globalX = cs.x + (localX * -1) * cos(0) - localY * sin(0)
      //        = 100 + (10 * -1) * 1 - 20 * 0 = 100 - 10 = 90
      // globalY = cs.y + (localX * -1) * sin(0) + (localY * cos(0)) * 1
      //        = 100 + (10 * -1) * 0 + (20 * 1) * 1 = 100 + 20 = 120
      expect(pValue.x).toBeCloseTo(90, 10);
      expect(pValue.y).toBeCloseTo(120, 10);
    });

    it("transforms point correctly with flipX=false, rotation=0", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, false);
      const p = builder.pointInCs("p", cs, 10, 20);

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      for (const step of steps) {
        const result = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const pValue = allValues.get("p");
      expect(pValue).toBeDefined();
      expect(pValue.type).toBe("point");

      // With flipX=false, rotation=0:
      // globalX = cs.x + (localX * 1) * cos(0) - localY * sin(0)
      //        = 100 + 10 * 1 - 20 * 0 = 110
      // globalY = cs.y + (localX * 1) * sin(0) + (localY * cos(0)) * 1
      //        = 100 + 10 * 0 + 20 * 1 = 120
      expect(pValue.x).toBeCloseTo(110, 10);
      expect(pValue.y).toBeCloseTo(120, 10);
    });

    it("transforms point correctly with flipY=true, rotation=0", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, true);
      const p = builder.pointInCs("p", cs, 10, 20);

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      for (const step of steps) {
        const result = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const pValue = allValues.get("p");
      expect(pValue).toBeDefined();
      expect(pValue.type).toBe("point");

      // With flipY=true, rotation=0:
      // globalX = cs.x + (localX * 1) * cos(0) - localY * sin(0)
      //        = 100 + 10 * 1 - 20 * 0 = 110
      // globalY = cs.y + (localX * 1) * sin(0) + (localY * cos(0)) * -1
      //        = 100 + 10 * 0 + (20 * 1) * -1 = 100 - 20 = 80
      expect(pValue.x).toBeCloseTo(110, 10);
      expect(pValue.y).toBeCloseTo(80, 10);
    });

    it("transforms point correctly with flipX=true, flipY=true, rotation=0", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, true, true);
      const p = builder.pointInCs("p", cs, 10, 20);

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      for (const step of steps) {
        const result = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const pValue = allValues.get("p");
      expect(pValue).toBeDefined();
      expect(pValue.type).toBe("point");

      // With flipX=true, flipY=true, rotation=0:
      // globalX = cs.x + (localX * -1) * cos(0) - localY * sin(0)
      //        = 100 + (10 * -1) * 1 - 20 * 0 = 100 - 10 = 90
      // globalY = cs.y + (localX * -1) * sin(0) + (localY * cos(0)) * -1
      //        = 100 + (10 * -1) * 0 + (20 * 1) * -1 = 100 - 20 = 80
      expect(pValue.x).toBeCloseTo(90, 10);
      expect(pValue.y).toBeCloseTo(80, 10);
    });
  });

  describe("coordinateSystem factory function", () => {
    it("creates coordinate system with default flip values", () => {
      const cs = coordinateSystem(0, 0, 10, 0);
      expect(cs.flipX).toBe(false);
      expect(cs.flipY).toBe(false);
    });

    it("creates coordinate system with flipX=true", () => {
      const cs = coordinateSystem(0, 0, 10, 0, true, false);
      expect(cs.flipX).toBe(true);
      expect(cs.flipY).toBe(false);
    });

    it("creates coordinate system with flipY=true", () => {
      const cs = coordinateSystem(0, 0, 10, 0, false, true);
      expect(cs.flipX).toBe(false);
      expect(cs.flipY).toBe(true);
    });

    it("creates coordinate system with both flips true", () => {
      const cs = coordinateSystem(0, 0, 10, 0, true, true);
      expect(cs.flipX).toBe(true);
      expect(cs.flipY).toBe(true);
    });
  });

  describe("Point factory function", () => {
    it("creates point with x and y", () => {
      const p = point(10, 20);
      expect(p.type).toBe("point");
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
    });
  });
});
