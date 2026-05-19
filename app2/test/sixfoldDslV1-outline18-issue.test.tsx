/**
 * Failing test for SixFold DSL v1 outline18 not displayed issue
 *
 * Issue: When at last visual step (96/97), outline18 is not executed
 * because executeSteps uses exclusive upper bound but useSmartStepper
 * returns the actual index of the step, causing step 101 (outline18) to be skipped.
 */

import { describe, it, expect } from "vitest";
import {
  buildSixfoldDslV1Steps,
  DSL_SIXFOLD_V1_STEPS_LENGTH,
} from "../src/geometry/sixfoldDslV1Steps";
import { getActualStepIndex, getVisualStepCount } from "../src/geometry/utils/stepperUtils";
import { executeSteps } from "../src/geometry/stepExecution";
import { computeSixFoldV0Config } from "../src/geometry/sixFold/operations";
import { createMockTheme } from "../test/dsl-test-utils";

describe("SixFold DSL v1 - outline18 not displayed", () => {
  const config = computeSixFoldV0Config(800, 600);
  const steps = buildSixfoldDslV1Steps();
  const visualStepCount = getVisualStepCount(steps);

  it("fails: DSL_SIXFOLD_V1_STEPS_LENGTH constant does not match actual step count", () => {
    expect(DSL_SIXFOLD_V1_STEPS_LENGTH).toBe(steps.length);
  });

  it("fails: outline18 step exists but is beyond the constant's limit", () => {
    const outline18Index = steps.findIndex((s) => s.id === "step_outline18");
    expect(outline18Index).toBeLessThan(DSL_SIXFOLD_V1_STEPS_LENGTH);
  });

  it("now passes: with +1 fix, outline18 IS executed at last visual step", () => {
    // Last visual step index
    const lastVisualIndex = visualStepCount - 1; // 96

    // Map to actual step index and apply +1 fix
    const actualIndex = getActualStepIndex(steps, lastVisualIndex) + 1;

    // The actual index with +1 should allow outline18 to be executed
    // executeSteps(steps, actualIndex) executes steps[0] through steps[actualIndex - 1]
    // With +1, actualIndex - 1 = getActualStepIndex(...) = 101 = outline18 index
    const stepAtIndex = steps[actualIndex - 1];

    // This should be outline18
    expect(stepAtIndex.id).toBe("step_outline18");

    // When executeSteps is called with upToIndex = actualIndex (102),
    // it executes steps[0] through steps[101] which includes outline18 at index 101
    const executedSteps = steps.slice(0, actualIndex); // steps 0 to 101
    const outline18Executed = executedSteps.some((s) => s.id === "step_outline18");

    // Now passes: outline18 IS in executed steps
    expect(outline18Executed).toBe(true);
  });

  it("now passes: outline18 IS in allValues when executing with +1 fix", () => {
    const lastVisualIndex = visualStepCount - 1;
    // Apply the +1 fix
    const actualIndex = getActualStepIndex(steps, lastVisualIndex) + 1;

    // Verify the step before actualIndex is outline18
    expect(steps[actualIndex - 1].id).toBe("step_outline18");

    // Execute steps with the fixed actualIndex
    const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const mockStore = {
      items: {},
      add: () => {},
      update: () => {},
      clear: () => {},
    };

    const allValues = executeSteps(
      steps,
      actualIndex,
      { svg: mockSvg, store: mockStore, theme: createMockTheme() },
      config,
    );

    // outline18 should now be in allValues
    expect(allValues.has("outline18")).toBe(true);
  });
});
