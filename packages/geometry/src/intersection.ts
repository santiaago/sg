import { Circle } from "./circles";
import { Line } from "./lines";
import { Point } from "./points";

/**
 * Find intersection points between two circles
 * @param c1 - first circle
 * @param c2 - second circle
 * @returns array of intersection points or null if no intersection
 */
export function circlesIntersection(c1: Circle, c2: Circle): [Point, Point] | null {
  const ret = intersection(c1.p.x, c1.p.y, c1.r, c2.p.x, c2.p.y, c2.r);
  if (ret == null) {
    return null;
  }
  const [x, y, xp, yp] = ret;

  const p1 = new Point(x, y);
  const p2 = new Point(xp, yp);
  return [p1, p2];
}

// https://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci/#answer-12221389
// A JavaScript function that returns the x,y points of intersection between two circles
export function intersection(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): [number, number, number, number] | null {
  let a, dx, dy, d, h, rx, ry;
  let x2, y2;

  // dx and dy are the vertical and horizontal distances between
  // the circle centers.
  dx = x1 - x0;
  dy = y1 - y0;

  // Determine the straight-line distance between the centers.
  d = Math.sqrt(dy * dy + dx * dx);

  // Check for solvability.
  if (d > r0 + r1) {
    /* no solution. circles do not intersect. */
    return null;
  }
  if (d < Math.abs(r0 - r1)) {
    // no solution. one circle is contained in the other
    return null;
  }

  // 'point 2' is the point where the line through the circle
  //  intersection points crosses the line between the circle
  //  centers.

  // Determine the distance from point 0 to point 2.
  a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d);

  // Determine the coordinates of point 2.
  x2 = x0 + (dx * a) / d;
  y2 = y0 + (dy * a) / d;

  // Determine the distance from point 2 to either of the
  // intersection points.
  h = Math.sqrt(r0 * r0 - a * a);

  // Now determine the offsets of the intersection points from
  // point 2.
  rx = -dy * (h / d);
  ry = dx * (h / d);

  // Determine the absolute intersection points.
  let xi = x2 + rx;
  let xi_prime = x2 - rx;
  let yi = y2 + ry;
  let yi_prime = y2 - ry;

  return [xi, yi, xi_prime, yi_prime];
}

export function bisect(angle: number, radius: number, cx: number, cy: number): [number, number] {
  // let x1 = cx + radius * Math.cos(angle);
  // let y1 = cy + radius * Math.sin(angle);
  let angle2 = 0;
  if (angle > 2 * Math.PI) {
    angle2 = angle - Math.PI;
  } else {
    angle2 = angle + Math.PI;
  }

  const x2 = cx + radius * Math.cos(angle2);
  const y2 = cy + radius * Math.sin(angle2);

  return [x2, y2];
}

/**
 * @param {Circle} circle
 * @param {Point} point
 * looking for intersection of
 * line(circle(center)), point AND
 * circle(center)
 */
export function bisectCircleAndPoint(circle: Circle, point: Point): Point {
  const cx0 = circle.p.x - circle.r;
  const cy0 = circle.p.y;
  const pointInCircle = new Point(cx0, cy0);

  const angle = Math.atan2(pointInCircle.y - point.y, pointInCircle.x - point.x);

  // translate it into the interval [0,2 π] multiply by 2
  const [x, y] = bisect(angle * 2, circle.r, circle.p.x, circle.p.y);
  return new Point(x, y);
}

/**
 * @param {Circle} circle
 * @param {Line} line
 */
export function interceptCircleAndLine(circle: Circle, line: Line): Point[] {
  const points = inteceptCircleLineSeg(
    circle.p.x,
    circle.p.y,
    line.p1.x,
    line.p1.y,
    line.p2.x,
    line.p2.y,
    circle.r
  );
  return points.map((p) => {
    const [x, y] = p;
    return new Point(x, y);
  });
}
// https://stackoverflow.com/a/37225895
// cercle line intercept
export function inteceptCircleLineSeg(cx: number, cy: number, l1x: number, l1y: number, l2x: number, l2y: number, r: number): Array<[number, number]> {
  let a, b, c, d, u1, u2, retP1, retP2, v1, v2;
  const v1x = l2x - l1x;
  const v1y = l2y - l1y;
  const v2x = l1x - cx;
  const v2y = l1y - cy;
  b = v1x * v2x + v1y * v2y;
  c = 2 * (v1x * v1x + v1y * v1y);
  b *= -2;
  d = Math.sqrt(b * b - 2 * c * (v2x * v2x + v2y * v2y - r * r));
  if (isNaN(d)) {
    // no intercept
    return [];
  }
  u1 = (b - d) / c; // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  const ret: Array<[number, number]> = []; // return array
  if (u1 <= 1 && u1 >= 0) {
    // add point if on the line segment
    const retP1x = l1x + v1x * u1;
    const retP1y = l1y + v1y * u1;
    ret.push([retP1x, retP1y]);
  }
  if (u2 <= 1 && u2 >= 0) {
    // second add point if on the line segment
    const retP2x = l1x + v1x * u2;
    const retP2y = l1y + v1y * u2;
    ret.push([retP2x, retP2y]);
  }
  return ret;
}

export const directions = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

// find intersection point between 2 circles
export const cerclesIntersection = (cx1: number, cy1: number, r1: number, cx2: number, cy2: number, r2: number, direction: number): [number, number] | null => {
  const points = intersection(cx1, cy1, r1, cx2, cy2, r2);
  if (!points) {
    console.debug("no intersection found");
    return null;
  }
  const px1 = points[0];
  const py1 = points[1];
  const px2 = points[2];
  const py2 = points[3];
  if (direction == directions.down || direction == directions.up) {
    if (py1 < py2) {
      if (direction == directions.up) {
        return [px1, py1];
      } else {
        return [px2, py2];
      }
    }
    if (direction == directions.up) {
      return [px2, py2];
    }
    return [px1, py1];
  }
  if (direction == directions.left || direction == directions.right) {
    if (px1 < px2) {
      if (direction == directions.left) {
        return [px1, py1];
      } else {
        return [px2, py2];
      }
    }
    if (direction == directions.left) {
      return [px2, py2];
    }
    return [px1, py1];
  }
  return null;
};

// find intersection point between 2 circles
export const circlesIntersectionPoint = (circle1: Circle, circle2: Circle, direction: number): Point | null => {
  const p = cerclesIntersection(
    circle1.p.x,
    circle1.p.y,
    circle1.r,
    circle2.p.x,
    circle2.p.y,
    circle2.r,
    direction
  );
  if (p == null) {
    return null;
  }
  return new Point(p[0], p[1]);
};

export const lineIntersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): [number, number] | null => {
  let ua,
    ub,
    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom == 0) {
    return null;
  }
  ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
  // return {
  //   x: x1 + ua * (x2 - x1),
  //   y: y1 + ua * (y2 - y1),
  //   seg1: ua >= 0 && ua <= 1,
  //   seg2: ub >= 0 && ub <= 1,
  // };
};

export const linesIntersection = (l1: Line, l2: Line): Point | null => {
  const point = lineIntersect(
    l1.p1.x,
    l1.p1.y,
    l1.p2.x,
    l1.p2.y,
    l2.p1.x,
    l2.p1.y,
    l2.p2.x,
    l2.p2.y
  );
  if (point == null) {
    console.log("linesIntersection, no intersection found");
    return null;
  }
  return new Point(point[0], point[1]);
};
