import { type Page, type Locator, expect } from '@playwright/test';
import {
  THEME,
} from '../fixtures';

/**
 * State helpers and assertions
 */

/**
 * Assert the current theme
 */
export async function assertTheme(page: Page, expected: typeof THEME.DARK | typeof THEME.LIGHT): Promise<void> {
  const hasDark = await page.evaluate(() => 
    document.documentElement.classList.contains('dark')
  );
  const actual = hasDark ? THEME.DARK : THEME.LIGHT;
  
  if (actual !== expected) {
    throw new Error(`Expected theme to be ${expected}, but was ${actual}`);
  }
}

/**
 * Toggle the theme
 */
export async function toggleTheme(page: Page): Promise<void> {
  await page.getByTestId('theme-toggle').click();
}

/**
 * Assert geometry is selected in the store
 */
export async function assertGeometrySelected(page: Page, name: string): Promise<void> {
  // Check that the geometry item has aria-selected="true"
  const item = page.locator(`[data-testid="geometry-item-${name}"]`).first();
  await expect(item).toHaveAttribute('aria-selected', 'true');
}

/**
 * Select a geometry item from the list
 */
export async function selectGeometry(page: Page, name: string): Promise<void> {
  const geometryList = page.locator('.geometry-list').first();
  await geometryList.locator(`[data-testid="geometry-item-${name}"]`).first().click();
  
  // Verify selection by checking the item has aria-selected="true"
  await assertGeometrySelected(page, name);
}

/**
 * Assert SVG is valid using browser context
 */
export async function assertSVGValid(page: Page, svg: string): Promise<void> {
  await page.evaluate((svgString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('Invalid SVG: parse error');
    }
  }, svg);
}

