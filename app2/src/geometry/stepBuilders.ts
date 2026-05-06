// Step builder functions for geometry step system.
// Provides factory functions to reduce boilerplate in step definitions.

import type { Step, GeometryValue } from "../types/geometry";
import type { Theme } from "../themes";
import { isPoint, isLine, isCircle, isPolygon, isCoordinateSystem } from "../types/geometry";
import { drawPoint, drawLine, drawCircle, drawPolygon, drawCoordinateSystem } from "../svgElements";
import { computeSingle } from "./operations";
import { POINT_RADIUS_MEDIUM, STROKE_WIDTH_THIN } from "../config/geometryConfig";

/** Configuration for creating a step */
export interface StepBuilderConfig<TConfig> {
  id: string;
  inputs: string[];
  outputs: string[];
  parameters?: (keyof TConfig)[];
}

/** Validates that a step configuration has at least one output. */
function validateConfig<TConfig>(config: StepBuilderConfig<TConfig>): void {
  if (config.outputs.length === 0) {
    throw new Error(`Step ${config.id}: outputs array must not be empty`);
  }
}

/**
 * Create a point step with standardized compute and draw functions.
 * @param config - Step configuration
 * @param computeFn - Function to compute the point value
 * @returns A complete Step object
 */
export function createPointStep<TConfig>(
  config: StepBuilderConfig<TConfig>,
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => GeometryValue,
): Step<TConfig> {
  validateConfig(config);
  return {
    ...config,
    compute: computeSingle(config.outputs[0], (inputs, cfg) => computeFn(inputs, cfg)),
    draw: (svg, values, store, theme) => {
      const p = values.get(config.outputs[0]);
      if (!p || !isPoint(p)) return;
      drawPoint(svg, values, config.outputs[0], POINT_RADIUS_MEDIUM, store, theme);
    },
  };
}

/**
 * Create a line step with standardized compute and draw functions.
 * @param config - Step configuration
 * @param computeFn - Function to compute the line value
 * @param strokeColor - Optional function to determine stroke color from theme
 * @returns A complete Step object
 */
export function createLineStep<TConfig>(
  config: StepBuilderConfig<TConfig>,
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => GeometryValue,
  strokeColor?: (theme: Theme) => string,
): Step<TConfig> {
  validateConfig(config);
  return {
    ...config,
    compute: computeSingle(config.outputs[0], (inputs, cfg) => computeFn(inputs, cfg)),
    draw: (svg, values, store, theme) => {
      const l = values.get(config.outputs[0]);
      if (!l || !isLine(l)) return;
      drawLine(
        svg,
        values,
        config.outputs[0],
        STROKE_WIDTH_THIN,
        store,
        theme,
        strokeColor?.(theme) ?? theme.COLOR_PRIMARY,
      );
    },
  };
}

/**
 * Create a circle step with standardized compute and draw functions.
 * @param config - Step configuration
 * @param computeFn - Function to compute the circle value
 * @returns A complete Step object
 */
export function createCircleStep<TConfig>(
  config: StepBuilderConfig<TConfig>,
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => GeometryValue,
): Step<TConfig> {
  validateConfig(config);
  return {
    ...config,
    compute: computeSingle(config.outputs[0], (inputs, cfg) => computeFn(inputs, cfg)),
    draw: (svg, values, store, theme) => {
      const c = values.get(config.outputs[0]);
      if (!c || !isCircle(c)) return;
      drawCircle(svg, values, config.outputs[0], STROKE_WIDTH_THIN, store, theme);
    },
  };
}

/**
 * Create a polygon step with standardized compute and draw functions.
 * @param config - Step configuration
 * @param computeFn - Function to compute the polygon value
 * @param strokeColor - Optional function to determine stroke color from theme
 * @returns A complete Step object
 */
export function createPolygonStep<TConfig>(
  config: StepBuilderConfig<TConfig>,
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => GeometryValue,
  strokeColor?: (theme: Theme) => string,
): Step<TConfig> {
  validateConfig(config);
  return {
    ...config,
    compute: computeSingle(config.outputs[0], (inputs, cfg) => computeFn(inputs, cfg)),
    draw: (svg, values, store, theme) => {
      const p = values.get(config.outputs[0]);
      if (!p || !isPolygon(p)) return;
      drawPolygon(
        svg,
        values,
        config.outputs[0],
        STROKE_WIDTH_THIN,
        store,
        theme,
        strokeColor?.(theme) ?? theme.COLOR_PRIMARY,
      );
    },
  };
}

/**
 * Create a coordinate system step with standardized compute and draw functions.
 * @param config - Step configuration
 * @param computeFn - Function to compute the coordinate system value
 * @param strokeColor - Optional function to determine stroke color from theme
 * @returns A complete Step object
 */
export function createCoordinateSystemStep<TConfig>(
  config: StepBuilderConfig<TConfig>,
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => GeometryValue,
  strokeColor?: (theme: Theme) => string,
): Step<TConfig> {
  validateConfig(config);
  return {
    ...config,
    compute: computeSingle(config.outputs[0], (inputs, cfg) => computeFn(inputs, cfg)),
    draw: (svg, values, store, theme) => {
      const cs = values.get(config.outputs[0]);
      if (!cs || !isCoordinateSystem(cs)) return;
      drawCoordinateSystem(
        svg,
        values,
        config.outputs[0],
        STROKE_WIDTH_THIN,
        store,
        theme,
        strokeColor?.(theme) ?? theme.COLOR_PRIMARY,
      );
    },
  };
}
