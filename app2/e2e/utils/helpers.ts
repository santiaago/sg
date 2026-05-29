import { type Page, type Locator } from "@playwright/test";

/**
 * Wait for page to fully load
 */
export async function waitForPageLoad(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout });
  // Wait for main content to be visible as a proxy for React hydration
  await page.waitForSelector("main", { state: "visible", timeout: 10000 });
  // Wait for navigation to be ready
  await page.waitForSelector("nav", { state: "visible", timeout: 10000 });
  // Wait for first section to be visible
  await page.waitForSelector("#sixfold-dsl-v1", { state: "visible", timeout: 10000 });
  // Wait for SVG to be ready
  await page.waitForSelector("[data-testid='sixfold-dsl-v1-svg']", { state: "visible", timeout: 10000 });
  // Wait for geometry list to be ready
  await page.waitForSelector(".geometry-list", { state: "visible", timeout: 10000 });
}

/**
 * Check if an element is keyboard focusable
 */
export async function isFocusable(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => {
    const tabIndex = parseInt(el.getAttribute("tabindex") || "0", 10);
    const isNativeFocusable = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"].includes(el.tagName);
    return (tabIndex >= 0 && !el.hasAttribute("disabled")) || isNativeFocusable;
  });
}

/**
 * Get the number of geometry items in the list
 */
export async function getGeometryCount(page: Page, section?: string): Promise<number> {
  const selector = section ? `${section} .geometry-list` : ".geometry-list";
  const geometryList = page.locator(selector).first();
  const items = geometryList.locator("li");
  return await items.count();
}

/**
 * Filter geometry list by name
 */
export async function filterByName(page: Page, name: string, section?: string): Promise<void> {
  const selector = section ? `${section} .geometry-list` : ".geometry-list";
  const geometryList = page.locator(selector).first();
  await geometryList.getByPlaceholder("Filter by name...").fill(name);

  // Wait for filter to apply by checking the filtered count updates
  await geometryList.locator("p").first().waitFor();
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page, section?: string): Promise<void> {
  const selector = section ? `${section} .geometry-list` : ".geometry-list";
  const geometryList = page.locator(selector).first();
  const clearButton = geometryList.getByText("Clear filters");
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}

/**
 * Toggle type filter
 */
export async function toggleTypeFilter(page: Page, type: string, section?: string): Promise<void> {
  const selector = section ? `${section} .geometry-list` : ".geometry-list";
  const geometryList = page.locator(selector).first();
  await geometryList.getByRole("button", { name: type }).click();
}

/**
 * Get the filtered count text
 */
export async function getFilteredCountText(page: Page, section?: string): Promise<string> {
  const selector = section ? `${section} .geometry-list` : ".geometry-list";
  const geometryList = page.locator(selector).first();
  return (await geometryList.locator("p").first().textContent()) || "";
}

/**
 * Wait for geometry items to be present in a section
 */
export async function waitForGeometryItems(
  page: Page,
  sectionSelector: string,
  minCount: number = 1,
): Promise<void> {
  const geometryList = page.locator(`${sectionSelector} .geometry-list`);
  const items = geometryList.locator("li");
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}
