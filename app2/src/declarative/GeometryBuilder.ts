// GeometryBuilder - Core class for declarative geometry construction
// This provides a fluid, chainable API for defining geometric constructions
// and automatically generates Step objects for the existing step system.

import type { GeometryValue, Point, Line, Circle, Polygon, CoordinateSystem } from "../types/geometry";
import type { Step } from "../types/geometry";
import { point, line, circle, polygon, coordinateSystem } from "../types/geometry";
import { pointFromCircles, pointFromCircleAndLine, lineTowards } from "../geometry/constructors";
import { drawPoint, drawLine, drawCircle, drawPolygon, drawCoordinateSystem } from "../svgElements";
import { POINT_RADIUS_MEDIUM, STROKE_WIDTH_THIN } from "../config/geometryConfig";

/**
 * GeometryBuilder provides a declarative API for geometric constructions.
 * It collects geometry definitions and can generate Step[] arrays compatible
 * with the existing step execution system.
 *
 * @example
 * const builder = new GeometryBuilder();
 * const ML = builder.line("ml", config.lx1, config.ly1, config.lx2, config.ly2);
 * const C1 = builder.pointAt("c1", ML, config.C1_POSITION_RATIO);
 * const C1_C = builder.circle("c1_c", C1, config.circleRadius);
 * const steps = builder.toSteps();
 */
export class GeometryBuilder<TConfig extends Record<string, unknown>> {
  private readonly steps: Map<string, Step<TConfig>> = new Map();
  private readonly geomTypes: Map<string, GeometryValue["type"]> = new Map();
  private stepCounter: number = 0;

  /**
   * Generate a unique step ID
   */
  private nextId(prefix: string): string {
    return `${prefix}_${this.stepCounter++}`;
  }

  /**
   * Create a point geometry
   * @param id - Unique identifier for this geometry
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Geometry reference (just the ID for now, but typed)
   */
  point(id: string, x: number | ((config: TConfig) => number), y: number | ((config: TConfig) => number)): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const resolvedX = typeof x === "function" ? (x as Function)(config) : x;
        const resolvedY = typeof y === "function" ? (y as Function)(config) : y;
        return new Map([[id, point(resolvedX, resolvedY)]]);
      },
      draw: (svg, values, store, theme) => {
        const p = values.get(id);
        if (p && p.type === "point") {
          drawPoint(svg, values, id, POINT_RADIUS_MEDIUM, store, theme);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "point");
    return id;
  }

  /**
   * Create a line geometry between two points
   * @param id - Unique identifier for this geometry
   * @param x1 - First point X coordinate
   * @param y1 - First point Y coordinate
   * @param x2 - Second point X coordinate
   * @param y2 - Second point Y coordinate
   * @returns Geometry reference
   */
  line(id: string, x1: number | ((config: TConfig) => number), y1: number | ((config: TConfig) => number), x2: number | ((config: TConfig) => number), y2: number | ((config: TConfig) => number)): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const rx1 = typeof x1 === "function" ? (x1 as Function)(config) : x1;
        const ry1 = typeof y1 === "function" ? (y1 as Function)(config) : y1;
        const rx2 = typeof x2 === "function" ? (x2 as Function)(config) : x2;
        const ry2 = typeof y2 === "function" ? (y2 as Function)(config) : y2;
        return new Map([[id, line(rx1, ry1, rx2, ry2)]]);
      },
      draw: (svg, values, store, theme) => {
        const l = values.get(id);
        if (l && l.type === "line") {
          drawLine(svg, values, id, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "line");
    return id;
  }

  /**
   * Create a line between two point references
   * @param id - Unique identifier for this geometry
   * @param p1Id - First point geometry ID
   * @param p2Id - Second point geometry ID
   * @returns Geometry reference
   */
  lineBetween(id: string, p1Id: string, p2Id: string): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [p1Id, p2Id],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const p1 = inputs.get(p1Id) as Point | undefined;
        const p2 = inputs.get(p2Id) as Point | undefined;
        if (!p1 || !p2) {
          throw new Error(`Cannot compute line ${id}: missing input points`);
        }
        return new Map([[id, line(p1.x, p1.y, p2.x, p2.y)]]);
      },
      draw: (svg, values, store, theme) => {
        const l = values.get(id);
        if (l && l.type === "line") {
          drawLine(svg, values, id, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "line");
    return id;
  }

  /**
   * Create a circle geometry
   * @param id - Unique identifier for this geometry
   * @param centerId - Center point geometry ID
   * @param radius - Circle radius
   * @returns Geometry reference
   */
  circle(id: string, centerId: string, radius: number | ((config: TConfig) => number)): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [centerId],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const center = inputs.get(centerId) as Point | undefined;
        const resolvedRadius = typeof radius === "function" ? (radius as Function)(config) : radius;
        if (!center) {
          throw new Error(`Cannot compute circle ${id}: missing center point ${centerId}`);
        }
        return new Map([[id, circle(center.x, center.y, resolvedRadius)]]);
      },
      draw: (svg, values, store, theme) => {
        const c = values.get(id);
        if (c && c.type === "circle") {
          drawCircle(svg, values, id, STROKE_WIDTH_THIN, store, theme);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "circle");
    return id;
  }

  /**
   * Create a point at a specific ratio along a line
   * @param id - Unique identifier for this geometry
   * @param lineId - Line geometry ID
   * @param ratio - Ratio along the line (0 = start, 1 = end)
   * @param paramName - Optional parameter name for the ratio in config
   * @returns Geometry reference
   */
  pointAt(id: string, lineId: string, ratio: number | ((config: TConfig) => number)): string {
    const stepId = this.nextId(`step_${id}`);
    const paramName = typeof ratio === "function" ? undefined : undefined;
    
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [lineId],
      outputs: [id],
      parameters: paramName ? [paramName as keyof TConfig] : [],
      compute: (inputs, config) => {
        const lineGeom = inputs.get(lineId) as Line | undefined;
        const resolvedRatio = typeof ratio === "function" ? (ratio as Function)(config) : ratio;
        if (!lineGeom) {
          throw new Error(`Cannot compute pointAt ${id}: missing line ${lineId}`);
        }
        const x = lineGeom.x1 + (lineGeom.x2 - lineGeom.x1) * resolvedRatio;
        const y = lineGeom.y1 + (lineGeom.y2 - lineGeom.y1) * resolvedRatio;
        return new Map([[id, point(x, y)]]);
      },
      draw: (svg, values, store, theme) => {
        const p = values.get(id);
        if (p && p.type === "point") {
          drawPoint(svg, values, id, POINT_RADIUS_MEDIUM, store, theme);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "point");
    return id;
  }

  /**
   * Find the intersection of a circle and a line
   * @param id - Unique identifier for this geometry
   * @param circleId - Circle geometry ID
   * @param lineId - Line geometry ID
   * @param direction - Which intersection point to select: "left", "right", "north", "south"
   * @param excludeId - Optional point ID to exclude from results
   * @returns Geometry reference
   */
  intersection(id: string, circleId: string, lineId: string, direction: "left" | "right" | "north" | "south", excludeId?: string): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [circleId, lineId],
      outputs: [id],
      parameters: ["tolerance" as keyof TConfig],
      compute: (inputs, config) => {
        const circleGeom = inputs.get(circleId) as Circle | undefined;
        const lineGeom = inputs.get(lineId) as Line | undefined;
        const excludePoint = excludeId ? inputs.get(excludeId) as Point | undefined : undefined;
        const tolerance = (config as any).tolerance ?? 0.001;
        
        if (!circleGeom || !lineGeom) {
          throw new Error(`Cannot compute intersection ${id}: missing circle or line`);
        }
        
        // Map direction to selection strategy
        let select: "north" | "south" | undefined;
        if (direction === "north" || direction === "south") {
          select = direction;
        }
        // For left/right, we'll use the default from pointFromCircleAndLine which returns first intersection
        // and rely on exclude to get the right one
        
        const result = pointFromCircleAndLine(circleGeom, lineGeom, {
          exclude: excludePoint,
          tolerance,
        });
        
        if (!result) {
          throw new Error(`Cannot compute intersection ${id}: no intersection found`);
        }
        
        return new Map([[id, result]]);
      },
      draw: (svg, values, store, theme) => {
        const p = values.get(id);
        if (p && p.type === "point") {
          drawPoint(svg, values, id, POINT_RADIUS_MEDIUM, store, theme);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "point");
    return id;
  }

  /**
   * Find the intersection of two circles
   * @param id - Unique identifier for this geometry
   * @param circle1Id - First circle geometry ID
   * @param circle2Id - Second circle geometry ID
   * @param direction - Which intersection point to select: "north" or "south"
   * @returns Geometry reference
   */
  circleIntersection(id: string, circle1Id: string, circle2Id: string, direction: "north" | "south" = "north"): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [circle1Id, circle2Id],
      outputs: [id],
      parameters: ["selectMinY" as keyof TConfig],
      compute: (inputs, config) => {
        const c1 = inputs.get(circle1Id) as Circle | undefined;
        const c2 = inputs.get(circle2Id) as Circle | undefined;
        
        if (!c1 || !c2) {
          throw new Error(`Cannot compute circleIntersection ${id}: missing circles`);
        }
        
        const select = direction === "north" ? "north" : "south";
        const result = pointFromCircles(c1, c2, { select });
        
        if (!result) {
          throw new Error(`Cannot compute circleIntersection ${id}: no intersection found`);
        }
        
        return new Map([[id, result]]);
      },
      draw: (svg, values, store, theme) => {
        const p = values.get(id);
        if (p && p.type === "point") {
          drawPoint(svg, values, id, POINT_RADIUS_MEDIUM, store, theme);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "point");
    return id;
  }

  /**
   * Create a line from a point towards another point with a specific length
   * @param id - Unique identifier for this geometry
   * @param fromId - Starting point geometry ID
   * @param towardsId - Direction point geometry ID
   * @param length - Length of the line (or parameter name in config)
   * @returns Geometry reference
   */
  lineTowards(id: string, fromId: string, towardsId: string, length: number | ((config: TConfig) => number)): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [fromId, towardsId],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const from = inputs.get(fromId) as Point | undefined;
        const towards = inputs.get(towardsId) as Point | undefined;
        const resolvedLength = typeof length === "function" ? (length as Function)(config) : length;
        
        if (!from || !towards) {
          throw new Error(`Cannot compute lineTowards ${id}: missing points`);
        }
        
        return new Map([[id, lineTowards(from, towards, resolvedLength)]]);
      },
      draw: (svg, values, store, theme) => {
        const l = values.get(id);
        if (l && l.type === "line") {
          drawLine(svg, values, id, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "line");
    return id;
  }

  /**
   * Create a polygon from point references
   * @param id - Unique identifier for this geometry
   * @param pointIds - Array of point geometry IDs in order
   * @returns Geometry reference
   */
  polygon(id: string, pointIds: string[]): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: pointIds,
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const points: { x: number; y: number }[] = [];
        for (const pid of pointIds) {
          const p = inputs.get(pid) as Point | undefined;
          if (!p) {
            throw new Error(`Cannot compute polygon ${id}: missing point ${pid}`);
          }
          points.push({ x: p.x, y: p.y });
        }
        return new Map([[id, polygon(points)]]);
      },
      draw: (svg, values, store, theme) => {
        const poly = values.get(id);
        if (poly && poly.type === "polygon") {
          drawPolygon(svg, values, id, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "polygon");
    return id;
  }

  /**
   * Create a coordinate system
   * @param id - Unique identifier for this geometry
   * @param x - X position
   * @param y - Y position
   * @param arrowLength - Length of the coordinate system arrows
   * @returns Geometry reference
   */
  coordinateSystem(id: string, x: number = 0, y: number = 0, arrowLength: number | ((config: TConfig) => number) = 100): string {
    const stepId = this.nextId(`step_${id}`);
    const step: Step<TConfig> = {
      id: stepId,
      inputs: [],
      outputs: [id],
      parameters: [],
      compute: (inputs, config) => {
        const resolvedArrowLength = typeof arrowLength === "function" ? (arrowLength as Function)(config) : arrowLength;
        return new Map([[id, coordinateSystem(x, y, resolvedArrowLength)]]);
      },
      draw: (svg, values, store, theme) => {
        const cs = values.get(id);
        if (cs && cs.type === "coordinate_system") {
          drawCoordinateSystem(svg, values, id, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
        }
      },
    };
    this.steps.set(id, step);
    this.geomTypes.set(id, "coordinate_system");
    return id;
  }

  /**
   * Convert all registered geometries to an ordered Step array
   * @returns Array of Step objects in dependency order
   */
  toSteps(): Step<TConfig>[] {
    // Get all step IDs and perform topological sort
    const stepList = Array.from(this.steps.values());
    
    // Simple topological sort using Kahn's algorithm
    const inDegree: Map<string, number> = new Map();
    const adj: Map<string, string[]> = new Map();
    
    // Initialize
    for (const step of stepList) {
      inDegree.set(step.id, 0);
      adj.set(step.id, []);
    }
    
    // Build adjacency list and in-degree counts
    for (const step of stepList) {
      for (const inputId of step.inputs) {
        // Find which step produces this input
        for (const s of stepList) {
          if (s.outputs.includes(inputId)) {
            adj.get(s.id)!.push(step.id);
            inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
            break;
          }
        }
      }
    }
    
    // Kahn's algorithm
    const queue: string[] = [];
    for (const [stepId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(stepId);
      }
    }
    
    const result: Step<TConfig>[] = [];
    while (queue.length > 0) {
      const stepId = queue.shift()!;
      const step = this.steps.get(stepId);
      if (step) {
        result.push(step);
      }
      
      for (const neighborId of adj.get(stepId) || []) {
        inDegree.set(neighborId, (inDegree.get(neighborId) || 0) - 1);
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      }
    }
    
    // Check for cycles
    if (result.length !== stepList.length) {
      throw new Error("Circular dependency detected in geometry construction");
    }
    
    return result;
  }

  /**
   * Get the number of registered geometries
   */
  get size(): number {
    return this.steps.size;
  }

  /**
   * Clear all registered geometries
   */
  clear(): void {
    this.steps.clear();
    this.geomTypes.clear();
    this.stepCounter = 0;
  }

  /**
   * Get a step by geometry ID
   * @param id - Geometry ID
   * @returns The Step object or undefined if not found
   */
  getStep(id: string): Step<TConfig> | undefined {
    return this.steps.get(id);
  }

  /**
   * Get the type of a geometry by ID
   * @param id - Geometry ID
   * @returns The geometry type or undefined if not found
   */
  getType(id: string): GeometryValue["type"] | undefined {
    return this.geomTypes.get(id);
  }
}

// Singleton instance for convenience
export const builder = new GeometryBuilder<any>();
