// Unit tests for Construction class
// Tests all geometry creation and operation methods

import { describe, it, expect } from "vitest";
import {
  Construction,
  type PointRef,
  type LineRef,
  type CircleRef,
  type PolygonRef,
  ConstructionError,
  NoIntersectionError,
  GeometryNotFoundError,
} from "../src/geometry/construction";
import type { Point, Line, Circle, Polygon } from "../src/types/geometry";

// Helper for approximate float comparison
const approx = (a: number, b: number, epsilon = 1e-10) => {
  return Math.abs(a - b) < epsilon;
};

// Helper to get value from ref
const getValue = <T>(c: Construction, ref: { id: string }): T => {
  return c.get<T>(ref as any);
};

describe("Construction", () => {
  describe("Base Geometry Creators", () => {
    describe("point()", () => {
      it("creates a point with coordinates", () => {
        const c = new Construction();
        const p = c.point(10, 20, "p1");
        expect(p.id).toBe("p1");
        const value = getValue<Point>(c, p);
        expect(value.type).toBe("point");
        expect(value.x).toBe(10);
        expect(value.y).toBe(20);
      });

      it("auto-generates name when not provided", () => {
        const c = new Construction();
        const p1 = c.point(1, 2);
        const p2 = c.point(3, 4);
        expect(p1.id).toBe("point_1");
        expect(p2.id).toBe("point_2");
      });
    });

    describe("line() with coordinates", () => {
      it("creates a line from coordinates", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 10, "line1");
        expect(l.id).toBe("line1");
        const value = getValue<Line>(c, l);
        expect(value.type).toBe("line");
        expect(value.x1).toBe(0);
        expect(value.y1).toBe(0);
        expect(value.x2).toBe(10);
        expect(value.y2).toBe(10);
      });

      it("auto-generates name when not provided", () => {
        const c = new Construction();
        const l = c.line(0, 0, 5, 5);
        expect(l.id).toBe("line_1");
      });
    });

    describe("line() with PointRefs", () => {
      it("creates a line from two points", () => {
        const c = new Construction();
        const p1 = c.point(0, 0, "p1");
        const p2 = c.point(10, 10, "p2");
        const l = c.line(p1, p2, "line1");
        expect(l.id).toBe("line1");
        const value = getValue<Line>(c, l);
        expect(value.x1).toBe(0);
        expect(value.y1).toBe(0);
        expect(value.x2).toBe(10);
        expect(value.y2).toBe(10);
      });

      it("auto-generates name from point IDs", () => {
        const c = new Construction();
        const p1 = c.point(0, 0, "a");
        const p2 = c.point(10, 10, "b");
        const l = c.line(p1, p2);
        expect(l.id).toBe("a_to_b");
      });
    });

    describe("circle() with coordinates", () => {
      it("creates a circle from coordinates", () => {
        const c = new Construction();
        const circle = c.circle(5, 5, 10, "c1");
        expect(circle.id).toBe("c1");
        const value = getValue<Circle>(c, circle);
        expect(value.type).toBe("circle");
        expect(value.cx).toBe(5);
        expect(value.cy).toBe(5);
        expect(value.r).toBe(10);
      });
    });

    describe("circle() with PointRef", () => {
      it("creates a circle from point and radius", () => {
        const c = new Construction();
        const center = c.point(5, 5, "center");
        const circle = c.circle(center, 10, "c1");
        expect(circle.id).toBe("c1");
        const value = getValue<Circle>(c, circle);
        expect(value.cx).toBe(5);
        expect(value.cy).toBe(5);
        expect(value.r).toBe(10);
      });

      it("auto-generates name from point ID", () => {
        const c = new Construction();
        const center = c.point(5, 5, "c");
        const circle = c.circle(center, 10);
        expect(circle.id).toBe("c_circle");
      });
    });
  });

  describe("Derived Geometry Operations", () => {
    describe("pointAt()", () => {
      it("creates point at ratio on line", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 10, "line1");
        const p = c.pointAt(l, 0.5, "mid");
        const value = getValue<Point>(c, p);
        expect(value.x).toBe(5);
        expect(value.y).toBe(5);
      });

      it("creates point at 0 ratio (start)", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 10, "line1");
        const p = c.pointAt(l, 0, "start");
        const value = getValue<Point>(c, p);
        expect(value.x).toBe(0);
        expect(value.y).toBe(0);
      });

      it("creates point at 1 ratio (end)", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 10, "line1");
        const p = c.pointAt(l, 1, "end");
        const value = getValue<Point>(c, p);
        expect(value.x).toBe(10);
        expect(value.y).toBe(10);
      });
    });

    describe("pointOnLineAtDistance()", () => {
      it("creates point at distance from line start", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 0, "line1");
        const p = c.pointOnLineAtDistance(l, 5, undefined, "p1");
        const value = getValue<Point>(c, p);
        expect(approx(value.x, 5)).toBe(true);
        expect(value.y).toBe(0);
      });

      it("creates point at distance from custom point", () => {
        const c = new Construction();
        const l = c.line(0, 0, 20, 0, "line1");
        const from = c.point(10, 0, "start");
        const p = c.pointOnLineAtDistance(l, 5, from, "p1");
        const value = getValue<Point>(c, p);
        // Should be at 10 + 5 = 15 along x-axis
        expect(approx(value.x, 15)).toBe(true);
        expect(value.y).toBe(0);
      });
    });

    describe("midpoint()", () => {
      it("creates midpoint between two points", () => {
        const c = new Construction();
        const p1 = c.point(0, 0, "p1");
        const p2 = c.point(10, 10, "p2");
        const mid = c.midpoint(p1, p2, "mid");
        const value = getValue<Point>(c, mid);
        expect(value.x).toBe(5);
        expect(value.y).toBe(5);
      });
    });

    describe("lineTowards()", () => {
      it("creates line from point towards another point with length", () => {
        const c = new Construction();
        const from = c.point(0, 0, "from");
        const towards = c.point(10, 0, "towards");
        const l = c.lineTowards(from, towards, 5, "line1");
        const value = getValue<Line>(c, l);
        expect(value.x1).toBe(0);
        expect(value.y1).toBe(0);
        expect(value.x2).toBe(5);
        expect(value.y2).toBe(0);
      });
    });

    describe("extendLine()", () => {
      it("extends line by given length", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 0, "line1");
        const extended = c.extendLine(l, 5, "extended");
        const value = getValue<Line>(c, extended);
        // Original length is 10, extended by 5 should be 15 total
        expect(approx(value.x2, 15)).toBe(true);
        expect(value.y2).toBe(0);
      });
    });

    describe("perpendicular()", () => {
      it("creates perpendicular line at point", () => {
        const c = new Construction();
        const l = c.line(0, 0, 10, 0, "horizontal");
        const p = c.point(5, 0, "at");
        const perp = c.perpendicular(l, p, "perp");
        const value = getValue<Line>(c, perp);
        // Perpendicular to horizontal line is vertical
        expect(value.x1).toBe(5);
        expect(value.y1).toBe(0);
        expect(approx(value.x2, 5)).toBe(true);
        expect(value.y2).not.toBe(0);
      });
    });

    describe("polygon()", () => {
      it("creates polygon from points", () => {
        const c = new Construction();
        const p1 = c.point(0, 0, "p1");
        const p2 = c.point(10, 0, "p2");
        const p3 = c.point(10, 10, "p3");
        const p4 = c.point(0, 10, "p4");
        const poly = c.polygon([p1, p2, p3, p4], "square");
        const value = getValue<Polygon>(c, poly);
        expect(value.type).toBe("polygon");
        expect(value.points).toHaveLength(4);
        expect(value.points[0].x).toBe(0);
        expect(value.points[0].y).toBe(0);
        expect(value.points[1].x).toBe(10);
        expect(value.points[1].y).toBe(0);
      });
    });
  });

  describe("Intersection Operations", () => {
    describe("circle-circle intersection", () => {
      it("finds north intersection of two circles", () => {
        const c = new Construction();
        // Two circles that intersect
        const c1 = c.circle(0, 0, 5, "c1");
        const c2 = c.circle(8, 0, 5, "c2");
        const pi = c.intersection(c1, c2, "north", "pi");
        const value = getValue<Point>(c, pi);
        // Should be at approximately (4, ~4) - north intersection
        expect(approx(value.x, 4)).toBe(true);
        expect(value.y > 0).toBe(true);
      });

      it("finds south intersection of two circles", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 5, "c1");
        const c2 = c.circle(8, 0, 5, "c2");
        const pi = c.intersection(c1, c2, "south", "pi");
        const value = getValue<Point>(c, pi);
        // Should be at approximately (4, ~-4) - south intersection
        expect(approx(value.x, 4)).toBe(true);
        expect(value.y < 0).toBe(true);
      });

      it("throws NoIntersectionError for non-intersecting circles", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 1, "c1");
        const c2 = c.circle(10, 10, 1, "c2");
        expect(() => c.intersection(c1, c2, "north", "pi")).toThrow(
          NoIntersectionError,
        );
      });
    });

    describe("circle-line intersection", () => {
      it("finds intersection with exclude option", () => {
        const c = new Construction();
        const circle = c.circle(0, 0, 5, "circle");
        const line = c.line(-10, 0, 10, 0, "line");
        const p1 = c.point(-5, 0, "p1");
        const p2 = c.intersection(circle, line, { exclude: p1 }, "p2");
        const value = getValue<Point>(c, p2);
        // Should find the other intersection point
        expect(value.x).not.toBe(-5);
        expect(approx(Math.sqrt(value.x * value.x + value.y * value.y), 5)).toBe(true);
      });

      it("finds intersection with direction option", () => {
        const c = new Construction();
        const circle = c.circle(0, 0, 5, "circle");
        const line = c.line(-10, 0, 10, 0, "line");
        const p = c.intersection(circle, line, "left", "p");
        const value = getValue<Point>(c, p);
        // Should find an intersection point on the x-axis
        expect(approx(value.y, 0)).toBe(true);
        expect(approx(Math.abs(value.x), 5)).toBe(true);
      });
    });

    describe("line-line intersection", () => {
      it("finds intersection of two lines", () => {
        const c = new Construction();
        const l1 = c.line(0, 0, 10, 10, "l1");
        const l2 = c.line(0, 10, 10, 0, "l2");
        const p = c.intersection(l1, l2, undefined, "intersection");
        const value = getValue<Point>(c, p);
        expect(approx(value.x, 5)).toBe(true);
        expect(approx(value.y, 5)).toBe(true);
      });

      it("throws NoIntersectionError for parallel lines", () => {
        const c = new Construction();
        const l1 = c.line(0, 0, 10, 0, "l1");
        const l2 = c.line(0, 1, 10, 1, "l2");
        expect(() => c.intersection(l1, l2, undefined, "pi")).toThrow(
          NoIntersectionError,
        );
      });
    });
  });

  describe("Step Management", () => {
    it("tracks step count", () => {
      const c = new Construction();
      expect(c.stepCount).toBe(0);
      c.point(0, 0, "p1");
      expect(c.stepCount).toBe(1);
      c.line(0, 0, 10, 10, "l1");
      expect(c.stepCount).toBe(2);
    });

    it("navigates steps with goTo", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      c.goTo(1);
      expect(c.currentStepIndex).toBe(1);
      expect(c.getSteps()).toHaveLength(2);

      c.goTo(0);
      expect(c.currentStepIndex).toBe(0);
      expect(c.getSteps()).toHaveLength(1);

      c.goTo(2);
      expect(c.currentStepIndex).toBe(2);
      expect(c.getSteps()).toHaveLength(3);
    });

    it("navigates with next and prev", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      c.next();
      expect(c.currentStepIndex).toBe(1);

      c.next();
      expect(c.currentStepIndex).toBe(2);

      c.prev();
      expect(c.currentStepIndex).toBe(1);

      c.prev();
      expect(c.currentStepIndex).toBe(0);

      // Can't go below 0
      c.prev();
      expect(c.currentStepIndex).toBe(0);

      // Can't go above max
      c.goTo(2);
      c.next();
      expect(c.currentStepIndex).toBe(2);
    });

    it("resets to first step", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.goTo(1);
      c.reset();
      expect(c.currentStepIndex).toBe(0);
    });

    it("getAllSteps returns all steps", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      expect(c.getAllSteps()).toHaveLength(3);
    });
  });

  describe("Value Access", () => {
    it("get retrieves geometry by ref", () => {
      const c = new Construction();
      const p = c.point(5, 5, "p1");
      const value = c.get<Point>(p);
      expect(value.x).toBe(5);
      expect(value.y).toBe(5);
    });

    it("getValues returns all values", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(10, 10, "p2");
      const values = c.getValues();
      expect(values.size).toBe(2);
      expect(values.get("p1")).toBeDefined();
      expect(values.get("p2")).toBeDefined();
    });

    it("getValue retrieves by ID", () => {
      const c = new Construction();
      c.point(5, 5, "p1");
      const value = c.getValue("p1");
      expect(value).toBeDefined();
      expect((value as Point).x).toBe(5);
    });

    it("get throws GeometryNotFoundError for missing geometry", () => {
      const c = new Construction();
      const p = c.point(0, 0, "p1");
      // Create a ref with wrong ID
      const badRef = { id: "nonexistent" } as PointRef;
      expect(() => c.get<Point>(badRef)).toThrow(GeometryNotFoundError);
    });
  });

  describe("Error Handling", () => {
    it("validate returns true for valid construction", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.line(0, 0, 10, 10, "l1");
      expect(c.validate()).toBe(true);
      expect(c.getErrors()).toHaveLength(0);
    });

    it("validate collects errors for invalid operations", () => {
      const c = new Construction();
      const c1 = c.circle(0, 0, 1, "c1");
      const c2 = c.circle(10, 10, 1, "c2");
      // This intersection will fail (circles don't intersect)
      try {
        c.intersection(c1, c2, "north", "pi");
      } catch {
        // Expected to throw
      }
      // validate should still work
      expect(c.validate()).toBe(true); // All created steps are valid
    });

    it("clearErrors clears error list", () => {
      const c = new Construction();
      // Create some geometry
      c.point(0, 0, "p1");
      c.clearErrors();
      expect(c.getErrors()).toHaveLength(0);
    });
  });

  describe("Square Construction Integration Test", () => {
    it("can construct a square geometry", () => {
      const c = new Construction();

      // Create base line
      const p1 = c.point(0, 100, "p1");
      const p2 = c.point(200, 100, "p2");
      const mainLine = c.line(p1, p2, "main_line");

      // Create C1 at ratio along main line
      const c1 = c.pointAt(mainLine, 5 / 8, "c1");

      // Create circle at C1
      const c1Circle = c.circle(c1, 50, "c1_circle");

      // Validate we have the right number of steps
      expect(c.stepCount).toBe(5);

      // Verify C1 position
      const c1Value = c.get<Point>(c1);
      expect(approx(c1Value.x, 125)).toBe(true); // 200 * 5/8 = 125
      expect(approx(c1Value.y, 100)).toBe(true);
    });
  });
});
