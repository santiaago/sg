// Higher-level declarative geometry construction framework.
// This is a facade/abstraction layer on top of the existing step system.
// Steps are created automatically from the high-level code.

import type { Point, Line, Circle, Polygon, GeometryValue } from "../types/geometry";
import { point, line, circle, polygon } from "../types/geometry";

// Import only coordinate-based utility functions from @sg/geometry
// DO NOT import classes (Point, Line, Circle) - use coordinate-based functions only
import { intersection, inteceptCircleLineSeg, lineIntersect } from "@sg/geometry";

/** Direction type for selecting intersection points */
export type Direction = "north" | "south" | "left" | "right";

/**
 * Options for intersection operations.
 * Can be a direction string or an object with exclude parameter.
 */
export type IntersectionOptions = Direction | { exclude?: string };

// ============================================================================
// Typed Reference Types
// ============================================================================

/**
 * Reference to a Point geometry.
 * Pure identifier - Construction holds all data.
 */
export interface PointRef {
  readonly id: string;
}

/**
 * Reference to a Line geometry.
 * Pure identifier - Construction holds all data.
 */
export interface LineRef {
  readonly id: string;
}

/**
 * Reference to a Circle geometry.
 * Pure identifier - Construction holds all data.
 */
export interface CircleRef {
  readonly id: string;
}

/**
 * Reference to a Polygon geometry.
 * Pure identifier - Construction holds all data.
 */
export interface PolygonRef {
  readonly id: string;
}

/** Union type for all geometry references */
export type GeomRef = PointRef | LineRef | CircleRef | PolygonRef;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for construction errors.
 * Provides structured error information including step context.
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
  }
}

/** Error thrown when geometries do not intersect */
export class NoIntersectionError extends ConstructionError {
  constructor(
    stepIndex: number,
    stepId: string,
    geom1: string,
    geom2: string,
  ) {
    super(
      stepIndex,
      stepId,
      `No intersection between ${geom1} and ${geom2}`,
    );
    this.name = "NoIntersectionError";
  }
}

/** Error thrown when geometry is not found */
export class GeometryNotFoundError extends ConstructionError {
  constructor(
    stepIndex: number,
    stepId: string,
    geomId: string,
  ) {
    super(
      stepIndex,
      stepId,
      `Geometry not found: ${geomId}`,
    );
    this.name = "GeometryNotFoundError";
  }
}

// ============================================================================
// Internal Step Type
// ============================================================================

/**
 * Internal representation of a construction step.
 * Used for tracking dependencies and managing step-by-step navigation.
 */
interface InternalStep {
  id: string;
  type: GeometryValue["type"];
  dependencies: string[];
  compute: () => GeometryValue;
}

// ============================================================================
// Construction Class
// ============================================================================

/**
 * Main construction class for building geometric constructions declaratively.
 * 
 * Features:
 * - Pure geometry logic (no SVG, no rendering knowledge)
 * - Single API surface for all operations
 * - Typed reference objects (PointRef, LineRef, etc.) as pure identifiers
 * - Uses app2 GeometryValue types as canonical
 * - Uses @sg/geometry utilities internally with raw coordinates only
 * - Eager computation (values computed when methods are called)
 * - Step-by-step navigation support
 * - Error collection and validation
 */
export class Construction {
  private _values = new Map<string, GeometryValue>();
  private _steps: InternalStep[] = [];
  private _stepIndex = 0;
  private _errors: ConstructionError[] = [];
  private _pointsOnGeom = new Map<string, Set<string>>(); // geomId -> Set<pointId>
  private _autoNameCounter = 0;

  // ==========================================================================
  // Base Geometry Creators
  // ==========================================================================

  /**
   * Create a point at given coordinates.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param name - Optional name/ID for the point
   * @returns PointRef referencing the created point
   */
  point(x: number, y: number, name?: string): PointRef {
    const id = name || this._autoName("point");
    const value: Point = point(x, y);
    this._storeGeom(id, value, []);
    return { id };
  }

  /**
   * Create a line.
   * @param x1 - Start X coordinate
   * @param y1 - Start Y coordinate
   * @param x2 - End X coordinate
   * @param y2 - End Y coordinate
   * @param name - Optional name/ID for the line
   * @returns LineRef referencing the created line
   */
  line(x1: number, y1: number, x2: number, y2: number, name?: string): LineRef;
  /**
   * Create a line from two points.
   * @param p1 - First point reference
   * @param p2 - Second point reference
   * @param name - Optional name/ID for the line
   * @returns LineRef referencing the created line
   */
  line(p1: PointRef, p2: PointRef, name?: string): LineRef;
  line(
    arg1: number | PointRef,
    arg2: number | PointRef,
    arg3: number | PointRef | undefined,
    arg4: number | undefined,
    arg5?: string,
  ): LineRef {
    // Handle PointRef overload
    if (this._isPointRef(arg1) && this._isPointRef(arg2)) {
      const p1 = this.get<Point>(arg1);
      const p2 = this.get<Point>(arg2);
      const id = arg5 || `${arg1.id}_to_${arg2.id}`;
      const value: Line = line(p1.x, p1.y, p2.x, p2.y);
      this._storeGeom(id, value, [arg1.id, arg2.id]);
      return { id };
    }

    // Handle coordinate overload
    const x1 = arg1 as number;
    const y1 = arg2 as number;
    const x2 = arg3 as number;
    const y2 = arg4 as number;
    const name = arg5;
    const id = name || this._autoName("line");
    const value: Line = line(x1, y1, x2, y2);
    this._storeGeom(id, value, []);
    return { id };
  }

  /**
   * Create a circle.
   * @param center - Center point reference
   * @param radius - Radius of the circle
   * @param name - Optional name/ID for the circle
   * @returns CircleRef referencing the created circle
   */
  circle(center: PointRef, radius: number, name?: string): CircleRef;
  /**
   * Create a circle at given coordinates.
   * @param cx - Center X coordinate
   * @param cy - Center Y coordinate
   * @param r - Radius of the circle
   * @param name - Optional name/ID for the circle
   * @returns CircleRef referencing the created circle
   */
  circle(cx: number, cy: number, r: number, name?: string): CircleRef;
  circle(
    arg1: number | PointRef,
    arg2: number | number,
    arg3: number | string,
    arg4?: string,
  ): CircleRef {
    // Handle coordinate overload
    if (typeof arg1 === "number") {
      const cx = arg1;
      const cy = arg2 as number;
      const r = arg3 as number;
      const name = arg4;
      const id = name || this._autoName("circle");
      const value: Circle = circle(cx, cy, r);
      this._storeGeom(id, value, []);
      return { id };
    }

    // Handle PointRef overload
    const center = arg1 as PointRef;
    const radius = arg2 as number;
    const name = arg3 as string | undefined;
    const pt = this.get<Point>(center);
    const id = name || `${center.id}_circle`;
    const value: Circle = circle(pt.x, pt.y, radius);
    this._storeGeom(id, value, [center.id]);
    return { id };
  }

  // ==========================================================================
  // Derived Geometry Operations
  // ==========================================================================

  /**
   * Create a point at a ratio along a line.
   * @param line - Line reference
   * @param ratio - Ratio along the line (0 = start, 1 = end, 0.5 = midpoint)
   * @param name - Optional name/ID for the point
   * @returns PointRef referencing the created point
   */
  pointAt(line: LineRef, ratio: number, name?: string): PointRef {
    const l = this.get<Line>(line);
    const x = l.x1 + (l.x2 - l.x1) * ratio;
    const y = l.y1 + (l.y2 - l.y1) * ratio;
    const id = name || this._autoName("pointAt");
    const value: Point = point(x, y);
    this._storeGeom(id, value, [line.id]);
    this._addPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Create a point at a distance from a point along a line.
   * @param line - Line reference
   * @param distance - Distance from the start point of the line
   * @param from - Point reference to measure distance from (defaults to line start)
   * @param name - Optional name/ID for the point
   * @returns PointRef referencing the created point
   */
  pointOnLineAtDistance(
    line: LineRef,
    distance: number,
    from?: PointRef,
    name?: string,
  ): PointRef {
    const l = this.get<Line>(line);
    const start = from ? this.get<Point>(from) : point(l.x1, l.y1);
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = distance / len;
    const x = l.x1 + dx * scale;
    const y = l.y1 + dy * scale;
    const id = name || this._autoName("pointOnLineAtDistance");
    const value: Point = point(x, y);
    const deps = from ? [line.id, from.id] : [line.id];
    this._storeGeom(id, value, deps);
    this._addPointOnGeom(id, line.id);
    return { id };
  }

  /**
   * Find intersection between two geometries.
   * Supports circle-circle, circle-line, and line-line intersections.
   * @param a - First geometry reference (CircleRef or LineRef)
   * @param b - Second geometry reference (CircleRef or LineRef)
   * @param options - Direction string or object with exclude parameter
   * @param name - Optional name/ID for the intersection point
   * @returns PointRef referencing the intersection point
   */
  intersection(
    a: CircleRef,
    b: CircleRef,
    options: Direction,
    name?: string,
  ): PointRef;
  intersection(
    a: CircleRef,
    b: LineRef,
    options: Direction | { exclude?: PointRef },
    name?: string,
  ): PointRef;
  intersection(
    a: LineRef,
    b: CircleRef,
    options: Direction | { exclude?: PointRef },
    name?: string,
  ): PointRef;
  intersection(a: LineRef, b: LineRef, name?: string): PointRef;
  intersection(
    a: CircleRef | LineRef,
    b: CircleRef | LineRef,
    options: Direction | { exclude?: PointRef } | string | undefined,
    name?: string,
  ): PointRef {
    const id = name || this._autoName("intersection");

    const valA = this.get<GeometryValue>(a as GeomRef);
    const valB = this.get<GeometryValue>(b as GeomRef);

    const aId = (a as GeomRef).id;
    const bId = (b as GeomRef).id;

    let resultPoint: Point | null = null;

    // Circle-Circle intersection
    if (valA.type === "circle" && valB.type === "circle") {
      const direction = options as Direction;
      resultPoint = this._intersectCircles(valA, valB, direction);
    }
    // Circle-Line intersection
    else if (valA.type === "circle" && valB.type === "line") {
      resultPoint = this._intersectCircleLine(
        valA,
        valB,
        options as Direction | { exclude?: PointRef },
        aId,
        bId,
      );
    }
    // Line-Circle intersection (swap and recurse)
    else if (valA.type === "line" && valB.type === "circle") {
      return this.intersection(
        b as CircleRef,
        a as LineRef,
        options as Direction | { exclude?: PointRef },
        name,
      );
    }
    // Line-Line intersection
    else if (valA.type === "line" && valB.type === "line") {
      resultPoint = this._intersectLines(valA, valB, aId, bId);
    }

    if (!resultPoint) {
      throw new NoIntersectionError(
        this._steps.length,
        id,
        aId,
        bId,
      );
    }

    this._storeGeom(id, resultPoint, [aId, bId]);
    this._addPointOnGeom(id, aId);
    this._addPointOnGeom(id, bId);
    return { id };
  }

  /**
   * Extend a line by a given length.
   * @param line - Line reference to extend
   * @param length - Length to extend the line
   * @param name - Optional name/ID for the extended line
   * @returns LineRef referencing the extended line
   */
  extendLine(line: LineRef, length: number, name?: string): LineRef {
    const l = this.get<Line>(line);
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = (len + length) / len;
    const x2 = l.x1 + dx * scale;
    const y2 = l.y1 + dy * scale;
    return this.line(l.x1, l.y1, x2, y2, name);
  }

  /**
   * Create a line from a point towards another point with a given length.
   * @param from - Starting point reference
   * @param towards - Direction point reference
   * @param length - Length of the line
   * @param name - Optional name/ID for the line
   * @returns LineRef referencing the created line
   */
  lineTowards(
    from: PointRef,
    towards: PointRef,
    length: number,
    name?: string,
  ): LineRef {
    const f = this.get<Point>(from);
    const t = this.get<Point>(towards);
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = length / len;
    const x2 = f.x + dx * scale;
    const y2 = f.y + dy * scale;
    return this.line(f.x, f.y, x2, y2, name);
  }

  /**
   * Find the midpoint between two points.
   * @param p1 - First point reference
   * @param p2 - Second point reference
   * @param name - Optional name/ID for the midpoint
   * @returns PointRef referencing the midpoint
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
   * Create a line perpendicular to another line at a given point.
   * @param line - Line reference
   * @param at - Point reference where the perpendicular should be created
   * @param name - Optional name/ID for the perpendicular line
   * @returns LineRef referencing the perpendicular line
   */
  perpendicular(line: LineRef, at: PointRef, name?: string): LineRef {
    const l = this.get<Line>(line);
    const p = this.get<Point>(at);

    // Vector of original line
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;

    // Perpendicular vector (rotated 90 degrees)
    const px = -dy;
    const py = dx;

    // Normalize
    const len = Math.sqrt(px * px + py * py);
    const ux = px / len;
    const uy = py / len;

    // Use a reasonable length (same as original line)
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    const x2 = p.x + ux * lineLength;
    const y2 = p.y + uy * lineLength;

    return this.line(p.x, p.y, x2, y2, name);
  }

  /**
   * Create a polygon from a list of point references.
   * @param points - Array of point references in order
   * @param name - Optional name/ID for the polygon
   * @returns PolygonRef referencing the created polygon
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

  // ==========================================================================
  // Step Management
  // ==========================================================================

  /** Current step index (0-based) */
  get currentStepIndex(): number {
    return this._stepIndex;
  }

  /**
   * Advance to the next step.
   */
  next(): void {
    this._stepIndex = Math.min(this._stepIndex + 1, this._steps.length - 1);
  }

  /**
   * Go back to the previous step.
   */
  prev(): void {
    this._stepIndex = Math.max(this._stepIndex - 1, 0);
  }

  /**
   * Go to a specific step index.
   * @param index - Step index to navigate to
   */
  goTo(index: number): void {
    this._stepIndex = Math.max(0, Math.min(index, this._steps.length - 1));
  }

  /**
   * Reset to the first step.
   */
  reset(): void {
    this._stepIndex = 0;
  }

  /**
   * Get all steps up to the current step index.
   * @returns Array of internal steps
   */
  getSteps(): InternalStep[] {
    return this._steps.slice(0, this._stepIndex + 1);
  }

  /**
   * Get all steps in the construction.
   * @returns Array of all internal steps
   */
  getAllSteps(): InternalStep[] {
    return [...this._steps];
  }

  /**
   * Get the total number of steps.
   */
  get stepCount(): number {
    return this._steps.length;
  }

  // ==========================================================================
  // Value Access
  // ==========================================================================

  /**
   * Get a geometry value by reference.
   * @param ref - Geometry reference
   * @returns The geometry value
   * @throws GeometryNotFoundError if geometry not found
   */
  get<T extends GeometryValue>(ref: GeomRef): T {
    const value = this._values.get(ref.id);
    if (!value) {
      throw new GeometryNotFoundError(
        this._stepIndex,
        ref.id,
        ref.id,
      );
    }
    return value as T;
  }

  /**
   * Get all geometry values as a Map.
   * @returns Map of geometry IDs to GeometryValue
   */
  getValues(): Map<string, GeometryValue> {
    return new Map(this._values);
  }

  /**
   * Get a specific geometry value by ID.
   * @param id - Geometry ID
   * @returns The geometry value or undefined if not found
   */
  getValue(id: string): GeometryValue | undefined {
    return this._values.get(id);
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  /**
   * Validate the construction by attempting to compute all steps.
   * Collects errors but does not throw.
   * @returns true if all steps are valid, false otherwise
   */
  validate(): boolean {
    this._errors = [];
    for (let i = 0; i < this._steps.length; i++) {
      try {
        this._steps[i].compute();
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        this._errors.push(
          new ConstructionError(
            i,
            this._steps[i].id,
            error.message,
            error,
          ),
        );
      }
    }
    return this._errors.length === 0;
  }

  /**
   * Get all errors from the last validation.
   * @returns Array of ConstructionError
   */
  getErrors(): ConstructionError[] {
    return [...this._errors];
  }

  /**
   * Clear all errors.
   */
  clearErrors(): void {
    this._errors = [];
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Generate an auto-incrementing name for a geometry.
   * @param prefix - Name prefix (e.g., "point", "line", "circle")
   * @returns Generated name
   */
  private _autoName(prefix: string): string {
    this._autoNameCounter++;
    return `${prefix}_${this._autoNameCounter}`;
  }

  /**
   * Store a geometry value and create an internal step.
   * @param id - Geometry ID
   * @param value - Geometry value
   * @param dependencies - Array of dependency geometry IDs
   */
  private _storeGeom(
    id: string,
    value: GeometryValue,
    dependencies: string[],
  ): void {
    this._values.set(id, value);
    this._steps.push({
      id,
      type: value.type,
      dependencies,
      compute: () => value,
    });
    // Reset step index to include new step
    this._stepIndex = Math.min(this._stepIndex, this._steps.length - 1);
  }

  /**
   * Track which points lie on which geometries.
   * @param pointId - Point ID
   * @param geomId - Geometry ID
   */
  private _addPointOnGeom(pointId: string, geomId: string): void {
    if (!this._pointsOnGeom.has(geomId)) {
      this._pointsOnGeom.set(geomId, new Set());
    }
    this._pointsOnGeom.get(geomId)!.add(pointId);
  }

  /**
   * Get all points that lie on a geometry.
   * @param geomId - Geometry ID
   * @returns Set of point IDs
   */
  private _getPointsOnGeom(geomId: string): Set<string> {
    return this._pointsOnGeom.get(geomId) || new Set();
  }

  /**
   * Check if a value is a PointRef.
   * @param value - Value to check
   * @returns true if value is a PointRef
   */
  private _isPointRef(value: unknown): value is PointRef {
    return (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof (value as { id: unknown }).id === "string"
    );
  }

  /**
   * Find intersection of two circles.
   * @param c1 - First circle
   * @param c2 - Second circle
   * @param direction - Direction to select intersection point
   * @returns Point at the selected intersection
   */
  private _intersectCircles(
    c1: Circle,
    c2: Circle,
    direction: Direction,
  ): Point | null {
    // Use @sg/geometry coordinate-based intersection function
    const result = intersection(
      c1.cx,
      c1.cy,
      c1.r,
      c2.cx,
      c2.cy,
      c2.r,
    );

    if (!result) return null;

    const [x1, y1, x2, y2] = result;

    // In SVG: y increases downward, so "north" = smaller y, "south" = larger y
    if (direction === "north") {
      return point(y1 < y2 ? x1 : x2, y1 < y2 ? y1 : y2);
    } else if (direction === "south") {
      return point(y1 > y2 ? x1 : x2, y1 > y2 ? y1 : y2);
    } else {
      // For "left" and "right", use x-coordinate
      // "left" = smaller x, "right" = larger x
      if (direction === "left") {
        return point(x1 < x2 ? x1 : x2, x1 < x2 ? y1 : y2);
      } else {
        // "right"
        return point(x1 > x2 ? x1 : x2, x1 > x2 ? y1 : y2);
      }
    }
  }

  /**
   * Find intersection of a circle and a line.
   * @param circle - Circle geometry
   * @param line - Line geometry
   * @param options - Direction or exclude option
   * @param circleId - Circle ID for error reporting
   * @param lineId - Line ID for error reporting
   * @returns Point at the selected intersection
   */
  private _intersectCircleLine(
    circle: Circle,
    line: Line,
    options: Direction | { exclude?: PointRef },
    circleId: string,
    lineId: string,
  ): Point | null {
    // Use @sg/geometry coordinate-based function
    const result = inteceptCircleLineSeg(
      circle.cx,
      circle.cy,
      line.x1,
      line.y1,
      line.x2,
      line.y2,
      circle.r,
    );

    if (!result || result.length === 0) return null;

    // If options is a Direction string
    if (typeof options === "string") {
      const direction = options as Direction;
      // For now, just return the first point for direction
      // Direction semantics for circle-line need refinement
      return point(result[0][0], result[0][1]);
    }

    // If options has exclude parameter
    if ("exclude" in options && options.exclude) {
      const exclude = options.exclude;
      const excludePoint = this.get<Point>(exclude);

      // Find intersection that is NOT the excluded point
      for (const [x, y] of result) {
        const dx = x - excludePoint.x;
        const dy = y - excludePoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Use a small tolerance for floating point comparison
        if (dist > 1e-10) {
          return point(x, y);
        }
      }

      // No non-excluded intersection found
      return null;
    }

    // Default: return first intersection
    return point(result[0][0], result[0][1]);
  }

  /**
   * Find intersection of two lines.
   * @param l1 - First line
   * @param l2 - Second line
   * @param l1Id - First line ID for error reporting
   * @param l2Id - Second line ID for error reporting
   * @returns Point at the intersection
   */
  private _intersectLines(
    l1: Line,
    l2: Line,
    l1Id: string,
    l2Id: string,
  ): Point | null {
    // Use @sg/geometry coordinate-based lineIntersect function
    const result = lineIntersect(
      l1.x1,
      l1.y1,
      l1.x2,
      l1.y2,
      l2.x1,
      l2.y1,
      l2.x2,
      l2.y2,
    );

    if (!result) return null;

    return point(result[0], result[1]);
  }
}
