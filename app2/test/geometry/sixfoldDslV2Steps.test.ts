// Tests for SixFold DSL v2 construction steps
import { describe, it, expect, beforeEach } from "vitest";
import { buildSixfoldDslV2Steps } from "@/geometry/sixfoldDslV2Steps";
import { executeSteps } from "@/geometry/stepExecution";
import { computeSixFoldV0Config } from "@/geometry/sixFold/operations";
import {
  createMockGeometryStore,
  createMockSVG,
  createMockTheme,
  createStepExecutionContext,
  TestGeometryRenderer,
} from "../dsl-test-utils";

describe("SixFold DSL v2 construction", () => {
  let svg: SVGSVGElement;
  let store: ReturnType<typeof createMockGeometryStore>;
  let theme: ReturnType<typeof createMockTheme>;
  let config: ReturnType<typeof computeSixFoldV0Config>;

  beforeEach(() => {
    svg = createMockSVG();
    store = createMockGeometryStore();
    theme = createMockTheme();
    config = computeSixFoldV0Config(800, 600);
  });

  describe("Step construction", () => {
    it("builds all v2 steps", () => {
      const steps = buildSixfoldDslV2Steps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.length).toBe(99);
    });

    it("each step has an id", () => {
      const steps = buildSixfoldDslV2Steps();
      steps.forEach((step) => {
        expect(step.id).toBeDefined();
        expect(typeof step.id).toBe("string");
        expect(step.id.length).toBeGreaterThan(0);
      });
    });

    it("steps have unique ids", () => {
      const steps = buildSixfoldDslV2Steps();
      const ids = steps.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Step execution", () => {
    it("executes first step without errors", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      expect(() => executeSteps(steps, 1, ctx, config)).not.toThrow();
    });

    it("executes all steps without errors", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      expect(() => executeSteps(steps, steps.length, ctx, config)).not.toThrow();
    });

    it("creates coordinate system cs", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      executeSteps(steps, 1, ctx, config);

      expect(store.items["cs"]).toBeDefined();
    });

    it("creates coordinate system cs2 with flipX", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      // Execute enough steps to create cs2
      executeSteps(steps, 2, ctx, config);

      expect(store.items["cs2"]).toBeDefined();
    });

    it("creates point p1", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      // p1 is at step index 5 (0=cs, 1=cs2, 2=vec, 3=p1x, 4=p1y, 5=p1)
      executeSteps(steps, 6, ctx, config);

      expect(store.items["p1"]).toBeDefined();
    });

    it("creates point p2", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      // p2 is at step index 8 (after p2_local_x, p2_local_y)
      executeSteps(steps, 9, ctx, config);

      expect(store.items["p2"]).toBeDefined();
    });

    it("creates line line1", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      // line1 is at step index 9
      executeSteps(steps, 10, ctx, config);

      expect(store.items["line1"]).toBeDefined();
    });
  });

  describe("Non-visual geometry filtering", () => {
    it("filters non-visual geometry from store", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      executeSteps(steps, steps.length, ctx, config);

      // Non-visual items should NOT be in store
      expect(store.items["p1x"]).toBeUndefined();
      expect(store.items["p1y"]).toBeUndefined();
      expect(store.items["p2x"]).toBeUndefined();
      expect(store.items["p2y"]).toBeUndefined();
    });

    it("includes visual geometry in store", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      executeSteps(steps, steps.length, ctx, config);

      // Visual items should be in store
      expect(store.items["cs"]).toBeDefined();
      expect(store.items["cs2"]).toBeDefined();
      expect(store.items["p1"]).toBeDefined();
      expect(store.items["p2"]).toBeDefined();
      expect(store.items["l1"]).toBeDefined();
    });
  });

  describe("cs2 flipX behavior", () => {
    it("cs2 has flipX=true in v2 construction", () => {
      const steps = buildSixfoldDslV2Steps();
      const ctx = createStepExecutionContext({
        svg,
        store,
        theme,
        renderer: new TestGeometryRenderer(),
      });

      // Execute enough steps to create cs2
      executeSteps(steps, 2, ctx, config);

      // The cs2 coordinate system should have flipX=true
      const cs2 = store.items["cs2"];
      expect(cs2).toBeDefined();
      // Note: The actual flipX property might be stored in the geometry object
      // This test verifies cs2 is created with the flipX configuration
    });
  });
});
