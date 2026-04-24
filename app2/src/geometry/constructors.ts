// High-level geometry constructor functions.
// These encapsulate common patterns used in square construction steps,
// providing a cleaner, more declarative API for geometry operations.
//
// Each function:
// - Takes explicit input parameters
// - Returns geometry values (Point, Line, Circle, Polygon) or null
// - Is pure (no side effects, same input -> same output)
// - Uses utilities from @sg/geometry package

import { intersection as rawIntersection, inteceptCircleLineSeg } from "@sg/geometry";
import type { Point, Line, Circle, Polygon } from "../types/geometry";
import { point, line, circle, polygon } from "../types/geometry";

/**
 * Creates a circle from a center point and radius.
 * Wrapper around the existing circle() factory.
 */
export function circleFromPoint(center: Point, radius: number): Circle {
  return circle(center.x, center.y, radius);
}

/**
 * Finds intersection point of two circles.
 * In SVG coords (y increases downward): 'north' = smaller y, 'south' = larger y.
 * Uses @sg/geometry's rawIntersection internally.
 * Returns null if circles don't intersect.
 */
export function pointFromCircles(
  c1: Circle,
  c2: Circle,
  options?: { select?: "north" | "south" },
): Point | null {
  const result = rawIntersection(c1.cx, c1.cy, c1.r, c2.cx, c2.cy, c2.r);

  if (!result || result.length !== 4) {
    return null;
  }

  const [x1, y1, x2, y2] = result;
  const select = options?.select ?? "north";

  if (select === "north") {
    // Pick north point (lower y-coordinate in SVG where y increases downward)
    return point(y1 < y2 ? x1 : x2, y1 < y2 ? y1 : y2);
  } else {
    // Pick south point (higher y-coordinate)
    return point(y1 > y2 ? x1 : x2, y1 > y2 ? y1 : y2);
  }
}

/**
 * Finds intersection of circle and line segment.
 * If exclude is provided, returns the other intersection point.
 * Returns null if no valid intersection found.
 */
export function pointFromCircleAndLine(
  circle: Circle,
  line: Line,
  options?: {
    exclude?: Point;
    tolerance?: number;
  },
): Point | null {
  const intersects = inteceptCircleLineSeg(
    circle.cx,
    circle.cy,
    line.x1,
    line.y1,
    line.x2,
    line.y2,
    circle.r,
  );

  if (!intersects || intersects.length === 0) {
    return null;
  }

  const { exclude, tolerance = 0.001 } = options ?? {};

  // If no exclusion, return first intersection
  if (!exclude) {
    return point(intersects[0][0], intersects[0][1]);
  }

  // Find intersection that is NOT the excluded point
  for (const [x, y] of intersects) {
    const dx = x - exclude.x;
    const dy = y - exclude.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > tolerance) {
      return point(x, y);
    }
  }

  return null;
}

/**
 * Creates a square polygon from 4 corner points in order.
 * Wrapper around polygon() factory.
 */
export function square(p1: Point, p2: Point, p3: Point, p4: Point): Polygon {
  return polygon([
    { x: p1.x, y: p1.y },
    { x: p2.x, y: p2.y },
    { x: p3.x, y: p3.y },
    { x: p4.x, y: p4.y },
  ]);
}

/**
 * Finds point on line from->to at exact distance from from.
 * Extends beyond 'to' if distance exceeds line length.
 */
export function pointOnLineAtDistance(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    // Can't determine direction, return from point
    return point(from.x, from.y);
  }

  const scale = distance / dist;
  return point(from.x + scale * dx, from.y + scale * dy);
}

/**
 * Creates line starting at 'from', in direction of 'towards', with given length.
 * Handles normalization and scaling of direction vector.
 */
export function lineTowards(from: Point, towards: Point, length: number): Line {
  const end = pointOnLineAtDistance(from, towards, length);
  return line(from.x, from.y, end.x, end.y);
}
