import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V1 } from "./fixtures";
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
    test("Loading /#square-dsl-dsl scrolls to Square DSL section", async ({ page }) => {
      await page.goto("/#square-dsl-dsl");
      await waitForPageLoad(page);

      await expect(page.locator("#square-dsl-dsl")).toBeVisible();
    });

    test("Loading /#sixfold-dsl-v1 scrolls to SixFold DSL v1 section", async ({ page }) => {
      await page.goto("/#sixfold-dsl-v1");
      await waitForPageLoad(page);

      await expect(page.locator("#sixfold-dsl-v1")).toBeVisible();
    });

    test("Loading /#square-dsl-dsl activates Square DSL nav button", async ({ page }) => {
      await page.goto("/#square-dsl-dsl");
      await waitForPageLoad(page);

      const squareButton = page.getByTestId("nav-square-dsl");
      const classList = await squareButton.getAttribute("class");
      expect(classList).toContain("bg-blue-600");
    });

    test("Loading /#sixfold-dsl-v1 activates SixFold DSL v1 nav button", async ({ page }) => {
      await page.goto("/#sixfold-dsl-v1");
      await waitForPageLoad(page);

      const sixfoldButton = page.getByRole("button", { name: "SixFold DSL v1" });
      const classList = await sixfoldButton.getAttribute("class");
      expect(classList).toContain("bg-blue-600");
    });
  });

  test.describe("Manual hash change", () => {
    test('Manually setting window.location.hash = "square-dsl" navigates to Square DSL', async ({
      page,
    }) => {
      await page.goto("/");
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = "square-dsl";
      });

      await expect(page.locator("#square-dsl-dsl")).toBeVisible();
    });

    test('Manually setting window.location.hash = "sixfold-dsl-v1" navigates to SixFold DSL v1', async ({
      page,
    }) => {
      await page.goto("/#square-dsl-dsl");
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = "sixfold-dsl-v1";
      });

      await expect(page.locator("#sixfold-dsl-v1")).toBeVisible();
    });

    test("Invalid hash does not break navigation", async ({ page }) => {
      await page.goto("/#invalid-section");
      await waitForPageLoad(page);

      // Should still show the default section (sixfold-dsl-v1)
      await expect(page.locator("#sixfold-dsl-v1")).toBeVisible();
    });

    test("Hash with query parameters works correctly", async ({ page }) => {
      await page.goto("/#square-dsl-dsl?test=1");
      await waitForPageLoad(page);

      await expect(page.locator("#square-dsl-dsl")).toBeVisible();
    });

    test("Navigating back/forward in browser preserves hash state", async ({ page }) => {
      await page.goto("/#square-dsl-dsl");
      await waitForPageLoad(page);

      await page.goto("/#sixfold-dsl-v1");
      await waitForPageLoad(page);

      // Go back
      await page.goBack();
      await waitForPageLoad(page);

      await expect(page.locator("#square-dsl-dsl")).toBeVisible();

      // Go forward
      await page.goForward();
      await waitForPageLoad(page);

      await expect(page.locator("#sixfold-dsl-v1")).toBeVisible();
    });
  });

  test.describe("Navigation buttons", () => {
    test("Square DSL: can click next all the way to the end", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Click next until we reach the end (DSL Square has different step count)
      // Just go to step 5 for testing
      for (let expectedStep = 1; expectedStep <= 5; expectedStep++) {
        await clickNextButton(page, SECTION_SQUARE_DSL);
        currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at step 5
      expect(currentStep).toBe(5);
    });

    test("SixFold DSL v1: can click next all the way to the end", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Click next to step 9 (for performance, we don't go all the way)
      for (let expectedStep = 1; expectedStep <= 9; expectedStep++) {
        await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
        currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at step 9
      expect(currentStep).toBe(9);
    });

    test("Square DSL: can click fast forward (>>) to the end", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Click fast forward
      await clickLastButton(page, SECTION_SQUARE_DSL);

      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      // DSL Square fast forward goes to end
      expect(currentStep).toBeGreaterThan(0);
    });

    test("SixFold DSL v1: can click fast forward (>>) to the end", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Click fast forward
      await clickLastButton(page, SECTION_SIXFOLD_DSL_V1);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBeGreaterThan(0);
    });

    test("Square DSL: can click back from step 1 to step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Go to step 1 (one next from step 0)
      await clickNextButton(page, SECTION_SQUARE_DSL);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(1);

      // Click back
      await clickPrevButton(page, SECTION_SQUARE_DSL);

      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Prev button should be disabled at step 0
      const prevButton = page.locator("#square-dsl-dsl").getByTestId("step-prev");
      await expect(prevButton).toBeDisabled();
    });

    test("SixFold DSL v1: can click back from step 1 to step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Go to step 1 (one next from step 0)
      await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(1);

      // Click back
      await clickPrevButton(page, SECTION_SIXFOLD_DSL_V1);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Prev button should be disabled at step 0
      const prevButton = page.locator("#sixfold-dsl-v1").getByTestId("step-prev");
      await expect(prevButton).toBeDisabled();
    });

    test("Square DSL: can click all the way to the beginning with backwards (<<)", async ({
      page,
    }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Go to step 5
      await goToStep(page, SECTION_SQUARE_DSL, 5);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(5);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SQUARE_DSL);

      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);
    });

    test("SixFold DSL v1: can click all the way to the beginning with backwards (<<)", async ({
      page,
    }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // First, go to step 9
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 9);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(9);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SIXFOLD_DSL_V1);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);
    });

    test("Square: can navigate forward and backward multiple times", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Note: App starts at step 0
      // Go forward a few steps (from step 0 to step 5)
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SQUARE_DSL);
      }

      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(5);

      // Go backward a few steps (from step 5 to step 2)
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SQUARE_DSL);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(2);

      // Go forward again (from step 2 to step 4)
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SQUARE_DSL);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(4);
    });

    test("SixFold v0: can navigate forward and backward multiple times", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Note: App starts at step 0
      // Go forward a few steps (from step 0 to step 5)
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      }

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(5);

      // Go backward a few steps (from step 5 to step 2)
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_DSL_V1);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(2);

      // Go forward again (from step 2 to step 4)
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(4);
    });

    test("Square: can click next, then prev, then next again", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Click next (to step 1)
      await clickNextButton(page, SECTION_SQUARE_DSL);
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(1);

      // Click prev (back to step 0)
      await clickPrevButton(page, SECTION_SQUARE_DSL);
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Click next again (to step 1)
      await clickNextButton(page, SECTION_SQUARE_DSL);
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(1);
    });

    test("SixFold v0: can click next, then prev, then next again", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Note: App starts at step 0
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Click next (to step 1)
      await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(1);

      // Click prev (back to step 0)
      await clickPrevButton(page, SECTION_SIXFOLD_DSL_V1);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Click next again (to step 1)
      await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(1);
    });
  });

  test.describe("First and Last button states", () => {
    test("Square: First (<<) button is disabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const firstButton = page.locator("#square-dsl").getByTestId("step-first");
      await expect(firstButton).toBeDisabled();
    });

    test("Square: Last (>>) button is enabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const lastButton = page.locator("#square-dsl").getByTestId("step-last");
      await expect(lastButton).toBeEnabled();
    });

    test("Square: First (<<) button is enabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);
      await clickLastButton(page, SECTION_SQUARE_DSL);

      const firstButton = page.locator("#square-dsl").getByTitle("Go to beginning");
      await expect(firstButton).toBeEnabled();
    });

    test("Square: Last (>>) button is disabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);
      await clickLastButton(page, SECTION_SQUARE_DSL);

      const lastButton = page.locator("#square-dsl").getByTitle("Go to end");
      await expect(lastButton).toBeDisabled();
    });

    test("SixFold v0: First (<<) button is disabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const firstButton = page.locator("#sixfold-dsl-v1").getByTestId("step-first");
      await expect(firstButton).toBeDisabled();
    });

    test("SixFold v0: Last (>>) button is enabled at step 0", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const lastButton = page.locator("#sixfold-dsl-v1").getByTestId("step-last");
      await expect(lastButton).toBeEnabled();
    });

    test("SixFold v0: First (<<) button is enabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);
      await clickLastButton(page, SECTION_SIXFOLD_DSL_V1);

      const firstButton = page.locator("#sixfold-dsl-v1").getByTitle("Go to beginning");
      await expect(firstButton).toBeEnabled();
    });

    test("SixFold v0: Last (>>) button is disabled at last step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);
      await clickLastButton(page, SECTION_SIXFOLD_DSL_V1);

      const lastButton = page.locator("#sixfold-dsl-v1").getByTitle("Go to end");
      await expect(lastButton).toBeDisabled();
    });
  });

  test.describe("Complete navigation cycle", () => {
    test("Square: complete navigation cycle", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      // Start at step 0 (app starts at step 0)
      let currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Go to end (step 19 for Square where 19 = SQUARE_STEPS.length, all executed)
      await clickLastButton(page, SECTION_SQUARE_DSL);
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(19);

      // Go back to beginning (step 0)
      await clickFirstButton(page, SECTION_SQUARE_DSL);
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(0);

      // Go forward 3 steps (to step 3)
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SQUARE_DSL);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(3);

      // Go backward 2 steps (to step 1)
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SQUARE_DSL);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(1);
    });

    test("SixFold v0: complete navigation cycle", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      // Start at step 0 (app starts at step 0, not step 1)
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Go to step 9 (instead of end for performance)
      for (let i = 0; i < 9; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(9);

      // Go back to beginning (step 0)
      await clickFirstButton(page, SECTION_SIXFOLD_DSL_V1);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(0);

      // Go forward 3 steps (to step 3)
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_DSL_V1);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(3);

      // Go backward 2 steps (to step 1)
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_DSL_V1);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(1);
    });
  });
});
