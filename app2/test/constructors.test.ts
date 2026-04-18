// Unit tests for geometry constructor functions
import { describe, it, expect } from "vitest";
import {
  circleFromPoint,
  pointFromCircles,
  pointFromCircleAndLine,
  square,
  pointOnLineAtDistance,
  lineTowards,
  circleWithRadiusFrom,
} from "../src/geometry/constructors";
import { point, line, circle } from "../src/types/geometry";
import type { Point, Line, Circle, Polygon } from "../src/types/geometry";

// Test fixtures
const origin: Point = point(0, 0);
const pointA: Point = point(10, 0);
const pointB: Point = point(0, 10);
const pointC: Point = point(10, 10);
const circleA: Circle = circle(0, 0, 5);
const circleB: Circle = circle(10, 0, 5);
const lineAB: Line = line(0, 0, 10, 0);

// Helper to check if two points are approximately equal
function pointsEqual(p1: Point, p2: Point, epsilon = 0.001): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}

// Helper to check if two lines are approximately equal
function linesEqual(l1: Line, l2: Line, epsilon = 0.001): boolean {
  return (
    pointsEqual({ x: l1.x1, y: l1.y1 }, { x: l2.x1, y: l2.y1 }, epsilon) &&
    pointsEqual({ x: l1.x2, y: l1.y2 }, { x: l2.x2, y: l2.y2 }, epsilon)
  );
}

describe("circleFromPoint", () => {
  it("creates a circle with correct center and radius", () => {
    const result = circleFromPoint(point(1, 2), 5);
    expect(result.cx).toBe(1);
    expect(result.cy).toBe(2);
    expect(result.r).toBe(5);
    expect(result.type).toBe("circle");
  });

  it("creates a circle at origin with radius 0", () => {
    const result = circleFromPoint(origin, 0);
    expect(result.cx).toBe(0);
    expect(result.cy).toBe(0);
    expect(result.r).toBe(0);
  });
});

describe("pointFromCircles", () => {
  it("finds north intersection point of two intersecting circles", () => {
    // Two circles with centers at (0,0) and (6,0), both radius 5
    // They intersect at (3, ~4) and (3, ~/4)
    const circleC: Circle = circle(0, 0, 5);
    const circleD: Circle = circle(6, 0, 5);
    const result = pointFromCircles(circleC, circleD, { select: "north" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("point");
    // North = smaller y in SVG coords
    expect(result!.x).toBeCloseTo(3, 4);
    expect(result!.y).toBeCloseTo(-4, 4);
  });

  it("finds south intersection point of two intersecting circles", () => {
    const circleC: Circle = circle(0, 0, 5);
    const circleD: Circle = circle(6, 0, 5);
    const result = pointFromCircles(circleC, circleD, { select: "south" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("point");
    // South = larger y in SVG coords
    expect(result!.x).toBeCloseTo(3, 4);
    expect(result!.y).toBeCloseTo(4, 4);
  });

  it("defaults to north when no selection specified", () => {
    const circleC: Circle = circle(0, 0, 5);
    const circleD: Circle = circle(6, 0, 5);
    const result = pointFromCircles(circleC, circleD);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(3, 4);
    expect(result!.y).toBeCloseTo(-4, 4);
  });

  it("returns null for non-intersecting circles (too far apart)", () => {
    const circleC: Circle = circle(0, 0, 2);
    const circleD: Circle = circle(10, 0, 2);
    const result = pointFromCircles(circleC, circleD);
    expect(result).toBeNull();
  });

  it("returns intersection for tangent circles", () => {
    const circleC: Circle = circle(0, 0, 5);
    const circleD: Circle = circle(10, 0, 5);
    const result = pointFromCircles(circleC, circleD);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(5, 4);
    expect(result!.y).toBeCloseTo(0, 4);
  });
});

describe("pointFromCircleAndLine", () => {
  it("finds intersection of circle and line - no exclusion", () => {
    const circleOrigin: Circle = circle(0, 0, 5);
    const lineXY: Line = line(-10, 0, 10, 0);
    const result = pointFromCircleAndLine(circleOrigin, lineXY);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("point");
    expect(result!.y).toBeCloseTo(0, 4);
  });

  it("finds the non-excluded intersection point", () => {
    const circleOrigin: Circle = circle(0, 0, 5);
    const lineXY: Line = line(-10, 0, 10, 0);
    const excludePoint: Point = point(5, 0);
    const result = pointFromCircleAndLine(circleOrigin, lineXY, {
      exclude: excludePoint,
    });
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(-5, 4);
    expect(result!.y).toBeCloseTo(0, 4);
  });

  it("uses custom tolerance for exclusion", () => {
    const circleOrigin: Circle = circle(0, 0, 5);
    const lineXY: Line = line(-10, 0, 10, 0);
    const excludePoint: Point = point(5, 0.0001); // Slightly off
    // With default tolerance, should still exclude
    const result = pointFromCircleAndLine(circleOrigin, lineXY, {
      exclude: excludePoint,
      tolerance: 0.001,
    });
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(-5, 4);
  });

  it("returns null when no intersection exists", () => {
    const circleOrigin: Circle = circle(0, 0, 2);
    const lineFar: Line = line(10, 10, 20, 20);
    const result = pointFromCircleAndLine(circleOrigin, lineFar);
    expect(result).toBeNull();
  });
});

describe("square", () => {
  it("creates a polygon from 4 points in order", () => {
    const result = square(origin, pointA, pointC, pointB);
    expect(result.type).toBe("polygon");
    expect(result.points).toHaveLength(4);
    // polygon function creates plain {x, y} objects, not Point types
    expect(result.points[0]).toEqual({ x: 0, y: 0 });
    expect(result.points[1]).toEqual({ x: 10, y: 0 });
    expect(result.points[2]).toEqual({ x: 10, y: 10 });
    expect(result.points[3]).toEqual({ x: 0, y: 10 });
  });
});

describe("pointOnLineAtDistance", () => {
  it("finds point at exact distance along line", () => {
    const result = pointOnLineAtDistance(origin, pointA, 5);
    expect(result.type).toBe("point");
    expect(result.x).toBeCloseTo(5, 4);
    expect(result.y).toBeCloseTo(0, 4);
  });

  it("extends beyond target point when distance exceeds line length", () => {
    const result = pointOnLineAtDistance(origin, pointA, 15);
    expect(result.x).toBeCloseTo(15, 4);
    expect(result.y).toBeCloseTo(0, 4);
  });

  it("handles diagonal lines correctly", () => {
    const result = pointOnLineAtDistance(origin, pointC, 5 * Math.sqrt(2));
    expect(result.x).toBeCloseTo(5, 4);
    expect(result.y).toBeCloseTo(5, 4);
  });

  it("returns from point when direction vector is zero length", () => {
    const result = pointOnLineAtDistance(origin, origin, 5);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

describe("lineTowards", () => {
  it("creates line from point towards another point with specified length", () => {
    const result = lineTowards(origin, pointA, 5);
    expect(result.type).toBe("line");
    expect(result.x1).toBe(0);
    expect(result.y1).toBe(0);
    expect(result.x2).toBeCloseTo(5, 4);
    expect(result.y2).toBeCloseTo(0, 4);
  });

  it("creates line extending beyond target when length exceeds distance", () => {
    const result = lineTowards(origin, pointA, 15);
    expect(result.x2).toBeCloseTo(15, 4);
    expect(result.y2).toBeCloseTo(0, 4);
  });

  it("handles diagonal direction correctly", () => {
    const result = lineTowards(origin, pointC, 10);
    const expectedLength = Math.sqrt(result.x2 * result.x2 + result.y2 * result.y2);
    expect(expectedLength).toBeCloseTo(10, 4);
  });
});

describe("circleWithRadiusFrom", () => {
  it("creates circle at center with radius from source circle", () => {
    const result = circleWithRadiusFrom(point(5, 5), circleA);
    expect(result.cx).toBe(5);
    expect(result.cy).toBe(5);
    expect(result.r).toBe(5);
  });

  it("works with different source circle radius", () => {
    const circleBig: Circle = circle(0, 0, 100);
    const result = circleWithRadiusFrom(point(1, 2), circleBig);
    expect(result.r).toBe(100);
    expect(result.cx).toBe(1);
    expect(result.cy).toBe(2);
  });
});
