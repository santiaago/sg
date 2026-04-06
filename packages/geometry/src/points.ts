import { hashName } from "../src/hash";

export class Point {
  x: number;
  y: number;
  type: string;
  name: string;
  context: any;
  
  constructor(x: number, y: number, name?: string) {
    this.x = x;
    this.y = y;
    this.type = "point";
    this.name = name ?? hashName(this);
    this.context = null;
  }
  
  distanceToPoint(p: Point): number {
    return distance(this.x, this.y, p.x, p.y);
  }
}

/**
 * Finds distance between two points
 * @param x1 - point x coordinate
 * @param y1 - point y coordinate
 * @param x2 - point x coordinate
 * @param y2 - point y coordinate
 * @returns distance between points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * Calculate distance between two Point objects
 * @param p1 - first point
 * @param p2 - second point
 * @returns distance between points
 */
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  return distance(p1.x, p1.y, p2.x, p2.y);
}
