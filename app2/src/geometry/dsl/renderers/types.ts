// Renderer interface for geometry DSL
// Separates draw logic from expression definitions using dependency injection

import type { GeometryValue, Theme } from "@/types/geometry";
import type { GeometryStore } from "@/react-store";
import type { PolygonStyleOptions } from "../expressions/PolygonExpression";

/**
 * Renderer interface for drawing geometry values.
 * Implemented separately from expressions to maintain separation of concerns:
 * - Expressions handle computation logic
 * - Renderers handle SVG rendering logic
 */
export interface GeometryRenderer {
  /**
   * Draw a point geometry.
   * @param svg - The SVG element to draw into
   * @param values - Map of all geometry values
   * @param geomId - The ID of the geometry to draw
   * @param store - The geometry store for tracking
   * @param theme - The theme for styling
   */
  drawPoint: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  /**
   * Draw a line geometry.
   * @param svg - The SVG element to draw into
   * @param values - Map of all geometry values
   * @param geomId - The ID of the geometry to draw
   * @param store - The geometry store for tracking
   * @param theme - The theme for styling
   */
  drawLine: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  /**
   * Draw a circle geometry.
   * @param svg - The SVG element to draw into
   * @param values - Map of all geometry values
   * @param geomId - The ID of the geometry to draw
   * @param store - The geometry store for tracking
   * @param theme - The theme for styling
   */
  drawCircle: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  /**
   * Draw a polygon geometry.
   * @param svg - The SVG element to draw into
   * @param values - Map of all geometry values
   * @param geomId - The ID of the geometry to draw
   * @param store - The geometry store for tracking
   * @param theme - The theme for styling
   * @param options - Optional style options (strokeWidth, strokeColor)
   */
  drawPolygon: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    options?: PolygonStyleOptions,
  ) => void;

  /**
   * Draw a coordinate system geometry.
   * @param svg - The SVG element to draw into
   * @param values - Map of all geometry values
   * @param geomId - The ID of the geometry to draw
   * @param store - The geometry store for tracking
   * @param theme - The theme for styling
   */
  drawCoordinateSystem: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;
}
