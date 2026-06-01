import { useState, useRef, useEffect, useCallback } from "react";
import type { UseSmartStepperResult } from "./useSmartStepper";
import type { GeometryStore } from "../react-store";
import type { Step } from "../types/geometry";

/**
 * Props for the useGeometrySectionPlayback hook.
 */
export interface UseGeometrySectionPlaybackProps {
  stepper: UseSmartStepperResult;
  store: GeometryStore;
  steps: readonly Step[];
}

/**
 * Result of the useGeometrySectionPlayback hook.
 */
export interface UseGeometrySectionPlaybackResult {
  restartKey: number;
  isPlaying: boolean;
  playIntervalRef: React.RefObject<ReturnType<typeof setInterval> | null>;
  currentVisualIndexRef: React.RefObject<number>;
  visualStepCountRef: React.RefObject<number>;
  handleNextClick: () => void;
  handlePrevClick: () => void;
  handleFirstStep: () => void;
  handleLastStep: () => void;
  handlePlayClick: () => void;
  resetRestartKey: () => void;
}

/**
 * Hook for managing play/pause/step navigation for a geometry section.
 * Encapsulates the interval-based playback logic and step navigation handlers.
 *
 * @param props - Hook props including stepper result and store
 * @returns Object with playback state, refs, and handlers
 */
export function useGeometrySectionPlayback({
  stepper,
  store,
  steps,
}: UseGeometrySectionPlaybackProps): UseGeometrySectionPlaybackResult {
  const {
    currentVisualIndex,
    visualStepCount,
    stepsUpToIndex,
    goToNext,
    goToPrev,
    goToStep,
    canGoNext,
    canGoPrev,
  } = stepper;

  // State for playback
  const [restartKey, setRestartKey] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs to track latest stepper state for interval callbacks (avoid stale closures)
  const currentVisualIndexRef = useRef<number>(currentVisualIndex);
  const visualStepCountRef = useRef<number>(visualStepCount);

  // Keep refs in sync with latest stepper state
  useEffect(() => {
    currentVisualIndexRef.current = currentVisualIndex;
  }, [currentVisualIndex]);

  useEffect(() => {
    visualStepCountRef.current = visualStepCount;
  }, [visualStepCount]);

  // Handler for next click
  const handleNextClick = useCallback((): void => {
    // Stop playing if user manually clicks
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    }
    if (canGoNext) {
      goToNext();
    }
  }, [isPlaying, canGoNext, goToNext]);

  // Handler for prev click
  const handlePrevClick = useCallback((): void => {
    // Stop playing if user manually clicks
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    }
    if (canGoPrev) {
      goToPrev();
    }
  }, [isPlaying, canGoPrev, goToPrev]);

  // Handler for first step
  const handleFirstStep = useCallback((): void => {
    // Stop playing when jumping to first step
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    }
    store.clear();
    goToStep(0);
    setRestartKey((prev) => prev + 1);
  }, [isPlaying, store, goToStep]);

  // Handler for last step
  const handleLastStep = useCallback((): void => {
    // Stop playing when jumping to end
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    }
    store.clear();
    goToStep(visualStepCount);
    setRestartKey((prev) => prev + 1);
  }, [isPlaying, store, goToStep, visualStepCount]);

  // Handler for play click
  const handlePlayClick = useCallback((): void => {
    if (isPlaying) {
      // Stop playing
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      // Reset to 0 if at the end
      if (stepsUpToIndex >= steps.length) {
        goToStep(0);
      }
      // Start playing
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        // Use refs to get latest state and avoid stale closure
        const currentIndex = currentVisualIndexRef.current;
        const totalVisualSteps = visualStepCountRef.current;

        if (currentIndex > 0 && currentIndex < totalVisualSteps) {
          goToNext();
        } else {
          // Stop when reaching the end
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          setIsPlaying(false);
        }
      }, 200); // 200ms delay between steps
    }
  }, [isPlaying, stepsUpToIndex, steps.length, goToStep, goToNext]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, []);

  // Helper to reset restart key (for external use if needed)
  const resetRestartKey = useCallback((): void => {
    setRestartKey((prev) => prev + 1);
  }, []);

  return {
    restartKey,
    isPlaying,
    playIntervalRef,
    currentVisualIndexRef,
    visualStepCountRef,
    handleNextClick,
    handlePrevClick,
    handleFirstStep,
    handleLastStep,
    handlePlayClick,
    resetRestartKey,
  };
}
