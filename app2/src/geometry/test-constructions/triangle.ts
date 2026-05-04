/**
 * Triangle construction for testing the geometry framework.
 * Creates an equilateral triangle from a base line.
 */

import type { Construction } from "../construction";
import type { PointRef, LineRef, CircleRef } from "../construction";

/**
 * Create an equilateral triangle construction.
 * 
 * Steps:
 * 1. Create base line
 * 2. Create two circles at the ends of the base with radius equal to base length
 * 3. Find the third vertex at the intersection of the two circles (north)
 * 4. Connect all three points to form the triangle
 * 
 * @param c - The Construction instance
 * @param x1 - Start x coordinate of base
 * @param y1 - Start y coordinate of base
 * @param x2 - End x coordinate of base
 * @param y2 - End y coordinate of base
 * @returns Object containing all created geometry references
 */
export function createTriangleConstruction(
  c: Construction,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): {
  base: LineRef;
  p1: PointRef;
  p2: PointRef;
  c1: CircleRef;
  c2: CircleRef;
  p3: PointRef;
  side1: LineRef;
  side2: LineRef;
  triangle: LineRef;
} {
  // Step 1: Create base line
  const base = c.line(x1, y1, x2, y2, "triangle_base");

  // Step 2: Create points at ends
  const p1 = c.point(x1, y1, "triangle_p1");
  const p2 = c.point(x2, y2, "triangle_p2");

  // Step 3: Calculate base length
  const dx = x2 - x1;
  const dy = y2 - y1;
  const baseLength = Math.sqrt(dx * dx + dy * dy);

  // Step 4: Create circles at each end with radius = base length
  const c1 = c.circle(p1, baseLength, "triangle_c1");
  const c2 = c.circle(p2, baseLength, "triangle_c2");

  // Step 5: Find third vertex (north intersection of the two circles)
  const p3 = c.intersection(c1, c2, "north", "triangle_p3");

  // Step 6: Connect p1 to p3
  const side1 = c.line(p1, p3, "triangle_side1");

  // Step 7: Connect p2 to p3
  const side2 = c.line(p2, p3, "triangle_side2");

  // Step 8: The base is already the third side
  // For polygon, we'd need to create it from the three points
  // But for now, we return the three sides

  return {
    base,
    p1,
    p2,
    c1,
    c2,
    p3,
    side1,
    side2,
    triangle: base, // Placeholder - in a full implementation, this would be a polygon
  };
}

/**
 * Create a triangle construction with a specific side length.
 * 
 * @param c - The Construction instance
 * @param centerX - Center x coordinate
 * @param centerY - Center y coordinate
 * @param sideLength - Length of each side of the equilateral triangle
 * @returns Object containing all created geometry references
 */
export function createEquilateralTriangle(
  c: Construction,
  centerX: number,
  centerY: number,
  sideLength: number,
): {
  p1: PointRef;
  p2: PointRef;
  p3: PointRef;
  side1: LineRef;
  side2: LineRef;
  side3: LineRef;
} {
  // Calculate height of equilateral triangle
  const height = (Math.sqrt(3) / 2) * sideLength;

  // Create three points
  const p1 = c.point(centerX, centerY - height / 1.5, "eq_triangle_p1");
  const p2 = c.point(centerX - sideLength / 2, centerY + height / 3, "eq_triangle_p2");
  const p3 = c.point(centerX + sideLength / 2, centerY + height / 3, "eq_triangle_p3");

  // Connect points
  const side1 = c.line(p1, p2, "eq_triangle_side1");
  const side2 = c.line(p2, p3, "eq_triangle_side2");
  const side3 = c.line(p3, p1, "eq_triangle_side3");

  return {
    p1,
    p2,
    p3,
    side1,
    side2,
    side3,
  };
}
