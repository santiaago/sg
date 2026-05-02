import { test, expect } from '@playwright/test';

/**
 * E2E tests for Square and SixFoldV0 component navigation.
 * Tests verify that:
 * - Can click next repeatedly until the end
 * - Can click fast forward (»»)
 * - Can click back (prev)
 * - Can click all the way to the beginning with backwards (<<)
 * All tests should complete with no errors or warnings.
 */

// Constants for step counts
const SQUARE_TOTAL_STEPS = 16;
const SIXFOLDV0_TOTAL_STEPS = 93;

// Selectors for Square section
const SQUARE_SECTION = '#square';
const SQUARE_SVG = '[data-testid="square-svg"]';
const SQUARE_STEP_INDICATOR = 'text=Current step';
const SQUARE_FIRST_BTN = 'button[title="Go to beginning"]';
const SQUARE_PREV_BTN = 'button:has-text("prev")';
const SQUARE_NEXT_BTN = 'button:has-text("next")';
const SQUARE_LAST_BTN = 'button[title="Go to end"]';

// Selectors for SixFoldV0 section
const SIXFOLDV0_SECTION = '#sixfold-v0';
const SIXFOLDV0_SVG = '[data-testid="sixfoldv0-svg"]';
const SIXFOLDV0_STEP_INDICATOR = 'text=Current step';
const SIXFOLDV0_FIRST_BTN = 'button[title="Go to beginning"]';
const SIXFOLDV0_PREV_BTN = 'button:has-text("prev")';
const SIXFOLDV0_NEXT_BTN = 'button:has-text("next")';
const SIXFOLDV0_LAST_BTN = 'button[title="Go to end"]';

// Helper to extract current step from text
function extractStepNumber(text: string): number {
  const match = text.match(/Current step (\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  throw new Error(`Could not extract step number from: ${text}`);
}

/**
 * Helper to navigate to a specific section
 */
async function navigateToSection(page: any, section: 'square' | 'sixfold-v0') {
  // Click the navigation button for the section
  await page.getByRole('button', { name: section === 'square' ? 'Square' : 'SixFold v0' }).click();
  
  // Wait for the section to be visible
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  await expect(page.locator(sectionSelector)).toBeVisible();
  
  // Wait for SVG to be visible
  const svgSelector = section === 'square' ? SQUARE_SVG : SIXFOLDV0_SVG;
  await expect(page.locator(svgSelector)).toBeVisible();
}

/**
 * Helper to get current step for a section
 */
async function getCurrentStep(page: any, section: 'square' | 'sixfold-v0'): Promise<number> {
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const stepText = await page.locator(`${sectionSelector} ${SQUARE_STEP_INDICATOR}`).first().textContent();
  return extractStepNumber(stepText || '');
}

/**
 * Helper to click next button for a section
 */
async function clickNext(page: any, section: 'square' | 'sixfold-v0'): Promise<void> {
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const nextBtn = page.locator(`${sectionSelector} ${SQUARE_NEXT_BTN}`).first();
  await nextBtn.click();
  // Wait for potential re-render
  await page.waitForTimeout(100);
}

/**
 * Helper to click prev button for a section
 */
async function clickPrev(page: any, section: 'square' | 'sixfold-v0'): Promise<void> {
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const prevBtn = page.locator(`${sectionSelector} ${SQUARE_PREV_BTN}`).first();
  await prevBtn.click();
  // Wait for potential re-render
  await page.waitForTimeout(100);
}

/**
 * Helper to click first button (<<) for a section
 */
async function clickFirst(page: any, section: 'square' | 'sixfold-v0'): Promise<void> {
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const firstBtn = page.locator(`${sectionSelector} ${SQUARE_FIRST_BTN}`).first();
  await firstBtn.click();
  // Wait for potential re-render
  await page.waitForTimeout(100);
}

/**
 * Helper to click last button (>>) for a section
 */
async function clickLast(page: any, section: 'square' | 'sixfold-v0'): Promise<void> {
  const sectionSelector = section === 'square' ? SQUARE_SECTION : SIXFOLDV0_SECTION;
  const lastBtn = page.locator(`${sectionSelector} ${SQUARE_LAST_BTN}`).first();
  await lastBtn.click();
  // Wait for potential re-render
  await page.waitForTimeout(100);
}

/**
 * Tests for Square component navigation
 */
test.describe('Square Component Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateToSection(page, 'square');
  });

  test('should start at step 1', async ({ page }) => {
    const currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);
  });

  test('can click next all the way to the end', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Click next until we reach the end
    for (let expectedStep = 2; expectedStep <= SQUARE_TOTAL_STEPS; expectedStep++) {
      await clickNext(page, 'square');
      currentStep = await getCurrentStep(page, 'square');
      expect(currentStep).toBe(expectedStep);
    }

    // Verify we're at the end
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Next button should be disabled at the end
    const nextBtn = page.locator(`${SQUARE_SECTION} ${SQUARE_NEXT_BTN}`).first();
    await expect(nextBtn).toBeDisabled();
  });

  test('can click fast forward (>>) to the end', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Click fast forward
    await clickLast(page, 'square');
    
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);
  });

  test('can click back from step 2 to step 1', async ({ page }) => {
    // Go to step 2
    await clickNext(page, 'square');
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(2);

    // Click back
    await clickPrev(page, 'square');
    
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Prev button should be disabled at step 1
    const prevBtn = page.locator(`${SQUARE_SECTION} ${SQUARE_PREV_BTN}`).first();
    await expect(prevBtn).toBeDisabled();
  });

  test('can click all the way to the beginning with backwards (<<)', async ({ page }) => {
    // First, go to the end
    await clickLast(page, 'square');
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Click backwards to beginning
    await clickFirst(page, 'square');
    
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);
  });

  test('can navigate forward and backward multiple times', async ({ page }) => {
    // Go forward a few steps
    for (let i = 0; i < 5; i++) {
      await clickNext(page, 'square');
    }
    
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(6);

    // Go backward a few steps
    for (let i = 0; i < 3; i++) {
      await clickPrev(page, 'square');
    }
    
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(3);

    // Go forward again
    for (let i = 0; i < 2; i++) {
      await clickNext(page, 'square');
    }
    
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(5);
  });

  test('can click next, then prev, then next again', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Click next
    await clickNext(page, 'square');
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(2);

    // Click prev
    await clickPrev(page, 'square');
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Click next again
    await clickNext(page, 'square');
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(2);
  });
});

/**
 * Tests for SixFoldV0 component navigation
 */
test.describe('SixFoldV0 Component Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateToSection(page, 'sixfold-v0');
  });

  test('should start at step 1', async ({ page }) => {
    const currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);
  });

  test('can click next all the way to the end', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Click next until we reach the end
    // For SixFoldV0 with 93 steps, we'll click next 92 times
    for (let expectedStep = 2; expectedStep <= SIXFOLDV0_TOTAL_STEPS; expectedStep++) {
      await clickNext(page, 'sixfold-v0');
      currentStep = await getCurrentStep(page, 'sixfold-v0');
      expect(currentStep).toBe(expectedStep);
    }

    // Verify we're at the end
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Next button should be disabled at the end
    const sectionSelector = SIXFOLDV0_SECTION;
    const nextBtn = page.locator(`${sectionSelector} ${SIXFOLDV0_NEXT_BTN}`).first();
    await expect(nextBtn).toBeDisabled();
  });

  test('can click fast forward (>>) to the end', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Click fast forward
    await clickLast(page, 'sixfold-v0');
    
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);
  });

  test('can click back from step 2 to step 1', async ({ page }) => {
    // Go to step 2
    await clickNext(page, 'sixfold-v0');
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(2);

    // Click back
    await clickPrev(page, 'sixfold-v0');
    
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Prev button should be disabled at step 1
    const sectionSelector = SIXFOLDV0_SECTION;
    const prevBtn = page.locator(`${sectionSelector} ${SIXFOLDV0_PREV_BTN}`).first();
    await expect(prevBtn).toBeDisabled();
  });

  test('can click all the way to the beginning with backwards (<<)', async ({ page }) => {
    // First, go to the end
    await clickLast(page, 'sixfold-v0');
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Click backwards to beginning
    await clickFirst(page, 'sixfold-v0');
    
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);
  });

  test('can navigate forward and backward multiple times', async ({ page }) => {
    // Go forward a few steps
    for (let i = 0; i < 5; i++) {
      await clickNext(page, 'sixfold-v0');
    }
    
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(6);

    // Go backward a few steps
    for (let i = 0; i < 3; i++) {
      await clickPrev(page, 'sixfold-v0');
    }
    
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(3);

    // Go forward again
    for (let i = 0; i < 2; i++) {
      await clickNext(page, 'sixfold-v0');
    }
    
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(5);
  });

  test('can click next, then prev, then next again', async ({ page }) => {
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Click next
    await clickNext(page, 'sixfold-v0');
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(2);

    // Click prev
    await clickPrev(page, 'sixfold-v0');
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Click next again
    await clickNext(page, 'sixfold-v0');
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(2);
  });
});

/**
 * Combined tests for both components
 */
test.describe('Both Components Navigation', () => {
  test('Square: complete navigation cycle', async ({ page }) => {
    await page.goto('/');
    await navigateToSection(page, 'square');

    // Start at step 1
    let currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Go to end
    await clickLast(page, 'square');
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(SQUARE_TOTAL_STEPS);

    // Go back to beginning
    await clickFirst(page, 'square');
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(1);

    // Go forward 3 steps
    for (let i = 0; i < 3; i++) {
      await clickNext(page, 'square');
    }
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(4);

    // Go backward 2 steps
    for (let i = 0; i < 2; i++) {
      await clickPrev(page, 'square');
    }
    currentStep = await getCurrentStep(page, 'square');
    expect(currentStep).toBe(2);
  });

  test('SixFoldV0: complete navigation cycle', async ({ page }) => {
    await page.goto('/');
    await navigateToSection(page, 'sixfold-v0');

    // Start at step 1
    let currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Go to end
    await clickLast(page, 'sixfold-v0');
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(SIXFOLDV0_TOTAL_STEPS);

    // Go back to beginning
    await clickFirst(page, 'sixfold-v0');
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(1);

    // Go forward 3 steps
    for (let i = 0; i < 3; i++) {
      await clickNext(page, 'sixfold-v0');
    }
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(4);

    // Go backward 2 steps
    for (let i = 0; i < 2; i++) {
      await clickPrev(page, 'sixfold-v0');
    }
    currentStep = await getCurrentStep(page, 'sixfold-v0');
    expect(currentStep).toBe(2);
  });
});
