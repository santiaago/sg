import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RotatedSquareSvg, ROTATED_SQUARE_STEPS } from "../src/components/RotatedSquareSvg";
import { useGeometryStoreSquare } from "../src/react-store";
import { standardSvgConfig } from "../src/config/svgConfig";
import { darkTheme, lightTheme } from "../src/themes";
import type { GeometryStore, GeometryItem, GeometryType } from "../src/react-store";

/**
 * Tests for RotatedSquareSvg component with rotated coordinate system.
 * The coordinate system is rotated by Pi/16 radians (X axis goes down by Pi/16).
 */

// Mock stores for testing
const createMockStore = (): GeometryStore & {
  add: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} => ({
  items: {},
  add: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
});

describe("RotatedSquareSvg Component - Basic Rendering", () => {
  const defaultProps = {
    svgConfig: standardSvgConfig,
    currentStep: 1,
    restartTrigger: 0,
    store: createMockStore(),
  };

  it("should render without crashing", () => {
    render(<RotatedSquareSvg {...defaultProps} />);
    expect(screen.getByTestId("rotated-square-svg")).toBeInTheDocument();
  });

  it("should render with rotated coordinate system at step 1", () => {
    const mockStore = createMockStore();
    render(<RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={1} />);

    // At step 1, only the coordinate system should be drawn
    // The CS should have rotation = Pi/16
    expect(screen.getByTestId("rotated-square-svg")).toBeInTheDocument();
  });

  it("should work with real useGeometryStoreSquare hook", () => {
    const TestComponent = () => {
      const store = useGeometryStoreSquare();
      return (
        <RotatedSquareSvg
          store={store}
          svgConfig={standardSvgConfig}
          currentStep={1}
          restartTrigger={0}
        />
      );
    };

    render(<TestComponent />);
    expect(screen.getByTestId("rotated-square-svg")).toBeInTheDocument();
  });
});

describe("RotatedSquareSvg Component - Store Clear Behavior", () => {
  const defaultProps = {
    svgConfig: standardSvgConfig,
    currentStep: 0,
    restartTrigger: 0,
    store: createMockStore(),
  };

  it("should NOT clear store on forward step navigation (1->2)", () => {
    const mockStore = createMockStore();

    const { rerender } = render(
      <RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={1} />,
    );

    mockStore.clear.mockClear();

    rerender(<RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={2} />);

    expect(mockStore.clear).not.toHaveBeenCalled();
  });

  it("should clear store on backward step navigation (2->1)", () => {
    const mockStore = createMockStore();

    const { rerender } = render(
      <RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={2} />,
    );

    mockStore.clear.mockClear();

    rerender(<RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={1} />);

    expect(mockStore.clear).toHaveBeenCalledTimes(1);
  });

  it("should clear store on restart", () => {
    const mockStore = createMockStore();

    const { rerender } = render(
      <RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={3} restartTrigger={0} />,
    );

    mockStore.clear.mockClear();

    rerender(
      <RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={3} restartTrigger={1} />,
    );

    expect(mockStore.clear).toHaveBeenCalledTimes(1);
  });
});

describe("RotatedSquareSvg Component - Theme Change Behavior", () => {
  const defaultProps = {
    svgConfig: standardSvgConfig,
    currentStep: 1,
    restartTrigger: 0,
  };

  it("should clear store when theme changes from dark to light", () => {
    const mockStore = createMockStore();

    const { rerender } = render(
      <RotatedSquareSvg {...defaultProps} store={mockStore} theme={darkTheme} />,
    );

    mockStore.clear.mockClear();

    rerender(<RotatedSquareSvg {...defaultProps} store={mockStore} theme={lightTheme} />);

    expect(mockStore.clear).toHaveBeenCalledTimes(1);
  });

  it("should render with default darkTheme when theme prop is not provided", () => {
    const mockStore = createMockStore();

    render(<RotatedSquareSvg {...defaultProps} store={mockStore} />);

    expect(screen.getByTestId("rotated-square-svg")).toBeInTheDocument();
  });
});

describe("RotatedSquareSvg Component - Metadata Population", () => {
  const createStoreWithTracking = () => {
    const updateCalls: Array<{ key: string; data: Partial<GeometryItem> }> = [];
    const items: Record<string, GeometryItem> = {};

    const mockStore: GeometryStore & { getUpdateCalls: () => typeof updateCalls } = {
      items,
      add: vi.fn((name: string, element: any, type: GeometryType, dependsOn: string[]) => {
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
    restartTrigger: 0,
    store: createMockStore(),
  };

  it("populates stepId for output geometries", () => {
    const mockStore = createStoreWithTracking();

    render(<RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    expect(updateCalls.length).toBeGreaterThan(0);

    for (const call of updateCalls) {
      expect(call.data.stepId).toBeDefined();
      expect(typeof call.data.stepId).toBe("string");
      expect(call.data.stepId).not.toBe("");
    }

    const stepIds = updateCalls.map((c) => c.data.stepId);
    const validStepIds = ROTATED_SQUARE_STEPS.slice(0, 1).map((s) => s.id);
    for (const stepId of stepIds) {
      expect(validStepIds).toContain(stepId);
    }
  });

  it("populates parameterValues for geometries", () => {
    const mockStore = createStoreWithTracking();

    render(<RotatedSquareSvg {...defaultProps} store={mockStore} currentStep={1} />);

    const updateCalls = mockStore.getUpdateCalls();

    for (const call of updateCalls) {
      expect(call.data.parameterValues).toBeDefined();
      expect(typeof call.data.parameterValues).toBe("object");
    }

    const hasParams = updateCalls.some((c) => Object.keys(c.data.parameterValues || {}).length > 0);
    expect(hasParams).toBe(true);
  });
});
