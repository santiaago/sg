import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Import types
import type { Step } from "../../src/types/geometry";

// Import actual implementation - will fail until module exists
// @ts-expect-error - module does not exist yet
import { useSmartStepper } from "../../src/hooks/useSmartStepper";
import type { UseSmartStepperResult } from "../../src/hooks/useSmartStepper";

// ============================================================================
// useSmartStepper Tests
// These tests document expected behavior and will FAIL until implementation exists
// ============================================================================

describe("useSmartStepper", () => {
  const steps: Step[] = [
    { id: "s1", isVisual: true },
    { id: "s2", isVisual: true },
    { id: "s3", isVisual: false },
    { id: "s4", isVisual: true },
    { id: "s5", isVisual: false },
    { id: "s6", isVisual: true },
  ];

  describe("initial state", () => {
    it("returns initial visual index 0", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.currentVisualIndex).toBe(0);
    });

    it("returns correct visual step count", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.visualStepCount).toBe(4);
    });

    it("returns correct stepsUpToIndex for visual index 0", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("allows custom initial visual index", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(4);
    });
  });

  describe("navigation - goToNext", () => {
    it("increments visual index", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(2);
    });

    it("skips non-visual steps", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 1 })
      );
      act(() => {
        result.current.goToNext();
      });
      // From visual index 1 (stepsUpToIndex 2), next visual is index 2 (stepsUpToIndex 4)
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(4);
    });

    it("does nothing at last visual step", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 3 })
      );
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.currentVisualIndex).toBe(3);
    });

    it("updates canGoNext correctly", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      expect(result.current.canGoNext).toBe(true);
      act(() => {
        result.current.goToNext();
      });
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe("navigation - goToPrev", () => {
    it("decrements visual index", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(2);
    });

    it("skips non-visual steps backward", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      act(() => {
        result.current.goToPrev();
      });
      // From visual index 2 (stepsUpToIndex 4), prev visual is index 1 (stepsUpToIndex 2)
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(2);
    });

    it("does nothing at first visual step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.currentVisualIndex).toBe(0);
    });

    it("updates canGoPrev correctly", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      expect(result.current.canGoPrev).toBe(true);
      act(() => {
        result.current.goToPrev();
      });
      act(() => {
        result.current.goToPrev();
      });
      expect(result.current.canGoPrev).toBe(false);
    });
  });

  describe("navigation - goToStep", () => {
    it("navigates to specific visual index", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(2);
      });
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(4);
    });

    it("maps visual index to correct stepsUpToIndex", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(3);
      });
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(6);
    });

    it("clamps to last visual index when out of bounds", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(10);
      });
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(6);
    });

    it("clamps to first visual index when negative", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(-5);
      });
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("clamps to valid range", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      act(() => {
        result.current.goToStep(-100);
      });
      expect(result.current.currentVisualIndex).toBe(0);
      act(() => {
        result.current.goToStep(100);
      });
      expect(result.current.currentVisualIndex).toBe(3);
    });
  });

  describe("boundary flags", () => {
    it("canGoNext is false at last visual step", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 3 })
      );
      expect(result.current.canGoNext).toBe(false);
    });

    it("canGoNext is true when not at last", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoNext).toBe(true);
    });

    it("canGoPrev is false at first visual step", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      expect(result.current.canGoPrev).toBe(false);
    });

    it("canGoPrev is true when not at first", () => {
      const { result } = renderHook(() =>
        useSmartStepper({ steps, initialVisualIndex: 2 })
      );
      expect(result.current.canGoPrev).toBe(true);
    });

    it("canGoNext and canGoPrev both false for single step", () => {
      const singleStep: Step[] = [{ id: "s1", isVisual: true }];
      const { result } = renderHook(() => useSmartStepper({ steps: singleStep }));
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty steps array", () => {
      const { result } = renderHook(() => useSmartStepper({ steps: [] }));
      expect(result.current.visualStepCount).toBe(0);
      expect(result.current.currentVisualIndex).toBe(-1);
      expect(result.current.stepsUpToIndex).toBe(-1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("handles all non-visual steps", () => {
      const allNonVisual: Step[] = [
        { id: "nv1", isVisual: false },
        { id: "nv2", isVisual: false },
        { id: "nv3", isVisual: false },
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: allNonVisual }));
      expect(result.current.visualStepCount).toBe(0);
      expect(result.current.currentVisualIndex).toBe(-1);
      expect(result.current.stepsUpToIndex).toBe(-1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("handles single visual step", () => {
      const singleStep: Step[] = [{ id: "s1", isVisual: true }];
      const { result } = renderHook(() => useSmartStepper({ steps: singleStep }));
      expect(result.current.visualStepCount).toBe(1);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrev).toBe(false);
    });

    it("handles all visual steps", () => {
      const allVisual: Step[] = [
        { id: "v1", isVisual: true },
        { id: "v2", isVisual: true },
        { id: "v3", isVisual: true },
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: allVisual }));
      expect(result.current.visualStepCount).toBe(3);
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(1);
    });

    it("treats undefined isVisual as true", () => {
      const stepsWithUndefined: Step[] = [
        { id: "v1" }, // isVisual undefined
        { id: "nv1", isVisual: false },
        { id: "v2" }, // isVisual undefined
      ];
      const { result } = renderHook(() => useSmartStepper({ steps: stepsWithUndefined }));
      expect(result.current.visualStepCount).toBe(2);
    });

    it("navigates through mixed visual/non-visual steps", () => {
      const { result } = renderHook(() => useSmartStepper({ steps }));
      
      // Initial: visual 0, stepsUpToIndex 1 (+1 for executeSteps exclusive bound)
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(1);

      // Next: visual 1, stepsUpToIndex 2
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(2);

      // Next: visual 2, stepsUpToIndex 4 (skips NV at 2)
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(4);

      // Next: visual 3, stepsUpToIndex 6 (skips NV at 4)
      act(() => result.current.goToNext());
      expect(result.current.currentVisualIndex).toBe(3);
      expect(result.current.stepsUpToIndex).toBe(6);

      // Can't go next
      expect(result.current.canGoNext).toBe(false);

      // Prev: visual 2, stepsUpToIndex 4
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(2);
      expect(result.current.stepsUpToIndex).toBe(4);

      // Prev: visual 1, stepsUpToIndex 2
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(1);
      expect(result.current.stepsUpToIndex).toBe(2);

      // Prev: visual 0, stepsUpToIndex 1
      act(() => result.current.goToPrev());
      expect(result.current.currentVisualIndex).toBe(0);
      expect(result.current.stepsUpToIndex).toBe(1);

      // Can't go prev
      expect(result.current.canGoPrev).toBe(false);
    });
  });
});
