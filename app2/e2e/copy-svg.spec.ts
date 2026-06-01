import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V1 } from "./fixtures";
import { goToSection } from "./utils/navigation";
import { assertSVGValid } from "./utils/assertions";
import { getSVGContent } from "./utils/clipboard";
import { waitForPageLoad } from "./utils/helpers";

/**
 * Copy SVG Functionality Tests
 * Priority: High
 * Setup: Requires clipboard write permission + SVG validation helpers
 * Note: SVG validation runs in browser context via page.evaluate()
 */

test.describe("Copy SVG Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("Copy SVG button copies SVG element to clipboard (SixFold DSL v1)", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    // Click Copy SVG button (scoped to section)
    await page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn").click();

    // Get clipboard content
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Verify it's an SVG
    expect(clipboardText).toContain("<svg");
    expect(clipboardText).toContain("</svg>");
  });

  test("Copy SVG button copies SVG element to clipboard (Square DSL)", async ({ page }) => {
    await goToSection(page, SECTION_SQUARE_DSL);

    const copySvgBtn = page.locator("#square-dsl").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toContain("<svg");
    expect(clipboardText).toContain("</svg>");
  });

  test('Copy SVG button shows "Copied!" feedback temporarily', async ({ page }) => {
    await page.locator("#sixfold-dsl-v2").getByTestId("copy-svg-btn").click();

    // Verify feedback is visible
    await expect(page.locator('#sixfold-dsl-v2 [data-testid="copy-feedback"]')).toBeVisible();

    // Wait for feedback to disappear
    await expect(page.locator('#sixfold-dsl-v2 [data-testid="copy-feedback"]')).not.toBeVisible({
      timeout: 3000,
    });
  });

  test("Copied SVG contains xmlns attribute", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // The app adds XML declaration but the SVG element itself should have xmlns
    // or the serialized SVG should be valid
    expect(clipboardText).toContain("xmlns");
  });

  test("Copied SVG contains viewBox attribute", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Check for viewBox (may be in different formats)
    expect(clipboardText.toLowerCase()).toContain("viewbox");
  });

  test("Copied SVG passes validation without parse errors", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Validate SVG using browser context
    await assertSVGValid(page, clipboardText);
  });

  test("Copied SVG contains all <g> child elements from original", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    // Get original SVG content
    const originalSvg = await getSVGContent(page, SECTION_SIXFOLD_DSL_V1);

    // Copy SVG
    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

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

  test("Copy SVG works at different steps", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    // Copy at step 1
    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();
    let clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain("<svg");

    // Navigate to step 5
    for (let i = 0; i < 4; i++) {
      await page.locator("#sixfold-dsl-v1").getByTestId("step-next").click();
    }

    // Copy at step 5
    await copySvgBtn.click();
    clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain("<svg");
  });

  test("Copy SVG button is visible in both sections", async ({ page }) => {
    // Check SixFold DSL v1 section
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);
    await expect(page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn")).toBeVisible();

    // Check Square DSL section
    await goToSection(page, SECTION_SQUARE_DSL);
    await expect(page.locator("#square-dsl").getByTestId("copy-svg-btn")).toBeVisible();
  });

  test("Copied SVG has correct dimensions", async ({ page }) => {
    await goToSection(page, SECTION_SIXFOLD_DSL_V1);

    const copySvgBtn = page.locator("#sixfold-dsl-v1").getByTestId("copy-svg-btn");
    await copySvgBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    // Check for width and height attributes
    expect(clipboardText).toMatch(/width="[^"]*"/);
    expect(clipboardText).toMatch(/height="[^"]*"/);
  });
});
