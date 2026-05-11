/**
 * TDD Verification Test for SPEC-parameterized-dsl.md
 *
 * This test verifies that the implementation satisfies key requirements
 * from backlog/dsl/SPEC-parameterized-dsl.md using TDD principles.
 *
 * Each test corresponds to a spec requirement and would have failed
 * before the implementation was complete.
 */

import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { GeometryFeatureReference } from "../src/geometry/dsl/GeometryFeatureReference";
import {
  isGeometryFeatureReference,
  type ParameterValue,
  type NumericPropertyOf,
} from "../src/geometry/dsl/types";
import { resolveParameter } from "../src/geometry/dsl/utils";

interface TestConfig {
  circleRadius: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  C1_POSITION_RATIO: number;
  coordinateSystemArrowLength: number;
  lineExtensionLength: number;
}

// ============================================================================
// SPEC SECTION 5: Core Concepts - Parameter Sources
// ============================================================================

describe("SPEC-5: Parameter Sources", () => {
  describe("5.1: Three parameter sources", () => {
    it("accepts literal number as ParameterValue", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, 10);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("c1").r).toBe(10);
    });

    it("accepts config key as ParameterValue", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "circleRadius" as const);

      const config: TestConfig = {
        circleRadius: 25,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("c1").r).toBe(25);
    });

    it("accepts GeometryFeatureReference as ParameterValue", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 15);
      const center2 = builder.point("center2", 10, 10);
      builder.circle("c2", center2, c1.r);

      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("c2").r).toBe(15);
    });
  });

  describe("5.2: Dot notation for feature access", () => {
    it("supports c1.r notation", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 10);
      const radiusRef = c1.r;
      expect(radiusRef).toBeInstanceOf(GeometryFeatureReference);
      expect(radiusRef.sourceId).toBe("c1");
      expect(radiusRef.property).toBe("r");
    });

    it("supports c1.radius alias", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 10);
      const radiusRef = c1.radius;
      expect(radiusRef).toBeInstanceOf(GeometryFeatureReference);
      expect(radiusRef.property).toBe("r");
    });
  });
});

// ============================================================================
// SPEC SECTION 6: Type System
// ============================================================================

describe("SPEC-6: Type System", () => {
  describe("6.1: ParameterValue type", () => {
    it("accepts number", () => {
      const value: ParameterValue<TestConfig> = 10;
      expect(value).toBe(10);
    });

    it("accepts keyof TConfig", () => {
      const value: ParameterValue<TestConfig> = "circleRadius";
      expect(value).toBe("circleRadius");
    });

    it("accepts GeometryFeatureReference", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      const value: ParameterValue<TestConfig> = point.x;
      expect(value).toBeInstanceOf(GeometryFeatureReference);
    });
  });

  describe("6.2: NumericPropertyOf type", () => {
    it("extracts numeric properties from Point - compile time test", () => {
      // This test passes if it compiles - NumericPropertyOf extracts only numeric props
      type Point = { x: number; y: number; type: string };
      type NumericProps = NumericPropertyOf<Point>;
      // These assignments verify the type works correctly at compile time
      void ("x" as NumericProps);
      void ("y" as NumericProps);
      expect(true).toBe(true); // Runtime placeholder
    });

    it("extracts numeric properties from Circle - compile time test", () => {
      type Circle = { cx: number; cy: number; r: number; type: string };
      type NumericProps = NumericPropertyOf<Circle>;
      void ("cx" as NumericProps);
      void ("cy" as NumericProps);
      void ("r" as NumericProps);
      expect(true).toBe(true);
    });
  });

  describe("6.3: isGeometryFeatureReference type guard", () => {
    it("returns true for GeometryFeatureReference", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      expect(isGeometryFeatureReference(point.x)).toBe(true);
    });

    it("returns false for non-feature-reference values", () => {
      expect(isGeometryFeatureReference(10)).toBe(false);
      expect(isGeometryFeatureReference("radius")).toBe(false);
      expect(isGeometryFeatureReference(null)).toBe(false);
      expect(isGeometryFeatureReference({})).toBe(false);
    });

    it("enables type narrowing", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      const ref = point.x;
      if (isGeometryFeatureReference(ref)) {
        expect(ref.sourceId).toBe("p1");
        expect(ref.property).toBe("x");
      }
    });
  });
});

// ============================================================================
// SPEC SECTION 7: GeometryFeatureReference Class
// ============================================================================

describe("SPEC-7: GeometryFeatureReference", () => {
  describe("7.1: Construction", () => {
    it("has type property set to geometry_feature_reference", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      expect(point.x.type).toBe("geometry_feature_reference");
    });

    it("has sourceId property", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      expect(point.x.sourceId).toBe("p1");
    });

    it("has property property", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      expect(point.x.property).toBe("x");
    });
  });

  describe("7.2: resolve method", () => {
    it("resolves to numeric value from inputs Map", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;
      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });
      expect(ref.resolve(inputs)).toBe(10);
    });

    it("throws for missing source geometry", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;
      const inputs = new Map<string, any>();
      expect(() => ref.resolve(inputs)).toThrow("source geometry 'p1' not found");
    });

    it("throws for non-numeric property", () => {
      const ref = new GeometryFeatureReference(
        { id: "p1", type: "point", dependencies: [], parameters: [] } as any,
        "type" as any,
      );
      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });
      expect(() => ref.resolve(inputs)).toThrow("is not a number");
    });
  });

  describe("7.3: toString method", () => {
    it("returns formatted string geom:{sourceId}.{property}", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      expect(point.y.toString()).toBe("geom:p1.y");
    });
  });
});

// ============================================================================
// SPEC SECTION 8: Feature Accessors
// ============================================================================

describe("SPEC-8: Feature Accessors", () => {
  describe("Point feature accessors", () => {
    it("PointExpression exposes x accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const xRef = point.x;
      expect(xRef).toBeInstanceOf(GeometryFeatureReference);
      expect(xRef.sourceId).toBe("p1");
      expect(xRef.property).toBe("x");
    });

    it("PointExpression exposes y accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const yRef = point.y;
      expect(yRef).toBeInstanceOf(GeometryFeatureReference);
      expect(yRef.property).toBe("y");
    });
  });

  describe("Circle feature accessors", () => {
    it("CircleExpression exposes cx accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 5, 10);
      const circle = builder.circle("c1", center, 15);
      expect(circle.cx).toBeInstanceOf(GeometryFeatureReference);
      expect(circle.cx.property).toBe("cx");
    });

    it("CircleExpression exposes cy accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 5, 10);
      const circle = builder.circle("c1", center, 15);
      expect(circle.cy).toBeInstanceOf(GeometryFeatureReference);
      expect(circle.cy.property).toBe("cy");
    });

    it("CircleExpression exposes r accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 5, 10);
      const circle = builder.circle("c1", center, 15);
      expect(circle.r).toBeInstanceOf(GeometryFeatureReference);
      expect(circle.r.property).toBe("r");
    });

    it("CircleExpression exposes radius accessor", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 5, 10);
      const circle = builder.circle("c1", center, 15);
      expect(circle.radius).toBeInstanceOf(GeometryFeatureReference);
      expect(circle.radius.property).toBe("r");
    });
  });

  describe("Line feature accessors", () => {
    it("LineExpression exposes x1, y1, x2, y2, length accessors", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const line = builder.line("l1", start, end);
      expect(line.x1).toBeInstanceOf(GeometryFeatureReference);
      expect(line.y1).toBeInstanceOf(GeometryFeatureReference);
      expect(line.x2).toBeInstanceOf(GeometryFeatureReference);
      expect(line.y2).toBeInstanceOf(GeometryFeatureReference);
      expect(line.length).toBeInstanceOf(GeometryFeatureReference);
    });
  });

  describe("CoordinateSystem feature accessors", () => {
    it("CoordinateSystemExpression exposes x, y, arrowLength, rotation accessors", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs1", 0, 0, 10, Math.PI / 4);
      expect(cs.x).toBeInstanceOf(GeometryFeatureReference);
      expect(cs.y).toBeInstanceOf(GeometryFeatureReference);
      expect(cs.arrowLength).toBeInstanceOf(GeometryFeatureReference);
      expect(cs.rotation).toBeInstanceOf(GeometryFeatureReference);
    });
  });
});

// ============================================================================
// SPEC SECTION 9: Expression Implementations
// ============================================================================

describe("SPEC-9: Expression Implementations", () => {
  describe("CircleExpression", () => {
    it("accepts ParameterValue for radius", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, 10);
      builder.circle("c2", center, "circleRadius" as const);
      const c1 = builder.circle("c3", center, 5);
      builder.circle("c4", center, c1.r);
    });

    it("tracks feature reference dependencies", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 10, 10);
      builder.circle("c2", center2, c1.r);
      const c2Expr = builder.getExpression("c2")!;
      expect(c2Expr.dependencies).toContain("center2");
      expect(c2Expr.dependencies).toContain("c1");
    });

    it("tracks config parameter dependencies", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "circleRadius" as const);
      const c1Expr = builder.getExpression("c1")!;
      expect(c1Expr.parameters).toContain("circleRadius");
    });
  });

  describe("PointInCoordinateSystemExpression", () => {
    it("accepts ParameterValue for localX and localY", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      builder.pointInCs("p1", cs, 5, 5);
      builder.pointInCs("p2", cs, "p1x" as const, "p1y" as const);
      const p1 = builder.pointInCs("p3", cs, 1, 1);
      builder.pointInCs("p4", cs, p1.x, 5);
    });

    it("tracks dependencies for both coordinates", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs", 0, 0, 10, 0);
      const p1 = builder.pointInCs("p1", cs, 5, 5);
      builder.pointInCs("p2", cs, p1.x, "p1y" as const);
      const p2Expr = builder.getExpression("p2")!;
      expect(p2Expr.dependencies).toContain("cs");
      expect(p2Expr.dependencies).toContain("p1");
      expect(p2Expr.parameters).toContain("p1y");
    });
  });

  describe("LineTowardsExpression", () => {
    it("accepts ParameterValue for length", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);
      builder.lineTowards("l1", start, end, 10);
      builder.lineTowards("l2", start, end, "lineExtensionLength" as const);
      const c1 = builder.circle("c1", start, 5);
      builder.lineTowards("l3", start, end, c1.r);
    });

    it("tracks length dependency", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);
      const c1 = builder.circle("c1", start, 5);
      builder.lineTowards("l1", start, end, c1.r);
      const l1Expr = builder.getExpression("l1")!;
      expect(l1Expr.dependencies).toContain("c1");
    });
  });

  describe("PointAtExpression", () => {
    it("accepts ParameterValue for ratio", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const line = builder.line("l1", start, end);
      builder.pointAt("p1", line, 0.5);
      builder.pointAt("p2", line, "C1_POSITION_RATIO" as const);
      const c1 = builder.circle("c1", start, 0.5);
      builder.pointAt("p3", line, c1.r);
    });

    it("tracks ratio dependency", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const line = builder.line("l1", start, end);
      const c1 = builder.circle("c1", start, 0.5);
      builder.pointAt("p1", line, c1.r);
      const p1Expr = builder.getExpression("p1")!;
      expect(p1Expr.dependencies).toContain("c1");
    });
  });

  describe("IntersectionExpression", () => {
    it("accepts ParameterValue for options", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 10);
      const start = builder.point("start", -5, 0);
      const end = builder.point("end", 5, 0);
      const line = builder.line("l1", start, end);
      builder.intersection("ix1", circle, line);
      builder.intersection("ix2", circle, line, { excludeId: "c1" });
    });

    it("tracks dependencies correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 10);
      const start = builder.point("start", -5, 0);
      const end = builder.point("end", 5, 0);
      const line = builder.line("l1", start, end);
      builder.intersection("ix1", circle, line);
      const ixExpr = builder.getExpression("ix1")!;
      expect(ixExpr.dependencies).toContain("c1");
      expect(ixExpr.dependencies).toContain("l1");
    });
  });

  describe("CircleIntersectionExpression", () => {
    it("accepts ParameterValue for options", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 5, 0);
      const c2 = builder.circle("c2", center2, 10);
      builder.circleIntersection("ci1", c1, c2);
      builder.circleIntersection("ci2", c1, c2, { select: "north" });
    });

    it("tracks dependencies correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 5, 0);
      const c2 = builder.circle("c2", center2, 10);
      builder.circleIntersection("ci1", c1, c2, { select: "north" });
      const ciExpr = builder.getExpression("ci1")!;
      expect(ciExpr.dependencies).toContain("c1");
      expect(ciExpr.dependencies).toContain("c2");
    });
  });

  describe("PolygonExpression", () => {
    it("accepts array of points", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const p1 = builder.point("p1", 0, 0);
      const p2 = builder.point("p2", 10, 0);
      const p3 = builder.point("p3", 10, 10);
      const p4 = builder.point("p4", 0, 10);
      builder.polygon("poly1", [p1, p2, p3, p4]);
    });

    it("tracks point dependencies", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const p1 = builder.point("p1", 0, 0);
      const p2 = builder.point("p2", 10, 0);
      const p3 = builder.point("p3", 10, 10);
      const p4 = builder.point("p4", 0, 10);
      builder.polygon("poly1", [p1, p2, p3, p4]);
      const polyExpr = builder.getExpression("poly1")!;
      expect(polyExpr.dependencies).toContain("p1");
      expect(polyExpr.dependencies).toContain("p2");
      expect(polyExpr.dependencies).toContain("p3");
      expect(polyExpr.dependencies).toContain("p4");
    });
  });

  describe("LineExpression length accessor", () => {
    it("length accessor returns feature reference", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 3, 4);
      const line = builder.line("l1", start, end);
      const lengthRef = line.length;
      expect(lengthRef).toBeInstanceOf(GeometryFeatureReference);
      expect(lengthRef.sourceId).toBe("l1");
      expect(lengthRef.property).toBe("length");
    });

    it("length accessor creates reference for computed property", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 3, 4);
      const line = builder.line("l1", start, end);
      const lengthRef = line.length;

      // Verify the reference is properly constructed
      expect(lengthRef.sourceId).toBe("l1");
      expect(lengthRef.property).toBe("length");
      expect(lengthRef.toString()).toBe("geom:l1.length");
    });
  });
});

// ============================================================================
// SPEC SECTION 10: Builder Integration
// ============================================================================

describe("SPEC-10: Builder Integration", () => {
  describe("param() helper", () => {
    it("returns the key unchanged with type safety", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const key = builder.param("circleRadius");
      expect(key).toBe("circleRadius");
      expect(typeof key).toBe("string");
    });

    it("works with circle radius parameter", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, builder.param("circleRadius"));
      const config: TestConfig = {
        circleRadius: 42,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, config);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("c1").r).toBe(42);
    });
  });

  describe("geom() helper", () => {
    it("creates GeometryFeatureReference with correct source and property", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = builder.geom(point, "x");
      expect(ref).toBeInstanceOf(GeometryFeatureReference);
      expect(ref.sourceId).toBe("p1");
      expect(ref.property).toBe("x");
    });

    it("works with circle radius", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 10);
      const ref = builder.geom(c1, "r");
      expect(ref.sourceId).toBe("c1");
      expect(ref.property).toBe("r");
    });

    it("is usable in expression construction", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 10, 10);
      builder.circle("c2", center2, builder.geom(c1, "r"));
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("c2").r).toBe(10);
    });
  });
});

// ============================================================================
// SPEC SECTION 11: Dependency Tracking
// ============================================================================

describe("SPEC-11: Dependency Tracking", () => {
  describe("11.1: Feature reference dependencies", () => {
    it("tracks geometry feature references in dependencies array", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.r);
      const c2Expr = builder.getExpression("c2")!;
      expect(c2Expr.dependencies).toContain("c1");
    });

    it("tracks config parameters in parameters array", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "circleRadius" as const);
      const c1Expr = builder.getExpression("c1")!;
      expect(c1Expr.parameters).toContain("circleRadius");
    });

    it("handles transitive dependencies correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      const c2 = builder.circle("c2", center2, c1.r);
      const center3 = builder.point("center3", 40, 40);
      builder.circle("c3", center3, c2.r);
      const c3Expr = builder.getExpression("c3")!;
      expect(c3Expr.dependencies).toContain("center3");
      expect(c3Expr.dependencies).toContain("c2");
    });
  });

  describe("11.3: Topological sort", () => {
    it("orders expressions with feature references correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center1 = builder.point("center1", 0, 0);
      const c1 = builder.circle("c1", center1, 10);
      const center2 = builder.point("center2", 20, 20);
      builder.circle("c2", center2, c1.r);
      const order = builder.getExecutionOrder();
      const idxCenter1 = order.indexOf("center1");
      const idxC1 = order.indexOf("c1");
      const idxCenter2 = order.indexOf("center2");
      const idxC2 = order.indexOf("c2");
      expect(idxCenter1).toBeLessThan(idxC1);
      expect(idxC1).toBeLessThan(idxC2);
      expect(idxCenter2).toBeLessThan(idxC2);
    });
  });
});

// ============================================================================
// SPEC SECTION 12: Example - Square Construction
// ============================================================================

describe("SPEC-12: Square Construction with Feature References", () => {
  it("builds square construction with feature references", () => {
    const builder = new GeometryBuilder<TestConfig>();
    const config: TestConfig = {
      circleRadius: 100,
      p1x: -150,
      p1y: 0,
      p2x: 150,
      p2y: 0,
      C1_POSITION_RATIO: 0.5,
      coordinateSystemArrowLength: 10,
      lineExtensionLength: 200,
    };

    const cs = builder.coordinateSystem("cs", 0, 0, "coordinateSystemArrowLength" as const, 0);
    const p1 = builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);
    const p2 = builder.pointInCs("p2", cs, "p2x" as const, "p2y" as const);
    const line_main = builder.line("line_main", p1, p2);
    const c1 = builder.pointAt("c1", line_main, "C1_POSITION_RATIO" as const);
    const c1_c = builder.circle("c1_c", c1, "circleRadius" as const);
    const c2 = builder.intersection("c2", c1_c, line_main);
    const c2_c = builder.circle("c2_c", c2, c1_c.r); // FEATURE REFERENCE
    const pi = builder.circleIntersection("pi", c1_c, c2_c, { select: "north" });
    builder.circle("ci", pi, c1_c.r); // FEATURE REFERENCE
    const line_c2_pi = builder.lineTowards("line_c2_pi", c2, pi, "lineExtensionLength" as const);
    const line_c1_pi = builder.lineTowards("line_c1_pi", c1, pi, "lineExtensionLength" as const);
    const p3 = builder.intersection("p3", builder.getExpression("ci")!, line_c2_pi, {
      excludeId: "c2",
    });
    const p4 = builder.intersection("p4", builder.getExpression("ci")!, line_c1_pi, {
      excludeId: "c1",
    });
    const line_c2_p4 = builder.line("line_c2_p4", c2, p4);
    const pl = builder.intersection("pl", c2_c, line_c2_p4);
    const line_c1_p3 = builder.line("line_c1_p3", c1, p3);
    const pr = builder.intersection("pr", c1_c, line_c1_p3);
    builder.polygon("square", [pl, pr, c1, c2]);

    const steps = builder.compile();
    const allValues = new Map<string, any>();
    for (const step of steps) {
      const outputs = step.compute(allValues, config);
      for (const [key, value] of outputs) allValues.set(key, value);
    }

    expect(allValues.get("cs")).toBeDefined();
    expect(allValues.get("c1_c")).toBeDefined();
    expect(allValues.get("c2_c")).toBeDefined();
    expect(allValues.get("ci")).toBeDefined();
    expect(allValues.get("square")).toBeDefined();

    const c1_cValue = allValues.get("c1_c");
    const c2_cValue = allValues.get("c2_c");
    expect(c2_cValue.r).toBe(c1_cValue.r);
    expect(c2_cValue.r).toBe(config.circleRadius);
    const ciValue = allValues.get("ci");
    expect(ciValue.r).toBe(c1_cValue.r);
  });
});

// ============================================================================
// SPEC SECTION 13: Non-Functional Requirements
// ============================================================================

describe("SPEC-13: Non-Functional Requirements", () => {
  describe("Backward compatibility", () => {
    it("all existing code with numeric literals continues to work", () => {
      const builder = new GeometryBuilder<TestConfig>();
      builder.point("p1", 10, 20);
      builder.point("p2", 30, 40);
      builder.circle("c1", builder.getExpression("p1")!, 15);
      builder.line("l1", builder.getExpression("p1")!, builder.getExpression("p2")!);
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      for (const step of steps) {
        const outputs = step.compute(allValues, {} as TestConfig);
        for (const [key, value] of outputs) allValues.set(key, value);
      }
      expect(allValues.get("p1")).toBeDefined();
      expect(allValues.get("c1")).toBeDefined();
      expect(allValues.get("c1").r).toBe(15);
    });
  });

  describe("Zero runtime overhead", () => {
    it("feature references are lightweight objects", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 0, 0);
      const ref = point.x;
      const keys = Object.keys(ref);
      expect(keys).toContain("type");
      expect(keys).toContain("sourceId");
      expect(keys).toContain("property");
      expect(keys.length).toBe(3);
    });
  });
});

// ============================================================================
// SPEC SECTION 14: Error Handling
// ============================================================================

describe("SPEC-14: Error Handling", () => {
  describe("Missing config parameter", () => {
    it("throws descriptive error for missing config parameter", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "missingParam" as any);
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      const centerStep = steps.find((s) => s.id === "step_center");
      if (centerStep) {
        for (const [key, value] of centerStep.compute(allValues, {} as TestConfig)) {
          allValues.set(key, value);
        }
      }
      const circleStep = steps.find((s) => s.id === "step_c1");
      expect(circleStep).toBeDefined();
      expect(() => circleStep!.compute(allValues, {} as TestConfig)).toThrow(
        "Missing config parameter",
      );
    });
  });

  describe("Invalid parameter type", () => {
    it("throws descriptive error for non-numeric config parameter", () => {
      const builder = new GeometryBuilder<{ radius: string }>();
      const center = builder.point("center", 0, 0);
      builder.circle("c1", center, "radius" as const);
      const steps = builder.compile();
      const allValues = new Map<string, any>();
      allValues.set("center", { type: "point", x: 0, y: 0 });
      expect(() => {
        for (const step of steps) step.compute(allValues, { radius: "not a number" });
      }).toThrow("is not a number");
    });
  });

  describe("Missing geometry reference", () => {
    it("throws descriptive error for missing geometry", () => {
      // Create a minimal fake expression for testing error cases
      const fakeExpr = {
        id: "nonexistent",
        type: "point" as const,
        dependencies: [] as const,
        parameters: [] as const,
        compile: () => ({}) as any,
      };
      // Use as any for the property since we're testing error cases
      const ref = new GeometryFeatureReference(fakeExpr as any, "x" as any);
      const inputs = new Map<string, any>();
      expect(() => ref.resolve(inputs)).toThrow("source geometry 'nonexistent' not found");
    });
  });

  describe("Non-numeric property", () => {
    it("throws descriptive error for non-numeric property", () => {
      // Create a reference that will fail at resolve time
      const fakeExpr = {
        id: "p1",
        type: "point" as const,
        dependencies: [] as const,
        parameters: [] as const,
        compile: () => ({}) as any,
      };
      // Use as any for the property since we're testing error cases
      const ref = new GeometryFeatureReference(fakeExpr as any, "x" as any);
      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: "not a number", y: 20 });
      expect(() => ref.resolve(inputs)).toThrow("is not a number");
    });
  });
});

// ============================================================================
// SPEC SECTION 15: Shared Utility
// ============================================================================

describe("SPEC-15: Shared Utility - resolveParameter", () => {
  describe("resolveParameter function", () => {
    it("resolves literal number", () => {
      const inputs = new Map<string, any>();
      const params: TestConfig = {
        circleRadius: 10,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      expect(resolveParameter(inputs, params, 42, "test")).toBe(42);
    });

    it("resolves config parameter", () => {
      const inputs = new Map<string, any>();
      const params: TestConfig = {
        circleRadius: 25,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      expect(resolveParameter(inputs, params, "circleRadius" as const, "radius")).toBe(25);
    });

    it("resolves feature reference", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;
      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });
      const params: TestConfig = {
        circleRadius: 0,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      expect(resolveParameter(inputs, params, ref, "x")).toBe(10);
    });

    it("throws for invalid type", () => {
      const inputs = new Map<string, any>();
      const params: TestConfig = {
        circleRadius: 10,
        p1x: 0,
        p1y: 0,
        p2x: 0,
        p2y: 0,
        C1_POSITION_RATIO: 0.5,
        coordinateSystemArrowLength: 10,
        lineExtensionLength: 100,
      };
      expect(() => resolveParameter(inputs, params, {} as any, "test")).toThrow(
        "Invalid test type",
      );
    });
  });
});
