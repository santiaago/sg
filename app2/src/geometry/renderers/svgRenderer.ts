// SVG Renderer for Construction geometry.
// Separate rendering layer that consumes Construction output.
// NO geometry construction logic - only drawing.

import type { Point, Line, Circle, Polygon, GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";

/**
 * Options for drawing geometry elements.
 */
export interface DrawOptions {
  stroke?: number; // Stroke width
  name?: string; // Element name for data attributes
  fill?: string; // Fill color (for polygons)
}

/**
 * SvgRenderer - Pure rendering layer for geometry construction.
 * 
 * Features:
 * - Takes GeometryValue types from Construction
 * - NO geometry construction logic
 * - NO knowledge of Construction or Refs
 * - Knows about SVG, styles, tooltips
 * - Integrates with GeometryStore for element tracking
 */
export class SvgRenderer {
  constructor(
    private svg: SVGSVGElement,
    private store?: GeometryStore,
  ) {}

  // ==========================================================================
  // Individual Geometry Draw Methods
  // ==========================================================================

  /**
   * Draw a point on the SVG.
   * @param point - Point geometry to draw
   * @param options - Drawing options (stroke width, name)
   * @returns The created SVG element
   */
  drawPoint(point: Point, options?: DrawOptions): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", point.x.toString());
    el.setAttribute("cy", point.y.toString());
    el.setAttribute("r", (options?.stroke || 2).toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("fill", "none");
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    
    if (this.store) {
      this.store.add(options?.name || "point", el, "circle", []);
    }
    return el;
  }

  /**
   * Draw a line on the SVG.
   * @param line - Line geometry to draw
   * @param options - Drawing options (stroke width, name)
   * @returns The created SVG element
   */
  drawLine(line: Line, options?: DrawOptions): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", line.x1.toString());
    el.setAttribute("y1", line.y1.toString());
    el.setAttribute("x2", line.x2.toString());
    el.setAttribute("y2", line.y2.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    
    if (this.store) {
      this.store.add(options?.name || "line", el, "line", []);
    }
    return el;
  }

  /**
   * Draw a circle on the SVG.
   * @param circle - Circle geometry to draw
   * @param options - Drawing options (stroke width, name)
   * @returns The created SVG element
   */
  drawCircle(circle: Circle, options?: DrawOptions): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", circle.cx.toString());
    el.setAttribute("cy", circle.cy.toString());
    el.setAttribute("r", circle.r.toString());
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    el.setAttribute("fill", "none");
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    
    if (this.store) {
      this.store.add(options?.name || "circle", el, "circle", []);
    }
    return el;
  }

  /**
   * Draw a polygon on the SVG.
   * @param polygon - Polygon geometry to draw
   * @param options - Drawing options (stroke width, fill, name)
   * @returns The created SVG element
   */
  drawPolygon(
    polygon: Polygon,
    options?: DrawOptions,
  ): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const pointsStr = polygon.points.map((p) => `${p.x},${p.y}`).join(" ");
    el.setAttribute("points", pointsStr);
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", (options?.stroke || 0.5).toString());
    if (options?.fill) {
      el.setAttribute("fill", options.fill);
    } else {
      el.setAttribute("fill", "none");
    }
    if (options?.name) el.setAttribute("data-name", options.name);
    this.svg.appendChild(el);
    
    if (this.store) {
      this.store.add(options?.name || "polygon", el, "polygon", []);
    }
    return el;
  }

  // ==========================================================================
  // Construction Draw Methods
  // ==========================================================================

  /**
   * Draw an individual geometry value.
   * @param geom - Geometry value to draw
   * @param options - Drawing options
   */
  private drawGeometry(geom: GeometryValue, options: DrawOptions): void {
    switch (geom.type) {
      case "point":
        this.drawPoint(geom, options);
        break;
      case "line":
        this.drawLine(geom, options);
        break;
      case "circle":
        this.drawCircle(geom, options);
        break;
      case "polygon":
        this.drawPolygon(geom, options);
        break;
      // Ignore other types like coordinate_system
    }
  }

  /**
   * Draw all geometries from a Construction.
   * @param construction - The Construction instance or any object with getSteps and getValues
   */
  drawConstruction(construction: { getSteps(): Array<{ id: string }>; getValues(): Map<string, GeometryValue> }): void {
    const steps = construction.getSteps();
    const values = construction.getValues();
    
    for (const step of steps) {
      const value = values.get(step.id);
      if (value) {
        this.drawGeometry(value, { name: step.id });
      }
    }
  }

  /**
   * Draw geometries from a Construction up to a specific step index.
   * @param construction - The Construction instance or any object with getSteps and getValues
   * @param stepIndex - The maximum step index to draw (0-based)
   */
  drawConstructionUpTo(
    construction: { getSteps(): Array<{ id: string }>; getValues(): Map<string, GeometryValue> },
    stepIndex: number,
  ): void {
    const allSteps = construction.getSteps();
    const steps = allSteps.slice(0, stepIndex + 1);
    const values = construction.getValues();
    
    for (const step of steps) {
      const value = values.get(step.id);
      if (value) {
        this.drawGeometry(value, { name: step.id });
      }
    }
  }

  // ==========================================================================
  // SVG Management
  // ==========================================================================

  /**
   * Clear all elements from the SVG.
   */
  clear(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }

  /**
   * Get the SVG element this renderer is attached to.
   */
  getSvg(): SVGSVGElement {
    return this.svg;
  }

  /**
   * Set the SVG element this renderer should draw to.
   * @param svg - New SVG element
   */
  setSvg(svg: SVGSVGElement): void {
    this.svg = svg;
  }

  /**
   * Set the GeometryStore for this renderer.
   * @param store - GeometryStore to use for tracking elements
   */
  setStore(store: GeometryStore): void {
    this.store = store;
  }
}

// ============================================================================
// Tooltip Support
// ============================================================================

/**
 * Create a tooltip element for geometry elements.
 * @param svg - SVG container
 * @param x - X position for tooltip
 * @param y - Y position for tooltip
 * @param text - Tooltip text
 * @param offset - Offset from cursor
 * @returns Object containing tooltip and background elements
 */
export function createTooltip(
  svg: SVGSVGElement,
  x: number,
  y: number,
  text: string,
  offset: number = 15,
): { tooltip: SVGTextElement; tooltipBg: SVGRectElement } {
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tooltip.setAttribute("x", (x + offset).toString());
  tooltip.setAttribute("y", (y - 5).toString());
  tooltip.setAttribute("font-size", "12");
  tooltip.setAttribute("fill", "white");
  tooltip.setAttribute("pointer-events", "none");
  tooltip.textContent = text;

  // Create background rectangle
  const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const padding = 4;
  const width = text.length * 7 + padding * 2;
  const height = 16;
  tooltipBg.setAttribute("x", (x + offset - padding).toString());
  tooltipBg.setAttribute("y", (y - height - 2).toString());
  tooltipBg.setAttribute("width", width.toString());
  tooltipBg.setAttribute("height", height.toString());
  tooltipBg.setAttribute("fill", "#333");
  tooltipBg.setAttribute("rx", "2");
  tooltipBg.setAttribute("ry", "2");
  tooltipBg.setAttribute("pointer-events", "none");

  svg.appendChild(tooltipBg);
  svg.appendChild(tooltip);

  return { tooltip, tooltipBg };
}
