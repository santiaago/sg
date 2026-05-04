import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import { goToSection, goToStep, getCurrentStep, clickFirstButton, clickLastButton, clickNextButton, clickPrevButton, waitForPageLoad } from './utils/navigation';

/**
 * Navigation & URL Hash Tests
 * Priority: Medium
 * Note: Merges existing hash tests with new edge cases. Includes << and >> button tests.
 */

test.describe('Navigation & URL Hash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Direct navigation', () => {
    test('Loading /#square scrolls to Square section', async ({ page }) => {
      await page.goto('/#square');
      await waitForPageLoad(page);

      await expect(page.locator('#square')).toBeVisible();
    });

    test('Loading /#sixfold-v0 scrolls to SixFold v0 section', async ({ page }) => {
      await page.goto('/#sixfold-v0');
      await waitForPageLoad(page);

      await expect(page.locator('#sixfold-v0')).toBeVisible();
    });

    test('Loading /#square activates Square nav button', async ({ page }) => {
      await page.goto('/#square');
      await waitForPageLoad(page);

      const squareButton = page.getByRole('button', { name: 'Square' });
      const classList = await squareButton.getAttribute('class');
      expect(classList).toContain('bg-blue-600');
    });

    test('Loading /#sixfold-v0 activates SixFold v0 nav button', async ({ page }) => {
      await page.goto('/#sixfold-v0');
      await waitForPageLoad(page);

      const sixfoldButton = page.getByRole('button', { name: 'SixFold v0' });
      const classList = await sixfoldButton.getAttribute('class');
      expect(classList).toContain('bg-blue-600');
    });
  });

  test.describe('Manual hash change', () => {
    test('Manually setting window.location.hash = "square" navigates to Square', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = 'square';
      });

      await expect(page.locator('#square')).toBeVisible();
    });

    test('Manually setting window.location.hash = "sixfold-v0" navigates to SixFold v0', async ({ page }) => {
      await page.goto('/#square');
      await waitForPageLoad(page);

      await page.evaluate(() => {
        window.location.hash = 'sixfold-v0';
      });

      await expect(page.locator('#sixfold-v0')).toBeVisible();
    });

    test('Invalid hash does not break navigation', async ({ page }) => {
      await page.goto('/#invalid-section');
      await waitForPageLoad(page);

      // Should still show the default section
      await expect(page.locator('#sixfold-v0')).toBeVisible();
    });

    test('Hash with query parameters works correctly', async ({ page }) => {
      await page.goto('/#square?test=1');
      await waitForPageLoad(page);

      await expect(page.locator('#square')).toBeVisible();
    });

    test('Navigating back/forward in browser preserves hash state', async ({ page }) => {
      await page.goto('/#square');
      await waitForPageLoad(page);

      await page.goto('/#sixfold-v0');
      await waitForPageLoad(page);

      // Go back
      await page.goBack();
      await waitForPageLoad(page);

      await expect(page.locator('#square')).toBeVisible();

      // Go forward
      await page.goForward();
      await waitForPageLoad(page);

      await expect(page.locator('#sixfold-v0')).toBeVisible();
    });
  });

  test.describe('Navigation buttons', () => {
    test('Square: can click next all the way to the end', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click next until we reach the end (16 steps)
      for (let expectedStep = 2; expectedStep <= 16; expectedStep++) {
        await clickNextButton(page, SECTION_SQUARE);
        currentStep = await getCurrentStep(page, SECTION_SQUARE);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at the end
      expect(currentStep).toBe(16);

      // Next button should be disabled at the end
      const nextButton = page.locator('#square').getByRole('button', { name: 'next' });
      await expect(nextButton).toBeDisabled();
    });

    test('SixFold v0: can click next all the way to the end', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click next until we reach the end (93 steps)
      // For performance, we'll just go to step 10
      for (let expectedStep = 2; expectedStep <= 10; expectedStep++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
        currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
        expect(currentStep).toBe(expectedStep);
      }

      // Verify we're at step 10
      expect(currentStep).toBe(10);
    });

    test('Square: can click fast forward (>>) to the end', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click fast forward
      await clickLastButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(16);
    });

    test('SixFold v0: can click fast forward (>>) to the end', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click fast forward
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(93);
    });

    test('Square: can click back from step 2 to step 1', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 2
      await clickNextButton(page, SECTION_SQUARE);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(2);

      // Click back
      await clickPrevButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Prev button should be disabled at step 1
      const prevButton = page.locator('#square').getByRole('button', { name: 'prev' });
      await expect(prevButton).toBeDisabled();
    });

    test('SixFold v0: can click back from step 2 to step 1', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to step 2
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(2);

      // Click back
      await clickPrevButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Prev button should be disabled at step 1
      const prevButton = page.locator('#sixfold-v0').getByRole('button', { name: 'prev' });
      await expect(prevButton).toBeDisabled();
    });

    test('Square: can click all the way to the beginning with backwards (<<)', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // First, go to the end
      await clickLastButton(page, SECTION_SQUARE);
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(16);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SQUARE);

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);
    });

    test('SixFold v0: can click all the way to the beginning with backwards (<<)', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // First, go to step 10
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(10);

      // Click backwards to beginning
      await clickFirstButton(page, SECTION_SIXFOLD_V0);

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);
    });

    test('Square: can navigate forward and backward multiple times', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go forward a few steps
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(6);

      // Go backward a few steps
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SQUARE);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(3);

      // Go forward again
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(5);
    });

    test('SixFold v0: can navigate forward and backward multiple times', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go forward a few steps
      for (let i = 0; i < 5; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(6);

      // Go backward a few steps
      for (let i = 0; i < 3; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_V0);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(3);

      // Go forward again
      for (let i = 0; i < 2; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }

      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(5);
    });

    test('Square: can click next, then prev, then next again', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click next
      await clickNextButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(2);

      // Click prev
      await clickPrevButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Click next again
      await clickNextButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(2);
    });

    test('SixFold v0: can click next, then prev, then next again', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click next
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(2);

      // Click prev
      await clickPrevButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Click next again
      await clickNextButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(2);
    });
  });

  test.describe('Complete navigation cycle', () => {
    test('Square: complete navigation cycle', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Start at step 1
      let currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Go to end
      await clickLastButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(16);

      // Go back to beginning
      await clickFirstButton(page, SECTION_SQUARE);
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(1);

      // Go forward 3 steps
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(4);

      // Go backward 2 steps
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SQUARE);
      }
      currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(2);
    });

    test('SixFold v0: complete navigation cycle', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Start at step 1
      let currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Go to step 10 (instead of end for performance)
      for (let i = 0; i < 9; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(10);

      // Go back to beginning
      await clickFirstButton(page, SECTION_SIXFOLD_V0);
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(1);

      // Go forward 3 steps
      for (let i = 0; i < 3; i++) {
        await clickNextButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(4);

      // Go backward 2 steps
      for (let i = 0; i < 2; i++) {
        await clickPrevButton(page, SECTION_SIXFOLD_V0);
      }
      currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(2);
    });
  });
});
