// Pure geometry operations for the square construction.
// Each function:
// - Takes explicit input parameters
// - Returns geometry values (Point, Line, Circle)
// - Is pure (no side effects, same input -> same output)
// - Does not depend on SVG or DOM
// These operations form the foundation for lazy step-by-step calculation
// and dependency tracking.

import {
  intersection as rawIntersection,
  bisect,
  inteceptCircleLineSeg as interceptCircleLineSeg,
} from "@sg/geometry";
import type { Point, Circle, GeometryValue } from "../types/geometry";
import { point, line, circle } from "../types/geometry";

// Constants

export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Position ratios along the main line (from x1)
export const C1_POSITION_RATIO = 5 / 8;
export const C2_POSITION_RATIO = 3 / 8;

// Line extension multiplier (1.1 * diameter = 2.2 * radius)
export const LINE_EXTENSION_MULTIPLIER = 2.2;

// Default tolerance for geometry calculations
export const DEFAULT_TOLERANCE = 0.001;

// Geometry Configuration

export interface SquareConfig {
  width: number;
  height: number;
  stroke: number;
  strokeBig: number;
  border: number;
  lineLength: number;
  circleRadius: number;
  c1x: number;
  c2x: number;
  ly1: number;
  ly2: number;
  lx1: number;
  lx2: number;
}

// Computes the square geometry configuration from SVG dimensions.
// All values are derived from width and height.
export function computeSquareConfig(width: number, height: number): SquareConfig {
  const STROKE = 0.5;
  const STROKE_BIG = 2.0; // Default for dots
  const BORDER = height / 3;
  const LINE_LENGTH = width - 2 * BORDER;
  const CIRCLE_RADIUS = LINE_LENGTH / 4;
  const C1_X_POSITION = BORDER + LINE_LENGTH * C1_POSITION_RATIO;
  const C2_X_POSITION = BORDER + LINE_LENGTH * C2_POSITION_RATIO;
  const ly2 = height - BORDER;

  return {
    width,
    height,
    stroke: STROKE,
    strokeBig: STROKE_BIG,
    border: BORDER,
    lineLength: LINE_LENGTH,
    circleRadius: CIRCLE_RADIUS,
    c1x: C1_X_POSITION,
    c2x: C2_X_POSITION,
    ly1: ly2,
    ly2,
    lx1: BORDER,
    lx2: width - BORDER,
  };
}

// Validated Geometry Accessor
// Provides type-safe access to geometry values from a Map with runtime validation.
// Throws descriptive errors if geometry is missing or has wrong type.
/**
 * Get a geometry value from a Map with type validation.
 * @param values - Map of geometry IDs to GeometryValue
 * @param id - The geometry ID to retrieve
 * @param typeGuard - Type guard function (isPoint, isLine, isCircle, etc.)
 * @param typeName - Human-readable type name for error messages
 * @returns The validated geometry value
 * @throws Error if geometry is missing or has wrong type
 */
export function getGeometry<T extends GeometryValue>(
  values: Map<string, GeometryValue>,
  id: string,
  typeGuard: (v: GeometryValue) => v is T,
  typeName: string,
): T {
  const value = values.get(id);
  if (!value) {
    throw new Error(`Missing geometry: ${id}`);
  }
  if (!typeGuard(value)) {
    throw new Error(`Expected ${typeName} for ${id}, got ${value.type}`);
  }
  return value;
}

// Geometry ID Constants

export const GEOM = {
  // Base elements
  MAIN_LINE: "line_main",

  // Circle centers (points)
  C1: "c1",
  C2: "c2",

  // Circle outlines
  C1_CIRCLE: "c1_c",
  C2_CIRCLE: "c2_c",

  // Intersection of c1_circle and c2_circle
  INTERSECTION_POINT: "pi",
  INTERSECTION_CIRCLE: "ci",

  // Bisected points from intersection
  P3: "p3",
  P4: "p4",

  // Tangent points (intersections of circles with bisected lines)
  PL: "pl", // Tangent point on left
  PR: "pr", // Tangent point on right

  // Lines from circle centers to intersection point
  LINE_C2_PI: "line_c2_pi",
  LINE_C1_PI: "line_c1_pi",

  // Connecting lines
  LINE_C2_P3: "line_c2_p3",
  LINE_C1_P4: "line_c1_p4",
  LINE_C1_P3: "line_c1_p3",
  LINE_C2_P4: "line_c2_p4",
  LINE_P3_P4: "line_p3_p4",

  // Square
  SQUARE: "square",
} as const;

// Type for geometry ID
export type GeometryId = (typeof GEOM)[keyof typeof GEOM];

// Core Geometry Operations

// Computes the intersection point of two circles.
// Inputs: c1_circle, c2_circle, selectMinY (true = north/min Y, false = south/max Y)
// Outputs: pi (intersection point), ci (circle at intersection)
export function computeCircleIntersection(
  c1: Circle,
  c2: Circle,
  selectMinY: boolean = true,
): { pi: Point; ci: Circle } {
  // Use the raw intersection function which takes coordinates directly
  const result = rawIntersection(c1.cx, c1.cy, c1.r, c2.cx, c2.cy, c2.r);

  if (!result || result.length !== 4) {
    throw new Error("Circle intersection: expected exactly 4 values (x1, y1, x2, y2)");
  }

  // Select intersection point based on selectMinY parameter
  const [x1, y1, x2, y2] = result;
  let pi: { x: number; y: number };
  if (selectMinY) {
    // Pick north point (lower y-coordinate in SVG where y increases downward)
    pi = y1 < y2 ? { x: x1, y: y1 } : { x: x2, y: y2 };
  } else {
    // Pick south point (higher y-coordinate)
    pi = y1 > y2 ? { x: x1, y: y1 } : { x: x2, y: y2 };
  }

  return {
    pi: point(pi.x, pi.y),
    ci: circle(pi.x, pi.y, c1.r),
  };
}

// Computes bisected points from the intersection point.
// Bisects angles from the intersection point to each circle center.
// Inputs: pi, c1, c2, circleRadius
// Outputs: p3, p4
export function computeBisectedPoints(
  pi: Point,
  c1: Point,
  c2: Point,
  circleRadius: number,
): { p3: Point; p4: Point } {
  const cx0 = pi.x - circleRadius;
  const cy0 = pi.y;

  // Angle from (cx0, cy0) to c2
  const angle1 = Math.atan2(cy0 - c2.y, cx0 - c2.x);
  const [px3, py3] = bisect(angle1 * 2, circleRadius, pi.x, pi.y);

  // Angle from (cx0, cy0) to c1
  const angle2 = Math.atan2(cy0 - c1.y, cx0 - c1.x);
  const [px4, py4] = bisect(angle2 * 2, circleRadius, pi.x, pi.y);

  return {
    p3: point(px3, py3),
    p4: point(px4, py4),
  };
}

// Computes tangent points where lines from circle centers through bisected points
// intersect the circles.
// Inputs: c2, p4, c1, p3, circleRadius
// Outputs: pl, pr
export function computeTangentPoints(
  c2: Point,
  p4: Point,
  c1: Point,
  p3: Point,
  circleRadius: number,
): { pl?: Point; pr?: Point } {
  // For pl: intersection of circle at c2 with line from c2 to p4
  const lp_left = interceptCircleLineSeg(
    c2.x,
    c2.y, // Circle center (cx, cy)
    c2.x,
    c2.y, // Line segment start (l1x, l1y) - same as circle center
    p4.x,
    p4.y, // Line segment end (l2x, l2y)
    circleRadius, // Radius (r)
  );

  // For pr: intersection of circle at c1 with line from c1 to p3
  const lp_right = interceptCircleLineSeg(
    c1.x,
    c1.y, // Circle center (cx, cy)
    c1.x,
    c1.y, // Line segment start (l1x, l1y) - same as circle center
    p3.x,
    p3.y, // Line segment end (l2x, l2y)
    circleRadius, // Radius (r)
  );

  return {
    pl: lp_left?.[0] ? point(lp_left[0][0], lp_left[0][1]) : undefined,
    pr: lp_right?.[0] ? point(lp_right[0][0], lp_right[0][1]) : undefined,
  };
}

// Composite Operations (combine multiple core operations)

// Computes all derived points from circle centers.
// This is a composite operation that computes:
// - Intersection point (pi) and circle (ci)
// - Bisected points (p3, p4)
// - Tangent points (pl, pr)
// Inputs: c1, c2, circleRadius
// Outputs: pi, ci, p3, p4, pl, pr
export function computeAllPoints(
  c1: Point,
  c2: Point,
  circleRadius: number,
): {
  pi: Point;
  ci: Circle;
  p3: Point;
  p4: Point;
  pl?: Point;
  pr?: Point;
} {
  // Convert points to circles
  const c1Circle: Circle = circle(c1.x, c1.y, circleRadius);
  const c2Circle: Circle = circle(c2.x, c2.y, circleRadius);

  // Compute intersection
  const { pi, ci } = computeCircleIntersection(c1Circle, c2Circle);

  // Compute bisected points
  const { p3, p4 } = computeBisectedPoints(pi, c1, c2, circleRadius);

  // Compute tangent points
  const { pl, pr } = computeTangentPoints(c2, p4, c1, p3, circleRadius);

  return { pi, ci, p3, p4, pl, pr };
}

// Initial Geometry Creation

// Creates the initial geometry values for the square construction.
// These are the base geometries that don't depend on any calculations.
export function createInitialGeometries(config: SquareConfig): Map<string, GeometryValue> {
  const geometries = new Map<string, GeometryValue>();

  // Main line
  geometries.set(GEOM.MAIN_LINE, line(config.lx1, config.ly1, config.lx2, config.ly2));

  // Circle centers (points)
  geometries.set(GEOM.C1, point(config.c1x, config.ly2));
  geometries.set(GEOM.C2, point(config.c2x, config.ly2));

  // Circle outlines
  geometries.set(GEOM.C1_CIRCLE, circle(config.c1x, config.ly2, config.circleRadius));
  geometries.set(GEOM.C2_CIRCLE, circle(config.c2x, config.ly2, config.circleRadius));

  return geometries;
}
