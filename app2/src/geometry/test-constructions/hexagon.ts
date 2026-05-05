/**
 * Hexagon construction for testing the geometry framework.
 */

import type { Construction } from "../construction";
import type { PointRef, LineRef, CircleRef, PolygonRef } from "../construction";

/**
 * Create a regular hexagon construction.
 *
 * @param c - The Construction instance
 * @param centerX - X coordinate of the center
 * @param centerY - Y coordinate of the center
 * @param radius - Radius of the circumscribed circle
 * @returns Object containing all created geometry references
 */
export function createHexagonConstruction(
  c: Construction,
  centerX: number,
  centerY: number,
  radius: number,
): {
  center: PointRef;
  circle: CircleRef;
  points: PointRef[];
  sides: LineRef[];
  hexagon: PolygonRef;
} {
  const center = c.point(centerX, centerY, "center");
  const circle = c.circle(center, radius, "hex_circle");

  // Create 6 points around the circle
  const points: PointRef[] = [];
  const sides: LineRef[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const p = c.point(x, y, `hex_p${i}`);
    points.push(p);
  }

  // Connect points in order
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const side = c.line(points[i], points[j], `hex_side${i}`);
    sides.push(side);
  }

  // Create hexagon polygon
  const hexagon = c.polygon(points, "hexagon");

  return {
    center,
    circle,
    points,
    sides,
    hexagon,
  };
}
