// Default renderer implementation for geometry DSL
// Uses existing draw functions from svgElements with standard styling

import type { GeometryRenderer } from "./types";
import type { GeometryValue, Theme } from "@/types/geometry";
import type { GeometryStore } from "@/react-store";
import { isPoint, isLine, isCircle, isPolygon, isCoordinateSystem } from "@/types/geometry";
import type { PolygonStyleOptions } from "../expressions/PolygonExpression";
import {
  drawPoint as svgDrawPoint,
  drawLine as svgDrawLine,
  drawCircle as svgDrawCircle,
  drawPolygon as svgDrawPolygon,
  drawCoordinateSystem as svgDrawCoordinateSystem,
} from "@/svgElements";
import { POINT_RADIUS_MEDIUM, STROKE_WIDTH_THIN } from "@/config/geometryConfig";

/**
 * Default geometry renderer using existing SVG draw functions.
 * Applies consistent styling (POINT_RADIUS_MEDIUM, STROKE_WIDTH_THIN)
 * and theme colors (COLOR_PRIMARY) for all geometry types.
 */
export class DefaultGeometryRenderer implements GeometryRenderer {
  /**
   * Draw a point geometry using the configured point radius.
   * Validates that the geometry is a Point before drawing.
   */
  drawPoint(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ): void {
    const p = values.get(geomId);
    if (!p || !isPoint(p)) return;
    svgDrawPoint(svg, values, geomId, POINT_RADIUS_MEDIUM, store, theme);
  }

  /**
   * Draw a line geometry using the configured stroke width and primary theme color.
   * Validates that the geometry is a Line before drawing.
   */
  drawLine(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ): void {
    const l = values.get(geomId);
    if (!l || !isLine(l)) return;
    svgDrawLine(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, theme.COLOR_PRIMARY);
  }

  /**
   * Draw a circle geometry using the configured stroke width.
   * Validates that the geometry is a Circle before drawing.
   */
  drawCircle(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ): void {
    const c = values.get(geomId);
    if (!c || !isCircle(c)) return;
    svgDrawCircle(svg, values, geomId, STROKE_WIDTH_THIN, store, theme);
  }

  /**
   * Draw a polygon geometry using the configured stroke width and primary theme color.
   * Validates that the geometry is a Polygon before drawing.
   */
  drawPolygon(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    options?: PolygonStyleOptions,
  ): void {
    const p = values.get(geomId);
    if (!p || !isPolygon(p)) return;

    // Use custom stroke width/color if provided, otherwise use defaults
    const strokeWidth = options?.strokeWidth ?? STROKE_WIDTH_THIN;
    const strokeColor = options?.strokeColor
      ? typeof options.strokeColor === "function"
        ? options.strokeColor(theme)
        : options.strokeColor
      : theme.COLOR_PRIMARY;

    svgDrawPolygon(svg, values, geomId, strokeWidth, store, theme, strokeColor);
  }

  /**
   * Draw a coordinate system using the configured stroke width and primary theme color.
   * Validates that the geometry is a CoordinateSystem before drawing.
   */
  drawCoordinateSystem(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ): void {
    const cs = values.get(geomId);
    if (!cs || !isCoordinateSystem(cs)) return;
    svgDrawCoordinateSystem(
      svg,
      values,
      geomId,
      STROKE_WIDTH_THIN,
      store,
      theme,
      theme.COLOR_PRIMARY,
    );
  }
}
