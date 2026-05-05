// Step execution utilities for geometry step system.
// Provides shared execution functions for both Square and SixFoldV0 steps.

import type { Step, GeometryValue, StepExecutionContext } from "../types/geometry";

/**
 * Execute a single step: collect inputs, compute outputs, draw results.
 * @param step - The step to execute
 * @param allValues - Map of all geometry values computed so far
 * @param ctx - Execution context containing svg, store, and theme
 * @param config - Configuration object for the step
 * @returns Updated map of geometry values (with new outputs added)
 * @throws Error if any input geometry is missing
 */
export function executeStep<TConfig>(
  step: Step<TConfig>,
  allValues: Map<string, GeometryValue>,
  ctx: StepExecutionContext,
  config: TConfig,
): Map<string, GeometryValue> {
  // Collect input values for this step
  const inputValues = new Map<string, GeometryValue>();
  for (const inputId of step.inputs) {
    const value = allValues.get(inputId);
    if (!value) {
      throw new Error(`Step ${step.id}: missing input geometry ${inputId}`);
    }
    inputValues.set(inputId, value);
  }

  // Execute compute function with inputs and config
  const outputValues = step.compute(inputValues, config);

  // Add outputs to allValues
  const newAllValues = new Map(allValues);
  for (const [id, value] of outputValues) {
    newAllValues.set(id, value);
  }

  // Draw the step
  step.draw(ctx.svg, newAllValues, ctx.store, ctx.theme);

  return newAllValues;
}

/**
 * Executes all steps up to a given index.
 * @param steps - Array of steps to execute
 * @param upToIndex - Execute steps[0] through steps[upToIndex-1]
 * @param ctx - Execution context containing svg, store, and theme
 * @param config - Configuration object for all steps
 * @returns Map of all computed geometry values
 */
export function executeSteps<TConfig>(
  steps: readonly Step<TConfig>[],
  upToIndex: number,
  ctx: StepExecutionContext,
  config: TConfig,
): Map<string, GeometryValue> {
  let allValues = new Map<string, GeometryValue>();

  for (let i = 0; i < Math.min(upToIndex, steps.length); i++) {
    allValues = executeStep(steps[i], allValues, ctx, config);
  }

  return allValues;
}
