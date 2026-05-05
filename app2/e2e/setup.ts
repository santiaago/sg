import { test } from "@playwright/test";

// Global test setup for Playwright E2E tests
// This file is auto-loaded by Playwright when placed in the e2e/ directory

test.afterEach(async ({ page }) => {
  // Clean up after each test
  await page.close();
});
