// app2/src/geometry/renderers/svgRenderer.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SvgRenderer } from "./svgRenderer";
import { point, line, circle, polygon } from "../../types/geometry";

// Helper to create SVG element for testing
function createSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "800");
  svg.setAttribute("height", "600");
  return svg;
}

// Helper to create mock GeometryStore
function createMockStore(): any {
  return {
    add: vi.fn(),
    clear: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  };
}

describe("SvgRenderer", () => {
  let svg: SVGSVGElement;
  let renderer: SvgRenderer;

  beforeEach(() => {
    svg = createSvg();
    renderer = new SvgRenderer(svg);
  });

  describe("drawPoint", () => {
    it("should draw a point", () => {
      const p = point(100, 200);
      const el = renderer.drawPoint(p, { name: "test_point" });

      expect(el.tagName).toBe("circle");
      expect(el.getAttribute("cx")).toBe("100");
      expect(el.getAttribute("cy")).toBe("200");
      expect(el.getAttribute("r")).toBe("2"); // default stroke
      expect(el.getAttribute("data-name")).toBe("test_point");
      expect(el.getAttribute("stroke")).toBe("currentColor");
      expect(el.getAttribute("fill")).toBe("none");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom stroke", () => {
      const p = point(100, 200);
      const el = renderer.drawPoint(p, { stroke: 5 });
      expect(el.getAttribute("r")).toBe("5");
    });

    it("should draw without name", () => {
      const p = point(100, 200);
      const el = renderer.drawPoint(p);
      expect(el.getAttribute("data-name")).toBeNull();
    });
  });

  describe("drawLine", () => {
    it("should draw a line", () => {
      const l = line(100, 200, 300, 400);
      const el = renderer.drawLine(l, { name: "test_line" });

      expect(el.tagName).toBe("line");
      expect(el.getAttribute("x1")).toBe("100");
      expect(el.getAttribute("y1")).toBe("200");
      expect(el.getAttribute("x2")).toBe("300");
      expect(el.getAttribute("y2")).toBe("400");
      expect(el.getAttribute("data-name")).toBe("test_line");
      expect(el.getAttribute("stroke")).toBe("currentColor");
      expect(el.getAttribute("stroke-width")).toBe("0.5");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom stroke width", () => {
      const l = line(0, 0, 10, 10);
      const el = renderer.drawLine(l, { stroke: 2 });
      expect(el.getAttribute("stroke-width")).toBe("2");
    });

    it("should draw without name", () => {
      const l = line(0, 0, 10, 10);
      const el = renderer.drawLine(l);
      expect(el.getAttribute("data-name")).toBeNull();
    });
  });

  describe("drawCircle", () => {
    it("should draw a circle", () => {
      const c = circle(100, 200, 50);
      const el = renderer.drawCircle(c, { name: "test_circle" });

      expect(el.tagName).toBe("circle");
      expect(el.getAttribute("cx")).toBe("100");
      expect(el.getAttribute("cy")).toBe("200");
      expect(el.getAttribute("r")).toBe("50");
      expect(el.getAttribute("data-name")).toBe("test_circle");
      expect(el.getAttribute("stroke")).toBe("currentColor");
      expect(el.getAttribute("stroke-width")).toBe("0.5");
      expect(el.getAttribute("fill")).toBe("none");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom stroke width", () => {
      const c = circle(0, 0, 10);
      const el = renderer.drawCircle(c, { stroke: 3 });
      expect(el.getAttribute("stroke-width")).toBe("3");
    });

    it("should draw without name", () => {
      const c = circle(0, 0, 10);
      const el = renderer.drawCircle(c);
      expect(el.getAttribute("data-name")).toBeNull();
    });
  });

  describe("drawPolygon", () => {
    it("should draw a polygon", () => {
      const p = polygon([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const el = renderer.drawPolygon(p, { name: "test_polygon" });

      expect(el.tagName).toBe("polygon");
      expect(el.getAttribute("points")).toBe("0,0 100,0 100,100 0,100");
      expect(el.getAttribute("data-name")).toBe("test_polygon");
      expect(el.getAttribute("stroke")).toBe("currentColor");
      expect(el.getAttribute("stroke-width")).toBe("0.5");
      expect(el.getAttribute("fill")).toBe("none");
      expect(svg.contains(el)).toBe(true);
    });

    it("should use custom fill", () => {
      const p = polygon([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      const el = renderer.drawPolygon(p, { fill: "red" });
      expect(el.getAttribute("fill")).toBe("red");
    });

    it("should use custom stroke width", () => {
      const p = polygon([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      const el = renderer.drawPolygon(p, { stroke: 2 });
      expect(el.getAttribute("stroke-width")).toBe("2");
    });

    it("should draw without name", () => {
      const p = polygon([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      const el = renderer.drawPolygon(p);
      expect(el.getAttribute("data-name")).toBeNull();
    });
  });

  describe("clear", () => {
    it("should remove all children", () => {
      renderer.drawPoint(point(0, 0), { name: "p1" });
      renderer.drawPoint(point(10, 10), { name: "p2" });
      expect(svg.children).toHaveLength(2);

      renderer.clear();
      expect(svg.children).toHaveLength(0);
    });

    it("should allow drawing after clear", () => {
      renderer.drawPoint(point(0, 0), { name: "p1" });
      renderer.clear();
      const el = renderer.drawPoint(point(5, 5), { name: "p2" });
      expect(svg.children).toHaveLength(1);
      expect(el.getAttribute("cx")).toBe("5");
    });
  });

  describe("GeometryStore integration", () => {
    it("should register elements with store", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);

      rendererWithStore.drawPoint(point(0, 0), { name: "p1" });

      expect(mockStore.add).toHaveBeenCalledWith("p1", expect.any(SVGElement), "circle", []);
    });

    it("should register line with store", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);

      rendererWithStore.drawLine(line(0, 0, 10, 10), { name: "l1" });

      expect(mockStore.add).toHaveBeenCalledWith("l1", expect.any(SVGElement), "line", []);
    });

    it("should register circle with store", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);

      rendererWithStore.drawCircle(circle(0, 0, 5), { name: "c1" });

      expect(mockStore.add).toHaveBeenCalledWith("c1", expect.any(SVGElement), "circle", []);
    });

    it("should register polygon with store", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);

      rendererWithStore.drawPolygon(
        polygon([
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ]),
        { name: "poly1" },
      );

      expect(mockStore.add).toHaveBeenCalledWith("poly1", expect.any(SVGElement), "polygon", []);
    });

    it("should not register without name", () => {
      const mockStore = createMockStore();
      const rendererWithStore = new SvgRenderer(svg, mockStore);

      rendererWithStore.drawPoint(point(0, 0));

      expect(mockStore.add).not.toHaveBeenCalled();
    });

    it("should not register without store", () => {
      renderer.drawPoint(point(0, 0), { name: "p1" });
      // Should not throw, just not call store.add
    });
  });

  describe("drawConstruction", () => {
    it("should draw all geometries from construction", () => {
      const mockConstruction = {
        getValues: () => {
          const values = new Map<string, any>();
          values.set("p1", point(0, 0));
          values.set("l1", line(0, 0, 10, 10));
          values.set("c1", circle(5, 5, 3));
          return values;
        },
      };

      renderer.drawConstruction(mockConstruction);

      expect(svg.children).toHaveLength(3);
      expect(svg.children[0].tagName).toBe("circle"); // point
      expect(svg.children[1].tagName).toBe("line"); // line
      expect(svg.children[2].tagName).toBe("circle"); // circle
    });
  });

  describe("drawConstructionUpTo", () => {
    it("should draw only up to specified step", () => {
      const mockConstruction = {
        getSteps: () => [{ id: "p1" }, { id: "l1" }, { id: "c1" }],
        getValues: () => {
          const values = new Map<string, any>();
          values.set("p1", point(0, 0));
          values.set("l1", line(0, 0, 10, 10));
          values.set("c1", circle(5, 5, 3));
          return values;
        },
      };

      renderer.drawConstructionUpTo(mockConstruction, 1);

      expect(svg.children).toHaveLength(2);
    });

    it("should draw all steps when stepIndex exceeds count", () => {
      const mockConstruction = {
        getSteps: () => [{ id: "p1" }, { id: "l1" }],
        getValues: () => {
          const values = new Map<string, any>();
          values.set("p1", point(0, 0));
          values.set("l1", line(0, 0, 10, 10));
          return values;
        },
      };

      renderer.drawConstructionUpTo(mockConstruction, 10);

      expect(svg.children).toHaveLength(2);
    });

    it("should draw nothing for stepIndex -1", () => {
      const mockConstruction = {
        getSteps: () => [{ id: "p1" }],
        getValues: () => {
          const values = new Map<string, any>();
          values.set("p1", point(0, 0));
          return values;
        },
      };

      renderer.drawConstructionUpTo(mockConstruction, -1);

      expect(svg.children).toHaveLength(0);
    });
  });
});
