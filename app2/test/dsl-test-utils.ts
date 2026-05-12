// Test utilities for DSL framework
// Provides mock implementations of SVG, store, theme for unit testing

import { expect } from "vitest";
import type { GeometryStore, GeometryItem, GeometryType } from "../src/react-store";
import type { Theme } from "../src/themes";
import { lightTheme } from "../src/themes";
import type { GeometryValue, Step, StepExecutionContext } from "../src/types/geometry";
import type { GeometryRenderer } from "../src/geometry/dsl/renderers/types";

export interface TestContext {
  svg: SVGSVGElement;
  store: GeometryStore;
  theme: Theme;
  renderer: TestGeometryRenderer;
}

// ============================================================================
// Mock SVG Element
// ============================================================================

/**
 * Creates a mock SVGSVGElement for testing.
 * This is a minimal implementation that satisfies the type requirements.
 */
export function createMockSVG(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "600");
  svg.setAttribute("viewBox", "0 0 800 600");
  return svg;
}

// ============================================================================
// Mock GeometryStore
// ============================================================================

/**
 * Creates a mock GeometryStore for testing.
 * Tracks added items and provides basic store operations.
 */
export function createMockGeometryStore(): GeometryStore {
  const items: Record<string, GeometryItem> = {};

  return {
    get items() {
      return items;
    },
    add: (name: string, element: SVGGElement | null, type: GeometryType, dependsOn: string[]) => {
      items[name] = {
        name,
        element,
        selected: false,
        type,
        dependsOn,
        stepId: `step_${name}`,
        parameterValues: {},
      };
    },
    update: (key: string, object: Partial<GeometryItem>) => {
      if (items[key]) {
        items[key] = { ...items[key], ...object };
      }
    },
    clear: () => {
      Object.keys(items).forEach((key) => delete items[key]);
    },
  };
}

// ============================================================================
// Mock Theme
// ============================================================================

/**
 * Returns the light theme for testing.
 * Can be extended or mocked as needed.
 */
export function createMockTheme(): Theme {
  return { ...lightTheme };
}

// ============================================================================
// Test Geometry Renderer
// ============================================================================

/**
 * A test renderer that captures draw calls for verification.
 * Tracks which geometry IDs were drawn and with what types.
 */
export class TestGeometryRenderer implements GeometryRenderer {
  public drawnPoints: string[] = [];
  public drawnLines: string[] = [];
  public drawnCircles: string[] = [];
  public drawnPolygons: string[] = [];
  public drawnCoordinateSystems: string[] = [];

  drawPoint(
    _svg: SVGSVGElement,
    _values: Map<string, GeometryValue>,
    geomId: string,
    _store: GeometryStore,
    _theme: Theme,
  ): void {
    this.drawnPoints.push(geomId);
  }

  drawLine(
    _svg: SVGSVGElement,
    _values: Map<string, GeometryValue>,
    geomId: string,
    _store: GeometryStore,
    _theme: Theme,
    _options?: unknown,
  ): void {
    this.drawnLines.push(geomId);
  }

  drawCircle(
    _svg: SVGSVGElement,
    _values: Map<string, GeometryValue>,
    geomId: string,
    _store: GeometryStore,
    _theme: Theme,
  ): void {
    this.drawnCircles.push(geomId);
  }

  drawPolygon(
    _svg: SVGSVGElement,
    _values: Map<string, GeometryValue>,
    geomId: string,
    _store: GeometryStore,
    _theme: Theme,
  ): void {
    this.drawnPolygons.push(geomId);
  }

  drawCoordinateSystem(
    _svg: SVGSVGElement,
    _values: Map<string, GeometryValue>,
    geomId: string,
    _store: GeometryStore,
    _theme: Theme,
  ): void {
    this.drawnCoordinateSystems.push(geomId);
  }

  /** Reset all tracking */
  reset(): void {
    this.drawnPoints = [];
    this.drawnLines = [];
    this.drawnCircles = [];
    this.drawnPolygons = [];
    this.drawnCoordinateSystems = [];
  }

  /** Check if a specific geometry ID was drawn */
  wasDrawn(
    geomId: string,
    type: "point" | "line" | "circle" | "polygon" | "coordinate_system",
  ): boolean {
    switch (type) {
      case "point":
        return this.drawnPoints.includes(geomId);
      case "line":
        return this.drawnLines.includes(geomId);
      case "circle":
        return this.drawnCircles.includes(geomId);
      case "polygon":
        return this.drawnPolygons.includes(geomId);
      case "coordinate_system":
        return this.drawnCoordinateSystems.includes(geomId);
      default:
        return false;
    }
  }
}

// ============================================================================
// Step Execution Helper
// ============================================================================

/**
 * Options for executing steps
 */
export interface ExecuteStepsOptions<TConfig> {
  /** Starting step index (default: 0) */
  startStep?: number;
  /** Configuration to pass to compute functions */
  config: TConfig;
}

/**
 * Result of executing steps
 */
export interface StepExecutionResult {
  /** Map of geometry ID to computed value */
  values: Map<string, GeometryValue>;
  /** Number of steps executed */
  stepsExecuted: number;
  /** Any errors encountered */
  errors: Error[];
}

/**
 * Executes a set of steps and returns the computed values.
 * This is a simplified version for testing - the real execution happens
 * in the existing step execution engine.
 *
 * @param steps - The compiled steps to execute
 * @param options - Execution options including config
 * @returns The execution result with computed values
 */
export function executeSteps<TConfig>(
  steps: Step<TConfig>[],
  options: ExecuteStepsOptions<TConfig>,
): StepExecutionResult {
  const { startStep = 0, config } = options;
  const values: Map<string, GeometryValue> = new Map();
  const errors: Error[] = [];
  let stepsExecuted = 0;

  for (let i = startStep; i < steps.length; i++) {
    const step = steps[i];
    try {
      const computed = step.compute(values, config);
      // Merge computed values into our map
      for (const [key, value] of computed) {
        values.set(key, value);
      }
      stepsExecuted++;
    } catch (error) {
      errors.push(error as Error);
    }
  }

  return { values, stepsExecuted, errors };
}

/**
 * Helper to extract a specific geometry value from execution result
 */
export function getGeometryValue<T extends GeometryValue>(
  result: StepExecutionResult,
  geomId: string,
): T | undefined {
  return result.values.get(geomId) as T | undefined;
}

/**
 * Helper to verify a step has the expected structure
 */
export function verifyStepStructure<TConfig>(
  step: Step<TConfig>,
  expected: {
    id?: string;
    inputs?: string[];
    outputs?: string[];
    parameters?: (keyof TConfig)[];
    hasCompute?: boolean;
    hasDraw?: boolean;
  },
): void {
  if (expected.id !== undefined) {
    expect(step.id).toBe(expected.id);
  }
  if (expected.inputs !== undefined) {
    expect(Array.from(step.inputs ?? [])).toEqual(expect.arrayContaining(expected.inputs));
  }
  if (expected.outputs !== undefined) {
    expect(Array.from(step.outputs)).toEqual(expected.outputs);
  }
  if (expected.parameters !== undefined) {
    expect(Array.from(step.parameters ?? [])).toEqual(expected.parameters);
  }
  if (expected.hasCompute !== undefined) {
    expect(typeof step.compute).toBe(expected.hasCompute ? "function" : "undefined");
  }
  if (expected.hasDraw !== undefined) {
    expect(typeof step.draw).toBe(expected.hasDraw ? "function" : "undefined");
  }
}

// ============================================================================
// Test Setup Helper
// ============================================================================

/**
 * Creates a complete test context with all mocks
 */
export function createTestContext(): TestContext {
  return {
    svg: createMockSVG(),
    store: createMockGeometryStore(),
    theme: createMockTheme(),
    renderer: new TestGeometryRenderer(),
  };
}

/**
 * Helper to create a step execution context for testing
 */
export function createStepExecutionContext(ctx: TestContext): StepExecutionContext {
  return {
    svg: ctx.svg,
    store: ctx.store,
    theme: ctx.theme,
  };
}
