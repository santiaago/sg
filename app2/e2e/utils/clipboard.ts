import { type Page } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from "../fixtures";

/**
 * Clipboard helpers
 */

/**
 * Get SVG element content as string
 */
export async function getSVGContent(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<string> {
  const svgTestId = section === SECTION_SQUARE ? "square-svg" : "sixfoldv0-svg";
  return await page.getByTestId(svgTestId).evaluate((svg) => {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  });
}

/**
 * Assert clipboard contains expected text
 */
export async function assertClipboardContains(page: Page, expected: string): Promise<void> {
  const clipboardText = await page.evaluate(async () => {
    return await navigator.clipboard.readText();
  });

  if (!clipboardText.includes(expected)) {
    throw new Error(
      `Expected clipboard to contain "${expected}", but got: ${clipboardText.substring(0, 100)}...`,
    );
  }
}
