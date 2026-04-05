class S {
  constructor({ inputs: n = [], outputs: e = [] }) {
    this.inputs = n, this.outputs = e, this.type = "geometry";
  }
}
const I = 3;
function b(t) {
  return t.type == "line" ? `l${g(I)}` : t.type == "point" ? `p${g(I)}` : t.type == "circle" ? `c${g(I)}` : `${g(I)}`;
}
const g = (t) => [...Array(t)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
class m {
  constructor(n, e, i) {
    this.x = n, this.y = e, this.type = "point", this.name = i, this.context = null, (this.name == null || this.name == null) && (this.name = b(this));
  }
  distanceToPoint(n) {
    return C(this.x, this.y, n.x, n.y);
  }
}
function C(t, n, e, i) {
  return Math.hypot(t - e, n - i);
}
function _(t, n) {
  return C(t.x, t.y, n.x, n.y);
}
class j {
  /**
   * @param {Point} p1
   * @param {Point} p2
   */
  constructor(n, e, i) {
    this.p1 = n, this.p2 = e, this.type = "line", this.name = i, this.context = null, (this.name == null || this.name == null) && (this.name = b(this));
  }
}
function v(t, n, e, i, r, p, u, s) {
  if (t === e && n === i || r === u && p === s)
    return [];
  const c = (s - p) * (e - t) - (u - r) * (i - n);
  if (c === 0)
    return [];
  let o = ((u - r) * (n - p) - (s - p) * (t - r)) / c, l = t + o * (e - t), h = n + o * (i - n);
  return [l, h];
}
function B(t, n) {
  const e = v(
    t.p1.x,
    t.p1.y,
    t.p2.x,
    t.p2.y,
    n.p1.x,
    n.p1.y,
    n.p2.x,
    n.p2.y
  );
  if (e.length === 0)
    return null;
  const [i, r] = e;
  return new m(i, r);
}
class E {
  /**
   * @param {Point} p
   * @param {number} r
   */
  constructor(n, e, i) {
    this.p = n, this.r = e, this.type = "circle", this.name = i, this.context = null, (this.name == null || this.name == null) && (this.name = b(this)), this.p.name = `p${this.name}`;
  }
}
function G(t, n) {
  const e = $(t.p.x, t.p.y, t.r, n.p.x, n.p.y, n.r);
  if (e == null)
    return null;
  const [i, r, p, u] = e, s = new m(i, r), c = new m(p, u);
  return [s, c];
}
function $(t, n, e, i, r, p) {
  let u, s, c, o, l, h, y, f, a;
  if (s = i - t, c = r - n, o = Math.sqrt(c * c + s * s), o > e + p || o < Math.abs(e - p))
    return null;
  u = (e * e - p * p + o * o) / (2 * o), f = t + s * u / o, a = n + c * u / o, l = Math.sqrt(e * e - u * u), h = -c * (l / o), y = s * (l / o);
  let d = f + h, M = f - h, P = a + y, w = a - y;
  return [d, P, M, w];
}
function L(t, n, e, i) {
  let r = 0;
  t > 2 * Math.PI ? r = t - Math.PI : r = t + Math.PI;
  let p = e + n * Math.cos(r), u = i + n * Math.sin(r);
  return [p, u];
}
function T(t, n) {
  const e = t.p.x - t.r, i = t.p.y, r = new m(e, i);
  let p = Math.atan2(r.y - n.y, r.x - n.x), [u, s] = L(p * 2, t.r, t.p.x, t.p.y);
  return new m(u, s);
}
function Z(t, n) {
  return q(
    t.p.x,
    t.p.y,
    n.p1.x,
    n.p1.y,
    n.p2.x,
    n.p2.y,
    t.r
  ).map((i) => {
    const [r, p] = i;
    return new m(r, p);
  });
}
function q(t, n, e, i, r, p, u) {
  let s, c, o, l, h, y, f = r - e, a = p - i, d = e - t, M = i - n;
  if (s = f * d + a * M, c = 2 * (f * f + a * a), s *= -2, o = Math.sqrt(s * s - 2 * c * (d * d + M * M - u * u)), isNaN(o))
    return [];
  if (l = (s - o) / c, h = (s + o) / c, y = [], l <= 1 && l >= 0) {
    let P = e + f * l, w = i + a * l;
    y.push([P, w]);
  }
  if (h <= 1 && h >= 0) {
    let P = e + f * h, w = i + a * h;
    y.push([P, w]);
  }
  return y;
}
const x = {
  up: 0,
  down: 1,
  left: 2,
  right: 3
}, A = (t, n, e, i, r, p, u) => {
  let s = $(t, n, e, i, r, p);
  if (!s)
    return console.debug("no intersection found"), null;
  const c = s[0], o = s[1], l = s[2], h = s[3];
  if (u == x.down || x.up)
    return o < h ? u == x.up ? [c, o] : [l, h] : u == x.up ? [l, h] : [c, o];
  if (u == x.left || x.right)
    return c < l ? u == x.left ? [c, o] : [l, h] : u == x.left ? [l, h] : [c, o];
}, k = (t, n, e) => {
  const i = A(
    t.p.x,
    t.p.y,
    t.r,
    n.p.x,
    n.p.y,
    n.r,
    e
  );
  return i == null ? null : new m(i[0], i[1]);
}, N = (t, n, e, i, r, p, u, s) => {
  let c, o = (s - p) * (e - t) - (u - r) * (i - n);
  return o == 0 ? null : (c = ((u - r) * (n - p) - (s - p) * (t - r)) / o, [t + c * (e - t), n + c * (i - n)]);
}, z = (t, n) => {
  const e = N(
    t.p1.x,
    t.p1.y,
    t.p2.x,
    t.p2.y,
    n.p1.x,
    n.p1.y,
    n.p2.x,
    n.p2.y
  );
  return e == null ? (console.log("linesIntersection, no intersection found"), null) : new m(e[0], e[1]);
};
export {
  E as Circle,
  S as Geometry,
  j as Line,
  m as Point,
  L as bisect,
  T as bisectCircleAndPoint,
  A as cerclesIntersection,
  G as circlesIntersection,
  k as circlesIntersectionPoint,
  x as directions,
  C as distance,
  _ as distanceBetweenPoints,
  b as hashName,
  q as inteceptCircleLineSeg,
  Z as interceptCircleAndLine,
  v as intersect,
  B as intersectLines,
  $ as intersection,
  N as lineIntersect,
  z as linesIntersection
};
