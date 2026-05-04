import { test, expect } from "@playwright/test";
import { SECTION_SIXFOLD_V0, SECTION_SQUARE, THEME, SVG_CONFIG } from "./fixtures";
import { goToSection, getCurrentStep } from "./utils/navigation";
import { assertTheme } from "./utils/assertions";
import { waitForPageLoad } from "./utils/helpers";
import { getConsoleMessages } from "./utils/console";

/**
 * P0 - Initial Page Load Tests
 * Prerequisite for all other tests
 * Tests verify that the page loads correctly without errors or warnings
 */

test.describe("Initial Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test("Page loads without console errors", async ({ page }) => {
    const { errors } = await getConsoleMessages(page);
    expect(errors).toHaveLength(0);
  });

  test("Page loads without console warnings", async ({ page }) => {
    const { warnings } = await getConsoleMessages(page);
    // Note: Some warnings may be expected in development mode
    // This test can be adjusted based on actual app behavior
    expect(warnings).toHaveLength(0);
  });

  test("Page loads without unhandled promise rejections", async ({ page }) => {
    // Listen for unhandled promise rejections
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Wait for any async errors by waiting for network idle
    await page.waitForLoadState("networkidle", { timeout: 5000 });
    expect(errors).toHaveLength(0);
  });

  test("Defaults to first section in navigation order", async ({ page }) => {
    // The first section should be visible
    await expect(page.locator("#sixfold-v0")).toBeVisible();
  });

  test("First section starts at step 0 (initial state)", async ({ page }) => {
    const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_V0);
    // The app starts at step 0, not step 1
    expect(currentStep).toBe(0);
  });

  test("SixFold v0 section is the active section initially", async ({ page }) => {
    // The default section is sixfold-v0
    await expect(page.locator("#sixfold-v0")).toBeVisible();
    // Square section exists in DOM but may or may not be visible depending on viewport
    // Instead, check that SixFold v0 is the active section
    const sixfoldNav = page.getByTestId("nav-sixfold-v0");
    const classList = await sixfoldNav.getAttribute("class");
    expect(classList).toContain("bg-blue-600");
  });

  test("Theme is dark by default", async ({ page }) => {
    await assertTheme(page, THEME.DARK);
  });

  test("Navigation bar is visible and interactive", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // Check navigation buttons exist
    await expect(page.getByTestId("nav-sixfold-v0")).toBeVisible();
    await expect(page.getByTestId("nav-square")).toBeVisible();

    // Check theme toggle exists
    await expect(page.getByTestId("theme-toggle")).toBeVisible();
  });

  test("SixFold v0 SVG has correct dimensions", async ({ page }) => {
    const svg = page.getByTestId("sixfoldv0-svg");
    await expect(svg).toBeVisible();

    const width = await svg.getAttribute("width");
    const height = await svg.getAttribute("height");

    // SVG should have width and height attributes
    expect(width).toBeTruthy();
    expect(height).toBeTruthy();

    // Check viewBox
    const viewBox = await svg.getAttribute("viewBox");
    expect(viewBox).toContain(SVG_CONFIG.VIEWBOX.split(" ")[0]);
  });

  test("Square SVG has correct dimensions", async ({ page }) => {
    await goToSection(page, SECTION_SQUARE);

    const svg = page.getByTestId("square-svg");
    await expect(svg).toBeVisible();

    const width = await svg.getAttribute("width");
    const height = await svg.getAttribute("height");

    expect(width).toBeTruthy();
    expect(height).toBeTruthy();
  });

  test("Geometry List is visible for current section", async ({ page }) => {
    const geometryList = page.locator(".geometry-list").first();
    await expect(geometryList).toBeVisible();

    // Note: At step 0, the geometry list may be empty (no items drawn yet)
    // This test just verifies the list component is visible
  });

  test("Geometry Details panel is empty initially", async ({ page }) => {
    // At step 1 with no geometry selected, details panel should be empty
    // Details should not be visible when nothing is selected
    const detailsHeader = page.getByText("Details");
    await expect(detailsHeader).not.toBeVisible();
  });

  test("Page title is correct", async ({ page }) => {
    // The page title is "React Geometric Patterns"
    await expect(page).toHaveTitle(/React Geometric Patterns/);
  });

  test("Main heading is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "sg" })).toBeVisible();
  });

  test("URL hash is empty on initial load", async ({ page }) => {
    const hash = page.url().split("#")[1];
    expect(hash).toBeUndefined();
  });
});
