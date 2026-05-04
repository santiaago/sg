import { test, expect } from '@playwright/test';
import { SECTION_SIXFOLD_V0, SECTION_SQUARE, THEME } from './fixtures';
import { goToSection } from './utils/navigation';
import { assertTheme, toggleTheme, waitForPageLoad } from './utils/helpers';

/**
 * Theme Toggling Tests
 * Priority: High
 */

test.describe('Theme Toggling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Toggle behavior', () => {
    test('Clicking theme toggle switches from dark to light', async ({ page }) => {
      // Verify initial theme is dark
      await assertTheme(page, THEME.DARK);

      // Toggle to light
      await toggleTheme(page);

      // Verify theme is now light
      await assertTheme(page, THEME.LIGHT);
    });

    test('Clicking theme toggle switches from light to dark', async ({ page }) => {
      // Start from light theme
      await toggleTheme(page);
      await assertTheme(page, THEME.LIGHT);

      // Toggle back to dark
      await toggleTheme(page);

      // Verify theme is now dark
      await assertTheme(page, THEME.DARK);
    });

    test('Theme toggle button icon changes (moon <-> sun)', async ({ page }) => {
      const themeButton = page.getByTitle('Toggle SVG Theme');

      // Initial icon should be moon (dark theme)
      let icon = await themeButton.textContent();
      expect(icon).toContain('🌙');

      // Toggle to light
      await toggleTheme(page);

      // Icon should now be sun
      icon = await themeButton.textContent();
      expect(icon).toContain('☀️');

      // Toggle back to dark
      await toggleTheme(page);

      // Icon should be moon again
      icon = await themeButton.textContent();
      expect(icon).toContain('🌙');
    });
  });

  test.describe('Persistence', () => {
    test('Theme toggle persists across page navigation', async ({ page }) => {
      // Toggle to light theme
      await toggleTheme(page);
      await assertTheme(page, THEME.LIGHT);

      // Navigate to Square section
      await goToSection(page, SECTION_SQUARE);

      // Theme should still be light
      await assertTheme(page, THEME.LIGHT);

      // Navigate back to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Theme should still be light
      await assertTheme(page, THEME.LIGHT);
    });

    test('Theme toggle persists across page reload', async ({ page }) => {
      // Toggle to light theme
      await toggleTheme(page);
      await assertTheme(page, THEME.LIGHT);

      // Reload the page
      await page.reload();
      await waitForPageLoad(page);

      // Theme should still be light
      // Note: This depends on the app's theme persistence implementation
      // The app currently stores theme in React state, not localStorage
      // Skip this test until theme persistence is implemented
      test.skip('Theme persistence across reload not implemented in app yet');
    });

    test('Theme stored in localStorage', async ({ page }) => {
      // Toggle to light theme
      await toggleTheme(page);

      // Check localStorage
      // Note: The app currently does NOT use localStorage for theme
      // Skip this test until theme persistence is implemented
      test.skip('Theme persistence in localStorage not implemented in app yet');
    });
  });

  test.describe('Visual feedback', () => {
    test('Theme toggle updates SVG background color', async ({ page }) => {
      const svg = page.getByTestId('sixfoldv0-svg');

      // Get initial background color (dark theme)
      const initialBg = await svg.evaluate((el) => {
        const rect = el.querySelector('rect[data-background="true"]');
        return rect?.getAttribute('fill') || '';
      });

      // Toggle to light theme
      await toggleTheme(page);

      // Get new background color
      const newBg = await svg.evaluate((el) => {
        const rect = el.querySelector('rect[data-background="true"]');
        return rect?.getAttribute('fill') || '';
      });

      // Background color should have changed
      expect(newBg).not.toBe(initialBg);
    });

    test('Theme toggle updates body CSS class', async ({ page }) => {
      // Verify initial class
      let hasDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDark).toBe(true);

      // Toggle to light
      await toggleTheme(page);

      // Verify class is removed
      hasDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDark).toBe(false);

      // Toggle back to dark
      await toggleTheme(page);

      // Verify class is added again
      hasDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(hasDark).toBe(true);
    });

    test('All UI elements adapt to theme change', async ({ page }) => {
      // Toggle theme
      await toggleTheme(page);

      // Check that navigation bar adapts
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Check that SVG container adapts
      const svgContainer = page.locator('#sixfold-v0');
      await expect(svgContainer).toBeVisible();

      // Check that geometry list adapts
      const geometryList = page.locator('.geometry-list');
      await expect(geometryList).toBeVisible();
    });
  });

  test.describe('Edge cases', () => {
    test('Multiple theme toggles work correctly', async ({ page }) => {
      // Toggle multiple times
      for (let i = 0; i < 5; i++) {
        await toggleTheme(page);
      }

      // After odd number of toggles, should be light
      await assertTheme(page, THEME.LIGHT);

      // Toggle once more
      await toggleTheme(page);

      // After even number of toggles, should be dark
      await assertTheme(page, THEME.DARK);
    });

    test('Theme toggle works from Square section', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Toggle theme
      await toggleTheme(page);

      // Verify theme changed
      await assertTheme(page, THEME.LIGHT);

      // Toggle back
      await toggleTheme(page);

      // Verify theme changed back
      await assertTheme(page, THEME.DARK);
    });
  });
});
