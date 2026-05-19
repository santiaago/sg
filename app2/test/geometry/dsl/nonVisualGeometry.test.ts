// Integration tests for non-visual geometry filtering
// Tests verify non-visual geometry is NOT added to store.items

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers/DefaultRenderer";
import {
  createMockGeometryStore,
  createMockSVG,
  createMockTheme,
  createStepExecutionContext,
  TestGeometryRenderer,
} from "../../dsl-test-utils";
import { executeSteps } from "@/geometry/stepExecution";

// Test configuration type matching SixFoldV0Config
interface TestConfig {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  coordinateSystemArrowLength: number;
  radius: number;
  cp1OffsetRatio: number;
}

const defaultConfig: TestConfig = {
  p1x: 173,
  p1y: 346,
  p2x: 667,
  p2y: 346,
  coordinateSystemArrowLength: 21.625,
  radius: 100,
  cp1OffsetRatio: 0.5,
};

describe("Non-visual geometry filtering", () => {
  let builder: GeometryBuilder<TestConfig>;
  let svg: SVGSVGElement;
  let store: ReturnType<typeof createMockGeometryStore>;
  let theme: ReturnType<typeof createMockTheme>;

  beforeEach(() => {
    builder = new GeometryBuilder<TestConfig>(new DefaultGeometryRenderer());
    svg = createMockSVG();
    store = createMockGeometryStore();
    theme = createMockTheme();
  });

  // ========================================================================
  // Helper: Build steps similar to SixFold DSL v1
  // ========================================================================

  function buildTestSteps() {
    // Coordinate systems
    const cs = builder.coordinateSystem(
      "cs",
      0,
      0,
      builder.param("coordinateSystemArrowLength"),
      0,
    );
    const cs2 = builder.coordinateSystem(
      "cs2",
      builder.param("p1x"),
      builder.param("p1y"),
      builder.param("coordinateSystemArrowLength"),
      0,
    );

    // Vector - NON-VISUAL
    const vec_cs2_to_cs = builder.vector("vec_cs2_to_cs", cs2, cs);

    // Arithmetic expressions - NON-VISUAL
    const p1_x = builder.add("p1_x", builder.param("p1x"), vec_cs2_to_cs.dx);
    const p1_y = builder.add("p1_y", builder.param("p1y"), vec_cs2_to_cs.dy);
    const p2_x = builder.add("p2_x", builder.param("p2x"), vec_cs2_to_cs.dx);
    const p2_y = builder.add("p2_y", builder.param("p2y"), vec_cs2_to_cs.dy);

    // Points - VISUAL
    const p1 = builder.pointInCs("p1", cs2, p1_x.value, p1_y.value);
    const p2 = builder.pointInCs("p2", cs2, p2_x.value, p2_y.value);

    // Line - VISUAL
    builder.line("line1", p1, p2);

    // Distance - NON-VISUAL
    builder.distance("dist_p1_p2", p1, p2);

    return builder.compile();
  }

  // ========================================================================
  // Helper: Execute steps and check store
  // ========================================================================

  function executeAndGetStore(steps: ReturnType<typeof buildTestSteps>, numSteps: number) {
    const ctx = createStepExecutionContext({
      svg,
      store,
      theme,
      renderer: new TestGeometryRenderer(),
    });
    executeSteps(steps, numSteps, ctx, defaultConfig);
    return store.items;
  }

  // ========================================================================
  // Non-visual geometry NOT in store
  // ========================================================================

  describe("Non-visual geometry NOT in store.items after filtering", () => {
    it("VectorExpression NOT in store.items after execution", () => {
      const steps = buildTestSteps();
      const items = executeAndGetStore(steps, 8); // Execute enough steps to include vec_cs2_to_cs

      expect(items["vec_cs2_to_cs"]).toBeUndefined();
    });

    it("AddExpression NOT in store.items after execution", () => {
      const steps = buildTestSteps();
      const items = executeAndGetStore(steps, 10); // Execute enough steps to include p1_x, p1_y

      expect(items["p1_x"]).toBeUndefined();
      expect(items["p1_y"]).toBeUndefined();
      expect(items["p2_x"]).toBeUndefined();
      expect(items["p2_y"]).toBeUndefined();
    });

    it("DistanceExpression NOT in store.items after execution", () => {
      const steps = buildTestSteps();
      const items = executeAndGetStore(steps, 12); // Execute all steps including distance

      expect(items["dist_p1_p2"]).toBeUndefined();
    });

    it("Visual geometry still in store.items after execution", () => {
      const steps = buildTestSteps();
      const items = executeAndGetStore(steps, 12);

      // Visual geometry should still be present
      expect(items["cs"]).toBeDefined();
      expect(items["cs2"]).toBeDefined();
      expect(items["p1"]).toBeDefined();
      expect(items["p2"]).toBeDefined();
      expect(items["line1"]).toBeDefined();

      // And they should have elements
      expect(items["cs"]?.element).toBeDefined();
      expect(items["cs2"]?.element).toBeDefined();
      expect(items["p1"]?.element).toBeDefined();
      expect(items["p2"]?.element).toBeDefined();
      expect(items["line1"]?.element).toBeDefined();
    });

    it("All non-visual expressions filtered from store", () => {
      const steps = buildTestSteps();
      const items = executeAndGetStore(steps, 12);

      const nonVisualIds = ["vec_cs2_to_cs", "p1_x", "p1_y", "p2_x", "p2_y", "dist_p1_p2"];
      const visualIds = ["cs", "cs2", "p1", "p2", "line1"];

      nonVisualIds.forEach((id) => {
        expect(items[id]).toBeUndefined();
      });

      visualIds.forEach((id) => {
        expect(items[id]).toBeDefined();
      });
    });
  });
});
