import { test, expect } from "@playwright/test";
import { SECTION_SQUARE_DSL, SECTION_SIXFOLD_DSL_V1 } from "./fixtures";
import { goToSection, getCurrentStep } from "./utils/navigation";
import { waitForPageLoad } from "./utils/helpers";

/**
 * Slider Navigation Tests
 * Priority: Medium
 */

test.describe("Slider Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);
  });

  test.describe("Square DSL", () => {
    test("Slider exists for Square DSL section", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');
      await expect(slider).toBeVisible();
    });

    test("Slider min = 0, max = total steps for Square DSL", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');

      const min = await slider.getAttribute("min");
      const max = await slider.getAttribute("max");

      // App uses 0-based indexing for steps
      expect(min).toBe("0");
      // Square DSL has 19 steps (0-18)
      expect(max).toBe("18");
    });

    test("Slider value matches current step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');
      const currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);

      const value = await slider.getAttribute("value");
      expect(parseInt(value || "0", 10)).toBe(currentStep);
    });

    test("Dragging slider updates current step", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');
      const section = page.locator("#square-dsl");

      // Click at the 27.78% position (5/18) of the slider to go to step 5
      const box = await slider.boundingBox();
      if (!box) throw new Error("Slider not found");
      const x = box.x + box.width * (5 / 18);
      const y = box.y + box.height / 2;
      await page.mouse.click(x, y);

      // Wait for React state to update and step to change
      await expect(section.getByText(/Current step 5\/\d+/)).toBeVisible({ timeout: 5000 });

      const currentStep = await getCurrentStep(page, SECTION_SQUARE_DSL);
      expect(currentStep).toBe(5);
    });

    test("Slider thumb position matches step percentage", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');

      // Go to step 9 (50% of 18 steps, starting from step 0)
      for (let i = 0; i < 9; i++) {
        await page.locator("#square-dsl").getByTestId("step-next").click();
      }

      // Check slider value
      const value = await slider.getAttribute("value");
      expect(value).toBe("9");
    });

    test("Slider step labels show 0 and max", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const labels = page.locator("#square-dsl .text-xs.text-gray-400 span");
      const count = await labels.count();

      expect(count).toBe(2);

      const firstLabel = labels.first();
      const lastLabel = labels.last();

      await expect(firstLabel).toHaveText("0");
      await expect(lastLabel).toHaveText("18");
    });

    test("Slider is keyboard accessible (arrow keys change value)", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');
      const section = page.locator("#square-dsl");
      await slider.focus();

      // Get initial value
      let initialValue = await slider.getAttribute("value");
      const initialStep = parseInt(initialValue || "0", 10);

      // Press right arrow to increase
      await page.keyboard.press("ArrowRight");

      // Wait for React state to update - the step should have increased
      // After pressing ArrowRight, step should be initialStep + 1
      await expect(
        section.getByText(new RegExp(`Current step ${initialStep + 1}\\/\\d+`)),
      ).toBeVisible({ timeout: 5000 });

      const value = await slider.getAttribute("value");
      expect(parseInt(value || "0", 10)).toBeGreaterThan(initialStep);
    });
  });

  test.describe("SixFold DSL v1", () => {
    test("Slider exists for SixFold DSL v1 section", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const slider = page.locator('#sixfold-dsl-v1 input[type="range"]');
      await expect(slider).toBeVisible();
    });

    test("Slider min = 0, max = total steps for SixFold DSL v1", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const slider = page.locator('#sixfold-dsl-v1 input[type="range"]');

      const min = await slider.getAttribute("min");
      const max = await slider.getAttribute("max");

      // App uses 0-based indexing for steps
      expect(min).toBe("0");
      // SixFold DSL v1 has 97 steps (0-96)
      expect(max).toBe("96");
    });

    test("Slider value matches current step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const slider = page.locator('#sixfold-dsl-v1 input[type="range"]');
      const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);

      const value = await slider.getAttribute("value");
      expect(parseInt(value || "0", 10)).toBe(currentStep);
    });

    test("Dragging slider updates current step", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const slider = page.locator('#sixfold-dsl-v1 input[type="range"]');
      const section = page.locator("#sixfold-dsl-v1");

      // Click at the position (45/96) of the slider to go to step 45
      const box = await slider.boundingBox();
      if (!box) throw new Error("Slider not found");
      const x = box.x + box.width * (45 / 96);
      const y = box.y + box.height / 2;
      await page.mouse.click(x, y);

      // Wait for React state to update and step to change
      await expect(section.getByText(/Current step 45\/\d+/)).toBeVisible({ timeout: 5000 });

      const currentStep = await getCurrentStep(page, SECTION_SIXFOLD_DSL_V1);
      expect(currentStep).toBe(45);
    });

    test("Slider thumb position matches step percentage", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const slider = page.locator('#sixfold-dsl-v1 input[type="range"]');

      // Go to step 46 (roughly 50% of 93 steps, starting from step 0)
      for (let i = 0; i < 46; i++) {
        await page.locator("#sixfold-dsl-v1").getByTestId("step-next").click();
      }

      // Check slider value
      const value = await slider.getAttribute("value");
      expect(value).toBe("46");
    });

    test("Slider step labels show 0 and max", async ({ page }) => {
      await goToSection(page, SECTION_SIXFOLD_DSL_V1);

      const labels = page.locator("#sixfold-dsl-v1 .text-xs.text-gray-400 span");
      const count = await labels.count();

      expect(count).toBe(2);

      const firstLabel = labels.first();
      const lastLabel = labels.last();

      // App uses 0-based indexing, so first label is 0
      await expect(firstLabel).toHaveText("0");
      await expect(lastLabel).toHaveText("96");
    });
  });

  test.describe("Edge cases", () => {
    test("Slider updates when clicking next/prev buttons", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');

      // Click next (from step 0 to step 1)
      await page.locator("#square-dsl").getByTestId("step-next").click();

      // Check slider value updated
      const value = await slider.getAttribute("value");
      expect(value).toBe("1");

      // Click prev (from step 1 to step 0)
      await page.locator("#square-dsl").getByTestId("step-prev").click();

      const valueAfterPrev = await slider.getAttribute("value");
      expect(valueAfterPrev).toBe("0");
    });

    test("Slider updates when clicking first/last buttons", async ({ page }) => {
      await goToSection(page, SECTION_SQUARE_DSL);

      const slider = page.locator('#square-dsl input[type="range"]');

      // Go to step 5 (from step 0, click next 5 times)
      for (let i = 0; i < 5; i++) {
        await page.locator("#square-dsl").getByTestId("step-next").click();
      }

      // Click first (<<) - goes to step 0
      await page.locator("#square-dsl").getByTestId("step-first").click();

      const valueAfterFirst = await slider.getAttribute("value");
      expect(valueAfterFirst).toBe("0");

      // Click last (>>) - goes to step 19 (end of Square DSL)
      await page.locator("#square-dsl").getByTestId("step-last").click();

      const valueAfterLast = await slider.getAttribute("value");
      expect(valueAfterLast).toBe("19");
    });
  });
});
