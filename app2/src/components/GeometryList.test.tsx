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
