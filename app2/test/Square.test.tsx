import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Square } from "../src/components/Square";
import { useGeometryStoreSquare } from "../src/react-store";
import { standardSvgConfig } from "../src/config/svgConfig";

/**
 * Tests to prevent infinite render loops in Square component.
 *
 * The issue that was fixed: Square component was causing infinite re-renders
 * because:
 * 1. Store props were not memoized, changing on every parent render
 * 2. updateSteps callback was not memoized in parent
 */

// Mock stores for testing
const createMockStore = () => ({
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
  getDependencyGraph: vi.fn(),
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
