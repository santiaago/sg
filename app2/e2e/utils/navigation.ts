import { type Page, expect } from '@playwright/test';
import {
  SECTION_SQUARE,
  SECTION_SIXFOLD_V0,
} from '../fixtures';

/**
 * Navigation helpers
 */

/**
 * Navigate to a specific section
 */
export async function goToSection(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<void> {
  const buttonName = section === SECTION_SQUARE ? 'Square' : 'SixFold v0';
  await page.getByRole('button', { name: buttonName }).click();
  
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  await expect(page.locator(sectionSelector)).toBeVisible();
  
  // Wait for SVG to be visible
  const svgTestId = section === SECTION_SQUARE ? 'square-svg' : 'sixfoldv0-svg';
  await expect(page.getByTestId(svgTestId)).toBeVisible();
}

/**
 * Navigate to a specific step within a section
 */
export async function goToStep(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0, step: number): Promise<void> {
  await goToSection(page, section);
  
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  const sectionLocator = page.locator(sectionSelector);
  
  // Get current step
  const currentStep = await getCurrentStep(page, section);
  
  // Navigate to target step using next/prev buttons
  if (step > currentStep) {
    for (let i = currentStep; i < step; i++) {
      await sectionLocator.getByRole('button', { name: 'next' }).click();
      await expect(page.locator(`${sectionSelector} text=/Current step ${i + 1}/`)).toBeVisible();
    }
  } else if (step < currentStep) {
    for (let i = currentStep; i > step; i--) {
      await sectionLocator.getByRole('button', { name: 'prev' }).click();
      await expect(page.locator(`${sectionSelector} text=/Current step ${i - 1}/`)).toBeVisible();
    }
  }
  
  // Verify we're at the correct step
  const finalStep = await getCurrentStep(page, section);
  if (finalStep !== step) {
    throw new Error(`Expected to be at step ${step}, but was at step ${finalStep}`);
  }
}

/**
 * Get current step number for a section
 */
export async function getCurrentStep(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<number> {
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
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
export async function clickFirstButton(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTitle('Go to beginning').click();
}

/**
 * Click the last (>>) button for a section
 */
export async function clickLastButton(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByTitle('Go to end').click();
}

/**
 * Click the next button for a section
 */
export async function clickNextButton(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByRole('button', { name: 'next' }).click();
}

/**
 * Click the prev button for a section
 */
export async function clickPrevButton(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<void> {
  const sectionSelector = section === SECTION_SQUARE ? '#square' : '#sixfold-v0';
  const sectionLocator = page.locator(sectionSelector);
  await sectionLocator.getByRole('button', { name: 'prev' }).click();
}

/**
 * Reset app to initial state by navigating to a section and clicking << button
 */
export async function resetApp(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0 = SECTION_SIXFOLD_V0): Promise<void> {
  await goToSection(page, section);
  await clickFirstButton(page, section);
  
  // Verify we're at step 1
  const currentStep = await getCurrentStep(page, section);
  if (currentStep !== 1) {
    throw new Error(`Reset failed: expected step 1, got step ${currentStep}`);
  }
}