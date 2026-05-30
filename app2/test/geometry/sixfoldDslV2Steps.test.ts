// Tests for SixFold DSL v2 construction
import { describe, it, expect, beforeEach } from "vitest";
import { buildSixfoldDslV2Steps, DSL_SIXFOLD_V2_STEPS_LENGTH } from "@/geometry/sixfoldDslV2Steps";
import { computeSixFoldV0Config } from "@/geometry/sixFold/operations";
import { executeSteps } from "@/geometry/stepExecution";
import type { GeometryStore } from "@/react-store";
import { createMockGeometryStore as createMockStore, createMockSVG, createMockTheme } from "../dsl-test-utils";

// Use the mock utilities from dsl-test-utils

describe("buildSixfoldDslV2Steps", () => {
  let steps: ReturnType<typeof buildSixfoldDslV2Steps>;
  let config: ReturnType<typeof computeSixFoldV0Config>;

  beforeEach(() => {
    steps = buildSixfoldDslV2Steps();
    config = computeSixFoldV0Config(800, 600);
  });

  it("should return correct number of steps", () => {
    expect(steps.length).toBe(DSL_SIXFOLD_V2_STEPS_LENGTH);
  });

  it("should have all steps with valid IDs", () => {
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(typeof step.id).toBe("string");
    }
  });

  it("should have steps with compute and draw functions", () => {
    for (const step of steps) {
      expect(typeof step.compute).toBe("function");
      expect(typeof step.draw).toBe("function");
    }
  });

  it("should have cs2 coordinate system with flipX=true", () => {
    // Find the cs2 step
    const cs2Step = steps.find((s) => s.outputs.includes("cs2"));
    expect(cs2Step).toBeDefined();
    
    // Execute the cs2 step to verify it has flipX=true
    const mockStore = createMockStore();
    const svg = createMockSVG();
    const theme = createMockTheme();
    const allValues = executeSteps(steps, 2, { svg, store: mockStore, theme }, config);
    
    const cs2Value = allValues.get("cs2");
    expect(cs2Value).toBeDefined();
    if (cs2Value && cs2Value.type === "coordinate_system") {
      expect(cs2Value.flipX).toBe(true);
      expect(cs2Value.flipY).toBe(false);
      expect(cs2Value.rotation).toBe(0);
    }
  });

  it("should position cs2 at p2 location from config", () => {
    const mockStore = createMockStore();
    const svg = createMockSVG();
    const theme = createMockTheme();
    const allValues = executeSteps(steps, 2, { svg, store: mockStore, theme }, config);
    
    const cs2Value = allValues.get("cs2");
    expect(cs2Value).toBeDefined();
    if (cs2Value && cs2Value.type === "coordinate_system") {
      // cs2 should be at (p2x, p2y) from config
      expect(cs2Value.x).toBeCloseTo(config.p2x);
      expect(cs2Value.y).toBeCloseTo(config.p2y);
    }
  });

  it("should have p1 at cs2 origin in global space", () => {
    const mockStore = createMockStore();
    const svg = createMockSVG();
    const theme = createMockTheme();
    // Execute enough steps to get p1
    const allValues = executeSteps(steps, 5, { svg, store: mockStore, theme }, config);
    
    const p1Value = allValues.get("p1");
    expect(p1Value).toBeDefined();
    if (p1Value && p1Value.type === "point") {
      // p1 should be at (p2x, p2y) since it's at (0, 0) in cs2 which is at (p2x, p2y)
      expect(p1Value.x).toBeCloseTo(config.p2x);
      expect(p1Value.y).toBeCloseTo(config.p2y);
    }
  });

  it("should have p2 at p1 location from config (swapped)", () => {
    const mockStore = createMockStore();
    const svg = createMockSVG();
    const theme = createMockTheme();
    // Execute enough steps to get p2
    const allValues = executeSteps(steps, 5, { svg, store: mockStore, theme }, config);
    
    const p2Value = allValues.get("p2");
    expect(p2Value).toBeDefined();
    if (p2Value && p2Value.type === "point") {
      // p2 should be at (p1x, p1y) since it's swapped in the flipped coordinate system
      expect(p2Value.x).toBeCloseTo(config.p1x);
      expect(p2Value.y).toBeCloseTo(config.p1y);
    }
  });

  it("should execute all steps without errors", () => {
    const mockStore = createMockStore();
    const svg = createMockSVG();
    const theme = createMockTheme();
    
    // Execute all steps
    expect(() => {
      executeSteps(steps, steps.length, { svg, store: mockStore, theme }, config);
    }).not.toThrow();
  });
});

describe("DSL_SIXFOLD_V2_STEPS_LENGTH", () => {
  it("should be 102", () => {
    expect(DSL_SIXFOLD_V2_STEPS_LENGTH).toBe(102);
  });
});
