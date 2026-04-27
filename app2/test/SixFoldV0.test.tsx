import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { SixFoldV0 } from "../src/components/SixFoldV0";
import { useGeometryStoreSixFoldV0 } from "../src/react-store";
import { sixFoldSvgConfig } from "../src/config/svgConfig";
import type { GeometryStore, GeometryItem } from "../src/react-store";
import type { Mock } from "vitest";

const createMockStore = (): GeometryStore & {
  add: Mock;
  update: Mock;
  clear: Mock;
} => ({
  items: {},
  add: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
});

describe("SixFoldV0 Component", () => {
  const defaultProps = {
    svgConfig: sixFoldSvgConfig,
    currentStep: 0,
    restartTrigger: 0,
    store: createMockStore(),
  };

  describe("Infinite Render Prevention", () => {
    it("should render without crashing", () => {
      render(<SixFoldV0 {...defaultProps} />);
      expect(screen.getByTestId("sixfoldv0-svg")).toBeInTheDocument();
    });

    it("should not cause infinite re-renders", () => {
      let renderCount = 0;
      const TestWrapper = () => {
        renderCount++;
        return <SixFoldV0 {...defaultProps} />;
      };
      renderCount = 0;
      render(<TestWrapper />);
      expect(renderCount).toBe(1);
    });
  });

  describe("Integration Tests", () => {
    it("should work with real useGeometryStoreSixFoldV0 hook", () => {
      const TestComponent = () => {
        const store = useGeometryStoreSixFoldV0();
        return <SixFoldV0 store={store} svgConfig={sixFoldSvgConfig} currentStep={1} />;
      };
      render(<TestComponent />);
      expect(screen.getByTestId("sixfoldv0-svg")).toBeInTheDocument();
    });
  });

  describe("Store Clear Regression Tests", () => {
    it("should NOT clear store on forward step navigation (1->2)", () => {
      const mockStore = createMockStore();
      const { rerender } = render(
        <SixFoldV0 {...defaultProps} store={mockStore} currentStep={1} />,
      );
      mockStore.clear.mockClear();
      rerender(<SixFoldV0 {...defaultProps} store={mockStore} currentStep={2} />);
      expect(mockStore.clear).not.toHaveBeenCalled();
    });

    it("should clear store on backward step navigation (2->1)", () => {
      const mockStore = createMockStore();
      const { rerender } = render(
        <SixFoldV0 {...defaultProps} store={mockStore} currentStep={2} />,
      );
      mockStore.clear.mockClear();
      rerender(<SixFoldV0 {...defaultProps} store={mockStore} currentStep={1} />);
      expect(mockStore.clear).toHaveBeenCalledTimes(1);
    });

    it("should clear store on restart (restartTrigger changes)", () => {
      const mockStore = createMockStore();
      const { rerender } = render(
        <SixFoldV0 {...defaultProps} store={mockStore} currentStep={3} restartTrigger={0} />,
      );
      mockStore.clear.mockClear();
      rerender(
        <SixFoldV0 {...defaultProps} store={mockStore} currentStep={3} restartTrigger={1} />,
      );
      expect(mockStore.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe("Metadata Population", () => {
    it("should populate parameterValues for geometries", () => {
      const updateCalls: Array<{ key: string; data: Partial<GeometryItem> }> = [];
      const mockStore: GeometryStore & { update: Mock; add: Mock; clear: Mock } = {
        items: {},
        add: vi.fn(),
        update: vi.fn((key, data) => updateCalls.push({ key, data })),
        clear: vi.fn(),
      };
      render(<SixFoldV0 {...defaultProps} store={mockStore} currentStep={1} />);
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(updateCalls[0].data.parameterValues).toBeDefined();
    });
  });
});
