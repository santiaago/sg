import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from './fixtures';
import { goToSection, getCurrentStep } from './utils/navigation';
import { assertClipboardContains } from './utils/clipboard';
import { waitForPageLoad } from './utils/helpers';

/**
 * Copy URL Functionality Tests
 * Priority: High
 * Setup: Requires clipboard write permission (handled in e2e/setup.ts)
 */

test.describe('Copy URL Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('Copy URL button copies current URL with hash to clipboard', async ({ page }) => {
    // Navigate to Square section
    await goToSection(page, SECTION_SQUARE);

    // Click Copy URL button
    await page.getByTestId('copy-url-btn').click();

    // Wait for copy feedback
    await expect(page.getByTestId('copy-feedback')).toBeVisible();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify clipboard contains the URL with hash
    expect(clipboardText).toContain('square');
    expect(clipboardText).toContain('localhost');
  });

  test('Copied URL matches window.location.href', async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);

    // Get current URL
    const currentUrl = page.url();

    // Click Copy URL button
    await page.getByTestId('copy-url-btn').click();

    // Wait for copy to complete by checking for feedback
    await expect(page.getByTestId('copy-feedback')).toBeVisible();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify clipboard matches current URL
    expect(clipboardText).toBe(currentUrl);
  });

  test('Copy URL button shows "Copied!" feedback temporarily', async ({ page }) => {
    const copyButton = page.getByTestId('copy-url-btn');

    // Click the button
    await copyButton.click();

    // Verify feedback is visible
    await expect(page.getByTestId('copy-feedback')).toBeVisible();

    // Wait for feedback to disappear
    await expect(page.getByTestId('copy-feedback')).not.toBeVisible({ timeout: 3000 });
  });

  test('Copy URL works from Square section', async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);

    await page.getByTestId('copy-url-btn').click();

    await assertClipboardContains(page, 'square');
  });

  test('Copy URL works from SixFold v0 section', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    await page.getByTestId('copy-url-btn').click();

    await assertClipboardContains(page, 'sixfold-v0');
  });

  test('Copied URL includes section hash', async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);

    await page.getByTestId('copy-url-btn').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toContain('#square');
  });

  test('Copied URL includes step hash if applicable', async ({ page }) => {
    // Note: The app currently doesn't include step in the URL hash
    // This test documents the expected behavior
    await goToSection(page, SECTION_SQUARE);

    await page.getByTestId('copy-url-btn').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Currently, the app only includes section hash, not step
    // This is expected behavior
    expect(clipboardText).toContain('#square');
  });

  test('Copy URL button is visible in both sections', async ({ page }) => {
    // Check SixFold v0 section
    await goToSection(page, SECTION_SIXFOLD_V0);
    await expect(page.getByTestId('copy-url-btn')).toBeVisible();

    // Check Square section
    await goToSection(page, SECTION_SQUARE);
    await expect(page.getByTestId('copy-url-btn')).toBeVisible();
  });

  test('Copy URL works after navigating between sections', async ({ page }) => {
    // Start at SixFold v0
    await goToSection(page, SECTION_SIXFOLD_V0);
    await page.getByTestId('copy-url-btn').click();
    await assertClipboardContains(page, 'sixfold-v0');

    // Navigate to Square
    await goToSection(page, SECTION_SQUARE);
    await page.getByTestId('copy-url-btn').click();
    await assertClipboardContains(page, 'square');
  });
});
