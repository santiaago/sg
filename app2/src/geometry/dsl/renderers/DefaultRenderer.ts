// Default renderer implementation for geometry DSL
// Uses existing draw functions from svgElements with standard styling

import type { GeometryRenderer } from "./types";
import type { GeometryValue, Theme } from "@/types/geometry";
import type { GeometryStore } from "@/react-store";
import { isPoint, isLine, isCircle, isPolygon, isCoordinateSystem } from "@/types/geometry";
import type { PolygonStyleOptions } from "../expressions/PolygonExpression";
import type { LineStyleOptions } from "../expressions/LineExpression";
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
 * Supports current step highlighting via currentStepId.
 */
export class DefaultGeometryRenderer implements GeometryRenderer {
  private currentStepId: string;
  readonly namespace: string;

  /**
   * Create a new DefaultGeometryRenderer.
   * @param namespace - The namespace for step ID generation (e.g., "square", "sixfold")
   * @param currentStepId - The ID of the current step to highlight (default: "")
   */
  constructor(namespace: string, currentStepId: string = "") {
    if (!namespace || namespace.trim() === "") {
      throw new Error(`DefaultGeometryRenderer: namespace must be a non-empty string, received: ${namespace}`);
    }
    this.namespace = namespace;
    this.currentStepId = currentStepId;
  }

  /**
   * Set the current step ID for highlighting.
   * @param stepId - The ID of the current step to highlight
   */
  setCurrentStepId(stepId: string): void {
    this.currentStepId = stepId;
  }

  /**
   * Get the current step ID being highlighted.
   */
  getCurrentStepId(): string {
    return this.currentStepId;
  }
  /**
   * Resolve stroke options from style options or defaults.
   */
  private resolveStrokeOptions(
    theme: Theme,
    options?: LineStyleOptions | PolygonStyleOptions,
  ): { strokeWidth: number; strokeColor: string } {
    return {
      strokeWidth: options?.strokeWidth ?? STROKE_WIDTH_THIN,
      strokeColor: options?.strokeColor
        ? typeof options.strokeColor === "function"
          ? options.strokeColor(theme)
          : options.strokeColor
        : theme.COLOR_PRIMARY,
    };
  }

  /**
   * Draw a point geometry using the configured point radius.
   * Validates that the geometry is a Point before drawing.
   * Applies current step highlight if stepId matches currentStepId.
   */
  drawPoint(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    stepId?: string,
  ): void {
    const p = values.get(geomId);
    if (!p) {
      throw new Error(`drawPoint: geometry '${geomId}' not found in values`);
    }
    if (!isPoint(p)) {
      throw new Error(`drawPoint: geometry '${geomId}' is ${p.type}, expected point`);
    }

    // Determine fill color based on current step highlighting
    const fillColor =
      stepId && stepId === this.currentStepId ? theme.COLOR_CURRENT_STEP : undefined;

    svgDrawPoint(svg, values, geomId, POINT_RADIUS_MEDIUM, store, theme, fillColor);
  }

  /**
   * Draw a line geometry using the configured stroke width and primary theme color.
   * Validates that the geometry is a Line before drawing.
   * Uses custom stroke width/color if provided in options.
   * Applies current step highlight if stepId matches currentStepId.
   */
  drawLine(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    options?: LineStyleOptions,
    stepId?: string,
  ): void {
    const l = values.get(geomId);
    if (!l) {
      throw new Error(`drawLine: geometry '${geomId}' not found in values`);
    }
    if (!isLine(l)) {
      throw new Error(`drawLine: geometry '${geomId}' is ${l.type}, expected line`);
    }

    const { strokeWidth, strokeColor: baseStrokeColor } = this.resolveStrokeOptions(theme, options);

    // Check if this line should be highlighted
    const shouldHighlight = stepId && stepId === this.currentStepId;
    const strokeColor = shouldHighlight ? theme.COLOR_CURRENT_STEP : baseStrokeColor;

    svgDrawLine(svg, values, geomId, strokeWidth, store, theme, strokeColor);
  }

  /**
   * Draw a circle geometry using the configured stroke width.
   * Validates that the geometry is a Circle before drawing.
   * Applies current step highlight if stepId matches currentStepId.
   */
  drawCircle(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    stepId?: string,
  ): void {
    const c = values.get(geomId);
    if (!c) {
      throw new Error(`drawCircle: geometry '${geomId}' not found in values`);
    }
    if (!isCircle(c)) {
      throw new Error(`drawCircle: geometry '${geomId}' is ${c.type}, expected circle`);
    }

    // Check if this circle should be highlighted
    const strokeColor =
      stepId && stepId === this.currentStepId ? theme.COLOR_CURRENT_STEP : undefined;

    svgDrawCircle(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, strokeColor);
  }

  /**
   * Draw a polygon geometry using the configured stroke width and primary theme color.
   * Validates that the geometry is a Polygon before drawing.
   * Applies current step highlight if stepId matches currentStepId.
   */
  drawPolygon(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    options?: PolygonStyleOptions,
    stepId?: string,
  ): void {
    const p = values.get(geomId);
    if (!p) {
      throw new Error(`drawPolygon: geometry '${geomId}' not found in values`);
    }
    if (!isPolygon(p)) {
      throw new Error(`drawPolygon: geometry '${geomId}' is ${p.type}, expected polygon`);
    }

    const { strokeWidth, strokeColor: baseStrokeColor } = this.resolveStrokeOptions(theme, options);

    // Check if this polygon should be highlighted
    const shouldHighlight = stepId && stepId === this.currentStepId;
    const strokeColor = shouldHighlight ? theme.COLOR_CURRENT_STEP : baseStrokeColor;

    svgDrawPolygon(svg, values, geomId, strokeWidth, store, theme, strokeColor);
  }

  /**
   * Draw a coordinate system using the configured stroke width and primary theme color.
   * Validates that the geometry is a CoordinateSystem before drawing.
   * Applies current step highlight if stepId matches currentStepId.
   */
  drawCoordinateSystem(
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    geomId: string,
    store: GeometryStore,
    theme: Theme,
    stepId?: string,
  ): void {
    const cs = values.get(geomId);
    if (!cs) {
      throw new Error(`drawCoordinateSystem: geometry '${geomId}' not found in values`);
    }
    if (!isCoordinateSystem(cs)) {
      throw new Error(
        `drawCoordinateSystem: geometry '${geomId}' is ${cs.type}, expected coordinate_system`,
      );
    }

    // Check if this coordinate system should be highlighted
    const shouldHighlight = stepId && stepId === this.currentStepId;
    const strokeColor = shouldHighlight ? theme.COLOR_CURRENT_STEP : theme.COLOR_PRIMARY;

    svgDrawCoordinateSystem(svg, values, geomId, STROKE_WIDTH_THIN, store, theme, strokeColor);
  }
}
