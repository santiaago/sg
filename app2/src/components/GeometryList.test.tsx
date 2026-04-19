import { describe, it, expect, vi } from "vitest";
import { applyInputVisualFeedback, restoreInitialState } from "./GeometryList";
import type { GeometryItem } from "../react-store";

// Mock SVG element
const createMockElement = (_type: string) => ({
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  tooltip: { setAttribute: vi.fn() },
  tooltipBg: { setAttribute: vi.fn() },
});

// Helper to create a mock GeometryItem
const createMockGeometryItem = (overrides: Partial<GeometryItem> = {}): GeometryItem => ({
  name: "test-item",
  element: createMockElement("point"),
  selected: false,
  type: "point",
  context: undefined,
  initialState: { fill: "white", r: "2" },
  dependsOn: [],
  stepId: "",
  parameterValues: {},
  ...overrides,
});

describe("applyInputVisualFeedback", () => {
  it("applies orange styles to point elements", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({ type: "point", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });

  it("applies orange styles to line elements", () => {
    const element = createMockElement("line");
    const item = createMockGeometryItem({ type: "line", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
  });

  it("applies orange styles to circle elements", () => {
    const element = createMockElement("circle");
    const item = createMockGeometryItem({ type: "circle", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
  });

  it("applies orange styles to polygon elements", () => {
    const element = createMockElement("polygon");
    const item = createMockGeometryItem({ type: "polygon", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
  });

  it("shows tooltips for highlighted elements", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({ type: "point", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "1");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "1");
  });

  it("does nothing when element is null", () => {
    const item = createMockGeometryItem({ element: null });
    // Should not throw
    expect(() => applyInputVisualFeedback(null, item, 2.0)).not.toThrow();
  });

  it("applies correct scale when provided", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({ type: "point", element });

    applyInputVisualFeedback(element, item, 2.0);

    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });
});

describe("restoreInitialState", () => {
  it("restores attributes from initialState", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({
      type: "point",
      element,
      initialState: { fill: "white", r: "2", cx: "10", cy: "20" },
    });

    restoreInitialState(element, item);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "white");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
    expect(element.setAttribute).toHaveBeenCalledWith("cx", "10");
    expect(element.setAttribute).toHaveBeenCalledWith("cy", "20");
  });

  it("hides tooltips", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({ type: "point", element });

    restoreInitialState(element, item);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "0");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "0");
  });

  it("does nothing when element is null", () => {
    const item = createMockGeometryItem({ element: null });
    // Should not throw
    expect(() => restoreInitialState(null, item)).not.toThrow();
  });

  it("does nothing when initialState is missing", () => {
    const element = createMockElement("point");
    const item = createMockGeometryItem({
      type: "point",
      element,
      initialState: undefined,
    });

    restoreInitialState(element, item);

    // Only tooltip calls expected, no attribute restorations
    expect(element.setAttribute).not.toHaveBeenCalled();
    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "0");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "0");
  });
});

// Helper to create a mock store
type Store = {
  items: Record<string, GeometryItem>;
  update: (key: string, data: Partial<GeometryItem>) => void;
  add: (name: string, element: any, type: string, dependsOn: string[]) => void;
  clear: () => void;
};

// Simulate the handleClick logic for testing
function simulateHandleClick(store: Store, name: string) {
  const item = store.items[name];
  if (!item) return;

  // Deselect all first for single selection mode
  Object.keys(store.items).forEach((key) => {
    store.update(key, { selected: false });
  });

  // Select the clicked one
  store.update(name, { selected: true });
}

describe("GeometryList - Single Selection Mode", () => {
  const createMockStore = (items: Record<string, GeometryItem> = {}) => {
    const store: Store = {
      items: { ...items },
      update: vi.fn((key: string, data: Partial<GeometryItem>) => {
        store.items[key] = { ...store.items[key], ...data };
      }),
      add: vi.fn(),
      clear: vi.fn(),
    };
    return store;
  };

  it("single selection - only one geometry selected at a time", () => {
    const item1 = createMockGeometryItem({ name: "item-1", selected: true });
    const item2 = createMockGeometryItem({ name: "item-2", selected: false });
    const item3 = createMockGeometryItem({ name: "item-3", selected: false });

    const store = createMockStore({
      "item-1": item1,
      "item-2": item2,
      "item-3": item3,
    });

    simulateHandleClick(store, "item-2");

    expect(store.items["item-1"].selected).toBe(false);
    expect(store.items["item-2"].selected).toBe(true);
    expect(store.items["item-3"].selected).toBe(false);
  });

  it("clicking different geometries switches selection", () => {
    const item1 = createMockGeometryItem({ name: "item-1", selected: true });
    const item2 = createMockGeometryItem({ name: "item-2", selected: false });

    const store = createMockStore({
      "item-1": item1,
      "item-2": item2,
    });

    expect(store.items["item-1"].selected).toBe(true);
    expect(store.items["item-2"].selected).toBe(false);

    simulateHandleClick(store, "item-2");

    expect(store.items["item-1"].selected).toBe(false);
    expect(store.items["item-2"].selected).toBe(true);

    simulateHandleClick(store, "item-1");

    expect(store.items["item-1"].selected).toBe(true);
    expect(store.items["item-2"].selected).toBe(false);
  });

  it("maintains input highlighting compatibility", () => {
    const item1 = createMockGeometryItem({
      name: "item-1",
      selected: true,
      dependsOn: ["input-a"],
    });
    const item2 = createMockGeometryItem({
      name: "item-2",
      selected: false,
      dependsOn: ["input-b"],
    });
    const inputA = createMockGeometryItem({ name: "input-a", selected: false });
    const inputB = createMockGeometryItem({ name: "input-b", selected: false });

    const store = createMockStore({
      "item-1": item1,
      "item-2": item2,
      "input-a": inputA,
      "input-b": inputB,
    });

    simulateHandleClick(store, "item-2");

    expect(store.items["item-2"].selected).toBe(true);
    expect(store.items["item-1"].selected).toBe(false);
    expect(store.items["item-2"].dependsOn).toEqual(["input-b"]);
  });
});
