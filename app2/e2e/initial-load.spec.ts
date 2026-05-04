import { test, expect } from '@playwright/test';
import {
  SECTION_SIXFOLD_V0,
  SECTION_SQUARE,
  THEME,
  SVG_CONFIG,
} from './fixtures';
import {
  goToSection,
  getCurrentStep,
} from './utils/navigation';
import {
  assertTheme,
  waitForPageLoad,
} from './utils/helpers';
import {
  getConsoleMessages,
} from './utils/console';

/**
 * P0 - Initial Page Load Tests
 * Prerequisite for all other tests
 * Tests verify that the page loads correctly without errors or warnings
 */

test.describe('Initial Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('Page loads without console errors', async ({ page }) => {
    const { errors } = await getConsoleMessages(page);
    expect(errors).toHaveLength(0);
  });

  test('Page loads without console warnings', async ({ page }) => {
    const { warnings } = await getConsoleMessages(page);
    // Note: Some warnings may be expected in development mode
    // This test can be adjusted based on actual app behavior
    expect(warnings).toHaveLength(0);
  });

  test('Page loads without unhandled promise rejections', async ({ page }) => {
    // Listen for unhandled promise rejections
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Wait for any async errors by waiting for network idle
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('Defaults to first section in navigation order', async ({ page }) => {
    // The first section should be visible
    await expect(page.locator('#sixfold-v0')).toBeVisible();
  });

  test('First section starts at step 1', async ({ page }) => {
    const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
    expect(currentStep).toBe(1);
  });

  test('Non-first sections are not visible initially', async ({ page }) => {
    // Square section should not be visible initially
    await expect(page.locator('#square')).not.toBeVisible();
  });

  test('Theme is dark by default', async ({ page }) => {
    await assertTheme(page, THEME.DARK);
  });

  test('Navigation bar is visible and interactive', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check navigation buttons exist
    await expect(page.getByRole('button', { name: 'SixFold v0' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Square' })).toBeVisible();
    
    // Check theme toggle exists
    await expect(page.getByTitle('Toggle SVG Theme')).toBeVisible();
  });

  test('SixFold v0 SVG has correct dimensions', async ({ page }) => {
    const svg = page.getByTestId('sixfoldv0-svg');
    await expect(svg).toBeVisible();
    
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    
    // SVG should have width and height attributes
    expect(width).toBeTruthy();
    expect(height).toBeTruthy();
    
    // Check viewBox
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toContain(SVG_CONFIG.VIEWBOX.split(' ')[0]);
  });

  test('Square SVG has correct dimensions', async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);
    
    const svg = page.getByTestId('square-svg');
    await expect(svg).toBeVisible();
    
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    
    expect(width).toBeTruthy();
    expect(height).toBeTruthy();
  });

  test('Geometry List shows all items for current section', async ({ page }) => {
    const geometryList = page.locator('.geometry-list');
    await expect(geometryList).toBeVisible();
    
    // At step 1, there should be some geometry items
    const items = geometryList.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Geometry Details panel is empty initially', async ({ page }) => {
    // At step 1 with no geometry selected, details panel should be empty
    const detailsPanel = page.locator('.geometry-list').locator('..').getByText('Details');
    
    // Check if details panel exists and is empty
    // The details panel is in the right pane, not in geometry-list
    const rightPane = page.locator('#sixfold-v0').getByText('Right pane');
    await expect(rightPane).toBeVisible();
    
    // Details should not be visible when nothing is selected
    const detailsHeader = page.getByText('Details');
    await expect(detailsHeader).not.toBeVisible();
  });

  test('Page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/sg/);
  });

  test('Main heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'sg' })).toBeVisible();
  });

  test('URL hash is empty on initial load', async ({ page }) => {
    const hash = page.url().split('#')[1];
    expect(hash).toBeUndefined();
  });
});
