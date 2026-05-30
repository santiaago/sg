// Unit tests for relativeTo functionality in intersection expressions
// Tests verify that direction-based selections work correctly in flipped coordinate systems

import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";

// Test configuration type
interface TestConfig {
  radius: number;
  tolerance: number;
}

describe("relativeTo functionality in intersection expressions", () => {
  describe("IntersectionExpression with relativeTo", () => {
    it("selects left intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, true, false);

      // Create a circle centered at (100, 100) with radius 50
      const circle = builder.circle("circle", cs, 50);

      // Create a horizontal line through the circle
      const line = builder.line("line", 50, 100, 150, 100);

      // Get the left intersection relative to the flipped coordinate system
      const leftIntersection = builder.intersection("left", circle, line, {
        position: "left",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 50, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const leftPoint = allValues.get("left");
      expect(leftPoint).toBeDefined();
      expect(leftPoint.type).toBe("point");

      // In a flipped coordinate system (flipX=true), "left" in local space
      // corresponds to the right side in global space
      // The circle is centered at (100, 100) with radius 50
      // The line is horizontal at y=100 from x=50 to x=150
      // Intersections are at (50, 100) and (150, 100)
      // In cs local space: (50, 100) -> (-50, 0), (150, 100) -> (50, 0)
      // Left in local space is (-50, 0) which is (50, 100) in global space
      expect(leftPoint.x).toBeCloseTo(50, 1);
      expect(leftPoint.y).toBeCloseTo(100, 1);
    });

    it("selects right intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, true, false);

      // Create a circle centered at (100, 100) with radius 50
      const circle = builder.circle("circle", cs, 50);

      // Create a horizontal line through the circle
      const line = builder.line("line", 50, 100, 150, 100);

      // Get the right intersection relative to the flipped coordinate system
      const rightIntersection = builder.intersection("right", circle, line, {
        position: "right",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 50, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const rightPoint = allValues.get("right");
      expect(rightPoint).toBeDefined();
      expect(rightPoint.type).toBe("point");

      // In a flipped coordinate system (flipX=true), "right" in local space
      // corresponds to the left side in global space
      // The circle is centered at (100, 100) with radius 50
      // The line is horizontal at y=100 from x=50 to x=150
      // Intersections are at (50, 100) and (150, 100)
      // In cs local space: (50, 100) -> (-50, 0), (150, 100) -> (50, 0)
      // Right in local space is (50, 0) which is (150, 100) in global space
      expect(rightPoint.x).toBeCloseTo(150, 1);
      expect(rightPoint.y).toBeCloseTo(100, 1);
    });
  });

  describe("CircleIntersectionExpression with relativeTo", () => {
    it("selects north intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, false);

      // Create two circles that intersect
      const circle1 = builder.circle("circle1", cs, 30);
      const circle2 = builder.circle("circle2", builder.pointInCs("p2", cs, 50, 0), 30);

      // Get the north intersection relative to the coordinate system
      const northIntersection = builder.circleIntersection("north", circle1, circle2, {
        select: "north",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 30, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const northPoint = allValues.get("north");
      expect(northPoint).toBeDefined();
      expect(northPoint.type).toBe("point");

      // The two circles are centered at (100, 100) and (150, 100) with radius 30
      // They intersect at points above and below the line connecting centers
      // In SVG coordinates, north = lower y
      // The intersection points are at (125, 100 ± sqrt(30^2 - 25^2)) = (125, 100 ± sqrt(575))
      // sqrt(575) ≈ 23.98
      // So the north point (lower y) is at (125, 100 - 23.98) ≈ (125, 76.02)
      expect(northPoint.y).toBeLessThan(100);
    });

    it("selects south intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, false);

      // Create two circles that intersect
      const circle1 = builder.circle("circle1", cs, 30);
      const circle2 = builder.circle("circle2", builder.pointInCs("p2", cs, 50, 0), 30);

      // Get the south intersection relative to the coordinate system
      const southIntersection = builder.circleIntersection("south", circle1, circle2, {
        select: "south",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 30, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const southPoint = allValues.get("south");
      expect(southPoint).toBeDefined();
      expect(southPoint.type).toBe("point");

      // The south point (higher y in SVG) is at (125, 100 + 23.98) ≈ (125, 123.98)
      expect(southPoint.y).toBeGreaterThan(100);
    });

    it("selects west intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, false);

      // Create two circles that intersect
      const circle1 = builder.circle("circle1", cs, 30);
      const circle2 = builder.circle("circle2", builder.pointInCs("p2", cs, 0, 50), 30);

      // Get the west intersection relative to the coordinate system
      const westIntersection = builder.circleIntersection("west", circle1, circle2, {
        select: "west",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 30, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const westPoint = allValues.get("west");
      expect(westPoint).toBeDefined();
      expect(westPoint.type).toBe("point");

      // The two circles are centered at (100, 100) and (100, 150) with radius 30
      // They intersect at points left and right of the line connecting centers
      // West = lower x
      // The intersection points are at (100 ± sqrt(30^2 - 25^2), 125) = (100 ± 23.98, 125)
      // So the west point (lower x) is at (100 - 23.98, 125) ≈ (76.02, 125)
      expect(westPoint.x).toBeLessThan(100);
    });

    it("selects east intersection relative to flipped coordinate system", () => {
      const builder = new GeometryBuilder<TestConfig>();

      // Create a flipped coordinate system at (100, 100)
      const cs = builder.coordinateSystem("cs", 100, 100, 10, 0, false, false);

      // Create two circles that intersect
      const circle1 = builder.circle("circle1", cs, 30);
      const circle2 = builder.circle("circle2", builder.pointInCs("p2", cs, 0, 50), 30);

      // Get the east intersection relative to the coordinate system
      const eastIntersection = builder.circleIntersection("east", circle1, circle2, {
        select: "east",
        relativeTo: "cs",
      });

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, { radius: 30, tolerance: 0.001 } as TestConfig);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const eastPoint = allValues.get("east");
      expect(eastPoint).toBeDefined();
      expect(eastPoint.type).toBe("point");

      // The east point (higher x) is at (100 + 23.98, 125) ≈ (123.98, 125)
      expect(eastPoint.x).toBeGreaterThan(100);
    });
  });
});
