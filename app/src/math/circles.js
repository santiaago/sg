// @ts-ignore
import { Point } from "./points";

export class Circle {
  /**
   * @param {Point} p
   * @param {number} r
   */
  constructor(p, r, name) {
    this.p = p;
    this.r = r;
    this.type = "circle";
    this.name = name;
  }
}
