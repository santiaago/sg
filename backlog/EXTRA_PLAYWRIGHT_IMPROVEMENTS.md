# Playwright E2E Test Suite Improvements

**Status:** Draft - Pending Implementation  
**Related:** `EXTRA_PLAYWRIGHT.md` (original test plan)  
**Branch:** `vibe/playwright-e2e-e5ec22`  
**Date:** 2026-05-04  

---

## Overview

This document outlines **all improvements needed** for the Playwright E2E test suite added in branch `vibe/playwright-e2e-e5ec22`. The initial implementation (8 commits, ~3,500 lines) provides comprehensive coverage but has **critical issues** that must be addressed before merging to main.

**Current State:**
- 14 test files + 3 infrastructure files
- ~2,800 lines of test code
- Covers: initial load, theme, copy URL/SVG, geometry list/details, navigation, slider, button states, input highlighting, accessibility, workflows

**Target State:**
- All critical issues resolved
- Tests are stable, maintainable, and reliable
- Proper selector strategy (not CSS-class dependent)
- Full integration with CI pipeline

---

## Priority Legend

| Level | Description | Target Completion |
|-------|-------------|-------------------|
| **P0** | Critical - Must fix before merge | Before PR review |
| **P1** | High - Should fix before merge | Before PR review |
| **P2** | Medium - Nice to have | Next sprint |
| **P3** | Low - Future enhancement | Backlog |

---

## P0: Critical Fixes (Must Complete Before Merge)

These fixes address **test correctness and reliability issues** that could cause false passes, false negatives, or silent failures.

### 1. Replace `test.skip()` with Proper Waits

**Problem:** Tests use `test.skip()` when they can't find elements, which silently passes and hides real issues.

**Pattern to fix:**
```typescript
// BEFORE (BAD)
const itemText = await firstItem.textContent();
if (!itemText) {
  test.skip();
  return;
}

// AFTER (GOOD)
const itemText = await firstItem.textContent();
await expect(itemText).toBeTruthy(); // Fails explicitly if not found
```

**Files affected:** All `.spec.ts` files (appears dozens of times)  
**Effort:** 2 hours  
**Owner:** Test author  

---

### 2. Remove Silent Try/Catch Blocks

**Problem:** Try/catch blocks swallow failures for unimplemented features, causing tests to pass when they should fail or be skipped.

**Examples to fix:**
- `theme.spec.ts`: Theme persistence across reload
- `accessibility.spec.ts`: Skip to main content link
- `accessibility.spec.ts`: SVG aria labels

**Fix:** Use proper `test.skip()` with explanatory comments:
```typescript
// BEFORE (BAD)
try {
  await assertTheme(page, THEME.LIGHT);
} catch (error) {
  console.warn('Theme persistence not implemented');
}

// AFTER (GOOD)
test.skip('Theme persistence across reload not implemented in app yet');
```

**Files affected:** `theme.spec.ts`, `accessibility.spec.ts`  
**Effort:** 1 hour  
**Owner:** Test author  

---

### 3. Fix or Remove Tests for Unimplemented Features

**Problem:** Several tests document expected behavior that doesn't exist in the app yet.

| Test | File | Issue | Action |
|------|------|-------|--------|
| Theme stored in localStorage | `theme.spec.ts` | App uses React state only | `test.skip()` with comment |
| Theme persistence across reload | `theme.spec.ts` | Not implemented | `test.skip()` with comment |
| Skip to main content link exists | `accessibility.spec.ts` | Not implemented | `test.skip()` with comment |
| SVG elements have aria labels | `accessibility.spec.ts` | Not implemented | `test.skip()` with comment |
| Geometry items announce selection state | `accessibility.spec.ts` | Uses CSS classes only | `test.skip()` with comment |
| Step ID is clickable | `geometry-details.spec.ts` | Not clickable in app | `test.skip()` with comment |
| Copied URL includes step hash | `copy-url.spec.ts` | App only includes section hash | Update test expectation |

**Files affected:** `theme.spec.ts`, `accessibility.spec.ts`, `geometry-details.spec.ts`, `copy-url.spec.ts`  
**Effort:** 1 hour  
**Owner:** Test author  

---

### 4. Verify Workflow Dependencies

**Problem:** Workflow tests assume `<<` (Go to beginning) button clears geometry selection. Need to verify this behavior in the app.

**Action:**
1. Check app code: Does clicking `<<` clear the geometry store?
2. If yes: Tests are correct, no action needed
3. If no: Update workflow tests to explicitly deselect geometry before using `<<`

**Files affected:** `workflows.spec.ts`  
**Effort:** 1 hour (includes app code review)  
**Owner:** Test author + App dev  

---

## P1: Test Infrastructure Improvements (Should Complete Before Merge)

These improvements address **maintainability and stability** issues in the test codebase.

### 5. Split `utils.ts` into Logical Modules

**Problem:** `utils.ts` is 394 lines with mixed responsibilities (navigation, assertions, clipboard, console).

**Proposed structure:**
```
e2e/
├── utils/
│   ├── index.ts              # Re-exports all helpers
│   ├── navigation.ts         # goToSection, goToStep, clickFirstButton, etc.
│   ├── assertions.ts         # assertTheme, assertGeometrySelected, assertSVGValid
│   ├── clipboard.ts          # assertClipboardContains, getSVGContent
│   ├── console.ts            # getConsoleMessages (remove duplicate checkConsoleErrors)
│   └── helpers.ts            # waitForPageLoad, measureAction, isFocusable
└── ...
```

**Files affected:** `utils.ts` → `utils/` directory  
**Effort:** 2 hours  
**Owner:** Test author  

---

### 6. Remove Duplicate Console Capture Logic

**Problem:** `checkConsoleErrors` and `getConsoleMessages` both capture console output with nearly identical code.

**Fix:** Keep only `getConsoleMessages` (more complete, returns both errors and warnings) and update all call sites.

**Files affected:** `utils.ts`  
**Effort:** 0.5 hour  
**Owner:** Test author  

---

### 7. Fix `isFocusable` Utility Bug

**Problem:** Current implementation has incorrect `tabIndex` comparison:
```typescript
const isFocusable = el.tabIndex >= 0; // tabIndex is string, not number
```

**Fix:**
```typescript
export async function isFocusable(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => {
    const tabIndex = parseInt(el.getAttribute('tabindex') || '0', 10);
    const isNativeFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    return (tabIndex >= 0 && !el.hasAttribute('disabled')) || isNativeFocusable;
  });
}
```

**Files affected:** `utils.ts`  
**Effort:** 0.5 hour  
**Owner:** Test author  

---

### 8. Review and Remove Unnecessary `.serial` Modifiers

**Problem:** `workflows.spec.ts` uses `test.describe.serial` for all workflows, which forces sequential execution and slows down the suite.

**Fix:** Only use `.serial` where tests truly share mutable state. Most workflows appear independent.

**Guideline:**
- Use `.serial` when: Tests modify global state that can't be reset between tests
- Don't use `.serial` when: Tests can run in any order (each test resets its own state)

**Files affected:** `workflows.spec.ts`  
**Effort:** 0.5 hour  
**Owner:** Test author  

---

### 9. Improve `waitForPageLoad` Helper

**Problem:** Current implementation uses `networkidle` + arbitrary 500ms delay, which can be flaky.

**Fix:**
```typescript
export async function waitForPageLoad(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout });
  // Wait for React hydration (adjust based on app behavior)
  await page.waitForFunction(() => window.ReactHydrated, { timeout: 3000 }).catch(() => {});
}
```

**Files affected:** `utils.ts`  
**Effort:** 0.5 hour  
**Owner:** Test author  

---

## P1: Selector Stability (Requires App Changes)

These changes make tests **resilient to UI changes** by using stable, semantic selectors.

### 10. Add `data-testid` Attributes to App

**Problem:** Tests rely on CSS classes (`text-orange-400`, `text-(red|yellow)-400`) which break if theme changes.

**App changes needed:**

| Component | Element | Attribute | Example |
|-----------|---------|-----------|---------|
| GeometryList | Geometry item | `data-testid` | `data-testid="geometry-item-{name}"` |
| GeometryList | Geometry item | `aria-selected` | `aria-selected="true"` when selected |
| Navigation | Section buttons | `data-testid` | `data-testid="nav-square"` |
| Navigation | Theme toggle | `data-testid` | `data-testid="theme-toggle"` |
| Navigation | Copy URL button | `data-testid` | `data-testid="copy-url-btn"` |
| Navigation | Copy SVG button | `data-testid` | `data-testid="copy-svg-btn"` |
| StepControls | Next button | `data-testid` | `data-testid="step-next"` |
| StepControls | Prev button | `data-testid` | `data-testid="step-prev"` |
| StepControls | First (<<) button | `data-testid` | `data-testid="step-first"` |
| StepControls | Last (>>) button | `data-testid` | `data-testid="step-last"` |
| SVG | SVG element | `data-testid` | `data-testid="square-svg"`, `data-testid="sixfoldv0-svg"` |

**Files affected (app):**
- `app2/src/components/GeometryList.tsx`
- `app2/src/components/Navigation.tsx` (or equivalent)
- `app2/src/components/StepControls.tsx` (or equivalent)
- `app2/src/components/SvgViewer.tsx` (or equivalent)

**Files affected (tests):** All `.spec.ts` files  
**Effort:** 2-3 hours (app) + 2 hours (tests)  
**Owner:** App dev + Test author  

---

### 11. Update Tests to Use `data-testid`

**After app changes are merged**, update all tests to use `data-testid` instead of:
- CSS classes (`text-orange-400`, `bg-blue-600`)
- Text content matching (`getByText('SixFold v0')`)
- Complex selectors (`locator('li').filter({ hasText: /text-(red|yellow)-400/ })`)

**Example:**
```typescript
// BEFORE
await page.locator('.geometry-list li').first().click();
await expect(page.locator('.geometry-list li').first()).toHaveClass(/text-(red|yellow)-400/);

// AFTER
await page.getByTestId('geometry-item-line1').click();
await expect(page.getByTestId('geometry-item-line1')).toHaveAttribute('aria-selected', 'true');
```

**Files affected:** All `.spec.ts` files  
**Effort:** 3-4 hours  
**Owner:** Test author  
**Depends on:** #10 (app changes)  

---

### 12. Update Input Highlighting Tests

**Problem:** Tests rely on `text-orange-400` class to detect highlighted dependencies.

**Fix:** After app changes, use `data-testid` with a `data-highlighted` attribute:
```typescript
// App: Add to dependency items
data-highlighted={isDependency && inputsHighlighted ? 'true' : 'false'}

// Test: Check for highlighted state
const highlightedItems = page.locator('[data-highlighted="true"]');
await expect(highlightedItems).toHaveCount(3);
```

**Files affected:** `input-highlighting.spec.ts` + app component  
**Effort:** 1 hour  
**Owner:** Test author + App dev  
**Depends on:** #10 (app changes)  

---

## P2: Test Quality Improvements

These improvements enhance **test reliability, performance, and coverage**.

### 13. Add Retries Configuration

**Problem:** Flaky tests (especially clipboard tests) may fail intermittently.

**Fix:** Add to `playwright.config.ts`:
```typescript
export default defineConfig({
  retries: 2, // Retry failed tests twice
  workers: process.env.CI ? 1 : undefined,
});
```

**Files affected:** `app2/playwright.config.ts`  
**Effort:** 0.5 hour  
**Owner:** Test author  

---

### 14. Replace Arbitrary `waitForTimeout` Calls

**Problem:** ~50 instances of `await page.waitForTimeout(N)` with arbitrary delays (100ms, 500ms, etc.).

**Fix:** Replace with proper Playwright waits:
```typescript
// BEFORE (BAD)
await page.waitForTimeout(100);
await page.waitForTimeout(500);

// AFTER (GOOD)
await expect(element).toBeVisible();
await page.waitForSelector('.geometry-list li', { state: 'attached' });
await page.waitForLoadState('networkidle');
```

**Files affected:** All `.spec.ts` files  
**Effort:** 2 hours  
**Owner:** Test author  

---

### 15. Reduce Long Click Loops

**Problem:** Tests click next/prev buttons in loops (10+ iterations), which is slow and flaky.

**Fix:** Use `goToStep()` helper or direct navigation:
```typescript
// BEFORE (BAD)
for (let i = 0; i < 9; i++) {
  await page.locator('#square').getByRole('button', { name: 'next' }).click();
}

// AFTER (GOOD)
await goToStep(page, SECTION_SQUARE, 10);
```

**Files affected:** `navigation.spec.ts`, `workflows.spec.ts`  
**Effort:** 1 hour  
**Owner:** Test author  

---

### 16. Add Error Scenario Tests

**Problem:** No coverage for error handling (invalid URLs, network failures, etc.).

**New file:** `e2e/error-handling.spec.ts`

**Tests to add:**
```typescript
- [ ] Loading invalid hash (/#invalid) shows default section
- [ ] Loading non-existent step doesn't break UI
- [ ] Copy URL with no clipboard permission shows error feedback
- [ ] Network failure during step navigation shows error
- [ ] Console errors are caught and displayed (if applicable)
```

**Files affected:** New file  
**Effort:** 2 hours  
**Owner:** Test author  

---

### 17. Integrate Axe-Core for Accessibility

**Problem:** Current accessibility tests are superficial (check for aria-labels existence only).

**Fix:** Use `@playwright/test`'s built-in accessibility snapshot testing or integrate axe-core:

**Option A (Recommended):** Use Playwright's built-in A11y snapshots
```typescript
import { test, expect } from '@playwright/test';

test('Navigation bar is accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('nav-a11y.png'); // With accessibility annotations
});
```

**Option B:** Integrate axe-core
```typescript
import AxeBuilder from '@axe-core/playwright';

test('No accessibility violations on home page', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Files affected:** `accessibility.spec.ts`, `package.json` (add dependency)  
**Effort:** 2 hours  
**Owner:** Test author  

---

## P2: App Feature Implementation

These are **app changes** needed to make some tests valid or to improve testability.

### 19. Implement Theme Persistence

**Problem:** Theme is stored in React state only, not persisted across reloads.

**App change:**
```typescript
// In theme hook or context
useEffect(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme as Theme);
  }
}, []);

useEffect(() => {
  localStorage.setItem('theme', theme);
}, [theme]);
```

**Test change:** Remove `test.skip()` from theme persistence tests.

**Files affected (app):** Theme management code  
**Files affected (tests):** `theme.spec.ts`  
**Effort:** 2 hours  
**Owner:** App dev  

---

### 20. Add Skip to Main Content Link

**Problem:** Accessibility best practice missing.

**App change:**
```typescript
// In layout component
<a href="#main" className="skip-link">Skip to main content</a>
<div id="main">...
```

**Test change:** Remove `test.skip()` from skip link test.

**Files affected (app):** Layout component  
**Files affected (tests):** `accessibility.spec.ts`  
**Effort:** 1 hour  
**Owner:** App dev  

---

### 21. Add SVG Aria Labels

**Problem:** SVG elements lack accessibility attributes.

**App change:**
```typescript
<svg 
  data-testid="square-svg"
  aria-label="Square geometric construction, step 1 of 16"
  role="img"
>
```

**Test change:** Remove `test.skip()` from SVG aria label tests.

**Files affected (app):** SVG component  
**Files affected (tests):** `accessibility.spec.ts`  
**Effort:** 2 hours  
**Owner:** App dev  

---

### 22. Add Step to URL Hash

**Problem:** URL only contains section hash, not step number.

**App change:** Update navigation to include step:
```typescript
// On step change
const newHash = `${section}/step-${step}`;
window.location.hash = newHash;

// On load
const [section, stepPart] = window.location.hash.substring(1).split('/');
const step = stepPart?.replace('step-', '') || '1';
```

**Test change:** Update `copy-url.spec.ts` to expect step in URL.

**Files affected (app):** Navigation/routing code  
**Files affected (tests):** `copy-url.spec.ts`, `navigation.spec.ts`  
**Effort:** 2 hours  
**Owner:** App dev  

---

### 23. Make Step ID Clickable

**Problem:** Step ID in details panel is not clickable.

**App change:**
```typescript
// In GeometryDetails component
<span 
  onClick={() => goToStep(stepId)}
  style={{ cursor: 'pointer', textDecoration: 'underline' }}
>
  {stepId}
</span>
```

**Test change:** Remove `test.skip()` from step ID click test.

**Files affected (app):** GeometryDetails component  
**Files affected (tests):** `geometry-details.spec.ts`  
**Effort:** 1 hour  
**Owner:** App dev  

---

## Implementation Timeline

### Week 1: Critical & Infrastructure (Merge Blockers)

| Day | Tasks | Owner | Status |
|-----|-------|-------|--------|
| 1 | P0: Fix test.skip() patterns (Task 1) | Test author | ⬜ |
| 1 | P0: Remove silent try/catch (Task 2) | Test author | ⬜ |
| 1 | P0: Fix/remove unimplemented feature tests (Task 3) | Test author | ⬜ |
| 2 | P0: Verify workflow dependencies (Task 4) | Test author + App dev | ⬜ |
| 2 | P1: Split utils.ts (Task 5) | Test author | ⬜ |
| 2 | P1: Remove duplicate console capture (Task 6) | Test author | ⬜ |
| 3 | P1: Fix isFocusable (Task 7) | Test author | ⬜ |
| 3 | P1: Remove unnecessary .serial (Task 8) | Test author | ⬜ |
| 3 | P1: Improve waitForPageLoad (Task 9) | Test author | ⬜ |

### Week 2: Selector Stability & Quality

| Day | Tasks | Owner | Status |
|-----|-------|-------|--------|
| 4 | P1: Add data-testid to app (Task 10) | App dev | ⬜ |
| 4 | P1: Update tests for data-testid (Task 11) | Test author | ⬜ |
| 4 | P1: Update input highlighting (Task 12) | Test author + App dev | ⬜ |
| 5 | P2: Add retries config (Task 13) | Test author | ⬜ |
| 5 | P2: Replace waitForTimeout (Task 14) | Test author | ⬜ |
| 5 | P2: Reduce click loops (Task 15) | Test author | ⬜ |
| 6 | P2: Add error scenario tests (Task 16) | Test author | ⬜ |

### Week 3: App Features & Finalization

| Day | Tasks | Owner | Status |
|-----|-------|-------|--------|
| 7 | P2: Integrate axe-core (Task 17) | Test author | ⬜ |
| 7 | P2: Theme persistence (Task 18) | App dev | ⬜ |
| 8 | P2: Skip link (Task 19) | App dev | ⬜ |
| 8 | P2: SVG aria labels (Task 20) | App dev | ⬜ |
| 9 | P2: Step in URL hash (Task 21) | App dev | ⬜ |
| 9 | P2: Clickable step ID (Task 22) | App dev | ⬜ |

---

## Acceptance Criteria

### For Merge (P0 + P1 Complete)

- [ ] No `test.skip()` without proper justification (comment explaining why)
- [ ] No silent try/catch failures
- [ ] All unimplemented feature tests are properly skipped or removed
- [ ] Workflow dependencies verified and tests updated
- [ ] `utils.ts` split into logical modules
- [ ] Duplicate console capture logic removed
- [ ] `isFocusable` utility fixed
- [ ] Unnecessary `.serial` modifiers removed
- [ ] `waitForPageLoad` improved
- [ ] All P0 and P1 tests pass in CI

### For Production (All Tasks Complete)

- [ ] Tests use `data-testid` instead of CSS classes
- [ ] Retries configured in playwright.config
- [ ] No arbitrary `waitForTimeout` calls
- [ ] Accessibility tests use axe-core or equivalent
- [ ] Error scenario tests added
- [ ] Mobile viewport tests added
- [ ] All app features implemented (theme persistence, skip link, etc.)
- [ ] All tests pass in CI

---

## File Changes Summary

| Category | Files Added | Files Modified | Files Deleted | Lines Changed |
|----------|-------------|----------------|---------------|---------------|
| P0 Fixes | 0 | 8-10 | 0 | ~200 |
| P1 Infrastructure | 4-5 | 1 | 0 | ~500 |
| P1 Selectors | 0 | 14 | 0 | ~800 |
| P2 Quality | 1 | 14 | 0 | ~400 |
| P2 App Features | 0 | 5-6 | 0 | ~500 |
| **Total** | **5-6** | **40-45** | **0** | **~2,400** |

---

## Quick Start Commands

```bash
# Run all E2E tests
cd app2 && pnpm test:e2e

# Run with headed browser for debugging
cd app2 && pnpm test:e2e:headed

# Run specific test file
cd app2 && pnpm test:e2e initial-load.spec.ts

# Run with UI mode (for debugging)
cd app2 && pnpm exec playwright test --ui

# Run only P0 tests
cd app2 && pnpm test:e2e --grep "Initial Page Load"

# Check for test.skip() patterns
grep -r "test.skip()" app2/e2e/

# Check for try/catch in tests
grep -r "try {" app2/e2e/*.spec.ts
```

---

## Related Documents

- [`EXTRA_PLAYWRIGHT.md`](EXTRA_PLAYWRIGHT.md) - Original test plan
- [`app2/e2e/`](../app2/e2e/) - Current test implementation
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-04 | Vibe Agent | Initial improvement plan created |
