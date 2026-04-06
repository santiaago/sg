import { hashName } from "./hash.ts";
import { Point } from "./points.ts";

export class Circle {
  p: Point;
  r: number;
  type: string;
  name: string;
  context: any;
  
  /**
   * Create a circle
   * @param p - center point
   * @param r - radius
   * @param name - optional name
   */
  constructor(p: Point, r: number, name?: string) {
    this.p = p;
    this.r = r;
    this.type = "circle";
    this.name = name ?? hashName(this);
    this.context = null;
    this.p.name = `p${this.name}`;
  }
}
