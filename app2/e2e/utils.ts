import { type Page, type Locator, expect } from '@playwright/test';
import {
  SECTION_SQUARE,
  SECTION_SIXFOLD_V0,
  THEME,
  SVG_CONFIG,
  SQUARE_GEOMETRY,
  SIXFOLD_V0_GEOMETRY,
  TEST_STEPS,
} from './fixtures';

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

/**
 * Select a geometry item from the list
 */
export async function selectGeometry(page: Page, name: string): Promise<void> {
  const geometryList = page.locator('.geometry-list');
  await geometryList.getByText(name, { exact: true }).first().click();
  
  // Verify selection by checking the item has the selected class
  await expect(geometryList.getByText(name, { exact: true }).first()).toHaveClass(/text-(red|yellow)-400/);
}

/**
 * State helpers
 */

/**
 * Assert the current theme
 */
export async function assertTheme(page: Page, expected: typeof THEME.DARK | typeof THEME.LIGHT): Promise<void> {
  const hasDark = await page.evaluate(() => 
    document.documentElement.classList.contains('dark')
  );
  const actual = hasDark ? THEME.DARK : THEME.LIGHT;
  
  if (actual !== expected) {
    throw new Error(`Expected theme to be ${expected}, but was ${actual}`);
  }
}

/**
 * Toggle the theme
 */
export async function toggleTheme(page: Page): Promise<void> {
  await page.getByTitle('Toggle SVG Theme').click();
}

/**
 * Assert clipboard contains expected text
 */
export async function assertClipboardContains(page: Page, expected: string): Promise<void> {
  const clipboardText = await page.evaluate(async () => {
    return await navigator.clipboard.readText();
  });
  
  if (!clipboardText.includes(expected)) {
    throw new Error(`Expected clipboard to contain "${expected}", but got: ${clipboardText.substring(0, 100)}...`);
  }
}

/**
 * Assert SVG is valid using browser context
 */
export async function assertSVGValid(page: Page, svg: string): Promise<void> {
  await page.evaluate((svgString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('Invalid SVG: parse error');
    }
  }, svg);
}

/**
 * Assert geometry is selected in the store
 */
export async function assertGeometrySelected(page: Page, name: string): Promise<void> {
  // Check that the geometry item has the selected class (red or yellow)
  const geometryList = page.locator('.geometry-list');
  const item = geometryList.getByText(name, { exact: true }).first();
  
  await expect(item).toHaveClass(/text-(red|yellow)-400/);
}

/**
 * Get the number of geometry items in the list
 */
export async function getGeometryCount(page: Page): Promise<number> {
  const geometryList = page.locator('.geometry-list');
  const items = geometryList.locator('li');
  return await items.count();
}

/**
 * Filter geometry list by name
 */
export async function filterByName(page: Page, name: string): Promise<void> {
  const geometryList = page.locator('.geometry-list');
  await geometryList.getByPlaceholder('Filter by name...').fill(name);
  
  // Wait for filter to apply
  await page.waitForTimeout(100);
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page): Promise<void> {
  const geometryList = page.locator('.geometry-list');
  const clearButton = geometryList.getByText('Clear filters');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}

/**
 * Toggle type filter
 */
export async function toggleTypeFilter(page: Page, type: string): Promise<void> {
  const geometryList = page.locator('.geometry-list');
  await geometryList.getByRole('button', { name: type }).click();
}

/**
 * Get the filtered count text
 */
export async function getFilteredCountText(page: Page): Promise<string> {
  const geometryList = page.locator('.geometry-list');
  return await geometryList.locator('p').first().textContent() || '';
}

/**
 * Performance measurement helpers
 */

/**
 * Measure action duration in browser context
 */
export async function measureAction<T>(
  page: Page,
  action: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = await page.evaluate(() => performance.now());
  const result = await action();
  const end = await page.evaluate(() => performance.now());
  return { result, duration: end - start };
}

/**
 * Check for console errors and warnings
 */
export async function checkConsoleErrors(page: Page): Promise<{ errors: string[]; warnings: string[] }> {
  const consoleMessages = await page.evaluate(() => {
    const messages: { type: string; text: string }[] = [];
    
    // Override console methods to capture messages
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    console.error = (...args: any[]) => {
      messages.push({ type: 'error', text: args.join(' ') });
      originalError(...args);
    };
    
    console.warn = (...args: any[]) => {
      messages.push({ type: 'warning', text: args.join(' ') });
      originalWarn(...args);
    };
    
    console.log = (...args: any[]) => {
      messages.push({ type: 'log', text: args.join(' ') });
      originalLog(...args);
    };
    
    return messages;
  });
  
  const errors = consoleMessages.filter(m => m.type === 'error').map(m => m.text);
  const warnings = consoleMessages.filter(m => m.type === 'warning').map(m => m.text);
  
  return { errors, warnings };
}

/**
 * Wait for page to fully load
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional wait for React hydration
}

/**
 * Get SVG element content as string
 */
export async function getSVGContent(page: Page, section: typeof SECTION_SQUARE | typeof SECTION_SIXFOLD_V0): Promise<string> {
  const svgTestId = section === SECTION_SQUARE ? 'square-svg' : 'sixfoldv0-svg';
  return await page.getByTestId(svgTestId).evaluate((svg) => {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  });
}

/**
 * Check if an element has a specific aria-label
 */
export async function hasAriaLabel(locator: Locator, expectedLabel: string): Promise<boolean> {
  const ariaLabel = await locator.getAttribute('aria-label');
  return ariaLabel === expectedLabel;
}

/**
 * Check if an element is keyboard focusable
 */
export async function isFocusable(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => {
    const tabIndex = el.getAttribute('tabindex');
    const isFocusable = el.tabIndex >= 0 || 
      (el as HTMLElement).offsetParent !== null ||
      ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    return isFocusable;
  });
}

/**
 * Get all console messages from the page
 */
export async function getConsoleMessages(page: Page): Promise<{ errors: string[]; warnings: string[] }> {
  const messages = await page.evaluate(() => {
    const captured: { type: string; args: any[] }[] = [];
    
    // Capture existing console methods
    const original = {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info,
      debug: console.debug,
    };
    
    console.error = (...args: any[]) => {
      captured.push({ type: 'error', args });
      original.error(...args);
    };
    
    console.warn = (...args: any[]) => {
      captured.push({ type: 'warning', args });
      original.warn(...args);
    };
    
    console.log = (...args: any[]) => {
      captured.push({ type: 'log', args });
      original.log(...args);
    };
    
    console.info = (...args: any[]) => {
      captured.push({ type: 'info', args });
      original.info(...args);
    };
    
    console.debug = (...args: any[]) => {
      captured.push({ type: 'debug', args });
      original.debug(...args);
    };
    
    return captured;
  });
  
  const errors = messages.filter(m => m.type === 'error').map(m => m.args.join(' '));
  const warnings = messages.filter(m => m.type === 'warning').map(m => m.args.join(' '));
  
  return { errors, warnings };
}
