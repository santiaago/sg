import { test, expect, type Page } from "@playwright/test";
import { SQUARE_STEPS } from "../src/geometry/squareSteps";
import { SIX_FOLD_V0_STEPS } from "../src/geometry/sixFoldV0Steps";

/**
 * E2E tests for Square and SixFoldV0 component navigation.
 * Tests verify that:
 * - Can click next repeatedly until the end
 * - Can click fast forward (»»)
 * - Can click back (prev)
 * - Can click all the way to the beginning with backwards (<<)
 * All tests should complete with no errors or warnings.
 */

// Step counts from source files
const SQUARE_TOTAL_STEPS = SQUARE_STEPS.length;
const SIXFOLDV0_TOTAL_STEPS = SIX_FOLD_V0_STEPS.length;

// Selectors for sections
const SQUARE_SECTION = "#square";
const SIXFOLDV0_SECTION = "#sixfold-v0";

// Helper to extract current step from text
function extractStepNumber(text: string): number {
  const match = text.match(/Current step (\d+)\/\d+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  throw new Error(`Could not extract step number from: ${text}`);
}

/**
 * Helper to navigate to a specific section
 */
async function navigateToSection(page: Page, section: "square" | "sixfold-v0"): Promise<void> {
  // Click the navigation button for the section
  await page.getByRole("button", { name: section === "square" ? "Square" : "SixFold v0" }).click();

  // Wait for the section to be visible
  const sectionLocator = page.locator(section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION);
  await expect(sectionLocator).toBeVisible();

  // Wait for SVG to be visible
  await expect(
    sectionLocator.getByTestId(section === "square" ? "square-svg" : "sixfoldv0-svg"),
  ).toBeVisible();
}

/**
 * Helper to get current step for a section
 */
async function getCurrentStep(page: Page, section: "square" | "sixfold-v0"): Promise<number> {
  const sectionSelector = section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const stepElement = page.locator(sectionSelector).getByText(/Current step \d+\/\d+/);
  const stepText = await stepElement.textContent();
  return extractStepNumber(stepText || "");
}

/**
 * Helper to click next button for a section
 */
async function clickNext(page: Page, section: "square" | "sixfold-v0"): Promise<void> {
  const sectionLocator = page.locator(section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION);
  await sectionLocator.getByRole("button", { name: "next" }).click();
}

/**
 * Helper to click prev button for a section
 */
async function clickPrev(page: Page, section: "square" | "sixfold-v0"): Promise<void> {
  const sectionLocator = page.locator(section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION);
  await sectionLocator.getByRole("button", { name: "prev" }).click();
}

/**
 * Helper to click first button (<<) for a section
 */
async function clickFirst(page: Page, section: "square" | "sixfold-v0"): Promise<void> {
  const sectionLocator = page.locator(section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION);
  await sectionLocator.getByTitle("Go to beginning").click();
}

/**
 * Helper to click last button (>>) for a section
 */
async function clickLast(page: Page, section: "square" | "sixfold-v0"): Promise<void> {
  const sectionLocator = page.locator(section === "square" ? SQUARE_SECTION : SIXFOLDV0_SECTION);
  await sectionLocator.getByTitle("Go to end").click();
}

/**
 * Tests for Square component navigation
 */
test.describe("Square Component Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await navigateToSection(page, "square");
  });

  test("should start at step 1", async ({ page }) => {
    const currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);
  });

  test("can click next all the way to the end", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Click next until we reach the end
    for (let expectedStep = 2; expectedStep <= SQUARE_TOTAL_STEPS; expectedStep++) {
      await clickNext(page, "square");
      currentStep = await getCurrentStep(page, "square");
      expect(currentStep).toBe(expectedStep);
    }

    // Verify we're at the end
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Next button should be disabled at the end
    await expect(page.locator(SQUARE_SECTION).getByRole("button", { name: "next" })).toBeDisabled();
  });

  test("can click fast forward (>>) to the end", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Click fast forward
    await clickLast(page, "square");

    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);
  });

  test("can click back from step 2 to step 1", async ({ page }) => {
    // Go to step 2
    await clickNext(page, "square");
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(2);

    // Click back
    await clickPrev(page, "square");

    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Prev button should be disabled at step 1
    await expect(page.locator(SQUARE_SECTION).getByRole("button", { name: "prev" })).toBeDisabled();
  });

  test("can click all the way to the beginning with backwards (<<)", async ({ page }) => {
    // First, go to the end
    await clickLast(page, "square");
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Click backwards to beginning
    await clickFirst(page, "square");

    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);
  });

  test("can navigate forward and backward multiple times", async ({ page }) => {
    // Go forward a few steps
    for (let i = 0; i < 5; i++) {
      await clickNext(page, "square");
    }

    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(6);

    // Go backward a few steps
    for (let i = 0; i < 3; i++) {
      await clickPrev(page, "square");
    }

    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(3);

    // Go forward again
    for (let i = 0; i < 2; i++) {
      await clickNext(page, "square");
    }

    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(5);
  });

  test("can click next, then prev, then next again", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Click next
    await clickNext(page, "square");
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(2);

    // Click prev
    await clickPrev(page, "square");
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Click next again
    await clickNext(page, "square");
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(2);
  });
});

/**
 * Tests for SixFoldV0 component navigation
 */
test.describe("SixFoldV0 Component Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await navigateToSection(page, "sixfold-v0");
  });

  test("should start at step 1", async ({ page }) => {
    const currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);
  });

  test("can click next all the way to the end", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Click next until we reach the end
    // For SixFoldV0 with 93 steps, we'll click next 92 times
    for (let expectedStep = 2; expectedStep <= SIXFOLDV0_TOTAL_STEPS; expectedStep++) {
      await clickNext(page, "sixfold-v0");
      currentStep = await getCurrentStep(page, "sixfold-v0");
      expect(currentStep).toBe(expectedStep);
    }

    // Verify we're at the end
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Next button should be disabled at the end
    await expect(
      page.locator(SIXFOLDV0_SECTION).getByRole("button", { name: "next" }),
    ).toBeDisabled();
  });

  test("can click fast forward (>>) to the end", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Click fast forward
    await clickLast(page, "sixfold-v0");

    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);
  });

  test("can click back from step 2 to step 1", async ({ page }) => {
    // Go to step 2
    await clickNext(page, "sixfold-v0");
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(2);

    // Click back
    await clickPrev(page, "sixfold-v0");

    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Prev button should be disabled at step 1
    await expect(
      page.locator(SIXFOLDV0_SECTION).getByRole("button", { name: "prev" }),
    ).toBeDisabled();
  });

  test("can click all the way to the beginning with backwards (<<)", async ({ page }) => {
    // First, go to the end
    await clickLast(page, "sixfold-v0");
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Click backwards to beginning
    await clickFirst(page, "sixfold-v0");

    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);
  });

  test("can navigate forward and backward multiple times", async ({ page }) => {
    // Go forward a few steps
    for (let i = 0; i < 5; i++) {
      await clickNext(page, "sixfold-v0");
    }

    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(6);

    // Go backward a few steps
    for (let i = 0; i < 3; i++) {
      await clickPrev(page, "sixfold-v0");
    }

    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(3);

    // Go forward again
    for (let i = 0; i < 2; i++) {
      await clickNext(page, "sixfold-v0");
    }

    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(5);
  });

  test("can click next, then prev, then next again", async ({ page }) => {
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Click next
    await clickNext(page, "sixfold-v0");
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(2);

    // Click prev
    await clickPrev(page, "sixfold-v0");
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Click next again
    await clickNext(page, "sixfold-v0");
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(2);
  });
});

/**
 * Combined tests for both components
 */
test.describe("Both Components Navigation", () => {
  test("Square: complete navigation cycle", async ({ page }) => {
    await page.goto("/");
    await navigateToSection(page, "square");

    // Start at step 1
    let currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Go to end
    await clickLast(page, "square");
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Go back to beginning
    await clickFirst(page, "square");
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(1);

    // Go forward 3 steps
    for (let i = 0; i < 3; i++) {
      await clickNext(page, "square");
    }
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(4);

    // Go backward 2 steps
    for (let i = 0; i < 2; i++) {
      await clickPrev(page, "square");
    }
    currentStep = await getCurrentStep(page, "square");
    expect(currentStep).toBe(2);
  });

  test("SixFoldV0: complete navigation cycle", async ({ page }) => {
    await page.goto("/");
    await navigateToSection(page, "sixfold-v0");

    // Start at step 1
    let currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Go to end
    await clickLast(page, "sixfold-v0");
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Go back to beginning
    await clickFirst(page, "sixfold-v0");
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(1);

    // Go forward 3 steps
    for (let i = 0; i < 3; i++) {
      await clickNext(page, "sixfold-v0");
    }
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(4);

    // Go backward 2 steps
    for (let i = 0; i < 2; i++) {
      await clickPrev(page, "sixfold-v0");
    }
    currentStep = await getCurrentStep(page, "sixfold-v0");
    expect(currentStep).toBe(2);
  });
});
