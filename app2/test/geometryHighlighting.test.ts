import { describe, it, expect, vi } from "vitest";
import {
  applyInputVisualFeedback,
  restoreInitialState,
  applyVisualFeedback,
  applyHoverHighlight,
  removeHoverHighlight,
  selectGeometry,
  COLOR_INPUT_HIGHLIGHT,
  COLOR_HOVER_DETAILS,
  COLOR_SELECTED,
} from "../src/utils/geometryHighlighting";
import type { GeometryItem } from "../src/react-store";

// Mock SVG element with tracking
function createMockSvgElement(): any {
  return {
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    tooltip: { setAttribute: vi.fn() },
    tooltipBg: { setAttribute: vi.fn() },
  };
}

function createMockGeometryItem(overrides: Partial<GeometryItem> = {}): GeometryItem {
  return {
    name: "test-item",
    element: createMockSvgElement(),
    selected: false,
    type: "point",
    context: undefined,
    initialState: { fill: "white", r: "2" },
    dependsOn: [],
    stepId: "",
    parameterValues: {},
    ...overrides,
  };
}

function createMockStore(items: Record<string, GeometryItem> = {}): any {
  const storeItems: Record<string, GeometryItem> = { ...items };
  return {
    items: storeItems,
    update: vi.fn((key: string, partial: Partial<GeometryItem>) => {
      storeItems[key] = { ...storeItems[key], ...partial };
    }),
    add: vi.fn(),
    clear: vi.fn(),
  };
}

describe("Color Constants", () => {
  it("exports COLOR_INPUT_HIGHLIGHT as orange", () => {
    expect(COLOR_INPUT_HIGHLIGHT).toBe("orange");
  });

  it("exports COLOR_HOVER_DETAILS as cyan", () => {
    expect(COLOR_HOVER_DETAILS).toBe("cyan");
  });

  it("exports COLOR_SELECTED as red", () => {
    expect(COLOR_SELECTED).toBe("red");
  });
});

describe("applyInputVisualFeedback", () => {
  it("applies orange fill to point elements", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    applyInputVisualFeedback(element, item, 2);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });

  it("applies orange stroke to line elements", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "line", element });

    applyInputVisualFeedback(element, item, 2);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
  });

  it("shows tooltip for highlighted inputs", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    applyInputVisualFeedback(element, item, 2);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "1");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "1");
  });
});

describe("restoreInitialState", () => {
  it("restores element attributes from initialState", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({
      type: "point",
      element,
      initialState: { fill: "blue", r: "5" },
    });

    restoreInitialState(element, item);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "blue");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "5");
  });

  it("hides tooltips when restoring", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    restoreInitialState(element, item);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "0");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "0");
  });
});

describe("applyVisualFeedback", () => {
  it("applies red fill to selected point elements", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", selected: true, element });

    applyVisualFeedback(element, item, 3);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "red");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "3");
  });

  it("applies red stroke to selected line elements", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "line", selected: true, element });

    applyVisualFeedback(element, item, 3);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "red");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "3");
  });

  it("restores initial state for unselected items", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({
      type: "point",
      selected: false,
      element,
      initialState: { fill: "white", r: "2" },
    });

    applyVisualFeedback(element, item, 3);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "white");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });

  it("shows tooltips for selected items", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", selected: true, element });

    applyVisualFeedback(element, item, 3);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "1");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "1");
  });
});

describe("applyHoverHighlight", () => {
  it("applies orange color by default for points", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    applyHoverHighlight(element, item, 2);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });

  it("applies cyan color when specified for points", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    applyHoverHighlight(element, item, 2, COLOR_HOVER_DETAILS);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "cyan");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
    // Verify tooltip background color is changed for GeometryDetails hover
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("fill", "#00ffff");
  });

  it("applies orange color by default for lines", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "line", element });

    applyHoverHighlight(element, item, 2);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "orange");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
  });

  it("applies cyan color when specified for lines", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "line", element });

    applyHoverHighlight(element, item, 2, COLOR_HOVER_DETAILS);

    expect(element.setAttribute).toHaveBeenCalledWith("stroke", "cyan");
    expect(element.setAttribute).toHaveBeenCalledWith("stroke-width", "2");
    // Verify tooltip background color is changed for GeometryDetails hover
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("fill", "#00ffff");
  });

  it("shows tooltips for hovered items", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", element });

    applyHoverHighlight(element, item, 2);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "1");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "1");
  });
});

describe("removeHoverHighlight", () => {
  it("restores initial state for unselected items", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({
      type: "point",
      selected: false,
      element,
      initialState: { fill: "white", r: "2" },
    });

    removeHoverHighlight(element, item, 2);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "white");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "2");
  });

  it("re-applies selection feedback for selected items", () => {
    const element = createMockSvgElement();
    element.tooltipBg = { setAttribute: vi.fn(), getAttribute: () => "black" };
    const item = createMockGeometryItem({
      type: "point",
      selected: true,
      element,
      initialState: { fill: "white", r: "2" },
    });

    removeHoverHighlight(element, item, 3);

    // Should re-apply selection (red) instead of restoring initial state
    expect(element.setAttribute).toHaveBeenCalledWith("fill", "red");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "3");
    // Should restore tooltipBg fill to original color
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("fill", "black");
  });

  it("hides tooltips for unselected items", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ type: "point", selected: false, element });

    removeHoverHighlight(element, item, 2);

    expect(element.tooltip.setAttribute).toHaveBeenCalledWith("opacity", "0");
    expect(element.tooltipBg.setAttribute).toHaveBeenCalledWith("opacity", "0");
  });
});

describe("selectGeometry", () => {
  it("deselects all and selects the specified geometry", () => {
    const item1 = createMockGeometryItem({ name: "item1", selected: true });
    const item2 = createMockGeometryItem({ name: "item2", selected: false });
    const item3 = createMockGeometryItem({ name: "item3", selected: false });

    const store = createMockStore({
      item1,
      item2,
      item3,
    });

    selectGeometry(store, "item2", 3);

    expect(store.items.item1.selected).toBe(false);
    expect(store.items.item2.selected).toBe(true);
    expect(store.items.item3.selected).toBe(false);
  });

  it("applies visual feedback to selected item", () => {
    const element = createMockSvgElement();
    const item = createMockGeometryItem({ name: "item1", selected: false, type: "point", element });

    const store = createMockStore({ item1: item });

    selectGeometry(store, "item1", 3);

    expect(element.setAttribute).toHaveBeenCalledWith("fill", "red");
    expect(element.setAttribute).toHaveBeenCalledWith("r", "3");
  });

  it("does nothing when geometry not found", () => {
    const store = createMockStore();

    selectGeometry(store, "nonexistent", 3);

    expect(store.update).not.toHaveBeenCalled();
  });

  it("does nothing when geometry has no element", () => {
    const item = createMockGeometryItem({ name: "item1", element: null });
    const store = createMockStore({ item1: item });

    selectGeometry(store, "item1", 3);

    expect(store.update).not.toHaveBeenCalled();
  });
});
