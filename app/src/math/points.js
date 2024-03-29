import { hashName } from "../hash/name";

export class Point {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.type = "point";
    this.name = name;
    this.context = null;
    if (this.name == null || this.name == undefined) {
      this.name = hashName(this);
    }
  }
  distanceToPoint(p) {
    return distance(this.x, this.y, p.x, p.y);
  }
}

/**
 * Finds distance between two points
 *  @param {number} x1 - point x coordinate
 *  @param {number} y1 - point y coordinate
 *  @param {number} x2 - point x coordinate
 *  @param {number} y2 - point y coordinate
 * @returns d:Number
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * @param {Point} p1
 * @param {Point} p2
 */
export function distanceBetweenPoints(p1, p2) {
  return distance(p1.x, p1.y, p2.x, p2.y);
}
