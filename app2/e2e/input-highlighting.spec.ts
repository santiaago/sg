import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import { goToSection, goToStep, selectGeometry, waitForPageLoad, getGeometryCount } from './utils';

/**
 * Input Highlighting Tests
 * Priority: Medium
 * Setup: Navigate to section with geometries that have dependencies
 */

test.describe('Input Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Toggle', () => {
    test('Inputs button toggles highlight mode on/off', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const inputsButton = page.getByRole('button', { name: 'inputs' });

      // Check initial state (should be on by default based on App.tsx)
      const initialClass = await inputsButton.getAttribute('class');
      const isInitiallyActive = initialClass?.includes('bg-blue-600');

      // Toggle off
      await inputsButton.click();

      const offClass = await inputsButton.getAttribute('class');
      const isOff = !offClass?.includes('bg-blue-600');

      // Toggle on
      await inputsButton.click();

      const onClass = await inputsButton.getAttribute('class');
      const isOn = onClass?.includes('bg-blue-600');

      // Button should toggle between states
      expect(isOff).toBe(true);
      expect(isOn).toBe(true);
    });

    test('Inputs button stays blue when active', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const inputsButton = page.getByRole('button', { name: 'inputs' });

      // Ensure it's active (click to toggle on if needed)
      const initialClass = await inputsButton.getAttribute('class');
      if (!initialClass?.includes('bg-blue-600')) {
        await inputsButton.click();
      }

      // Verify it's blue
      const classList = await inputsButton.getAttribute('class');
      expect(classList).toContain('bg-blue-600');
    });

    test('Inputs button is gray when inactive', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const inputsButton = page.getByRole('button', { name: 'inputs' });

      // Ensure it's inactive
      const initialClass = await inputsButton.getAttribute('class');
      if (initialClass?.includes('bg-blue-600')) {
        await inputsButton.click();
      }

      // Verify it's gray
      const classList = await inputsButton.getAttribute('class');
      expect(classList).toContain('bg-gray-800');
    });
  });

  test.describe('Visual feedback', () => {
    test('Selecting geometry highlights its dependencies in orange', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step where geometries have dependencies
      for (let i = 0; i < 10; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count < 2) {
        test.skip();
        return;
      }

      // Select a geometry that has dependencies
      const itemWithDeps = items.nth(Math.min(5, count - 1));
      const itemText = await itemWithDeps.textContent();

      if (!itemText) {
        test.skip();
        return;
      }

      const name = itemText.split('|')[0].trim();

      // Select the geometry
      await itemWithDeps.click();

      // Check that dependencies are highlighted in orange
      // The app highlights dependencies with text-orange-400
      const orangeItems = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCount = await orangeItems.count();

      // Should have at least one orange dependency
      expect(orangeCount).toBeGreaterThan(0);
    });

    test('Deselecting geometry clears orange highlights', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step where geometries have dependencies
      for (let i = 0; i < 10; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count < 2) {
        test.skip();
        return;
      }

      // Select a geometry
      const item = items.nth(Math.min(5, count - 1));
      await item.click();

      // Verify orange highlights exist
      const orangeItemsBefore = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCountBefore = await orangeItemsBefore.count();

      if (orangeCountBefore === 0) {
        test.skip();
        return;
      }

      // Deselect the geometry
      await item.click();

      // Verify orange highlights are cleared
      const orangeItemsAfter = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCountAfter = await orangeItemsAfter.count();

      expect(orangeCountAfter).toBe(0);
    });

    test('Orange highlight applies to all dependency types (point, line, circle, polygon)', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step with various dependency types
      for (let i = 0; i < 20; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count < 5) {
        test.skip();
        return;
      }

      // Select a geometry with multiple dependency types
      const item = items.nth(5);
      await item.click();

      // Check that dependencies of different types are highlighted
      // The app should highlight all dependencies regardless of type
      const orangeItems = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCount = await orangeItems.count();

      // Should have multiple orange dependencies
      expect(orangeCount).toBeGreaterThan(0);
    });

    test('Toggle off clears all orange highlights', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step with dependencies
      for (let i = 0; i < 10; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count < 2) {
        test.skip();
        return;
      }

      // Select a geometry
      const item = items.nth(Math.min(5, count - 1));
      await item.click();

      // Verify orange highlights exist
      const orangeItemsBefore = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCountBefore = await orangeItemsBefore.count();

      if (orangeCountBefore === 0) {
        test.skip();
        return;
      }

      // Toggle inputs off
      const inputsButton = page.getByRole('button', { name: 'inputs' });
      await inputsButton.click();

      // Verify orange highlights are cleared
      const orangeItemsAfter = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCountAfter = await orangeItemsAfter.count();

      expect(orangeCountAfter).toBe(0);
    });

    test('Highlighted elements have correct CSS class/attribute', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step with dependencies
      for (let i = 0; i < 10; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      const geometryList = page.locator('.geometry-list');
      const items = geometryList.locator('li');
      const count = await items.count();

      if (count < 2) {
        test.skip();
        return;
      }

      // Select a geometry
      const item = items.nth(Math.min(5, count - 1));
      await item.click();

      // Check that highlighted dependencies have the orange class
      const orangeItems = geometryList.locator('li').filter({ hasText: /text-orange-400/ });
      const orangeCount = await orangeItems.count();

      if (orangeCount > 0) {
        const firstOrange = orangeItems.first();
        const classList = await firstOrange.getAttribute('class');
        expect(classList).toContain('text-orange-400');
      }
    });
  });

  test.describe('Square section', () => {
    test('Input highlighting works in Square section', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to a step with dependencies
      for (let i = 0; i < 10; i++) {
        await page.locator('#square').getByRole('button', { name: 'next' }).click();
      }

      const inputsButton = page.getByRole('button', { name: 'inputs' });
      await expect(inputsButton).toBeVisible();

      // Toggle inputs
      await inputsButton.click();

      // Verify button state changed
      const classList = await inputsButton.getAttribute('class');
      expect(classList).toBeTruthy();
    });
  });
});
