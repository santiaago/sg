/**
 * svgRenderer.ts
 *
 * Rendering layer for geometry constructions.
 * Consumes GeometryValue types and renders them to SVG.
 *
 * Key principles:
 * - Pure rendering logic (NO geometry construction)
 * - Takes GeometryValue types from Construction or any source
 * - NO knowledge of Construction or Refs
 * - Knows about SVG, styles, tooltips, GeometryStore
 */

import type { Point, Line, Circle, Polygon, GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";

/**
 * Options for drawing a point.
 */
export interface DrawPointOptions {
  /** Stroke width (radius) for the point */
  stroke?: number;
  /** Optional name for the element (used for data-name attribute) */
  name?: string;
}

/**
 * Options for drawing a line.
 */
export interface DrawLineOptions {
  /** Stroke width for the line */
  stroke?: number;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing a circle.
 */
export interface DrawCircleOptions {
  /** Stroke width for the circle outline */
  stroke?: number;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing a polygon.
 */
export interface DrawPolygonOptions {
  /** Stroke width for the polygon outline */
  stroke?: number;
  /** Fill color for the polygon */
  fill?: string;
  /** Optional name for the element */
  name?: string;
}

/**
 * Options for drawing geometry (union of all specific options).
 */
export type DrawGeometryOptions =
  | DrawPointOptions
  | DrawLineOptions
  | DrawCircleOptions
  | DrawPolygonOptions;

/**
 * SvgRenderer class for rendering geometry to SVG.
 *
 * Features:
 * - Draws Point, Line, Circle, Polygon geometries
 * - Optional GeometryStore integration for tooltip management
 * - Step-by-step rendering support
 * - Configurable styling
 */
export class SvgRenderer {
  private _svg: SVGSVGElement;
  private _store?: GeometryStore;

  /**
   * Create a new SvgRenderer.
   * @param svg - The SVG element to render into
   * @param store - Optional GeometryStore for managing elements and tooltips
   */
  constructor(svg: SVGSVGElement, store?: GeometryStore) {
    this._svg = svg;
    this._store = store;
  }

  // ===== Individual Geometry Drawing Methods =====

  /**
   * Draw a point as a small circle.
   * @param point - The point to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawPoint(point: Point, options?: DrawPointOptions): SVGElement {
    const radius = options?.stroke ?? 2;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    el.setAttribute("cx", point.x.toString());
    el.setAttribute("cy", point.y.toString());
    el.setAttribute("r", radius.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("fill", "none");

    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }

    this._svg.appendChild(el);

    if (this._store && options?.name) {
      this._store.add(options.name, el, "circle", []);
    }

    return el;
  }

  /**
   * Draw a line segment.
   * @param line - The line to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawLine(line: Line, options?: DrawLineOptions): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");

    el.setAttribute("x1", line.x1.toString());
    el.setAttribute("y1", line.y1.toString());
    el.setAttribute("x2", line.x2.toString());
    el.setAttribute("y2", line.y2.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());

    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }

    this._svg.appendChild(el);

    if (this._store && options?.name) {
      this._store.add(options.name, el, "line", []);
    }

    return el;
  }

  /**
   * Draw a circle outline.
   * @param circle - The circle to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawCircle(circle: Circle, options?: DrawCircleOptions): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    el.setAttribute("cx", circle.cx.toString());
    el.setAttribute("cy", circle.cy.toString());
    el.setAttribute("r", circle.r.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());
    el.setAttribute("fill", "none");

    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }

    this._svg.appendChild(el);

    if (this._store && options?.name) {
      this._store.add(options.name, el, "circle", []);
    }

    return el;
  }

  /**
   * Draw a polygon.
   * @param polygon - The polygon to draw
   * @param options - Drawing options
   * @returns The created SVG element
   */
  drawPolygon(polygon: Polygon, options?: DrawPolygonOptions): SVGElement {
    const strokeWidth = options?.stroke ?? 0.5;
    const fill = options?.fill ?? "none";
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    const pointsStr = polygon.points.map((p) => `${p.x},${p.y}`).join(" ");
    el.setAttribute("points", pointsStr);
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", strokeWidth.toString());
    el.setAttribute("fill", fill);

    if (options?.name) {
      el.setAttribute("data-name", options.name);
    }

    this._svg.appendChild(el);

    if (this._store && options?.name) {
      this._store.add(options.name, el, "polygon", []);
    }

    return el;
  }

  // ===== Construction Drawing Methods =====

  /**
   * Draw all geometries from a Construction.
   * @param construction - The Construction to render (must have getValues() method)
   */
  drawConstruction(construction: { getValues: () => Map<string, GeometryValue> }): void {
    const values = construction.getValues();
    for (const [id, geom] of values) {
      this.drawGeometry(geom, { name: id });
    }
  }

  /**
   * Draw geometries from a Construction up to a specific step index.
   * @param construction - The Construction to render (must have getSteps() and getValues() methods)
   * @param stepIndex - The step index to render up to (0-based)
   */
  drawConstructionUpTo(
    construction: { getSteps: () => Array<{ id: string }>; getValues: () => Map<string, GeometryValue> },
    stepIndex: number,
  ): void {
    const values = construction.getValues();
    const steps = construction.getSteps().slice(0, stepIndex + 1);

    for (const step of steps) {
      const geom = values.get(step.id);
      if (geom) {
        this.drawGeometry(geom, { name: step.id });
      }
    }
  }

  /**
   * Clear all elements from the SVG.
   */
  clear(): void {
    while (this._svg.firstChild) {
      this._svg.removeChild(this._svg.firstChild);
    }
  }

  // ===== Private Helpers =====

  /**
   * Draw a geometry value based on its type.
   */
  private drawGeometry(geom: GeometryValue, options: DrawGeometryOptions): void {
    switch (geom.type) {
      case "point":
        this.drawPoint(geom, options as DrawPointOptions);
        break;
      case "line":
        this.drawLine(geom, options as DrawLineOptions);
        break;
      case "circle":
        this.drawCircle(geom, options as DrawCircleOptions);
        break;
      case "polygon":
        this.drawPolygon(geom, options as DrawPolygonOptions);
        break;
      default:
        console.warn(`SvgRenderer: unknown geometry type: ${(geom as any).type}`);
    }
  }
}

// Export all public types and classes
export { SvgRenderer };
export type {
  DrawPointOptions,
  DrawLineOptions,
  DrawCircleOptions,
  DrawPolygonOptions,
  DrawGeometryOptions,
};
