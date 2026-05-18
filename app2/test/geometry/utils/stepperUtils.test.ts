import { describe, it, expect } from "vitest";

// Import types for type checking
import type { Step } from "../../../src/types/geometry";

// Import actual implementation - will fail until module exists
// @ts-expect-error - module does not exist yet
import {
  findNextVisualStep,
  findPrevVisualStep,
  getVisualStepIndex,
  getActualStepIndex,
  getVisualStepCount,
} from "../../../src/geometry/utils/stepperUtils";

// ============================================================================
// Stepper Utilities Tests
// These tests document expected behavior and will FAIL until implementation exists
// ============================================================================

describe("Stepper Utilities", () => {
  // Sample steps for testing: [V, V, NV, V, NV, V]
  // Actual indices:          0, 1, 2, 3, 4, 5
  // Visual indices:          0, 1,   2,   3
  const steps: Step[] = [
    { id: "s1", isVisual: true },
    { id: "s2", isVisual: true },
    { id: "s3", isVisual: false },
    { id: "s4", isVisual: true },
    { id: "s5", isVisual: false },
    { id: "s6", isVisual: true },
  ];

  describe("findNextVisualStep", () => {
    it("finds next visual step from index 0", () => {
      expect(findNextVisualStep(steps, 0)).toBe(1);
    });

    it("finds next visual step skipping non-visual", () => {
      expect(findNextVisualStep(steps, 1)).toBe(3);
    });

    it("finds next visual step from index 3", () => {
      expect(findNextVisualStep(steps, 3)).toBe(5);
    });

    it("returns same index when at last visual step", () => {
      expect(findNextVisualStep(steps, 5)).toBe(5);
    });

    it("returns same index when no next visual step exists", () => {
      const lastSteps: Step[] = [
        { id: "s1", isVisual: true },
        { id: "s2", isVisual: false },
      ];
      expect(findNextVisualStep(lastSteps, 0)).toBe(0);
    });
  });

  describe("findPrevVisualStep", () => {
    it("finds previous visual step from last", () => {
      expect(findPrevVisualStep(steps, 5)).toBe(3);
    });

    it("finds previous visual step skipping non-visual", () => {
      expect(findPrevVisualStep(steps, 3)).toBe(1);
    });

    it("finds previous visual step from index 1", () => {
      expect(findPrevVisualStep(steps, 1)).toBe(0);
    });

    it("returns same index when at first visual step", () => {
      expect(findPrevVisualStep(steps, 0)).toBe(0);
    });

    it("returns same index when at first step", () => {
      const firstSteps: Step[] = [
        { id: "s1", isVisual: false },
        { id: "s2", isVisual: true },
      ];
      expect(findPrevVisualStep(firstSteps, 1)).toBe(1);
    });
  });

  describe("getVisualStepIndex", () => {
    it("returns visual index for actual index 0", () => {
      expect(getVisualStepIndex(steps, 0)).toBe(0);
    });

    it("returns visual index for actual index 1", () => {
      expect(getVisualStepIndex(steps, 1)).toBe(1);
    });

    it("returns visual index for actual index 3 (skipping NV at 2)", () => {
      expect(getVisualStepIndex(steps, 3)).toBe(2);
    });

    it("returns visual index for actual index 5 (skipping NV at 2,4)", () => {
      expect(getVisualStepIndex(steps, 5)).toBe(3);
    });

    it("returns -1 for non-visual step", () => {
      expect(getVisualStepIndex(steps, 2)).toBe(-1);
    });

    it("returns -1 for non-visual step at index 4", () => {
      expect(getVisualStepIndex(steps, 4)).toBe(-1);
    });

    it("returns -1 for out of bounds actual index", () => {
      expect(getVisualStepIndex(steps, 10)).toBe(-1);
      expect(getVisualStepIndex(steps, -1)).toBe(-1);
    });
  });

  describe("getActualStepIndex", () => {
    it("returns actual index for visual index 0", () => {
      expect(getActualStepIndex(steps, 0)).toBe(0);
    });

    it("returns actual index for visual index 1", () => {
      expect(getActualStepIndex(steps, 1)).toBe(1);
    });

    it("returns actual index for visual index 2 (skipping NV)", () => {
      expect(getActualStepIndex(steps, 2)).toBe(3);
    });

    it("returns actual index for visual index 3", () => {
      expect(getActualStepIndex(steps, 3)).toBe(5);
    });

    it("returns -1 for out of bounds visual index", () => {
      expect(getActualStepIndex(steps, 4)).toBe(-1);
    });

    it("returns -1 for negative visual index", () => {
      expect(getActualStepIndex(steps, -1)).toBe(-1);
    });
  });

  describe("getVisualStepCount", () => {
    it("counts only visual steps", () => {
      expect(getVisualStepCount(steps)).toBe(4);
    });

    it("returns 0 for empty array", () => {
      expect(getVisualStepCount([])).toBe(0);
    });

    it("returns 0 for all non-visual steps", () => {
      const allNonVisual: Step[] = [
        { id: "nv1", isVisual: false },
        { id: "nv2", isVisual: false },
      ];
      expect(getVisualStepCount(allNonVisual)).toBe(0);
    });

    it("returns full count for all visual steps", () => {
      const allVisual: Step[] = [
        { id: "v1", isVisual: true },
        { id: "v2", isVisual: true },
        { id: "v3", isVisual: true },
      ];
      expect(getVisualStepCount(allVisual)).toBe(3);
    });

    it("counts visual steps when isVisual is undefined (defaults to true)", () => {
      const stepsWithUndefined: Step[] = [
        { id: "v1" }, // isVisual undefined = visual
        { id: "nv1", isVisual: false },
        { id: "v2" }, // isVisual undefined = visual
      ];
      expect(getVisualStepCount(stepsWithUndefined)).toBe(2);
    });
  });
});
