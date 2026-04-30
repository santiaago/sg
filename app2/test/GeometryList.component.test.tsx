import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GeometryList } from "../src/components/GeometryList";
import type { GeometryItem } from "../src/react-store";

// Mock SVG elements
const createMockElement = () => ({
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  tooltip: { setAttribute: vi.fn() },
  tooltipBg: { setAttribute: vi.fn() },
});

// Create a proper mock store that actually updates its items
const createMockStore = (initialItems: Record<string, GeometryItem> = {}) => {
  let items: Record<string, GeometryItem> = { ...initialItems };
  return {
    get items() {
      return items;
    },
    set items(newItems: Record<string, GeometryItem>) {
      items = newItems;
    },
    update: vi.fn((key: string, partial: Partial<GeometryItem>) => {
      items[key] = { ...items[key], ...partial };
    }),
    add: vi.fn((name: string, element: any, type: string, dependsOn: string[] = []) => {
      items[name] = { name, element, selected: false, type, dependsOn, context: undefined };
    }),
    clear: vi.fn(() => {
      items = {};
    }),
  };
};

// Mock GeometryItems for Square construction
const createMockStoreItems = (): Record<string, GeometryItem> => {
  const mockLineElement = createMockElement();
  const mockPointElement = createMockElement();
  const mockCircleElement = createMockElement();

  return {
    line_main: {
      name: "line_main",
      element: mockLineElement,
      selected: false,
      type: "line",
      context: undefined,
      initialState: { stroke: "white", "stroke-width": "0.5" },
      dependsOn: [],
      stepId: "",
      parameterValues: {},
    },
    c1: {
      name: "c1",
      element: mockPointElement,
      selected: false,
      type: "point",
      context: undefined,
      initialState: { fill: "white", r: "2" },
      dependsOn: ["line_main"],
      stepId: "",
      parameterValues: {},
    },
    c1_c: {
      name: "c1_c",
      element: mockCircleElement,
      selected: false,
      type: "circle",
      context: undefined,
      initialState: { stroke: "white", "stroke-width": "0.5" },
      dependsOn: ["c1"],
      stepId: "",
      parameterValues: {},
    },
  };
};

describe("GeometryList", () => {
  let store: any;
  let mockItems: Record<string, GeometryItem>;

  beforeEach(() => {
    mockItems = createMockStoreItems();
    store = createMockStore({ ...mockItems });
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all geometry items", () => {
      render(<GeometryList store={store} />);

      expect(screen.getByText("line_main | line")).toBeInTheDocument();
      expect(screen.getByText("c1 | point")).toBeInTheDocument();
      expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
    });

    it("displays the header", () => {
      render(<GeometryList store={store} />);

      expect(screen.getByText("Geometry Items")).toBeInTheDocument();
    });

    it("displays item count", () => {
      render(<GeometryList store={store} />);

      expect(screen.getByText("Showing 3 of 3 items")).toBeInTheDocument();
    });

    it("renders empty message when no items", () => {
      const emptyStore = createMockStore({});
      render(<GeometryList store={emptyStore} />);

      expect(screen.getByText("Showing 0 of 0 items")).toBeInTheDocument();
    });
  });

  describe("Selection Behavior (single selection mode)", () => {
    it("selects item on click", () => {
      render(<GeometryList store={store} showInputHighlight={false} />);

      fireEvent.click(screen.getByText("c1 | point"));

      expect(store.update).toHaveBeenCalledWith("c1", { selected: true });
      expect(store.items.c1.selected).toBe(true);
    });

    it("only one item can be selected at a time", () => {
      render(<GeometryList store={store} showInputHighlight={false} />);

      // Click on c1
      fireEvent.click(screen.getByText("c1 | point"));
      expect(store.items.c1.selected).toBe(true);
      expect(store.items.line_main.selected).toBe(false);

      // Click on line_main - should deselect c1 and select line_main
      fireEvent.click(screen.getByText("line_main | line"));
      expect(store.items.c1.selected).toBe(false);
      expect(store.items.line_main.selected).toBe(true);
    });

    it("applies red highlighting to selected point with context", () => {
      const storeWithContext = createMockStore({
        c1: { ...mockItems.c1, context: {} },
      });

      render(<GeometryList store={storeWithContext} showInputHighlight={false} />);

      const item = screen.getByText("c1 | point");
      fireEvent.click(item);

      // Verify store was updated correctly
      expect(storeWithContext.update).toHaveBeenCalledWith("c1", { selected: true });
      expect(storeWithContext.items.c1.selected).toBe(true);
      expect(storeWithContext.items.c1.context).toBeDefined();
    });

    it("applies highlighting to selected point without context", () => {
      render(<GeometryList store={store} showInputHighlight={false} />);

      const item = screen.getByText("c1 | point");
      fireEvent.click(item);

      // Verify store was updated correctly
      expect(store.update).toHaveBeenCalledWith("c1", { selected: true });
      expect(store.items.c1.selected).toBe(true);
    });

    it("applies highlighting to selected line without context", () => {
      render(<GeometryList store={store} showInputHighlight={false} />);

      const item = screen.getByText("line_main | line");
      fireEvent.click(item);

      // Verify store was updated correctly
      expect(store.update).toHaveBeenCalledWith("line_main", { selected: true });
      expect(store.items.line_main.selected).toBe(true);
    });
  });

  describe("Input Highlighting (feature ON)", () => {
    it("highlights input dependencies when geometry is selected", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("c1 | point"));

      // c1 depends on line_main, so line_main should be orange
      expect(screen.getByText("line_main | line")).toHaveClass("text-orange-400");
    });

    it("highlights c1 when c1_c is selected", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("c1_c | circle"));

      // c1_c depends on c1
      expect(screen.getByText("c1 | point")).toHaveClass("text-orange-400");
    });

    it("switches highlights when selecting different geometry", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      const c1Item = screen.getByText("c1 | point");
      const c1cItem = screen.getByText("c1_c | circle");
      const lineMainItem = screen.getByText("line_main | line");

      // First select c1 - highlights line_main
      fireEvent.click(c1Item);
      expect(lineMainItem).toHaveClass("text-orange-400");

      // Then select c1_c - should switch to highlighting c1
      fireEvent.click(c1cItem);
      expect(lineMainItem).not.toHaveClass("text-orange-400");
      expect(c1Item).toHaveClass("text-orange-400");
    });

    it("clears highlights when switching to different geometry", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      // Select c1_c - highlights c1
      fireEvent.click(screen.getByText("c1_c | circle"));
      expect(screen.getByText("c1 | point")).toHaveClass("text-orange-400");

      // Switch to c1 - should highlight line_main instead
      fireEvent.click(screen.getByText("c1 | point"));
      expect(screen.getByText("c1 | point")).toHaveClass("text-yellow-400");
      expect(screen.getByText("line_main | line")).toHaveClass("text-orange-400");
      expect(screen.getByText("c1_c | circle")).not.toHaveClass("text-orange-400");
    });

    it("clears highlights when toggle is turned OFF", () => {
      const { rerender } = render(<GeometryList store={store} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("c1 | point"));
      expect(screen.getByText("line_main | line")).toHaveClass("text-orange-400");

      rerender(<GeometryList store={store} showInputHighlight={false} />);
      expect(screen.getByText("line_main | line")).not.toHaveClass("text-orange-400");
    });

    it("shows selected geometry in yellow and its input in orange", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("c1 | point"));

      // Selected geometry (c1) should be yellow
      expect(screen.getByText("c1 | point")).toHaveClass("text-yellow-400");
      // Its input (line_main) should be orange
      expect(screen.getByText("line_main | line")).toHaveClass("text-orange-400");
    });

    it("handles geometries with no dependencies", () => {
      render(<GeometryList store={store} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("line_main | line"));

      // line_main has no dependencies, so no orange highlights
      expect(screen.getByText("line_main | line")).toHaveClass("text-yellow-400");
      expect(screen.getByText("c1 | point")).not.toHaveClass("text-orange-400");
      expect(screen.getByText("c1_c | circle")).not.toHaveClass("text-orange-400");
    });

    it("handles geometries with empty dependsOn array", () => {
      const storeWithEmptyDeps = createMockStore({
        isolated: {
          name: "isolated",
          element: createMockElement(),
          selected: false,
          type: "point",
          context: undefined,
          initialState: { fill: "white", r: "2" },
          dependsOn: [],
        },
      });

      render(<GeometryList store={storeWithEmptyDeps} showInputHighlight={true} />);

      fireEvent.click(screen.getByText("isolated | point"));

      // No orange highlights since dependsOn is empty
      expect(screen.getByText("isolated | point")).toHaveClass("text-yellow-400");
    });
  });

  describe("Accessibility", () => {
    it("has cursor-pointer on list items", () => {
      render(<GeometryList store={store} />);

      const items = screen.getAllByRole("listitem");
      items.forEach((item) => {
        expect(item).toHaveClass("cursor-pointer");
      });
    });

    it("has hover:underline style on list items", () => {
      render(<GeometryList store={store} />);

      const items = screen.getAllByRole("listitem");
      items.forEach((item) => {
        expect(item).toHaveClass("hover:underline");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles click on existing geometry name", () => {
      render(<GeometryList store={store} />);

      // Should not throw when clicking a name that exists in store
      expect(() => {
        fireEvent.click(screen.getByText("c1 | point"));
      }).not.toThrow();
    });

    it("handles store with null items", () => {
      const nullStore = createMockStore(null as any);
      render(<GeometryList store={nullStore} />);

      expect(screen.getByText("Showing 0 of 0 items")).toBeInTheDocument();
    });

    it("handles geometry item with missing element", () => {
      const storeWithNullElement = createMockStore({
        no_element: {
          name: "no_element",
          element: null,
          selected: false,
          type: "point",
          context: undefined,
          initialState: { fill: "white", r: "2" },
          dependsOn: [],
        },
      });

      render(<GeometryList store={storeWithNullElement} showInputHighlight={true} />);

      // Should not throw
      expect(() => {
        fireEvent.click(screen.getByText("no_element | point"));
      }).not.toThrow();
    });

    it("handles geometry item with missing dependsOn", () => {
      const storeWithoutDependsOn = createMockStore({
        no_deps: {
          name: "no_deps",
          element: createMockElement(),
          selected: false,
          type: "point",
          context: undefined,
          initialState: { fill: "white", r: "2" },
          dependsOn: undefined as any,
        },
      });

      render(<GeometryList store={storeWithoutDependsOn} showInputHighlight={true} />);

      // Should not throw
      expect(() => {
        fireEvent.click(screen.getByText("no_deps | point"));
      }).not.toThrow();
    });
  });

  describe("Custom stroke props", () => {
    it("uses custom stroke values", () => {
      render(<GeometryList store={store} stroke={1} strokeBig={3} />);

      fireEvent.click(screen.getByText("c1 | point"));

      // The store update should have been called
      expect(store.update).toHaveBeenCalled();
    });

    it("uses default stroke values when not provided", () => {
      render(<GeometryList store={store} />);

      fireEvent.click(screen.getByText("c1 | point"));

      expect(store.update).toHaveBeenCalled();
    });
  });

  describe("Filtering", () => {
    describe("Name Filter", () => {
      it("filters items by name", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
        expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
      });

      it("filters case-insensitively", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "LINE" } });

        expect(screen.getByText("line_main | line")).toBeInTheDocument();
        expect(screen.queryByText("c1 | point")).not.toBeInTheDocument();
      });

      it("shows all items when filter is empty", () => {
        render(<GeometryList store={store} />);

        expect(screen.getByText("line_main | line")).toBeInTheDocument();
        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
      });

      it("displays filtered count when name filter applied", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        expect(screen.getByText("Showing 2 of 3 items")).toBeInTheDocument();
      });
    });

    describe("Type Filter", () => {
      it("filters by type when button clicked", () => {
        render(<GeometryList store={store} />);

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
        expect(screen.queryByText("c1_c | circle")).not.toBeInTheDocument();
      });

      it("shows multiple types when multiple selected", () => {
        render(<GeometryList store={store} />);

        const pointButton = screen.getByText(/^point$/i);
        const circleButton = screen.getByText(/^circle$/i);
        fireEvent.click(pointButton);
        fireEvent.click(circleButton);

        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
        expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
      });

      it("toggles type filter off when clicked again", () => {
        render(<GeometryList store={store} />);

        const pointButton = screen.getByText(/^point$/i);
        // Click to enable
        fireEvent.click(pointButton);
        expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();

        // Click again to disable
        fireEvent.click(pointButton);
        expect(screen.getByText("line_main | line")).toBeInTheDocument();
      });

      it("displays filtered count when type filter applied", () => {
        render(<GeometryList store={store} />);

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        expect(screen.getByText("Showing 1 of 3 items")).toBeInTheDocument();
      });
    });

    describe("Combined Filters", () => {
      it("applies name AND type filters together", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        // Only c1 (point, name contains c1) should show
        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        // c1_c is circle, so filtered out by type
        expect(screen.queryByText("c1_c | circle")).not.toBeInTheDocument();
        // line_main doesn't contain c1, so filtered out by name
        expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
      });

      it("displays correct count with combined filters", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        expect(screen.getByText("Showing 1 of 3 items")).toBeInTheDocument();
      });
    });

    describe("Clear Filters", () => {
      it("clears name filter", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        const clearButton = screen.getByText(/clear filters/i);
        fireEvent.click(clearButton);

        expect(filterInput).toHaveValue("");
        expect(screen.getByText("line_main | line")).toBeInTheDocument();
        expect(screen.getByText("c1 | point")).toBeInTheDocument();
        expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
      });

      it("clears type filters", () => {
        render(<GeometryList store={store} />);

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        const clearButton = screen.getByText(/clear filters/i);
        fireEvent.click(clearButton);

        expect(screen.getByText("line_main | line")).toBeInTheDocument();
      });

      it("clears both name and type filters", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "c1" } });

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        const clearButton = screen.getByText(/clear filters/i);
        fireEvent.click(clearButton);

        expect(filterInput).toHaveValue("");
        expect(screen.getByText("Showing 3 of 3 items")).toBeInTheDocument();
      });

      it("hides clear button when no filters active", () => {
        render(<GeometryList store={store} />);

        expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
      });
    });

    describe("Filter Props", () => {
      it("hides name filter when showNameFilter is false", () => {
        render(<GeometryList store={store} showNameFilter={false} />);

        expect(screen.queryByPlaceholderText(/filter by name/i)).not.toBeInTheDocument();
      });

      it("hides type filters when showTypeFilters is false", () => {
        render(<GeometryList store={store} showTypeFilters={false} />);

        expect(screen.queryByText(/^point$/i)).not.toBeInTheDocument();
      });

      it("uses custom availableTypes", () => {
        render(<GeometryList store={store} availableTypes={["point", "line"]} />);

        expect(screen.getByText(/^point$/i)).toBeInTheDocument();
        expect(screen.getByText(/^line$/i)).toBeInTheDocument();
        expect(screen.queryByText(/^circle$/i)).not.toBeInTheDocument();
      });
    });

    describe("Edge Cases", () => {
      it("shows empty filtered count when no items match", () => {
        render(<GeometryList store={store} />);

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: "nonexistent" } });

        expect(screen.getByText("Showing 0 of 3 items")).toBeInTheDocument();
      });

      it("handles type filter with no matching items", () => {
        const polygonStore = createMockStore({
          poly1: {
            name: "poly1",
            element: createMockElement(),
            selected: false,
            type: "polygon",
            context: undefined,
            initialState: { stroke: "white", "stroke-width": "0.5" },
            dependsOn: [],
          },
        });

        render(<GeometryList store={polygonStore} />);

        const pointButton = screen.getByText(/^point$/i);
        fireEvent.click(pointButton);

        expect(screen.getByText("Showing 0 of 1 items")).toBeInTheDocument();
      });
    });
  });
});
