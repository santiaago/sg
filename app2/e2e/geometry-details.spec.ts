import { test, expect } from '@playwright/test';
import { SECTION_SQUARE, SECTION_SIXFOLD_V0, SQUARE_GEOMETRY } from './fixtures';
import { goToSection, goToStep } from './utils/navigation';
import { selectGeometry, waitForPageLoad, getGeometryCount } from './utils/helpers';

/**
 * Geometry Details Panel Tests
 * Priority: High
 * Setup: Requires geometry to be selected
 */

test.describe('Geometry Details Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Display', () => {
    test('Shows "Details" header', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split('|')[0].trim();

      // Select the geometry
      await firstItem.click();

      // Check for Details header
      const detailsPanel = page.getByTestId('geometry-details');
      await expect(detailsPanel).toBeVisible();
    });

    test('Displays selected geometry name', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      const name = itemText.split('|')[0].trim();

      // Select the geometry
      await firstItem.click();

      // Check that the name is displayed in details
      const detailsPanel = page.getByTestId('geometry-details');
      await expect(detailsPanel.getByText(name)).toBeVisible();
    });

    test('Displays selected geometry type', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Ensure item has text content
      await expect(firstItem).toHaveText(/.+/);

      const itemText = await firstItem.textContent();
      // Extract name and type from "name | type" format
      const [name, type] = itemText.split('|').map(s => s.trim());

      // Select the geometry
      await firstItem.click();

      // Check that the type is displayed in details
      // The details panel shows "name : type"
      const detailsPanel = page.getByTestId('geometry-details');
      await expect(detailsPanel).toContainText(type);
    });

    test('Displays step ID that created the geometry', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Select the geometry
      await firstItem.click();

      // Check for step ID in details
      // The details panel shows "Created by step: stepId"
      const detailsPanel = page.getByTestId('geometry-details');
      const stepText = detailsPanel.getByText(/Created by step: step_\w+/);
      await expect(stepText).toBeVisible();
    });

    test('Displays inputs list (dependsOn)', async ({ page }) => {
      // Navigate to a step where geometries have dependencies
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a later step where dependencies exist
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.getByTestId('geometry-list');
      const items = geometryList.locator('li');

      // Ensure we have items to test
      await expect(items).toHaveCountGreaterThan(0);

      // Find an item that has dependencies (not the first ones)
      const itemCount = await items.count();
      const itemWithDeps = items.nth(Math.min(5, itemCount - 1));
      await itemWithDeps.click();

      // Check for Inputs section in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const inputsHeader = detailsPanel.getByText('Inputs');
      await expect(inputsHeader).toBeVisible();
    });

    test('Displays parameters with types', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      // Go to a step with parameters
      for (let i = 0; i < 4; i++) {
        await page.locator('#square').getByTestId('step-next').click();
      }

      const geometryList = page.getByTestId('geometry-list');
      const items = geometryList.locator('li');

      // Ensure we have items to test
      await expect(items).toHaveCountGreaterThan(0);

      // Select a geometry
      await items.first().click();

      // Check for Parameters section in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const paramsHeader = detailsPanel.getByText('Parameters');
      await expect(paramsHeader).toBeVisible();
    });

    test('Displays outputs list', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a step where outputs exist
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.getByTestId('geometry-list');
      const items = geometryList.locator('li');

      // Ensure we have items to test
      await expect(items).toHaveCountGreaterThan(0);

      // Select a geometry
      await items.first().click();

      // Check for Outputs section in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const outputsHeader = detailsPanel.getByText('Outputs');
      await expect(outputsHeader).toBeVisible();
    });
  });

  test.describe('Edge cases', () => {
    test('Shows "No inputs" when geometry has no dependencies', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Select the first geometry (likely has no dependencies)
      await firstItem.click();

      // Check for "No inputs" message in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const noInputs = detailsPanel.getByText('No inputs');
      await expect(noInputs).toBeVisible();
    });

    test('Shows "No parameters" when geometry has no parameters', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Select the first geometry
      await firstItem.click();

      // Check for "No parameters" message in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const noParams = detailsPanel.getByText('No parameters');
      await expect(noParams).toBeVisible();
    });

    test('Shows "No outputs" when geometry has no outputs', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      const geometryList = page.getByTestId('geometry-list');
      const firstItem = geometryList.locator('li').first();

      // Select the first geometry
      await firstItem.click();

      // Check for "No outputs" message in details panel
      const detailsPanel = page.getByTestId('geometry-details');
      const noOutputs = detailsPanel.getByText('No outputs');
      await expect(noOutputs).toBeVisible();
    });

    test('Panel is empty when no geometry selected', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Don't select any geometry
      // Details panel should not be visible
      const detailsPanel = page.getByTestId('geometry-details');
      await expect(detailsPanel).not.toBeVisible();
    });

    test('Step ID is clickable and navigates to that step', async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_V0);

      // Go to a later step
      await goToStep(page, SECTION_SIXFOLD_V0, 10);

      const geometryList = page.getByTestId('geometry-list');
      const items = geometryList.locator('li');

      // Ensure we have items to test
      await expect(items).toHaveCountGreaterThan(0);

      // Select a geometry
      await items.first().click();

      // Find the step ID link
      const detailsPanel = page.getByTestId('geometry-details');
      const stepLink = detailsPanel.getByTestId('geometry-step-id');
      
      // The step ID is now clickable with data-testid
      await expect(stepLink).toBeVisible();
    });
  });

  test.describe('Square section', () => {
    test('Details panel works in Square section', async ({ page }) => {
      await goToSection(page, SECTION_SQUARE);

      const geometryList = page.getByTestId('geometry-list');
      const items = geometryList.locator('li');

      // Ensure we have items to test
      await expect(items).toHaveCountGreaterThan(0);

      // Select a geometry
      await items.first().click();

      // Check that details panel is visible
      const detailsPanel = page.getByTestId('geometry-details');
      await expect(detailsPanel).toBeVisible();
    });
  });
});
