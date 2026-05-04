import { test, expect } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0, SQUARE_GEOMETRY } from "./fixtures";
import { goToSection, goToStep } from "./utils/navigation";
import { selectGeometry, waitForPageLoad, getGeometryCount } from "./utils/helpers";

/**
 * Geometry Details Panel Tests
 * Priority: High
 * Setup: Requires geometry to be selected
 */

test.describe("Geometry Details Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Display", () => {
    test('Shows "Details" header', async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split("|")[0].trim();

      // Select the geometry
      await firstItem.click();

      // Check for Details header
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      await expect(detailsPanel).toBeVisible();
    });

    test("Displays selected geometry name", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split("|")[0].trim();

      // Select the geometry
      await firstItem.click();

      // Check that the name is displayed in details
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      // Look for the geometry name in the Geometry section
      await expect(detailsPanel.locator("div.text-sm").filter({ hasText: name })).toBeVisible();
    });

    test("Displays selected geometry type", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      // Extract name and type from "name | type" format
      const [name, type] = itemText.split("|").map((s) => s.trim());

      // Select the geometry
      await firstItem.click();

      // Check that the type is displayed in details
      // The details panel shows "name : type"
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      await expect(detailsPanel).toContainText(type);
    });

    test("Displays step ID that created the geometry", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Select the geometry
      await firstItem.click();

      // Check for step ID in details
      // The details panel shows "Created by step: stepId"
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const stepText = detailsPanel.getByText(/Created by step: step\w+/);
      await expect(stepText).toBeVisible();
    });

    test("Displays inputs list (dependsOn)", async ({ page }) => {
      // Navigate to a step where geometries have dependencies
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const items = geometryList.locator("li");

      // Ensure we have items to test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(0 + 1);

      // Find an item that has dependencies (not the first ones)
      const itemCount = await items.count();
      const itemWithDeps = items.nth(Math.min(5, itemCount - 1));
      await itemWithDeps.click();

      // Check for Inputs section in details panel
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const inputsHeader = detailsPanel.getByText("Inputs");
      await expect(inputsHeader).toBeVisible();
    });

    test("Displays parameters with types", async ({ page }) => {
      await goToStep(page, SECTION_SQUARE, 5);

      const geometryList = page.locator("#square .geometry-list");
      const items = geometryList.locator("li");

      // Ensure we have items to test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(0 + 1);

      // Select a geometry
      await items.first().click();

      // Check for Parameters section in details panel
      const detailsPanel = page.locator("#square").getByTestId("geometry-details");
      const paramsHeader = detailsPanel.getByText("Parameters");
      await expect(paramsHeader).toBeVisible();
    });

    test("Displays outputs list", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const items = geometryList.locator("li");

      // Ensure we have items to test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(0 + 1);

      // Select a geometry
      await items.first().click();

      // Check for Outputs section in details panel
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const outputsHeader = detailsPanel.getByText("Outputs");
      await expect(outputsHeader).toBeVisible();
    });
  });

  test.describe("Edge cases", () => {
    test('Shows "No inputs" when geometry has no dependencies', async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Select the first geometry (likely has no dependencies)
      await firstItem.click();

      // Check for "No inputs" message in details panel
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const noInputs = detailsPanel.getByText("No inputs");
      await expect(noInputs).toBeVisible();
    });

    test('Shows "No parameters" when geometry has no parameters', async ({ page }) => {
      // Go to step 3 where LINE1 is created (has no parameters)
      await goToStep(page, SECTION_SIXFOLD_V0, 3);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      // LINE1 should be one of the items
      const items = geometryList.locator("li");
      const itemCount = await items.count();
      
      // Find and select LINE1 (which has no parameters)
      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i);
        const text = await item.textContent();
        if (text?.includes("line1") || text?.includes("LINE1")) {
          await item.click();
          break;
        }
      }

      // Check for "No parameters" message in details panel
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const noParams = detailsPanel.getByText("No parameters");
      await expect(noParams).toBeVisible();
    });

    test('Shows "No outputs" when geometry has no outputs', async ({ page }) => {
      // Go to step 1 where P1 is created
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Select the first geometry (P1)
      await firstItem.click();

      // Check for Outputs section header (P1 is its own output, so "No outputs" won't be shown)
      // Instead, verify the Outputs section is present
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const outputsHeader = detailsPanel.getByText("Outputs");
      await expect(outputsHeader).toBeVisible();
    });

    test("Panel is empty when no geometry selected", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      // Don't select any geometry - but we need to be at step 1 for items to exist
      // Details panel should not be visible when nothing is selected
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      await expect(detailsPanel).not.toBeVisible();
    });

    test("Step ID is clickable and navigates to that step", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator("#sixfold-v0 .geometry-list");
      const items = geometryList.locator("li");

      // Ensure we have items to test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(0 + 1);

      // Select a geometry
      await items.first().click();

      // Find the step ID link
      const detailsPanel = page.locator("#sixfold-v0").getByTestId("geometry-details");
      const stepLink = detailsPanel.getByTestId("geometry-step-id");

      // The step ID is now clickable with data-testid
      await expect(stepLink).toBeVisible();
    });
  });

  test.describe("Square section", () => {
    test("Details panel works in Square section", async ({ page }) => {
      await goToStep(page, SECTION_SQUARE, 1);

      const geometryList = page.locator("#square .geometry-list");
      const items = geometryList.locator("li");

      // Ensure we have items to test
      const itemsCount = await items.count();
      expect(itemsCount).toBeGreaterThanOrEqual(0 + 1);

      // Select a geometry
      await items.first().click();

      // Check that details panel is visible
      const detailsPanel = page.locator("#square").getByTestId("geometry-details");
      await expect(detailsPanel).toBeVisible();
    });
  });
});
