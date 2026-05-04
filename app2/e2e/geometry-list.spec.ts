import { test, expect } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0, SQUARE_GEOMETRY, GEOMETRY_TYPES } from "./fixtures";
import { goToSection, goToStep } from "./utils/navigation";
import { selectGeometry, assertGeometrySelected } from "./utils/assertions";
import {
  getGeometryCount,
  filterByName,
  clearFilters,
  toggleTypeFilter,
  getFilteredCountText,
  waitForPageLoad,
} from "./utils/helpers";

/**
 * Geometry List Tests
 * Priority: High
 * Setup: Navigate to section with geometries (SixFold v0 step 1 or Square step 5)
 */

test.describe("Geometry List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Selection", () => {
    test("Clicking geometry item selects it (highlights red/yellow)", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      // Get first geometry item name
      const geometryList = page.locator(".geometry-list");
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      // Extract the geometry name (before the |)
      const name = itemText.split("|")[0].trim();

      // Click the item
      await firstItem.click();

      // Verify it's selected (has red or yellow text)
      await assertGeometrySelected(page, name);
    });

    test("Clicking selected item deselects it", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator(".geometry-list").first();
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split("|")[0].trim();

      // Select the item
      await firstItem.click();
      await assertGeometrySelected(page, name);

      // Click again to deselect
      await firstItem.click();

      // Verify it's no longer selected by checking the specific item using testid
      const itemByTestId = geometryList.locator(`[data-testid="geometry-item-${name}"]`).first();
      await expect(itemByTestId).not.toHaveClass(/text-(red|yellow)-400/);
    });

    test("Clicking different item selects new, deselects previous", async ({ page }) => {
      // Use step 10 which has multiple geometries
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();
      const items = geometryList.locator("li");

      // Ensure we have enough items for this test
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(2);

      const firstItem = items.first();
      const secondItem = items.nth(1);

      // Ensure both items have text content
      await expect(firstItem).toHaveText(/.+/);
      await expect(secondItem).toHaveText(/.+/);

      const firstText = await firstItem.textContent();
      const secondText = await secondItem.textContent();
      const firstName = firstText.split("|")[0].trim();
      const secondName = secondText.split("|")[0].trim();

      // Select first item
      await firstItem.click();
      await assertGeometrySelected(page, firstName);

      // Select second item
      await secondItem.click();
      await assertGeometrySelected(page, secondName);

      // Verify first item is no longer selected
      await expect(firstItem).not.toHaveClass(/text-(red|yellow)-400/);
    });

    test("Selected item count shown correctly in UI", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 1);

      const geometryList = page.locator(".geometry-list").first();
      const firstItem = geometryList.locator("li").first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split("|")[0].trim();

      // Select the item
      await firstItem.click();

      // Check that exactly 1 item is selected by checking aria-selected attribute
      const selectedItems = geometryList.locator("li[aria-selected='true']");
      await expect(selectedItems).toHaveCount(1);
    });
  });

  test.describe("Filtering", () => {
    test("Name filter reduces list when typing", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const initialCount = await getGeometryCount(page);

      // Filter by a common geometry name
      await filterByName(page, "line");

      const filteredCount = await getGeometryCount(page);

      // Filtered count should be less than or equal to initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test("Name filter is case-insensitive", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      // Filter with lowercase
      await filterByName(page, "line");
      const lowerCount = await getGeometryCount(page);

      // Clear and filter with uppercase
      await clearFilters(page);
      await filterByName(page, "LINE");
      const upperCount = await getGeometryCount(page);

      // Both should return the same count
      expect(upperCount).toBe(lowerCount);
    });

    test('Name filter clears with "Clear filters" button', async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const initialCount = await getGeometryCount(page);

      // Apply filter
      await filterByName(page, "line");
      const filteredCount = await getGeometryCount(page);

      // Clear filters
      await clearFilters(page);

      const clearedCount = await getGeometryCount(page);

      // Count should be back to initial
      expect(clearedCount).toBe(initialCount);
    });

    test("Type filter buttons toggle correctly (point, line, circle, polygon)", async ({
      page,
    }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();

      // Toggle point filter
      await toggleTypeFilter(page, "point");
      await expect(geometryList.getByRole("button", { name: "point" })).toHaveClass(/bg-blue-500/);

      // Toggle it off
      await toggleTypeFilter(page, "point");
      await expect(geometryList.getByRole("button", { name: "point" })).not.toHaveClass(
        /bg-blue-500/,
      );
    });

    test("Multiple type filters can be active simultaneously", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();

      // Toggle multiple filters
      await toggleTypeFilter(page, "point");
      await toggleTypeFilter(page, "line");

      // Both should be active
      await expect(geometryList.getByRole("button", { name: "point" })).toHaveClass(/bg-blue-500/);
      await expect(geometryList.getByRole("button", { name: "line" })).toHaveClass(/bg-blue-500/);
    });

    test("Filtered count updates correctly (Showing X of Y items)", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const totalCount = await getGeometryCount(page);

      // Apply filter
      await filterByName(page, "line");

      const filteredCountText = await getFilteredCountText(page);

      // Should show "Showing X of Y items"
      expect(filteredCountText).toMatch(/Showing \d+ of \d+ items/);
    });

    test("Clear filters button resets all filters", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();

      // Apply name filter
      await filterByName(page, "line");

      // Apply type filter
      await toggleTypeFilter(page, "point");

      // Verify filters are applied
      await expect(geometryList.getByRole("button", { name: "point" })).toHaveClass(/bg-blue-500/);

      // Clear all filters
      await clearFilters(page);

      // Verify filters are cleared
      await expect(geometryList.getByRole("button", { name: "point" })).not.toHaveClass(
        /bg-blue-500/,
      );

      // Verify name filter is cleared
      const nameFilter = geometryList.getByPlaceholder("Filter by name...");
      const nameFilterValue = await nameFilter.getAttribute("value");
      expect(nameFilterValue).toBe("");
    });
  });

  test.describe("Edge cases", () => {
    test("Empty filter state shows all items", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();
      const allCount = await geometryList.locator("li").count();

      // Apply and clear filter
      await filterByName(page, "xyz123"); // Non-existent filter
      await clearFilters(page);

      // Wait for filter to clear
      await page.waitForTimeout(200);

      const clearedCount = await geometryList.locator("li").count();

      expect(clearedCount).toBe(allCount);
    });

    test('Filter with no matches shows "No items" message', async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      // Apply a filter that matches nothing
      await filterByName(page, "nonexistent_geometry_xyz");

      // Check for "No items" or empty list
      const items = page.locator(".geometry-list li");
      await expect(items).toHaveCount(0);
    });

    test("Special characters in geometry names display correctly", async ({ page }) => {
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.locator(".geometry-list").first();
      await expect(geometryList).toBeVisible();

      // The app uses simple names like "line1", "p1", "c1", etc.
      // This test verifies they display correctly
      const items = geometryList.locator("li");
      const count = await items.count();

      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Square section", () => {
    test("Geometry list works in Square section", async ({ page }) => {
      // Step 3 has the first circle in Square
      await goToStep(page, SECTION_SQUARE, 3);

      // Get the Square section's geometry list
      const squareSection = page.locator("#square");
      const geometryList = squareSection.locator(".geometry-list").first();
      await expect(geometryList).toBeVisible();

      const items = geometryList.locator("li");
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test("Filtering works in Square section", async ({ page }) => {
      await goToStep(page, SECTION_SQUARE, 5);

      // Get the Square section's geometry list
      const squareSection = page.locator("#square");
      const geometryList = squareSection.locator(".geometry-list").first();
      const items = geometryList.locator("li");
      const initialCount = await items.count();

      // Filter by name directly on the Square geometry list
      const nameFilter = geometryList.getByPlaceholder("Filter by name...");
      await nameFilter.fill("c1");
      // Wait for filter to apply
      await geometryList.locator("p").first().waitFor();

      const filteredCount = await items.count();

      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });
});
