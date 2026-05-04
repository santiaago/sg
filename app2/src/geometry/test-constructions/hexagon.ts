/**
 * Hexagon construction for testing the geometry framework.
 * Creates a regular hexagon centered at a point.
 */

import type { Construction } from "../construction";
import type { PointRef, LineRef, CircleRef, PolygonRef } from "../construction";

/**
 * Create a regular hexagon construction.
 * 
 * Steps:
 * 1. Create center point
 * 2. Create a circle with the given radius
 * 3. Create 6 points around the circle at 60 degree intervals
 * 4. Connect adjacent points to form the hexagon sides
 * 5. Create a polygon from all 6 points
 * 
 * @param c - The Construction instance
 * @param centerX - Center x coordinate
 * @param centerY - Center y coordinate
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
  // Step 1: Create center point
  const center = c.point(centerX, centerY, "hexagon_center");

  // Step 2: Create circumscribed circle
  const circle = c.circle(center, radius, "hexagon_circle");

  // Step 3: Create 6 points around the circle
  const points: PointRef[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6; // 60 degree increments
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const p = c.point(x, y, `hexagon_p${i}`);
    points.push(p);
  }

  // Step 4: Connect adjacent points to form sides
  const sides: LineRef[] = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const side = c.line(points[i], points[j], `hexagon_side${i}`);
    sides.push(side);
  }

  // Step 5: Create hexagon polygon
  const hexagon = c.polygon(points, "hexagon");

  return {
    center,
    circle,
    points,
    sides,
    hexagon,
  };
}

/**
 * Create a hexagon construction using a parameter for radius.
 * Demonstrates parameter usage in constructions.
 * 
 * @param c - The Construction instance
 * @param centerX - Center x coordinate
 * @param centerY - Center y coordinate
 * @param radiusParamName - Name of the parameter to use for radius
 * @returns Object containing all created geometry references
 */
export function createHexagonWithParameter(
  c: Construction,
  centerX: number,
  centerY: number,
  radiusParamName: string = "hexagonRadius",
): {
  center: PointRef;
  circle: CircleRef;
  points: PointRef[];
  sides: LineRef[];
  hexagon: PolygonRef;
} {
  // Set the radius parameter
  // Note: In a real application, this would be set by a slider UI
  const radius = 100;
  c.setParameter(radiusParamName, radius);

  // Create center point
  const center = c.point(centerX, centerY, "hexagon_center");

  // Create circumscribed circle using the parameter
  // For now, we use the direct value since the circle method doesn't support parameter refs yet
  const circle = c.circle(center, c.getParameter(radiusParamName), "hexagon_circle");

  // Create 6 points around the circle
  const points: PointRef[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const x = centerX + c.getParameter(radiusParamName) * Math.cos(angle);
    const y = centerY + c.getParameter(radiusParamName) * Math.sin(angle);
    const p = c.point(x, y, `hexagon_p${i}`);
    points.push(p);
  }

  // Connect adjacent points
  const sides: LineRef[] = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const side = c.line(points[i], points[j], `hexagon_side${i}`);
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
