// Transformation utilities for coordinate system operations
// Provides helper functions for converting between global and local coordinate spaces

import type { Point, CoordinateSystem } from "@/types/geometry";

/**
 * Transform a global point to local coordinates in a coordinate system.
 * This is the inverse of the transformation applied in PointInCoordinateSystemExpression.
 *
 * For a coordinate system with position (x, y), rotation θ, flipX, and flipY:
 * - First, translate the point by subtracting the CS origin
 * - Then, apply the inverse rotation
 * - Finally, apply the inverse flip
 *
 * @param point - The global point to transform
 * @param cs - The coordinate system to transform into
 * @returns The point in local coordinates
 */
export function transformPointToLocalSpace(point: Point, cs: CoordinateSystem): Point {
  const rotation = cs.rotation ?? 0;
  const flipX = cs.flipX ?? false;
  const flipY = cs.flipY ?? false;

  const cosRot = Math.cos(rotation);
  const sinRot = Math.sin(rotation);

  // Translate point relative to CS origin
  let localX = point.x - cs.x;
  let localY = point.y - cs.y;

  // Apply inverse rotation
  // Rotation matrix inverse is transpose: [cos, sin; -sin, cos]
  const rotatedX = localX * cosRot + localY * sinRot;
  const rotatedY = -localX * sinRot + localY * cosRot;

  // Apply inverse flip
  // flipX: localX * -1 in global, so in local: localX * -1
  // flipY: localY * -1 in global, so in local: localY * -1
  const flippedX = flipX ? -rotatedX : rotatedX;
  const flippedY = flipY ? -rotatedY : rotatedY;

  return { type: "point", x: flippedX, y: flippedY };
}

/**
 * Transform a global point to local coordinates in a coordinate system.
 * Returns only the x and y values (not a Point object).
 *
 * @param point - The global point to transform
 * @param cs - The coordinate system to transform into
 * @returns The local coordinates as { x: number, y: number }
 */
export function transformToLocalCoords(
  point: Point,
  cs: CoordinateSystem,
): { x: number; y: number } {
  const localPoint = transformPointToLocalSpace(point, cs);
  return { x: localPoint.x, y: localPoint.y };
}

/**
 * Select an intersection point based on direction in a specific coordinate system's local space.
 * This allows direction-based selection to work correctly even when the coordinate system is flipped or rotated.
 *
 * @param points - Array of candidate points (global coordinates)
 * @param cs - The coordinate system to use for local space interpretation
 * @param direction - The direction to select ("left", "right", "north", "south", "east", "west")
 * @returns The selected point, or null if no points provided
 */
export function selectByDirectionInLocalSpace(
  points: Point[],
  cs: CoordinateSystem,
  direction: "left" | "right" | "north" | "south" | "east" | "west",
): Point | null {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];

  // Transform all points to local space
  const localPoints = points.map((p) => transformToLocalCoords(p, cs));

  switch (direction) {
    case "left":
      // Left = smallest x in local space
      return points[findMinIndex(localPoints, "x")];
    case "right":
      // Right = largest x in local space
      return points[findMaxIndex(localPoints, "x")];
    case "north":
      // North = smallest y in local space (SVG: y increases downward)
      return points[findMinIndex(localPoints, "y")];
    case "south":
      // South = largest y in local space
      return points[findMaxIndex(localPoints, "y")];
    case "east":
      // East = largest x in local space
      return points[findMaxIndex(localPoints, "x")];
    case "west":
      // West = smallest x in local space
      return points[findMinIndex(localPoints, "x")];
    default:
      return points[0];
  }
}

/**
 * Find the index of the point with minimum value for a given coordinate.
 */
function findMinIndex(points: { x: number; y: number }[], coord: "x" | "y"): number {
  let minIndex = 0;
  let minValue = points[0][coord];
  for (let i = 1; i < points.length; i++) {
    if (points[i][coord] < minValue) {
      minValue = points[i][coord];
      minIndex = i;
    }
  }
  return minIndex;
}

/**
 * Find the index of the point with maximum value for a given coordinate.
 */
function findMaxIndex(points: { x: number; y: number }[], coord: "x" | "y"): number {
  let maxIndex = 0;
  let maxValue = points[0][coord];
  for (let i = 1; i < points.length; i++) {
    if (points[i][coord] > maxValue) {
      maxValue = points[i][coord];
      maxIndex = i;
    }
  }
  return maxIndex;
}
