class S {
  constructor({ inputs: n = [], outputs: e = [] } = {}) {
    ((this.inputs = n), (this.outputs = e), (this.type = "geometry"));
  }
}
const d = 3;
function b(t) {
  return t.type == "line"
    ? `l${g(d)}`
    : t.type == "point"
      ? `p${g(d)}`
      : t.type == "circle"
        ? `c${g(d)}`
        : `${g(d)}`;
}
const g = (t) => [...Array(t)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
class x {
  constructor(n, e, s) {
    ((this.x = n),
      (this.y = e),
      (this.type = "point"),
      (this.name = s ?? b(this)),
      (this.context = null));
  }
  distanceToPoint(n) {
    return C(this.x, this.y, n.x, n.y);
  }
}
function C(t, n, e, s) {
  return Math.hypot(t - e, n - s);
}
function _(t, n) {
  return C(t.x, t.y, n.x, n.y);
}
class j {
  /**
   * Create a line between two points
   * @param p1 - first point
   * @param p2 - second point
   * @param name - optional name for the line
   */
  constructor(n, e, s) {
    ((this.p1 = n),
      (this.p2 = e),
      (this.type = "line"),
      (this.name = s ?? b(this)),
      (this.context = null));
  }
}
function v(t, n, e, s, i, c, r, o) {
  if ((t === e && n === s) || (i === r && c === o)) return [];
  const p = (o - c) * (e - t) - (r - i) * (s - n);
  if (p === 0) return [];
  const u = ((r - i) * (n - c) - (o - c) * (t - i)) / p,
    h = t + u * (e - t),
    f = n + u * (s - n);
  return [h, f];
}
function B(t, n) {
  const e = v(t.p1.x, t.p1.y, t.p2.x, t.p2.y, n.p1.x, n.p1.y, n.p2.x, n.p2.y);
  if (e.length === 0) return null;
  const [s, i] = e;
  return new x(s, i);
}
class E {
  /**
   * Create a circle
   * @param p - center point
   * @param r - radius
   * @param name - optional name
   */
  constructor(n, e, s) {
    ((this.p = n),
      (this.r = e),
      (this.type = "circle"),
      (this.name = s ?? b(this)),
      (this.context = null),
      (this.p.name = `p${this.name}`));
  }
}
function G(t, n) {
  const e = $(t.p.x, t.p.y, t.r, n.p.x, n.p.y, n.r);
  if (e == null) return null;
  const [s, i, c, r] = e,
    o = new x(s, i),
    p = new x(c, r);
  return [o, p];
}
function $(t, n, e, s, i, c) {
  let r, o, p, u, h, f, a, l, m;
  if (((o = s - t), (p = i - n), (u = Math.sqrt(p * p + o * o)), u > e + c || u < Math.abs(e - c)))
    return null;
  ((r = (e * e - c * c + u * u) / (2 * u)),
    (l = t + (o * r) / u),
    (m = n + (p * r) / u),
    (h = Math.sqrt(e * e - r * r)),
    (f = -p * (h / u)),
    (a = o * (h / u)));
  let M = l + f,
    P = l - f,
    w = m + a,
    I = m - a;
  return [M, w, P, I];
}
function L(t, n, e, s) {
  let i = 0;
  t > 2 * Math.PI ? (i = t - Math.PI) : (i = t + Math.PI);
  const c = e + n * Math.cos(i),
    r = s + n * Math.sin(i);
  return [c, r];
}
function T(t, n) {
  const e = t.p.x - t.r,
    s = t.p.y,
    i = new x(e, s),
    c = Math.atan2(i.y - n.y, i.x - n.x),
    [r, o] = L(c * 2, t.r, t.p.x, t.p.y);
  return new x(r, o);
}
function Z(t, n) {
  return q(t.p.x, t.p.y, n.p1.x, n.p1.y, n.p2.x, n.p2.y, t.r).map((s) => {
    const [i, c] = s;
    return new x(i, c);
  });
}
function q(t, n, e, s, i, c, r) {
  let o, p, u, h, f;
  const a = i - e,
    l = c - s,
    m = e - t,
    M = s - n;
  if (
    ((o = a * m + l * M),
    (p = 2 * (a * a + l * l)),
    (o *= -2),
    (u = Math.sqrt(o * o - 2 * p * (m * m + M * M - r * r))),
    isNaN(u))
  )
    return [];
  ((h = (o - u) / p), (f = (o + u) / p));
  const P = [];
  if (h <= 1 && h >= 0) {
    const w = e + a * h,
      I = s + l * h;
    P.push([w, I]);
  }
  if (f <= 1 && f >= 0) {
    const w = e + a * f,
      I = s + l * f;
    P.push([w, I]);
  }
  return P;
}
const y = {
    up: 0,
    down: 1,
    left: 2,
    right: 3,
  },
  A = (t, n, e, s, i, c, r) => {
    const o = $(t, n, e, s, i, c);
    if (!o) return (console.debug("no intersection found"), null);
    const p = o[0],
      u = o[1],
      h = o[2],
      f = o[3];
    return r == y.down || r == y.up
      ? u < f
        ? r == y.up
          ? [p, u]
          : [h, f]
        : r == y.up
          ? [h, f]
          : [p, u]
      : r == y.left || r == y.right
        ? p < h
          ? r == y.left
            ? [p, u]
            : [h, f]
          : r == y.left
            ? [h, f]
            : [p, u]
        : null;
  },
  k = (t, n, e) => {
    const s = A(t.p.x, t.p.y, t.r, n.p.x, n.p.y, n.r, e);
    return s == null ? null : new x(s[0], s[1]);
  },
  N = (t, n, e, s, i, c, r, o) => {
    let p,
      u = (o - c) * (e - t) - (r - i) * (s - n);
    return u == 0
      ? null
      : ((p = ((r - i) * (n - c) - (o - c) * (t - i)) / u), [t + p * (e - t), n + p * (s - n)]);
  },
  z = (t, n) => {
    const e = N(t.p1.x, t.p1.y, t.p2.x, t.p2.y, n.p1.x, n.p1.y, n.p2.x, n.p2.y);
    return e == null
      ? (console.log("linesIntersection, no intersection found"), null)
      : new x(e[0], e[1]);
  };
export {
  E as Circle,
  S as Geometry,
  j as Line,
  x as Point,
  L as bisect,
  T as bisectCircleAndPoint,
  A as cerclesIntersection,
  G as circlesIntersection,
  k as circlesIntersectionPoint,
  y as directions,
  C as distance,
  _ as distanceBetweenPoints,
  b as hashName,
  q as inteceptCircleLineSeg,
  Z as interceptCircleAndLine,
  v as intersect,
  B as intersectLines,
  $ as intersection,
  N as lineIntersect,
  z as linesIntersection,
};
