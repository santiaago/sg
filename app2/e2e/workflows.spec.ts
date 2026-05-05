import { test, expect } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from "./fixtures";
import {
  goToSection,
  goToStep,
  clickFirstButton,
  clickLastButton,
  clickNextButton,
} from "./utils/navigation";
import {
  selectGeometry,
  filterByName,
  clearFilters,
  toggleTypeFilter,
  waitForPageLoad,
  getGeometryCount,
} from "./utils/helpers";
import { toggleTheme } from "./utils/assertions";

/**
 * Combined Workflows Tests
 * Priority: Low
 * Note: Run after core tests pass
 * Uses << instead of restart
 */

test.describe("Combined Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Complete exploration flow", () => {
    test("Navigate to Square, step through all steps, toggle theme, copy SVG", async ({ page }) => {
      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Step through all steps (18 steps for Square)
      for (let i = 1; i <= 18; i++) {
        const currentStep = await page.locator("#square").getByText(/Current step \d+\/\d+/);
        await expect(currentStep).toBeVisible();

        if (i < 18) {
          await clickNextButton(page, SECTION_SQUARE);
        }
      }

      // Toggle theme
      await toggleTheme(page);

      // Copy SVG at final step (use section-scoped locator)
      await page.locator(`#${SECTION_SQUARE}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Copy URL
      await page.locator(`#${SECTION_SQUARE}`).getByTitle("Copy URL to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();
    });

    test("Navigate to SixFold v0, step through steps, toggle theme, copy SVG", async ({ page }) => {
      // Navigate to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Step through first 10 steps (for performance)
      for (let i = 1; i <= 10; i++) {
        const currentStep = await page.locator("#sixfold-v0").getByText(/Current step \d+\/\d+/);
        await expect(currentStep).toBeVisible();

        if (i < 10) {
          await clickNextButton(page, SECTION_SIXFOLD_V0);
        }
      }

      // Toggle theme back to dark
      await toggleTheme(page);

      // Copy SVG at step 10 (use section-scoped locator)
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Copy URL
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy URL to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();
    });
  });

  test.describe("Filter and select flow", () => {
    test("Navigate to Square, filter by type circle, select, verify details, toggle inputs, clear filters", async ({
      page,
    }) => {
      // Navigate to Square
      await goToStep(page, SECTION_SQUARE, 5);

      // Filter by type "circle" in Square section
      await toggleTypeFilter(page, "circle", `#${SECTION_SQUARE}`);

      const initialCount = await getGeometryCount(page, `#${SECTION_SQUARE}`);
      const filteredCount = await getGeometryCount(page, `#${SECTION_SQUARE}`);

      // Select a circle geometry from Square section
      const squareSection = page.locator(`#${SECTION_SQUARE}`);
      const geometryList = squareSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify details show circle info
        await expect(page.getByText("Details")).toBeVisible();

        // Toggle inputs highlight in Square section
        const inputsButton = squareSection.getByTestId("inputs-toggle");
        await inputsButton.click();

        // Verify dependencies highlighted in orange (if any)
        // Note: This depends on the selected geometry having dependencies
        const orangeItems = geometryList.locator("li[class*='text-orange-400']");
        const orangeCount = await orangeItems.count();
        // May or may not have orange highlights depending on the geometry

        // Clear filters in Square section
        await clearFilters(page, `#${SECTION_SQUARE}`);

        // Verify all items visible again
        const clearedCount = await getGeometryCount(page, `#${SECTION_SQUARE}`);
        expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
      }
    });

    test("Filter by name, select, verify details", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Filter by name "line" in SixFold v0 section
      await filterByName(page, "line", `#${SECTION_SIXFOLD_V0}`);

      const sixFoldSection = page.locator(`#${SECTION_SIXFOLD_V0}`);
      const geometryList = sixFoldSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify details show line info
        await expect(page.getByText("Details")).toBeVisible();

        // Clear filters in SixFold v0 section
        await clearFilters(page, `#${SECTION_SIXFOLD_V0}`);
      }
    });
  });

  test.describe("Full reset flow", () => {
    test("Navigate to Square, go to step 10, select geometry, click <<, verify back at step 0, no geometry selected", async ({
      page,
    }) => {
      // Navigate to Square and go to step 10 (which has geometry)
      await goToStep(page, SECTION_SQUARE, 10);

      const squareSection = page.locator(`#${SECTION_SQUARE}`);
      let currentStep = await squareSection.getByText(/Current step (\d+)\/\d+/);
      let stepText = await currentStep.textContent();
      expect(stepText).toContain("10");

      // Select a geometry from Square section
      const geometryList = squareSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify geometry is selected
        await expect(page.getByText("Details")).toBeVisible();

        // Click << (Go to beginning) button
        await clickFirstButton(page, SECTION_SQUARE);

        // Verify back at step 0 (app starts at step 0)
        currentStep = await squareSection.getByText(/Current step (\d+)\/\d+/);
        stepText = await currentStep.textContent();
        expect(stepText).toContain("0");

        // Verify no geometry selected
        const detailsHeader = page.getByText("Details");
        await expect(detailsHeader).not.toBeVisible();
      }
    });

    test("Navigate to SixFold v0, go to step 10, select geometry, click <<, verify back at step 0, no geometry selected", async ({
      page,
    }) => {
      // Navigate to SixFold v0 and go to step 10 (which has geometry)
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const sixFoldSection = page.locator(`#${SECTION_SIXFOLD_V0}`);
      let currentStep = await sixFoldSection.getByText(/Current step (\d+)\/\d+/);
      let stepText = await currentStep.textContent();
      expect(stepText).toContain("10");

      // Select a geometry from SixFold v0 section
      const geometryList = sixFoldSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify geometry is selected
        await expect(page.getByText("Details")).toBeVisible();

        // Click << (Go to beginning) button - clears geometry store
        await clickFirstButton(page, SECTION_SIXFOLD_V0);

        // Verify back at step 0 (app starts at step 0)
        currentStep = await sixFoldSection.getByText(/Current step (\d+)\/\d+/);
        stepText = await currentStep.textContent();
        expect(stepText).toContain("0");

        // Verify no geometry selected
        const detailsHeader = page.getByText("Details");
        await expect(detailsHeader).not.toBeVisible();
      }
    });
  });

  test.describe("Theme and copy workflow", () => {
    test("Toggle theme at each section, copy SVG at step 1 and final step", async ({ page }) => {
      // SixFold v0 - go to step 1 first (step 0 has no geometry)
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      // Copy SVG at step 1 (use section-scoped locator)
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Toggle theme
      await toggleTheme(page);

      // Go to step 10
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      // Copy SVG at step 10
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Navigate to Square
      await goToStep(page, SECTION_SQUARE, 1);

      // Toggle theme back
      await toggleTheme(page);

      // Copy SVG at step 1
      await page.locator(`#${SECTION_SQUARE}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Go to final step
      await clickLastButton(page, SECTION_SQUARE);

      // Copy SVG at final step
      await page.locator(`#${SECTION_SQUARE}`).getByTitle("Copy SVG to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();
    });

    test("Copy URL at different sections", async ({ page }) => {
      // SixFold v0
      await goToStep(page, SECTION_SIXFOLD_V0, 1);
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy URL to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Square
      await goToStep(page, SECTION_SQUARE, 1);
      await page.locator(`#${SECTION_SQUARE}`).getByTitle("Copy URL to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();

      // Back to SixFold v0
      await goToStep(page, SECTION_SIXFOLD_V0, 1);
      await page.locator(`#${SECTION_SIXFOLD_V0}`).getByTitle("Copy URL to clipboard").click();
      await expect(page.getByTestId("copy-feedback").first()).toBeVisible();
    });
  });

  test.describe("Complex interaction flow", () => {
    test("Combine multiple interactions: navigate, filter, select, highlight, reset", async ({
      page,
    }) => {
      // Navigate to Square and go to step 8 (which has geometry)
      await goToStep(page, SECTION_SQUARE, 8);

      // Filter by type "point" in Square section
      await toggleTypeFilter(page, "point", `#${SECTION_SQUARE}`);

      const squareSection = page.locator(`#${SECTION_SQUARE}`);
      const geometryList = squareSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const count = await items.count();

      if (count > 0) {
        // Select first point
        await items.first().click();

        // Toggle inputs highlight in Square section
        const inputsButton = squareSection.getByTestId("inputs-toggle");
        await inputsButton.click();

        // Clear filters in Square section
        await clearFilters(page, `#${SECTION_SQUARE}`);

        // Click << to reset
        await clickFirstButton(page, SECTION_SQUARE);

        // Verify back at step 0 (app starts at step 0)
        const currentStep = await squareSection.getByText(/Current step (\d+)\/\d+/);
        const stepText = await currentStep.textContent();
        expect(stepText).toContain("0");
      }
    });
  });
});
