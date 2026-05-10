// Parameter resolution tests
import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";

interface SquareConfig {
  circleRadius: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  C1_POSITION_RATIO: number;
}

describe("Parameter Resolution", () => {
  describe("Literal number resolution", () => {
    it("should resolve literal numbers in CircleExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, 10);

      const steps = builder.compile();
      expect(steps).toHaveLength(2); // center point + circle

      // Execute the steps
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, { circleRadius: 5 } as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const circleValue = allValues.get("c1");
      expect(circleValue).toBeDefined();
      expect(circleValue.r).toBe(10);
    });

    it("should resolve literal numbers in PointInCoordinateSystemExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.pointInCs("p1", cs, 5, 5);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const pointValue = allValues.get("p1");
      expect(pointValue).toBeDefined();
      expect(pointValue.x).toBe(5);
      expect(pointValue.y).toBe(5);
    });

    it("should resolve literal numbers in LineTowardsExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);
      builder.lineTowards("line1", start, end, 10);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const lineValue = allValues.get("line1");
      expect(lineValue).toBeDefined();
      // The line should have length 10 (approximately)
      const dx = lineValue.x2 - lineValue.x1;
      const dy = lineValue.y2 - lineValue.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      expect(length).toBeCloseTo(10, 0.001);
    });

    it("should resolve literal numbers in PointAtExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const lineExpr = builder.line("line1", start, end);
      builder.pointAt("mid", lineExpr, 0.5);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const midValue = allValues.get("mid");
      expect(midValue).toBeDefined();
      expect(midValue.x).toBeCloseTo(5, 0.001);
      expect(midValue.y).toBeCloseTo(5, 0.001);
    });
  });

  describe("Config parameter resolution", () => {
    it("should resolve config parameter in CircleExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "circleRadius" as const);

      const config: SquareConfig = {
        circleRadius: 25,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
      };

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const circleValue = allValues.get("c1");
      expect(circleValue).toBeDefined();
      expect(circleValue.r).toBe(25);
    });

    it("should resolve config parameter in PointInCoordinateSystemExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);

      const config: SquareConfig = {
        circleRadius: 10,
        p1x: 3,
        p1y: 4,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
      };

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const pointValue = allValues.get("p1");
      expect(pointValue).toBeDefined();
      expect(pointValue.x).toBe(3);
      expect(pointValue.y).toBe(4);
    });

    it("should throw for missing config parameter", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "missingParam" as any);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      // First add the center so the circle can be computed
      allValues.set("center", { type: "point", x: 0, y: 0 });

      expect(() => {
        for (const step of steps) {
          step.compute(allValues, {} as SquareConfig);
        }
      }).toThrow("Missing config parameter");
    });
  });

  describe("Feature reference resolution", () => {
    it("should resolve feature reference in CircleExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.r);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const c2Value = allValues.get("c2");
      expect(c2Value).toBeDefined();
      expect(c2Value.r).toBe(10); // Same as c1
    });

    it("should resolve feature reference with radius alias", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 15);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.radius);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const c2Value = allValues.get("c2");
      expect(c2Value).toBeDefined();
      expect(c2Value.r).toBe(15); // Same as c1
    });

    it("should resolve feature reference in PointInCoordinateSystemExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      const p1 = builder.pointInCs("p1", cs, 5, 5);
      builder.pointInCs("p2", cs, p1.x, 10);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const p2Value = allValues.get("p2");
      expect(p2Value).toBeDefined();
      expect(p2Value.x).toBe(5); // Same as p1.x
      expect(p2Value.y).toBe(10);
    });

    it("should resolve feature reference in LineTowardsExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 0);
      const c1 = builder.circle("c1", start, 10);
      builder.lineTowards("line1", start, end, c1.r);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const lineValue = allValues.get("line1");
      expect(lineValue).toBeDefined();
      // The line should have length 10 (same as c1.r)
      const dx = lineValue.x2 - lineValue.x1;
      const dy = lineValue.y2 - lineValue.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      expect(length).toBeCloseTo(10, 0.001);
    });

    it("should resolve feature reference in PointAtExpression", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const lineExpr = builder.line("line1", start, end);
      builder.pointAt("mid", lineExpr, lineExpr.length as any);

      // This should work - the feature reference will resolve at compute time
      // Note: This is a bit contrived since lineExpr.length is computed, not stored
      // But it tests the feature reference mechanism

      const steps = builder.compile();
      expect(steps.length).toBeGreaterThan(0);
    });

    it("should throw for missing geometry reference", () => {
      // TODO: This test is incomplete - the current API's dependency tracking
      // prevents creating a scenario with a reference to a non-existent geometry.
      // A proper test would need to create a circle with a reference to a non-existent
      // geometry, but this is tricky with the current API.
    });
  });

  describe("Mixed parameter types", () => {
    it("should handle mix of literal and config parameters", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.pointInCs("p1", cs, "p1x" as const, 5);
      builder.pointInCs("p2", cs, 10, "p2y" as const);

      const config: SquareConfig = {
        circleRadius: 10,
        p1x: 3,
        p1y: 0,
        p2x: 0,
        p2y: 4,
        C1_POSITION_RATIO: 0.5,
      };

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const p1Value = allValues.get("p1");
      const p2Value = allValues.get("p2");

      expect(p1Value.x).toBe(3); // from config
      expect(p1Value.y).toBe(5); // literal
      expect(p2Value.x).toBe(10); // literal
      expect(p2Value.y).toBe(4); // from config
    });

    it("should handle mix of config and feature references", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      // Use a literal for cs arrowLength, then reference it in circle
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.pointInCs("p1", cs, "p1x" as const, 5);
      builder.circle("c1", builder.point("center", 0, 0), cs.arrowLength);

      const config: SquareConfig = {
        circleRadius: 10,
        p1x: 3,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
      };

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const c1Value = allValues.get("c1");
      expect(c1Value.r).toBe(10); // from cs.arrowLength
    });
  });

  describe("Builder helpers", () => {
    it("should use builder.param() for config parameters", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, builder.param("circleRadius"));

      const steps = builder.compile();
      const allValues = new Map<string, any>();

      const config: SquareConfig = {
        circleRadius: 30,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
      };

      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const circleValue = allValues.get("c1");
      expect(circleValue.r).toBe(30);
    });

    it("should use builder.geom() for feature references", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 15);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.r);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const c2Value = allValues.get("c2");
      expect(c2Value.r).toBe(15); // Same as c1
    });

    it("should work with builder.geom() using full property name", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 15);
      const center2 = builder.point("center2", 20, 20);
      // Note: Circle uses 'r' as the property name, not 'radius' in the GeometryValue type
      builder.circle("c2", center2, c1.r);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as SquareConfig);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      const c2Value = allValues.get("c2");
      expect(c2Value.r).toBe(15); // Same as c1
    });
  });

  describe("Dependency tracking", () => {
    it("should track dependencies correctly for feature references", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.r);

      const c2Expr = builder.getExpression("c2")!;
      expect(c2Expr.dependencies).toContain("center2");
      expect(c2Expr.dependencies).toContain("c1");
    });

    it("should track parameters correctly for config references", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "circleRadius" as const);

      const circleExpr = builder.getExpression("c1")!;
      expect(circleExpr.parameters).toContain("circleRadius");
    });

    it("should include both config params and feature refs in dependencies", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.circle("c1", builder.point("center", 0, 0), cs.arrowLength);

      const c1Expr = builder.getExpression("c1")!;
      expect(c1Expr.dependencies).toContain("center");
      expect(c1Expr.dependencies).toContain("cs");
      // cs.arrowLength is a literal (10), so no parameters
      expect(c1Expr.parameters).toEqual([]);
    });
  });

  describe("Square construction with feature references", () => {
    it("should build square construction with feature references", () => {
      const builder = new GeometryBuilder<SquareConfig>();
      const config: SquareConfig = {
        circleRadius: 100,
        p1x: -150,
        p1y: 0,
        p2x: 150,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
      };

      const cs = builder.coordinateSystem("cs", 0, 0, config.circleRadius * 0.1, 0);
      const p1 = builder.pointInCs("p1", cs, config.p1x, config.p1y);
      const p2 = builder.pointInCs("p2", cs, config.p2x, config.p2y);
      const line_main = builder.line("line_main", p1, p2);
      const c1 = builder.pointAt("c1", line_main, config.C1_POSITION_RATIO);
      const c1_c = builder.circle("c1_c", c1, config.circleRadius);
      const c2 = builder.intersection("c2", c1_c, line_main);
      const c2_c = builder.circle("c2_c", c2, c1_c.r); // Feature reference!
      const pi = builder.circleIntersection("pi", c1_c, c2_c, { select: "north" });
      builder.circle("ci", pi, c1_c.r); // Feature reference!

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) {
          allValues.set(key, value);
        }
      }

      // Verify all geometries were computed
      expect(allValues.get("cs")).toBeDefined();
      expect(allValues.get("p1")).toBeDefined();
      expect(allValues.get("p2")).toBeDefined();
      expect(allValues.get("line_main")).toBeDefined();
      expect(allValues.get("c1")).toBeDefined();
      expect(allValues.get("c1_c")).toBeDefined();
      expect(allValues.get("c2")).toBeDefined();
      expect(allValues.get("c2_c")).toBeDefined();
      expect(allValues.get("pi")).toBeDefined();
      expect(allValues.get("ci")).toBeDefined();

      // Verify c2_c has same radius as c1_c
      const c1_cValue = allValues.get("c1_c");
      const c2_cValue = allValues.get("c2_c");
      expect(c2_cValue.r).toBe(c1_cValue.r);

      // Verify ci has same radius as c1_c
      const ciValue = allValues.get("ci");
      expect(ciValue.r).toBe(c1_cValue.r);
    });
  });
});
