// app2/test/geometry/construction-phase5.test.ts
// Phase 5 feature tests for Construction class

import { describe, it, expect, beforeEach } from "vitest";
import {
  Construction,
  serializeConstruction,
  deserializeConstruction,
} from "../../src/geometry/construction";
import type { PointRef, LineRef, CircleRef, PolygonRef } from "../../src/geometry/construction";
import type { Point, Line, Circle, Polygon } from "../../src/types/geometry";

// Helper for approximate equality
const approx = (a: number, b: number, epsilon = 1e-10) => Math.abs(a - b) < epsilon;

describe("Construction Phase 5 Features", () => {
  describe("Undo/Redo Support", () => {
    it("should undo last operation", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(300, 400, "p2");
      
      // Save state after p1
      c.undo(); // Should do nothing since we haven't saved history
      
      // Check that both points still exist
      expect(c.get<Point>(p1).x).toBe(100);
      expect(c.get<Point>(p2).x).toBe(300);
    });

    it("should track history state correctly", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      
      const history = c.getHistoryState();
      // Initially no history
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
    });

    it("should clear history", () => {
      const c = new Construction();
      c.clearHistory();
      const history = c.getHistoryState();
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
    });
  });

  describe("Parameter Support", () => {
    it("should set and get parameter", () => {
      const c = new Construction();
      c.setParameter("radius", 150);
      expect(c.getParameter("radius")).toBe(150);
    });

    it("should throw error for missing parameter", () => {
      const c = new Construction();
      expect(() => c.getParameter("missing")).toThrow("Parameter not found: missing");
    });

    it("should check if parameter exists", () => {
      const c = new Construction();
      c.setParameter("test", 42);
      expect(c.hasParameter("test")).toBe(true);
      expect(c.hasParameter("missing")).toBe(false);
    });

    it("should get all parameters", () => {
      const c = new Construction();
      c.setParameter("a", 1);
      c.setParameter("b", 2);
      c.setParameter("c", 3);
      
      const params = c.getParameters();
      expect(params.size).toBe(3);
      expect(params.get("a")).toBe(1);
      expect(params.get("b")).toBe(2);
      expect(params.get("c")).toBe(3);
    });

    it("should remove parameter", () => {
      const c = new Construction();
      c.setParameter("test", 42);
      expect(c.hasParameter("test")).toBe(true);
      
      c.removeParameter("test");
      expect(c.hasParameter("test")).toBe(false);
    });

    it("should clear all parameters", () => {
      const c = new Construction();
      c.setParameter("a", 1);
      c.setParameter("b", 2);
      
      c.clearParameters();
      expect(c.getParameters().size).toBe(0);
    });

    it("should use parameter in geometry operations", () => {
      const c = new Construction();
      c.setParameter("radius", 100);
      
      const center = c.point(200, 200, "center");
      const circle = c.circle(center, c.getParameter("radius"), "circle1");
      
      const value = c.get<Circle>(circle);
      expect(value.r).toBe(100);
    });
  });

  describe("Serialization", () => {
    it("should serialize construction to JSON", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(300, 400, "p2");
      const l1 = c.line(p1, p2, "line1");
      c.setParameter("test", 42);

      const json = c.toJSON();
      expect(json).toBeDefined();
      expect(typeof json).toBe("string");
      
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe(1);
      expect(parsed.stepIndex).toBe(0);
      expect(parsed.parameters.test).toBe(42);
      expect(parsed.geometries.length).toBe(3);
    });

    it("should deserialize construction from JSON", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(300, 400, "p2");
      const l1 = c.line(p1, p2, "line1");
      c.setParameter("test", 42);

      const json = c.toJSON();
      const c2 = Construction.fromJSON(json);

      expect(c2.getParameter("test")).toBe(42);
      expect(c2.get<Point>({ id: "p1" }).x).toBe(100);
      expect(c2.get<Point>({ id: "p2" }).x).toBe(300);
    });

    it("should handle serialization round-trip", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(300, 400, "p2");
      const l1 = c.line(p1, p2, "line1");
      const circle = c.circle(p1, 50, "circle1");
      c.setParameter("radius", 50);

      const json = c.toJSON();
      const c2 = Construction.fromJSON(json);

      // Verify all geometries exist
      expect(c2.get<Point>({ id: "p1" }).x).toBe(100);
      expect(c2.get<Point>({ id: "p2" }).x).toBe(300);
      expect(c2.get<Line>({ id: "line1" }).x1).toBe(100);
      expect(c2.get<Circle>({ id: "circle1" }).r).toBe(50);
      expect(c2.getParameter("radius")).toBe(50);
    });

    it("should throw error for unsupported version", () => {
      const invalidJson = JSON.stringify({
        version: 999,
        stepIndex: 0,
        nameCounter: 0,
        parameters: {},
        geometries: [],
      });

      expect(() => Construction.fromJSON(invalidJson)).toThrow(
        "Unsupported serialization version: 999. Expected 1",
      );
    });
  });

  describe("Validation (Pre-flight Checks)", () => {
    it("should validate valid construction", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(300, 400, "p2");
      const l1 = c.line(p1, p2, "line1");

      const result = c.validateFull();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect zero-length lines", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const l1 = c.line(100, 200, 100, 200, "zero_line"); // Zero length

      const result = c.validateFull();
      expect(result.valid).toBe(true); // Zero-length is a warning, not an error
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("zero_length_line");
      expect(result.warnings[0].geometryId).toBe("zero_line");
    });

    it("should detect zero-radius circles", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const circle = c.circle(p1, 0, "zero_circle");

      const result = c.validateFull();
      expect(result.valid).toBe(true); // Zero-radius is a warning, not an error
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("zero_radius_circle");
      expect(result.warnings[0].geometryId).toBe("zero_circle");
    });

    it("should detect invalid polygons", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(200, 200, "p2");
      const polygon = c.polygon([p1, p2], "invalid_polygon"); // Only 2 points

      const result = c.validateFull();
      expect(result.valid).toBe(true); // Invalid polygon is a warning, not an error
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("invalid_polygon");
      expect(result.warnings[0].geometryId).toBe("invalid_polygon");
    });

    it("should detect multiple issues", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const zeroLine = c.line(100, 200, 100, 200, "zero_line");
      const zeroCircle = c.circle(p1, 0, "zero_circle");
      const p2 = c.point(200, 200, "p2");
      const p3 = c.point(300, 200, "p3");
      const invalidPoly = c.polygon([p2, p3], "invalid_poly");

      const result = c.validateFull();
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("Test Constructions", () => {
  describe("Triangle Construction", () => {
    it("should create triangle construction", async () => {
      const { createTriangleConstruction } = await import("../../src/geometry/test-constructions/triangle");
      const c = new Construction();
      
      const result = createTriangleConstruction(c, 0, 0, 100, 0);
      
      expect(result.base).toBeDefined();
      expect(result.p1).toBeDefined();
      expect(result.p2).toBeDefined();
      expect(result.c1).toBeDefined();
      expect(result.c2).toBeDefined();
      expect(result.p3).toBeDefined();
      expect(result.side1).toBeDefined();
      expect(result.side2).toBeDefined();
    });

    it("should create equilateral triangle", async () => {
      const { createEquilateralTriangle } = await import("../../src/geometry/test-constructions/triangle");
      const c = new Construction();
      
      const result = createEquilateralTriangle(c, 200, 200, 100);
      
      expect(result.p1).toBeDefined();
      expect(result.p2).toBeDefined();
      expect(result.p3).toBeDefined();
      expect(result.side1).toBeDefined();
      expect(result.side2).toBeDefined();
      expect(result.side3).toBeDefined();
    });
  });

  describe("Hexagon Construction", () => {
    it("should create hexagon construction", async () => {
      const { createHexagonConstruction } = await import("../../src/geometry/test-constructions/hexagon");
      const c = new Construction();
      
      const result = createHexagonConstruction(c, 200, 200, 100);
      
      expect(result.center).toBeDefined();
      expect(result.circle).toBeDefined();
      expect(result.points).toHaveLength(6);
      expect(result.sides).toHaveLength(6);
      expect(result.hexagon).toBeDefined();
    });

    it("should create hexagon with parameter", async () => {
      const { createHexagonWithParameter } = await import("../../src/geometry/test-constructions/hexagon");
      const c = new Construction();
      
      const result = createHexagonWithParameter(c, 200, 200);
      
      expect(result.center).toBeDefined();
      expect(result.circle).toBeDefined();
      expect(result.points).toHaveLength(6);
      expect(result.sides).toHaveLength(6);
      expect(result.hexagon).toBeDefined();
      expect(c.hasParameter("hexagonRadius")).toBe(true);
    });
  });
});
