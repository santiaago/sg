import { type Page, type Locator } from '@playwright/test';



/**
 * Wait for page to fully load
 */
export async function waitForPageLoad(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout });
  // Wait for main content to be visible as a proxy for React hydration
  await page.waitForSelector('main', { state: 'visible', timeout: 3000 }).catch(() => {});
}

/**
 * Check if an element is keyboard focusable
 */
export async function isFocusable(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => {
    const tabIndex = parseInt(el.getAttribute('tabindex') || '0', 10);
    const isNativeFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    return (tabIndex >= 0 && !el.hasAttribute('disabled')) || isNativeFocusable;
  });
}

/**
 * Get the number of geometry items in the list
 */
export async function getGeometryCount(page: Page): Promise<number> {
  const geometryList = page.locator('.geometry-list').first();
  const items = geometryList.locator('li');
  return await items.count();
}

/**
 * Filter geometry list by name
 */
export async function filterByName(page: Page, name: string): Promise<void> {
  const geometryList = page.locator('.geometry-list').first();
  await geometryList.getByPlaceholder('Filter by name...').fill(name);
  
  // Wait for filter to apply by checking the filtered count updates
  await geometryList.locator('p').first().waitFor();
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page): Promise<void> {
  const geometryList = page.locator('.geometry-list').first();
  const clearButton = geometryList.getByText('Clear filters');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}

/**
 * Toggle type filter
 */
export async function toggleTypeFilter(page: Page, type: string): Promise<void> {
  const geometryList = page.locator('.geometry-list').first();
  await geometryList.getByRole('button', { name: type }).click();
}

/**
 * Get the filtered count text
 */
export async function getFilteredCountText(page: Page): Promise<string> {
  const geometryList = page.locator('.geometry-list').first();
  return await geometryList.locator('p').first().textContent() || '';
}