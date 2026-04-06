import { hashName } from "../src/hash.js";
// @ts-ignore
import { Point } from "./points.ts";

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
    this.context = null;
    if (this.name == null || this.name == undefined) {
      this.name = hashName(this);
    }
    this.p.name = `p${this.name}`;
  }
}
