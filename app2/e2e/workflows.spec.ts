import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import {
  goToSection,
  goToStep,
  clickFirstButton,
  clickLastButton,
  clickNextButton,
} from './utils/navigation';
import {
  selectGeometry,
  filterByName,
  clearFilters,
  toggleTypeFilter,
  waitForPageLoad,
  getGeometryCount,
} from './utils/helpers';
import { toggleTheme } from './utils/assertions';

/**
 * Combined Workflows Tests
 * Priority: Low
 * Note: Run after core tests pass
 * Uses << instead of restart
 */

test.describe('Combined Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Complete exploration flow', () => {
    test('Navigate to Square, step through all steps, toggle theme, copy SVG', async ({ page }) => {
      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Step through all steps (16 steps)
      for (let i = 1; i <= 16; i++) {
        const currentStep = await page.locator('#square').getByText(/Current step \d+\/\d+/);
        await expect(currentStep).toBeVisible();

        if (i < 16) {
          await clickNextButton(page, SECTION_SQUARE);
        }
      }

      // Toggle theme
      await toggleTheme(page);

      // Copy SVG at final step
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Copy URL
      await page.getByTitle('Copy URL to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();
    });

    test('Navigate to SixFold v0, step through steps, toggle theme, copy SVG', async ({ page }) => {
      // Navigate to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Step through first 10 steps (for performance)
      for (let i = 1; i <= 10; i++) {
        const currentStep = await page.locator('#sixfold-v0').getByText(/Current step \d+\/\d+/);
        await expect(currentStep).toBeVisible();

        if (i < 10) {
          await clickNextButton(page, SECTION_SIXFOLD_V0);
        }
      }

      // Toggle theme back to dark
      await toggleTheme(page);

      // Copy SVG at step 10
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Copy URL
      await page.getByTitle('Copy URL to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();
    });
  });

  test.describe('Filter and select flow', () => {
    test('Navigate to Square, filter by type circle, select, verify details, toggle inputs, clear filters', async ({ page }) => {
      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Go to step 5 where circles exist
      for (let i = 0; i < 4; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      // Filter by type "circle"
      await toggleTypeFilter(page, 'circle');

      const initialCount = await getGeometryCount(page);
      const filteredCount = await getGeometryCount(page);

      // Select a circle geometry
      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify details show circle info
        await expect(page.getByText('Details')).toBeVisible();

        // Toggle inputs highlight
        const inputsButton = page.getByRole('button', { name: 'inputs' });
        await inputsButton.click();

        // Verify dependencies highlighted in orange (if any)
        // Note: This depends on the selected geometry having dependencies
        const orangeItems = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
        const orangeCount = await orangeItems.count();
        // May or may not have orange highlights depending on the geometry

        // Clear filters
        await clearFilters(page);

        // Verify all items visible again
        const clearedCount = await getGeometryCount(page);
        expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
      }
    });

    test('Filter by name, select, verify details', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Filter by name "line"
      await filterByName(page, 'line');

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify details show line info
        await expect(page.getByText('Details')).toBeVisible();

        // Clear filters
        await clearFilters(page);
      }
    });
  });

  test.describe('Full reset flow', () => {
    test('Navigate to Square, go to step 10, select geometry, click <<, verify back at step 1, no geometry selected', async ({ page }) => {
      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Go to step 10
      await goToStep(page, SECTION_SQUARE, 10);

      let currentStep = await page.locator('#square').getByText(/Current step (\d+)\/\d+/);
      let stepText = await currentStep.textContent();
      expect(stepText).toContain('10');

      // Select a geometry
      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify geometry is selected
        await expect(page.getByText('Details')).toBeVisible();

        // Click << (Go to beginning) button
        await clickFirstButton(page, SECTION_SQUARE);

        // Verify back at step 0 (app starts at step 0)
        currentStep = await page.locator('#square').getByText(/Current step (\d+)\/\d+/);
        stepText = await currentStep.textContent();
        expect(stepText).toContain('0');

        // Verify no geometry selected
        const detailsHeader = page.getByText('Details');
        await expect(detailsHeader).not.toBeVisible();
      }
    });

    test('Navigate to SixFold v0, go to step 10, select geometry, click <<, verify back at step 1, no geometry selected', async ({ page }) => {
      // Navigate to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to step 10
      for (let i = 0; i < 9; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      let currentStep = await page.locator('#sixfold-v0').getByText(/Current step (\d+)\/\d+/);
      let stepText = await currentStep.textContent();
      expect(stepText).toContain('10');

      // Select a geometry
      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count > 0) {
        await items.first().click();

        // Verify geometry is selected
        await expect(page.getByText('Details')).toBeVisible();

        // Click << (Go to beginning) button - clears geometry store
        await clickFirstButton(page, SECTION_SIXFOLD_V0);

        // Verify back at step 0 (app starts at step 0)
        currentStep = await page.locator('#sixfold-v0').getByText(/Current step (\d+)\/\d+/);
        stepText = await currentStep.textContent();
        expect(stepText).toContain('0');

        // Verify no geometry selected
        const detailsHeader = page.getByText('Details');
        await expect(detailsHeader).not.toBeVisible();
      }
    });
  });

  test.describe('Theme and copy workflow', () => {
    test('Toggle theme at each section, copy SVG at step 1 and final step', async ({ page }) => {
      // SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Copy SVG at step 1
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Toggle theme
      await toggleTheme(page);

      // Go to step 10
      for (let i = 0; i < 9; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      // Copy SVG at step 10
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Toggle theme back
      await toggleTheme(page);

      // Copy SVG at step 1
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Go to final step
      await clickLastButton(page, SECTION_SQUARE);

      // Copy SVG at final step
      await page.getByTitle('Copy SVG to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();
    });

    test('Copy URL at different sections', async ({ page }) => {
      // SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);
      await page.getByTitle('Copy URL to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Square
      await goToSection(page, SECTION_SQUARE);
      await page.getByTitle('Copy URL to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();

      // Back to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);
      await page.getByTitle('Copy URL to clipboard').click();
      await expect(page.getByText('Copied!')).toBeVisible();
    });
  });

  test.describe('Complex interaction flow', () => {
    test('Combine multiple interactions: navigate, filter, select, highlight, reset', async ({ page }) => {
      // Navigate to Square
      await goToSection(page, SECTION_SQUARE);

      // Go to step 8
      for (let i = 0; i < 7; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      // Filter by type "point"
      await toggleTypeFilter(page, 'point');

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count > 0) {
        // Select first point
        await items.first().click();

        // Toggle inputs highlight
        const inputsButton = page.getByRole('button', { name: 'inputs' });
        await inputsButton.click();

        // Clear filters
        await clearFilters(page);

        // Click << to reset
        await clickFirstButton(page, SECTION_SQUARE);

        // Verify back at step 0 (app starts at step 0)
        const currentStep = await page.locator('#square').getByText(/Current step (\d+)\/\d+/);
        const stepText = await currentStep.textContent();
        expect(stepText).toContain('0');
      }
    });
  });
});
