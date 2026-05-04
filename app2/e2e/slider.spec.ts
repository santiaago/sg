import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import { goToSection, getCurrentStep, waitForPageLoad } from './utils/navigation';

/**
 * Slider Navigation Tests
 * Priority: Medium
 */

test.describe('Slider Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Square', () => {
    test('Slider exists for Square section', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');
      await expect(slider).toBeVisible();
    });

    test('Slider min = 1, max = total steps for Square', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');

      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');

      expect(min).toBe('1');
      // Square has 16 steps
      expect(max).toBe('16');
    });

    test('Slider value matches current step', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');
      const currentStep = await getCurrentStep(page, SECTION_SQUARE);

      const value = await slider.getAttribute('value');
      expect(parseInt(value || '0', 10)).toBe(currentStep);
    });

    test('Dragging slider updates current step', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');

      // Drag slider to step 5
      await slider.evaluate((el) => {
        (el as HTMLInputElement).value = '5';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Wait for step to update
      await expect(page.locator('#square').getByText(/Current step 5\/\d+/)).toBeVisible();

      const currentStep = await getCurrentStep(page, SECTION_SQUARE);
      expect(currentStep).toBe(5);
    });

    test('Slider thumb position matches step percentage', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');

      // Go to step 8 (50% of 16 steps)
      for (let i = 0; i < 7; i++) {
        await page.locator('#square').getByRole('button', { name: 'next' }).click();
      }

      // Check slider value
      const value = await slider.getAttribute('value');
      expect(value).toBe('8');
    });

    test('Slider step labels show 1 and max', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const labels = page.locator('#square .text-xs.text-gray-400 span');
      const count = await labels.count();

      expect(count).toBe(2);

      const firstLabel = labels.first();
      const lastLabel = labels.last();

      await expect(firstLabel).toHaveText('1');
      await expect(lastLabel).toHaveText('16');
    });

    test('Slider is keyboard accessible (arrow keys change value)', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');
      await slider.focus();

      // Press right arrow to increase
      await page.keyboard.press('ArrowRight');

      // Wait for value to update
      await expect(slider).toHaveAttribute('value', /\d+/);

      const value = await slider.getAttribute('value');
      expect(parseInt(value || '0', 10)).toBeGreaterThan(1);
    });
  });

  test.describe('SixFold v0', () => {
    test('Slider exists for SixFold v0 section', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const slider = page.locator('#sixfold-v0 input[type="range"]');
      await expect(slider).toBeVisible();
    });

    test('Slider min = 1, max = total steps (93)', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const slider = page.locator('#sixfold-v0 input[type="range"]');

      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');

      expect(min).toBe('1');
      expect(max).toBe('93');
    });

    test('Slider value matches current step', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const slider = page.locator('#sixfold-v0 input[type="range"]');
      const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);

      const value = await slider.getAttribute('value');
      expect(parseInt(value || '0', 10)).toBe(currentStep);
    });

    test('Dragging slider updates current step', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const slider = page.locator('#sixfold-v0 input[type="range"]');

      // Drag slider to step 45
      await slider.evaluate((el) => {
        (el as HTMLInputElement).value = '45';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Wait for step to update
      await expect(page.locator('#sixfold-v0').getByText(/Current step 45\/\d+/)).toBeVisible();

      const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
      expect(currentStep).toBe(45);
    });

    test('Slider thumb position matches step percentage', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const slider = page.locator('#sixfold-v0 input[type="range"]');

      // Go to step 46 (roughly 50% of 93 steps)
      for (let i = 0; i < 45; i++) {
        await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
      }

      // Check slider value
      const value = await slider.getAttribute('value');
      expect(value).toBe('46');
    });

    test('Slider step labels show 1 and max', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const labels = page.locator('#sixfold-v0 .text-xs.text-gray-400 span');
      const count = await labels.count();

      expect(count).toBe(2);

      const firstLabel = labels.first();
      const lastLabel = labels.last();

      await expect(firstLabel).toHaveText('1');
      await expect(lastLabel).toHaveText('93');
    });
  });

  test.describe('Edge cases', () => {
    test('Slider updates when clicking next/prev buttons', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');

      // Click next
      await page.locator('#square').getByRole('button', { name: 'next' }).click();

      // Check slider value updated
      const value = await slider.getAttribute('value');
      expect(value).toBe('2');

      // Click prev
      await page.locator('#square').getByRole('button', { name: 'prev' }).click();

      const valueAfterPrev = await slider.getAttribute('value');
      expect(valueAfterPrev).toBe('1');
    });

    test('Slider updates when clicking first/last buttons', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const slider = page.locator('#square input[type="range"]');

      // Go to step 5
      for (let i = 0; i < 4; i++) {
        await page.locator('#square').getByRole('button', { name: 'next' }).click();
      }

      // Click first (<<)
      await page.locator('#square').getByTitle('Go to beginning').click();

      const valueAfterFirst = await slider.getAttribute('value');
      expect(valueAfterFirst).toBe('1');

      // Click last (>>)
      await page.locator('#square').getByTitle('Go to end').click();

      const valueAfterLast = await slider.getAttribute('value');
      expect(valueAfterLast).toBe('16');
    });
  });
});
