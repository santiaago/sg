/**
 * Construction DSL - Higher-level declarative language for geometric constructions
 *
 * This module provides a fluid, chainable API for creating geometric constructions.
 * It is a facade/abstraction layer on top of the existing step-based system.
 *
 * Key principles:
 * - Pure geometry logic (NO SVG, NO rendering)
 * - Single API surface for ALL operations
 * - Uses app2 GeometryValue types as canonical
 * - Uses @sg/geometry utilities internally (coordinates only)
 * - Refs are pure identifiers, Construction holds all data
 * - Eager computation (values computed when methods are called)
 */

import type { Point, Line, Circle, Polygon, GeometryValue } from "../types/geometry";
import { point, line, circle, polygon } from "../types/geometry";
import {
  intersection as circleCircleIntersection,
  inteceptCircleLineSeg,
  lineIntersect,
} from "@sg/geometry";

// =============================================================================
// Layer 2: Typed References (Pure Identifiers)
// =============================================================================

/**
 * Reference to a Point geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface PointRef {
  readonly id: string;
}

/**
 * Reference to a Line geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface LineRef {
  readonly id: string;
}

/**
 * Reference to a Circle geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface CircleRef {
  readonly id: string;
}

/**
 * Reference to a Polygon geometry.
 * This is a pure identifier with no data storage.
 * All data is stored in the Construction instance.
 */
export interface PolygonRef {
  readonly id: string;
}

/**
 * Union type for all geometry references.
 */
export type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;

// =============================================================================
// Direction and Options Types
// =============================================================================

/**
 * Direction for selecting intersection points.
 * - "north"/"south": For circle-circle intersections (pick by y-coordinate)
 *   In SVG coordinate system, y increases downward, so "north" = smaller y
 * - "left"/"right": For circle-line intersections (pick by x-coordinate)
 *   "left" = smaller x, "right" = larger x
 */
export type Direction = "north" | "south" | "left" | "right";

/**
 * Options for intersection operations.
 * Can specify a direction OR exclude a known point.
 */
export type IntersectionOptions = Direction | { exclude: PointRef };

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error class for Construction operations.
 * Contains contextual information about where the error occurred.
 */
export class ConstructionError extends Error {
  constructor(
    readonly stepIndex: number,
    readonly stepId: string,
    message: string,
    readonly cause?: Error,
  ) {
    super(`Step ${stepIndex} (${stepId}): ${message}`);
    this.name = "ConstructionError";
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, ConstructionError.prototype);
  }
}

/**
 * Error thrown when two geometries do not intersect.
 */
export class NoIntersectionError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, g1Id: string, g2Id: string) {
    super(stepIndex, stepId, `No intersection between ${g1Id} and ${g2Id}`);
    this.name = "NoIntersectionError";
    Object.setPrototypeOf(this, NoIntersectionError.prototype);
  }
}

/**
 * Error thrown when a geometry reference is not found.
 */
export class GeometryNotFoundError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, geomId: string) {
    super(stepIndex, stepId, `Geometry not found: ${geomId}`);
    this.name = "GeometryNotFoundError";
    Object.setPrototypeOf(this, GeometryNotFoundError.prototype);
  }
}

/**
 * Error thrown when a geometry type mismatch occurs.
 */
export class TypeMismatchError extends ConstructionError {
  constructor(stepIndex: number, stepId: string, expectedType: string, actualType: string) {
    super(stepIndex, stepId, `Expected ${expectedType}, got ${actualType}`);
    this.name = "TypeMismatchError";
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
  }
}

// =============================================================================
// Internal Step Interface
// =============================================================================

/**
 * Internal representation of a construction step.
 * Used for tracking dependencies and conversion to Step format.
 *
 * Note: In v1, Construction uses EAGER evaluation.
 * Values are pre-computed when geometry methods are called.
 * The compute() function simply returns the already-computed value.
 */
export interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}

// =============================================================================
// Construction Class
// =============================================================================

/**
 * Construction class - Core DSL for geometric constructions.
 *
 * Provides a single API surface for all geometry operations.
 * All operations are methods on Construction with typed parameters.
 *
 * Features:
 * - Pure geometry logic (NO SVG, NO rendering)
 * - Eager computation (values computed when methods called)
 * - Automatic step generation
 * - Dependency tracking
 * - Error collection and validation
 * - Step-by-step navigation
 *
 * Note: All coordinates use SVG coordinate system where (0,0) is top-left
 * and y increases downward. This affects direction semantics for
 * intersection selection ("north" = smaller y, "south" = larger y).
 */
export class Construction {
  // All geometry values stored by ID
  private _values = new Map<string, GeometryValue>();

  // All steps in order
  private _steps: InternalStep[] = [];

  // Current step index for navigation (0-based)
  private _stepIndex = 0;

  // Errors collected during construction
  private _errors: ConstructionError[] = [];

  // Track which points lie on which geometries (for "other" intersection)
  private _pointsOnGeom = new Map<string, Set<string>>();

  // Counter for auto-naming (avoids gaps from potential future undo/redo)
  private _nameCounter = 0;

  // =======================================================================
  // Base Geometry Creators
  // =======================================================================

  /**
   * Create a point at specific coordinates.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param name - Optional name for the point (used as ID if provided)
   * @returns Reference to the created point
   */
  point(x: number, y: number, name?: string): PointRef;

  /**
   * Create a point by copying an existing point reference.
   * @param p - Point reference to copy
   * @param name - Optional name for the new point
   * @returns Reference to the created point
   */
  point(p: PointRef, name?: string): PointRef;

  point(arg1: number | PointRef, arg2: number | string | undefined, arg3?: string): PointRef {
    // Handle coordinate overload: point(x, y, name?)
    if (typeof arg1 === "number" && typeof arg2 === "number") {
      const x = arg1;
      const y = arg2;
      const name = arg3;
      const id = name || this._autoName("point");
      const value: Point = point(x, y);
      this._storeGeom(id, value, []);
      return { id };
    }

    // Handle PointRef overload: point(p, name?)
    if (this._isGeomRef(arg1) && typeof arg2 === "string") {
      const p = arg1 as PointRef;
      const name = arg2;
      const source = this.get<Point>(p);
      return this.point(source.x, source.y, name);
    }

    // Handle PointRef overload: point(p) without name
    if (this._isGeomRef(arg1) && arg2 === undefined) {
      const p = arg1 as PointRef;
      const source = this.get<Point>(p);
      return this.point(source.x, source.y, arg3);
    }

    throw new Error("Invalid arguments to point()");
  }

  /**
   * Create a line from coordinates.
   * @param x1 - Start x coordinate
   * @param y1 - Start y coordinate
   * @param x2 - End x coordinate
   * @param y2 - End y coordinate
   * @param name - Optional name for the line
   * @returns Reference to the created line
   */
  lineByCoords(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef {
    const id = name || this._autoName("line");
    const value: Line = line(x1, y1, x2, y2);
    this._storeGeom(id, value, []);
    return { id };
  }

  /**
   * Create a line from two point references.
   * @param p1 - First point reference
   * @param p2 - Second point reference
   * @param name - Optional name for the line
   * @returns Reference to the created line
   */
  lineByPoints(p1: PointRef, p2: PointRef, name?: string): LineRef {
    const id = name || `${p1.id}_to_${p2.id}`;
    const pt1 = this.get<Point>(p1);
    const pt2 = this.get<Point>(p2);
    const value: Line = line(pt1.x, pt1.y, pt2.x, pt2.y);
    this._storeGeom(id, value, [p1.id, p2.id]);
    return { id };
  }

  /**
   * Create a line. Accepts either coordinates or point references.
   */
  line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef;
  line(p1: PointRef, p2: PointRef, name?: string): LineRef;
  line(
    arg1: number | PointRef,
    arg2: number | PointRef,
    arg3: number | PointRef | string | undefined,
    arg4?: number | string,
    arg5?: string,
  ): LineRef {
    // Handle PointRef overload: line(p1, p2, name?)
    if (this._isGeomRef(arg1) && this._isGeomRef(arg2)) {
      const p1 = arg1 as PointRef;
      const p2 = arg2 as PointRef;
      const name = typeof arg3 === "string" ? arg3 : arg4;
      return this.lineByPoints(p1, p2, name as string | undefined);
    }

    // Handle coordinate overload: line(x1, y1, x2, y2, name?)
    if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
      const x1 = arg1;
      const y1 = arg2;
      const x2 = arg3;
      const y2 = arg4 as number | undefined;
      const name = arg5;
      if (y2 === undefined) {
        throw new Error("line() with coordinates requires 4 numbers (x1, y1, x2, y2)");
      }
      return this.lineByCoords(x1, y1, x2, y2, name);
    }

    throw new Error("Invalid arguments to line()");
  }

  /**
   * Create a circle from center coordinates and radius.
   * @param cx - Center x coordinate
   * @param cy - Center y coordinate
   * @param r - Radius
   * @param name - Optional name for the circle
   * @returns Reference to the created circle
   */
  circleByCoords(cx: number, cy: number, r: number, name?: string): CircleRef {
    const id = name || this._autoName("circle");
    const value: Circle = circle(cx, cy, r);
    this._storeGeom(id, value, []);
    return { id };
  }

  /**
   * Create a circle from center point and radius.
   * @param center - Center point reference
   * @param radius - Radius
   * @param name - Optional name for the circle
   * @returns Reference to the created circle
   */
  circleByCenter(center: PointRef, radius: number, name?: string): CircleRef {
    const id = name || `${center.id}_circle`;
    const pt = this.get<Point>(center);
    const value: Circle = circle(pt.x, pt.y, radius);
    this._storeGeom(id, value, [center.id]);
    return { id };
  }

  /**
   * Create a circle. Accepts either coordinates or a point reference for center.
   */
  circle(cx: number, cy: number, r: number, name?: string): CircleRef;
  circle(center: PointRef, radius: number, name?: string): CircleRef;
  circle(
    arg1: number | PointRef,
    arg2: number,
    arg3: number | string | undefined,
    arg4?: string,
  ): CircleRef {
    // Handle coordinate overload: circle(cx, cy, r, name?)
    if (typeof arg1 === "number" && typeof arg3 === "number") {
      const cx = arg1;
      const cy = arg2;
      const r = arg3;
      const name = arg4;
      return this.circleByCoords(cx, cy, r, name);
    }

    // Handle PointRef overload: circle(center, radius, name?)
    if (this._isGeomRef(arg1)) {
      const center = arg1 as PointRef;
      const radius = arg2;
      const name = typeof arg3 === "string" ? arg3 : arg4;
      return this.circleByCenter(center, radius, name);
    }

    throw new Error("Invalid arguments to circle()");
  }

  /**
   * Create a polygon from an array of point references.
   * @param points - Array of point references
   * @param name - Optional name for the polygon
   * @returns Reference to the created polygon
   */
  polygon(points: PointRef[], name?: string): PolygonRef {
    const id = name || this._autoName("polygon");
    const pts = points.map((r) => this.get<Point>(r));
    const value: Polygon = polygon(pts.map((p) => ({ x: p.x, y: p.y })));
    this._storeGeom(
      id,
      value,
      points.map((r) => r.id),
    );
    return { id };
  }

  // =======================================================================
  // Derived Geometry Operations
  // =======================================================================

  /**
   * Create a point at a specific ratio along a line.
   * @param line - The line reference
   * @param ratio - Ratio from start to end (0 = start, 1 = end, 0.5 = middle)
   * @param name - Optional name for the point
   * @returns Reference to the created point
   */
  pointAt(line: LineRef, ratio: number, name?: string): PointRef {
    const l = this.get<Line>(line);
    const x = l.x1 + (l.x2 - l.x1) * ratio;
    const y = l.y1 + (l.y2 - l.y1) * ratio;
    const id = name || this._autoName("point_at");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [line.id]);
    this._trackPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Create a point at a specific distance from a starting point along a line.
   * @param line - The line reference
   * @param distance - Distance from the starting point
   * @param from - The starting point reference (used for dependency tracking)
   * @param name - Optional name for the point
   * @returns Reference to the created point
   */
  pointOnLineAtDistance(line: LineRef, distance: number, from: PointRef, name?: string): PointRef {
    const l = this.get<Line>(line);
    // Get the from point to ensure it exists and track dependency
    this.get<Point>(from);

    // Calculate vector from start to end of line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      throw new Error(`Cannot compute pointOnLineAtDistance: line ${line.id} has zero length`);
    }

    // Calculate point at distance from start
    const scale = distance / len;
    const x = l.x1 + dx * scale;
    const y = l.y1 + dy * scale;

    const id = name || this._autoName("point_on_line");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [line.id, from.id]);
    this._trackPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Create the midpoint between two points.
   * @param p1 - First point reference
   * @param p2 - Second point reference
   * @param name - Optional name for the midpoint
   * @returns Reference to the created midpoint
   */
  midpoint(p1: PointRef, p2: PointRef, name?: string): PointRef {
    const pt1 = this.get<Point>(p1);
    const pt2 = this.get<Point>(p2);
    const x = (pt1.x + pt2.x) / 2;
    const y = (pt1.y + pt2.y) / 2;
    const id = name || this._autoName("midpoint");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [p1.id, p2.id]);
    return { id };
  }

  /**
   * Extend a line by a specific length from its end point.
   * Extends from (x2, y2) away from (x1, y1).
   * @param line - The line reference
   * @param length - Length to extend
   * @param name - Optional name for the extended line
   * @returns Reference to the extended line
   */
  extendLine(line: LineRef, length: number, name?: string): LineRef {
    const l = this.get<Line>(line);
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      throw new Error(`Cannot extend line ${line.id}: has zero length`);
    }

    const scale = (len + length) / len;
    const x2 = l.x1 + dx * scale;
    const y2 = l.y1 + dy * scale;
    return this.lineByCoords(l.x1, l.y1, x2, y2, name);
  }

  /**
   * Create a line from a starting point towards another point with a specific length.
   * @param from - Starting point reference
   * @param towards - Point reference indicating direction
   * @param length - Length of the line
   * @param name - Optional name for the line
   * @returns Reference to the created line
   */
  lineTowards(from: PointRef, towards: PointRef, length: number, name?: string): LineRef {
    const f = this.get<Point>(from);
    const t = this.get<Point>(towards);
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) {
      throw new Error(`Cannot create lineTowards from ${from.id} to ${towards.id}: zero distance`);
    }

    const scale = length / len;
    const x2 = f.x + dx * scale;
    const y2 = f.y + dy * scale;
    return this.lineByCoords(f.x, f.y, x2, y2, name);
  }

  /**
   * Create a line perpendicular to another line at a specific point.
   * @param line - The line reference
   * @param at - The point reference where the perpendicular should be created
   * @param name - Optional name for the perpendicular line
   * @returns Reference to the created perpendicular line
   */
  perpendicular(line: LineRef, at: PointRef, name?: string): LineRef {
    const l = this.get<Line>(line);
    const p = this.get<Point>(at);

    // Vector of original line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;

    // Perpendicular vector (rotated 90 degrees counterclockwise: (-dy, dx))
    const px = -dy;
    const py = dx;

    // Normalize
    const len = Math.sqrt(px * px + py * py);
    if (len === 0) {
      throw new Error(`Cannot create perpendicular: original line ${line.id} has zero length`);
    }

    const ux = px / len;
    const uy = py / len;

    // Use the same length as the original line for the perpendicular
    const length = Math.sqrt(dx * dx + dy * dy);
    const x2 = p.x + ux * length;
    const y2 = p.y + uy * length;

    return this.lineByCoords(p.x, p.y, x2, y2, name);
  }

  // =======================================================================
  // Intersection Operations
  // =======================================================================

  /**
   * Find intersection point between two geometries.
   *
   * Supports:
   * - Circle-Circle: Use direction ("north"/"south") to select which intersection
   * - Circle-Line: Use direction ("left"/"right") or {exclude} to select which intersection
   * - Line-Circle: Same as Circle-Line (order doesn't matter)
   * - Line-Line: Returns the single intersection point (directionOrOptions is optional)
   *
   * @param a - First geometry (CircleRef or LineRef)
   * @param b - Second geometry (CircleRef or LineRef)
   * @param directionOrOptions - Optional: Direction or exclude option for selecting intersection
   * @param name - Optional name for the intersection point
   * @returns Reference to the intersection point
   * @throws NoIntersectionError if geometries don't intersect
   */
  intersection(
    a: CircleRef | LineRef,
    b: CircleRef | LineRef,
    directionOrOptions?: IntersectionOptions,
    name?: string,
  ): PointRef {
    const id = name || this._autoName("intersection");
    const valA = this.get(a);
    const valB = this.get(b);

    let resultPoint: Point | null = null;

    // Circle-Circle intersection
    if (valA.type === "circle" && valB.type === "circle") {
      resultPoint = this._intersectCircles(valA, valB, directionOrOptions);
      if (!resultPoint) {
        throw new NoIntersectionError(this._steps.length, id, a.id, b.id);
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }

    // Circle-Line intersection (order matters for direction semantics)
    if (valA.type === "circle" && valB.type === "line") {
      resultPoint = this._intersectCircleLine(valA, valB, directionOrOptions);
      if (!resultPoint) {
        throw new NoIntersectionError(this._steps.length, id, a.id, b.id);
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }

    // Line-Circle intersection (swap and recurse)
    if (valA.type === "line" && valB.type === "circle") {
      return this.intersection(b, a, directionOrOptions, name);
    }

    // Line-Line intersection
    if (valA.type === "line" && valB.type === "line") {
      resultPoint = this._intersectLines(valA, valB);
      if (!resultPoint) {
        throw new NoIntersectionError(this._steps.length, id, a.id, b.id);
      }
      this._storeGeom(id, resultPoint, [a.id, b.id]);
      this._trackPointOnGeom(id, a.id);
      this._trackPointOnGeom(id, b.id);
      return { id };
    }

    throw new Error(`Unsupported intersection: ${valA.type} and ${valB.type}`);
  }

  /**
   * Internal: Intersect two circles.
   * Returns the selected intersection point based on direction or exclude option.
   */
  private _intersectCircles(
    c1: Circle,
    c2: Circle,
    directionOrOptions?: IntersectionOptions,
  ): Point | null {
    const result = circleCircleIntersection(c1.cx, c1.cy, c1.r, c2.cx, c2.cy, c2.r);

    if (!result || result.length !== 4) {
      return null;
    }

    const [x1, y1, x2, y2] = result;

    // Handle exclude option
    if (
      directionOrOptions &&
      typeof directionOrOptions === "object" &&
      "exclude" in directionOrOptions
    ) {
      const excludedPoint = this.get<Point>(directionOrOptions.exclude);
      const d1 = this._distanceSq(x1, y1, excludedPoint.x, excludedPoint.y);
      const d2 = this._distanceSq(x2, y2, excludedPoint.x, excludedPoint.y);
      return d1 < d2 ? point(x2, y2) : point(x1, y1);
    }

    // Handle direction (north/south based on y-coordinate in SVG)
    if (directionOrOptions && typeof directionOrOptions === "string") {
      const dir = directionOrOptions as Direction;
      if (dir === "north") {
        // Pick intersection with smaller y (north in SVG where y increases downward)
        return point(y1 < y2 ? x1 : x2, y1 < y2 ? y1 : y2);
      } else if (dir === "south") {
        // Pick intersection with larger y (south)
        return point(y1 > y2 ? x1 : x2, y1 > y2 ? y1 : y2);
      }
    }

    // Default: pick first intersection (when no direction/options specified)
    // For circle-circle with no selection, we need to pick one
    // This is arbitrary but deterministic
    return point(x1, y1);
  }

  /**
   * Internal: Intersect a circle with a line segment.
   * Returns the selected intersection point based on direction or exclude option.
   */
  private _intersectCircleLine(
    circle: Circle,
    line: Line,
    directionOrOptions?: IntersectionOptions,
  ): Point | null {
    const result = inteceptCircleLineSeg(
      circle.cx,
      circle.cy,
      line.x1,
      line.y1,
      line.x2,
      line.y2,
      circle.r,
    );

    if (!result || result.length === 0) {
      return null;
    }

    // Handle exclude option
    if (
      directionOrOptions &&
      typeof directionOrOptions === "object" &&
      "exclude" in directionOrOptions
    ) {
      const excludedPoint = this.get<Point>(directionOrOptions.exclude);
      for (const [x, y] of result) {
        if (this._distanceSq(x, y, excludedPoint.x, excludedPoint.y) > 0.001) {
          return point(x, y);
        }
      }
      return null; // All intersections are the excluded point
    }

    // Handle direction for circle-line
    if (directionOrOptions && typeof directionOrOptions === "string") {
      const dir = directionOrOptions as Direction;
      if (dir === "left") {
        // Pick intersection with smaller x
        const sorted = [...result].sort((a, b) => a[0] - b[0]);
        return point(sorted[0][0], sorted[0][1]);
      } else if (dir === "right") {
        // Pick intersection with larger x
        const sorted = [...result].sort((a, b) => a[0] - b[0]);
        return point(sorted[sorted.length - 1][0], sorted[sorted.length - 1][1]);
      }
    }

    // Default: pick first intersection
    return point(result[0][0], result[0][1]);
  }

  /**
   * Internal: Intersect two lines.
   * Returns the intersection point, or null if lines are parallel.
   */
  private _intersectLines(l1: Line, l2: Line): Point | null {
    const result = lineIntersect(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);

    if (!result || result.length !== 2) {
      return null;
    }

    return point(result[0], result[1]);
  }

  /**
   * Helper: Squared distance between two points (avoids sqrt for comparison).
   */
  private _distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  // =======================================================================
  // Step Management
  // =======================================================================

  /**
   * Get the current step index (0-based).
   */
  get currentStepIndex(): number {
    return this._stepIndex;
  }

  /**
   * Navigate to a specific step index.
   * @param index - The step index to navigate to (0-based)
   */
  goTo(index: number): void {
    this._stepIndex = Math.max(0, Math.min(index, this._steps.length - 1));
  }

  /**
   * Move to the next step.
   */
  next(): void {
    this._stepIndex = Math.min(this._stepIndex + 1, this._steps.length - 1);
  }

  /**
   * Move to the previous step.
   */
  prev(): void {
    this._stepIndex = Math.max(this._stepIndex - 1, 0);
  }

  /**
   * Reset to the first step.
   */
  reset(): void {
    this._stepIndex = 0;
  }

  /**
   * Get all steps up to and including the current step.
   */
  getSteps(): InternalStep[] {
    return this._steps.slice(0, this._stepIndex + 1);
  }

  /**
   * Get all steps (not just current ones).
   */
  getAllSteps(): InternalStep[] {
    return [...this._steps];
  }

  // =======================================================================
  // Value Access
  // =======================================================================

  /**
   * Get the geometry value for a reference.
   * @param ref - The geometry reference
   * @returns The geometry value
   * @throws GeometryNotFoundError if the geometry doesn't exist
   */
  get<T extends GeometryValue>(ref: GeomRef): T {
    const value = this._values.get(ref.id);
    if (!value) {
      throw new GeometryNotFoundError(this._stepIndex, "get", ref.id);
    }
    return value as T;
  }

  /**
   * Get all geometry values.
   * @returns A Map of all geometry IDs to their values
   */
  getValues(): Map<string, GeometryValue> {
    return new Map(this._values);
  }

  /**
   * Get geometry values up to the current step.
   */
  getCurrentValues(): Map<string, GeometryValue> {
    const result = new Map<string, GeometryValue>();
    const currentSteps = this.getSteps();
    for (const step of currentSteps) {
      const value = this._values.get(step.id);
      if (value) {
        result.set(step.id, value);
      }
    }
    return result;
  }

  // =======================================================================
  // Error Handling
  // =======================================================================

  /**
   * Validate all steps in the construction.
   * Attempts to compute all values and collects any errors.
   * @returns true if all steps are valid, false otherwise
   */
  validate(): boolean {
    this._errors = [];

    // Try to get all values to trigger any errors
    const ids = Array.from(this._values.keys());
    for (const id of ids) {
      try {
        this.getValues().get(id);
      } catch (e) {
        if (e instanceof ConstructionError) {
          this._errors.push(e);
        } else {
          this._errors.push(
            new ConstructionError(
              this._steps.length,
              id,
              e instanceof Error ? e.message : String(e),
              e instanceof Error ? e : undefined,
            ),
          );
        }
      }
    }

    return this._errors.length === 0;
  }

  /**
   * Get all errors collected during validation.
   */
  getErrors(): ConstructionError[] {
    return [...this._errors];
  }

  /**
   * Clear all collected errors.
   */
  clearErrors(): void {
    this._errors = [];
  }

  // =======================================================================
  // Private Helpers
  // =======================================================================

  /**
   * Generate an automatic name for a geometry.
   * Format: prefix_nameCounter (e.g., "point_1", "line_2")
   */
  private _autoName(prefix: string): string {
    this._nameCounter++;
    return `${prefix}_${this._nameCounter}`;
  }

  /**
   * Store a geometry value and create a step for it.
   */
  private _storeGeom(id: string, value: GeometryValue, dependencies: string[]): void {
    this._values.set(id, value);
    this._steps.push({
      id,
      type: value.type,
      dependencies,
      compute: () => value, // Eager: value is already computed
    });
  }

  /**
   * Track that a point lies on a geometry (for "other" intersection).
   */
  private _trackPointOnGeom(pointId: string, geomId: string): void {
    if (!this._pointsOnGeom.has(geomId)) {
      this._pointsOnGeom.set(geomId, new Set());
    }
    this._pointsOnGeom.get(geomId)!.add(pointId);
  }

  /**
   * Type guard for any geometry reference.
   * All ref types have the same structure: { readonly id: string }
   */
  private _isGeomRef(ref: unknown): ref is GeomRef {
    return (
      ref !== null &&
      typeof ref === "object" &&
      "id" in ref &&
      typeof (ref as { id: unknown }).id === "string"
    );
  }
}
