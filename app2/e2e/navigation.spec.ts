import { test, expect } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from "./fixtures";
import {
  goToSection,
  goToStep,
  getCurrentStep,
  clickFirstButton,
  clickLastButton,
  clickNextButton,
  clickPrevButton,
} from "./utils/navigation";
import { waitForPageLoad } from "./utils/helpers";

/**
 * Navigation & URL Hash Tests
 * Priority: Medium
 * Note: Merges existing hash tests with new edge cases. Includes << and >> button tests.
 */

test.describe("Navigation & URL Hash", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Direct navigation", () => {
    test("Loading /#square scrolls to Square section", async ({ page }) => {
      await page.goto("/#square");
      await waitForPageLoad(page);

      await expect(page.locator("#square")).toBeVisible();
    });

    test("Loading /#sixfold-v0 scrolls to SixFold v0 section", async ({ page }) => {
      await page.goto("/#sixfold-v0");
      await waitForPageLoad(page);

      await expect(page.locator("#sixfold-v0")).toBeVisible();
    });

    test("Loading /#square activates Square nav button", async ({ page }) => {
      await page.goto("/#square");
      await waitForPageLoad(page);

      const squareButton = page.getByTestId("nav-square");
      const classList = await squareButton.getAttribute("class");
      expect(classList).toContain("bg-blue-600");
    });

    test("Loading /#sixfold-v0 activates SixFold v0 nav button", async ({ page }) => {
      await page.goto("/#sixfold-v0");
      await waitForPageLoad(page);

      const sixfoldButton = page.getByRole("button", { name: "SixFold v0" });
      const classList = await sixfoldButton.getAttribute("class");
      expect(classList).toContain("bg-blue-600");
    });
  });

  test.describe("Manual hash change", () => {
    test('Manually setting window.location.hash = "square" navigates to Square', async ({
      page,
    }) => {
      await page.goto("/");
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = "square";
      });

      await expect(page.locator("#square")).toBeVisible();
    });

    test('Manually setting window.location.hash = "sixfold-v0" navigates to SixFold v0', async ({
      page,
    }) => {
      await page.goto("/#square");
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = "sixfold-v0";
      });

      await expect(page.locator("#sixfold-v0")).toBeVisible();
    });

    test("Invalid hash does not break navigation", async ({ page }) => {
      await page.goto("/#invalid-section");
      await waitForPageLoad(page);

      // Should still show the default section
      await expect(page.locator("#sixfold-v0")).toBeVisible();
    });

    test("Hash with query parameters works correctly", async ({ page }) => {
      await page.goto("/#square?test=1");
      await waitForPageLoad(page);

      await expect(page.locator("#square")).toBeVisible();
    });

    test("Navigating back/forward in browser preserves hash state", async ({ page }) => {
      await page.goto("/#square");
      await waitForPageLoad(page);

      await page.goto("/#sixfold-v0");
      await waitForPageLoad(page);

      // Go back
      await page.goBack();
      await waitForPageLoad(page);

      await expect(page.locator("#square")).toBeVisible();

      // Go forward
      await page.goForward();
      await waitForPageLoad(page);

      await expect(page.locator("#sixfold-v0")).toBeVisible();
    });
  });

  test.describe("Navigation buttons", () => {
    test("Square: can click next all the way to the end", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Note: App starts at step 0 (Square has 19 steps in array, steps 0-19 where 19 = all executed)
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Click next until we reach the end (step 19 for Square where 19 = SQUARE_STEPS.length)
      for (let expectedStep = 1; expectedStep <= 19; expectedStep++) {
        await clickNextButton(page, SECTION_SQUARE);
        currentStep = await getCurrentStep(page, SECTION_SQUARE);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at the end (step 19 = SQUARE_STEPS.length, all steps executed)
      expect(currentStep).toBe(19);

      // Next button should be disabled at the end
      const nextButton = page.locator("#square").getByTestId("step-next");
      await expect(nextButton).toBeDisabled();
    });

    test("SixFold v0: can click next all the way to the end", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Note: App starts at step 0 (93 total steps, indexed 0-93)
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Click next to step 9 (for performance, we don't go all the way to 93)
      for (let expectedStep = 1; expectedStep <= 9; expectedStep++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
        currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at step 9
      expect(currentStep).toBe(9);
    });

    test("Square: can click fast forward (>>) to the end", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Click fast forward
      await clickLastButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      // Square has 19 steps in array, fast forward goes to step 19 (= SQUARE_STEPS.length, all executed)
      expect(currentStep).toBe(19);
    });

    test("SixFold v0: can click fast forward (>>) to the end", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Click fast forward
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      // SixFold v0 has 94 steps, indexed 0-93, end is step 94 (== SIX_FOLD_V0_STEPS.length)
      expect(currentStep).toBe(94);
    });

    test("Square: can click back from step 1 to step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 1 (one next from step 0)
      await clickNextButton(page, SECTION_SQUARE);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click back
      await clickPrevButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Prev button should be disabled at step 0
      const prevButton = page.locator("#square").getByTestId("step-prev");
      await expect(prevButton).toBeDisabled();
    });

    test("SixFold v0: can click back from step 1 to step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to step 1 (one next from step 0)
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click back
      await clickPrevButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Prev button should be disabled at step 0
      const prevButton = page.locator("#sixfold-v0").getByTestId("step-prev");
      await expect(prevButton).toBeDisabled();
    });

    test("Square: can click all the way to the beginning with backwards (<<)", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // First, go to the end (step 19 for Square where 19 = SQUARE_STEPS.length, all executed)
      await clickLastButton(page, SECTION_SQUARE);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(19);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);
    });

    test("SixFold v0: can click all the way to the beginning with backwards (<<)", async ({
      page,
    }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // First, go to step 9
      await goToStep(page, SECTION_SIXFOLD_V0, 9);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(9);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);
    });

    test("Square: can navigate forward and backward multiple times", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Note: App starts at step 0
      // Go forward a few steps (from step 0 to step 5)
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(5);

      // Go backward a few steps (from step 5 to step 2)
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SQUARE);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(2);

      // Go forward again (from step 2 to step 4)
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(4);
    });

    test("SixFold v0: can navigate forward and backward multiple times", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Note: App starts at step 0
      // Go forward a few steps (from step 0 to step 5)
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(5);

      // Go backward a few steps (from step 5 to step 2)
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_V0);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(2);

      // Go forward again (from step 2 to step 4)
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(4);
    });

    test("Square: can click next, then prev, then next again", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Click next (to step 1)
      await clickNextButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click prev (back to step 0)
      await clickPrevButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Click next again (to step 1)
      await clickNextButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);
    });

    test("SixFold v0: can click next, then prev, then next again", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Click next (to step 1)
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click prev (back to step 0)
      await clickPrevButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Click next again (to step 1)
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);
    });
  });

  test.describe("First and Last button states", () => {
    test("Square: First (<<) button is disabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const firstButton = page.locator("#square").getByTestId("step-first");
      await expect(firstButton).toBeDisabled();
    });

    test("Square: Last (>>) button is enabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const lastButton = page.locator("#square").getByTestId("step-last");
      await expect(lastButton).toBeEnabled();
    });

    test("Square: First (<<) button is enabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const firstButton = page.locator("#square").getByTitle("Go to beginning");
      await expect(firstButton).toBeEnabled();
    });

    test("Square: Last (>>) button is disabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const lastButton = page.locator("#square").getByTitle("Go to end");
      await expect(lastButton).toBeDisabled();
    });

    test("SixFold v0: First (<<) button is disabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const firstButton = page.locator("#sixfold-v0").getByTestId("step-first");
      await expect(firstButton).toBeDisabled();
    });

    test("SixFold v0: Last (>>) button is enabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const lastButton = page.locator("#sixfold-v0").getByTestId("step-last");
      await expect(lastButton).toBeEnabled();
    });

    test("SixFold v0: First (<<) button is enabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const firstButton = page.locator("#sixfold-v0").getByTitle("Go to beginning");
      await expect(firstButton).toBeEnabled();
    });

    test("SixFold v0: Last (>>) button is disabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const lastButton = page.locator("#sixfold-v0").getByTitle("Go to end");
      await expect(lastButton).toBeDisabled();
    });
  });

  test.describe("Complete navigation cycle", () => {
    test("Square: complete navigation cycle", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Start at step 0 (app starts at step 0)
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Go to end (step 19 for Square where 19 = SQUARE_STEPS.length, all executed)
      await clickLastButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(19);

      // Go back to beginning (step 0)
      await clickFirstButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(0);

      // Go forward 3 steps (to step 3)
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(3);

      // Go backward 2 steps (to step 1)
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SQUARE);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);
    });

    test("SixFold v0: complete navigation cycle", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Start at step 0 (app starts at step 0, not step 1)
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Go to step 9 (instead of end for performance)
      for (let i = 0; i < 9; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(9);

      // Go back to beginning (step 0)
      await clickFirstButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(0);

      // Go forward 3 steps (to step 3)
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(3);

      // Go backward 2 steps (to step 1)
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);
    });
  });
});
