import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Square, SQUARE_STEPS } from "../src/components/Square";
import { useGeometryStoreSquare } from "../src/react-store";
import { standardSvgConfig } from "../src/config/svgConfig";
import type { GeometryStore, GeometryItem } from "../src/react-store";

/**
 * Tests to prevent infinite render loops in Square component.
 *
 * The issue that was fixed: Square component was causing infinite re-renders
 * because:
 * 1. Store props were not memoized, changing on every parent render
 * 2. updateSteps callback was not memoized in parent
 */

// Mock stores for testing
const createMockStore = (): GeometryStore => ({
  items: {},
  add: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
});

const createMockGeometryValueStore = () => ({
  geometries: new Map(),
  dependencies: new Map(),
  addGeometry: vi.fn(),
  getGeometry: vi.fn(),
  getNode: vi.fn(),
  getAllNodes: vi.fn(),
  getDependencyGraph: vi.fn(() => ({ nodes: [], edges: [] })),
  clear: vi.fn(),
});

describe("Square Component - Infinite Render Prevention", () => {
  const defaultProps = {
    svgConfig: standardSvgConfig,
    currentStep: 1,
    restartKey: 0,
    store: createMockStore(),
    geometryValueStore: createMockGeometryValueStore(),
  };

  it("should render without crashing", () => {
    render(<Square {...defaultProps} />);
    expect(screen.getByTestId("square-svg")).toBeInTheDocument();
  });

  it("should not cause infinite re-renders with stable props", () => {
    // Track render count
    let renderCount = 0;

    // Create a wrapper component to track renders
    const TestWrapper = () => {
      renderCount++;
      return <Square {...defaultProps} />;
    };

    // Reset before test
    renderCount = 0;

    // Render the component
    render(<TestWrapper />);

    // Should only render once initially
    expect(renderCount).toBe(1);

    // If there were infinite renders, this would timeout or exceed max calls
    // We can also check renderCount is still 1 after a small delay
  });

  it("should accept and call updateSteps callback only once", () => {
    const mockUpdateSteps = vi.fn();

    render(<Square {...defaultProps} updateSteps={mockUpdateSteps} />);

    // updateSteps should be called once on mount with the steps
    expect(mockUpdateSteps).toHaveBeenCalledTimes(1);
    expect(mockUpdateSteps).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ draw: true, drawShapes: expect.any(Function) }),
      ]),
    );
  });

  it("should execute steps on mount with currentStep=1", () => {
    const mockStore = createMockStore();
    const mockGeometryStore = createMockGeometryValueStore();
    mockGeometryStore.clear = vi.fn();

    // First render with currentStep=1
    render(<Square {...defaultProps} store={mockStore} geometryValueStore={mockGeometryStore} />);

    // Store's add method should be called because steps ARE executed on first render
    // with currentStep=1 (default in defaultProps)
    expect(mockStore.add).toHaveBeenCalled();

    // The geometry value store clear should be called
    expect(mockGeometryStore.clear).toHaveBeenCalled();
  });
});

/**
 * Tests for the integration with actual hooks to verify memoization works
 */
describe("Square Component - Integration Tests", () => {
  it("should work with real useGeometryStoreSquare hook", () => {
    // This test verifies that when Square receives a store from the real hook,
    // it doesn't cause infinite renders

    const TestComponent = () => {
      const store = useGeometryStoreSquare();

      return <Square store={store} svgConfig={standardSvgConfig} currentStep={1} />;
    };

    // Should render without infinite loop
    render(<TestComponent />);
    expect(screen.getByTestId("square-svg")).toBeInTheDocument();
  });

  it("should work with memoized callback from parent", () => {
    const mockUpdateSteps = vi.fn();

    const TestParent = () => {
      // This is the pattern that should be used in App.tsx
      // Callback is memoized to prevent recreation on every render
      const handleUpdateSteps = React.useCallback(mockUpdateSteps, []);

      return (
        <Square svgConfig={standardSvgConfig} currentStep={1} updateSteps={handleUpdateSteps} />
      );
    };

    render(<TestParent />);

    expect(screen.getByTestId("square-svg")).toBeInTheDocument();
    expect(mockUpdateSteps).toHaveBeenCalledTimes(1);
  });
});

/**
 * Tests for GeometryItem metadata population (stepId and parameterValues)
 */
describe("Square Component - Metadata Population", () => {
  const createStoreWithTracking = () => {
    const updateCalls: Array<{ key: string; data: Partial<GeometryItem> }> = [];
    const items: Record<string, GeometryItem> = {};

    const mockStore: GeometryStore & { getUpdateCalls: () => typeof updateCalls } = {
      items,
      add: vi.fn((name: string, element: any, type: string, dependsOn: string[]) => {
        items[name] = {
          name,
          element,
          selected: false,
          type,
          dependsOn,
          stepId: "",
          parameterValues: {},
        };
      }),
      update: vi.fn((key: string, data: Partial<GeometryItem>) => {
        updateCalls.push({ key, data });
        items[key] = { ...items[key], ...data };
      }),
      clear: vi.fn(() => {
        Object.keys(items).forEach((k) => delete items[k]);
      }),
      getUpdateCalls: () => updateCalls,
    };

    return mockStore;
  };

  const defaultProps = {
    svgConfig: standardSvgConfig,
    currentStep: 1,
    restartKey: 0,
    geometryValueStore: createMockGeometryValueStore(),
  };

  it("populates stepId for output geometries", () => {
    const mockStore = createStoreWithTracking();

    render(<Square {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    expect(updateCalls.length).toBeGreaterThan(0);

    for (const call of updateCalls) {
      expect(call.data.stepId).toBeDefined();
      expect(typeof call.data.stepId).toBe("string");
      expect(call.data.stepId).not.toBe("");
    }

    const stepIds = updateCalls.map((c) => c.data.stepId);
    const validStepIds = SQUARE_STEPS.slice(0, 1).map((s) => s.id);
    for (const stepId of stepIds) {
      expect(validStepIds).toContain(stepId);
    }
  });

  it("populates parameterValues for geometries", () => {
    const mockStore = createStoreWithTracking();

    render(<Square {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    for (const call of updateCalls) {
      expect(call.data.parameterValues).toBeDefined();
      expect(typeof call.data.parameterValues).toBe("object");
    }

    const hasParams = updateCalls.some((c) => Object.keys(c.data.parameterValues).length > 0);
    expect(hasParams).toBe(true);
  });

  it("populates correct parameters for step_main_line", () => {
    const mockStore = createStoreWithTracking();

    render(<Square {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    const mainLineUpdate = updateCalls.find(
      (c) => c.data.stepId === "step_main_line" && c.key === "line_main",
    );

    expect(mainLineUpdate).toBeDefined();
    expect(mainLineUpdate!.data.parameterValues).toBeDefined();

    const expectedParams = ["lx1", "ly1", "lx2", "ly2"];
    const paramKeys = Object.keys(mainLineUpdate!.data.parameterValues);

    for (const param of expectedParams) {
      expect(paramKeys).toContain(param);
    }
  });

  it("handles steps with no parameters", () => {
    const stepWithoutParams = SQUARE_STEPS.find((s) => !s.parameters || s.parameters.length === 0);

    if (stepWithoutParams) {
      const mockStore = createStoreWithTracking();

      const upToStep = SQUARE_STEPS.findIndex((s) => s.id === stepWithoutParams.id) + 1;

      render(<Square {...defaultProps} store={mockStore} currentStep={upToStep} />);

      const updateCalls = mockStore.getUpdateCalls();

      const stepOutput = stepWithoutParams.outputs[0];
      const stepOutputUpdate = updateCalls.find(
        (c) => c.data.stepId === stepWithoutParams.id && c.key === stepOutput,
      );

      expect(stepOutputUpdate).toBeDefined();
      expect(stepOutputUpdate!.data.parameterValues).toEqual({});
    }
  });

  it("handles steps with multiple parameters", () => {
    const mockStore = createStoreWithTracking();

    render(<Square {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    const mainLineUpdate = updateCalls.find(
      (c) => c.data.stepId === "step_main_line" && c.key === "line_main",
    );

    expect(mainLineUpdate).toBeDefined();
    const paramCount = Object.keys(mainLineUpdate!.data.parameterValues).length;
    expect(paramCount).toBeGreaterThan(1);
  });

  it("populates stepId and parameterValues for all executed steps", () => {
    const mockStore = createStoreWithTracking();

    render(<Square {...defaultProps} store={mockStore} currentStep={3} />);

    const updateCalls = mockStore.getUpdateCalls();

    const executedSteps = SQUARE_STEPS.slice(0, 3);
    const expectedOutputs = executedSteps.flatMap((s) => s.outputs);

    expect(updateCalls.length).toBeGreaterThanOrEqual(expectedOutputs.length);

    for (const call of updateCalls) {
      expect(call.data.stepId).toBeDefined();
      expect(call.data.stepId).not.toBe("");
      expect(call.data.parameterValues).toBeDefined();
    }
  });
});
