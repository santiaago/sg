import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGeometrySectionPlayback } from "../../src/hooks/useGeometrySectionPlayback";
import type { UseSmartStepperResult } from "../../src/hooks/useSmartStepper";
import type { GeometryStore } from "../../src/react-store";

// Mock store
const createMockStore = (): GeometryStore => {
  const items: Record<string, unknown> = {};
  return {
    get items() {
      return items;
    },
    add: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(() => {
      Object.keys(items).forEach((key) => delete items[key]);
    }),
  };
};

// Mock stepper
const createMockStepper = (overrides: Partial<UseSmartStepperResult> = {}): UseSmartStepperResult => ({
  currentVisualIndex: 0,
  visualStepCount: 10,
  stepsUpToIndex: 0,
  goToStep: vi.fn(),
  goToNext: vi.fn(),
  goToPrev: vi.fn(),
  canGoNext: true,
  canGoPrev: false,
  steps: [{ id: "step1" }, { id: "step2" }],
  ...overrides,
});

// Helper to advance timers
const advanceTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("useGeometrySectionPlayback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with restartKey 0 and not playing", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    expect(result.current.restartKey).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it("handleNextClick calls goToNext when canGoNext is true", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({ canGoNext: true });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handleNextClick();
    });

    expect(mockStepper.goToNext).toHaveBeenCalled();
  });

  it("handleNextClick stops playing and clears interval", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({ canGoNext: true });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    // Start playing
    act(() => {
      result.current.handlePlayClick();
    });
    expect(result.current.isPlaying).toBe(true);

    // Click next
    act(() => {
      result.current.handleNextClick();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playIntervalRef.current).toBeNull();
  });

  it("handlePrevClick calls goToPrev when canGoPrev is true", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({ canGoPrev: true });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handlePrevClick();
    });

    expect(mockStepper.goToPrev).toHaveBeenCalled();
  });

  it("handleFirstStep clears store, goes to step 0, and increments restartKey", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    const initialRestartKey = result.current.restartKey;

    act(() => {
      result.current.handleFirstStep();
    });

    expect(mockStore.clear).toHaveBeenCalled();
    expect(mockStepper.goToStep).toHaveBeenCalledWith(0);
    expect(result.current.restartKey).toBe(initialRestartKey + 1);
  });

  it("handleLastStep clears store, goes to visualStepCount, and increments restartKey", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({ visualStepCount: 10 });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    const initialRestartKey = result.current.restartKey;

    act(() => {
      result.current.handleLastStep();
    });

    expect(mockStore.clear).toHaveBeenCalled();
    expect(mockStepper.goToStep).toHaveBeenCalledWith(10);
    expect(result.current.restartKey).toBe(initialRestartKey + 1);
  });

  it("handlePlayClick starts playing and sets interval", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({
      currentVisualIndex: 1,
      visualStepCount: 10,
      stepsUpToIndex: 1,
    });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handlePlayClick();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.playIntervalRef.current).not.toBeNull();
  });

  it("handlePlayClick stops playing when already playing", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({
      currentVisualIndex: 1,
      visualStepCount: 10,
      stepsUpToIndex: 1,
    });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    // Start playing
    act(() => {
      result.current.handlePlayClick();
    });
    expect(result.current.isPlaying).toBe(true);

    // Stop playing
    act(() => {
      result.current.handlePlayClick();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playIntervalRef.current).toBeNull();
  });

  it("interval advances to next step when playing", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({
      currentVisualIndex: 1,
      visualStepCount: 10,
      stepsUpToIndex: 1,
    });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handlePlayClick();
    });

    // Advance timer by 200ms (interval duration)
    advanceTimers(200);

    expect(mockStepper.goToNext).toHaveBeenCalled();
  });

  it("interval stops when reaching the end", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({
      currentVisualIndex: 9,
      visualStepCount: 10,
      stepsUpToIndex: 9,
    });

    const { result } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handlePlayClick();
    });

    // Advance timer by 200ms
    advanceTimers(200);

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playIntervalRef.current).toBeNull();
  });

  it("cleanup clears interval on unmount", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper({
      currentVisualIndex: 1,
      visualStepCount: 10,
      stepsUpToIndex: 1,
    });

    const { result, unmount } = renderHook(() =>
      useGeometrySectionPlayback({ stepper: mockStepper, store: mockStore }),
    );

    act(() => {
      result.current.handlePlayClick();
    });
    expect(result.current.playIntervalRef.current).not.toBeNull();

    unmount();

    expect(result.current.playIntervalRef.current).toBeNull();
  });
});
