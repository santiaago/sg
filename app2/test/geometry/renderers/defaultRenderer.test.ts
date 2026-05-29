// Unit tests for DefaultRenderer type validation and current step highlighting
// Tests verify loud failures on wrong/missing geometry types
// Tests verify green highlight applied when stepId matches currentStepId
// TODO: Add integration tests for DSL SVG components to verify done-state behavior

import { describe, it, expect, beforeEach } from "vitest";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers/DefaultRenderer";
import { createMockGeometryStore, createMockSVG, createMockTheme } from "../../dsl-test-utils";
import { point, line, circle, polygon, coordinateSystem } from "@/types/geometry";
import type { GeometryValue } from "@/types/geometry";

describe("DefaultRenderer - type validation", () => {
  let renderer: DefaultGeometryRenderer;
  let svg: SVGSVGElement;
  let store: ReturnType<typeof createMockGeometryStore>;
  let theme: ReturnType<typeof createMockTheme>;

  beforeEach(() => {
    renderer = new DefaultGeometryRenderer("test");
    svg = createMockSVG();
    store = createMockGeometryStore();
    theme = createMockTheme();
  });

  describe("drawPoint validation", () => {
    it("throws when geometry not found", () => {
      const values = new Map<string, GeometryValue>([]);

      expect(() => {
        renderer.drawPoint(svg, values, "missing", store, theme);
      }).toThrow("drawPoint: geometry 'missing' not found in values");
    });

    it("throws when geometry is line", () => {
      const values = new Map<string, GeometryValue>([["line-as-point", line(0, 0, 100, 100)]]);

      expect(() => {
        renderer.drawPoint(svg, values, "line-as-point", store, theme);
      }).toThrow("drawPoint: geometry 'line-as-point' is line, expected point");
    });

    it("throws when geometry is circle", () => {
      const values = new Map<string, GeometryValue>([["circle-as-point", circle(50, 50, 25)]]);

      expect(() => {
        renderer.drawPoint(svg, values, "circle-as-point", store, theme);
      }).toThrow("drawPoint: geometry 'circle-as-point' is circle, expected point");
    });

    it("throws when geometry is coordinate_system", () => {
      const values = new Map<string, GeometryValue>([
        ["cs-as-point", coordinateSystem(0, 0, 100, 0)],
      ]);

      expect(() => {
        renderer.drawPoint(svg, values, "cs-as-point", store, theme);
      }).toThrow("drawPoint: geometry 'cs-as-point' is coordinate_system, expected point");
    });

    it("accepts valid point geometry", () => {
      const values = new Map<string, GeometryValue>([["valid-point", point(50, 50)]]);

      expect(() => {
        renderer.drawPoint(svg, values, "valid-point", store, theme);
      }).not.toThrow();
    });
  });

  describe("drawLine validation", () => {
    it("throws when geometry not found", () => {
      const values = new Map<string, GeometryValue>([]);

      expect(() => {
        renderer.drawLine(svg, values, "missing", store, theme);
      }).toThrow("drawLine: geometry 'missing' not found in values");
    });

    it("throws when geometry is point", () => {
      const values = new Map<string, GeometryValue>([["point-as-line", point(50, 50)]]);

      expect(() => {
        renderer.drawLine(svg, values, "point-as-line", store, theme);
      }).toThrow("drawLine: geometry 'point-as-line' is point, expected line");
    });

    it("throws when geometry is circle", () => {
      const values = new Map<string, GeometryValue>([["circle-as-line", circle(50, 50, 25)]]);

      expect(() => {
        renderer.drawLine(svg, values, "circle-as-line", store, theme);
      }).toThrow("drawLine: geometry 'circle-as-line' is circle, expected line");
    });

    it("accepts valid line geometry", () => {
      const values = new Map<string, GeometryValue>([["valid-line", line(0, 0, 100, 100)]]);

      expect(() => {
        renderer.drawLine(svg, values, "valid-line", store, theme);
      }).not.toThrow();
    });
  });

  describe("drawCircle validation", () => {
    it("throws when geometry not found", () => {
      const values = new Map<string, GeometryValue>([]);

      expect(() => {
        renderer.drawCircle(svg, values, "missing", store, theme);
      }).toThrow("drawCircle: geometry 'missing' not found in values");
    });

    it("throws when geometry is point", () => {
      const values = new Map<string, GeometryValue>([["point-as-circle", point(50, 50)]]);

      expect(() => {
        renderer.drawCircle(svg, values, "point-as-circle", store, theme);
      }).toThrow("drawCircle: geometry 'point-as-circle' is point, expected circle");
    });

    it("throws when geometry is line", () => {
      const values = new Map<string, GeometryValue>([["line-as-circle", line(0, 0, 100, 100)]]);

      expect(() => {
        renderer.drawCircle(svg, values, "line-as-circle", store, theme);
      }).toThrow("drawCircle: geometry 'line-as-circle' is line, expected circle");
    });

    it("accepts valid circle geometry", () => {
      const values = new Map<string, GeometryValue>([["valid-circle", circle(50, 50, 25)]]);

      expect(() => {
        renderer.drawCircle(svg, values, "valid-circle", store, theme);
      }).not.toThrow();
    });
  });

  describe("drawPolygon validation", () => {
    it("throws when geometry not found", () => {
      const values = new Map<string, GeometryValue>([]);

      expect(() => {
        renderer.drawPolygon(svg, values, "missing", store, theme);
      }).toThrow("drawPolygon: geometry 'missing' not found in values");
    });

    it("throws when geometry is point", () => {
      const values = new Map<string, GeometryValue>([["point-as-polygon", point(50, 50)]]);

      expect(() => {
        renderer.drawPolygon(svg, values, "point-as-polygon", store, theme);
      }).toThrow("drawPolygon: geometry 'point-as-polygon' is point, expected polygon");
    });

    it("throws when geometry is line", () => {
      const values = new Map<string, GeometryValue>([["line-as-polygon", line(0, 0, 100, 100)]]);

      expect(() => {
        renderer.drawPolygon(svg, values, "line-as-polygon", store, theme);
      }).toThrow("drawPolygon: geometry 'line-as-polygon' is line, expected polygon");
    });

    it("accepts valid polygon geometry", () => {
      const values = new Map<string, GeometryValue>([
        [
          "valid-polygon",
          polygon([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ]),
        ],
      ]);

      expect(() => {
        renderer.drawPolygon(svg, values, "valid-polygon", store, theme);
      }).not.toThrow();
    });
  });

  describe("drawCoordinateSystem validation", () => {
    it("throws when geometry not found", () => {
      const values = new Map<string, GeometryValue>([]);

      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "missing", store, theme);
      }).toThrow("drawCoordinateSystem: geometry 'missing' not found in values");
    });

    it("throws when geometry is point", () => {
      const values = new Map<string, GeometryValue>([["point-as-cs", point(50, 50)]]);

      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "point-as-cs", store, theme);
      }).toThrow(
        "drawCoordinateSystem: geometry 'point-as-cs' is point, expected coordinate_system",
      );
    });

    it("throws when geometry is line", () => {
      const values = new Map<string, GeometryValue>([["line-as-cs", line(0, 0, 100, 100)]]);

      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "line-as-cs", store, theme);
      }).toThrow("drawCoordinateSystem: geometry 'line-as-cs' is line, expected coordinate_system");
    });

    it("accepts valid coordinate_system geometry", () => {
      const values = new Map<string, GeometryValue>([["valid-cs", coordinateSystem(0, 0, 100, 0)]]);

      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "valid-cs", store, theme);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Current Step Highlighting Tests
  // ==========================================================================

  describe("currentStepId management", () => {
    it("should have empty currentStepId by default", () => {
      const renderer = new DefaultGeometryRenderer("test");
      expect(renderer.getCurrentStepId()).toBe("");
    });

    it("should set and get currentStepId", () => {
      const renderer = new DefaultGeometryRenderer("test");
      renderer.setCurrentStepId("step_foo");
      expect(renderer.getCurrentStepId()).toBe("step_foo");
    });

    it("should clear currentStepId when set to empty string", () => {
      const renderer = new DefaultGeometryRenderer("test");
      renderer.setCurrentStepId("step_foo");
      renderer.setCurrentStepId("");
      expect(renderer.getCurrentStepId()).toBe("");
    });
  });

  describe("current step highlighting - point", () => {
    it("should apply green fill when stepId matches currentStepId", () => {
      renderer.setCurrentStepId("step_testPoint");
      const values = new Map<string, GeometryValue>([["testPoint", point(50, 50)]]);

      renderer.drawPoint(svg, values, "testPoint", store, theme, "step_testPoint");

      const circle = svg.querySelector("circle");
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute("fill")).toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green fill when stepId does NOT match", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([["testPoint", point(50, 50)]]);

      renderer.drawPoint(svg, values, "testPoint", store, theme, "step_testPoint");

      const circle = svg.querySelector("circle");
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute("fill")).not.toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green fill when currentStepId is empty", () => {
      renderer.setCurrentStepId("");
      const values = new Map<string, GeometryValue>([["testPoint", point(50, 50)]]);

      renderer.drawPoint(svg, values, "testPoint", store, theme, "step_testPoint");

      const circle = svg.querySelector("circle");
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute("fill")).not.toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green fill when stepId is undefined", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([["testPoint", point(50, 50)]]);

      renderer.drawPoint(svg, values, "testPoint", store, theme, undefined);

      const circle = svg.querySelector("circle");
      expect(circle).not.toBeNull();
      expect(circle?.getAttribute("fill")).not.toBe(theme.COLOR_CURRENT_STEP);
    });
  });

  describe("current step highlighting - line", () => {
    it("should apply green stroke when stepId matches currentStepId", () => {
      renderer.setCurrentStepId("step_testLine");
      const values = new Map<string, GeometryValue>([["testLine", line(0, 0, 100, 100)]]);

      renderer.drawLine(svg, values, "testLine", store, theme, undefined, "step_testLine");

      const lineEl = svg.querySelector("line");
      expect(lineEl).not.toBeNull();
      expect(lineEl?.getAttribute("stroke")).toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green stroke when stepId does NOT match", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([["testLine", line(0, 0, 100, 100)]]);

      renderer.drawLine(svg, values, "testLine", store, theme, undefined, "step_testLine");

      const lineEl = svg.querySelector("line");
      expect(lineEl).not.toBeNull();
      expect(lineEl?.getAttribute("stroke")).not.toBe(theme.COLOR_CURRENT_STEP);
    });
  });

  describe("current step highlighting - circle", () => {
    it("should apply green stroke when stepId matches currentStepId", () => {
      renderer.setCurrentStepId("step_testCircle");
      const values = new Map<string, GeometryValue>([["testCircle", circle(50, 50, 25)]]);

      renderer.drawCircle(svg, values, "testCircle", store, theme, "step_testCircle");

      const circleEl = svg.querySelector("circle");
      expect(circleEl).not.toBeNull();
      expect(circleEl?.getAttribute("stroke")).toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green stroke when stepId does NOT match", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([["testCircle", circle(50, 50, 25)]]);

      renderer.drawCircle(svg, values, "testCircle", store, theme, "step_testCircle");

      const circleEl = svg.querySelector("circle");
      expect(circleEl).not.toBeNull();
      expect(circleEl?.getAttribute("stroke")).not.toBe(theme.COLOR_CURRENT_STEP);
    });
  });

  describe("current step highlighting - polygon", () => {
    it("should apply green stroke when stepId matches currentStepId", () => {
      renderer.setCurrentStepId("step_testPoly");
      const values = new Map<string, GeometryValue>([
        [
          "testPoly",
          polygon([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ]),
        ],
      ]);

      renderer.drawPolygon(svg, values, "testPoly", store, theme, undefined, "step_testPoly");

      const polygonEl = svg.querySelector("polygon");
      expect(polygonEl).not.toBeNull();
      expect(polygonEl?.getAttribute("stroke")).toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green stroke when stepId does NOT match", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([
        [
          "testPoly",
          polygon([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 10 },
          ]),
        ],
      ]);

      renderer.drawPolygon(svg, values, "testPoly", store, theme, undefined, "step_testPoly");

      const polygonEl = svg.querySelector("polygon");
      expect(polygonEl).not.toBeNull();
      expect(polygonEl?.getAttribute("stroke")).not.toBe(theme.COLOR_CURRENT_STEP);
    });
  });

  describe("current step highlighting - coordinate system", () => {
    it("should apply green stroke when stepId matches currentStepId", () => {
      renderer.setCurrentStepId("step_testCs");
      const values = new Map<string, GeometryValue>([["testCs", coordinateSystem(0, 0, 100, 0)]]);

      renderer.drawCoordinateSystem(svg, values, "testCs", store, theme, "step_testCs");

      const g = svg.querySelector("g");
      expect(g).not.toBeNull();
      // CS draws lines with stroke - check first line child
      const lineEl = g?.querySelector("line");
      expect(lineEl).not.toBeNull();
      expect(lineEl?.getAttribute("stroke")).toBe(theme.COLOR_CURRENT_STEP);
    });

    it("should NOT apply green stroke when stepId does NOT match", () => {
      renderer.setCurrentStepId("step_other");
      const values = new Map<string, GeometryValue>([["testCs", coordinateSystem(0, 0, 100, 0)]]);

      renderer.drawCoordinateSystem(svg, values, "testCs", store, theme, "step_testCs");

      const g = svg.querySelector("g");
      expect(g).not.toBeNull();
      const lineEl = g?.querySelector("line");
      expect(lineEl).not.toBeNull();
      expect(lineEl?.getAttribute("stroke")).not.toBe(theme.COLOR_CURRENT_STEP);
    });
  });
});
