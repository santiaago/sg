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
 * Creates a circle at a center point with radius from another circle.
 * Useful for creating circles with the same radius as an existing circle.
 */
export function circleWithRadiusFrom(center: Point, sourceCircle: Circle): Circle {
  return circle(center.x, center.y, sourceCircle.r);
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

// ========================================
// SixFoldV0 Helper Functions
// ========================================

import { bisect as bisectFn, circlesIntersectionPoint, directions } from "@sg/geometry";

// Helper to check if a value is a valid number (not NaN or Infinity)
export function isValidNumber(n: number): boolean {
  return typeof n === "number" && !Number.isNaN(n) && Number.isFinite(n);
}

// Validation
/** Create valid point or return null */
export function validPoint(x: number, y: number): Point | null {
  if (!isValidNumber(x) || !isValidNumber(y)) return null;
  // Also check for unreasonably large coordinates (likely calculation errors)
  // Canvas dimensions are 840x519, so values beyond 10000 are suspicious
  if (Math.abs(x) > 10000 || Math.abs(y) > 10000) return null;
  return point(x, y);
}

/** Get distance between two points */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (!isValidNumber(dx) || !isValidNumber(dy)) return 0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return isValidNumber(dist) ? dist : 0;
}

// V3 Compatibility
/** Bisect circle and point - matching v3 logic */
export function bisectCircleAndPoint(c: Circle, p: Point): Point {
  const cx0 = c.cx - c.r;
  const cy0 = c.cy;
  const angle = Math.atan2(cy0 - p.y, cx0 - p.x);
  const [x, y] = bisectFn(angle * 2, c.r, c.cx, c.cy);
  return point(x, y);
}

// Circle Intersection
/** Helper to compute circlesIntersectionPoint with our Circle types */
export function circlesIntersectionPointHelper(
  c1: Circle,
  c2: Circle,
  dir:
    | typeof directions.up
    | typeof directions.down
    | typeof directions.left
    | typeof directions.right,
): Point | null {
  // circlesIntersectionPoint expects Circle objects from @sg/geometry
  // We create compatible objects using type assertions
  const sgC1 = { p: { x: c1.cx, y: c1.cy }, r: c1.r } as any;
  const sgC2 = { p: { x: c2.cx, y: c2.cy }, r: c2.r } as any;
  const result = circlesIntersectionPoint(sgC1, sgC2, dir);
  if (!result) return null;
  // result is a Point from @sg/geometry which has x and y properties
  const x = (result as any).x;
  const y = (result as any).y;
  return validPoint(x, y);
}

// Circle-Line Segment Intersection
/** Helper to find intersection of circle with line segment */
export function interceptCircleLineSegHelper(
  circle: Circle,
  line: Line,
  index: number = 0,
): Point | null {
  const result = inteceptCircleLineSeg(
    circle.cx,
    circle.cy,
    line.x1,
    line.y1,
    line.x2,
    line.y2,
    circle.r,
  );
  if (!result || !result[index]) return null;
  const x = result[index][0];
  const y = result[index][1];
  return validPoint(x, y);
}

// Circle-Line Intersection with Direction
/** Helper to find intersection of circle with infinite line using direction */
export function interceptCircleLineDirHelper(
  circle: Circle,
  line: Line,
  dir: typeof directions.left | typeof directions.right,
): Point | null {
  // For horizontal line, left = 0, right = 1
  // For non-horizontal lines, need more sophisticated logic
  // For now, assume horizontal line (LINE1 in SixFoldV0 is horizontal)
  const index = dir === directions.left ? 0 : 1;
  return interceptCircleLineSegHelper(circle, line, index);
}

// Circle-Infinite Line Intersection (SixFoldV0-specific)
/** Helper to find intersection of circle with INFINITE line (matching Svelte semantics) */
export function interceptCircleLineHelper(circle: Circle, line: Line, index: number): Point | null {
  const cx = circle.cx;
  const cy = circle.cy;
  const r = circle.r;
  const x1 = line.x1,
    y1 = line.y1;
  const x2 = line.x2,
    y2 = line.y2;

  // Line coefficients: ax + by + c = 0
  // a = y2 - y1, b = x1 - x2, c = x2*y1 - x1*y2
  const a = y2 - y1;
  const b = x1 - x2;
  const c = x2 * y1 - x1 * y2;

  // Denominator for distance calculation
  const denom = a * a + b * b;
  if (denom === 0) return null; // line is degenerate (a point)

  // Distance from circle center to line
  const dist = Math.abs(a * cx + b * cy + c) / Math.sqrt(denom);

  if (dist > r) return null; // no intersection
  if (dist === r) {
    // tangent - one intersection point
    const sign = a * cx + b * cy + c < 0 ? 1 : -1;
    const dx = b * sign * (r / Math.sqrt(denom));
    const dy = -a * sign * (r / Math.sqrt(denom));
    const px = cx + dx;
    const py = cy + dy;
    return index === 0 ? point(px, py) : null;
  }

  // Two intersection points
  // Find point on line closest to circle center
  const h = Math.sqrt(r * r - dist * dist);
  const px0 = cx - (a * (a * cx + b * cy + c)) / denom;
  const py0 = cy - (b * (a * cx + b * cy + c)) / denom;

  // Unit direction vector of the line from (x1,y1) to (x2,y2)
  const lineLenSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (lineLenSq === 0) return null;
  const lineLen = Math.sqrt(lineLenSq);
  const ux = (x2 - x1) / lineLen;
  const uy = (y2 - y1) / lineLen;

  // Two intersection points on infinite line
  const rawPts = [point(px0 + ux * h, py0 + uy * h), point(px0 - ux * h, py0 - uy * h)];

  // Sort by parameter t along the line direction (x1,y1) -> (x2,y2)
  // t = dot product of (pt - p1) with direction vector
  rawPts.sort((ptA, ptB) => {
    const ta = (ptA.x - x1) * (x2 - x1) + (ptA.y - y1) * (y2 - y1);
    const tb = (ptB.x - x1) * (x2 - x1) + (ptB.y - y1) * (y2 - y1);
    return ta - tb;
  });

  if (index === 0) {
    return rawPts[0];
  } else if (index === 1) {
    return rawPts[1];
  }
  return null;
}
