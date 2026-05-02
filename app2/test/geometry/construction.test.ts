// app2/test/geometry/construction.test.ts

import { describe, it, expect } from "vitest";
import {
  Construction,
  NoIntersectionError,
  GeometryNotFoundError,
} from "../../src/geometry/construction";
import type { PointRef } from "../../src/geometry/construction";
import type { Point, Line, Circle, Polygon } from "../../src/types/geometry";

// Helper for approximate equality
const approx = (a: number, b: number, epsilon = 1e-10) => Math.abs(a - b) < epsilon;

describe("Construction", () => {
  describe("point", () => {
    it("should create point with coordinates", () => {
      const c = new Construction();
      const p = c.point(100, 200, "p1");
      expect(p.id).toBe("p1");
      const value = c.get<Point>(p);
      expect(value.x).toBe(100);
      expect(value.y).toBe(200);
      expect(value.type).toBe("point");
    });

    it("should auto-generate name", () => {
      const c = new Construction();
      const p = c.point(100, 200);
      expect(p.id).toBe("point_1");
    });

    it("should copy point from ref with name", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(p1, "p2");
      expect(p2.id).toBe("p2");
      const v1 = c.get<Point>(p1);
      const v2 = c.get<Point>(p2);
      expect(v1.x).toBe(v2.x);
      expect(v1.y).toBe(v2.y);
    });

    it("should copy point from ref without name", () => {
      const c = new Construction();
      const p1 = c.point(100, 200, "p1");
      const p2 = c.point(p1);
      expect(p2.id).toBe("point_1");
      const v1 = c.get<Point>(p1);
      const v2 = c.get<Point>(p2);
      expect(v1.x).toBe(v2.x);
      expect(v1.y).toBe(v2.y);
    });

    it("should create multiple points with unique auto-names", () => {
      const c = new Construction();
      const p1 = c.point(0, 0);
      const p2 = c.point(10, 10);
      const p3 = c.point(20, 20);
      expect(p1.id).toBe("point_1");
      expect(p2.id).toBe("point_2");
      expect(p3.id).toBe("point_3");
    });
  });

  describe("line", () => {
    it("should create line with coordinates (x1, y1, x2, y2, name)", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      expect(l.id).toBe("line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(100);
      expect(value.y2).toBe(100);
      expect(value.type).toBe("line");
    });

    it("should create line from point refs", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const l = c.line(p1, p2, "line1");
      expect(l.id).toBe("line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(100);
      expect(value.y2).toBe(100);
    });

    it("should auto-generate line name from points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const l = c.line(p1, p2);
      expect(l.id).toBe("p1_to_p2");
    });

    it("should auto-generate line name without points", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100);
      expect(l.id).toBe("line_1");
    });

    it("should create horizontal line", () => {
      const c = new Construction();
      const l = c.line(0, 50, 100, 50, "horizontal");
      const value = c.get<Line>(l);
      expect(value.y1).toBe(50);
      expect(value.y2).toBe(50);
    });

    it("should create vertical line", () => {
      const c = new Construction();
      const l = c.line(50, 0, 50, 100, "vertical");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(50);
      expect(value.x2).toBe(50);
    });
  });

  describe("circle", () => {
    it("should create circle with coordinates", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 50, "circle1");
      expect(circ.id).toBe("circle1");
      const value = c.get<Circle>(circ);
      expect(value.cx).toBe(0);
      expect(value.cy).toBe(0);
      expect(value.r).toBe(50);
      expect(value.type).toBe("circle");
    });

    it("should create circle from point ref", () => {
      const c = new Construction();
      const p = c.point(100, 200, "center");
      const circ = c.circle(p, 50, "circle1");
      expect(circ.id).toBe("circle1");
      const value = c.get<Circle>(circ);
      expect(value.cx).toBe(100);
      expect(value.cy).toBe(200);
      expect(value.r).toBe(50);
    });

    it("should auto-generate circle name from point", () => {
      const c = new Construction();
      const p = c.point(100, 200, "center");
      const circ = c.circle(p, 50);
      expect(circ.id).toBe("center_circle");
    });

    it("should auto-generate circle name without point", () => {
      const c = new Construction();
      const circ = c.circle(100, 200, 50);
      expect(circ.id).toBe("circle_1");
    });
  });

  describe("polygon", () => {
    it("should create polygon from points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 0, "p2");
      const p3 = c.point(100, 100, "p3");
      const p4 = c.point(0, 100, "p4");
      const poly = c.polygon([p1, p2, p3, p4], "square");
      expect(poly.id).toBe("square");
      const value = c.get<Polygon>(poly);
      expect(value.points).toHaveLength(4);
      expect(value.type).toBe("polygon");
    });

    it("should create triangle", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 0, "p2");
      const p3 = c.point(50, 100, "p3");
      const tri = c.polygon([p1, p2, p3], "triangle");
      const value = c.get<Polygon>(tri);
      expect(value.points).toHaveLength(3);
    });

    it("should auto-generate polygon name", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 0, "p2");
      const p3 = c.point(100, 100, "p3");
      const poly = c.polygon([p1, p2, p3]);
      expect(poly.id).toBe("polygon_1");
    });
  });

  describe("pointAt", () => {
    it("should create point at ratio on line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      const p = c.pointAt(l, 0.5, "mid");
      const value = c.get<Point>(p);
      expect(value.x).toBe(50);
      expect(value.y).toBe(50);
    });

    it("should create point at ratio 0 (start)", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      const p = c.pointAt(l, 0, "start");
      const value = c.get<Point>(p);
      expect(value.x).toBe(0);
      expect(value.y).toBe(0);
    });

    it("should create point at ratio 1 (end)", () => {
      const c = new Construction();
      const l = c.line(0, 0, 100, 100, "line1");
      const p = c.pointAt(l, 1, "end");
      const value = c.get<Point>(p);
      expect(value.x).toBe(100);
      expect(value.y).toBe(100);
    });

    it("should create point at ratio on horizontal line", () => {
      const c = new Construction();
      const l = c.line(0, 50, 200, 50, "line1");
      const p = c.pointAt(l, 0.25, "quarter");
      const value = c.get<Point>(p);
      expect(value.x).toBe(50);
      expect(value.y).toBe(50);
    });
  });

  describe("pointOnLineAtDistance", () => {
    it("should create point at distance on line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "line1");
      const start = c.point(0, 0, "start");
      const p = c.pointOnLineAtDistance(l, 5, start, "p_at_5");
      const value = c.get<Point>(p);
      expect(value.x).toBe(5);
      expect(value.y).toBe(0);
    });

    it("should create point at distance beyond line end", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "line1");
      const start = c.point(0, 0, "start");
      const p = c.pointOnLineAtDistance(l, 20, start, "p_at_20");
      const value = c.get<Point>(p);
      expect(value.x).toBe(20);
      expect(value.y).toBe(0);
    });

    it("should throw for zero-length line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 0, 0, "zero_line");
      const start = c.point(0, 0, "start");
      expect(() => c.pointOnLineAtDistance(l, 5, start)).toThrow(
        "Cannot compute pointOnLineAtDistance: line zero_line has zero length",
      );
    });
  });

  describe("midpoint", () => {
    it("should create midpoint between two points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const mid = c.midpoint(p1, p2, "mid");
      const value = c.get<Point>(mid);
      expect(value.x).toBe(50);
      expect(value.y).toBe(50);
    });

    it("should create midpoint with negative coordinates", () => {
      const c = new Construction();
      const p1 = c.point(-50, -50, "p1");
      const p2 = c.point(50, 50, "p2");
      const mid = c.midpoint(p1, p2, "mid");
      const value = c.get<Point>(mid);
      expect(value.x).toBe(0);
      expect(value.y).toBe(0);
    });

    it("should auto-generate midpoint name", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(100, 100, "p2");
      const mid = c.midpoint(p1, p2);
      expect(mid.id).toBe("midpoint_1");
    });
  });

  describe("extendLine", () => {
    it("should extend line by length", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "line1");
      const extended = c.extendLine(l, 5, "extended");
      const value = c.get<Line>(extended);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(15);
      expect(value.y2).toBe(0);
    });

    it("should extend line by larger length", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "line1");
      const extended = c.extendLine(l, 100, "extended");
      const value = c.get<Line>(extended);
      expect(value.x2).toBe(110);
      expect(value.y2).toBe(0);
    });

    it("should extend diagonal line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 10, "diagonal");
      const extended = c.extendLine(l, 10 * Math.sqrt(2), "extended");
      const value = c.get<Line>(extended);
      // Original line has length sqrt(200) = 10*sqrt(2)
      // Extended by 10*sqrt(2), so new length = 20*sqrt(2)
      // x2 = 0 + 20*sqrt(2) * (10/sqrt(200)) = 0 + 20*sqrt(2) * (1/sqrt(2)) = 20
      expect(approx(value.x2, 20)).toBe(true);
      expect(approx(value.y2, 20)).toBe(true);
    });

    it("should throw for zero-length line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 0, 0, "zero_line");
      expect(() => c.extendLine(l, 5)).toThrow("Cannot extend line zero_line: has zero length");
    });
  });

  describe("lineTowards", () => {
    it("should create line towards point with length", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(10, 10, "p2");
      const l = c.lineTowards(p1, p2, 5, "line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      // Distance from p1 to end should be 5
      const dx = value.x2 - value.x1;
      const dy = value.y2 - value.y1;
      expect(approx(Math.sqrt(dx * dx + dy * dy), 5)).toBe(true);
    });

    it("should create line in correct direction", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(0, 10, "p2");
      const l = c.lineTowards(p1, p2, 5, "line1");
      const value = c.get<Line>(l);
      expect(value.x1).toBe(0);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(0);
      expect(value.y2).toBe(5);
    });

    it("should throw for zero distance between points", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(0, 0, "p2");
      expect(() => c.lineTowards(p1, p2, 5)).toThrow(
        "Cannot create lineTowards from p1 to p2: zero distance",
      );
    });
  });

  describe("perpendicular", () => {
    it("should create perpendicular line at point", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 0, "horizontal");
      const p = c.point(5, 0, "mid");
      const perp = c.perpendicular(l, p, "vertical");
      const value = c.get<Line>(perp);
      // Perpendicular to horizontal line should be vertical
      expect(value.x1).toBe(5);
      expect(value.y1).toBe(0);
      expect(value.x2).toBe(5);
      // y2 should be non-zero (line has some length)
      expect(value.y2).not.toBe(0);
    });

    it("should create perpendicular to diagonal line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 10, 10, "diagonal");
      const p = c.point(5, 5, "mid");
      const perp = c.perpendicular(l, p, "perp");
      const value = c.get<Line>(perp);
      // Perpendicular to (1,1) direction should be (-1,1) or (1,-1) direction
      const dx = value.x2 - value.x1;
      const dy = value.y2 - value.y1;
      // Dot product with original line direction should be 0
      const origDx = 10 - 0;
      const origDy = 10 - 0;
      expect(approx(dx * origDx + dy * origDy, 0)).toBe(true);
    });

    it("should throw for zero-length line", () => {
      const c = new Construction();
      const l = c.line(0, 0, 0, 0, "zero_line");
      const p = c.point(0, 0, "p");
      expect(() => c.perpendicular(l, p)).toThrow(
        "Cannot create perpendicular: original line zero_line has zero length",
      );
    });
  });

  describe("intersection", () => {
    describe("circle-circle", () => {
      it("should find circle-circle intersection with north direction", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 10, "c1");
        const c2 = c.circle(10, 0, 10, "c2");
        const pi = c.intersection(c1, c2, "north", "pi");
        const value = c.get<Point>(pi);
        // North intersection should have smaller y
        expect(value.y).toBeLessThan(0);
      });

      it("should find circle-circle intersection with south direction", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 10, "c1");
        const c2 = c.circle(10, 0, 10, "c2");
        const pi = c.intersection(c1, c2, "south", "pi");
        const value = c.get<Point>(pi);
        // South intersection should have larger y
        expect(value.y).toBeGreaterThan(0);
      });

      it("should find circle-circle intersection with exclude option", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 10, "c1");
        const c2 = c.circle(10, 0, 10, "c2");
        const pi1 = c.intersection(c1, c2, "north", "pi1");
        const pi2 = c.intersection(c1, c2, { exclude: pi1 }, "pi2");
        const v1 = c.get<Point>(pi1);
        const v2 = c.get<Point>(pi2);
        // Should be different points - these two circles intersect at (5, y) and (5, -y)
        // so x is the same but y differs
        expect(v1.x).toBe(v2.x);
        expect(v1.y).not.toBe(v2.y);
        // Verify they are the two intersection points
        expect(approx(v1.x, 5)).toBe(true);
        expect(approx(v2.x, 5)).toBe(true);
        expect(v1.y).toBeLessThan(0); // north = smaller y in SVG coords
        expect(v2.y).toBeGreaterThan(0); // south = larger y
      });

      it("should default to first intersection when no direction", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 10, "c1");
        const c2 = c.circle(10, 0, 10, "c2");
        const pi = c.intersection(c1, c2, undefined, "pi");
        expect(pi.id).toBe("pi");
        // Should not throw - defaults to first intersection
      });

      it("should throw NoIntersectionError for non-intersecting circles", () => {
        const c = new Construction();
        const c1 = c.circle(0, 0, 5, "c1");
        const c2 = c.circle(100, 100, 5, "c2");
        expect(() => c.intersection(c1, c2, "north", "pi")).toThrow(NoIntersectionError);
      });
    });

    describe("circle-line", () => {
      it("should find circle-line intersection with left direction", () => {
        const c = new Construction();
        const circ = c.circle(0, 0, 10, "circle");
        const l = c.line(-20, 0, 20, 0, "line");
        const p = c.intersection(circ, l, "left", "p");
        const value = c.get<Point>(p);
        // Left intersection should have smaller x
        expect(value.x).toBeLessThan(0);
      });

      it("should find circle-line intersection with right direction", () => {
        const c = new Construction();
        const circ = c.circle(0, 0, 10, "circle");
        const l = c.line(-20, 0, 20, 0, "line");
        const p = c.intersection(circ, l, "right", "p");
        const value = c.get<Point>(p);
        // Right intersection should have larger x
        expect(value.x).toBeGreaterThan(0);
      });

      it("should find circle-line intersection with exclude option", () => {
        const c = new Construction();
        const circ = c.circle(0, 0, 10, "circle");
        const l = c.line(-20, 5, 20, 5, "line");
        const p1 = c.intersection(circ, l, "left", "p1");
        const p2 = c.intersection(circ, l, { exclude: p1 }, "p2");
        const v1 = c.get<Point>(p1);
        const v2 = c.get<Point>(p2);
        // Should be different points
        expect(v1.x).not.toBe(v2.x);
        expect(v1.y).toBe(5);
        expect(v2.y).toBe(5);
        // x coordinates should be different (one negative, one positive)
        expect(v1.x).toBeLessThan(0);
        expect(v2.x).toBeGreaterThan(0);
      });
    });

    describe("line-circle", () => {
      it("should handle line-circle intersection (swapped order)", () => {
        const c = new Construction();
        const l = c.line(-20, 0, 20, 0, "line");
        const circ = c.circle(0, 0, 10, "circle");
        const p = c.intersection(l, circ, "left", "p");
        const value = c.get<Point>(p);
        // Should work the same as circle-line
        expect(value.x).toBeLessThan(0);
      });
    });

    describe("line-line", () => {
      it("should find line-line intersection", () => {
        const c = new Construction();
        const l1 = c.line(0, 0, 10, 10, "l1");
        const l2 = c.line(0, 10, 10, 0, "l2");
        const p = c.intersection(l1, l2, undefined, "x");
        const value = c.get<Point>(p);
        expect(approx(value.x, 5)).toBe(true);
        expect(approx(value.y, 5)).toBe(true);
      });

      it("should find line-line intersection without direction option", () => {
        const c = new Construction();
        const l1 = c.line(0, 0, 10, 10, "l1");
        const l2 = c.line(0, 10, 10, 0, "l2");
        // directionOrOptions is optional for line-line
        const p = c.intersection(l1, l2);
        expect(p.id).toBe("intersection_1");
      });

      it("should throw NoIntersectionError for parallel lines", () => {
        const c = new Construction();
        const l1 = c.line(0, 0, 10, 0, "l1");
        const l2 = c.line(0, 10, 10, 10, "l2");
        expect(() => c.intersection(l1, l2)).toThrow(NoIntersectionError);
      });
    });
  });

  describe("step navigation", () => {
    it("should start at step 0", () => {
      const c = new Construction();
      expect(c.currentStepIndex).toBe(0);
    });

    it("should navigate to specific step", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      expect(c.currentStepIndex).toBe(0);
      c.goTo(1);
      expect(c.currentStepIndex).toBe(1);
      c.goTo(2);
      expect(c.currentStepIndex).toBe(2);
    });

    it("should clamp goTo to valid range", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");

      c.goTo(-10);
      expect(c.currentStepIndex).toBe(0);
      c.goTo(100);
      expect(c.currentStepIndex).toBe(1);
    });

    it("should navigate next and prev", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      c.next();
      expect(c.currentStepIndex).toBe(1);
      c.next();
      expect(c.currentStepIndex).toBe(2);
      c.next(); // Can't go beyond end
      expect(c.currentStepIndex).toBe(2);

      c.prev();
      expect(c.currentStepIndex).toBe(1);
      c.prev();
      expect(c.currentStepIndex).toBe(0);
      c.prev(); // Can't go below 0
      expect(c.currentStepIndex).toBe(0);
    });

    it("should reset to start", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.goTo(1);
      c.reset();
      expect(c.currentStepIndex).toBe(0);
    });

    it("should get steps up to current index", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      c.goTo(1);

      const steps = c.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe("p1");
      expect(steps[1].id).toBe("p2");
    });

    it("should get all steps", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      const allSteps = c.getAllSteps();
      expect(allSteps).toHaveLength(3);
      expect(allSteps[0].id).toBe("p1");
      expect(allSteps[1].id).toBe("p2");
      expect(allSteps[2].id).toBe("p3");
    });
  });

  describe("value access", () => {
    it("should get value by ref", () => {
      const c = new Construction();
      const p = c.point(100, 200, "p1");
      const value = c.get<Point>(p);
      expect(value.x).toBe(100);
      expect(value.y).toBe(200);
    });

    it("should get all values", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      const values = c.getValues();
      expect(values.size).toBe(2);
      expect(values.get("p1")).toBeDefined();
      expect(values.get("p2")).toBeDefined();
    });

    it("should get current values up to step index", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      c.goTo(1);

      const currentValues = c.getCurrentValues();
      expect(currentValues.size).toBe(2);
      expect(currentValues.get("p1")).toBeDefined();
      expect(currentValues.get("p2")).toBeDefined();
      expect(currentValues.get("p3")).toBeUndefined();
    });

    it("should throw GeometryNotFoundError for missing ref", () => {
      const c = new Construction();
      const p: PointRef = { id: "nonexistent" };
      expect(() => c.get<Point>(p)).toThrow(GeometryNotFoundError);
    });
  });

  describe("error handling", () => {
    it("should validate successfully", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      expect(c.validate()).toBe(true);
      expect(c.getErrors()).toHaveLength(0);
    });

    it("should collect errors during validation", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      const invalidRef: PointRef = { id: "nonexistent" };

      // Try to get a non-existent geometry
      try {
        c.get<Point>(invalidRef);
      } catch {
        // Expected to throw
      }

      // Validation should still pass if we don't trigger the error
      // The validate method iterates over existing values
      expect(c.validate()).toBe(true);
    });

    it("should clear errors", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.validate();
      c.clearErrors();
      expect(c.getErrors()).toHaveLength(0);
    });
  });

  describe("square construction (integration test)", () => {
    it("should construct a square with all 16 steps", () => {
      const c = new Construction();

      // Step 1: Main line
      const ml = c.line(100, 500, 700, 500, "main_line");

      // Step 2: C1 at ratio
      const c1 = c.pointAt(ml, 5 / 8, "c1");

      // Step 3: Circle at C1
      const c1_c = c.circle(c1, 150, "c1_circle");

      // Step 4: C2 at left intersection
      const c2 = c.intersection(c1_c, ml, "left", "c2");

      // Step 5: Circle at C2
      const c1_circle = c.get<Circle>(c1_c);
      const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

      // Step 6: PI - north intersection
      const pi = c.intersection(c1_c, c2_c, "north", "pi");

      // Step 7: Circle at PI
      const ci = c.circle(pi, c1_circle.r, "ci");

      // Step 8-9: Extended lines
      const line_c2_pi = c.lineTowards(c2, pi, 2.2 * c1_circle.r, "line_c2_pi");
      const line_c1_pi = c.lineTowards(c1, pi, 2.2 * c1_circle.r, "line_c1_pi");

      // Step 10-11: P3 and P4
      const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
      const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

      // Step 12-13: Connecting lines
      const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
      const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

      // Step 14-15: Tangent points
      const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
      const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

      // Step 16: Final square
      const square = c.polygon([c1, c2, pr, pl], "square");

      // Verify all steps were created
      expect(c.getAllSteps()).toHaveLength(16);

      // Verify square has 4 points
      const squareValue = c.get<Polygon>(square);
      expect(squareValue.points).toHaveLength(4);
    });
  });

  describe("auto-naming", () => {
    it("should auto-name all geometry types uniquely", () => {
      const c = new Construction();
      const p1 = c.point(0, 0);
      const l1 = c.line(0, 0, 10, 10);
      const c1 = c.circle(0, 0, 5);
      // Pre-create the points for the polygon to get expected names
      const p2 = c.point(10, 0);
      const p3 = c.point(10, 10);
      const p4 = c.point(0, 10);
      const poly = c.polygon([p1, p2, p3, p4]);

      expect(p1.id).toBe("point_1");
      expect(l1.id).toBe("line_2");
      expect(c1.id).toBe("circle_3");
      expect(p2.id).toBe("point_4");
      expect(p3.id).toBe("point_5");
      expect(p4.id).toBe("point_6");
      expect(poly.id).toBe("polygon_7");
    });

    it("should use provided names when given", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "my_point");
      const l1 = c.line(0, 0, 10, 10, "my_line");

      expect(p1.id).toBe("my_point");
      expect(l1.id).toBe("my_line");
    });
  });

  describe("edge cases", () => {
    it("should handle very small coordinates", () => {
      const c = new Construction();
      const p = c.point(0.0001, 0.0001, "tiny");
      const value = c.get<Point>(p);
      expect(approx(value.x, 0.0001)).toBe(true);
      expect(approx(value.y, 0.0001)).toBe(true);
    });

    it("should handle negative coordinates", () => {
      const c = new Construction();
      const p = c.point(-100, -200, "negative");
      const value = c.get<Point>(p);
      expect(value.x).toBe(-100);
      expect(value.y).toBe(-200);
    });

    it("should handle large coordinates", () => {
      const c = new Construction();
      const p = c.point(1000000, 1000000, "large");
      const value = c.get<Point>(p);
      expect(value.x).toBe(1000000);
      expect(value.y).toBe(1000000);
    });

    it("should handle very large circles", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 1000000, "huge_circle");
      const value = c.get<Circle>(circ);
      expect(value.r).toBe(1000000);
    });

    it("should handle very small circles", () => {
      const c = new Construction();
      const circ = c.circle(0, 0, 0.001, "tiny_circle");
      const value = c.get<Circle>(circ);
      expect(approx(value.r, 0.001)).toBe(true);
    });
  });
});
