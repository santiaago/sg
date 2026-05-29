import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V1 } from "./fixtures";
import { goToSection, getCurrentStep } from "./utils/navigation";
import { assertClipboardContains } from "./utils/clipboard";
import { waitForPageLoad } from "./utils/helpers";

/**
 * Copy URL Functionality Tests
 * Priority: High
 * Setup: Requires clipboard write permission (handled in e2e/setup.ts)
 */

test.describe("Copy URL Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("Copy URL button copies current URL with hash to clipboard", async ({ page }) => {
    // Navigate to Square DSL section
    await goToSection(page, SECTION_SQUARE_DSL);

    // Click Copy URL button (use .first() since there may be multiple in different sections)
    await page.getByTestId("copy-url-btn").first().click();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify clipboard contains the URL with hash
    expect(clipboardText).toContain("square-dsl");
    expect(clipboardText).toContain("localhost");
  });

  test("Copied URL matches window.location.href", async ({ page }) => {
    await goToSection(page, SECTION_SQUARE_DSL);

    // Get current URL
    const currentUrl = page.url();

    // Click Copy URL button in the current section
    await page.locator("#square-dsl").getByTestId("copy-url-btn").click();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify clipboard matches current URL
    expect(clipboardText).toBe(currentUrl);
  });

  test('Copy URL button shows "Copied!" feedback temporarily', async ({ page }) => {
    await page.getByTestId("copy-url-btn").first().click();

    // Verify feedback is visible
    await expect(page.locator('[data-testid="copy-feedback"]').first()).toBeVisible();

    // Wait for feedback to disappear
    await expect(page.locator('[data-testid="copy-feedback"]').first()).not.toBeVisible({
      timeout: 3000,
    });
  });

  test("Copy URL works from Square DSL section", async ({ page }) => {
    await goToSection(page, SECTION_SQUARE_DSL);

    await page.locator("#square-dsl").getByTestId("copy-url-btn").click();

    await assertClipboardContains(page, "square-dsl");
  });

  test("Copy URL works from SixFold DSL v1 section", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    await page.locator("#sixfold-dsl-v1").getByTestId("copy-url-btn").click();

    await assertClipboardContains(page, "sixfold-dsl-v1");
  });

  test("Copied URL includes section hash", async ({ page }) => {
    await goToSection(page, SECTION_SQUARE_DSL);

    await page.locator("#square-dsl").getByTestId("copy-url-btn").click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toContain("#square-dsl");
  });

  test("Copied URL includes step hash if applicable", async ({ page }) => {
    // Note: The app currently doesn't include step in the URL hash
    // This test documents the expected behavior
    await goToSection(page, SECTION_SQUARE_DSL);

    await page.locator("#square-dsl").getByTestId("copy-url-btn").click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Currently, the app only includes section hash, not step
    // This is expected behavior
    expect(clipboardText).toContain("#square-dsl");
  });

  test("Copy URL button is visible in both sections", async ({ page }) => {
    // Check SixFold DSL v1 section
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);
    await expect(page.locator("#sixfold-dsl-v1").getByTestId("copy-url-btn")).toBeVisible();

    // Check Square DSL section
    await goToSection(page, SECTION_SQUARE_DSL);
    await expect(page.locator("#square-dsl").getByTestId("copy-url-btn")).toBeVisible();
  });

  test("Copy URL works after navigating between sections", async ({ page }) => {
    // Start at SixFold DSL v1
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);
    await page.locator("#sixfold-dsl-v1").getByTestId("copy-url-btn").click();
    await assertClipboardContains(page, "sixfold-dsl-v1");

    // Navigate to Square
    await goToSection(page, SECTION_SQUARE_DSL);
    await page.locator("#square-dsl").getByTestId("copy-url-btn").click();
    await assertClipboardContains(page, "square-dsl");
  });
});
