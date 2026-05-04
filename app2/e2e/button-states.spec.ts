import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import { goToSection, goToStep, clickFirstButton, clickLastButton, clickNextButton, clickPrevButton, getCurrentStep } from './utils/navigation';
import { waitForPageLoad } from './utils/helpers';

/**
 * Button States Tests
 * Priority: Medium
 * Note: Uses << (Go to beginning) button instead of restart
 */

test.describe('Button States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('At step 0 (initial state)', () => {
    test('Prev button is disabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const prevButton = page.locator('#square').getByTestId('step-prev');
      await expect(prevButton).toBeDisabled();
    });

    test('Prev button is disabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const prevButton = page.locator('#sixfold-v0').getByTestId('step-prev');
      await expect(prevButton).toBeDisabled();
    });

    test('First (<<) button is disabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const firstButton = page.locator('#square').getByTestId('step-first');
      await expect(firstButton).toBeDisabled();
    });

    test('First (<<) button is disabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const firstButton = page.locator('#sixfold-v0').getByTestId('step-first');
      await expect(firstButton).toBeDisabled();
    });

    test('Next button is enabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const nextButton = page.locator('#square').getByTestId('step-next');
      await expect(nextButton).toBeEnabled();
    });

    test('Next button is enabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const nextButton = page.locator('#sixfold-v0').getByTestId('step-next');
      await expect(nextButton).toBeEnabled();
    });

    test('Last (>>) button is enabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const lastButton = page.locator('#square').getByTestId('step-last');
      await expect(lastButton).toBeEnabled();
    });

    test('Last (>>) button is enabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const lastButton = page.locator('#sixfold-v0').getByTestId('step-last');
      await expect(lastButton).toBeEnabled();
    });
  });

  test.describe('At last step', () => {
    test('Next button is disabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const nextButton = page.locator('#square').getByRole('button', { name: 'next' });
      await expect(nextButton).toBeDisabled();
    });

    test('Next button is disabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const nextButton = page.locator('#sixfold-v0').getByRole('button', { name: 'next' });
      await expect(nextButton).toBeDisabled();
    });

    test('Last (>>) button is disabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const lastButton = page.locator('#square').getByTitle('Go to end');
      await expect(lastButton).toBeDisabled();
    });

    test('Last (>>) button is disabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const lastButton = page.locator('#sixfold-v0').getByTitle('Go to end');
      await expect(lastButton).toBeDisabled();
    });

    test('Prev button is enabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const prevButton = page.locator('#square').getByRole('button', { name: 'prev' });
      await expect(prevButton).toBeEnabled();
    });

    test('Prev button is enabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const prevButton = page.locator('#sixfold-v0').getByRole('button', { name: 'prev' });
      await expect(prevButton).toBeEnabled();
    });

    test('First (<<) button is enabled for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);
      await clickLastButton(page, SECTION_SQUARE);

      const firstButton = page.locator('#square').getByTitle('Go to beginning');
      await expect(firstButton).toBeEnabled();
    });

    test('First (<<) button is enabled for SixFold v0', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);
      await clickLastButton(page, SECTION_SIXFOLD_V0);

      const firstButton = page.locator('#sixfold-v0').getByTitle('Go to beginning');
      await expect(firstButton).toBeEnabled();
    });
  });

  test.describe('At middle step', () => {
    test('Prev button is enabled', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 8 (middle of 16)
      for (let i = 0; i < 7; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      const prevButton = page.locator('#square').getByRole('button', { name: 'prev' });
      await expect(prevButton).toBeEnabled();
    });

    test('Next button is enabled', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 8 (middle of 16)
      for (let i = 0; i < 7; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      const nextButton = page.locator('#square').getByRole('button', { name: 'next' });
      await expect(nextButton).toBeEnabled();
    });

    test('First (<<) button is enabled', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 8 (middle of 16)
      for (let i = 0; i < 7; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      const firstButton = page.locator('#square').getByTitle('Go to beginning');
      await expect(firstButton).toBeEnabled();
    });

    test('Last (>>) button is enabled', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 8 (middle of 16)
      for (let i = 0; i < 7; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      const lastButton = page.locator('#square').getByTitle('Go to end');
      await expect(lastButton).toBeEnabled();
    });

    test('All navigation buttons have correct aria-labels', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Check prev button
      const prevButton = page.locator('#square').getByRole('button', { name: 'prev' });
      await expect(prevButton).toHaveAttribute('aria-label', /prev/);

      // Check next button
      const nextButton = page.locator('#square').getByRole('button', { name: 'next' });
      await expect(nextButton).toHaveAttribute('aria-label', /next/);

      // Check first button
      const firstButton = page.locator('#square').getByTitle('Go to beginning');
      await expect(firstButton).toHaveAttribute('title', 'Go to beginning');

      // Check last button
      const lastButton = page.locator('#square').getByTitle('Go to end');
      await expect(lastButton).toHaveAttribute('title', 'Go to end');
    });
  });

  test.describe('Edge cases', () => {
    test('Button states update correctly when navigating', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // At step 1, prev and first should be disabled
      const prevButton = page.locator('#square').getByRole('button', { name: 'prev' });
      const firstButton = page.locator('#square').getByTitle('Go to beginning');
      await expect(prevButton).toBeDisabled();
      await expect(firstButton).toBeDisabled();

      // Go to step 2
      await clickNextButton(page, SECTION_SQUARE);

      // Now prev and first should be enabled
      await expect(prevButton).toBeEnabled();
      await expect(firstButton).toBeEnabled();
    });

    test('Button states persist across section changes', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to step 5
      for (let i = 0; i < 4; i++) {
        await clickNextButton(page, SECTION_SQUARE);
      }

      // Navigate to SixFold v0
      await goToSection(page, SECTION_SIXFOLD_V0);

      // SixFold v0 should be at step 1, so prev and first should be disabled
      const prevButton = page.locator('#sixfold-v0').getByRole('button', { name: 'prev' });
      const firstButton = page.locator('#sixfold-v0').getByTitle('Go to beginning');
      await expect(prevButton).toBeDisabled();
      await expect(firstButton).toBeDisabled();
    });
  });
});
