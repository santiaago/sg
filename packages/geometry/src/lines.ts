import { hashName } from "../src/hash";
import { Point } from "./points";

export class Line {
  p1: Point;
  p2: Point;
  type: string;
  name: string;
  context: any;
  
  /**
   * Create a line between two points
   * @param p1 - first point
   * @param p2 - second point
   * @param name - optional name for the line
   */
  constructor(p1: Point, p2: Point, name?: string) {
    this.p1 = p1;
    this.p2 = p2;
    this.type = "line";
    this.name = name ?? hashName(this);
    this.context = null;
  }
}

/**
 * Finds intersection point between two lines
 * source: https://observablehq.com/@bumbeishvili/two-unlimited-lines-intersection-in-javascript
 * @param x1 - point x coordinate
 * @param y1 - point y coordinate
 * @param x2 - point x coordinate
 * @param y2 - point y coordinate
 * @param x3 - point x coordinate
 * @param y3 - point y coordinate
 * @param x4 - point x coordinate
 * @param y4 - point y coordinate
 * @returns [x, y] coordinates of intersection point or empty array if no intersection
 */
export function intersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): [number, number] | [] {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return [];
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return [];
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // Return the x and y coordinates of the intersection
  const x = x1 + ua * (x2 - x1);
  const y = y1 + ua * (y2 - y1);

  return [x, y];
}

/**
 * Find intersection point between two Line objects
 * @param l1 - first line
 * @param l2 - second line
 * @returns Point at intersection or null if no intersection
 */
export function intersectLines(l1: Line, l2: Line): Point | null {
  const ret = intersect(
    l1.p1.x,
    l1.p1.y,
    l1.p2.x,
    l1.p2.y,
    l2.p1.x,
    l2.p1.y,
    l2.p2.x,
    l2.p2.y
  );
  if (ret.length === 0) {
    return null;
  }
  const [x, y] = ret;
  return new Point(x, y);
}
