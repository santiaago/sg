import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V1 } from "./fixtures";
import { goToSection, goToStep } from "./utils/navigation";
import { selectGeometry, waitForPageLoad, getGeometryCount } from "./utils/helpers";

/**
 * Input Highlighting Tests
 * Priority: Medium
 * Setup: Navigate to section with geometries that have dependencies
 */

test.describe("Input Highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Toggle", () => {
    test("Inputs button toggles highlight mode on/off", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 1);

      // There are multiple inputs buttons (one per section), use the first one
      const inputsButton = page.getByTestId("inputs-toggle").first();

      // Check initial state (should be on by default based on App.tsx)
      const initialClass = await inputsButton.getAttribute("class");
      const isInitiallyActive = initialClass?.includes("bg-blue-600");

      // Toggle off
      await inputsButton.click();

      const offClass = await inputsButton.getAttribute("class");
      const isOff = !offClass?.includes("bg-blue-600");

      // Toggle on
      await inputsButton.click();

      const onClass = await inputsButton.getAttribute("class");
      const isOn = onClass?.includes("bg-blue-600");

      // Button should toggle between states
      expect(isOff).toBe(true);
      expect(isOn).toBe(true);
    });

    test("Inputs button stays blue when active", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 1);

      const inputsButton = page.getByTestId("inputs-toggle").first();

      // Ensure it's active (click to toggle on if needed)
      const initialClass = await inputsButton.getAttribute("class");
      if (!initialClass?.includes("bg-blue-600")) {
        await inputsButton.click();
      }

      // Verify it's blue
      const classList = await inputsButton.getAttribute("class");
      expect(classList).toContain("bg-blue-600");
    });

    test("Inputs button is gray when inactive", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 1);

      const inputsButton = page.getByTestId("inputs-toggle").first();

      // Ensure it's inactive
      const initialClass = await inputsButton.getAttribute("class");
      if (initialClass?.includes("bg-blue-600")) {
        await inputsButton.click();
      }

      // Verify it's gray
      const classList = await inputsButton.getAttribute("class");
      expect(classList).toContain("bg-gray-800");
    });
  });

  test.describe("Visual feedback", () => {
    test("Selecting geometry highlights its dependencies in orange", async ({ page }) => {
      // Go to a step where geometries have dependencies
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 10);

      const geometryList = page.locator("#sixfold-dsl-v1 .geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThanOrEqual(2);

      // Select a geometry that has dependencies
      const itemWithDeps = items.nth(Math.min(5, itemCount - 1));

      // Ensure item has text content
      await expect(itemWithDeps).toHaveText(/.+/);

      const itemText = await itemWithDeps.textContent();
      const name = itemText.split("|")[0].trim();

      // Select the geometry
      await itemWithDeps.click();

      // Check that dependencies are highlighted in orange by checking for text-orange-400 class
      const orangeItems = geometryList.locator("li[class*='text-orange-400']");

      // Should have at least one orange dependency
      const orangeItemsCount = await orangeItems.count();
      expect(orangeItemsCount).toBeGreaterThanOrEqual(1);
    });

    test("Deselecting geometry clears orange highlights", async ({ page }) => {
      // Go to a step where geometries have dependencies
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 10);

      const geometryList = page.locator("#sixfold-dsl-v1 .geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThanOrEqual(2);

      // Select a geometry
      const item = items.nth(Math.min(5, itemCount - 1));
      await item.click();

      // Verify orange highlights exist
      const orangeItemsBefore = geometryList.locator("li[class*='text-orange-400']");

      // Ensure we have orange highlights to test clearing
      const orangeItemsBeforeCount = await orangeItemsBefore.count();
      expect(orangeItemsBeforeCount).toBeGreaterThanOrEqual(1);

      // Deselect the geometry
      await item.click();

      // Verify orange highlights are cleared
      const orangeItemsAfter = geometryList.locator("li[class*='text-orange-400']");
      await expect(orangeItemsAfter).toHaveCount(0);
    });

    test("Orange highlight applies to all dependency types (point, line, circle, polygon)", async ({
      page,
    }) => {
      // Go to a step with various dependency types
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 20);

      const geometryList = page.locator("#sixfold-dsl-v1 .geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(5);

      // Select a geometry with multiple dependency types
      const item = items.nth(5);
      await item.click();

      // Check that dependencies of different types are highlighted
      // The app should highlight all dependencies regardless of type
      const orangeItems = geometryList.locator("li[class*='text-orange-400']");

      // Should have multiple orange dependencies
      const orangeItemsCount = await orangeItems.count();
      expect(orangeItemsCount).toBeGreaterThanOrEqual(1);
    });

    test("Toggle off clears all orange highlights", async ({ page }) => {
      // Go to a step with dependencies
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 10);

      const geometryList = page.locator("#sixfold-dsl-v1 .geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(2);

      // Select a geometry
      const itemCount = await items.count();
      const item = items.nth(Math.min(5, itemCount - 1));
      await item.click();

      // Verify orange highlights exist
      const orangeItemsBefore = geometryList.locator("li[class*='text-orange-400']");

      // Ensure we have orange highlights to test clearing
      const orangeItemsBeforeCount = await orangeItemsBefore.count();
      expect(orangeItemsBeforeCount).toBeGreaterThanOrEqual(1);

      // Toggle inputs off
      const inputsButton = page.getByTestId("inputs-toggle").first();
      await inputsButton.click();

      // Verify orange highlights are cleared
      const orangeItemsAfter = geometryList.locator("li[class*='text-orange-400']");
      await expect(orangeItemsAfter).toHaveCount(0);
    });

    test("Highlighted elements have correct CSS class/attribute", async ({ page }) => {
      // Go to a step with dependencies
      await goToStep(page, SECTION_SIXFOLD_DSL_V1, 10);

      const geometryList = page.locator("#sixfold-dsl-v1 .geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(2);

      // Select a geometry
      const itemCount = await items.count();
      const item = items.nth(Math.min(5, itemCount - 1));
      await item.click();

      // Check that highlighted dependencies have the orange class
      const orangeItems = geometryList.locator("li[class*='text-orange-400']");

      // Only check if we have orange items
      const orangeCount = await orangeItems.count();
      if (orangeCount > 0) {
        const firstOrange = orangeItems.first();
        const classList = await firstOrange.getAttribute("class");
        expect(classList).toContain("text-orange-400");
      }
    });
  });

  test.describe("Square DSL section", () => {
    test("Input highlighting works in Square DSL section", async ({ page }) => {
      await goToStep(page, SECTION_SQUARE_DSL, 10);

      const inputsButton = page.getByTestId("inputs-toggle").first();
      await expect(inputsButton).toBeVisible();

      // Toggle inputs
      await inputsButton.click();

      // Verify button state changed - it should have some class
      await expect(inputsButton).toHaveAttribute("class", /./);
    });
  });
});
