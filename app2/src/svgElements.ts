import type { GeometryStore } from "./react-store";

// Magic number constants for tooltip styling
export const TOOLTIP_OFFSET_X = 10;
export const TOOLTIP_OFFSET_Y = -5;
export const TOOLTIP_BG_HEIGHT = 16;
export const TOOLTIP_FONT_SIZE = 10;
export const TOOLTIP_TEXT_WIDTH_PER_CHAR = 8;
export const TOOLTIP_BG_ROUNDING = 2;
export const DEFAULT_STROKE_WIDTH = 5;

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
}

/**
 * Create tooltip elements (text + background rect) for an SVG element
 */
export function createTooltip(
  svg: SVGSVGElement,
  x: number,
  y: number,
  name: string,
  bgYOffset: number = 15,
): { tooltip: SVGTextElement; tooltipBg: SVGRectElement } {
  // Create tooltip element
  const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tooltip.setAttribute("x", x.toString());
  tooltip.setAttribute("y", (y + TOOLTIP_OFFSET_Y).toString());
  tooltip.setAttribute("fill", "white");
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
  tooltipBg.setAttribute("fill", "black");
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
export function rect(svg: SVGSVGElement, width: number, height: number): SVGRectElement {
  const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rectEl.setAttribute("width", width.toString());
  rectEl.setAttribute("height", height.toString());
  rectEl.setAttribute("fill", "#fff");
  svg.appendChild(rectEl);
  return rectEl;
}

/**
 * Draw a dot (circle) SVG element
 */
export function dot(svg: SVGSVGElement, x: number, y: number, radius: number): SVGCircleElement {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("class", "dot");
  circle.setAttribute("cx", x.toString());
  circle.setAttribute("cy", y.toString());
  circle.setAttribute("r", radius.toString());
  circle.setAttribute("fill", "black");
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
): SVGLineElement {
  const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineEl.setAttribute("stroke", "#506");
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
  stroke: number = 1,
): SVGCircleElement {
  const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleEl.setAttribute("stroke", "#f06");
  circleEl.setAttribute("stroke-width", stroke.toString());
  circleEl.setAttribute("fill", "none");
  circleEl.setAttribute("cx", cx.toString());
  circleEl.setAttribute("cy", cy.toString());
  circleEl.setAttribute("r", r.toString());
  svg.appendChild(circleEl);
  return circleEl;
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
  store?: GeometryStore,
): SVGCircleElement {
  const dotElement = dot(svg, x, y, radius);
  dotElement.setAttribute("data-tooltip", name);
  dotElement.style.cursor = "pointer";

  // Create tooltip element (positioned near the dot)
  const tooltipX = x + TOOLTIP_OFFSET_X;
  const tooltipY = y;
  const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

  // Store both tooltip and background
  dotElement.tooltip = tooltip;
  dotElement.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, dotElement, "point");
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
  strokeWidth: number = DEFAULT_STROKE_WIDTH,
  store?: GeometryStore,
): SVGLineElement {
  const lineEl = line(svg, x1, y1, x2, y2, strokeWidth);
  lineEl.style.cursor = "pointer";

  // Create tooltip element (positioned at midpoint)
  const midpointX = (x1 + x2) / 2;
  const midpointY = (y1 + y2) / 2;
  const { tooltip, tooltipBg } = createTooltip(svg, midpointX, midpointY, name, 15);

  // Store both tooltip and background
  lineEl.tooltip = tooltip;
  lineEl.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, lineEl, "line");
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
  stroke: number = 1,
  store?: GeometryStore,
): SVGCircleElement {
  const circleEl = circle(svg, cx, cy, r, stroke);
  circleEl.style.cursor = "pointer";

  // Create tooltip element (positioned to the right of the circle)
  const tooltipX = cx + r + TOOLTIP_OFFSET_X;
  const tooltipY = cy;
  const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

  // Store both tooltip and background
  circleEl.tooltip = tooltip;
  circleEl.tooltipBg = tooltipBg;

  if (store) {
    store.add(name, circleEl, "circle");
  }

  return circleEl;
}
