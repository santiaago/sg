// GeometryFeatureReference unit tests
import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "../src/geometry/dsl/GeometryBuilder";
import { GeometryFeatureReference } from "../src/geometry/dsl/GeometryFeatureReference";
import type { GeometryExpression } from "../src/geometry/dsl/expressions/GeometryExpression";

interface TestConfig {
  radius: number;
  x: number;
  y: number;
}

describe("GeometryFeatureReference", () => {
  describe("Construction", () => {
    it("should create a feature reference with sourceId and property", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);

      // Use feature accessor getter
      const ref = point.x;

      expect(ref.sourceId).toBe("p1");
      expect(ref.property).toBe("x");
      expect(ref.type).toBe("geometry_feature_reference");
    });

    it("should work with different property names via getters", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 10);

      const cxRef = circle.cx;
      const cyRef = circle.cy;
      const rRef = circle.r;

      expect(cxRef.property).toBe("cx");
      expect(cyRef.property).toBe("cy");
      expect(rRef.property).toBe("r");
    });

    it("should work with radius alias", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 10);

      const rRef = circle.r;
      const radiusRef = circle.radius;

      expect(rRef.property).toBe("r");
      expect(radiusRef.property).toBe("r");
    });
  });

  describe("toString", () => {
    it("should return formatted string", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);

      const ref = point.y;

      expect(ref.toString()).toBe("geom:p1.y");
    });
  });

  describe("resolve", () => {
    it("should resolve to the correct numeric value", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;

      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });

      const value = ref.resolve(inputs);
      expect(value).toBe(10);
    });

    it("should resolve y coordinate correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.y;

      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });

      const value = ref.resolve(inputs);
      expect(value).toBe(20);
    });

    it("should resolve circle radius correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 15);
      const ref = circle.r;

      const inputs = new Map<string, any>();
      inputs.set("center", { type: "point", x: 0, y: 0 });
      inputs.set("c1", { type: "circle", cx: 0, cy: 0, r: 15 });

      const value = ref.resolve(inputs);
      expect(value).toBe(15);
    });

    it("should resolve circle center coordinates correctly", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 5, 10);
      const circle = builder.circle("c1", center, 15);

      const cxRef = circle.cx;
      const cyRef = circle.cy;

      const inputs = new Map<string, any>();
      inputs.set("center", { type: "point", x: 5, y: 10 });
      inputs.set("c1", { type: "circle", cx: 5, cy: 10, r: 15 });

      expect(cxRef.resolve(inputs)).toBe(5);
      expect(cyRef.resolve(inputs)).toBe(10);
    });

    it("should throw error for missing source geometry", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;

      const inputs = new Map<string, any>();
      // Don't add p1 to inputs

      expect(() => ref.resolve(inputs)).toThrow(
        "GeometryFeatureReference: source geometry 'p1' not found",
      );
    });

    it("should throw error for non-numeric property", () => {
      // Create a reference manually for testing
      const ref = new GeometryFeatureReference(
        { id: "p1", type: "point", dependencies: [], parameters: [] } as any,
        "type",
      );

      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });

      expect(() => ref.resolve(inputs)).toThrow("is not a number");
    });

    it("should throw error for missing property", () => {
      const ref = new GeometryFeatureReference(
        { id: "p1", type: "point", dependencies: [], parameters: [] } as unknown as GeometryExpression<TestConfig, "point">,
        "type" as keyof { type: string },
      );

      const inputs = new Map<string, any>();
      inputs.set("p1", { type: "point", x: 10, y: 20 });

      expect(() => ref.resolve(inputs)).toThrow("is not a number");
    });
  });

  describe("isGeometryFeatureReference type guard", () => {
    it("should correctly identify feature references", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);
      const ref = point.x;

      expect(ref.type).toBe("geometry_feature_reference");
    });
  });

  describe("Integration with expressions", () => {
    it("should work with feature accessor getters on PointExpression", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const point = builder.point("p1", 10, 20);

      const xRef = point.x;
      const yRef = point.y;

      expect(xRef.sourceId).toBe("p1");
      expect(xRef.property).toBe("x");
      expect(yRef.sourceId).toBe("p1");
      expect(yRef.property).toBe("y");
    });

    it("should work with circle feature accessors", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, 10);

      const cxRef = circle.cx;
      const cyRef = circle.cy;
      const rRef = circle.r;
      const radiusRef = circle.radius;

      expect(cxRef.sourceId).toBe("c1");
      expect(cyRef.sourceId).toBe("c1");
      expect(rRef.sourceId).toBe("c1");
      expect(radiusRef.sourceId).toBe("c1");

      expect(rRef.property).toBe("r");
      expect(radiusRef.property).toBe("r");
    });

    it("should work with LineExpression feature accessors", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 10, 10);
      const lineExpr = builder.line("line1", start, end);

      const x1Ref = lineExpr.x1;
      const y1Ref = lineExpr.y1;
      const x2Ref = lineExpr.x2;
      const y2Ref = lineExpr.y2;

      expect(x1Ref.sourceId).toBe("line1");
      expect(y1Ref.sourceId).toBe("line1");
      expect(x2Ref.sourceId).toBe("line1");
      expect(y2Ref.sourceId).toBe("line1");
    });

    it("should work with CoordinateSystemExpression feature accessors", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cs = builder.coordinateSystem("cs1", 0, 0, 10, 0);

      const xRef = cs.x;
      const yRef = cs.y;
      const arrowRef = cs.arrowLength;
      const rotationRef = cs.rotation;

      expect(xRef.sourceId).toBe("cs1");
      expect(yRef.sourceId).toBe("cs1");
      expect(arrowRef.sourceId).toBe("cs1");
      expect(rotationRef.sourceId).toBe("cs1");
    });
  });

  describe("Dependency tracking", () => {
    it("should track feature reference dependencies in CircleExpression", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const c1 = builder.circle("c1", center, 10);
      const c2 = builder.circle("c2", builder.point("center2", 5, 5), c1.r);

      const expr = builder.getExpression("c2")!;
      expect(expr.dependencies).toContain("center2");
      expect(expr.dependencies).toContain("c1");
    });

    it("should track config parameter dependencies in CircleExpression", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const center = builder.point("center", 0, 0);
      const circle = builder.circle("c1", center, "radius" as const);

      const expr = builder.getExpression("c1")!;
      expect(expr.parameters).toContain("radius");
    });
  });
});
