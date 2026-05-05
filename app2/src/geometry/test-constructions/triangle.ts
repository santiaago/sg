/**
 * Triangle construction for testing the geometry framework.
 */

import type { Construction } from "../construction";
import type { PointRef, LineRef, CircleRef, PolygonRef } from "../construction";

/**
 * Create an equilateral triangle construction.
 *
 * @param c - The Construction instance
 * @param width - Width of the base
 * @param height - Height of the triangle
 * @param offset - Vertical offset from height for base points (default: 50)
 * @returns Object containing all created geometry references
 */
export function createTriangleConstruction(
  c: Construction,
  width: number,
  height: number,
  offset: number = 50,
): {
  p1: PointRef;
  p2: PointRef;
  base: LineRef;
  c1: CircleRef;
  c2: CircleRef;
  p3: PointRef;
  side1: LineRef;
  side2: LineRef;
  triangle: PolygonRef;
} {
  // Base points
  const p1 = c.point(0, height - offset, "p1");
  const p2 = c.point(width, height - offset, "p2");

  // Base line connecting p1 and p2
  const base = c.line(p1, p2, "base");

  // Two circles at ends with radius = width / 4
  const radius = width / 4;
  const c1 = c.circle(p1, radius, "c1");
  const c2 = c.circle(p2, radius, "c2");

  // Intersection point (top of triangle)
  const p3 = c.intersection(c1, c2, "north", "p3");

  // Connect points to form triangle
  const side1 = c.line(p1, p3, "side1");
  const side2 = c.line(p2, p3, "side2");
  const triangle = c.polygon([p1, p2, p3], "triangle");

  return {
    p1,
    p2,
    base,
    c1,
    c2,
    p3,
    side1,
    side2,
    triangle,
  };
}
