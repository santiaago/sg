/**
 * Stepper utility functions for navigating between visual steps in DSL construction.
 * These functions handle the mapping between actual step indices and visual step indices,
 * where visual steps are those with `isVisual !== false`.
 */

import type { Step } from "../../types/geometry";

/**
 * Finds the next visual step after the given index.
 * If the current step is the last visual step, returns the current index.
 * Skips non-visual steps (those with isVisual === false or undefined defaults to true).
 *
 * @param steps - Array of all steps
 * @param fromIndex - Current step index to start searching from
 * @returns Index of the next visual step, or current index if at the end
 */
export function findNextVisualStep<TConfig = unknown>(steps: Step<TConfig>[], fromIndex: number): number {
  // Clamp fromIndex to valid range
  const clampedIndex = Math.max(0, Math.min(fromIndex, steps.length - 1));
  
  // Start searching from the next index
  for (let i = clampedIndex + 1; i < steps.length; i++) {
    if (steps[i].isVisual !== false) {
      return i;
    }
  }
  
  // No next visual step found, return current
  return clampedIndex;
}

/**
 * Finds the previous visual step before the given index.
 * If the current step is the first visual step, returns the current index.
 * Skips non-visual steps (those with isVisual === false or undefined defaults to true).
 *
 * @param steps - Array of all steps
 * @param fromIndex - Current step index to start searching from
 * @returns Index of the previous visual step, or current index if at the beginning
 */
export function findPrevVisualStep<TConfig = unknown>(steps: Step<TConfig>[], fromIndex: number): number {
  // Clamp fromIndex to valid range
  const clampedIndex = Math.max(0, Math.min(fromIndex, steps.length - 1));
  
  // Start searching from the previous index
  for (let i = clampedIndex - 1; i >= 0; i--) {
    if (steps[i].isVisual !== false) {
      return i;
    }
  }
  
  // No previous visual step found, return current
  return clampedIndex;
}

/**
 * Gets the visual step index for a given actual step index.
 * Returns -1 if the step is non-visual or out of bounds.
 *
 * @param steps - Array of all steps
 * @param actualIndex - The actual step index to look up
 * @returns Visual step index (0-indexed among visual steps only), or -1 if not found
 */
export function getVisualStepIndex<TConfig = unknown>(steps: Step<TConfig>[], actualIndex: number): number {
  if (actualIndex < 0 || actualIndex >= steps.length) {
    return -1;
  }
  
  // Check if this step is non-visual
  if (steps[actualIndex].isVisual === false) {
    return -1;
  }
  
  // Count visual steps up to and including actualIndex
  let visualCount = 0;
  for (let i = 0; i <= actualIndex; i++) {
    if (steps[i].isVisual !== false) {
      visualCount++;
    }
  }
  
  return visualCount - 1; // Convert count to 0-indexed
}

/**
 * Gets the actual step index for a given visual step index.
 * Returns -1 if the visual index is out of bounds.
 *
 * @param steps - Array of all steps
 * @param visualIndex - The visual step index to look up
 * @returns Actual step index, or -1 if not found
 */
export function getActualStepIndex<TConfig = unknown>(steps: Step<TConfig>[], visualIndex: number): number {
  if (visualIndex < 0) {
    return -1;
  }
  
  // Find the nth visual step
  let visualCount = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].isVisual !== false) {
      if (visualCount === visualIndex) {
        return i;
      }
      visualCount++;
    }
  }
  
  // Visual index out of bounds
  return -1;
}

/**
 * Counts the number of visual steps in the array.
 * Steps with isVisual === false are excluded.
 * Steps with isVisual === undefined are counted as visual (default true).
 *
 * @param steps - Array of all steps
 * @returns Count of visual steps
 */
export function getVisualStepCount<TConfig = unknown>(steps: Step<TConfig>[]): number {
  let count = 0;
  for (const step of steps) {
    if (step.isVisual !== false) {
      count++;
    }
  }
  return count;
}
