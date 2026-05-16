// Integration tests for ALL DSL SVG components filtering non-visual geometry
// Tests verify non-visual geometry is filtered from store in all DSL components

import { describe, it, expect, beforeEach } from "vitest";
import { buildSixfoldDslV1Steps } from "@/geometry/sixfoldDslV1Steps";
import { buildSixfoldDslSteps } from "@/geometry/sixfoldDslSteps";
import { buildSquareDslSteps } from "@/geometry/squareDslSteps";
import { executeSteps } from "@/geometry/stepExecution";
import { createMockGeometryStore, createMockSVG, createMockTheme, createStepExecutionContext } from "../../dsl-test-utils";
import { computeSixFoldV0Config } from "@/geometry/sixFold/operations";
import { computeSquareConfig } from "@/geometry/operations";
import type { SixFoldV0Config } from "@/geometry/sixFold/operations";
import type { SquareConfig } from "@/geometry/operations";

describe("All DSL components filter non-visual geometry", () => {
  let svg: SVGSVGElement;
  let store: ReturnType<typeof createMockGeometryStore>;
  let theme: ReturnType<typeof createMockTheme>;

  beforeEach(() => {
    svg = createMockSVG();
    store = createMockGeometryStore();
    theme = createMockTheme();
  });

  // ========================================================================
  // Non-visual geometry filtered from all components
  // ========================================================================

  describe("Non-visual geometry NOT in store for any DSL component", () => {
    it("SixFoldDslV1Svg filters all non-visual geometry", () => {
      const steps = buildSixfoldDslV1Steps();
      const config = computeSixFoldV0Config(800, 600);
      const ctx = createStepExecutionContext({ svg, store, theme });
      
      executeSteps(steps, 97, ctx, config); // Execute all steps
      
      // Non-visual items should NOT be in store
      expect(store.items["vec_cs2_to_cs"]).toBeUndefined();
      expect(store.items["p1_x"]).toBeUndefined();
      expect(store.items["p1_y"]).toBeUndefined();
      expect(store.items["p2_x"]).toBeUndefined();
      expect(store.items["p2_y"]).toBeUndefined();
      
      // Visual items should still be present
      expect(store.items["cs"]).toBeDefined();
      expect(store.items["cs2"]).toBeDefined();
      expect(store.items["p1"]).toBeDefined();
      expect(store.items["p2"]).toBeDefined();
    });

    it("SixFoldDslSvg filters all non-visual geometry", () => {
      const steps = buildSixfoldDslSteps();
      const config = computeSixFoldV0Config(800, 600);
      const ctx = createStepExecutionContext({ svg, store, theme });
      
      executeSteps(steps, 96, ctx, config as unknown as SixFoldV0Config);
      
      // Check that no items have null/undefined elements
      // (non-visual items would have been added via store.update but have no element)
      const itemsWithoutElements = Object.values(store.items).filter(
        (item) => item.element === null || item.element === undefined
      );
      
      expect(itemsWithoutElements.length).toBe(0);
      
      // All items should have defined elements
      Object.values(store.items).forEach((item) => {
        expect(item.element).not.toBeUndefined();
        expect(item.element).not.toBeNull();
      });
    });

    it("SquareDslSvg filters all non-visual geometry", () => {
      const steps = buildSquareDslSteps();
      const config = computeSquareConfig(800, 600);
      const ctx = createStepExecutionContext({ svg, store, theme });
      
      executeSteps(steps, steps.length, ctx, config as unknown as SquareConfig);
      
      // All items should have defined elements
      Object.values(store.items).forEach((item) => {
        expect(item.element).not.toBeUndefined();
        expect(item.element).not.toBeNull();
      });
    });

    it("All DSL components have consistent filtering behavior", () => {
      // Test all three DSLs and verify they all filter consistently
      const configs = {
        sixfoldv1: computeSixFoldV0Config(800, 600),
        sixfold: computeSixFoldV0Config(800, 600),
        square: computeSquareConfig(800, 600),
      };
      
      const stepsMap = {
        sixfoldv1: buildSixfoldDslV1Steps(),
        sixfold: buildSixfoldDslSteps(),
        square: buildSquareDslSteps(),
      };
      
      for (const [name, steps] of Object.entries(stepsMap)) {
        const config = configs[name as keyof typeof configs];
        const localStore = createMockGeometryStore();
        const ctx = createStepExecutionContext({ svg, store: localStore, theme });
        
        executeSteps(steps, steps.length, ctx, config as unknown as Record<string, unknown>);
        
        // All items should have elements (no non-visual items)
        Object.values(localStore.items).forEach((item) => {
          expect(item.element, `DSL ${name}: item ${item.name} has no element`).not.toBeUndefined();
          expect(item.element, `DSL ${name}: item ${item.name} has no element`).not.toBeNull();
        });
      }
    });
  });
});
