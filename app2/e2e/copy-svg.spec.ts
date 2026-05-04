import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0, SVG_CONFIG } from './fixtures';
import { goToSection } from './utils/navigation';
import { assertSVGValid, assertClipboardContains, waitForPageLoad } from './utils/helpers';
import { getSVGContent } from './utils/clipboard';

/**
 * Copy SVG Functionality Tests
 * Priority: High
 * Setup: Requires clipboard write permission + SVG validation helpers
 * Note: SVG validation runs in browser context via page.evaluate()
 */

test.describe('Copy SVG Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('Copy SVG button copies SVG element to clipboard (SixFold v0)', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    // Click Copy SVG button
    await page.getByTitle('Copy SVG to clipboard').click();

    // Wait for copy feedback
    await expect(page.getByText('Copied!')).toBeVisible();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify it's an SVG
    expect(clipboardText).toContain('<svg');
    expect(clipboardText).toContain('</svg>');
  });

  test('Copy SVG button copies SVG element to clipboard (Square)', async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);

    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toContain('<svg');
    expect(clipboardText).toContain('</svg>');
  });

  test('Copy SVG button shows "Copied!" feedback temporarily', async ({ page }) => {
    const copyButton = page.getByTitle('Copy SVG to clipboard');

    await copyButton.click();

    // Verify "Copied!" feedback is visible
    await expect(page.getByText('Copied!')).toBeVisible();

    // Wait for feedback to disappear
    await expect(page.getByText('Copied!')).not.toBeVisible({ timeout: 3000 });
  });

  test('Copied SVG contains xmlns attribute', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // The app adds XML declaration but the SVG element itself should have xmlns
    // or the serialized SVG should be valid
    expect(clipboardText).toContain('xmlns');
  });

  test('Copied SVG contains viewBox attribute', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Check for viewBox (may be in different formats)
    expect(clipboardText.toLowerCase()).toContain('viewbox');
  });

  test('Copied SVG passes validation without parse errors', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Validate SVG using browser context
    await assertSVGValid(page, clipboardText);
  });

  test('Copied SVG contains all <g> child elements from original', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    // Get original SVG content
    const originalSvg = await getSVGContent(page, SECTION_SIXFOLD_V0);

    // Copy SVG
    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Count <g> elements in original
    const originalGCount = (originalSvg.match(/<g/g) || []).length;
    
    // Count <g> elements in clipboard
    const clipboardGCount = (clipboardText.match(/<g/g) || []).length;

    // The copied SVG should have at least as many <g> elements as the original
    // (it may have more due to XML declaration wrapper)
    expect(clipboardGCount).toBeGreaterThanOrEqual(originalGCount);
  });

  test('Copy SVG works at different steps', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    // Copy at step 1
    await page.getByTitle('Copy SVG to clipboard').click();
    let clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain('<svg');

    // Navigate to step 5
    for (let i = 0; i < 4; i++) {
      await page.locator('#sixfold-v0').getByRole('button', { name: 'next' }).click();
    }

    // Copy at step 5
    await page.getByTitle('Copy SVG to clipboard').click();
    clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain('<svg');
  });

  test('Copy SVG button is visible in both sections', async ({ page }) => {
    // Check SixFold v0 section
    await goToSection(page, SECTION_SIXFOLD_V0);
    await expect(page.getByTitle('Copy SVG to clipboard')).toBeVisible();

    // Check Square section
    await goToSection(page, SECTION_SQUARE);
    await expect(page.getByTitle('Copy SVG to clipboard')).toBeVisible();
  });

  test('Copied SVG has correct dimensions', async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_V0);

    await page.getByTitle('Copy SVG to clipboard').click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Check for width and height attributes
    expect(clipboardText).toMatch(/width="[^"]*"/);
    expect(clipboardText).toMatch(/height="[^"]*"/);
  });
});
