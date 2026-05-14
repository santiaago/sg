import { useEffect, useRef } from "react";
import type { Theme } from "../themes";

/**
 * Options for the useThemeAwareSteps hook.
 */
export interface UseThemeAwareStepsOptions {
  currentStep: number;
  restartTrigger: number;
  theme: Theme;
}

/**
 * Result from the useThemeAwareSteps hook.
 */
export interface UseThemeAwareStepsResult {
  /** Whether geometry and store should be cleared (going backwards, restarting, or theme changed) */
  shouldClear: boolean;
}

/**
 * Custom hook that tracks step, restart, and theme changes to determine when to clear geometry.
 *
 * This hook encapsulates the logic for detecting when the SVG canvas needs to be
 * redrawn due to:
 * - Going backwards in steps (currentStep < previousStep)
 * - Restarting the construction (restartTrigger changed from previous value)
 * - Theme change (theme object reference changed)
 *
 * @param options - Configuration options containing currentStep, restartTrigger, and theme
 * @returns Object containing shouldClear boolean
 *
 * @example
 * ```tsx
 * const { shouldClear } = useThemeAwareSteps({
 *   currentStep,
 *   restartTrigger,
 *   theme,
 * });
 *
 * useEffect(() => {
 *   if (shouldClear) {
 *     clearGeometryFromSvg(svg);
 *     store.clear();
 *   }
 * }, [shouldClear]);
 * ```
 */
export function useThemeAwareSteps({
  currentStep,
  restartTrigger,
  theme,
}: UseThemeAwareStepsOptions): UseThemeAwareStepsResult {
  const prevStepRef = useRef<number>(0);
  const prevRestartTriggerRef = useRef<number>(0);
  const prevThemeRef = useRef<Theme>(theme);

  // Track whether we should clear geometry and store
  const shouldClear =
    currentStep < prevStepRef.current ||
    restartTrigger !== prevRestartTriggerRef.current ||
    prevThemeRef.current !== theme;

  // Update refs after computing shouldClear
  useEffect(() => {
    prevStepRef.current = currentStep;
    prevRestartTriggerRef.current = restartTrigger;
    prevThemeRef.current = theme;
  }, [currentStep, restartTrigger, theme]);

  return { shouldClear };
}
