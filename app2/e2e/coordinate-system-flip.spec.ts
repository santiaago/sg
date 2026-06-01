import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V2 } from "./fixtures";
import { goToSection, clickNextButton, getCurrentStep } from "./utils/navigation";
import { waitForPageLoad } from "./utils/helpers";
import { getConsoleMessages } from "./utils/console";

/**
 * Coordinate System Flip Feature Tests
 * Tests for the flipX/flipY functionality in coordinate systems
 * These tests verify that boolean flip parameters are handled correctly
 */

test.describe("Coordinate System Flip Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("Square DSL renders without errors (regression test for boolean flipX/flipY)", async ({
    page,
  }) => {
    // This test verifies the fix for: "Invalid flipX type: expected number, string, or GeometryFeatureReference"
    // The Square DSL creates a coordinate system with default flipX=false, flipY=false (booleans)
    // Before the fix, this would throw an error because resolveParameter didn't handle booleans

    await goToSection(page, SECTION_SQUARE_DSL);

    // Check for console errors
    const { errors } = await getConsoleMessages(page);
    expect(errors).toHaveLength(0);

    // Verify SVG is visible
    const svg = page.getByTestId("square-dsl-svg");
    await expect(svg).toBeVisible();

    // Try to advance to step 1 (this is where the error occurred before the fix)
    await clickNextButton(page, SECTION_SQUARE_DSL);
    const currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
    expect(currentStep).toBe(1);

    // Check again for errors after stepping
    const { errors: errorsAfterStep } = await getConsoleMessages(page);
    expect(errorsAfterStep).toHaveLength(0);
  });

  test("SixFold DSL v2 renders without errors with flipped coordinate system", async ({ page }) => {
    // SixFold DSL v2 uses flipX=true on cs2, which tests the boolean handling
    await goToSection(page, SECTION_SIXFOLD_DSL_V2);

    // Check for console errors
    const { errors } = await getConsoleMessages(page);
    expect(errors).toHaveLength(0);

    // Verify SVG is visible
    const svg = page.getByTestId("sixfold-dsl-v2-svg");
    await expect(svg).toBeVisible();

    // Advance a few steps to ensure coordinate system with flipX is processed
    for (let i = 0; i < 5; i++) {
      await clickNextButton(page, SECTION_SIXFOLD_DSL_V2);
    }

    const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V2);
    expect(currentStep).toBe(5);

    // Check again for errors after stepping
    const { errors: errorsAfterStep } = await getConsoleMessages(page);
    expect(errorsAfterStep).toHaveLength(0);
  });

  test("Coordinate system with flipX=true renders correctly", async ({ page }) => {
    // This specifically tests that flipX=true (boolean literal) is handled correctly
    // Before the fix, this would cause: "Invalid flipX type: expected number, string, or GeometryFeatureReference"
    await goToSection(page, SECTION_SIXFOLD_DSL_V2);

    // The v2 construction has cs2 with flipX=true
    // Execute enough steps to create cs2 (step index 1)
    await clickNextButton(page, SECTION_SIXFOLD_DSL_V2);
    await clickNextButton(page, SECTION_SIXFOLD_DSL_V2);

    const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V2);
    expect(currentStep).toBe(2);

    // No console errors should be present
    const { errors } = await getConsoleMessages(page);
    expect(errors).toHaveLength(0);
  });
});
