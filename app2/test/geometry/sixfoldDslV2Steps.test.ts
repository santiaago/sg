// Integration tests for SixFold v2 construction
// Tests verify that v2 produces the expected mirrored geometry

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { computeSixFoldV0Config, type SixFoldV2Config } from "@/geometry/sixFold/operations";
import { buildSixfoldDslV2Steps } from "@/geometry/sixfoldDslV2Steps";

describe("SixFold v2 construction", () => {
  let config: SixFoldV2Config;
  let steps: ReturnType<typeof buildSixfoldDslV2Steps>;

  beforeEach(() => {
    // Create a standard configuration
    config = computeSixFoldV0Config(800, 600);
    steps = buildSixfoldDslV2Steps();
  });

  describe("Step count and structure", () => {
    it("has the expected number of steps", () => {
      // v2 should have 102 steps (same as v1)
      expect(steps.length).toBe(102);
    });

    it("has coordinate system steps", () => {
      const stepIds = steps.map((s) => s.id);
      expect(stepIds).toContain("step_cs");
      expect(stepIds).toContain("step_cs2");
    });

    it("has point steps for p1 and p2", () => {
      const stepIds = steps.map((s) => s.id);
      expect(stepIds).toContain("step_p1");
      expect(stepIds).toContain("step_p2");
    });
  });

  describe("Coordinate system flip configuration", () => {
    it("cs2 has flipX=true and flipY=false", () => {
      // Find the cs2 step
      const cs2Step = steps.find((s) => s.id === "step_cs2");
      expect(cs2Step).toBeDefined();

      // Execute the cs2 step to get its value
      const allValues = new Map<string, any>();
      for (const step of steps.slice(0, 2)) {
        // Only execute the first two steps (cs and cs2)
        const result = step.compute(allValues, config);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const cs2Value = allValues.get("cs2");
      expect(cs2Value).toBeDefined();
      expect(cs2Value.type).toBe("coordinate_system");
      expect(cs2Value.flipX).toBe(true);
      expect(cs2Value.flipY).toBe(false);
    });

    it("cs has default flip values", () => {
      // Execute the cs step to get its value
      const allValues = new Map<string, any>();
      const csStep = steps[0];
      const result = csStep.compute(allValues, config);
      for (const [key, value] of result) {
        allValues.set(key, value);
      }

      const csValue = allValues.get("cs");
      expect(csValue).toBeDefined();
      expect(csValue.type).toBe("coordinate_system");
      expect(csValue.flipX).toBe(false);
      expect(csValue.flipY).toBe(false);
    });
  });

  describe("Point positions in flipped coordinate system", () => {
    it("p1 is at cs2 origin (p2x, p2y) from config", () => {
      // Execute steps up to p1
      const allValues = new Map<string, any>();
      for (const step of steps.slice(0, 4)) {
        const result = step.compute(allValues, config);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const p1Value = allValues.get("p1");
      expect(p1Value).toBeDefined();
      expect(p1Value.type).toBe("point");

      // p1 should be at (p2x, p2y) from config
      expect(p1Value.x).toBeCloseTo(config.p2x, 0.001);
      expect(p1Value.y).toBeCloseTo(config.p2y, 0.001);
    });

    it("p2 is at (p1x, p1y) from config in flipped cs2", () => {
      // Execute steps up to p2
      const allValues = new Map<string, any>();
      for (const step of steps.slice(0, 5)) {
        const result = step.compute(allValues, config);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const p2Value = allValues.get("p2");
      expect(p2Value).toBeDefined();
      expect(p2Value.type).toBe("point");

      // p2 should be at (p1x, p1y) from config (swapped from v1)
      expect(p2Value.x).toBeCloseTo(config.p1x, 0.001);
      expect(p2Value.y).toBeCloseTo(config.p1y, 0.001);
    });
  });

  describe("Direction-based selections with relativeTo", () => {
    it("cp2 uses relativeTo cs2 for left selection", () => {
      // Find the cp2 step
      const cp2Step = steps.find((s) => s.id === "step_cp2");
      expect(cp2Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(cp2Step?.inputs).toContain("cs2");
    });

    it("pic12 uses relativeTo cs2 for north selection", () => {
      // Find the pic12 step
      const pic12Step = steps.find((s) => s.id === "step_pic12");
      expect(pic12Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pic12Step?.inputs).toContain("cs2");
    });

    it("pic14 uses relativeTo cs2 for west selection", () => {
      // Find the pic14 step
      const pic14Step = steps.find((s) => s.id === "step_pic14");
      expect(pic14Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pic14Step?.inputs).toContain("cs2");
    });

    it("pi3 uses relativeTo cs2 for east selection", () => {
      // Find the pi3 step
      const pi3Step = steps.find((s) => s.id === "step_pi3");
      expect(pi3Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pi3Step?.inputs).toContain("cs2");
    });

    it("pi4 uses relativeTo cs2 for east selection", () => {
      // Find the pi4 step
      const pi4Step = steps.find((s) => s.id === "step_pi4");
      expect(pi4Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pi4Step?.inputs).toContain("cs2");
    });

    it("pic23 uses relativeTo cs2 for right selection", () => {
      // Find the pic23 step
      const pic23Step = steps.find((s) => s.id === "step_pic23");
      expect(pic23Step).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pic23Step?.inputs).toContain("cs2");
    });

    it("pc34e uses relativeTo cs2 for right selection", () => {
      // Find the pc34e step
      const pc34eStep = steps.find((s) => s.id === "step_pc34e");
      expect(pc34eStep).toBeDefined();

      // The step should have cs2 as a dependency
      expect(pc34eStep?.inputs).toContain("cs2");
    });
  });

  describe("Full construction execution", () => {
    it("executes all steps without errors", () => {
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, config);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      // Check that we have the expected geometries
      expect(allValues.get("cs")).toBeDefined();
      expect(allValues.get("cs2")).toBeDefined();
      expect(allValues.get("p1")).toBeDefined();
      expect(allValues.get("p2")).toBeDefined();
      expect(allValues.get("line1")).toBeDefined();
      expect(allValues.get("c1")).toBeDefined();
      expect(allValues.get("cp2")).toBeDefined();
      expect(allValues.get("pic12")).toBeDefined();
    });

    it("produces mirrored geometry compared to v1", () => {
      const allValues = new Map<string, any>();

      // Execute all steps
      for (const step of steps) {
        const result = step.compute(allValues, config);
        for (const [key, value] of result) {
          allValues.set(key, value);
        }
      }

      const p1 = allValues.get("p1");
      const p2 = allValues.get("p2");

      // In v2, p1 should be at v1's p2 position and p2 should be at v1's p1 position
      // This is the mirroring effect
      expect(p1.x).toBeCloseTo(config.p2x, 0.001);
      expect(p1.y).toBeCloseTo(config.p2y, 0.001);
      expect(p2.x).toBeCloseTo(config.p1x, 0.001);
      expect(p2.y).toBeCloseTo(config.p1y, 0.001);
    });
  });
});
