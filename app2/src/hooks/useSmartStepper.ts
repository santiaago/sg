/**
 * Smart stepper hook for navigating DSL construction steps.
 * Skips non-visual steps (those with isVisual === false) during navigation.
 * Maintains both visual step index (for UI) and stepsUpToIndex (for execution boundary).
 *
 * Uses display-ready indexing where:
 * - currentVisualIndex = 0 means "before first step" (no geometries executed)
 * - currentVisualIndex = N means "at Nth visual step" (1-indexed from caller perspective)
 * - Range: 0 to visualStepCount (inclusive)
 */

import { useState, useMemo, useCallback } from "react";
import type { Step } from "../types/geometry";
import { getActualStepIndex, getVisualStepCount } from "../geometry/utils/stepperUtils";

/**
 * Props for the useSmartStepper hook.
 */
export interface UseSmartStepperProps<TConfig = unknown> {
  /** All steps in the DSL construction */
  steps: Step<TConfig>[];
}

/**
 * Result of the useSmartStepper hook.
 * All visual indices are display-ready: 0 = before first step, 1..N = visual steps.
 */
export interface UseSmartStepperResult {
  /** Current visual step index (display-ready: 0 = before first, 1..N = visual steps) */
  currentVisualIndex: number;
  /** Total number of visual steps */
  visualStepCount: number;
  /** Execution boundary: stepsUpToIndex for exclusive upper bound (executes steps 0..N-1 for upToIndex=N) */
  stepsUpToIndex: number;
  /** Navigate to next visual step */
  goToNext: () => void;
  /** Navigate to previous visual step */
  goToPrev: () => void;
  /** Navigate to specific visual step index (display-ready: 0 = before first) */
  goToStep: (visualIndex: number) => void;
  /** Whether there is a next visual step available */
  canGoNext: boolean;
  /** Whether there is a previous visual step available */
  canGoPrev: boolean;
}

/**
 * Hook for smart stepping through DSL construction steps.
 * Skips non-visual steps and maintains mapping between visual and actual indices.
 *
 * Uses display-ready indexing internally. The hook always starts at "before first step" (0).
 * Navigation uses 0-based display indices where 0 = before first step.
 *
 * @param props - Hook props including steps array
 * @returns Object with navigation state and functions using display-ready indexing
 */
export function useSmartStepper<TConfig = unknown>({
  steps,
}: UseSmartStepperProps<TConfig>): UseSmartStepperResult {
  // Calculate derived values
  const visualStepCount = useMemo(() => getVisualStepCount(steps), [steps]);

  // Internal state uses -1-based indexing (-1 = before first, 0..N-1 = visual steps)
  // This is an implementation detail; the hook exposes display-ready 0-based indexing
  const [internalVisualIndex, setInternalVisualIndex] = useState<number>(-1);

  // Transform internal index to display-ready index for output
  // Display: 0 = before first, 1..visualStepCount = visual steps
  // Internal: -1 = before first, 0..visualStepCount-1 = visual steps
  const currentVisualIndex = useMemo(() => internalVisualIndex + 1, [internalVisualIndex]);

  // Calculate execution boundary from internal visual index
  // executeSteps uses exclusive upper bound (executes steps 0..N-1 for upToIndex=N)
  const stepsUpToIndex = useMemo(() => {
    if (internalVisualIndex < 0) return 0;
    return getActualStepIndex(steps, internalVisualIndex) + 1;
  }, [steps, internalVisualIndex]);

  // Calculate navigation boundaries using display-ready indices
  // canGoNext: true when display index < visualStepCount (can advance to next visual step)
  // canGoPrev: true when display index > 0 (can go back, including to before first)
  const canGoNext = useMemo(() => {
    return currentVisualIndex < visualStepCount;
  }, [currentVisualIndex, visualStepCount]);

  const canGoPrev = useMemo(() => {
    return currentVisualIndex > 0;
  }, [currentVisualIndex]);

  // Navigation functions - work with internal indices
  const goToNext = useCallback(() => {
    if (canGoNext) {
      setInternalVisualIndex((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      setInternalVisualIndex((prev) => prev - 1);
    }
  }, [canGoPrev]);

  const goToStep = useCallback(
    (displayVisualIndex: number) => {
      // Convert display index to internal index
      // Display: 0..visualStepCount -> Internal: -1..visualStepCount-1
      if (visualStepCount === 0) {
        setInternalVisualIndex(-1);
        return;
      }

      // Clamp display index to valid range [0, visualStepCount]
      let clampedDisplay = displayVisualIndex;
      if (displayVisualIndex < 0) {
        clampedDisplay = 0;
      } else if (displayVisualIndex > visualStepCount) {
        clampedDisplay = visualStepCount;
      }

      // Convert to internal index
      const internalIndex = clampedDisplay - 1;
      setInternalVisualIndex(internalIndex);
    },
    [visualStepCount],
  );

  return {
    currentVisualIndex,
    visualStepCount,
    stepsUpToIndex,
    goToNext,
    goToPrev,
    goToStep,
    canGoNext,
    canGoPrev,
  };
}

// Re-export utility function for convenience
export { getVisualStepCount };
