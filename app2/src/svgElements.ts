import type { GeometryStore } from "./react-store";
import type { GeometryValue } from "./types/geometry";
import { isPoint, isLine, isCircle, isCoordinateSystem } from "./types/geometry";
import type { Theme } from "./themes";

// Tooltip Positioning Strategy:
// - Points (dots): Tooltip positioned to the right at (x + 10, y)
// - Lines: Tooltip positioned at the midpoint ((x1+x2)/2, (y1+y2)/2)
// - Circles: Tooltip positioned to the right of the circle at (cx + r + 10, cy)
// - Polygons: Tooltip positioned near first vertex at (points[0].x + 15, points[0].y)
// All tooltips have their background positioned above the text (y - 15) for visibility.

/** Tooltip X offset from geometry position */
export const TOOLTIP_OFFSET_X = 10;
/** Tooltip Y offset from geometry position */
export const TOOLTIP_OFFSET_Y = -5;
/** Tooltip background height */
export const TOOLTIP_BG_HEIGHT = 16;
/** Tooltip font size */
export const TOOLTIP_FONT_SIZE = 10;
/** Estimated width per character for tooltip text sizing */
export const TOOLTIP_TEXT_WIDTH_PER_CHAR = 8;
/** Tooltip background corner rounding radius */
export const TOOLTIP_BG_ROUNDING = 2;
/** Default stroke width for geometry elements */
export const DEFAULT_STROKE_WIDTH = 5;

// Arrowhead marker constants
const ARROWHEAD_MARKER_WIDTH = 10;
const ARROWHEAD_MARKER_HEIGHT = 7;
const ARROWHEAD_REF_X = 9;
const ARROWHEAD_REF_Y = 3.5;

// Extend SVG element types to include custom tooltip properties
declare global {
  interface SVGCircleElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGLineElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGGElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
}

/**
 * Create tooltip elements (text + background rect) for an SVG element
 */
export function createTooltip(
  svg: SVGSVGElement,
  x: number,
  y: number,
  name: string,
  bgYOffset: number,
  theme: Theme,
): { tooltip: SVGTextElement; tooltipBg: SVGRectElement } {
  // Create tooltip element
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tooltip.setAttribute("x", x.toString());
  tooltip.setAttribute("y", (y + TOOLTIP_OFFSET_Y).toString());
  tooltip.setAttribute("fill", theme.COLOR_TOOLTIP_TEXT);
  tooltip.setAttribute("font-size", TOOLTIP_FONT_SIZE.toString());
  tooltip.setAttribute("opacity", "0");
  tooltip.setAttribute("data-tooltip-text", name);
  tooltip.setAttribute("text-anchor", "middle");
  tooltip.setAttribute("dominant-baseline", "middle");
  tooltip.textContent = name;

  // Create background rectangle for better visibility
  const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const textWidth = name.length * TOOLTIP_TEXT_WIDTH_PER_CHAR;
  const bgX = x - textWidth / 2;
  tooltipBg.setAttribute("x", bgX.toString());
  tooltipBg.setAttribute("y", (y - bgYOffset).toString());
  tooltipBg.setAttribute("width", textWidth.toString());
  tooltipBg.setAttribute("height", TOOLTIP_BG_HEIGHT.toString());
  tooltipBg.setAttribute("fill", theme.COLOR_TOOLTIP_BACKGROUND);
  tooltipBg.setAttribute("data-original-fill", theme.COLOR_TOOLTIP_BACKGROUND);
  tooltipBg.setAttribute("opacity", "0");
  tooltipBg.setAttribute("rx", TOOLTIP_BG_ROUNDING.toString());
  svg.appendChild(tooltipBg);

  // Add both elements to SVG
  svg.appendChild(tooltip);

  return { tooltip, tooltipBg };
}

/**
 * Draw a rectangle SVG element
 */
export function rect(
  svg: SVGSVGElement,
  width: number,
  height: number,
  theme: Theme,
): SVGRectElement {
  const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rectEl.setAttribute("width", width.toString());
  rectEl.setAttribute("height", height.toString());
  rectEl.setAttribute("fill", theme.COLOR_CANVAS);
  rectEl.setAttribute("data-background", "true");
  svg.appendChild(rectEl);
  return rectEl;
}

/**
 * Clears all geometry elements from SVG while preserving the background rectangle and coordinate system.
 * Used to avoid recreating the background on every step change.
 */
export function clearGeometryFromSvg(svg: SVGSVGElement): void {
  const children = Array.from(svg.children);
  for (const child of children) {
    if (
      child.getAttribute("data-background") !== "true" &&
      child.getAttribute("data-coordinate-system") !== "true"
    ) {
      svg.removeChild(child);
    }
  }
}

/**
 * Draw a dot (circle) SVG element
 */
export function dot(
  svg: SVGSVGElement,
  x: number,
  y: number,
  radius: number,
  theme: Theme,
): SVGCircleElement {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("class", "dot");
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", radius.toString());
  circle.setAttribute("fill", theme.COLOR_DOT);
  circle.setAttribute("opacity", "1");
  svg.appendChild(circle);
  return circle;
}

/**
 * Draw a line SVG element
 */
export function line(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number = DEFAULT_STROKE_WIDTH,
  strokeColor: string,
): SVGLineElement {
  const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineEl.setAttribute("stroke", strokeColor);
  lineEl.setAttribute("stroke-width", strokeWidth.toString());
  lineEl.setAttribute("x1", x1.toString());
  lineEl.setAttribute("y1", y1.toString());
  lineEl.setAttribute("x2", x2.toString());
  lineEl.setAttribute("y2", y2.toString());
  svg.appendChild(lineEl);
  return lineEl;
}

/**
 * Draw a circle SVG element with stroke
 */
export function circle(
  svg: SVGSVGElement,
  cx: number,
  cy: number,
  r: number,
  strokeWidth: number = 1,
  theme: Theme,
): SVGCircleElement {
  const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleEl.setAttribute("stroke", theme.COLOR_SECONDARY);
  circleEl.setAttribute("stroke-width", strokeWidth.toString());
  circleEl.setAttribute("fill", "none");
  circleEl.setAttribute("cx", cx.toString());
  circleEl.setAttribute("cy", cy.toString());
  circleEl.setAttribute("r", r.toString());
  svg.appendChild(circleEl);
  return circleEl;
}

/**
 * Ensure arrowhead marker definition exists in SVG
 * Creates a reusable arrowhead marker for coordinate system arrows
 */
function ensureArrowheadMarker(svg: SVGSVGElement, strokeColor: string): void {
  let arrowhead = svg.querySelector("#arrowhead-cs");
  if (!arrowhead) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowhead.setAttribute("id", "arrowhead-cs");
    arrowhead.setAttribute("markerWidth", ARROWHEAD_MARKER_WIDTH.toString());
    arrowhead.setAttribute("markerHeight", ARROWHEAD_MARKER_HEIGHT.toString());
    arrowhead.setAttribute("refX", ARROWHEAD_REF_X.toString());
    arrowhead.setAttribute("refY", ARROWHEAD_REF_Y.toString());
    arrowhead.setAttribute("orient", "auto");
    const arrowPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrowPolygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    arrowPolygon.setAttribute("fill", strokeColor);
    arrowhead.appendChild(arrowPolygon);
    defs.appendChild(arrowhead);
    svg.insertBefore(defs, svg.firstChild);
  } else {
    // Update existing marker's color to match current strokeColor
    const arrowPolygon = arrowhead.querySelector("polygon");
    if (arrowPolygon) {
      arrowPolygon.setAttribute("fill", strokeColor);
    }
  }
}

/**
 * Draw a coordinate system with X and Y arrows
 * @param svg - The SVG element to draw into
 * @param x - X coordinate of the origin
 * @param y - Y coordinate of the origin
 * @param arrowLength - Length of the arrows
 * @param strokeWidth - Width of the arrow lines
 * @param strokeColor - Color of the arrow lines
 * @returns SVG group element containing the coordinate system
 */
export function coordinateSystemArrows(
  svg: SVGSVGElement,
  x: number,
  y: number,
  arrowLength: number,
  strokeWidth: number,
  strokeColor: string,
): SVGGElement {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("data-coordinate-system", "true");

  // Ensure arrowhead marker exists
  ensureArrowheadMarker(svg, strokeColor);

  // Draw X axis arrow (pointing right/east - positive X direction)
  const xArrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xArrow.setAttribute("x1", x.toString());
  xArrow.setAttribute("y1", y.toString());
  xArrow.setAttribute("x2", (x + arrowLength).toString());
  xArrow.setAttribute("y2", y.toString());
  xArrow.setAttribute("stroke", strokeColor);
  xArrow.setAttribute("stroke-width", strokeWidth.toString());
  xArrow.setAttribute("marker-end", "url(#arrowhead-cs)");
  xArrow.setAttribute("data-cs-arrow", "true");
  group.appendChild(xArrow);

  // Draw Y axis arrow (pointing down/south - positive Y direction in SVG)
  const yArrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yArrow.setAttribute("x1", x.toString());
  yArrow.setAttribute("y1", y.toString());
  yArrow.setAttribute("x2", x.toString());
  yArrow.setAttribute("y2", (y + arrowLength).toString());
  yArrow.setAttribute("stroke", strokeColor);
  yArrow.setAttribute("stroke-width", strokeWidth.toString());
  yArrow.setAttribute("marker-end", "url(#arrowhead-cs)");
  yArrow.setAttribute("data-cs-arrow", "true");
  group.appendChild(yArrow);

  svg.appendChild(group);
  return group;
}

// ========================================
// Draw Helper Functions for Step Definitions
// ========================================
// These helpers reduce boilerplate in step.draw functions by:
// 1. Retrieving geometry from the values Map
// 2. Type checking the geometry
// 3. Calling the appropriate draw function with tooltip

/**
 * Draw a point geometry with tooltip.
 * @param svg - The SVG element to draw into
 * @param values - Map of all geometry values
 * @param geomId - The geometry ID to draw
 * @param radius - The radius of the dot
 * @param store - Optional store for managing SVG elements
 * @param theme - Theme to use for colors
 */
export function drawPoint(
  svg: SVGSVGElement,
  values: Map<string, GeometryValue>,
  geomId: string,
  radius: number,
  store: GeometryStore,
  theme: Theme,
): void {
  const p = values.get(geomId);
  if (!p || !isPoint(p)) return;
  dotWithTooltip(svg, p.x, p.y, geomId, radius, store, theme);
}

/**
 * Draw a line geometry with tooltip.
 * @param svg - The SVG element to draw into
 * @param values - Map of all geometry values
 * @param geomId - The geometry ID to draw
 * @param strokeWidth - The width of the line stroke
 * @param store - Optional store for managing SVG elements
 * @param theme - Theme to use for colors
 * @param strokeColor - Stroke color to use for the line
 */
export function drawLine(
  svg: SVGSVGElement,
  values: Map<string, GeometryValue>,
  geomId: string,
  strokeWidth: number,
  store: GeometryStore,
  theme: Theme,
  strokeColor: string,
): void {
  const l = values.get(geomId);
  if (!l || !isLine(l)) return;
  lineWithTooltip(svg, l.x1, l.y1, l.x2, l.y2, geomId, strokeWidth, store, theme, strokeColor);
}

/**
 * Draw a circle geometry with tooltip.
 * @param svg - The SVG element to draw into
 * @param values - Map of all geometry values
 * @param geomId - The geometry ID to draw
 * @param strokeWidth - The width of the circle stroke
 * @param store - Optional store for managing SVG elements
 * @param theme - Theme to use for colors
 */
export function drawCircle(
  svg: SVGSVGElement,
  values: Map<string, GeometryValue>,
  geomId: string,
  strokeWidth: number,
  store: GeometryStore,
  theme: Theme,
): void {
  const c = values.get(geomId);
  if (!c || !isCircle(c)) return;
  circleWithTooltip(svg, c.cx, c.cy, c.r, geomId, strokeWidth, store, theme);
}

/**
 * Draw a dot with tooltip support
 */
export function dotWithTooltip(
  svg: SVGSVGElement,
  x: number,
  y: number,
  name: string,
  radius: number,
  store: GeometryStore,
  theme: Theme,
): SVGCircleElement {
  const dotElement = dot(svg, x, y, radius, theme);
  dotElement.setAttribute("data-tooltip", name);
  dotElement.style.cursor = "pointer";

  // Create tooltip element (positioned near the dot)
  const tooltipX = x + TOOLTIP_OFFSET_X;
  const tooltipY = y;
  const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15, theme);

  // Store both tooltip and background
  dotElement.tooltip = tooltip;
  dotElement.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, dotElement, "point", []);
  }

  return dotElement;
}

/**
 * Draw a line with tooltip support
 */
export function lineWithTooltip(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  name: string,
  strokeWidth: number,
  store: GeometryStore,
  theme: Theme,
  strokeColor: string,
): SVGLineElement {
  const lineEl = line(svg, x1, y1, x2, y2, strokeWidth, strokeColor);
  lineEl.style.cursor = "pointer";

  // Create tooltip element (positioned at midpoint)
  const midpointX = (x1 + x2) / 2;
  const midpointY = (y1 + y2) / 2;
  const { tooltip, tooltipBg } = createTooltip(svg, midpointX, midpointY, name, 15, theme);

  // Store both tooltip and background
  lineEl.tooltip = tooltip;
  lineEl.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, lineEl, "line", []);
  }

  return lineEl;
}

/**
 * Draw a circle with tooltip support
 */
export function circleWithTooltip(
  svg: SVGSVGElement,
  cx: number,
  cy: number,
  r: number,
  name: string,
  strokeWidth: number,
  store: GeometryStore,
  theme: Theme,
): SVGCircleElement {
  const circleEl = circle(svg, cx, cy, r, strokeWidth, theme);
  circleEl.style.cursor = "pointer";

  // Create tooltip element (positioned to the right of the circle)
  const tooltipX = cx + r + TOOLTIP_OFFSET_X;
  const tooltipY = cy;
  const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15, theme);

  // Store both tooltip and background
  circleEl.tooltip = tooltip;
  circleEl.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, circleEl, "circle", []);
  }

  return circleEl;
}

/**
 * Draw a coordinate system with tooltip support
 */
export function drawCoordinateSystem(
  svg: SVGSVGElement,
  values: Map<string, GeometryValue>,
  geomId: string,
  strokeWidth: number,
  store: GeometryStore,
  theme: Theme,
  strokeColor: string,
): void {
  const cs = values.get(geomId);
  if (!cs || !isCoordinateSystem(cs)) return;

  // Remove existing coordinate system if present to prevent duplicates
  const existingCs = svg.querySelector("[data-coordinate-system]");
  if (existingCs) {
    svg.removeChild(existingCs);
  }

  const group = coordinateSystemArrows(svg, cs.x, cs.y, cs.arrowLength, strokeWidth, strokeColor);

  // Add tooltip to the group
  group.style.cursor = "pointer";
  const tooltipX = cs.x + cs.arrowLength + TOOLTIP_OFFSET_X;
  const tooltipY = cs.y;
  const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, geomId, 15, theme);

  // Store tooltip references on the group
  group.tooltip = tooltip;
  group.tooltipBg = tooltipBg;

  if (store) {
    store.add(geomId, group, "coordinate_system", []);
  }
}
