// @ts-ignore
import { Point } from "./points";

export class Line {
  /**
   * @param {Point} p1
   * @param {Point} p2
   */
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }
}

/**
 * Finds intersection point between two lines
 * source: https://observablehq.com/@bumbeishvili/two-unlimited-lines-intersection-in-javascript
 *  @param {number} x1 - point x coordinate
 *  @param {number} y1 - point y coordinate
 *  @param {number} x2 - point x coordinate
 *  @param {number} y2 - point y coordinate
 *  @param {number} x3 - point x coordinate
 *  @param {number} y3 - point y coordinate
 *  @param {number} x4 - point x coordinate
 *  @param {number} y4 - point y coordinate
 * @returns [x:Number,y:Number] X and Y coordinates of intersection point.
 */
export function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return [];
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return [];
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return [x, y];
}

/**
 * @param {Line} l1
 * @param {Line} l2
 */
export function intersectLines(l1, l2) {
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
