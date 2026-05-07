// Renderer interface for geometry DSL
// Separates draw logic from expression definitions using dependency injection

import type { GeometryValue, Theme } from "@/types/geometry";
import type { GeometryStore } from "@/react-store";

/**
 * Renderer interface for drawing geometry values.
 * Implemented separately from expressions to maintain separation of concerns:
 * - Expressions handle computation logic
 * - Renderers handle SVG rendering logic
 */
export interface GeometryRenderer {
  drawPoint: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawLine: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawCircle: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawPolygon: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;

  drawCoordinateSystem: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
  ) => void;
}
