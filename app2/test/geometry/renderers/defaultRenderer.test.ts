// Unit tests for DefaultRenderer type validation
// Tests that FAIL before implementation (documenting current silent failures)
// and PASS after implementation (loud failures)

import { describe, it, expect, beforeEach } from "vitest";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers/DefaultRenderer";
import { createMockGeometryStore, createMockSVG, createMockTheme } from "../../dsl-test-utils";
import { point, line, circle, polygon, coordinateSystem } from "@/types/geometry";

describe("DefaultRenderer - type validation", () => {
  let renderer: DefaultGeometryRenderer;
  let svg: SVGSVGElement;
  let store: ReturnType<typeof createMockGeometryStore>;
  let theme: ReturnType<typeof createMockTheme>;

  beforeEach(() => {
    renderer = new DefaultGeometryRenderer();
    svg = createMockSVG();
    store = createMockGeometryStore();
    theme = createMockTheme();
  });

  // ========================================================================
  // SHOULD FAIL: Current behavior silently ignores wrong/missing types
  // ========================================================================

  describe("SHOULD FAIL: Silent failures on wrong types (current behavior)", () => {
    it("drawPoint silently accepts line geometry", () => {
      const values = new Map<string, unknown>([
        ["line-as-point", line(0, 0, 100, 100)],
      ]);
      
      // Current BAD behavior: silently returns without error or element
      expect(() => {
        renderer.drawPoint(svg, values, "line-as-point", store, theme);
      }).not.toThrow();
    });

    it("drawPoint silently accepts null/undefined geometry", () => {
      const values = new Map<string, unknown>([]);
      
      expect(() => {
        renderer.drawPoint(svg, values, "missing", store, theme);
      }).not.toThrow();
    });

    it("drawLine silently accepts point geometry", () => {
      const values = new Map<string, unknown>([
        ["point-as-line", point(50, 50)],
      ]);
      
      expect(() => {
        renderer.drawLine(svg, values, "point-as-line", store, theme);
      }).not.toThrow();
    });

    it("drawLine silently accepts null/undefined geometry", () => {
      const values = new Map<string, unknown>([]);
      
      expect(() => {
        renderer.drawLine(svg, values, "missing", store, theme);
      }).not.toThrow();
    });

    it("drawCircle silently accepts polygon geometry", () => {
      const values = new Map<string, unknown>([
        ["polygon-as-circle", polygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }])],
      ]);
      
      expect(() => {
        renderer.drawCircle(svg, values, "polygon-as-circle", store, theme);
      }).not.toThrow();
    });

    it("drawCircle silently accepts null/undefined geometry", () => {
      const values = new Map<string, unknown>([]);
      
      expect(() => {
        renderer.drawCircle(svg, values, "missing", store, theme);
      }).not.toThrow();
    });

    it("drawPolygon silently accepts circle geometry", () => {
      const values = new Map<string, unknown>([
        ["circle-as-polygon", circle(50, 50, 25)],
      ]);
      
      expect(() => {
        renderer.drawPolygon(svg, values, "circle-as-polygon", store, theme);
      }).not.toThrow();
    });

    it("drawPolygon silently accepts null/undefined geometry", () => {
      const values = new Map<string, unknown>([]);
      
      expect(() => {
        renderer.drawPolygon(svg, values, "missing", store, theme);
      }).not.toThrow();
    });

    it("drawCoordinateSystem silently accepts point geometry", () => {
      const values = new Map<string, unknown>([
        ["point-as-cs", point(50, 50)],
      ]);
      
      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "point-as-cs", store, theme);
      }).not.toThrow();
    });

    it("drawCoordinateSystem silently accepts null/undefined geometry", () => {
      const values = new Map<string, unknown>([]);
      
      expect(() => {
        renderer.drawCoordinateSystem(svg, values, "missing", store, theme);
      }).not.toThrow();
    });
  });

  // ========================================================================
  // WILL PASS AFTER FIX: Loud failures on wrong/missing types
  // ========================================================================

  describe("WILL PASS AFTER FIX: Loud failures on wrong/missing types", () => {
    describe("drawPoint validation", () => {
      it("throws when geometry not found", () => {
        const values = new Map<string, unknown>([]);
        
        expect(() => {
          renderer.drawPoint(svg, values, "missing", store, theme);
        }).toThrow("drawPoint: geometry 'missing' not found in values");
      });

      it("throws when geometry is line", () => {
        const values = new Map<string, unknown>([
          ["line-as-point", line(0, 0, 100, 100)],
        ]);
        
        expect(() => {
          renderer.drawPoint(svg, values, "line-as-point", store, theme);
        }).toThrow("drawPoint: geometry 'line-as-point' is line, expected point");
      });

      it("throws when geometry is circle", () => {
        const values = new Map<string, unknown>([
          ["circle-as-point", circle(50, 50, 25)],
        ]);
        
        expect(() => {
          renderer.drawPoint(svg, values, "circle-as-point", store, theme);
        }).toThrow("drawPoint: geometry 'circle-as-point' is circle, expected point");
      });

      it("throws when geometry is coordinate_system", () => {
        const values = new Map<string, unknown>([
          ["cs-as-point", coordinateSystem(0, 0, 100, 0)],
        ]);
        
        expect(() => {
          renderer.drawPoint(svg, values, "cs-as-point", store, theme);
        }).toThrow("drawPoint: geometry 'cs-as-point' is coordinate_system, expected point");
      });

      it("accepts valid point geometry", () => {
        const values = new Map<string, unknown>([
          ["valid-point", point(50, 50)],
        ]);
        
        expect(() => {
          renderer.drawPoint(svg, values, "valid-point", store, theme);
        }).not.toThrow();
      });
    });

    describe("drawLine validation", () => {
      it("throws when geometry not found", () => {
        const values = new Map<string, unknown>([]);
        
        expect(() => {
          renderer.drawLine(svg, values, "missing", store, theme);
        }).toThrow("drawLine: geometry 'missing' not found in values");
      });

      it("throws when geometry is point", () => {
        const values = new Map<string, unknown>([
          ["point-as-line", point(50, 50)],
        ]);
        
        expect(() => {
          renderer.drawLine(svg, values, "point-as-line", store, theme);
        }).toThrow("drawLine: geometry 'point-as-line' is point, expected line");
      });

      it("throws when geometry is circle", () => {
        const values = new Map<string, unknown>([
          ["circle-as-line", circle(50, 50, 25)],
        ]);
        
        expect(() => {
          renderer.drawLine(svg, values, "circle-as-line", store, theme);
        }).toThrow("drawLine: geometry 'circle-as-line' is circle, expected line");
      });

      it("accepts valid line geometry", () => {
        const values = new Map<string, unknown>([
          ["valid-line", line(0, 0, 100, 100)],
        ]);
        
        expect(() => {
          renderer.drawLine(svg, values, "valid-line", store, theme);
        }).not.toThrow();
      });
    });

    describe("drawCircle validation", () => {
      it("throws when geometry not found", () => {
        const values = new Map<string, unknown>([]);
        
        expect(() => {
          renderer.drawCircle(svg, values, "missing", store, theme);
        }).toThrow("drawCircle: geometry 'missing' not found in values");
      });

      it("throws when geometry is point", () => {
        const values = new Map<string, unknown>([
          ["point-as-circle", point(50, 50)],
        ]);
        
        expect(() => {
          renderer.drawCircle(svg, values, "point-as-circle", store, theme);
        }).toThrow("drawCircle: geometry 'point-as-circle' is point, expected circle");
      });

      it("throws when geometry is line", () => {
        const values = new Map<string, unknown>([
          ["line-as-circle", line(0, 0, 100, 100)],
        ]);
        
        expect(() => {
          renderer.drawCircle(svg, values, "line-as-circle", store, theme);
        }).toThrow("drawCircle: geometry 'line-as-circle' is line, expected circle");
      });

      it("accepts valid circle geometry", () => {
        const values = new Map<string, unknown>([
          ["valid-circle", circle(50, 50, 25)],
        ]);
        
        expect(() => {
          renderer.drawCircle(svg, values, "valid-circle", store, theme);
        }).not.toThrow();
      });
    });

    describe("drawPolygon validation", () => {
      it("throws when geometry not found", () => {
        const values = new Map<string, unknown>([]);
        
        expect(() => {
          renderer.drawPolygon(svg, values, "missing", store, theme);
        }).toThrow("drawPolygon: geometry 'missing' not found in values");
      });

      it("throws when geometry is point", () => {
        const values = new Map<string, unknown>([
          ["point-as-polygon", point(50, 50)],
        ]);
        
        expect(() => {
          renderer.drawPolygon(svg, values, "point-as-polygon", store, theme);
        }).toThrow("drawPolygon: geometry 'point-as-polygon' is point, expected polygon");
      });

      it("throws when geometry is line", () => {
        const values = new Map<string, unknown>([
          ["line-as-polygon", line(0, 0, 100, 100)],
        ]);
        
        expect(() => {
          renderer.drawPolygon(svg, values, "line-as-polygon", store, theme);
        }).toThrow("drawPolygon: geometry 'line-as-polygon' is line, expected polygon");
      });

      it("accepts valid polygon geometry", () => {
        const values = new Map<string, unknown>([
          ["valid-polygon", polygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }])],
        ]);
        
        expect(() => {
          renderer.drawPolygon(svg, values, "valid-polygon", store, theme);
        }).not.toThrow();
      });
    });

    describe("drawCoordinateSystem validation", () => {
      it("throws when geometry not found", () => {
        const values = new Map<string, unknown>([]);
        
        expect(() => {
          renderer.drawCoordinateSystem(svg, values, "missing", store, theme);
        }).toThrow("drawCoordinateSystem: geometry 'missing' not found in values");
      });

      it("throws when geometry is point", () => {
        const values = new Map<string, unknown>([
          ["point-as-cs", point(50, 50)],
        ]);
        
        expect(() => {
          renderer.drawCoordinateSystem(svg, values, "point-as-cs", store, theme);
        }).toThrow("drawCoordinateSystem: geometry 'point-as-cs' is point, expected coordinate_system");
      });

      it("throws when geometry is line", () => {
        const values = new Map<string, unknown>([
          ["line-as-cs", line(0, 0, 100, 100)],
        ]);
        
        expect(() => {
          renderer.drawCoordinateSystem(svg, values, "line-as-cs", store, theme);
        }).toThrow("drawCoordinateSystem: geometry 'line-as-cs' is line, expected coordinate_system");
      });

      it("accepts valid coordinate_system geometry", () => {
        const values = new Map<string, unknown>([
          ["valid-cs", coordinateSystem(0, 0, 100, 0)],
        ]);
        
        expect(() => {
          renderer.drawCoordinateSystem(svg, values, "valid-cs", store, theme);
        }).not.toThrow();
      });
    });
  });
});
