import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GeometryDetails } from "../src/components/GeometryDetails";
import type { GeometryStore, GeometryItem } from "../src/react-store";

// Helper to create a mock SVG element
function createMockSvgElement(type: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", type);
}

// Helper to create a mock GeometryItem
function createMockGeometryItem(overrides: Partial<GeometryItem> = {}): GeometryItem {
  return {
    name: "test-point",
    element: createMockSvgElement("circle"),
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

// Helper to create a mock store
function createMockStore(items: Record<string, GeometryItem> = {}): GeometryStore {
  return {
    items,
    add: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(),
  };
}

describe("GeometryDetails", () => {
  it("renders nothing when no geometry selected", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: false }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });

  it("renders details for selected geometry", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true, type: "point" }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("point-1")).toBeInTheDocument();
    expect(screen.getByText(": point")).toBeInTheDocument();
  });

  it("displays geometry name and type", () => {
    const store = createMockStore({
      "my-line": createMockGeometryItem({ name: "my-line", selected: true, type: "line" }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("my-line")).toBeInTheDocument();
    expect(screen.getByText(": line")).toBeInTheDocument();
  });

  it("displays stepId when available", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        stepId: "step_c1",
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Created by step: step_c1")).toBeInTheDocument();
  });

  it("does not display stepId section when empty", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true, stepId: "" }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.queryByText("Created by step:")).not.toBeInTheDocument();
  });

  it("displays inputs with names and types", () => {
    const store = createMockStore({
      "main-line": createMockGeometryItem({ name: "main-line", type: "line" }),
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        dependsOn: ["main-line"],
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Inputs")).toBeInTheDocument();
    expect(screen.getByText("main-line")).toBeInTheDocument();
    expect(screen.getByText(": line")).toBeInTheDocument();
  });

  it("displays no inputs message when no dependencies", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true, dependsOn: [] }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("No inputs")).toBeInTheDocument();
  });

  it("displays parameters with names, values, and types", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        parameterValues: { lx1: 10, ly1: 20, circleRadius: 5 },
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    const lx1Row = screen.getByText("lx1").parentElement;
    expect(lx1Row).toContainHTML("10");
    expect(lx1Row).toContainHTML("(number)");
    const ly1Row = screen.getByText("ly1").parentElement;
    expect(ly1Row).toContainHTML("20");
    expect(ly1Row).toContainHTML("(number)");
    const circleRadiusRow = screen.getByText("circleRadius").parentElement;
    expect(circleRadiusRow).toContainHTML("5");
    expect(circleRadiusRow).toContainHTML("(number)");
  });

  it("displays unknown type for unmapped parameters", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        parameterValues: { customParam: "value" },
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("customParam")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(screen.getByText("(unknown)")).toBeInTheDocument();
  });

  it("displays no parameters message when empty", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true, parameterValues: {} }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("No parameters")).toBeInTheDocument();
  });

  it("displays outputs from reverse dependencies", () => {
    const store = createMockStore({
      "main-line": createMockGeometryItem({ name: "main-line", selected: true, type: "line" }),
      "point-1": createMockGeometryItem({
        name: "point-1",
        dependsOn: ["main-line"],
        type: "point",
      }),
      "point-2": createMockGeometryItem({
        name: "point-2",
        dependsOn: ["main-line"],
        type: "point",
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Outputs")).toBeInTheDocument();
    expect(screen.getByText("point-1")).toBeInTheDocument();
    expect(screen.getByText("point-2")).toBeInTheDocument();
  });

  it("displays no outputs message when no reverse dependencies", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("No outputs")).toBeInTheDocument();
  });

  it("handles empty string stepId gracefully", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({ name: "point-1", selected: true, stepId: "" }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.queryByText("Created by step:")).not.toBeInTheDocument();
  });

  it("handles geometries with no dependencies", () => {
    const store = createMockStore({
      "main-line": createMockGeometryItem({
        name: "main-line",
        selected: true,
        dependsOn: [],
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("No inputs")).toBeInTheDocument();
  });

  it("handles geometries with no parameters", () => {
    const store = createMockStore({
      "main-line": createMockGeometryItem({
        name: "main-line",
        selected: true,
        parameterValues: {},
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("No parameters")).toBeInTheDocument();
  });

  it("handles missing dependency items gracefully", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        dependsOn: ["non-existent"],
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Inputs")).toBeInTheDocument();
  });

  it("displays boolean parameter values", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        parameterValues: { selectMinY: true },
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("selectMinY")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("(boolean)")).toBeInTheDocument();
  });

  it("handles empty dependsOn array", () => {
    const store = createMockStore({
      "point-1": createMockGeometryItem({
        name: "point-1",
        selected: true,
        dependsOn: [],
        parameterValues: {},
      }),
    });

    render(<GeometryDetails store={store} />);

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("No inputs")).toBeInTheDocument();
    expect(screen.getByText("No parameters")).toBeInTheDocument();
  });
});
