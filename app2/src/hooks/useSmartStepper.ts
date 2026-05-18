/**
 * Smart stepper hook for navigating DSL construction steps.
 * Skips non-visual steps (those with isVisual === false) during navigation.
 * Maintains both visual step index (for UI) and stepsUpToIndex (for execution boundary).
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
  /** Initial visual step index (0-based among visual steps only) */
  initialVisualIndex?: number;
}

/**
 * Result of the useSmartStepper hook.
 */
export interface UseSmartStepperResult {
  /** Current visual step index (0-based among visual steps only) */
  currentVisualIndex: number;
  /** Total number of visual steps */
  visualStepCount: number;
  /** Execution boundary: stepsUpToIndex for exclusive upper bound (executes steps 0..N-1 for upToIndex=N) */
  stepsUpToIndex: number;
  /** Navigate to next visual step */
  goToNext: () => void;
  /** Navigate to previous visual step */
  goToPrev: () => void;
  /** Navigate to specific visual step index */
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
 * @param props - Hook props including steps array and optional initial visual index
 * @returns Object with navigation state and functions
 */
export function useSmartStepper<TConfig = unknown>({
  steps,
  initialVisualIndex = 0,
}: UseSmartStepperProps<TConfig>): UseSmartStepperResult {
  // Calculate derived values
  const visualStepCount = useMemo(() => getVisualStepCount(steps), [steps]);

  // Clamp initial visual index to valid range
  const clampedInitial = useMemo(() => {
    if (visualStepCount === 0) return -1;
    return Math.max(0, Math.min(initialVisualIndex, visualStepCount - 1));
  }, [initialVisualIndex, visualStepCount]);

  // State for current visual index
  const [currentVisualIndex, setCurrentVisualIndex] = useState<number>(clampedInitial);

  // Calculate execution boundary from visual index
  // executeSteps uses exclusive upper bound (executes steps 0..N-1 for upToIndex=N)
  const stepsUpToIndex = useMemo(() => {
    if (currentVisualIndex < 0) return -1;
    return getActualStepIndex(steps, currentVisualIndex) + 1;
  }, [steps, currentVisualIndex]);

  // Calculate navigation boundaries
  const canGoNext = useMemo(() => {
    return currentVisualIndex >= 0 && currentVisualIndex < visualStepCount - 1;
  }, [currentVisualIndex, visualStepCount]);

  const canGoPrev = useMemo(() => {
    return currentVisualIndex > 0;
  }, [currentVisualIndex]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentVisualIndex((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentVisualIndex((prev) => prev - 1);
    }
  }, [canGoPrev]);

  const goToStep = useCallback(
    (visualIndex: number) => {
      // Clamp to valid range
      if (visualStepCount === 0) {
        setCurrentVisualIndex(-1);
        return;
      }

      const clamped = Math.max(0, Math.min(visualIndex, visualStepCount - 1));
      setCurrentVisualIndex(clamped);
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
