// Unit tests for GeometryExpression isVisual property
// Tests that FAIL before implementation (documenting current broken behavior)
// and PASS after implementation

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { createTestContext } from "../../dsl-test-utils";

// Test configuration type
interface TestConfig {
  tolerance: number;
}

const defaultConfig: TestConfig = {
  tolerance: 0.001,
};

// ============================================================================
// Helper to check if isVisual property exists on an expression
// ============================================================================

function hasIsVisualProperty(obj: unknown): obj is { isVisual: boolean } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "isVisual" in obj &&
    typeof (obj as Record<string, unknown>).isVisual === "boolean"
  );
}

// ============================================================================
// SHOULD FAIL: isVisual property does not exist yet
// ============================================================================

describe("SHOULD FAIL: isVisual property does not exist on GeometryExpression", () => {
  let builder: GeometryBuilder<TestConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>();
  });

  it("PointExpression missing isVisual property", () => {
    const p1 = builder.point("P1", 10, 20);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((p1 as any).isVisual).toBeUndefined();
  });

  it("VectorExpression missing isVisual property", () => {
    const cs1 = builder.coordinateSystem("CS1", 0, 0, 0, 0);
    const cs2 = builder.coordinateSystem("CS2", 10, 10, 0, 0);
    const vec = builder.vector("vec_cs1_cs2", cs1, cs2);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((vec as any).isVisual).toBeUndefined();
  });

  it("AddExpression missing isVisual property", () => {
    const a = builder.add("add_test", 1, 2);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((a as any).isVisual).toBeUndefined();
  });

  it("SubtractExpression missing isVisual property", () => {
    const s = builder.subtract("sub_test", 5, 2);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).isVisual).toBeUndefined();
  });

  it("MultiplyExpression missing isVisual property", () => {
    const m = builder.multiply("mul_test", 2, 3);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((m as any).isVisual).toBeUndefined();
  });

  it("DivideExpression missing isVisual property", () => {
    const d = builder.divide("div_test", 10, 2);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((d as any).isVisual).toBeUndefined();
  });

  it("DistanceExpression missing isVisual property", () => {
    const p1 = builder.point("p1", 0, 0);
    const p2 = builder.point("p2", 3, 4);
    const dist = builder.distance("dist_test", p1, p2);
    // @ts-expect-error - isVisual property doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((dist as any).isVisual).toBeUndefined();
  });
});

// ============================================================================
// WILL PASS AFTER FIX: isVisual property exists and has correct values
// ============================================================================

describe("WILL PASS AFTER FIX: isVisual property on GeometryExpression", () => {
  let builder: GeometryBuilder<TestConfig>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>();
  });

  describe("Non-visual expressions have isVisual=false", () => {
    it("VectorExpression has isVisual=false", () => {
      const cs1 = builder.coordinateSystem("CS1", 0, 0, 0, 0);
      const cs2 = builder.coordinateSystem("CS2", 10, 10, 0, 0);
      const vec = builder.vector("vec_cs1_cs2", cs1, cs2);
      
      expect(hasIsVisualProperty(vec)).toBe(true);
      expect(vec.isVisual).toBe(false);
    });

    it("AddExpression has isVisual=false", () => {
      const a = builder.add("add_test", 1, 2);
      
      expect(hasIsVisualProperty(a)).toBe(true);
      expect(a.isVisual).toBe(false);
    });

    it("SubtractExpression has isVisual=false", () => {
      const s = builder.subtract("sub_test", 5, 2);
      
      expect(hasIsVisualProperty(s)).toBe(true);
      expect(s.isVisual).toBe(false);
    });

    it("MultiplyExpression has isVisual=false", () => {
      const m = builder.multiply("mul_test", 2, 3);
      
      expect(hasIsVisualProperty(m)).toBe(true);
      expect(m.isVisual).toBe(false);
    });

    it("DivideExpression has isVisual=false", () => {
      const d = builder.divide("div_test", 10, 2);
      
      expect(hasIsVisualProperty(d)).toBe(true);
      expect(d.isVisual).toBe(false);
    });

    it("DistanceExpression has isVisual=false", () => {
      const p1 = builder.point("p1", 0, 0);
      const p2 = builder.point("p2", 3, 4);
      const dist = builder.distance("dist_test", p1, p2);
      
      expect(hasIsVisualProperty(dist)).toBe(true);
      expect(dist.isVisual).toBe(false);
    });
  });

  describe("Visual expressions have isVisual=true (or default to true)", () => {
    it("PointExpression has isVisual=true", () => {
      const p1 = builder.point("P1", 10, 20);
      
      expect(hasIsVisualProperty(p1)).toBe(true);
      expect(p1.isVisual).toBe(true);
    });

    it("LineExpression has isVisual=true", () => {
      const l1 = builder.line("L1", 0, 0, 100, 100);
      
      expect(hasIsVisualProperty(l1)).toBe(true);
      expect(l1.isVisual).toBe(true);
    });

    it("LineExpression from points has isVisual=true", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);
      const l1 = builder.line("L1_from_points", p1, p2);
      
      expect(hasIsVisualProperty(l1)).toBe(true);
      expect(l1.isVisual).toBe(true);
    });

    it("CircleExpression has isVisual=true", () => {
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("C1", center, 50);
      
      expect(hasIsVisualProperty(c1)).toBe(true);
      expect(c1.isVisual).toBe(true);
    });

    it("CoordinateSystemExpression has isVisual=true", () => {
      const cs1 = builder.coordinateSystem("CS1", 0, 0, 100, 0);
      
      expect(hasIsVisualProperty(cs1)).toBe(true);
      expect(cs1.isVisual).toBe(true);
    });

    it("PolygonExpression has isVisual=true", () => {
      const p1 = builder.point("p1", 0, 0);
      const p2 = builder.point("p2", 10, 0);
      const p3 = builder.point("p3", 5, 10);
      const poly = builder.polygon("poly1", [p1, p2, p3]);
      
      expect(hasIsVisualProperty(poly)).toBe(true);
      expect(poly.isVisual).toBe(true);
    });

    it("PointInCoordinateSystemExpression has isVisual=true", () => {
      const cs = builder.coordinateSystem("cs1", 0, 0, 100, 0);
      const p1 = builder.pointInCs("p1", cs, 10, 20);
      
      expect(hasIsVisualProperty(p1)).toBe(true);
      expect(p1.isVisual).toBe(true);
    });

    it("PointAtExpression has isVisual=true", () => {
      const l1 = builder.line("l1", 0, 0, 100, 100);
      const p_at = builder.pointAt("point_at", l1, 0.5);
      
      expect(hasIsVisualProperty(p_at)).toBe(true);
      expect(p_at.isVisual).toBe(true);
    });

    it("IntersectionExpression has isVisual=true", () => {
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 50);
      const l1 = builder.line("l1", 0, 0, 100, 100);
      const intersect = builder.intersection("intersect1", c1, l1);
      
      expect(hasIsVisualProperty(intersect)).toBe(true);
      expect(intersect.isVisual).toBe(true);
    });

    it("CircleIntersectionExpression has isVisual=true", () => {
      const center1 = builder.point("center1", 0, 0);
      const center2 = builder.point("center2", 100, 0);
      const c1 = builder.circle("c1", center1, 50);
      const c2 = builder.circle("c2", center2, 50);
      const circle_intersect = builder.circleIntersection("circle_intersect", c1, c2);
      
      expect(hasIsVisualProperty(circle_intersect)).toBe(true);
      expect(circle_intersect.isVisual).toBe(true);
    });

    it("LineIntersectionExpression has isVisual=true", () => {
      const l1 = builder.line("l1", 0, 0, 100, 100);
      const l2 = builder.line("l2", 0, 100, 100, 0);
      const line_intersect = builder.lineIntersection("line_intersect", l1, l2);
      
      expect(hasIsVisualProperty(line_intersect)).toBe(true);
      expect(line_intersect.isVisual).toBe(true);
    });

    it("BisectCircleAndPointExpression has isVisual=true", () => {
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 50);
      const p1 = builder.point("p1", 100, 0);
      const bisect = builder.bisectCircleAndPoint("bisect1", c1, p1);
      
      expect(hasIsVisualProperty(bisect)).toBe(true);
      expect(bisect.isVisual).toBe(true);
    });

    it("LineTowardsExpression has isVisual=true", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 100, 100);
      const line_towards = builder.lineTowards("line_towards", start, end, 200);
      
      expect(hasIsVisualProperty(line_towards)).toBe(true);
      expect(line_towards.isVisual).toBe(true);
    });

    it("CircleWithDistanceRadiusExpression has isVisual=true", () => {
      const center = builder.point("center", 0, 0);
      const p1 = builder.point("p1", 10, 0);
      const p2 = builder.point("p2", 0, 10);
      const circle_dist = builder.circleWithDistanceRadius("circle_dist", center, p1, p2);
      
      expect(hasIsVisualProperty(circle_dist)).toBe(true);
      expect(circle_dist.isVisual).toBe(true);
    });
  });
});
