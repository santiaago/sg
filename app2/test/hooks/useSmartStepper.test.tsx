import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Import types
import type { Step, GeometryValue } from "../../src/types/geometry";

// Import actual implementation
import { useSmartStepper } from "../../src/hooks/useSmartStepper";

// Helper to create minimal Step for testing
function createMockStep<TConfig>(id: string, isVisual = true): Step<TConfig> {
  return {
    id,
    inputs: [],
    outputs: [],
    isVisual,
    compute: () => new Map<string, GeometryValue>(),
    draw: () => {},
  };
}

// ============================================================================
// useSmartStepper Tests
// Tests use display-ready indexing: 0 = before first step, 1..N = visual steps
// ============================================================================

describe("useSmartStepper", () => {
  const steps: Step[] = [
    createMockStep("s1", true),
    createMockStep("s2", true),
    createMockStep("s3", false),
    createMockStep("s4", true),
    createMockStep("s5", false),
    createMockStep("s6", true),
  ];

  describe("initial state", () => {
    it("returns initial visual index 0 (before first step)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.currentVisualIndex).toBe(0);
    });

    it("returns correct visual step count", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.visualStepCount).toBe(4);
    });

    it("returns stepsUpToIndex 0 when at before first step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.stepsUpToIndex).toBe(0);
    });

    it("canGoNext is true at before first step when there are visual steps", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoNext).toBe(true);
    });

    it("canGoPrev is false at before first step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoPrev).toBe(false);
    });
  });

  describe("navigation - goToNext", () => {
    it("advances from before first (0) to first visual step (1)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("advances to second visual step (2)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToNext();
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(2);
    });

    it("skips non-visual steps when advancing", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      // Start at 0 (before first)
      // goToNext -> 1 (s1, actual index 0)
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);

      // goToNext -> 2 (s2, actual index 1)
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(2);

      // goToNext -> 3 (s4, actual index 3, skips s3 which is non-visual)
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(4);
    });

    it("does nothing at last visual step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      // Navigate to last visual step (4)
      act(() => {
        result.current.goToNext();
        result.current.goToNext();
        result.current.goToNext();
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(4);
      expect(result.current.stepsUpToIndex).toBe(6);

      // Try to go next - should stay at 4
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(4);
    });

    it("updates canGoNext correctly", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoNext).toBe(true);

      // Navigate to last visual step
      act(() => {
        result.current.goToNext();
        result.current.goToNext();
        result.current.goToNext();
        result.current.goToNext();
      });
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe("navigation - goToPrev", () => {
    it("goes from first visual step (1) to before first (0)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToNext(); // now at 1
      });
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
    });

    it("goes from second visual step (2) to first (1)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToNext();
        result.current.goToNext();
      });
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("skips non-visual steps when going backward", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      // Navigate to third visual step (3 = s4)
      act(() => {
        result.current.goToNext();
        result.current.goToNext();
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(4);

      // Go prev -> should go to second visual step (2 = s2)
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(2);
    });

    it("does nothing at before first step (0)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.currentVisualIndex).toBe(0);
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(0);
    });

    it("updates canGoPrev correctly", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      // At 0 (before first), canGoPrev is false
      expect(result.current.canGoPrev).toBe(false);

      // Go to first visual step
      act(() => {
        result.current.goToNext();
      });
      // At 1, canGoPrev is true
      expect(result.current.canGoPrev).toBe(true);

      // Go back to before first
      act(() => {
        result.current.goToPrev();
      });
      // At 0, canGoPrev is false
      expect(result.current.canGoPrev).toBe(false);
    });
  });

  describe("navigation - goToStep", () => {
    it("navigates to first visual step (1)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(1);
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("navigates to third visual step (3)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(3);
      });
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(4);
    });

    it("navigates to before first step (0)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(2);
      });
      act(() => {
        result.current.goToStep(0);
      });
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
    });

    it("clamps to last visual index when out of bounds above", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(10);
      });
      expect(result.current.currentVisualIndex).toBe(4);
      expect(result.current.stepsUpToIndex).toBe(6);
    });

    it("clamps to before first step (0) when negative", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(-5);
      });
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
    });

    it("clamps to valid range [0, visualStepCount]", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(-100);
      });
      expect(result.current.currentVisualIndex).toBe(0);
      act(() => {
        result.current.goToStep(100);
      });
      expect(result.current.currentVisualIndex).toBe(4);
    });

    it("navigates to last visual step using visualStepCount", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(result.current.visualStepCount);
      });
      expect(result.current.currentVisualIndex).toBe(4);
      expect(result.current.stepsUpToIndex).toBe(6);
    });
  });

  describe("boundary flags", () => {
    it("canGoNext is false at last visual step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(4);
      });
      expect(result.current.canGoNext).toBe(false);
    });

    it("canGoNext is true when not at last", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoNext).toBe(true);
    });

    it("canGoPrev is true at first visual step (can go to 0)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(1);
      });
      expect(result.current.canGoPrev).toBe(true);
    });

    it("canGoPrev is false at before first step (0)", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoPrev).toBe(false);
    });

    it("canGoPrev is true when not at first", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(2);
      });
      expect(result.current.canGoPrev).toBe(true);
    });

    it("canGoNext false and canGoPrev true for single step at display index 1", () => {
      const singleStep: Step[] = [createMockStep("s1", true)];
      const { result } = renderHook(() => useSmartStepper({ steps: singleStep }));
      // At before first (0), canGoNext is true
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);

      // Navigate to the only visual step (1)
      act(() => {
        result.current.goToNext();
      });
      // At last visual step (1), canGoNext is false, canGoPrev is true
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty steps array", () => {
      const { result } = renderHook(() => useSmartStepper({ steps: [] }));
      expect(result.current.visualStepCount).toBe(0);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("handles all non-visual steps", () => {
      const allNonVisual: Step[] = [
        createMockStep("nv1", false),
        createMockStep("nv2", false),
        createMockStep("nv3", false),
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: allNonVisual }));
      expect(result.current.visualStepCount).toBe(0);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("handles single visual step", () => {
      const singleStep: Step[] = [createMockStep("s1", true)];
      const { result } = renderHook(() => useSmartStepper({ steps: singleStep }));
      expect(result.current.visualStepCount).toBe(1);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);

      // Navigate to the only visual step
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(true);
    });

    it("handles all visual steps", () => {
      const allVisual: Step[] = [
        createMockStep("v1", true),
        createMockStep("v2", true),
        createMockStep("v3", true),
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: allVisual }));
      expect(result.current.visualStepCount).toBe(3);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
    });

    it("treats undefined isVisual as true", () => {
      const stepsWithUndefined: Step[] = [
        createMockStep("v1"), // isVisual undefined
        createMockStep("nv1", false),
        createMockStep("v2"), // isVisual undefined
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: stepsWithUndefined }));
      expect(result.current.visualStepCount).toBe(2);
    });

    it("navigates through mixed visual/non-visual steps", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));

      // Initial: display 0 (before first), stepsUpToIndex 0
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
      expect(result.current.canGoNext).toBe(true);
      expect(result.current.canGoPrev).toBe(false);

      // Next: display 1 (s1, actual index 0), stepsUpToIndex 1
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);

      // Next: display 2 (s2, actual index 1), stepsUpToIndex 2
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(2);

      // Next: display 3 (s4, actual index 3, skips s3), stepsUpToIndex 4
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(4);

      // Next: display 4 (s6, actual index 5, skips s5), stepsUpToIndex 6
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(4);
      expect(result.current.stepsUpToIndex).toBe(6);

      // Can't go next
      expect(result.current.canGoNext).toBe(false);

      // Prev: display 3 (s4), stepsUpToIndex 4
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(4);

      // Prev: display 2 (s2), stepsUpToIndex 2
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(2);

      // Prev: display 1 (s1), stepsUpToIndex 1
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(1);

      // Can still go prev to 0 (before first step)
      expect(result.current.canGoPrev).toBe(true);
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(0);
      // Now can't go prev
      expect(result.current.canGoPrev).toBe(false);
    });
  });
});
