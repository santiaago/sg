import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useThemeAwareSteps } from "../src/hooks/useThemeAwareSteps";
import { darkTheme, lightTheme } from "../src/themes";

describe("useThemeAwareSteps Hook", () => {
  it("should return shouldClear=false on first render with step=1", () => {
    const { result } = renderHook(() =>
      useThemeAwareSteps({
        currentStep: 1,
        restartTrigger: 0,
        theme: darkTheme,
      }),
    );

    expect(result.current.shouldClear).toBe(false);
  });

  it("should return shouldClear=false when moving forward (step 1 -> 2)", () => {
    const { result, rerender } = renderHook(
      ({ currentStep }) =>
        useThemeAwareSteps({
          currentStep,
          restartTrigger: 0,
          theme: darkTheme,
        }),
      { initialProps: { currentStep: 1 } },
    );

    expect(result.current.shouldClear).toBe(false);

    rerender({ currentStep: 2 });
    expect(result.current.shouldClear).toBe(false);
  });

  it("should return shouldClear=true when going backwards (step 2 -> 1)", () => {
    const { result, rerender } = renderHook(
      ({ currentStep }) =>
        useThemeAwareSteps({
          currentStep,
          restartTrigger: 0,
          theme: darkTheme,
        }),
      { initialProps: { currentStep: 2 } },
    );

    expect(result.current.shouldClear).toBe(false);

    rerender({ currentStep: 1 });
    expect(result.current.shouldClear).toBe(true);
  });

  it("should return shouldClear=true when restartTrigger changes", () => {
    const { result, rerender } = renderHook(
      ({ restartTrigger }) =>
        useThemeAwareSteps({
          currentStep: 1,
          restartTrigger,
          theme: darkTheme,
        }),
      { initialProps: { restartTrigger: 0 } },
    );

    expect(result.current.shouldClear).toBe(false);

    rerender({ restartTrigger: 1 });
    expect(result.current.shouldClear).toBe(true);
  });

  it("should return shouldClear=true when theme changes", () => {
    const { result, rerender } = renderHook(
      ({ theme }) =>
        useThemeAwareSteps({
          currentStep: 1,
          restartTrigger: 0,
          theme,
        }),
      { initialProps: { theme: darkTheme } },
    );

    expect(result.current.shouldClear).toBe(false);

    rerender({ theme: lightTheme });
    expect(result.current.shouldClear).toBe(true);
  });

  it("should return shouldClear=false when theme stays the same", () => {
    const { result, rerender } = renderHook(
      ({ currentStep }) =>
        useThemeAwareSteps({
          currentStep,
          restartTrigger: 0,
          theme: darkTheme,
        }),
      { initialProps: { currentStep: 1 } },
    );

    expect(result.current.shouldClear).toBe(false);

    rerender({ currentStep: 2 });
    expect(result.current.shouldClear).toBe(false);
  });

  it("should handle multiple triggers: backwards + theme change", () => {
    const { result, rerender } = renderHook(
      ({ currentStep, theme }) =>
        useThemeAwareSteps({
          currentStep,
          restartTrigger: 0,
          theme,
        }),
      { initialProps: { currentStep: 2, theme: darkTheme } },
    );

    rerender({ currentStep: 1, theme: lightTheme });
    expect(result.current.shouldClear).toBe(true);
  });
});
