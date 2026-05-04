import { type Page, expect } from "@playwright/test";
import { SECTION_SQUARE, SECTION_SIXFOLD_V0 } from "../fixtures";

/**
 * Navigation helpers
 */

/**
 * Navigate to a specific section
 */
export async function goToSection(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<void> {
  const testId = section === SECTION_SQUARE ? "nav-square" : "nav-sixfold-v0";
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const svgTestId = section === SECTION_SQUARE ? "square-svg" : "sixfoldv0-svg";

  // Check if URL already has the correct hash
  const currentUrl = page.url();
  const hasCorrectHash = (await currentUrl).includes(`#${section}`);

  if (!hasCorrectHash) {
    // Click the navigation button to update both the section and the hash
    await page.getByTestId(testId).click();
    await expect(page.locator(sectionSelector)).toBeVisible();
    await expect(page.getByTestId(svgTestId)).toBeVisible();
    await page.waitForURL(new RegExp(`#${section}$`));
  } else {
    // Already on the correct section, just verify it's visible
    const sectionLoc = page.locator(sectionSelector);
    await expect(sectionLoc).toBeVisible();
    await expect(page.getByTestId(svgTestId)).toBeVisible();
  }
}

/**
 * Navigate to a specific step within a section
 */
export async function goToStep(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
  step: number,
): Promise<void> {
  await goToSection(page, section);

  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const sectionLocator = page.locator(sectionSelector);

  // Get current step
  const currentStep = await getCurrentStep(page, section);

  // Navigate to target step using next/prev buttons
  if (step > currentStep) {
    for (let i = currentStep; i < step; i++) {
      await sectionLocator.getByTestId("step-next").click();
      await expect(page.locator(sectionSelector).getByText(/Current step \d+\/\d+/)).toBeVisible();
    }
  } else if (step < currentStep) {
    for (let i = currentStep; i > step; i--) {
      await sectionLocator.getByTestId("step-prev").click();
      await expect(page.locator(sectionSelector).getByText(/Current step \d+\/\d+/)).toBeVisible();
    }
  }

  // Verify we're at the correct step
  const finalStep = await getCurrentStep(page, section);
  if (finalStep !== step) {
    throw new Error(`Expected to be at step ${step}, but was at step ${finalStep}`);
  }

  // Wait for geometry items to be rendered if we're at a step with geometry
  if (step >= 1) {
    const items = sectionLocator.locator(".geometry-list li");
    await expect(async () => await items.count()).toBeGreaterThanOrEqual(1);
  }
}

/**
 * Get current step number for a section
 */
export async function getCurrentStep(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<number> {
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const stepElement = page.locator(sectionSelector).getByText(/Current step \d+\/\d+/);
  const stepText = await stepElement.textContent();

  if (!stepText) {
    throw new Error(`Could not find step text in section ${section}`);
  }

  const match = stepText.match(/Current step (\d+)/);
  if (!match) {
    throw new Error(`Could not extract step number from: ${stepText}`);
  }

  return parseInt(match[1], 10);
}

/**
 * Click the first (<<) button for a section
 */
export async function clickFirstButton(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTestId("step-first").click();
}

/**
 * Click the last (>>) button for a section
 */
export async function clickLastButton(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTestId("step-last").click();
}

/**
 * Click the next button for a section
 */
export async function clickNextButton(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTestId("step-next").click();
}

/**
 * Click the prev button for a section
 */
export async function clickPrevButton(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0,
): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? "#square" : "#sixfold-v0";
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTestId("step-prev").click();
}

/**
 * Reset app to initial state by navigating to a section and clicking << button
 * Note: App starts at step 0, not step 1
 */
export async function resetApp(
  page: Page,
  section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0 = SECTION_SIXFOLD_V0,
): Promise<void> {
  await goToSection(page, section);
  await clickFirstButton(page, section);

  // Verify we're at step 0 (app starts at step 0)
  const currentStep = await getCurrentStep(page, section);
  if (currentStep !== 0) {
    throw new Error(`Reset failed: expected step 0, got step ${currentStep}`);
  }
}
