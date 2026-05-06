// Unit tests for SvgRenderer
// Note: These tests require a DOM environment (jsdom or browser)

import { describe, it, expect, beforeEach } from "vitest";
import { SvgRenderer, createTooltip } from "../../src/geometry/renderers/svgRenderer";
import type { Point, Line, Circle, Polygon } from "../../src/types/geometry";

// Mock SVG element for testing
class MockSVGElement {
  children: MockSVGElement[] = [];
  attributes: Record<string, string> = {};
  
  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }
  
  appendChild(child: MockSVGElement): void {
    this.children.push(child);
  }
  
  removeChild(child: MockSVGElement): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
  
  get firstChild(): MockSVGElement | null {
    return this.children[0] || null;
  }
}

// Helper to create a mock SVG element
function createMockSvg(): MockSVGElement {
  return new MockSVGElement();
}

describe("SvgRenderer", () => {
  let svg: MockSVGElement;
  let renderer: SvgRenderer;

  beforeEach(() => {
    svg = createMockSvg();
    renderer = new SvgRenderer(svg as unknown as SVGSVGElement);
  });

  describe("drawPoint()", () => {
    it("creates a circle element for point", () => {
      const point: Point = { type: "point", x: 10, y: 20 };
      renderer.drawPoint(point, { stroke: 2, name: "test-point" });
      
      expect(svg.children.length).toBe(1);
      const el = svg.children[0];
      expect(el.attributes["cx"]).toBe("10");
      expect(el.attributes["cy"]).toBe("20");
      expect(el.attributes["r"]).toBe("2");
      expect(el.attributes["data-name"]).toBe("test-point");
    });

    it("uses default stroke width", () => {
      const point: Point = { type: "point", x: 0, y: 0 };
      renderer.drawPoint(point);
      
      const el = svg.children[0];
      expect(el.attributes["r"]).toBe("2");
    });
  });

  describe("drawLine()", () => {
    it("creates a line element", () => {
      const line: Line = { type: "line", x1: 0, y1: 0, x2: 10, y2: 10 };
      renderer.drawLine(line, { stroke: 1, name: "test-line" });
      
      expect(svg.children.length).toBe(1);
      const el = svg.children[0];
      expect(el.attributes["x1"]).toBe("0");
      expect(el.attributes["y1"]).toBe("0");
      expect(el.attributes["x2"]).toBe("10");
      expect(el.attributes["y2"]).toBe("10");
      expect(el.attributes["stroke-width"]).toBe("1");
    });
  });

  describe("drawCircle()", () => {
    it("creates a circle element", () => {
      const circle: Circle = { type: "circle", cx: 5, cy: 5, r: 10 };
      renderer.drawCircle(circle, { stroke: 0.5, name: "test-circle" });
      
      expect(svg.children.length).toBe(1);
      const el = svg.children[0];
      expect(el.attributes["cx"]).toBe("5");
      expect(el.attributes["cy"]).toBe("5");
      expect(el.attributes["r"]).toBe("10");
      expect(el.attributes["stroke-width"]).toBe("0.5");
    });
  });

  describe("drawPolygon()", () => {
    it("creates a polygon element", () => {
      const polygon: Polygon = {
        type: "polygon",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
      };
      renderer.drawPolygon(polygon, { stroke: 0.5, fill: "none", name: "test-polygon" });
      
      expect(svg.children.length).toBe(1);
      const el = svg.children[0];
      expect(el.attributes["points"]).toBe("0,0 10,0 10,10 0,10");
      expect(el.attributes["fill"]).toBe("none");
    });
  });

  describe("clear()", () => {
    it("removes all children from SVG", () => {
      const point: Point = { type: "point", x: 0, y: 0 };
      renderer.drawPoint(point);
      renderer.drawPoint(point);
      expect(svg.children.length).toBe(2);
      
      renderer.clear();
      expect(svg.children.length).toBe(0);
    });
  });

  describe("getSvg() and setSvg()", () => {
    it("gets and sets SVG element", () => {
      const newSvg = createMockSvg();
      expect(renderer.getSvg()).toBe(svg);
      
      renderer.setSvg(newSvg as unknown as SVGSVGElement);
      expect(renderer.getSvg()).toBe(newSvg);
    });
  });
});

describe("createTooltip()", () => {
  it("creates tooltip and background elements", () => {
    const svg = createMockSvg();
    const { tooltip, tooltipBg } = createTooltip(
      svg as unknown as SVGSVGElement,
      100,
      100,
      "Test Tooltip",
      15,
    );
    
    expect(svg.children.length).toBe(2);
    expect(tooltipBg.attributes["fill"]).toBe("#333");
    expect(tooltip.attributes["fill"]).toBe("white");
  });
});
