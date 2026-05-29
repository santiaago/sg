// Unit tests for LineStyleOptions feature
// Tests: LineStyleOptions interface, LineExpression with styles, LineTowardsExpression with styles,
// renderer support for line styles, GeometryBuilder line() with style options

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers/DefaultRenderer";
import { TestGeometryRenderer, createTestContext, executeSteps } from "./dsl-test-utils";
import { GOLDEN_RATIO } from "@/geometry/operations";
import type { GeometryValue } from "@/types/geometry";
import type { LineStyleOptions } from "@/geometry/dsl/expressions/LineExpression";
import { LineExpression, LineTowardsExpression, PointExpression } from "@/geometry/dsl/expressions";

// Test configuration type
interface TestConfig {
  strokeWidth?: number;
  tolerance: number;
}

const defaultConfig: TestConfig = {
  tolerance: 0.001,
};

describe("LineStyleOptions", () => {
  // ========================================================================
  // LineStyleOptions Interface
  // ========================================================================

  describe("LineStyleOptions Interface", () => {
    it("has strokeWidth property", () => {
      const options: LineStyleOptions = { strokeWidth: 2 };
      expect(options.strokeWidth).toBe(2);
    });

    it("has strokeColor property as string", () => {
      const options: LineStyleOptions = { strokeColor: "#ff0000" };
      expect(options.strokeColor).toBe("#ff0000");
    });

    it("has strokeColor property as function", () => {
      const options: LineStyleOptions = {
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };
      expect(typeof options.strokeColor).toBe("function");
    });

    it("all properties are optional", () => {
      const options: LineStyleOptions = {};
      expect(options.strokeWidth).toBeUndefined();
      expect(options.strokeColor).toBeUndefined();
    });
  });

  // ========================================================================
  // LineExpression with Style Options
  // ========================================================================

  describe("LineExpression with Style Options", () => {
    let ctx: ReturnType<typeof createTestContext>;

    beforeEach(() => {
      ctx = createTestContext();
    });

    it("fromPoints accepts style options", () => {
      const p1 = new PointExpression("P1", 0, 0);
      const p2 = new PointExpression("P2", 100, 100);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      const line = LineExpression.fromPoints("L1", p1, p2, style);
      expect(line.getStyleOptions()).toEqual(style);
    });

    it("fromCoordinates accepts style options", () => {
      const style: LineStyleOptions = {
        strokeWidth: 3,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      const line = LineExpression.fromCoordinates("L1", 0, 0, 100, 100, style);
      expect(line.getStyleOptions()).toEqual(style);
    });

    it("getStyleOptions returns undefined when no options provided", () => {
      const p1 = new PointExpression("P1", 0, 0);
      const p2 = new PointExpression("P2", 100, 100);

      const line = LineExpression.fromPoints("L1", p1, p2);
      expect(line.getStyleOptions()).toBeUndefined();
    });

    it("compile passes style options to draw function", () => {
      const p1 = new PointExpression("P1", 0, 0);
      const p2 = new PointExpression("P2", 100, 100);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#00ff00",
      };

      const line = LineExpression.fromPoints("L1", p1, p2, style);
      const step = line.compile(ctx.renderer);

      // Verify the draw function is defined
      expect(typeof step.draw).toBe("function");
    });
  });

  // ========================================================================
  // LineTowardsExpression with Style Options
  // ========================================================================

  describe("LineTowardsExpression with Style Options", () => {
    let ctx: ReturnType<typeof createTestContext>;

    beforeEach(() => {
      ctx = createTestContext();
    });

    it("constructor accepts style options", () => {
      const start = new PointExpression("start", 0, 0);
      const end = new PointExpression("end", 1, 1);

      const style: LineStyleOptions = {
        strokeWidth: 2.5,
        strokeColor: "#0000ff",
      };

      const lineTowards = new LineTowardsExpression("LT1", start, end, 100, style);
      expect(lineTowards.getStyleOptions()).toEqual(style);
    });

    it("getStyleOptions returns undefined when no options provided", () => {
      const start = new PointExpression("start", 0, 0);
      const end = new PointExpression("end", 1, 1);

      const lineTowards = new LineTowardsExpression("LT1", start, end, 100);
      expect(lineTowards.getStyleOptions()).toBeUndefined();
    });

    it("compile passes style options to draw function", () => {
      const start = new PointExpression("start", 0, 0);
      const end = new PointExpression("end", 1, 1);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: (theme) => theme.COLOR_SECONDARY,
      };

      const lineTowards = new LineTowardsExpression("LT1", start, end, 100, style);
      const step = lineTowards.compile(ctx.renderer);

      expect(typeof step.draw).toBe("function");
    });
  });

  // ========================================================================
  // GeometryBuilder with Line Style Options
  // ========================================================================

  describe("GeometryBuilder with Line Style Options", () => {
    let builder: GeometryBuilder<TestConfig>;

    beforeEach(() => {
      builder = new GeometryBuilder<TestConfig>();
    });

    it("line() with points accepts style options", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      const line = builder.line("L1", p1, p2, style);
      expect(line.getStyleOptions()).toEqual(style);
    });

    it("line() with coordinates accepts style options", () => {
      const style: LineStyleOptions = {
        strokeWidth: 3,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      const line = builder.line("L1", 0, 0, 100, 100, style);
      expect(line.getStyleOptions()).toEqual(style);
    });

    it("line() without style options works as before", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      const line = builder.line("L1", p1, p2);
      expect(line.getStyleOptions()).toBeUndefined();
    });

    it("lineTowards() accepts style options", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);

      const style: LineStyleOptions = {
        strokeWidth: 2.5,
        strokeColor: "#0000ff",
      };

      const lineTowards = builder.lineTowards("LT1", start, end, 100, style);
      expect(lineTowards.getStyleOptions()).toEqual(style);
    });

    it("lineTowards() without style options works as before", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);

      const lineTowards = builder.lineTowards("LT1", start, end, 100);
      expect(lineTowards.getStyleOptions()).toBeUndefined();
    });

    it("compiles line with style options correctly", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      builder.line("L1", p1, p2, style);
      const steps = builder.compile();

      expect(steps.length).toBe(3); // P1, P2, L1
      const lineStep = steps.find((s) => s.id === "step_L1");
      expect(lineStep).toBeDefined();
    });

    it("compiles lineTowards with style options correctly", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);

      const style: LineStyleOptions = {
        strokeWidth: 2,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      builder.lineTowards("LT1", start, end, 100, style);
      const steps = builder.compile();

      expect(steps.length).toBe(3); // start, end, LT1
      const lineTowardsStep = steps.find((s) => s.id === "step_LT1");
      expect(lineTowardsStep).toBeDefined();
    });
  });

  // ========================================================================
  // TestGeometryRenderer with Line Style Options
  // ========================================================================

  describe("TestGeometryRenderer with Line Style Options", () => {
    let renderer: TestGeometryRenderer;
    let ctx: ReturnType<typeof createTestContext>;

    beforeEach(() => {
      renderer = new TestGeometryRenderer();
      ctx = { ...createTestContext(), renderer };
    });

    it("drawLine accepts style options parameter", () => {
      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      // Provide valid line geometry
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      // This should not throw
      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme, style);
      }).not.toThrow();
    });

    it("drawLine works without style options", () => {
      // Provide valid line geometry
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      // This should not throw (backward compatibility)
      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme);
      }).not.toThrow();
    });

    it("tracks line draws with style options", () => {
      const style: LineStyleOptions = {
        strokeWidth: 2,
        strokeColor: "#00ff00",
      };

      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme, style);

      expect(renderer.drawnLines).toContain("L1");
    });
  });

  // ========================================================================
  // DefaultGeometryRenderer with Line Style Options
  // ========================================================================

  describe("DefaultGeometryRenderer with Line Style Options", () => {
    let renderer: DefaultGeometryRenderer;
    let ctx: ReturnType<typeof createTestContext>;

    beforeEach(() => {
      renderer = new DefaultGeometryRenderer("test");
      ctx = createTestContext();
    });

    it("drawLine accepts style options parameter", () => {
      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      // Provide valid line geometry
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      // This should not throw
      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme, style);
      }).not.toThrow();
    });

    it("drawLine works without style options", () => {
      // Provide valid line geometry
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      // This should not throw (backward compatibility)
      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme);
      }).not.toThrow();
    });

    it("drawLine with string strokeColor renders correctly", () => {
      const style: LineStyleOptions = {
        strokeWidth: 3,
        strokeColor: "#00ff00",
      };

      const p1 = new PointExpression("P1", 0, 0);
      const p2 = new PointExpression("P2", 100, 100);
      const line = LineExpression.fromPoints("L1", p1, p2, style);

      const values = new Map<string, any>();
      values.set("L1", { x1: 0, y1: 0, x2: 100, y2: 100, type: "line" });

      expect(() => {
        const step = line.compile(renderer);
        step.draw(ctx.svg, values, ctx.store, ctx.theme);
      }).not.toThrow();
    });

    it("drawLine with function strokeColor renders correctly", () => {
      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      const p1 = new PointExpression("P1", 0, 0);
      const p2 = new PointExpression("P2", 100, 100);
      const line = LineExpression.fromPoints("L1", p1, p2, style);

      const values = new Map<string, any>();
      values.set("L1", { x1: 0, y1: 0, x2: 100, y2: 100, type: "line" });

      expect(() => {
        const step = line.compile(renderer);
        step.draw(ctx.svg, values, ctx.store, ctx.theme);
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe("Integration Tests", () => {
    let builder: GeometryBuilder<TestConfig>;

    beforeEach(() => {
      builder = new GeometryBuilder<TestConfig>();
    });

    it("executes line with style options", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };

      builder.line("L1", p1, p2, style);
      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.values.get("L1")).toBeDefined();
    });

    it("executes lineTowards with style options", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 0);

      const style: LineStyleOptions = {
        strokeWidth: 2,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      builder.lineTowards("LT1", start, end, 100, style);
      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.values.get("LT1")).toBeDefined();
    });

    it("executes mixed lines with and without style options", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      // Line without style
      builder.line("L1", p1, p2);

      // Line with style
      const style: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: "#ff0000",
      };
      builder.line("L2", p1, p2, style);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.values.get("L1")).toBeDefined();
      expect(result.values.get("L2")).toBeDefined();
    });

    it("executes sixfold outline pattern with style options", () => {
      // Simulate the sixfold outline pattern
      const pii1 = builder.point("pii1", 0, 0);
      const pic4 = builder.point("pic4", 100, 100);

      const outlineStyle: LineStyleOptions = {
        strokeWidth: GOLDEN_RATIO,
        strokeColor: (theme) => theme.COLOR_PRIMARY,
      };

      // Create outline lines with style (like in sixfoldDslSteps.ts)
      builder.line("outline1", pii1, pic4, outlineStyle);
      builder.line("outline2", pii1, pic4, outlineStyle);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.values.get("outline1")).toBeDefined();
      expect(result.values.get("outline2")).toBeDefined();
    });
  });

  // ========================================================================
  // Backward Compatibility
  // ========================================================================

  describe("Backward Compatibility", () => {
    let builder: GeometryBuilder<TestConfig>;

    beforeEach(() => {
      builder = new GeometryBuilder<TestConfig>();
    });

    it("all existing line() calls still work without style options", () => {
      const p1 = builder.point("P1", 0, 0);
      const p2 = builder.point("P2", 100, 100);

      // These should all work without style options
      builder.line("L1", p1, p2);
      builder.line("L2", 0, 0, 100, 100);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
    });

    it("all existing lineTowards() calls still work without style options", () => {
      const start = builder.point("start", 0, 0);
      const end = builder.point("end", 1, 1);

      builder.lineTowards("LT1", start, end, 100);

      const steps = builder.compile();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
    });

    it("renderer drawLine still works without style options", () => {
      const renderer = new DefaultGeometryRenderer("test");
      const ctx = createTestContext();

      // Provide valid line geometry
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme);
      }).not.toThrow();
    });

    it("TestGeometryRenderer drawLine still works without style options", () => {
      const renderer = new TestGeometryRenderer();
      const ctx = createTestContext();

      // TestGeometryRenderer doesn't validate, but provide valid geometry for consistency
      const values = new Map<string, GeometryValue>([
        ["L1", { type: "line" as const, x1: 0, y1: 0, x2: 100, y2: 100 }],
      ]);

      expect(() => {
        renderer.drawLine(ctx.svg, values, "L1", ctx.store, ctx.theme);
      }).not.toThrow();
    });
  });
});
